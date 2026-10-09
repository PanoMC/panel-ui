import { get, writable } from 'svelte/store';

import {
  buildSettings,
  chosenUploads,
  initialFiles,
  initialValues,
} from '$lib/components/SchemaForm.svelte';

import { describeError } from './frontend.util.js';

/**
 * @typedef {object} SettingsState
 * @property {string} id the active front-end
 * @property {string} mode
 * @property {boolean} hasSchema false = the front-end declares no `fields` and keeps its own settings page
 * @property {import('$lib/components/SchemaForm.svelte').Schema | null} schema
 * @property {Record<string, any>} settings
 * @property {Record<string, string[]>} files
 */

/**
 * The answer of `GET /panel/frontend/settings` with every field present.
 * @param {any} body
 * @returns {SettingsState}
 */
export function normalizeSettingsState(body) {
  const schema =
    body?.hasSchema === true && body.schema && typeof body.schema.fields === 'object'
      ? body.schema
      : null;

  return {
    id: typeof body?.id === 'string' ? body.id : '',
    mode: typeof body?.mode === 'string' ? body.mode : 'THEME',
    hasSchema: schema !== null,
    schema,
    settings: body?.settings && typeof body.settings === 'object' ? body.settings : {},
    files: body?.files && typeof body.files === 'object' ? body.files : {},
  };
}

/**
 * The form state a page binds the schema form to, for a state.
 * @param {SettingsState} state
 */
export function formOf(state) {
  const schema = /** @type {any} */ (state.schema ?? { fields: {} });

  return {
    values: initialValues(schema, state.settings),
    files: initialFiles(schema, state.files),
    removed: /** @type {string[]} */ ([]),
    uploads: /** @type {Record<string, File | null>} */ ({}),
  };
}

/**
 * The state and the actions of the Settings tab. The form itself (the bound values) lives in the page; `save`
 * takes it, builds the request and puts the answer back in `state`.
 *
 * @param {object} options
 * @param {ReturnType<import('./frontend.api.js').createFrontendApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {any} options.initial the answer of `GET /panel/frontend/settings`
 * @param {string} [options.locale] the panel's language, for the front-end's own texts
 */
export function createSettingsController({ api, notify, initial, locale = 'en-US' }) {
  const state = writable(normalizeSettingsState(initial));
  const saving = writable(false);
  /** The front-end's own texts (nested), to resolve labels that are lang keys. */
  const messages = writable(/** @type {Record<string, any>} */ ({}));
  /** The reason the backend gave per field of the last refused write: `{ title: 'TOO_LONG' }`. */
  const fieldErrors = writable(/** @type {Record<string, string>} */ ({}));
  /** The message of the last refused write that blames no field: `{ code, key, values }`, or null. */
  const error = writable(
    /** @type {{ code: string, key: string, values: Record<string, string> } | null} */ (null),
  );

  function clearError() {
    error.set(null);
    fieldErrors.set({});
  }

  /** Reads the front-end's texts. Best effort: without them a label that is a key shows as written. */
  async function loadTexts() {
    const result = await api.getFrontendTexts(locale);

    if (result.ok) {
      const data = result.body?.data ?? result.body;

      messages.set(data && typeof data === 'object' ? data : {});
    }

    return result.ok;
  }

  async function refresh() {
    const result = await api.getSettings();

    if (!result.ok) {
      const { key, values } = describeError(result.error);

      notify.error(key, values);

      return false;
    }

    state.set(normalizeSettingsState(result.body));
    clearError();
    await loadTexts();

    return true;
  }

  /**
   * Saves the form.
   *
   * @param {{ values: Record<string, any>, files?: Record<string, string[]>, removed?: string[], uploads?: Record<string, File | null> }} form
   * @returns {Promise<SettingsState | null>} the saved state, or null when the write was refused
   */
  async function save(form) {
    const current = get(state);

    if (!current.schema) return null;

    clearError();
    saving.set(true);

    try {
      const settings = buildSettings(current.schema, form.values, form);
      const result = await api.saveSettings(
        settings,
        chosenUploads(current.schema, form.uploads ?? {}),
      );

      if (!result.ok) {
        const failure = result.error;

        if (failure.code === 'FRONTEND_SETTING_INVALID' && failure.details?.key) {
          fieldErrors.set({ [failure.details.key]: String(failure.details.reason ?? '') });
        } else {
          const { key, values } = describeError(failure);

          error.set({ code: failure.code, key, values });
        }

        return null;
      }

      const next = normalizeSettingsState(result.body);

      state.set(next);
      notify.success('pages.frontend.settings.saved');

      return next;
    } finally {
      saving.set(false);
    }
  }

  return { state, saving, messages, fieldErrors, error, clearError, loadTexts, refresh, save };
}
