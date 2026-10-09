/**
 * Plain helpers of the Front-end page (doc 05 section 8): the modes, the shape of the state the
 * panel API answers with, and the error codes turned into lang keys.
 */

/** @typedef {'THEME' | 'CUSTOM_APP' | 'EXTERNAL' | 'NONE'} FrontendModeName */

/** @type {Readonly<Record<FrontendModeName, FrontendModeName>>} */
export const FrontendModes = Object.freeze({
  THEME: 'THEME',
  CUSTOM_APP: 'CUSTOM_APP',
  EXTERNAL: 'EXTERNAL',
  NONE: 'NONE',
});

/**
 * The modes in the order the page lists them, with their lang keys and icon.
 * @type {ReadonlyArray<{ value: FrontendModeName, icon: string, titleKey: string, descriptionKey: string }>}
 */
export const frontendModeOptions = Object.freeze([
  {
    value: FrontendModes.THEME,
    icon: 'fa-solid fa-palette',
    titleKey: 'pages.frontend.mode.theme.title',
    descriptionKey: 'pages.frontend.mode.theme.description',
  },
  {
    value: FrontendModes.CUSTOM_APP,
    icon: 'fa-solid fa-box-open',
    titleKey: 'pages.frontend.mode.custom-app.title',
    descriptionKey: 'pages.frontend.mode.custom-app.description',
  },
  {
    value: FrontendModes.EXTERNAL,
    icon: 'fa-solid fa-arrow-right-arrow-left',
    titleKey: 'pages.frontend.mode.external.title',
    descriptionKey: 'pages.frontend.mode.external.description',
  },
  {
    value: FrontendModes.NONE,
    icon: 'fa-solid fa-ban',
    titleKey: 'pages.frontend.mode.none.title',
    descriptionKey: 'pages.frontend.mode.none.description',
  },
]);

/** The biggest custom-app zip the backend takes (doc 05 section 8). */
export const MAX_CUSTOM_APP_BYTES = 100 * 1024 * 1024;

/**
 * @typedef {object} CustomApp
 * @property {string} id
 * @property {string} title
 * @property {string} version
 * @property {string} author
 * @property {string | null} description
 * @property {number | null} apiLevel
 * @property {number | null} installedAt
 * @property {boolean} active
 */

/**
 * @typedef {object} FrontendState
 * @property {FrontendModeName} mode
 * @property {string} customAppId
 * @property {string} upstreamUrl
 * @property {string} siteUrl
 * @property {string} descriptorUrl
 * @property {string} devUrl
 * @property {CustomApp[]} customApps
 * @property {boolean} running
 * @property {string} activeId
 * @property {boolean} devUrlActive
 */

/**
 * The answer of `GET /panel/frontend` with every field present, so a template never reads
 * `undefined`. Anything the backend does not know is the empty value of its type.
 *
 * @param {any} body
 * @returns {FrontendState}
 */
export function normalizeFrontendState(body) {
  const text = (value) => (typeof value === 'string' ? value : '');
  const mode = Object.values(FrontendModes).includes(body?.mode) ? body.mode : FrontendModes.THEME;

  return {
    mode,
    customAppId: text(body?.customAppId),
    upstreamUrl: text(body?.upstreamUrl),
    siteUrl: text(body?.siteUrl),
    descriptorUrl: text(body?.descriptorUrl),
    devUrl: text(body?.devUrl),
    customApps: Array.isArray(body?.customApps)
      ? body.customApps.map((app) => ({
          id: text(app?.id),
          title: text(app?.title) || text(app?.id),
          version: text(app?.version),
          author: text(app?.author),
          description: typeof app?.description === 'string' ? app.description : null,
          apiLevel: Number.isFinite(app?.apiLevel) ? app.apiLevel : null,
          installedAt: Number.isFinite(app?.installedAt) ? app.installedAt : null,
          active: app?.active === true,
        }))
      : [],
    running: body?.running === true,
    activeId: text(body?.activeId),
    devUrlActive: body?.devUrlActive === true,
  };
}

/**
 * What the Mode tab sends to `PUT /panel/frontend` for a draft: only the fields the chosen mode
 * uses, so a switch never clears the values of another mode by accident.
 *
 * @param {Pick<FrontendState, 'mode' | 'customAppId' | 'upstreamUrl' | 'siteUrl' | 'descriptorUrl'>} draft
 * @param {{ force?: boolean }} [options] `force` saves an unreachable EXTERNAL upstream anyway.
 * @returns {Record<string, string | boolean>}
 */
export function buildModeBody(draft, { force = false } = {}) {
  const body = { mode: draft.mode };

  if (draft.mode === FrontendModes.CUSTOM_APP) {
    body.customAppId = draft.customAppId;
  }

  if (draft.mode === FrontendModes.EXTERNAL) {
    body.upstreamUrl = draft.upstreamUrl.trim();
  }

  if (draft.mode !== FrontendModes.THEME) {
    body.siteUrl = draft.siteUrl.trim();
  }

  if (draft.mode === FrontendModes.EXTERNAL || draft.mode === FrontendModes.NONE) {
    body.descriptorUrl = draft.descriptorUrl.trim();
  }

  if (force) {
    body.force = true;
  }

  return body;
}

/**
 * Whether the draft differs from what is stored, looking only at the fields its mode uses.
 *
 * @param {FrontendState} saved
 * @param {Pick<FrontendState, 'mode' | 'customAppId' | 'upstreamUrl' | 'siteUrl' | 'descriptorUrl'>} draft
 */
export function isModeDirty(saved, draft) {
  const next = buildModeBody(draft);
  const current = buildModeBody(saved);

  return JSON.stringify(next) !== JSON.stringify(current);
}

/**
 * Whether the draft can be sent: CUSTOM_APP needs an app, EXTERNAL needs an address.
 * @param {Pick<FrontendState, 'mode' | 'customAppId' | 'upstreamUrl'>} draft
 */
export function isModeComplete(draft) {
  if (draft.mode === FrontendModes.CUSTOM_APP) return draft.customAppId.trim() !== '';
  if (draft.mode === FrontendModes.EXTERNAL) return draft.upstreamUrl.trim() !== '';

  return true;
}

/** The error codes this page writes a message for (doc 05 section 8 and the upload limit). */
const KNOWN_ERRORS = new Set([
  'CUSTOM_APP_INVALID_MANIFEST',
  'CUSTOM_APP_NO_ENTRY',
  'CUSTOM_APP_ID_TAKEN',
  'CUSTOM_APP_API_LEVEL',
  'CUSTOM_APP_ACTIVE',
  'UPSTREAM_INVALID_URL',
  'UPSTREAM_IS_PANO',
  'UPSTREAM_UNREACHABLE',
  'DESCRIPTOR_HOST_NOT_ALLOWED',
  'FRONTEND_START_FAILED',
  'FILE_TOO_LARGE',
  'NOT_A_ZIP',
  'FRONTEND_KEY_LIMIT_REACHED',
  'ORIGIN_DIFFERENT_SITE',
  'ORIGIN_LIMIT_REACHED',
  'FRONTEND_SETTINGS_NO_SCHEMA',
  'FRONTEND_SETTINGS_SCHEMA_INVALID',
  'FRONTEND_SETTING_INVALID',
  'INVALID_FIELDS',
  'DISABLED_FOR_DEMO',
  'NETWORK_ERROR',
]);

/**
 * The lang key and the values of the message for a failed call.
 *
 * @param {{ code?: string, details?: Record<string, any>, fields?: Record<string, any> }} error
 * @returns {{ key: string, values: Record<string, string> }}
 */
export function describeError(error) {
  const code = error?.code ?? '';
  const details = error?.details ?? {};

  if (!KNOWN_ERRORS.has(code)) {
    return { key: 'pages.frontend.errors.UNKNOWN', values: {} };
  }

  const values = {};

  for (const name of ['field', 'id', 'apiLevel', 'min', 'current', 'message', 'key', 'reason']) {
    if (details[name] != null) values[name] = String(details[name]);
  }

  return { key: `pages.frontend.errors.${code}`, values };
}

/**
 * The text a copy button puts on the clipboard for the lines of a created key.
 * @param {string[]} lines
 */
export function envText(lines) {
  return (Array.isArray(lines) ? lines : []).join('\n');
}

/** The key as the list shows it: only the last four characters are known. */
export function maskKey(hint) {
  return `pfk_${'•'.repeat(8)}${hint ?? ''}`;
}
