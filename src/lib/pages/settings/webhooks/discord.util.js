/**
 * The message templates of a webhook: one template per event (a JSON text with `{tokens}`), the
 * catalogue data of the editor, and the Markdown subset the Discord preview renders.
 */

export const TEST_PING = 'core.test.ping';

// The Discord message model lives with the Discord editor; kept importable from here.
export {
  DEFAULT_COLOR,
  MAX_FIELDS,
  blankModel,
  colorToHex,
  hexToColor,
  modelToTemplate,
  parseModel,
} from './formats/discord.js';

const present = (value) => typeof value === 'string' && value.trim() !== '';

// ---------------------------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------------------------

/**
 * @typedef {object} TemplateInfo
 * @property {string | null} defaultTemplate the built-in template, null when the renderer tells none
 * @property {Array<{ name: string, sample: string }>} tokens
 */

/**
 * @typedef {object} EventTemplates
 * @property {string | null} defaultTemplate the built-in Discord template (a plugin renderer may tell none)
 * @property {Array<{ name: string, sample: string }>} tokens the Discord tokens
 * @property {Record<string, string | null>} templates the built-in template of every other format
 * @property {Array<{ name: string, sample: string }>} allTokens the tokens of every other format
 */

const tokenList = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((token) => present(token?.name))
    .map((token) => ({ name: token.name, sample: String(token.sample ?? '') }));

/**
 * The editor data of every event of `GET /webhooks/events` (subscribable or not), by full name.
 *
 * @param {any} body
 * @returns {Record<string, EventTemplates>}
 */
export function templateCatalogue(body) {
  const out = {};

  for (const source of Array.isArray(body?.items) ? body.items : []) {
    for (const event of Array.isArray(source?.events) ? source.events : []) {
      if (!present(event?.name)) continue;

      const discord = event.discord && typeof event.discord === 'object' ? event.discord : null;

      const templates = {};

      if (event.templates && typeof event.templates === 'object') {
        for (const [format, text] of Object.entries(event.templates)) {
          templates[format] = present(text) ? text : null;
        }
      }

      out[event.name] = {
        defaultTemplate: present(discord?.defaultTemplate) ? discord.defaultTemplate : null,
        tokens: tokenList(discord?.tokens),
        templates,
        allTokens: tokenList(event.tokens),
      };
    }
  }

  return out;
}

/**
 * The editor data of an event in one format.
 *
 * @param {EventTemplates | null | undefined} info
 * @param {string} format
 * @returns {TemplateInfo | null}
 */
export function templateInfoFor(info, format) {
  if (!info) return null;

  if (format === 'DISCORD') return { defaultTemplate: info.defaultTemplate, tokens: info.tokens };

  return { defaultTemplate: info.templates?.[format] ?? null, tokens: info.allTokens ?? [] };
}

/**
 * The concrete events a form covers, in catalogue order: every event of the catalogue for "all
 * events", a whole source for `source.*`, else the names themselves. The test ping comes last: the
 * test button sends it.
 *
 * @param {{ allEvents?: boolean, events?: string[] }} form
 * @param {Array<{ source: string, events: Array<{ name: string }> }>} catalogue
 */
export function coveredEvents(form, catalogue) {
  const names = [];
  const add = (name) => {
    if (!names.includes(name)) names.push(name);
  };

  for (const source of catalogue) {
    for (const event of source.events) {
      const chosen = form.events ?? [];

      if (form.allEvents || chosen.includes(`${source.source}.*`) || chosen.includes(event.name)) {
        add(event.name);
      }
    }
  }

  // Subscribed names the catalogue does not offer any more still get a template.
  if (!form.allEvents) for (const name of form.events ?? []) if (!name.endsWith('.*')) add(name);

  add(TEST_PING);

  return names;
}

/** The templates worth sending: blank texts dropped. */
export function cleanTemplates(templates) {
  const out = {};

  for (const [key, value] of Object.entries(templates ?? {})) {
    if (present(value)) out[key] = value;
  }

  return out;
}

/** Inserts `text` at the caret of an input or textarea and tells Svelte's bindings about it. */
export function insertAtCaret(element, text) {
  if (!element || typeof element.setRangeText !== 'function') return false;

  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? start;

  element.setRangeText(text, start, end, 'end');
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.focus();

  return true;
}

// ---------------------------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------------------------

const escapeHtml = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** `true` for an absolute http(s) URL, the only links the preview makes clickable. */
export const isHttpUrl = (text) => /^https?:\/\/[^\s"'<>]+$/i.test(String(text ?? ''));

/**
 * The HTML of a Discord Markdown text, for the preview only: everything is escaped first, then the
 * common marks are applied (code blocks, inline code, bold, italic, underline, strike, `[text](url)`
 * links, quotes, headings, line breaks). Never raw HTML.
 *
 * @param {string} text
 */
export function discordMarkdown(text) {
  const blocks = [];
  let html = escapeHtml(text).replace(/```(?:[a-z0-9_+-]*\n)?([\s\S]*?)```/gi, (_, code) => {
    blocks.push(`<pre class="discord-code-block"><code>${code.replace(/\n$/, '')}</code></pre>`);

    return `\u0000${blocks.length - 1}\u0000`;
  });

  const inline = [];

  html = html.replace(/`([^`\n]+)`/g, (_, code) => {
    inline.push(`<code class="discord-code">${code}</code>`);

    return `\u0001${inline.length - 1}\u0001`;
  });

  html = html
    .replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<u>$1</u>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~([^~\n]+)~~/g, '<s>$1</s>');

  html = html
    .split('\n')
    .map((line) => {
      const heading = /^(#{1,3}) (.+)$/.exec(line);

      if (heading) return `<span class="discord-h${heading[1].length}">${heading[2]}</span>`;

      const quote = /^&gt; (.*)$/.exec(line);

      if (quote) return `<span class="discord-quote">${quote[1]}</span>`;

      return line;
    })
    .join('<br>')
    .replace(/(<\/span>)<br>/g, '$1');

  return html
    .replace(/\u0001(\d+)\u0001/g, (_, index) => inline[Number(index)])
    .replace(/\u0000(\d+)\u0000/g, (_, index) => blocks[Number(index)]);
}

/** `14.11.2023 22:13` style time of an ISO text for the embed footer, '' when it is none. */
export function previewTime(iso, locale) {
  const date = new Date(String(iso ?? ''));

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(locale || undefined, { dateStyle: 'short', timeStyle: 'short' });
}
