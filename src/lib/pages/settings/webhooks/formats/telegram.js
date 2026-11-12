/** The Telegram format: the visual editor's model of one Bot API `sendMessage` body (HTML text). */

export const format = 'TELEGRAM';
export const TEXT_MAX = 4096;
export const BUTTON_MAX = 64;
export const MAX_BUTTONS = 10;

const present = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * @typedef {object} MessageModel
 * @property {string} text the message, Telegram HTML (`parse_mode: "HTML"`)
 * @property {boolean} disablePreview `link_preview_options.is_disabled`
 * @property {boolean} silent `disable_notification`
 * @property {Array<{ text: string, url: string }>} buttons inline keyboard, one button per row
 */

/** @returns {MessageModel} */
export function blankModel() {
  return {
    text: '<i>{site.name}</i>',
    disablePreview: true,
    silent: false,
    buttons: [],
  };
}

const TOP_KEYS = new Set([
  'text',
  'parse_mode',
  'link_preview_options',
  'disable_notification',
  'reply_markup',
]);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const onlyKeys = (object, keys) => Object.keys(object).every((key) => keys.includes(key));

/**
 * The visual model of a template, or null when the visual editor cannot show it as it is (no JSON,
 * a parse mode other than HTML, keys the editor has no input for, rows with more than one button).
 *
 * @param {string} template
 * @returns {MessageModel | null}
 */
export function parseModel(template) {
  let root;

  try {
    root = JSON.parse(template);
  } catch {
    return null;
  }

  if (!isObject(root) || !Object.keys(root).every((key) => TOP_KEYS.has(key))) return null;
  if (root.parse_mode !== 'HTML') return null;
  if (root.text !== undefined && typeof root.text !== 'string') return null;
  if (root.disable_notification !== undefined && typeof root.disable_notification !== 'boolean')
    return null;

  const preview = root.link_preview_options;

  if (
    preview !== undefined &&
    !(
      isObject(preview) &&
      onlyKeys(preview, ['is_disabled']) &&
      (preview.is_disabled === undefined || typeof preview.is_disabled === 'boolean')
    )
  )
    return null;

  const buttons = [];
  const markup = root.reply_markup;

  if (markup !== undefined) {
    if (!isObject(markup) || !onlyKeys(markup, ['inline_keyboard'])) return null;

    const rows = markup.inline_keyboard ?? [];

    if (!Array.isArray(rows)) return null;

    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== 1) return null;

      const button = row[0];

      if (!isObject(button) || !onlyKeys(button, ['text', 'url'])) return null;
      if (typeof button.text !== 'string' || typeof button.url !== 'string') return null;

      buttons.push({ text: button.text, url: button.url });
    }
  }

  return {
    text: root.text ?? '',
    disablePreview: preview?.is_disabled === true,
    silent: root.disable_notification === true,
    buttons,
  };
}

/**
 * The template text of a visual model (pretty JSON; buttons with neither text nor link are left out).
 *
 * @param {MessageModel} model
 */
export function modelToTemplate(model) {
  const root = { text: model.text ?? '', parse_mode: 'HTML' };

  if (model.disablePreview) root.link_preview_options = { is_disabled: true };
  if (model.silent) root.disable_notification = true;

  const buttons = (model.buttons ?? [])
    .filter((button) => present(button.text) || present(button.url))
    .map((button) => [{ text: button.text ?? '', url: button.url ?? '' }]);

  if (buttons.length > 0) root.reply_markup = { inline_keyboard: buttons };

  return JSON.stringify(root, null, 2);
}

// ---------------------------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------------------------

/** The tags Telegram's HTML parse mode knows, and the tag the preview draws for each. */
const TAGS = {
  b: 'b',
  strong: 'strong',
  i: 'i',
  em: 'em',
  u: 'u',
  ins: 'ins',
  s: 's',
  strike: 's',
  del: 'del',
  code: 'code',
  pre: 'pre',
  a: 'a',
  blockquote: 'blockquote',
  'tg-spoiler': 'span',
  span: 'span',
};

const ENTITY = /^&(?:lt|gt|amp|quot|#\d{1,7}|#x[0-9a-f]{1,6});/i;

/** Escapes text for HTML, keeping the entities Telegram knows (values arrive entity-escaped). */
export function escapeText(text) {
  let out = '';

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (char === '&') {
      const entity = ENTITY.exec(text.slice(index));

      if (entity) {
        out += entity[0];
        index += entity[0].length - 1;
      } else {
        out += '&amp;';
      }
    } else if (char === '<') out += '&lt;';
    else if (char === '>') out += '&gt;';
    else if (char === '"') out += '&quot;';
    else if (char === "'") out += '&#39;';
    else out += char;
  }

  return out;
}

const decodeEntities = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16) || 0))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec) || 0))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&');

const attribute = (attrs, name) => {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(attrs);

  return match ? (match[1] ?? match[2]) : null;
};

const SAFE_URL = /^https?:\/\/[^\s"'<>`]+$/i;

/**
 * The HTML of a Telegram HTML text, for the preview only. Only Telegram's tags are kept (links only
 * with an http(s) `href`, without any other attribute); every other `<`, `>`, `&` is text.
 * Unclosed tags are closed at the end, stray closing tags are text. Newlines become `<br>`.
 *
 * @param {string} text
 */
export function telegramHtml(text) {
  const source = String(text ?? '');
  const tag = /<(\/?)([a-z][a-z-]*)((?:\s[^<>]*)?)>/gi;
  /** @type {Array<{ name: string, out: string }>} */
  const stack = [];
  let html = '';
  let last = 0;
  let match;

  while ((match = tag.exec(source)) !== null) {
    const [whole, closing, rawName, attrs] = match;
    const name = rawName.toLowerCase();
    const out = TAGS[name];
    let replacement = null;

    if (out && closing) {
      if (stack.length > 0 && stack[stack.length - 1].name === name) {
        replacement = `</${stack.pop().out}>`;
      }
    } else if (out) {
      if (name === 'a') {
        const href = decodeEntities(attribute(attrs, 'href') ?? '').trim();

        replacement = SAFE_URL.test(href)
          ? `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">`
          : '<a>';
      } else if (name === 'span') {
        if (attribute(attrs, 'class') === 'tg-spoiler')
          replacement = '<span class="telegram-spoiler">';
      } else if (name === 'tg-spoiler') {
        replacement = '<span class="telegram-spoiler">';
      } else if (name === 'code' || name === 'pre') {
        replacement = `<${out} class="telegram-${out}">`;
      } else if (name === 'blockquote') {
        replacement = '<blockquote class="telegram-quote">';
      } else {
        replacement = `<${out}>`;
      }

      if (replacement) stack.push({ name, out });
    }

    if (replacement === null) continue;

    html += escapeText(source.slice(last, match.index)) + replacement;
    last = match.index + whole.length;
  }

  html += escapeText(source.slice(last));

  while (stack.length > 0) html += `</${stack.pop().out}>`;

  return html.replace(/\r?\n/g, '<br>');
}

/** The inline keyboard rows of a finished body: buttons with a text, links only when http(s). */
export function keyboardOf(body) {
  const rows = body?.reply_markup?.inline_keyboard;

  if (!Array.isArray(rows)) return [];

  return rows
    .filter(Array.isArray)
    .map((row) =>
      row
        .filter((button) => isObject(button) && present(button.text))
        .map((button) => ({
          text: button.text,
          url: typeof button.url === 'string' && SAFE_URL.test(button.url) ? button.url : '',
        })),
    )
    .filter((row) => row.length > 0);
}
