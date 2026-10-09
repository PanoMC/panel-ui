import { get, writable } from 'svelte/store';

import {
  buildModeBody,
  describeError,
  FrontendModes,
  isModeComplete,
  isModeDirty,
  MAX_CUSTOM_APP_BYTES,
  normalizeFrontendState,
} from './frontend.util.js';

/**
 * The state and the actions of the Mode tab: the chosen mode with its fields, the uploaded custom
 * apps, and the error of the last call. The page renders the stores; the tests drive the actions
 * with a stubbed API.
 *
 * @param {object} options
 * @param {ReturnType<import('./frontend.api.js').createFrontendApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {(options: object, callback: () => void) => any} options.confirm the shared confirmation dialog
 * @param {any} options.initial the answer of `GET /panel/frontend`
 */
export function createModeController({ api, notify, confirm, initial }) {
  const first = normalizeFrontendState(initial);

  /** What the backend holds. */
  const saved = writable(first);
  /** What the form shows. */
  const draft = writable({
    mode: first.mode,
    customAppId: first.customAppId,
    upstreamUrl: first.upstreamUrl,
    siteUrl: first.siteUrl,
    descriptorUrl: first.descriptorUrl,
  });
  const saving = writable(false);
  const uploading = writable(false);
  const deleting = writable(/** @type {string | null} */ (null));
  /** The message of the last refused call: `{ code, key, values }`, or null. */
  const error = writable(
    /** @type {{ code: string, key: string, values: Record<string, string> } | null} */ (null),
  );
  /** Field names the last refused call blamed: `{ upstreamUrl: true }`. */
  const fieldErrors = writable(/** @type {Record<string, boolean>} */ ({}));
  /** True when the last save was refused only because nothing answered at the upstream (offers `force`). */
  const canForce = writable(false);

  function clearError() {
    error.set(null);
    fieldErrors.set({});
    canForce.set(false);
  }

  /** @param {{ code: string, details: any, fields: any }} failure */
  function fail(failure) {
    const { key, values } = describeError(failure);

    error.set({ code: failure.code, key, values });
    fieldErrors.set(Object.fromEntries(Object.keys(failure.fields ?? {}).map((f) => [f, true])));
    canForce.set(failure.code === 'UPSTREAM_UNREACHABLE');
  }

  function resetDraft(state) {
    draft.set({
      mode: state.mode,
      customAppId: state.customAppId,
      upstreamUrl: state.upstreamUrl,
      siteUrl: state.siteUrl,
      descriptorUrl: state.descriptorUrl,
    });
  }

  function setMode(mode) {
    clearError();
    draft.update((d) => ({ ...d, mode }));
  }

  /** Re-reads the state from the backend (after an upload, a delete or a failed start). */
  async function refresh() {
    const result = await api.getFrontend();

    if (!result.ok) {
      fail(result.error);

      return false;
    }

    saved.set(normalizeFrontendState(result.body));

    return true;
  }

  /**
   * Saves the draft. `force` saves an EXTERNAL upstream that did not answer the 5 second probe.
   * @param {{ force?: boolean }} [options]
   */
  async function save({ force = false } = {}) {
    const current = get(draft);

    clearError();

    if (!isModeComplete(current)) {
      const field = current.mode === FrontendModes.CUSTOM_APP ? 'customAppId' : 'upstreamUrl';

      fieldErrors.set({ [field]: true });

      return false;
    }

    saving.set(true);

    try {
      const result = await api.saveFrontend(buildModeBody(current, { force }));

      if (!result.ok) {
        fail(result.error);

        return false;
      }

      const next = normalizeFrontendState(result.body);

      saved.set(next);
      resetDraft(next);
      notify.success('pages.frontend.mode.saved');

      return true;
    } finally {
      saving.set(false);
    }
  }

  /**
   * Uploads a custom-app zip. Uploading selects nothing (doc 05 section 8): the new app is only
   * pre-selected in the form, and saved with the rest.
   *
   * @param {File | null | undefined} file
   */
  async function upload(file) {
    clearError();

    if (!file) return false;

    if (!/\.zip$/i.test(file.name ?? '')) {
      fail({ code: 'NOT_A_ZIP', details: {}, fields: {} });

      return false;
    }

    if (file.size > MAX_CUSTOM_APP_BYTES) {
      fail({ code: 'FILE_TOO_LARGE', details: {}, fields: {} });

      return false;
    }

    uploading.set(true);

    try {
      const result = await api.uploadCustomApp(file);

      if (!result.ok) {
        fail(result.error);

        return false;
      }

      await refresh();
      draft.update((d) => ({ ...d, mode: FrontendModes.CUSTOM_APP, customAppId: result.body.id }));
      notify.success('pages.frontend.custom-apps.uploaded', {
        title: result.body.title ?? result.body.id,
      });

      return true;
    } finally {
      uploading.set(false);
    }
  }

  async function removeApp(id) {
    clearError();
    deleting.set(id);

    try {
      const result = await api.deleteCustomApp(id);

      if (!result.ok) {
        fail(result.error);

        return false;
      }

      await refresh();
      draft.update((d) => (d.customAppId === id ? { ...d, customAppId: '' } : d));
      notify.success('pages.frontend.custom-apps.deleted');

      return true;
    } finally {
      deleting.set(null);
    }
  }

  /** Asks first, then deletes. An active app is refused by the page already; the backend refuses it too. */
  function requestDeleteApp(app) {
    confirm(
      {
        title: 'pages.frontend.custom-apps.delete.title',
        description: 'pages.frontend.custom-apps.delete.description',
        confirmLabel: 'pages.frontend.custom-apps.delete.confirm',
        variant: 'danger',
      },
      () => removeApp(app.id),
    );
  }

  return {
    saved,
    draft,
    saving,
    uploading,
    deleting,
    error,
    fieldErrors,
    canForce,
    setMode,
    refresh,
    save,
    upload,
    removeApp,
    requestDeleteApp,
    isDirty: () => isModeDirty(get(saved), get(draft)),
    clearError,
  };
}
