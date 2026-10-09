import { derived, get, readable, writable } from 'svelte/store';

import { describeError } from './frontend.util.js';

/**
 * @typedef {object} UrlTarget
 * @property {string} id
 * @property {string} owner `core` or the id of the plugin that declared it
 * @property {'OVERRIDE' | 'FRONTEND' | 'THEME' | 'FALLBACK' | null} source which step of the URL map answered; null = nothing serves it
 * @property {string | null} path
 * @property {string} defaultPath
 * @property {boolean} fallback Pano has a built-in page for it
 * @property {boolean} createsSession the page sets the visitor's session cookie
 */

const SOURCES = new Set(['OVERRIDE', 'FRONTEND', 'THEME', 'FALLBACK']);

/**
 * The answer of `GET /panel/frontend/urls` with every field present.
 * @param {any} body
 * @returns {{ siteUrl: string, overrides: Record<string, string>, targets: UrlTarget[] }}
 */
export function normalizeUrlsState(body) {
  const text = (value) => (typeof value === 'string' ? value : '');
  const overrides = {};

  for (const [id, value] of Object.entries(body?.overrides ?? {})) {
    if (typeof value === 'string' && value !== '') overrides[id] = value;
  }

  return {
    siteUrl: text(body?.siteUrl),
    overrides,
    targets: Array.isArray(body?.targets)
      ? body.targets.map((target) => ({
          id: text(target?.id),
          owner: text(target?.owner) || 'core',
          source: SOURCES.has(target?.source) ? target.source : null,
          path: typeof target?.path === 'string' ? target.path : null,
          defaultPath: text(target?.defaultPath),
          fallback: target?.fallback === true,
          createsSession: target?.createsSession === true,
        }))
      : [],
  };
}

/** The lang key of the "where does it point" column for a source (null = no such page). */
export function sourceKey(source) {
  return `pages.frontend.urls.source.${source ?? 'NONE'}`;
}

/**
 * The state and the actions of the Link targets tab: every target the URL map knows with the step that
 * answered for it, and the admin's override per row (step 1 of the map).
 *
 * @param {object} options
 * @param {ReturnType<import('./frontend.api.js').createFrontendApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {any} options.initial the answer of `GET /panel/frontend/urls`
 * @param {import('svelte/store').Readable<boolean>} [options.hasKey] true while a front-end key is stored
 */
export function createUrlsController({ api, notify, initial, hasKey = readable(false) }) {
  const first = normalizeUrlsState(initial);

  const state = writable(first);
  const saving = writable(/** @type {string | null} */ (null));
  /** The message of the last refused override: `{ code, key, values }`, or null. */
  const error = writable(
    /** @type {{ code: string, key: string, values: Record<string, string> } | null} */ (null),
  );

  /**
   * The rows of the table. A target that creates a session is "needed for server-side front-ends"
   * while a key is stored: a back end on another domain must take it over (doc 05 section 10.3).
   */
  const rows = derived([state, hasKey], ([$state, $hasKey]) =>
    $state.targets.map((target) => ({
      ...target,
      override: $state.overrides[target.id] ?? null,
      neededForServerSide: target.createsSession && $hasKey,
    })),
  );

  function clearError() {
    error.set(null);
  }

  function fail(failure, id) {
    const reason = failure.fields?.[`overrides.${id}`];

    if (failure.code === 'INVALID_FIELDS' && reason) {
      error.set({
        code: failure.code,
        key: 'pages.frontend.errors.INVALID_LOCATION',
        values: {},
      });

      return;
    }

    const { key, values } = describeError(failure);

    error.set({ code: failure.code, key, values });
  }

  async function refresh() {
    const result = await api.getUrls();

    if (!result.ok) {
      const { key, values } = describeError(result.error);

      notify.error(key, values);

      return false;
    }

    state.set(normalizeUrlsState(result.body));

    return true;
  }

  /**
   * Sets or removes the override of one target; an empty value removes it.
   * @param {string} id
   * @param {string} value a site path (`/shop`) or an http(s) address
   * @returns {Promise<boolean>}
   */
  async function setOverride(id, value) {
    const overrides = { ...get(state).overrides };
    const trimmed = String(value ?? '').trim();

    clearError();

    if (trimmed === '') {
      delete overrides[id];
    } else {
      overrides[id] = trimmed;
    }

    saving.set(id);

    try {
      const result = await api.saveUrls(overrides);

      if (!result.ok) {
        fail(result.error, id);

        return false;
      }

      state.set(normalizeUrlsState(result.body));
      notify.success(
        trimmed === '' ? 'pages.frontend.urls.override-removed' : 'pages.frontend.urls.saved',
      );

      return true;
    } finally {
      saving.set(null);
    }
  }

  /** @param {string} id */
  async function removeOverride(id) {
    const done = await setOverride(id, '');

    // There is no dialog to show the error in: a toast says it.
    const failure = get(error);

    if (!done && failure) notify.error(failure.key, failure.values);

    return done;
  }

  return { state, rows, saving, error, refresh, clearError, setOverride, removeOverride };
}
