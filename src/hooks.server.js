import { base } from '$app/paths';
import {
  COOKIE_PREFIX,
  JWT_COOKIE_NAME,
  CSRF_TOKEN_COOKIE_NAME,
  updateApiUrl,
  API_URL,
  updatePanoWebsiteUrl,
  updatePanoWebsiteApiUrl,
} from '$lib/variables';

import ApiUtil, { networkErrorBody } from '$lib/api.util.js';

async function fetchBasicData(token, csrfToken) {
  return ApiUtil.get({ path: '/api/panel/basicData', token, csrfToken }).catch(
    () => networkErrorBody,
  );
}

function stripModulePreload(linkHeader) {
  const parts = linkHeader
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const kept = parts.filter((p) => !/;\s*rel="?modulepreload"?/i.test(p));

  return kept.length ? kept.join(', ') : null;
}

const isDev = process.env.NODE_ENV === 'development';
// Cache buster to prevent stale browser cache when switching themes.
// Each process start generates a new value, forcing fresh file downloads.
const v = isDev ? '' : `?v=${Date.now()}`;
const IMPORT_MAP = `
  <script type="importmap" crossorigin="anonymous">
  {
    "imports": {
      "svelte": "${base}${isDev ? '/@id/svelte' : `/lib/svelte/index.js${v}`}",
      "svelte/animate": "${base}${isDev ? '/@id/svelte/animate' : `/lib/svelte/animate.js${v}`}",
      "svelte/easing": "${base}${isDev ? '/@id/svelte/easing' : `/lib/svelte/easing.js${v}`}",
      "svelte/motion": "${base}${isDev ? '/@id/svelte/motion' : `/lib/svelte/motion.js${v}`}",
      "svelte/store": "${base}${isDev ? '/@id/svelte/store' : `/lib/svelte/store.js${v}`}",
      "svelte/transition": "${base}${isDev ? '/@id/svelte/transition' : `/lib/svelte/transition.js${v}`}",
      "svelte/internal": "${base}${isDev ? '/@id/svelte/internal' : `/lib/svelte/internal.js${v}`}",
      "svelte/internal/client": "${base}${isDev ? '/@id/svelte/internal/client' : `/lib/svelte/internal-client.js${v}`}",
      "svelte/internal/disclose-version": "${base}${isDev ? '/@id/svelte/internal/disclose-version' : `/lib/svelte/internal-disclose-version.js${v}`}",
      "svelte/internal/flags/legacy": "${base}${isDev ? '/@id/svelte/internal/flags/legacy' : `/lib/svelte/internal-flags-legacy.js${v}`}",
      "svelte/internal/flags/async": "${base}${isDev ? '/@id/svelte/internal/flags/async' : `/lib/svelte/internal-flags-async.js${v}`}",
      "svelte/internal/flags/tracing": "${base}${isDev ? '/@id/svelte/internal/flags/tracing' : `/lib/svelte/internal-flags-tracing.js${v}`}",
      "svelte/internal/server": "${base}${isDev ? '/@id/svelte/internal/server' : `/lib/svelte/internal-server.js${v}`}",
      "svelte/legacy": "${base}${isDev ? '/@id/svelte/legacy' : `/lib/svelte/legacy.js${v}`}",
      "svelte/events": "${base}${isDev ? '/@id/svelte/events' : `/lib/svelte/events.js${v}`}",
      "svelte-i18n": "${base}${isDev ? '/@id/svelte-i18n' : `/lib/svelte/i18n.js${v}`}",
      "@panomc/sdk": "${base}/lib/sdk/index.js${v}",
      "@panomc/sdk/components/theme": "${base}/lib/sdk/components-theme.js${v}",
      "@panomc/sdk/components/panel": "${base}/lib/sdk/components-panel.js${v}",
      "@panomc/sdk/toasts": "${base}/lib/sdk/toasts.js${v}",
      "@panomc/sdk/utils/api": "${base}/lib/sdk/utils-api.js${v}",
      "@panomc/sdk/utils/auth": "${base}/lib/sdk/utils-auth.js${v}",
      "@panomc/sdk/utils/tooltip": "${base}/lib/sdk/utils-tooltip.js${v}",
      "@panomc/sdk/utils/language": "${base}/lib/sdk/utils-language.js${v}",
      "@panomc/sdk/utils/component": "${base}/lib/sdk/utils-component.js${v}",
      "@panomc/sdk/utils/text": "${base}/lib/sdk/utils-text.js${v}",
      "@panomc/sdk/variables": "${base}/lib/sdk/variables.js${v}",
      "@panomc/sdk/svelte": "${base}/lib/sdk/svelte.js${v}",
      "@panomc/sdk/internal": "${base}/lib/sdk/internal.js${v}"
    }
  }
  </script>
  <script defer src="${base}/lib/bootstrap/bootstrap.bundle.min.js${v}"></script>`;
const PLACEHOLDER = '%pano_lib_import%';
const PLACEHOLDER_LEN = PLACEHOLDER.length;

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { cookies } = event;
  const locals = event.locals;

  // noinspection JSUnresolvedReference
  const apiUrlEnv = process.env.API_URL;

  // noinspection JSUnresolvedReference
  const panoWebsiteUrlEnv = process.env.PANO_WEBSITE_URL;

  // noinspection JSUnresolvedReference
  const panoWebsiteApiUrlEnv = process.env.PANO_WEBSITE_API_URL;

  if (apiUrlEnv) {
    updateApiUrl(apiUrlEnv);
    locals.apiUrlEnv = apiUrlEnv;
  }

  if (panoWebsiteUrlEnv) {
    updatePanoWebsiteUrl(panoWebsiteUrlEnv);
    locals.panoWebsiteUrlEnv = panoWebsiteUrlEnv;
  }

  if (panoWebsiteApiUrlEnv) {
    updatePanoWebsiteApiUrl(panoWebsiteApiUrlEnv);
    locals.panoWebsiteApiUrlEnv = panoWebsiteApiUrlEnv;
  }

  const jwt = cookies.get(COOKIE_PREFIX + JWT_COOKIE_NAME);
  const csrfToken = cookies.get(COOKIE_PREFIX + CSRF_TOKEN_COOKIE_NAME);
  locals.basicData = await fetchBasicData(jwt, csrfToken);
  locals.jwt = jwt;
  locals.csrfToken = csrfToken;

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      const index = html.indexOf(PLACEHOLDER);
      if (index === -1) return html;
      return html.substring(0, index) + IMPORT_MAP + html.substring(index + PLACEHOLDER_LEN);
    },
  });

  const ct = response.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    const link = response.headers.get('link');
    if (link) {
      const filtered = stripModulePreload(link);
      if (filtered) response.headers.set('link', filtered);
      else response.headers.delete('link');
    }
  }

  return response;
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, event }) {
  console.log('!!! [GLOBAL ERROR EVENT]:', event.url.href);
  console.error('!!! [GLOBAL ERROR CONTENT]:', error);
  return {
    message: 'Internal Error',
    code: error?.code,
  };
}

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
  // Rewrite relative /api/ requests to the backend URL during SSR.
  // Load functions now use relative paths for consistent SSR↔CSR fetch dedup.
  if (request.url.startsWith(event.url.origin + "/api/")) {
    const apiPath = new URL(request.url).pathname + new URL(request.url).search;
    const backendUrl = new URL(API_URL).origin + apiPath;
    request = new Request(backendUrl, request);
    request.headers.set("cookie", event.request.headers.get("cookie") || "");
    request.headers.set("Origin", API_URL);
  } else if (request.url.startsWith(API_URL)) {
    request.headers.set("cookie", event.request.headers.get("cookie") || "");
    request.headers.set("Origin", API_URL);
  }

  return fetch(request);
}
