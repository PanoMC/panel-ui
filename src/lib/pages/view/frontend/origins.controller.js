import { derived, get, writable } from 'svelte/store';

import { describeError } from './frontend.util.js';

/** The most origins the backend keeps (doc 05 section 5); used until the list answers with its own. */
export const DEFAULT_MAX_ORIGINS = 20;

/**
 * The state and the actions of the Allowed origins tab. The backend takes the whole list on every
 * write, so an add or a remove sends the list with that one change and shows what came back.
 *
 * @param {object} options
 * @param {ReturnType<import('./frontend.api.js').createFrontendApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {(options: object, callback: () => void) => any} options.confirm the shared confirmation dialog
 * @param {{ origins?: string[], max?: number }} [options.initial] the answer of the list call
 */
export function createOriginsController({ api, notify, confirm, initial = {} }) {
  const items = writable(/** @type {string[]} */ (initial.origins ?? []));
  const max = writable(initial.max ?? DEFAULT_MAX_ORIGINS);
  const adding = writable(false);
  const removing = writable(/** @type {string | null} */ (null));
  /** The message of the last refused add: `{ code, key, values }`, or null. */
  const addError = writable(
    /** @type {{ code: string, key: string, values: Record<string, string> } | null} */ (null),
  );

  const full = derived([items, max], ([$items, $max]) => $items.length >= $max);

  /** The key of the message for a refused write; the invalid-origin field error has its own text. */
  function describe(failure) {
    if (failure.code === 'INVALID_FIELDS' && failure.fields?.origins) {
      return { key: 'pages.frontend.errors.INVALID_ORIGIN', values: {} };
    }

    return describeError(failure);
  }

  async function refresh() {
    const result = await api.listOrigins();

    if (!result.ok) {
      const { key, values } = describe(result.error);

      notify.error(key, values);

      return false;
    }

    items.set(result.body.origins ?? []);
    max.set(result.body.max ?? DEFAULT_MAX_ORIGINS);

    return true;
  }

  function clearError() {
    addError.set(null);
  }

  /**
   * @param {string} origin what the admin typed, `scheme://host[:port]`
   * @returns {Promise<boolean>} true when it is on the list now
   */
  async function add(origin) {
    const value = String(origin ?? '')
      .trim()
      .replace(/\/+$/, '');

    clearError();

    if (value === '') {
      addError.set({
        code: 'INVALID_FIELDS',
        key: 'pages.frontend.errors.INVALID_ORIGIN',
        values: {},
      });

      return false;
    }

    const current = get(items);

    // Already there: nothing to send.
    if (current.includes(value)) return true;

    adding.set(true);

    try {
      const result = await api.saveOrigins([...current, value]);

      if (!result.ok) {
        const { key, values } = describe(result.error);

        addError.set({ code: result.error.code, key, values });

        return false;
      }

      items.set(result.body.origins ?? []);
      notify.success('pages.frontend.origins.added');

      return true;
    } finally {
      adding.set(false);
    }
  }

  /** @param {string} origin */
  async function remove(origin) {
    removing.set(origin);

    try {
      const result = await api.saveOrigins(get(items).filter((item) => item !== origin));

      if (!result.ok) {
        const { key, values } = describe(result.error);

        notify.error(key, values);

        return false;
      }

      items.set(result.body.origins ?? []);
      notify.success('pages.frontend.origins.removed');

      return true;
    } finally {
      removing.set(null);
    }
  }

  /** Asks first (a front-end on that origin stops working at once), then removes. */
  function requestRemove(origin) {
    confirm(
      {
        title: 'pages.frontend.origins.remove.title',
        description: 'pages.frontend.origins.remove.description',
        confirmLabel: 'pages.frontend.origins.remove.confirm',
        variant: 'danger',
      },
      () => remove(origin),
    );
  }

  return {
    items,
    max,
    full,
    adding,
    removing,
    addError,
    refresh,
    clearError,
    add,
    remove,
    requestRemove,
  };
}
