import { createThemeHooks } from '$pano/kit/hooks-server.js';
import { internalLibsHash } from '$lib/internalLibs.js';
import { runtimeShimsHash } from '$lib/runtimeShims.js';

import ApiUtil, { networkErrorBody } from '$lib/api.util.js';
import { API_URL, updatePanoWebsiteApiUrl } from '$lib/variables.js';

async function fetchBasicData(token, csrfToken) {
  return ApiUtil.get({ path: '/api/panel/basicData', token, csrfToken }).catch(
    () => networkErrorBody,
  );
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
  // Panel profile: resolve locals from /api/panel/basicData instead of the theme's
  // getCredentialsServerSide user lookup. jwt/csrfToken are computed by the factory
  // (same cookie names/guards); it sets locals.csrfToken after this runs.
  resolveLocals: async ({ locals, jwt, csrfToken }) => {
    locals.basicData = await fetchBasicData(jwt, csrfToken);
    locals.jwt = jwt;
  },
});

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
  // Kept panel-local (NOT the core factory's handleFetch): the panel's API_URL is
  // shaped `<origin>/panel/api`, so it needs the backend ORIGIN. The core factory
  // derives the backend base via API_URL.replace(/\/api\/?$/, ""), which for the
  // panel would leave `<origin>/panel` (wrong); `new URL(API_URL).origin` is right.
  //
  // Rewrite relative /api/ requests to the backend URL during SSR.
  // Load functions now use relative paths for consistent SSR↔CSR fetch dedup.
  if (request.url.startsWith(event.url.origin + '/api/')) {
    const apiPath = new URL(request.url).pathname + new URL(request.url).search;
    const backendUrl = new URL(API_URL).origin + apiPath;
    request = new Request(backendUrl, request);
    request.headers.set('cookie', event.request.headers.get('cookie') || '');
    request.headers.set('Origin', API_URL);
  } else if (request.url.startsWith(API_URL)) {
    request.headers.set('cookie', event.request.headers.get('cookie') || '');
    request.headers.set('Origin', API_URL);
  }

  return fetch(request);
}
