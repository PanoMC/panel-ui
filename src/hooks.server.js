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
const IMPORT_MAP = `
  <script type="importmap" crossorigin="anonymous">
  {
    "imports": {
      "svelte": "${base}${isDev ? '/@id/svelte' : '/lib/svelte/index.js'}",
      "svelte/animate": "${base}${isDev ? '/@id/svelte/animate' : '/lib/svelte/animate.js'}",
      "svelte/easing": "${base}${isDev ? '/@id/svelte/easing' : '/lib/svelte/easing.js'}",
      "svelte/motion": "${base}${isDev ? '/@id/svelte/motion' : '/lib/svelte/motion.js'}",
      "svelte/store": "${base}${isDev ? '/@id/svelte/store' : '/lib/svelte/store.js'}",
      "svelte/transition": "${base}${isDev ? '/@id/svelte/transition' : '/lib/svelte/transition.js'}",
      "svelte/internal": "${base}${isDev ? '/@id/svelte/internal' : '/lib/svelte/internal.js'}",
      "svelte/internal/client": "${base}${isDev ? '/@id/svelte/internal/client' : '/lib/svelte/internal-client.js'}",
      "svelte/internal/disclose-version": "${base}${isDev ? '/@id/svelte/internal/disclose-version' : '/lib/svelte/internal-disclose-version.js'}",
      "svelte/internal/flags/legacy": "${base}${isDev ? '/@id/svelte/internal/flags/legacy' : '/lib/svelte/internal-flags-legacy.js'}",
      "svelte/internal/flags/async": "${base}${isDev ? '/@id/svelte/internal/flags/async' : '/lib/svelte/internal-flags-async.js'}",
      "svelte/internal/flags/tracing": "${base}${isDev ? '/@id/svelte/internal/flags/tracing' : '/lib/svelte/internal-flags-tracing.js'}",
      "svelte/internal/server": "${base}${isDev ? '/@id/svelte/internal/server' : '/lib/svelte/internal-server.js'}",
      "svelte/legacy": "${base}${isDev ? '/@id/svelte/legacy' : '/lib/svelte/legacy.js'}",
      "svelte/events": "${base}${isDev ? '/@id/svelte/events' : '/lib/svelte/events.js'}",
      "svelte-i18n": "${base}${isDev ? '/@id/svelte-i18n' : '/lib/svelte/i18n.js'}",
      "@panomc/sdk": "${base}/lib/sdk/index.js",
      "@panomc/sdk/components/theme": "${base}/lib/sdk/components-theme.js",
      "@panomc/sdk/components/panel": "${base}/lib/sdk/components-panel.js",
      "@panomc/sdk/toasts": "${base}/lib/sdk/toasts.js",
      "@panomc/sdk/utils/api": "${base}/lib/sdk/utils-api.js",
      "@panomc/sdk/utils/auth": "${base}/lib/sdk/utils-auth.js",
      "@panomc/sdk/utils/tooltip": "${base}/lib/sdk/utils-tooltip.js",
      "@panomc/sdk/utils/language": "${base}/lib/sdk/utils-language.js",
      "@panomc/sdk/utils/component": "${base}/lib/sdk/utils-component.js",
      "@panomc/sdk/utils/text": "${base}/lib/sdk/utils-text.js",
      "@panomc/sdk/variables": "${base}/lib/sdk/variables.js",
      "@panomc/sdk/svelte": "${base}/lib/sdk/svelte.js",
      "@panomc/sdk/internal": "${base}/lib/sdk/internal.js"
    }
  }
  </script>`;
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
  if (request.url.startsWith(API_URL)) {
    request.headers.set('cookie', event.request.headers.get('cookie'));
    request.headers.set('Origin', API_URL);
  }

  return fetch(request);
}
