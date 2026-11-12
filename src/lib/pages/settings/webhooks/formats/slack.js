/**
 * The Slack format (and the services that take it: Mattermost, Rocket.Chat): the visual editor's
 * model of one message (notification text, bot, header, text, fields, image, one link button and a
 * context line) and the Slack markdown the preview renders.
 */

export const format = 'SLACK';
export const MAX_FIELDS = 10;

const present = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * @typedef {object} SlackModel
 * @property {string} text the notification text (top-level `text`)
 * @property {string} username
 * @property {string} iconUrl
 * @property {string} header the `header` block (plain text)
 * @property {string} body the mrkdwn text of a `section` block
 * @property {Array<{ name: string, value: string }>} fields mrkdwn fields `*name*\nvalue`
 * @property {string} image the url of an `image` block
 * @property {string} buttonText the label of the one link button of an `actions` block
 * @property {string} buttonUrl
 * @property {string} footer the mrkdwn text of a `context` block
 */

/** @returns {SlackModel} */
export function blankModel() {
  return {
    text: '',
    username: '',
    iconUrl: '',
    header: '',
    body: '',
    fields: [],
    image: '',
    buttonText: '',
    buttonUrl: '',
    footer: '{site.name}',
  };
}

const TOP_KEYS = ['text', 'username', 'icon_url', 'blocks'];

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const onlyKeys = (object, keys) => Object.keys(object).every((key) => keys.includes(key));

/** The text of a `plain_text` object, or null when the value is not one. */
function plainText(value) {
  if (!isObject(value) || value.type !== 'plain_text' || typeof value.text !== 'string')
    return null;
  if (!onlyKeys(value, ['type', 'text', 'emoji'])) return null;

  return value.text;
}

/** The text of a `mrkdwn` object, or null when the value is not one. */
function mrkdwnText(value) {
  if (!isObject(value) || value.type !== 'mrkdwn' || typeof value.text !== 'string') return null;
  if (!onlyKeys(value, ['type', 'text'])) return null;

  return value.text;
}

const FIELD = /^\*([^\n]*)\*\n([\s\S]*)$/;

/** `{ name, value }` of a mrkdwn field text; a text without the `*name*\n` head is all value. */
function splitField(text) {
  const match = FIELD.exec(text);

  return match ? { name: match[1], value: match[2] } : { name: '', value: text };
}

/**
 * The visual model of a template, or null when the visual editor cannot show it as it is (no JSON,
 * a token outside a string, a block type or key the editor has no input for, a part given twice,
 * more than one button).
 *
 * @param {string} template
 * @returns {SlackModel | null}
 */
export function parseModel(template) {
  let root;

  try {
    root = JSON.parse(template);
  } catch {
    return null;
  }

  if (!isObject(root) || !onlyKeys(root, TOP_KEYS)) return null;

  for (const key of ['text', 'username', 'icon_url']) {
    if (root[key] !== undefined && typeof root[key] !== 'string') return null;
  }

  const blocks = root.blocks ?? [];

  if (!Array.isArray(blocks)) return null;

  const model = {
    ...blankModel(),
    text: root.text ?? '',
    username: root.username ?? '',
    iconUrl: root.icon_url ?? '',
    footer: '',
  };
  const seen = new Set();
  const once = (part) => {
    if (seen.has(part)) return false;

    seen.add(part);

    return true;
  };

  for (const block of blocks) {
    if (!isObject(block)) return null;

    switch (block.type) {
      case 'header': {
        const text = plainText(block.text);

        if (text === null || !onlyKeys(block, ['type', 'text']) || !once('header')) return null;

        model.header = text;
        break;
      }

      case 'section': {
        if (!onlyKeys(block, ['type', 'text', 'fields'])) return null;
        if (block.text === undefined && block.fields === undefined) return null;

        if (block.text !== undefined) {
          const text = mrkdwnText(block.text);

          if (text === null || !once('body')) return null;

          model.body = text;
        }

        if (block.fields !== undefined) {
          if (!Array.isArray(block.fields) || !once('fields')) return null;

          const fields = [];

          for (const field of block.fields) {
            const text = mrkdwnText(field);

            if (text === null) return null;

            fields.push(splitField(text));
          }

          model.fields = fields;
        }
        break;
      }

      case 'image': {
        if (!onlyKeys(block, ['type', 'image_url', 'alt_text'])) return null;
        if (typeof block.image_url !== 'string' || !once('image')) return null;

        model.image = block.image_url;
        break;
      }

      case 'actions': {
        if (!onlyKeys(block, ['type', 'elements']) || !Array.isArray(block.elements)) return null;
        if (block.elements.length !== 1 || !once('actions')) return null;

        const button = block.elements[0];

        if (!isObject(button) || button.type !== 'button') return null;
        if (!onlyKeys(button, ['type', 'text', 'url'])) return null;
        if (button.url !== undefined && typeof button.url !== 'string') return null;

        const text = plainText(button.text);

        if (text === null) return null;

        model.buttonText = text;
        model.buttonUrl = button.url ?? '';
        break;
      }

      case 'context': {
        if (!onlyKeys(block, ['type', 'elements']) || !Array.isArray(block.elements)) return null;
        if (block.elements.length !== 1 || !once('context')) return null;

        const text = mrkdwnText(block.elements[0]);

        if (text === null) return null;

        model.footer = text;
        break;
      }

      default:
        return null;
    }
  }

  return model;
}

const plain = (text) => ({ type: 'plain_text', text, emoji: true });
const mrkdwn = (text) => ({ type: 'mrkdwn', text });

/**
 * The template text of a visual model (pretty JSON; empty inputs are left out).
 *
 * @param {SlackModel} model
 */
export function modelToTemplate(model) {
  const root = {};

  if (present(model.username)) root.username = model.username;
  if (present(model.iconUrl)) root.icon_url = model.iconUrl;
  if (present(model.text)) root.text = model.text;

  const blocks = [];

  if (present(model.header)) blocks.push({ type: 'header', text: plain(model.header) });
  if (present(model.body)) blocks.push({ type: 'section', text: mrkdwn(model.body) });

  const fields = (model.fields ?? [])
    .filter((field) => present(field.name) || present(field.value))
    .map((field) =>
      mrkdwn(present(field.name) ? `*${field.name}*\n${field.value ?? ''}` : (field.value ?? '')),
    );

  if (fields.length > 0) blocks.push({ type: 'section', fields });

  if (present(model.image)) {
    blocks.push({
      type: 'image',
      image_url: model.image,
      alt_text: present(model.header) ? model.header : 'image',
    });
  }

  if (present(model.buttonText) || present(model.buttonUrl)) {
    blocks.push({
      type: 'actions',
      elements: [
        { type: 'button', text: plain(model.buttonText ?? ''), url: model.buttonUrl ?? '' },
      ],
    });
  }

  if (present(model.footer)) blocks.push({ type: 'context', elements: [mrkdwn(model.footer)] });

  if (blocks.length > 0) root.blocks = blocks;

  return JSON.stringify(root, null, 2);
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

/** The text Slack shows for an entity-escaped text (`&lt;` is `<`). Never HTML. */
export const slackDecode = (text) =>
  String(text ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** `true` for an absolute http(s) URL, the only links the preview makes clickable. */
export const isHttpUrl = (text) => /^https?:\/\/[^\s"'<>]+$/i.test(String(text ?? ''));

/**
 * The HTML of a Slack mrkdwn text, for the preview only. Slack links (`<https://x|label>`,
 * `<https://x>`) are taken out first, the entities are decoded, everything is HTML-escaped, then
 * the marks are applied (code blocks, inline code, bold, italic, strike, quotes, line breaks). Only
 * http(s) links become links; every other `<...>` (a mention, `javascript:`) stays text. Never raw
 * HTML.
 *
 * @param {string} text
 */
export function slackMarkdown(text) {
  const saved = [];
  const save = (html) => {
    saved.push(html);

    return `\u0000${saved.length - 1}\u0000`;
  };

  // eslint-disable-next-line no-control-regex
  let source = String(text ?? '').replace(/[\u0000\u0001]/g, '');

  source = source.replace(/<([^<>|\n]+)(?:\|([^<>\n]*))?>/g, (_, target, label) => {
    const url = slackDecode(target).trim();
    const shown = escapeHtml(slackDecode(label ?? target));

    if (isHttpUrl(url)) {
      return save(
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${shown}</a>`,
      );
    }

    return save(shown);
  });

  let html = escapeHtml(slackDecode(source));

  html = html.replace(/```\n?([\s\S]*?)```/g, (_, code) =>
    save(`<pre class="slack-code-block"><code>${code.replace(/\n$/, '')}</code></pre>`),
  );
  html = html.replace(/`([^`\n]+)`/g, (_, code) => save(`<code class="slack-code">${code}</code>`));

  html = html
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, '$1<strong>$2</strong>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w~])~([^~\n]+)~(?![\w~])/g, '$1<s>$2</s>');

  html = html
    .split('\n')
    .map((line) => {
      const quote = /^&gt; ?(.*)$/.exec(line);

      return quote ? `<span class="slack-quote">${quote[1]}</span>` : line;
    })
    .join('<br>')
    .replace(/(<\/span>)<br>/g, '$1');

  // Saved parts may hold other saved parts (a link inside a code block stays a link in Slack too).
  const restore = (value) =>
    value.replace(/\u0000(\d+)\u0000/g, (_, index) => restore(saved[Number(index)]));

  return restore(html);
}
