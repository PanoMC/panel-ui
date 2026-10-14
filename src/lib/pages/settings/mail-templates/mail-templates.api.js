/**
 * The panel API of the mail template editor (`/api/v1/panel/mail-templates...`) and the small pure
 * helpers its pages share.
 *
 * Every call answers `{ ok, body, error }`; the HTTP client is passed in (`ApiUtil` in the panel, a
 * stub in tests).
 */

/** The owner of the platform's own mails. */
export const CORE_OWNER = 'core';

/** The variant of a mail without sub-kinds. */
export const DEFAULT_VARIANT = 'default';

/** `template.mode`: the shared layout with fields, or one complete HTML document. */
export const Modes = Object.freeze({ FIELDS: 'FIELDS', HTML: 'HTML' });

/** The fields of a template object, in the order the editor shows them. */
export const TEMPLATE_FIELDS = Object.freeze([
  'subject',
  'preheader',
  'body',
  'buttonLabel',
  'buttonUrl',
  'footer',
]);

/** Always available in every mail, never declared by it (spec §2). */
export const SYSTEM_VARIABLES = Object.freeze([
  { name: 'websiteName', type: 'text' },
  { name: 'websiteUrl', type: 'url' },
  { name: 'year', type: 'number' },
]);

/**
 * @param {any} body what the client resolved with
 * @returns {{ ok: boolean, body: any, error: { code: string, message: string, details: Record<string, any>, fields: Record<string, any> } | null }}
 */
export function toResult(body) {
  // The demo guard resolves with nothing (the client shows its own toast).
  if (body === undefined || body === null) {
    return {
      ok: false,
      body: null,
      error: { code: 'DISABLED_FOR_DEMO', message: '', details: {}, fields: {} },
    };
  }

  const error = body.error;

  if (error) {
    const code = typeof error === 'string' ? error : String(error.code ?? '');

    return {
      ok: false,
      body,
      error: {
        code,
        message: String(error.message ?? error.details?.message ?? ''),
        details: error.details ?? {},
        fields: error.fields ?? {},
      },
    };
  }

  return { ok: true, body, error: null };
}

/**
 * @param {string} owner
 * @param {string} key
 * @param {string} variant
 * @param {string} locale
 */
function templatePath(owner, key, variant, locale) {
  return `/panel/mail-templates/${[owner, key, variant, locale].map(encodeURIComponent).join('/')}`;
}

/**
 * @param {{ get: Function, post: Function, put: Function, delete: Function }} client
 * @param {any} [request] the SvelteKit load event, for a call made while loading
 */
export function createMailTemplatesApi(client, request) {
  const call = async (method, options) => toResult(await client[method]({ request, ...options }));

  return {
    /** `{ items, locales, layoutCustomized }` */
    list: () => call('get', { path: '/panel/mail-templates' }),

    /** `{ template, default, customized, defaultLocale, variables }` */
    get: (owner, key, variant, locale) =>
      call('get', { path: templatePath(owner, key, variant, locale) }),

    save: (owner, key, variant, locale, template) =>
      call('put', { path: templatePath(owner, key, variant, locale), body: template }),

    reset: (owner, key, variant, locale) =>
      call('delete', { path: templatePath(owner, key, variant, locale) }),

    /** `{ subject, html, text }` rendered with the sample variables. */
    preview: (body) => call('post', { path: '/panel/mail-templates/preview', body }),

    /** Sends the rendered, unsaved mail to the signed-in admin. */
    test: (body) => call('post', { path: '/panel/mail-templates/test', body }),

    /** `{ body, default, customized }` */
    getLayout: () => call('get', { path: '/panel/mail-templates/layout' }),

    saveLayout: (body) => call('put', { path: '/panel/mail-templates/layout', body: { body } }),

    resetLayout: () => call('delete', { path: '/panel/mail-templates/layout' }),
  };
}

/**
 * A template object with every field a string (the API sends `""` for a missing one, but a stub or
 * an older backend may not).
 *
 * @param {any} template
 * @returns {{ mode: string, subject: string, preheader: string, body: string, buttonLabel: string, buttonUrl: string, footer: string }}
 */
export function normalizeTemplate(template) {
  const result = { mode: template?.mode === Modes.HTML ? Modes.HTML : Modes.FIELDS };

  for (const field of TEMPLATE_FIELDS) result[field] = String(template?.[field] ?? '');

  return result;
}

/**
 * What the "Insert variable" menu inserts: `{{{name}}}` for a pre-rendered HTML block, `{{name}}`
 * (escaped) for everything else.
 *
 * @param {{ name: string, type?: string }} variable
 * @returns {string}
 */
export function variableToken(variable) {
  return variable.type === 'html' ? `{{{${variable.name}}}}` : `{{${variable.name}}}`;
}

/**
 * The mails grouped by owner: Pano core first, then each plugin by its name.
 *
 * @param {Array<{ owner: string, pluginName?: string | null, pluginId?: string | null }>} items
 * @returns {Array<{ owner: string, pluginName: string | null, items: any[] }>}
 */
export function groupByOwner(items) {
  /** @type {Map<string, { owner: string, pluginName: string | null, items: any[] }>} */
  const groups = new Map();

  for (const item of items ?? []) {
    const owner = item.owner || CORE_OWNER;

    if (!groups.has(owner)) {
      groups.set(owner, {
        owner,
        pluginName: owner === CORE_OWNER ? null : item.pluginName || item.pluginId || owner,
        items: [],
      });
    }

    groups.get(owner).items.push(item);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.owner === CORE_OWNER) return -1;
    if (b.owner === CORE_OWNER) return 1;

    return a.pluginName.localeCompare(b.pluginName);
  });
}

/**
 * The locales customized in any variant of a mail, without duplicates and in list order.
 *
 * @param {{ variants?: Array<{ customizedLocales?: string[] }> }} mail
 * @returns {string[]}
 */
export function customizedLocalesOf(mail) {
  return [...new Set((mail.variants ?? []).flatMap((variant) => variant.customizedLocales ?? []))];
}

/**
 * The locale the editor opens in: the asked one when enabled, else the panel's language, else
 * `en-US`, else the first enabled one.
 *
 * @param {Array<{ code: string }>} locales the enabled locales
 * @param {...(string | null | undefined)} wanted in order of preference
 * @returns {string}
 */
export function pickLocale(locales, ...wanted) {
  const codes = (locales ?? []).map((item) => item.code);

  for (const code of [...wanted, 'en-US']) {
    if (code && codes.includes(code)) return code;
  }

  return codes[0] ?? 'en-US';
}

/**
 * The field errors of an `INVALID_FIELDS` answer, as `{ field: { code, message } }`. A field value
 * may be a code or an object with its own message; the error's `message` goes with template errors.
 *
 * @param {{ code: string, message?: string, fields?: Record<string, any> } | null} error
 * @returns {Record<string, { code: string, message: string }>}
 */
export function fieldErrorsOf(error) {
  if (!error || error.code !== 'INVALID_FIELDS') return {};

  /** @type {Record<string, { code: string, message: string }>} */
  const result = {};

  for (const [field, value] of Object.entries(error.fields ?? {})) {
    const code = typeof value === 'object' && value ? String(value.code ?? '') : String(value);
    const own = typeof value === 'object' && value ? String(value.message ?? '') : '';

    result[field] = {
      code,
      message: own || (code === 'TEMPLATE_ERROR' ? String(error.message ?? '') : ''),
    };
  }

  return result;
}

/**
 * A sample body for the layout preview: the layout's `{{{content}}}` replaced by a paragraph and
 * the other slots by plain sample values. Only for looking at the layout; mails are rendered by
 * the backend.
 *
 * @param {string} layout
 * @param {Record<string, string>} samples
 * @returns {string}
 */
export function renderLayoutSample(layout, samples) {
  return (
    String(layout ?? '')
      // Every condition counts as true: its `{{else}}` part goes, its own tags go.
      .replace(/\{\{~?\s*else\s*~?\}\}[\s\S]*?\{\{~?\s*\/(if|unless)\s*~?\}\}/g, '')
      .replace(/\{\{~?\s*(#(if|unless|with)\b[^}]*|\/(if|unless|with)\s*)~?\}\}/g, '')
      .replace(/\{\{\{\s*content\s*\}\}\}/g, samples.content ?? '')
      .replace(/\{\{\{?\s*([A-Za-z0-9_]+)\s*\}?\}\}/g, (match, name) =>
        Object.hasOwn(samples, name) ? escapeHtml(samples[name]) : match,
      )
  );
}

/**
 * The sample values the layout preview fills the layout with (the editor's and the preview
 * window's).
 *
 * @param {(key: string) => string} t the translate function (`$_`)
 * @returns {Record<string, string>}
 */
export function layoutSampleValues(t) {
  return {
    content: `<p>${t('pages.mail-templates.layout.sample-content')}</p>`,
    subject: t('pages.mail-templates.layout.sample-subject'),
    preheader: t('pages.mail-templates.layout.sample-preheader'),
    buttonLabel: t('pages.mail-templates.layout.sample-button'),
    buttonUrl: '#',
    footer: t('pages.mail-templates.layout.sample-footer'),
    websiteName: 'Pano',
    websiteUrl: '#',
    websiteLogo: '',
    year: String(new Date().getFullYear()),
    locale: 'en',
  };
}

/** @param {string} value */
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** The mark the layout must keep, or the mail body has nowhere to go. */
export const LAYOUT_CONTENT_SLOT = '{{{content}}}';
