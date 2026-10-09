/**
 * The panel API of the theme override warnings and the home page select (doc 01 sections 7 and 9,
 * `/api/v1/panel/theme/...`).
 *
 * Every call answers `{ ok, body, error }` like the Front-end page's API; the HTTP client is passed
 * in (`ApiUtil` in the panel, a stub in tests), so this file imports nothing.
 */

/**
 * @typedef {object} ApiResult
 * @property {boolean} ok
 * @property {any} body
 * @property {{ code: string, details: Record<string, any>, fields: Record<string, any> } | null} error
 */

/**
 * @param {any} body what the client resolved with
 * @returns {ApiResult}
 */
export function toResult(body) {
  if (body === undefined || body === null) {
    return { ok: false, body: null, error: { code: 'DISABLED_FOR_DEMO', details: {}, fields: {} } };
  }

  const error = body?.error;

  if (error == null) {
    return { ok: true, body, error: null };
  }

  return {
    ok: false,
    body,
    error: {
      code: typeof error === 'string' ? error : String(error.code ?? ''),
      details: error.details ?? {},
      fields: error.fields ?? {},
    },
  };
}

/**
 * @param {{ get: Function, put: Function }} client
 * @param {any} [request] the SvelteKit load event, for a call made while loading
 */
export function createThemeApi(client, request) {
  const call = async (method, options) => {
    try {
      return toResult(await client[method]({ request, ...options }));
    } catch (e) {
      return { ok: false, body: null, error: { code: 'NETWORK_ERROR', details: {}, fields: {} } };
    }
  };

  return {
    /**
     * `{ theme: {id, version}, status: 'OK' | 'OUTDATED' | 'UNKNOWN', counts: {overrides, active,
     * fallback, pluginNotInstalled}, issues: [...] }`
     */
    getCompatibility: () => call('get', { path: '/panel/theme/compatibility' }),

    /** `{ value, default, options: [{ id, label, kind, path?, available }] }` */
    getHome: () => call('get', { path: '/panel/theme/home' }),

    /** @param {string | null} homePage an option id, `custom:/path`, or null for the theme's default */
    saveHome: (homePage) => call('put', { path: '/panel/theme/home', body: { homePage } }),
  };
}
