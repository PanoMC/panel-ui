/**
 * The panel API of the compatibility icons and the update plan (doc 04 section 7).
 *
 * Every call answers `{ ok, body, error }` like the other pages' APIs; the HTTP client is passed in
 * (`ApiUtil` in the panel, a stub in tests), so this file imports nothing from the panel.
 */
import { toResult } from '../../view/theme/theme.api.js';

/**
 * @param {{ get: Function, post: Function }} client
 * @param {any} [request] the SvelteKit load event, for a call made while loading
 */
export function createCompatibilityApi(client, request) {
  const call = async (method, options) => {
    try {
      return toResult(await client[method]({ request, ...options }));
    } catch (e) {
      return { ok: false, body: null, error: { code: 'NETWORK_ERROR', details: {}, fields: {} } };
    }
  };

  return {
    /** The refused resources, the agents on an old protocol and the changed addresses. */
    getCompatibility: () => call('get', { path: '/panel/compatibility' }),

    /** What the platform update that was found would do to the installed plugins and themes. */
    getPlan: () => call('get', { path: '/panel/updates/platform/plan' }),
  };
}
