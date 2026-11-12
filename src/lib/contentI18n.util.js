/**
 * Translatable admin content (ticket categories, ticket fields, the registration agreement): the
 * `i18n` object every such text carries, locale code → { prop: text }. The text of the normal input
 * is the default (the platform's language); a missing locale or a blank prop means "use the default".
 * Pure functions, no DOM. See the "translatable admin content" contract (wire shape, picking rule).
 */

import { OPTION_TYPES, PLACEHOLDER_TYPES } from './ticketFields.util.js';

/** Whether [text] holds something besides white space. */
function filled(text) {
  return typeof text === 'string' && text.trim() !== '';
}

/** The locale codes to try for [locale], in order: the exact code, then its language part. */
function candidates(locale) {
  const code = typeof locale === 'string' ? locale.trim() : '';

  if (!code) return [];

  const language = code.split(/[-_]/)[0];

  return language && language !== code ? [code, language] : [code];
}

/**
 * The text of [prop] for [locale]: `i18n[locale][prop]` when not blank, else the one of the locale's
 * language part (`tr` for `tr-TR`), else [defaultText].
 */
export function localized(defaultText, i18n, locale, prop) {
  for (const code of candidates(locale)) {
    const text = i18n?.[code]?.[prop];

    if (filled(text)) return text;
  }

  return defaultText;
}

/**
 * The label of [option] (`{ value, label }`) for [locale]: `i18n[locale].options[value]` with the same
 * fallback as [localized], else the option's own label (its value when it has none).
 */
export function localizedOption(option, i18n, locale) {
  const value = option?.value;

  for (const code of candidates(locale)) {
    const text = i18n?.[code]?.options?.[value];

    if (filled(text)) return text;
  }

  return filled(option?.label) ? option.label : String(value ?? '');
}

/**
 * The readable value of a ticket field snapshot [entry] for [locale]. SELECT / MULTISELECT are rebuilt
 * from the option values in `value` (MULTISELECT joined with ", "); other types give `display` as is.
 */
export function localizedDisplay(entry, locale) {
  const { type, value } = entry ?? {};

  if (type !== 'SELECT' && type !== 'MULTISELECT') return entry?.display ?? '';

  const values = (Array.isArray(value) ? value : [value]).filter(
    (item) => item !== null && item !== undefined && String(item).trim() !== '',
  );

  if (values.length === 0) return '';

  const options = new Map((entry.options ?? []).map((option) => [option.value, option]));

  return values
    .map((item) => localizedOption(options.get(item) ?? { value: item }, entry.i18n, locale))
    .join(', ');
}

/**
 * How many locales of [i18n] have a non-blank [prop] (with [option]: `options[option]`), not counting
 * [except] (the platform's own locale).
 */
export function countTranslations(i18n, prop, option = undefined, except = undefined) {
  return Object.entries(i18n ?? {}).filter(([code, texts]) => {
    if (code === except) return false;

    const text = option === undefined ? texts?.[prop] : texts?.[prop]?.[option];

    return filled(text);
  }).length;
}

/**
 * [i18n] trimmed to what is worth sending: only [props], only non-blank texts, no empty locales.
 * Unknown props are dropped.
 */
export function pruneI18n(i18n, props) {
  /** @type {Record<string, Record<string, string>>} */
  const result = {};

  for (const [code, texts] of Object.entries(i18n ?? {})) {
    /** @type {Record<string, string>} */
    const kept = {};

    for (const prop of props) {
      if (filled(texts?.[prop])) kept[prop] = texts[prop].trim();
    }

    if (Object.keys(kept).length > 0) result[code] = kept;
  }

  return result;
}

/**
 * A field definition ready for the editor: `field.i18n` keeps label / placeholder / help, and every
 * option gets its own `i18n` (`{ code: { label } }`). The option translations then follow the option
 * object, so renaming an option value carries them along. Changes [field] in place and returns it.
 */
export function toEditableField(field) {
  const i18n = field.i18n ?? {};

  field.options = (field.options ?? []).map((option) => {
    /** @type {Record<string, { label: string }>} */
    const own = {};

    for (const [code, texts] of Object.entries(i18n)) {
      const text = texts?.options?.[option.value];

      if (filled(text)) own[code] = { label: text };
    }

    return { ...option, i18n: own };
  });

  field.i18n = Object.fromEntries(
    Object.entries(i18n).map(([code, texts]) => {
      const { options, ...rest } = texts ?? {};

      return [code, { ...rest }];
    }),
  );

  return field;
}

/**
 * The wire `i18n` of an edited field: [edited] is the editor's field (options carry their own `i18n`),
 * [normalized] the same field after `normalizeDefinitions` (trimmed option values, cleared props of
 * other types). Option translations are keyed by the normalized value of the option at that position.
 */
export function fieldI18nForSave(edited, normalized) {
  const props = PLACEHOLDER_TYPES.has(normalized.type)
    ? ['label', 'placeholder', 'help']
    : ['label', 'help'];
  /** @type {Record<string, any>} */
  const result = pruneI18n(edited.i18n, props);

  if (OPTION_TYPES.has(normalized.type)) {
    (normalized.options ?? []).forEach((option, index) => {
      const own = edited.options?.[index]?.i18n ?? {};

      for (const [code, texts] of Object.entries(own)) {
        if (!filled(texts?.label) || !option.value) continue;

        result[code] ??= {};
        result[code].options ??= {};
        result[code].options[option.value] = texts.label.trim();
      }
    });
  }

  return result;
}

/** Whether any key of [errors] starts with [prefix]. */
export function hasErrorsWith(errors, prefix) {
  return Object.keys(errors ?? {}).some((key) => key.startsWith(prefix));
}

/**
 * A flat translation map (locale code → text, like `registerAgreementI18n`) in the shape the
 * translations button edits: locale code → { [prop]: text }.
 */
export function nestTranslations(flat, prop) {
  return Object.fromEntries(
    Object.entries(flat ?? {})
      .filter(([, text]) => typeof text === 'string')
      .map(([code, text]) => [code, { [prop]: text }]),
  );
}

/** The other way round: locale code → text, blank texts left out, the rest trimmed. */
export function flattenTranslations(nested, prop) {
  return Object.fromEntries(
    Object.entries(pruneI18n(nested, [prop])).map(([code, texts]) => [code, texts[prop]]),
  );
}

/** Whether [html] is an empty editor document: nothing, or only empty paragraphs. */
export function isBlankHtml(html) {
  return (
    typeof html !== 'string' ||
    html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '').trim() === ''
  );
}

/**
 * A post's `i18n` (locale code → { title, text }) trimmed to what is worth sending: an empty editor
 * document counts as no text, blank titles are left out, and so are locales left with nothing.
 */
export function prunePostI18n(i18n) {
  const cleared = Object.fromEntries(
    Object.entries(i18n ?? {}).map(([code, texts]) => [
      code,
      { ...texts, text: isBlankHtml(texts?.text) ? '' : texts.text },
    ]),
  );

  return pruneI18n(cleared, ['title', 'text']);
}

/** The locale codes named by `i18n.<code>.<prop>` keys of [errors], in the order they come. */
export function errorLocales(errors) {
  const codes = [];

  for (const key of Object.keys(errors ?? {})) {
    const match = /^i18n\.([^.]+)\./.exec(key);

    if (match && !codes.includes(match[1])) codes.push(match[1]);
  }

  return codes;
}
