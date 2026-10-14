/**
 * The mail template editor ↔ its preview window (`/panel/mail-templates/preview?owner=&key=&variant=`):
 * the editor publishes what it renders (the unsaved draft: locale, template, sample variables) to
 * localStorage, the window reads it and follows every change through the `storage` event. The
 * layout editor publishes under {@link LAYOUT_PREVIEW} and the window renders it locally.
 *
 * Browser only; no `$lib` / `$app` imports (unit-tested with bun).
 */

const PREFIX = 'pano-panel-mail-preview:';

/** Where the layout editor's draft goes: owner `core`, key `_layout`. */
export const LAYOUT_PREVIEW = Object.freeze({ owner: 'core', key: '_layout', variant: '' });

/**
 * @param {{ owner?: string | null, key?: string | null, variant?: string | null }} target
 * @returns {boolean}
 */
export function isLayoutPreview(target) {
  return target?.owner === LAYOUT_PREVIEW.owner && target?.key === LAYOUT_PREVIEW.key;
}

/**
 * The localStorage key of one mail's draft.
 *
 * @param {string} owner
 * @param {string} key
 * @param {string | null | undefined} variant
 */
export const previewKey = (owner, key, variant) => `${PREFIX}${owner}:${key}:${variant ?? ''}`;

/**
 * The window's URL for a mail.
 *
 * @param {string} base the app's base path (`/panel`)
 * @param {string} owner
 * @param {string} key
 * @param {string | null | undefined} variant
 */
export function previewWindowHref(base, owner, key, variant) {
  const params = new URLSearchParams({ owner, key });

  if (variant) params.set('variant', variant);

  return `${base}/mail-templates/preview?${params}`;
}

/**
 * Saves the draft the window shows: `{ body, title, at }` for a mail (`body` = the preview request
 * body, its `variables` the editor's data) or `{ layout, title, at }` for the layout.
 *
 * @param {Pick<Storage, 'setItem'>} storage
 * @param {string} owner
 * @param {string} key
 * @param {string | null | undefined} variant
 * @param {Record<string, any>} draft
 */
export function publishPreview(storage, owner, key, variant, draft) {
  try {
    storage.setItem(previewKey(owner, key, variant), JSON.stringify({ ...draft, at: Date.now() }));
  } catch {
    // Storage full or blocked: the window then shows its empty state.
  }
}

/**
 * The published draft, or null.
 *
 * @param {Pick<Storage, 'getItem'>} storage
 * @param {string} owner
 * @param {string} key
 * @param {string | null | undefined} variant
 */
export function readPreview(storage, owner, key, variant) {
  try {
    const raw = storage.getItem(previewKey(owner, key, variant));

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Device widths of the window's toolbar (`null` = the full window). */
export const PREVIEW_WIDTHS = Object.freeze([
  { id: 'mobile', width: 375, icon: 'fa-mobile-screen' },
  { id: 'tablet', width: 768, icon: 'fa-tablet-screen-button' },
  { id: 'desktop', width: 1024, icon: 'fa-desktop' },
  { id: 'full', width: null, icon: 'fa-up-right-and-down-left-from-center' },
]);

/**
 * The variables a mail previews with: each declared variable's sample, a missing boolean sample
 * counting as true so `{{#if}}` blocks show (the backend's `sampleValue()`).
 *
 * @param {Array<{ name: string, type?: string, sample?: any }>} variables
 * @returns {Record<string, any>}
 */
export function sampleVariables(variables) {
  /** @type {Record<string, any>} */
  const result = {};

  for (const variable of variables ?? []) {
    const sample = variable.sample;

    if (variable.type === 'boolean') {
      result[variable.name] =
        sample == null
          ? true
          : typeof sample === 'boolean'
            ? sample
            : String(sample).toLowerCase() === 'true';
    } else {
      result[variable.name] = sample ?? '';
    }
  }

  return result;
}

/**
 * Whether a text is a JSON object (the only shape the data box accepts).
 *
 * @param {string | null | undefined} text
 */
export function isDataObject(text) {
  if (text == null) return false;

  try {
    const value = JSON.parse(text);

    return !!value && typeof value === 'object' && !Array.isArray(value);
  } catch {
    return false;
  }
}

/**
 * The request the window renders: the editor's body with the window's own variables when its JSON
 * is a valid object, else the editor's.
 *
 * @param {Record<string, any> | null} body
 * @param {string | null} dataText
 */
export function windowBody(body, dataText) {
  if (!body) return null;
  if (!isDataObject(dataText)) return body;

  return { ...body, variables: JSON.parse(/** @type {string} */ (dataText)) };
}
