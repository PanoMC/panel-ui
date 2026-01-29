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
      const importMap = `
  <script type="importmap" crossorigin="anonymous">
  {
    "imports": {
      "svelte": "${base}/lib/svelte/index.js",
      "svelte/animate": "${base}/lib/svelte/animate.js",
      "svelte/easing": "${base}/lib/svelte/easing.js",
      "svelte/motion": "${base}/lib/svelte/motion.js",
      "svelte/store": "${base}/lib/svelte/store.js",
      "svelte/transition": "${base}/lib/svelte/transition.js",
      "svelte/internal": "${base}/lib/svelte/internal.js",
      "svelte/internal/client": "${base}/lib/svelte/internal-client.js",
      "svelte/internal/disclose-version": "${base}/lib/svelte/internal-disclose-version.js",
      "svelte/internal/flags/legacy": "${base}/lib/svelte/internal-flags-legacy.js",
      "svelte/internal/flags/async": "${base}/lib/svelte/internal-flags-async.js",
      "svelte/internal/flags/tracing": "${base}/lib/svelte/internal-flags-tracing.js",
      "svelte/internal/server": "${base}/lib/svelte/internal-server.js",
      "svelte/legacy": "${base}/lib/svelte/legacy.js",
      "svelte/events": "${base}/lib/svelte/events.js"
    }
  }
  </script>`;
      return html.replace('%pano_lib_import%', importMap);
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
  if (request.url.startsWith(API_URL)) {
    request.headers.set('cookie', event.request.headers.get('cookie'));
    request.headers.set('Origin', API_URL);
  }

  return fetch(request);
}
