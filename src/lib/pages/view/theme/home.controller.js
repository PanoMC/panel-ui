import { derived, get, writable } from 'svelte/store';

/** The prefix of a typed site path in the stored value: `custom:/rules` (doc 01 section 9). */
export const CUSTOM_PREFIX = 'custom:';

/** The longest path the backend takes. */
export const MAX_CUSTOM_PATH = 256;

/**
 * @typedef {object} HomeOption
 * @property {string} id
 * @property {string | Record<string, string>} label a string, or a locale map as the theme wrote it
 * @property {'posts' | 'page' | 'path' | 'custom'} kind
 * @property {string} [path]
 * @property {boolean} available false when the plugin behind the page is off
 */

/**
 * The text of an option: a plain label, or the entry of a locale map for [locale], then `en-US`,
 * then the first one; the id when the label is missing.
 *
 * @param {HomeOption} option
 * @param {string} [locale]
 */
export function optionLabel(option, locale = 'en-US') {
  const label = option?.label;

  if (typeof label === 'string' && label) return label;

  if (label && typeof label === 'object') {
    const values = /** @type {Record<string, any>} */ (label);
    const pick = [locale, locale.split('-')[0], 'en-US', 'en']
      .map((code) => values[code])
      .find((text) => typeof text === 'string' && text);

    return (
      pick ?? Object.values(values).find((text) => typeof text === 'string' && text) ?? option.id
    );
  }

  return option?.id ?? '';
}

/** Same rule as the backend: one leading slash, no spaces, no route pattern, not absurdly long. */
export function isConcretePath(path) {
  return (
    typeof path === 'string' &&
    path.length >= 1 &&
    path.length <= MAX_CUSTOM_PATH &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\') &&
    !path.includes('[') &&
    !/[\s\u0000-\u001f\u007f]/.test(path)
  );
}

/**
 * The answer of `GET /panel/theme/home` with every field present.
 * @param {any} body
 */
export function normalizeHome(body) {
  const options = (Array.isArray(body?.options) ? body.options : [])
    .filter((option) => option && typeof option.id === 'string')
    .map((option) => ({
      id: option.id,
      label: option.label ?? option.id,
      kind: ['posts', 'page', 'path', 'custom'].includes(option.kind) ? option.kind : 'page',
      path: typeof option.path === 'string' ? option.path : undefined,
      available: option.available !== false,
    }));

  return {
    value: typeof body?.value === 'string' ? body.value : null,
    default: typeof body?.default === 'string' && body.default ? body.default : 'posts',
    options,
  };
}

/**
 * The state and the actions of the home page select above the theme settings. The component renders
 * the stores; the tests drive the actions with a stubbed API.
 *
 * @param {object} options
 * @param {ReturnType<import('./theme.api.js').createThemeApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {any} options.initial the answer of `GET /panel/theme/home`
 */
export function createHomeController({ api, notify, initial }) {
  const first = normalizeHome(initial);

  /** What the backend holds. */
  const saved = writable(first);

  /** The option id that stands for a stored value. */
  function selectionOf(model, value) {
    if (value === null) return model.default;
    if (value.startsWith(CUSTOM_PREFIX))
      return model.options.find((o) => o.kind === 'custom')?.id ?? '';

    return value;
  }

  const pathOf = (value) =>
    value !== null && value.startsWith(CUSTOM_PREFIX) ? value.slice(CUSTOM_PREFIX.length) : '';

  const selected = writable(selectionOf(first, first.value));
  const customPath = writable(pathOf(first.value));
  const saving = writable(false);
  /** The message of the last refused save: `{ code, key }`, or null. */
  const problem = writable(/** @type {{ code: string, key: string } | null} */ (null));

  /** True while the typed path option is the pick. */
  const customSelected = derived(
    [selected, saved],
    ([$selected, $saved]) => $saved.options.find((o) => o.id === $selected)?.kind === 'custom',
  );

  /** The path as typed, trimmed. */
  const trimmedPath = derived(customPath, ($path) => $path.trim());

  /** True when the typed path is missing or not a path the backend would take. */
  const pathInvalid = derived(
    [customSelected, trimmedPath],
    ([$custom, $path]) => $custom && !isConcretePath($path),
  );

  /** What `PUT` would send: null for the theme's default, an option id, or `custom:/path`. */
  const payload = derived(
    [selected, customSelected, trimmedPath, saved],
    ([$selected, $custom, $path, $saved]) => {
      if ($custom) return CUSTOM_PREFIX + $path;

      return $selected === $saved.default ? null : $selected;
    },
  );

  const effective = (model, value) => value ?? model.default;

  const dirty = derived(
    [payload, saved],
    ([$payload, $saved]) => effective($saved, $payload) !== effective($saved, $saved.value),
  );

  const canSave = derived(
    [dirty, pathInvalid, saving],
    ([$dirty, $invalid, $saving]) => $dirty && !$invalid && !$saving,
  );

  /** @param {string} id an option id; an option that is not available is ignored */
  function select(id) {
    const option = get(saved).options.find((o) => o.id === id);

    if (!option || !option.available) return;

    selected.set(id);
    problem.set(null);
  }

  async function save() {
    if (!get(canSave)) return false;

    const value = get(payload);

    saving.set(true);
    problem.set(null);

    const result = await api.saveHome(value);

    saving.set(false);

    if (!result.ok) {
      const code = result.error?.code ?? '';

      const key =
        code === 'INVALID_HOME_PAGE'
          ? 'errors.INVALID_HOME_PAGE'
          : 'pages.theme-settings.home.save-failed';

      problem.set({ code, key });
      notify.error(key);

      return false;
    }

    saved.update((model) => ({ ...model, value }));
    notify.success('pages.theme-settings.home.saved');

    return true;
  }

  return {
    saved,
    selected,
    customPath,
    customSelected,
    pathInvalid,
    payload,
    dirty,
    canSave,
    saving,
    problem,
    select,
    save,
  };
}
