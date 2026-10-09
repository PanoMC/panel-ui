import { derived, get, writable } from 'svelte/store';

import { describeError } from './frontend.util.js';

/**
 * @typedef {object} FrontendKey
 * @property {number} id
 * @property {string} name
 * @property {string} hint last four characters of the key
 * @property {number | null} createdAt
 * @property {number | null} lastUsedAt
 */

/**
 * @typedef {object} CreatedKey
 * @property {number} id
 * @property {string} name
 * @property {string} key the whole key, known only in the answer that created it
 * @property {string[]} env the two `.env` lines
 */

/** The most keys the backend keeps (doc 05 section 3.2); used until the list answers with its own. */
export const DEFAULT_MAX_KEYS = 20;

/**
 * The state and the actions of the Keys tab. The page renders the stores; the tests drive the
 * actions with a stubbed API.
 *
 * @param {object} options
 * @param {ReturnType<import('./frontend.api.js').createFrontendApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {(options: object, callback: () => void) => any} options.confirm the shared confirmation dialog
 * @param {{ items?: FrontendKey[], max?: number }} [options.initial] the answer of the list call
 */
export function createKeysController({ api, notify, confirm, initial = {} }) {
  const items = writable(/** @type {FrontendKey[]} */ (initial.items ?? []));
  const max = writable(initial.max ?? DEFAULT_MAX_KEYS);
  const creating = writable(false);
  const revoking = writable(/** @type {number | null} */ (null));
  /** Field errors of the last create call: `{ name: true }`. */
  const createErrors = writable(/** @type {Record<string, boolean>} */ ({}));

  const full = derived([items, max], ([$items, $max]) => $items.length >= $max);

  async function refresh() {
    const result = await api.listKeys();

    if (!result.ok) {
      const { key, values } = describeError(result.error);

      notify.error(key, values);

      return false;
    }

    items.set(result.body.items ?? []);
    max.set(result.body.max ?? DEFAULT_MAX_KEYS);

    return true;
  }

  /**
   * @param {string} name
   * @returns {Promise<CreatedKey | null>} the created key, or null when it was refused
   */
  async function create(name) {
    const trimmed = String(name ?? '').trim();

    createErrors.set({});

    if (trimmed === '' || trimmed.length > 64) {
      createErrors.set({ name: true });

      return null;
    }

    creating.set(true);

    try {
      const result = await api.createKey(trimmed);

      if (!result.ok) {
        const fields = Object.fromEntries(Object.keys(result.error.fields).map((f) => [f, true]));

        if (Object.keys(fields).length > 0) {
          createErrors.set(fields);
        } else {
          const { key, values } = describeError(result.error);

          notify.error(key, values);
        }

        return null;
      }

      const created = /** @type {CreatedKey} */ (result.body);

      // The list never carries the key, so the new row is put together from the answer; the
      // hint is the last four characters of the key.
      items.update((list) => [
        ...list,
        {
          id: created.id,
          name: created.name,
          hint: String(created.key ?? '').slice(-4),
          createdAt: Date.now(),
          lastUsedAt: null,
        },
      ]);

      return created;
    } finally {
      creating.set(false);
    }
  }

  async function revoke(id) {
    revoking.set(id);

    try {
      const result = await api.revokeKey(id);

      if (!result.ok) {
        const { key, values } = describeError(result.error);

        notify.error(key, values);

        return false;
      }

      items.update((list) => list.filter((item) => item.id !== id));
      notify.success('pages.frontend.keys.revoked');

      return true;
    } finally {
      revoking.set(null);
    }
  }

  /** Asks first (the key stops working at once), then revokes. */
  function requestRevoke(item) {
    confirm(
      {
        title: 'pages.frontend.keys.revoke.title',
        description: 'pages.frontend.keys.revoke.description',
        confirmLabel: 'pages.frontend.keys.revoke.confirm',
        variant: 'danger',
      },
      () => revoke(item.id),
    );
  }

  return {
    items,
    max,
    full,
    creating,
    revoking,
    createErrors,
    refresh,
    create,
    revoke,
    requestRevoke,
    count: () => get(items).length,
  };
}
