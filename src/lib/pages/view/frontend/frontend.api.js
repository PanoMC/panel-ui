/**
 * The panel API of the Front-end page (doc 05 sections 3.2 and 8, `/api/v1/panel/...`).
 *
 * Every call answers `{ ok, body, error }`: `ok` is true when the backend did not send an error
 * envelope, `error` is `{ code, details, fields }` otherwise. The HTTP client is passed in
 * (`ApiUtil` in the panel, a stub in tests), so this file imports nothing.
 */

/**
 * @typedef {object} ApiClient
 * @property {(options: any) => Promise<any>} get
 * @property {(options: any) => Promise<any>} post
 * @property {(options: any) => Promise<any>} put
 * @property {(options: any) => Promise<any>} delete
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
  // The demo guard resolves with nothing (the client shows its own toast).
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
 * @param {ApiClient} client
 * @param {any} [request] the SvelteKit load event, for a call made while loading
 */
export function createFrontendApi(client, request) {
  const call = async (method, options) => toResult(await client[method]({ request, ...options }));

  return {
    /** `{ items: [{ id, name, hint, createdAt, lastUsedAt }], max }` */
    listKeys: () => call('get', { path: '/panel/frontend/keys' }),

    /** `{ id, name, key, env: [line, line] }` - the key is in this answer only. */
    createKey: (name) => call('post', { path: '/panel/frontend/keys', body: { name } }),

    revokeKey: (id) => call('delete', { path: `/panel/frontend/keys/${encodeURIComponent(id)}` }),

    /** `{ mode, customAppId, upstreamUrl, siteUrl, descriptorUrl, devUrl, customApps, running, ... }` */
    getFrontend: () => call('get', { path: '/panel/frontend' }),

    /** @param {Record<string, any>} body any of the fields of `getFrontend`, plus `force` */
    saveFrontend: (body) => call('put', { path: '/panel/frontend', body }),

    /** @param {File} file the zip */
    uploadCustomApp: (file) => {
      const form = new FormData();

      form.append('file', file);

      return call('post', { path: '/panel/frontend/custom-apps', body: form });
    },

    deleteCustomApp: (id) =>
      call('delete', { path: `/panel/frontend/custom-apps/${encodeURIComponent(id)}` }),

    /** `{ state: 'OK' | 'UNTRUSTED_PROXY' | 'SINGLE_CLIENT_IP', peers, suggestion }` */
    getProxyStatus: () => call('get', { path: '/panel/access/proxy-status' }),

    /** `{ origins: string[], max }` (doc 05 section 5) */
    listOrigins: () => call('get', { path: '/panel/frontend/origins' }),

    /**
     * Replaces the whole list. Answers `{ origins }` (normalized), or `ORIGIN_DIFFERENT_SITE`,
     * `ORIGIN_LIMIT_REACHED` or `INVALID_FIELDS { origins }`; nothing is saved when one entry is refused.
     * @param {string[]} origins
     */
    saveOrigins: (origins) => call('put', { path: '/panel/frontend/origins', body: { origins } }),

    /** `{ siteUrl, overrides: { [target]: string }, targets: [{ id, owner, source, path, defaultPath, fallback, createsSession }] }` */
    getUrls: () => call('get', { path: '/panel/frontend/urls' }),

    /**
     * Replaces the admin's overrides (a target left out loses its override). Answers like `getUrls`.
     * @param {Record<string, string>} overrides
     */
    saveUrls: (overrides) => call('put', { path: '/panel/frontend/urls', body: { overrides } }),

    /** `{ id, mode, hasSchema, schema, settings, files }` (doc 05 section 9) */
    getSettings: () => call('get', { path: '/panel/frontend/settings' }),

    /**
     * Writes the whole form. JSON when no image is sent; multipart (the `settings` part as JSON text, one file
     * part per image field, named after the field) when one is, as the theme settings always were.
     *
     * @param {Record<string, any>} settings the field values, plus `files` and `remove-files`
     * @param {Record<string, File>} [uploads] image field to the chosen file
     */
    saveSettings: (settings, uploads = {}) => {
      const names = Object.keys(uploads);

      if (names.length === 0) {
        return call('put', { path: '/panel/frontend/settings', body: { settings } });
      }

      const form = new FormData();

      for (const name of names) {
        form.append(name, uploads[name]);
      }

      form.append('settings', JSON.stringify(settings));

      return call('put', { path: '/panel/frontend/settings', body: form });
    },

    /**
     * The active front-end's own texts for a locale, with the admin's edits (nested object), used to
     * resolve the labels of the settings form. Best effort: the form falls back to the plain label.
     * @param {string} locale
     */
    getFrontendTexts: (locale) =>
      call('get', { path: `/locales/${encodeURIComponent(locale)}/translations/types/THEME` }),
  };
}
