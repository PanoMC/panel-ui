/**
 * Custom fields of a ticket category: the rules shared by the category editor, the ticket detail card
 * and the field edit modal. Pure functions, no DOM; the backend is the authority, these mirror its
 * checks for instant feedback. See the "ticket category fields" contract (definition, values,
 * visibility).
 */

/** Every field type, in the order the editor offers them. */
export const FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'EMAIL',
  'URL',
  'DATE',
  'SELECT',
  'MULTISELECT',
  'CHECKBOX',
];

/** Condition operators, in the order the editor offers them. */
export const OPERATORS = ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'FILLED', 'EMPTY'];

/** Operators that compare with the rule's `value`. */
export const VALUE_OPERATORS = new Set(['EQUALS', 'NOT_EQUALS', 'CONTAINS']);

export const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MAX_FIELDS = 30;
export const MAX_OPTIONS = 50;
export const MAX_RULES = 10;
export const MAX_LABEL = 100;
export const MAX_PLACEHOLDER = 150;
export const MAX_HELP = 300;
export const MAX_EMAIL = 254;
export const MAX_URL = 500;

/** The length limit of a text field whose `max` is null, and the highest `max` it may set. */
export const DEFAULT_MAX_LENGTH = { TEXT: 200, TEXTAREA: 2000 };
export const HARD_MAX_LENGTH = { TEXT: 500, TEXTAREA: 5000 };

/** Types with a list of options. */
export const OPTION_TYPES = new Set(['SELECT', 'MULTISELECT']);

/** Types whose `min` / `max` mean something (value bounds for NUMBER, length bounds for text). */
export const BOUND_TYPES = new Set(['NUMBER', 'TEXT', 'TEXTAREA']);

/** Types that show a placeholder. */
export const PLACEHOLDER_TYPES = new Set(['TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'URL']);

/** Types whose CONTAINS is a substring search. */
// CONTAINS searches as text only in these; for DATE, SELECT, NUMBER and CHECKBOX it is EQUALS (same as the server and the theme).
const SUBSTRING_TYPES = new Set(['TEXT', 'TEXTAREA', 'EMAIL', 'URL']);

/** A new, empty field definition. */
export function newField(key = '') {
  return {
    key,
    label: '',
    type: 'TEXT',
    required: false,
    placeholder: '',
    help: '',
    options: [],
    min: null,
    max: null,
    conditions: null,
  };
}

/** Empty = absent, null, a blank string, an empty array, or `false` for a CHECKBOX. */
export function isEmpty(type, value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (type === 'CHECKBOX') return value !== true;

  return false;
}

/** The value as a number, or NaN: a JSON number, or a numeric string. */
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value.trim());

  return NaN;
}

function lower(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function equals(type, value, expected) {
  switch (type) {
    case 'MULTISELECT':
      return Array.isArray(value) && value.includes(String(expected ?? '').trim());
    case 'CHECKBOX':
      return String(value === true) === String(expected ?? '').trim();
    case 'NUMBER': {
      const a = toNumber(value);
      const b = toNumber(expected);

      return Number.isFinite(a) && Number.isFinite(b) && a === b;
    }
    default:
      if (Array.isArray(value) || (value !== null && typeof value === 'object')) return false;

      return lower(value) === lower(expected);
  }
}

/** Whether one condition [rule] holds for the referenced field of [type] holding [value]. */
export function ruleHolds(rule, type, value) {
  switch (rule?.op) {
    case 'FILLED':
      return !isEmpty(type, value);
    case 'EMPTY':
      return isEmpty(type, value);
    case 'EQUALS':
      return equals(type, value, rule.value);
    case 'NOT_EQUALS':
      return !equals(type, value, rule.value);
    case 'CONTAINS':
      if (SUBSTRING_TYPES.has(type)) {
        return typeof value === 'string' && lower(value).includes(lower(rule.value));
      }

      return equals(type, value, rule.value);
    default:
      return false;
  }
}

/**
 * The visible definitions, in order. A field is visible when it has no conditions, or when all (ALL)
 * / at least one (ANY) of its rules hold. A rule reads the referenced field's value; a field that is
 * not visible (or not an earlier one) counts as empty.
 */
export function visibleFields(definitions, values = {}) {
  /** @type {Map<string, any>} key → definition of the earlier fields */
  const earlier = new Map();
  /** @type {Set<string>} keys of the earlier fields that are visible */
  const visible = new Set();
  const result = [];

  for (const definition of definitions ?? []) {
    const conditions = definition.conditions;
    let shown = true;

    if (conditions) {
      const rules = conditions.rules ?? [];
      const check = (rule) => {
        const reference = earlier.get(rule.field);
        const value = reference && visible.has(rule.field) ? values?.[rule.field] : undefined;

        return ruleHolds(rule, reference?.type ?? 'TEXT', value);
      };

      shown = conditions.match === 'ANY' ? rules.some(check) : rules.every(check);
    }

    if (!earlier.has(definition.key)) {
      earlier.set(definition.key, definition);

      if (shown) visible.add(definition.key);
    }

    if (shown) result.push(definition);
  }

  return result;
}

/** Whether [value] is a real `YYYY-MM-DD` date. */
export function isValidDate(value) {
  const match = typeof value === 'string' ? DATE_PATTERN.exec(value.trim()) : null;

  if (!match) return false;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Whether [value] is an absolute http(s) address. */
export function isHttpUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return false;

  try {
    const url = new URL(value.trim());

    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  } catch {
    return false;
  }
}

/**
 * Checks one value against its definition (type, options, min / max, and `required` unless
 * `enforceRequired` is false). Returns the error code (`REQUIRED`, `INVALID`, `TOO_SHORT`,
 * `TOO_LONG`, `OUT_OF_RANGE`, `UNKNOWN_OPTION`) or null.
 */
export function validateValue(definition, value, { enforceRequired = true } = {}) {
  const type = definition.type;

  if (isEmpty(type, value)) {
    if (type === 'CHECKBOX' && value !== undefined && value !== null && typeof value !== 'boolean')
      return 'INVALID';

    return enforceRequired && definition.required ? 'REQUIRED' : null;
  }

  const min = definition.min ?? null;
  const max = definition.max ?? null;

  switch (type) {
    case 'TEXT':
    case 'TEXTAREA': {
      if (typeof value !== 'string') return 'INVALID';

      const length = value.trim().length;
      const limit = Math.min(max ?? DEFAULT_MAX_LENGTH[type], HARD_MAX_LENGTH[type]);

      if (length > limit) return 'TOO_LONG';
      if (min !== null && length < min) return 'TOO_SHORT';

      return null;
    }
    case 'EMAIL': {
      if (typeof value !== 'string') return 'INVALID';

      const text = value.trim();

      if (text.length > MAX_EMAIL) return 'TOO_LONG';

      return EMAIL_PATTERN.test(text) ? null : 'INVALID';
    }
    case 'URL': {
      if (typeof value !== 'string') return 'INVALID';
      if (value.trim().length > MAX_URL) return 'TOO_LONG';

      return isHttpUrl(value) ? null : 'INVALID';
    }
    case 'DATE':
      return isValidDate(value) ? null : 'INVALID';
    case 'NUMBER': {
      const number = toNumber(value);

      if (!Number.isFinite(number)) return 'INVALID';
      if ((min !== null && number < min) || (max !== null && number > max)) return 'OUT_OF_RANGE';

      return null;
    }
    case 'SELECT': {
      if (typeof value !== 'string') return 'INVALID';

      return (definition.options ?? []).some((option) => option.value === value.trim())
        ? null
        : 'UNKNOWN_OPTION';
    }
    case 'MULTISELECT': {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return 'INVALID';
      if (new Set(value).size !== value.length) return 'INVALID';

      const known = new Set((definition.options ?? []).map((option) => option.value));

      return value.every((item) => known.has(item)) ? null : 'UNKNOWN_OPTION';
    }
    case 'CHECKBOX':
      return typeof value === 'boolean' ? null : 'INVALID';
    default:
      return 'INVALID';
  }
}

/** The value as it is sent: strings trimmed, numbers parsed, empty values as null. */
export function normalizeValue(type, value) {
  if (type === 'CHECKBOX') return value === true;
  if (isEmpty(type, value)) return null;
  if (type === 'NUMBER') {
    const number = toNumber(value);

    return Number.isFinite(number) ? number : value;
  }
  if (typeof value === 'string') return value.trim();

  return value;
}

/**
 * The readable value of a snapshot [entry] for the ticket detail, or '' when it is empty. [t] is the
 * `$_` function (Yes / No of a checkbox), [locale] the UI locale (dates).
 */
export function displayValue(entry, t, locale) {
  const { type, value } = entry ?? {};

  if (type === 'CHECKBOX') {
    if (value === true) return t('buttons.yes');
    if (value === false) return t('buttons.no');

    return '';
  }

  if (isEmpty(type, value)) return '';

  if (type === 'DATE' && isValidDate(value)) {
    const [year, month, day] = value.trim().split('-').map(Number);

    try {
      return new Intl.DateTimeFormat(locale || undefined, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(year, month - 1, day)));
    } catch {
      return value;
    }
  }

  if (OPTION_TYPES.has(type)) {
    if (entry.display) return entry.display;

    const labels = new Map((entry.options ?? []).map((option) => [option.value, option.label]));

    return (Array.isArray(value) ? value : [value])
      .map((item) => labels.get(item) ?? item)
      .join(', ');
  }

  return entry.display || String(value);
}

/** The link of a snapshot [entry]: an http(s) URL, or `mailto:` for an e-mail; else null. */
export function fieldLink(entry) {
  const { type, value } = entry ?? {};

  if (type === 'URL' && isHttpUrl(value)) return value.trim();
  if (type === 'EMAIL' && typeof value === 'string' && EMAIL_PATTERN.test(value.trim()))
    return 'mailto:' + value.trim();

  return null;
}

const TRANSLITERATION = {
  ı: 'i',
  İ: 'i',
  ş: 's',
  Ş: 's',
  ğ: 'g',
  Ğ: 'g',
  ç: 'c',
  Ç: 'c',
  ö: 'o',
  Ö: 'o',
  ü: 'u',
  Ü: 'u',
  ß: 'ss',
};

/** A field key suggested from [label]: lowercase letters, digits and dashes; '' when none is left. */
export function slugKey(label) {
  return String(label ?? '')
    .replace(/[ıİşŞğĞçÇöÖüÜß]/g, (char) => TRANSLITERATION[char])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** [base] (or `field`) made unique among [taken] keys by a number suffix, within 40 characters. */
export function uniqueKey(base, taken) {
  const root = base || 'field';
  const used = new Set(taken);

  if (!used.has(root)) return root;

  for (let number = 2; ; number++) {
    const suffix = '-' + number;
    const candidate = root.slice(0, 40 - suffix.length).replace(/-+$/g, '') + suffix;

    if (!used.has(candidate)) return candidate;
  }
}

function blank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function isBound(value) {
  return value === null || value === undefined || value === '';
}

/**
 * Checks the definitions as the category editor sends them. Returns the errors in the server's
 * shape, e.g. `{ "fields.2.key": "DUPLICATE", "fields.4.conditions.rules.0.field": "UNKNOWN_FIELD" }`;
 * an empty object when all is well.
 */
export function validateDefinitions(fields) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (!Array.isArray(fields)) return { fields: 'INVALID' };
  if (fields.length > MAX_FIELDS) errors.fields = 'TOO_MANY';

  /** @type {Map<string, any>} key → definition of the earlier fields */
  const earlier = new Map();

  fields.forEach((field, index) => {
    const at = `fields.${index}.`;
    const type = field.type;
    const key = typeof field.key === 'string' ? field.key.trim() : '';

    if (key === '') errors[at + 'key'] = 'REQUIRED';
    else if (!KEY_PATTERN.test(key)) errors[at + 'key'] = 'INVALID';
    else if (earlier.has(key)) errors[at + 'key'] = 'DUPLICATE';

    if (blank(field.label)) errors[at + 'label'] = 'REQUIRED';
    else if (field.label.trim().length > MAX_LABEL) errors[at + 'label'] = 'TOO_LONG';

    if (!FIELD_TYPES.includes(type)) errors[at + 'type'] = 'INVALID';

    if (PLACEHOLDER_TYPES.has(type) && (field.placeholder ?? '').trim().length > MAX_PLACEHOLDER)
      errors[at + 'placeholder'] = 'TOO_LONG';

    if ((field.help ?? '').trim().length > MAX_HELP) errors[at + 'help'] = 'TOO_LONG';

    if (OPTION_TYPES.has(type)) {
      const options = Array.isArray(field.options) ? field.options : [];
      const values = new Set();

      if (options.length === 0) errors[at + 'options'] = 'REQUIRED';
      else if (options.length > MAX_OPTIONS) errors[at + 'options'] = 'TOO_MANY';

      options.forEach((option, optionIndex) => {
        const optionAt = `${at}options.${optionIndex}.`;
        const value = typeof option.value === 'string' ? option.value.trim() : '';

        if (value === '') errors[optionAt + 'value'] = 'REQUIRED';
        else if (!KEY_PATTERN.test(value)) errors[optionAt + 'value'] = 'INVALID';
        else if (values.has(value)) errors[optionAt + 'value'] = 'DUPLICATE';

        values.add(value);

        if (blank(option.label)) errors[optionAt + 'label'] = 'REQUIRED';
        else if (option.label.trim().length > MAX_LABEL) errors[optionAt + 'label'] = 'TOO_LONG';
      });
    }

    if (BOUND_TYPES.has(type)) {
      const integer = type !== 'NUMBER';
      const bounds = {};

      for (const name of ['min', 'max']) {
        const raw = field[name];

        if (isBound(raw)) continue;

        const number = toNumber(raw);

        if (!Number.isFinite(number) || (integer && (!Number.isInteger(number) || number < 0))) {
          errors[at + name] = 'INVALID';
          continue;
        }

        if (integer && name === 'max' && number > HARD_MAX_LENGTH[type]) {
          errors[at + name] = 'OUT_OF_RANGE';
          continue;
        }

        bounds[name] = number;
      }

      if (bounds.min !== undefined && bounds.max !== undefined && bounds.min > bounds.max)
        errors[at + 'min'] = 'OUT_OF_RANGE';
    }

    const conditions = field.conditions;

    if (conditions) {
      const rules = Array.isArray(conditions.rules) ? conditions.rules : [];

      if (conditions.match !== 'ALL' && conditions.match !== 'ANY')
        errors[at + 'conditions.match'] = 'INVALID';

      if (rules.length === 0) errors[at + 'conditions.rules'] = 'REQUIRED';
      else if (rules.length > MAX_RULES) errors[at + 'conditions.rules'] = 'TOO_MANY';

      rules.forEach((rule, ruleIndex) => {
        const ruleAt = `${at}conditions.rules.${ruleIndex}.`;
        const reference = earlier.get(rule.field);

        if (blank(rule.field)) errors[ruleAt + 'field'] = 'REQUIRED';
        else if (!reference) errors[ruleAt + 'field'] = 'UNKNOWN_FIELD';

        if (!OPERATORS.includes(rule.op)) {
          errors[ruleAt + 'op'] = 'INVALID';

          return;
        }

        if (!VALUE_OPERATORS.has(rule.op)) return;

        const value = typeof rule.value === 'string' ? rule.value.trim() : '';

        if (value === '') errors[ruleAt + 'value'] = 'REQUIRED';
        else if (
          reference &&
          OPTION_TYPES.has(reference.type) &&
          !(reference.options ?? []).some((option) => option.value === value)
        )
          errors[ruleAt + 'value'] = 'INVALID';
        else if (reference?.type === 'CHECKBOX' && value !== 'true' && value !== 'false')
          errors[ruleAt + 'value'] = 'INVALID';
      });
    }

    if (key !== '' && !earlier.has(key)) earlier.set(key, field);
  });

  return errors;
}

/** The definitions as they are sent: strings trimmed, settings a type does not use reset. */
export function normalizeDefinitions(fields) {
  return (fields ?? []).map((field) => {
    const type = field.type;
    const bound = (value) => {
      if (!BOUND_TYPES.has(type) || isBound(value)) return null;

      const number = toNumber(value);

      return Number.isFinite(number) ? number : value;
    };

    return {
      key: String(field.key ?? '').trim(),
      label: String(field.label ?? '').trim(),
      type,
      required: field.required === true,
      placeholder: PLACEHOLDER_TYPES.has(type) ? String(field.placeholder ?? '').trim() : '',
      help: String(field.help ?? '').trim(),
      options: OPTION_TYPES.has(type)
        ? (field.options ?? []).map((option) => ({
            value: String(option.value ?? '').trim(),
            label: String(option.label ?? '').trim(),
          }))
        : [],
      min: bound(field.min),
      max: bound(field.max),
      conditions:
        field.conditions && (field.conditions.rules ?? []).length > 0
          ? {
              match: field.conditions.match === 'ANY' ? 'ANY' : 'ALL',
              rules: field.conditions.rules.map((rule) => ({
                field: String(rule.field ?? ''),
                op: rule.op,
                value: VALUE_OPERATORS.has(rule.op) ? String(rule.value ?? '').trim() : '',
              })),
            }
          : null,
    };
  });
}
