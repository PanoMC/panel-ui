/**
 * The Custom JSON format: the visual editor's model of any JSON body as a flat list of dot-path rows.
 * A row is a text (with tokens) or, when `raw`, a JSON value or a raw token such as `{json.data}`.
 */

export const format = 'CUSTOM';
export const MAX_ROWS = 100;

/**
 * @typedef {object} CustomRow
 * @property {string} key a dot path (`site.name` is `{ site: { name } }`)
 * @property {string} value a text with tokens, or the raw JSON / raw token when `raw`
 * @property {boolean} raw
 */

/**
 * @typedef {object} CustomModel
 * @property {CustomRow[]} rows
 */

/** @returns {CustomModel} */
export function blankModel() {
  return {
    rows: [
      { key: 'event', value: '{event}', raw: false },
      { key: 'title', value: '{title}', raw: false },
      { key: 'url', value: '{url}', raw: false },
      { key: 'data', value: '{json.data}', raw: true },
    ],
  };
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// A placeholder string no template text holds: a NUL, a marker and the raw value's index.
const PLACEHOLDER = (index) => `\u0000raw:${index}`;
const PLACEHOLDER_STRING = /^\u0000raw:(\d+)$/;
const PLACEHOLDER_JSON = /"\\u0000raw:(\d+)"/g;
const TOKEN = /^\{[A-Za-z_][\w.-]*\}/;

/**
 * The template with every token outside a JSON string swapped for a placeholder string, and the
 * swapped token texts in placeholder order.
 *
 * @param {string} template
 */
export function maskRawTokens(template) {
  const raws = [];
  let out = '';
  let inString = false;

  for (let i = 0; i < template.length; i++) {
    const char = template[i];

    if (inString) {
      out += char;

      if (char === '\\') {
        out += template[i + 1] ?? '';
        i++;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;

      continue;
    }

    if (char === '{') {
      const token = TOKEN.exec(template.slice(i));

      if (token) {
        raws.push(token[0]);
        out += JSON.stringify(PLACEHOLDER(raws.length - 1));
        i += token[0].length - 1;

        continue;
      }
    }

    out += char;
  }

  return { text: out, raws };
}

/** Puts the masked tokens back into a JSON text (placeholders inside strings stay untouched). */
const unmask = (text, raws) => text.replace(PLACEHOLDER_JSON, (_, index) => raws[Number(index)]);

// A key segment that would be reordered (integer-like) or is ambiguous as a path.
const badSegment = (segment) => segment === '' || /^\d+$/.test(segment);

/**
 * `true` when a raw value is a JSON value once its tokens are filled in (a token counts as a value).
 *
 * @param {string} text
 */
export function isRawValid(text) {
  const { text: masked } = maskRawTokens(String(text ?? '').trim());

  if (masked === '') return false;

  try {
    JSON.parse(masked);

    return true;
  } catch {
    return false;
  }
}

/**
 * The indexes of rows whose key cannot be built: an empty or integer-like segment, a key used twice,
 * or a key that is also a prefix of another (`a` and `a.b`). Rows with a blank key are skipped by
 * `modelToTemplate` and are not counted here.
 *
 * @param {CustomRow[]} rows
 * @returns {Set<number>}
 */
export function keyProblems(rows) {
  const problems = new Set();
  const keys = rows.map((row) => String(row?.key ?? '').trim());

  keys.forEach((key, index) => {
    if (key === '') return;

    if (key.split('.').some(badSegment)) {
      problems.add(index);

      return;
    }

    keys.forEach((other, otherIndex) => {
      if (otherIndex === index || other === '') return;
      if (other === key || other.startsWith(`${key}.`) || key.startsWith(`${other}.`)) {
        problems.add(index);
      }
    });
  });

  return problems;
}

/**
 * The visual model of a template, or null when the visual editor cannot show it as it is (no JSON
 * object even with the raw tokens masked, or keys that are not usable as a dot path).
 *
 * @param {string} template
 * @returns {CustomModel | null}
 */
export function parseModel(template) {
  const { text, raws } = maskRawTokens(String(template ?? ''));
  let root;

  try {
    root = JSON.parse(text);
  } catch {
    return null;
  }

  if (!isObject(root)) return null;

  const rows = [];
  let refused = false;

  const rawOf = (value) => {
    const placeholder = typeof value === 'string' ? PLACEHOLDER_STRING.exec(value) : null;

    if (placeholder) return raws[Number(placeholder[1])];

    return unmask(JSON.stringify(value), raws);
  };

  const walk = (object, prefix) => {
    const keys = Object.keys(object);

    if (prefix !== '' && keys.length === 0) {
      rows.push({ key: prefix, value: '{}', raw: true });

      return;
    }

    for (const key of keys) {
      if (key.includes('.') || badSegment(key)) {
        refused = true;

        return;
      }

      const path = prefix === '' ? key : `${prefix}.${key}`;
      const value = object[key];

      if (isObject(value)) {
        walk(value, path);
      } else if (typeof value === 'string' && !PLACEHOLDER_STRING.test(value)) {
        rows.push({ key: path, value, raw: false });
      } else {
        rows.push({ key: path, value: rawOf(value), raw: true });
      }
    }
  };

  walk(root, '');

  return refused ? null : { rows };
}

/**
 * The template text of a visual model (pretty JSON). Rows with a blank key or a key in
 * `keyProblems` are left out; a blank raw value is written as `null`.
 *
 * @param {CustomModel} model
 */
export function modelToTemplate(model) {
  const rows = Array.isArray(model?.rows) ? model.rows : [];
  const problems = keyProblems(rows);
  const raws = [];
  const root = {};

  rows.forEach((row, index) => {
    const key = String(row?.key ?? '').trim();

    if (key === '' || problems.has(index)) return;

    const segments = key.split('.');
    let target = root;

    for (const segment of segments.slice(0, -1)) {
      if (!isObject(target[segment])) target[segment] = {};

      target = target[segment];
    }

    let value = String(row.value ?? '');

    if (row.raw) {
      const raw = value.trim() === '' ? 'null' : value.trim();

      raws.push(raw);
      value = PLACEHOLDER(raws.length - 1);
    }

    target[segments[segments.length - 1]] = value;
  });

  return unmask(JSON.stringify(root, null, 2), raws);
}

// ---------------------------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------------------------

const escapeHtml = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const JSON_PART =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/**
 * The HTML of a value as pretty JSON with light syntax colouring, for the preview only: the JSON
 * text is escaped first, then keys, strings, numbers and literals get a `custom-json-*` span.
 *
 * @param {any} value
 */
export function highlightJson(value) {
  const text = JSON.stringify(value, null, 2) ?? '';

  return escapeHtml(text).replace(JSON_PART, (match, string, colon, literal, number) => {
    if (string !== undefined) {
      const kind = colon ? 'key' : 'string';

      return `<span class="custom-json-${kind}">${string}</span>${colon ?? ''}`;
    }

    if (literal !== undefined) return `<span class="custom-json-literal">${literal}</span>`;

    return `<span class="custom-json-number">${number}</span>`;
  });
}
