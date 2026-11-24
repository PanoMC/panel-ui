/**
 * Big uploads with live numbers: bytes sent of the total, percent, speed (moving average of the
 * last few seconds), time left, and a way to cancel. Pano streams the bytes straight to the node,
 * so the request is a plain multipart XHR; `ApiUtil` only reports a fraction and cannot abort, so
 * the request is built here with the same URL rules and CSRF header.
 */
import { get } from 'svelte/store';

import ApiUtil, { DISABLED_FOR_DEMO, resolveApiUrl } from '$lib/api.util.js';
import { API_URL, CSRF_HEADER } from '$lib/variables.js';
import { page } from '@panomc/sdk/core/js/appStores.js';
import { show as showToast } from '$lib/components/ToastContainer.svelte';
import { createUploadMeter } from '$lib/upload-meter.util.js';

/** Error code of an upload the admin cancelled. */
export const UPLOAD_CANCELLED = 'UPLOAD_CANCELLED';

/** Error code of a request that never got an answer. */
export const NETWORK_ERROR = 'NETWORK_ERROR';

export {
  createUploadMeter,
  UPLOAD_ETA_WARMUP_MS,
  UPLOAD_SPEED_WINDOW_MS,
} from '$lib/upload-meter.util.js';

/** @typedef {import('$lib/upload-meter.util.js').UploadStats} UploadStats */

/** @param {any} [request] */
async function csrfToken(request) {
  const session = get(page)?.data?.session;

  if (session?.csrfToken) {
    return session.csrfToken;
  }

  const body = await ApiUtil.get({ path: '/auth/csrf', request }).catch(() => null);

  return typeof body?.csrfToken === 'string' && body.csrfToken ? body.csrfToken : null;
}

/**
 * Sends a multipart body and reports its progress.
 *
 * The promise never rejects: it resolves with the parsed response body, `{ error: { code:
 * 'UPLOAD_CANCELLED' } }` after {@link abort}, or `{ error: { code: 'NETWORK_ERROR' } }` when the
 * connection broke (the server may cut it mid-upload, e.g. when the node's disk filled up: ask
 * `GET /panel/transfers/failures/<uploadId>` why).
 *
 * @param {{
 *   path: string,
 *   body: FormData,
 *   method?: 'POST' | 'PUT',
 *   size?: number,
 *   onprogress?: (stats: UploadStats) => void,
 * }} options `path` is relative to `/api/v1` like `ApiUtil`; `size` is the file size, used until
 *   the browser reports the real total.
 * @returns {{ promise: Promise<any>, abort: () => void }}
 */
export function sendUpload({ path, body, method = 'POST', size = 0, onprogress = () => {} }) {
  /** @type {XMLHttpRequest | null} */
  let xhr = null;
  let cancelled = false;

  const promise = (async () => {
    const token = await csrfToken();

    if (cancelled) {
      return { error: { code: UPLOAD_CANCELLED } };
    }

    const url = resolveApiUrl(path, {
      apiUrl: API_URL,
      browser: true,
      prod: !!import.meta.env.PROD,
    });

    const meter = createUploadMeter(size);

    onprogress(meter.update(0));

    return new Promise((resolve) => {
      const request = new XMLHttpRequest();

      xhr = request;
      request.open(method, url);
      request.withCredentials = true;
      request.setRequestHeader('Accept', 'application/json');

      if (token) {
        request.setRequestHeader(CSRF_HEADER, token);
      }

      request.upload.onprogress = (event) => {
        onprogress(meter.update(event.loaded, event.lengthComputable ? event.total : null));
      };

      request.upload.onload = () => {
        onprogress(meter.update(Number.MAX_SAFE_INTEGER));
      };

      request.onload = async () => {
        let parsed;

        try {
          parsed = JSON.parse(request.responseText);
        } catch {
          parsed = request.responseText
            ? { error: { code: request.status >= 400 ? `HTTP_${request.status}` : 'BAD_RESPONSE' } }
            : request.status >= 400
              ? { error: { code: `HTTP_${request.status}` } }
              : {};
        }

        if (parsed?.error?.code === DISABLED_FOR_DEMO) {
          await showToast('components.toasts.demo-mode-restricted');
        }

        resolve(parsed);
      };

      request.onerror = () => resolve({ error: { code: NETWORK_ERROR } });
      request.ontimeout = () => resolve({ error: { code: NETWORK_ERROR } });
      request.onabort = () => resolve({ error: { code: UPLOAD_CANCELLED } });

      request.send(body);
    });
  })();

  return {
    promise,
    abort() {
      cancelled = true;
      xhr?.abort();
    },
  };
}

/** A fresh id for one upload, sent as `uploadId` so a failed one can be asked about. */
export function newUploadId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
