import { createThemeHooks } from '$pano/kit/hooks-server.js';
import { internalLibsHash } from '$lib/internalLibs.js';
import { runtimeShimsHash } from '$lib/runtimeShims.js';

import ApiUtil, { networkErrorBody } from '$lib/api.util.js';
import { API_URL, updatePanoWebsiteApiUrl } from '$lib/variables.js';

async function fetchBasicData(token, csrfToken) {
  return ApiUtil.get({ path: '/panel/basicData', token, csrfToken }).catch(() => networkErrorBody);
}

export const { handle, handleError } = createThemeHooks({
  internalLibsHash,
  runtimeShimsHash,
  // Panel is mounted under /panel — must match kit.paths.base so the import-map
  // shim URLs (/panel/lib, /panel/runtime) resolve behind the reverse proxy.
  base: '/panel',
  // Panel keeps logging 405/no-form-action errors (theme default suppresses them).
  suppressNoisyErrors: false,
  // Panel-specific env: PANO_WEBSITE_API_URL → updatePanoWebsiteApiUrl. Mirrors the
  // pre-migration hooks.server.js behavior byte-for-byte (incl. the locals key).
  applyExtraEnv: (locals) => {
    // noinspection JSUnresolvedReference
    const panoWebsiteApiUrlEnv = process.env.PANO_WEBSITE_API_URL;

    if (panoWebsiteApiUrlEnv) {
      updatePanoWebsiteApiUrl(panoWebsiteApiUrlEnv);
      locals.panoWebsiteApiUrlEnv = panoWebsiteApiUrlEnv;
    }
  },
  // Panel profile: resolve locals from /api/v1/panel/basicData instead of the theme's
  // getCredentialsServerSide user lookup. jwt/csrfToken are computed by the factory
  // (same cookie names/guards); it sets locals.csrfToken after this runs.
  resolveLocals: async ({ locals, jwt, csrfToken }) => {
    locals.basicData = await fetchBasicData(jwt, csrfToken);
    locals.jwt = jwt;
  },
});

/**
 * The visitor's address: the single `X-Forwarded-For` value Pano's UI proxy writes, then the
 * socket peer when the server is reached directly (same rule as theme-core's handleFetch).
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {string | null}
 */
function getVisitorAddress(event) {
  const forwardedFor = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  if (forwardedFor) return forwardedFor;

  try {
    return event.getClientAddress() || null;
  } catch {
    return null;
  }
}

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
  // Kept panel-local (NOT the core factory's handleFetch): the request path already carries
  // `/api/v1/...`, so the panel only needs the backend ORIGIN of API_URL (`<origin>/api`),
  // and `new URL(API_URL).origin` gives exactly that. The headers follow theme-core's
  // handleFetch: the visitor's cookie, plus `X-Pano-Frontend-Key` and `X-Pano-Client-Ip` when
  // Pano gave this UI its key, so the backend sees the visitor instead of this server. No
  // `Origin` header is made up.
  //
  // Rewrite relative /api/ requests to the backend URL during SSR.
  // Load functions now use relative paths for consistent SSR↔CSR fetch dedup.
  let toBackend = false;

  if (request.url.startsWith(event.url.origin + '/api/')) {
    const apiPath = new URL(request.url).pathname + new URL(request.url).search;
    const backendUrl = new URL(API_URL).origin + apiPath;
    request = new Request(backendUrl, request);
    toBackend = true;
  } else if (request.url.startsWith(API_URL)) {
    toBackend = true;
  }

  if (toBackend) {
    request.headers.set('cookie', event.request.headers.get('cookie') || '');
    request.headers.delete('origin');

    // noinspection JSUnresolvedReference
    const key = process.env.PANO_FRONTEND_KEY?.trim();

    if (key) {
      request.headers.set('X-Pano-Frontend-Key', key);

      const clientIp = getVisitorAddress(event);

      if (clientIp) {
        request.headers.set('X-Pano-Client-Ip', clientIp);
      }
    }
  }

  // Backend calls use the runtime's own fetch: on a direct install the site origin can equal the
  // API_URL origin, and SvelteKit's fetch would route that "same-origin" request into this app.
  return toBackend ? globalThis.fetch(request) : fetch(request);
}
