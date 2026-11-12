/**
 * The Microsoft Teams format (Workflows webhooks): the visual editor's model of one message with one
 * Adaptive Card (title, text, monospace block, image, facts, footer, link buttons).
 */

export const format = 'TEAMS';
export const CARD_TYPE = 'application/vnd.microsoft.card.adaptive';
export const SCHEMA = 'http://adaptivecards.io/schemas/adaptive-card.json';
export const VERSION = '1.4';
export const COLORS = ['Default', 'Accent', 'Good', 'Warning', 'Attention'];
export const MAX_FACTS = 25;
export const MAX_BUTTONS = 6;

const present = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * @typedef {object} TeamsModel
 * @property {string} title
 * @property {'Default' | 'Accent' | 'Good' | 'Warning' | 'Attention'} color the title colour
 * @property {string} text
 * @property {string} code a monospace block
 * @property {string} image an Image element URL
 * @property {Array<{ title: string, value: string }>} facts
 * @property {string} footer
 * @property {Array<{ title: string, url: string }>} buttons `Action.OpenUrl` actions
 */

/** @returns {TeamsModel} */
export function blankModel() {
  return {
    title: '',
    color: 'Accent',
    text: '',
    code: '',
    image: '',
    facts: [],
    footer: '{site.name}',
    buttons: [],
  };
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const onlyKeys = (object, keys) => Object.keys(object).every((key) => keys.includes(key));
const isString = (value) => typeof value === 'string';
const wrapOk = (block) => block.wrap === undefined || block.wrap === true;

// Each body element the editor has an input for, in the order the editor writes them.
const isTitle = (block) =>
  block.type === 'TextBlock' &&
  onlyKeys(block, ['type', 'text', 'size', 'weight', 'color', 'wrap']) &&
  block.size === 'Large' &&
  block.weight === 'Bolder' &&
  (block.color === undefined || COLORS.includes(block.color)) &&
  isString(block.text) &&
  wrapOk(block);

const isText = (block) =>
  block.type === 'TextBlock' &&
  onlyKeys(block, ['type', 'text', 'wrap']) &&
  isString(block.text) &&
  wrapOk(block);

const isCode = (block) =>
  block.type === 'TextBlock' &&
  onlyKeys(block, ['type', 'text', 'fontType', 'wrap']) &&
  block.fontType === 'Monospace' &&
  isString(block.text) &&
  wrapOk(block);

const isImage = (block) =>
  block.type === 'Image' && onlyKeys(block, ['type', 'url']) && isString(block.url);

const isFacts = (block) =>
  block.type === 'FactSet' &&
  onlyKeys(block, ['type', 'facts']) &&
  Array.isArray(block.facts) &&
  block.facts.every(
    (fact) =>
      isObject(fact) &&
      onlyKeys(fact, ['title', 'value']) &&
      isString(fact.title ?? '') &&
      isString(fact.value ?? ''),
  );

const isFooter = (block) =>
  block.type === 'TextBlock' &&
  onlyKeys(block, ['type', 'text', 'isSubtle', 'size', 'wrap']) &&
  block.isSubtle === true &&
  block.size === 'Small' &&
  isString(block.text) &&
  wrapOk(block);

const SLOTS = [
  ['title', isTitle],
  ['text', isText],
  ['code', isCode],
  ['image', isImage],
  ['facts', isFacts],
  ['footer', isFooter],
];

/**
 * The visual model of a template, or null when the visual editor cannot show it as it is (no JSON,
 * a token outside a string, more than one card, elements or keys the editor has no input for, or
 * elements in another order).
 *
 * @param {string} template
 * @returns {TeamsModel | null}
 */
export function parseModel(template) {
  let root;

  try {
    root = JSON.parse(template);
  } catch {
    return null;
  }

  if (!isObject(root) || !onlyKeys(root, ['type', 'attachments']) || root.type !== 'message')
    return null;
  if (!Array.isArray(root.attachments) || root.attachments.length !== 1) return null;

  const attachment = root.attachments[0];

  if (
    !isObject(attachment) ||
    !onlyKeys(attachment, ['contentType', 'content']) ||
    attachment.contentType !== CARD_TYPE
  )
    return null;

  const card = attachment.content;

  if (!isObject(card) || !onlyKeys(card, ['$schema', 'type', 'version', 'body', 'actions']))
    return null;
  if (card.type !== 'AdaptiveCard') return null;
  if (card.$schema !== undefined && card.$schema !== SCHEMA) return null;
  if (card.version !== undefined && card.version !== VERSION) return null;

  const body = card.body ?? [];

  if (!Array.isArray(body)) return null;

  const model = { ...blankModel(), title: '', color: 'Default', footer: '' };
  let slot = 0;

  for (const block of body) {
    if (!isObject(block)) return null;

    while (slot < SLOTS.length && !SLOTS[slot][1](block)) slot++;

    if (slot >= SLOTS.length) return null;

    const name = SLOTS[slot][0];

    if (name === 'title') {
      model.title = block.text;
      model.color = block.color ?? 'Default';
    } else if (name === 'image') {
      model.image = block.url;
    } else if (name === 'facts') {
      model.facts = block.facts.map((fact) => ({
        title: fact.title ?? '',
        value: fact.value ?? '',
      }));
    } else {
      model[name] = block.text;
    }

    slot++;
  }

  const actions = card.actions ?? [];

  if (!Array.isArray(actions)) return null;

  for (const action of actions) {
    if (
      !isObject(action) ||
      !onlyKeys(action, ['type', 'title', 'url']) ||
      action.type !== 'Action.OpenUrl' ||
      !isString(action.title ?? '') ||
      !isString(action.url ?? '')
    )
      return null;
  }

  model.buttons = actions.map((action) => ({ title: action.title ?? '', url: action.url ?? '' }));

  return model;
}

/**
 * The template text of a visual model (pretty JSON; empty inputs are left out, the title is always
 * written so its colour is kept).
 *
 * @param {TeamsModel} model
 */
export function modelToTemplate(model) {
  const body = [
    {
      type: 'TextBlock',
      text: model.title ?? '',
      size: 'Large',
      weight: 'Bolder',
      color: COLORS.includes(model.color) ? model.color : 'Default',
      wrap: true,
    },
  ];

  if (present(model.text)) body.push({ type: 'TextBlock', text: model.text, wrap: true });
  if (present(model.code))
    body.push({ type: 'TextBlock', text: model.code, fontType: 'Monospace', wrap: true });
  if (present(model.image)) body.push({ type: 'Image', url: model.image });

  const facts = (model.facts ?? [])
    .filter((fact) => present(fact.title) || present(fact.value))
    .map((fact) => ({ title: fact.title ?? '', value: fact.value ?? '' }));

  if (facts.length > 0) body.push({ type: 'FactSet', facts });

  if (present(model.footer))
    body.push({ type: 'TextBlock', text: model.footer, isSubtle: true, size: 'Small', wrap: true });

  const card = { $schema: SCHEMA, type: 'AdaptiveCard', version: VERSION, body };

  const actions = (model.buttons ?? [])
    .filter((button) => present(button.title) || present(button.url))
    .map((button) => ({
      type: 'Action.OpenUrl',
      title: button.title ?? '',
      url: button.url ?? '',
    }));

  if (actions.length > 0) card.actions = actions;

  return JSON.stringify(
    { type: 'message', attachments: [{ contentType: CARD_TYPE, content: card }] },
    null,
    2,
  );
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

/**
 * The HTML of a Teams text block, for the preview only: everything is escaped first, then
 * `**bold**`, `_italic_`, `[text](url)` links (http(s) only) and line breaks. Never raw HTML.
 *
 * @param {string} text
 */
export function teamsMarkdown(text) {
  return escapeHtml(text)
    .replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');
}

/** The Teams text colour of an Adaptive Card colour name (`Default` for any other value). */
export function teamsColor(name) {
  return (
    {
      Accent: '#5b5fc7',
      Good: '#13a10e',
      Warning: '#c19c00',
      Attention: '#c4314b',
      Light: '#ffffff',
      Dark: '#242424',
    }[name] ?? '#242424'
  );
}

/** The single card of a finished Teams body, or null when it has none. */
export function cardOf(body) {
  const attachment = Array.isArray(body?.attachments)
    ? body.attachments.find((item) => item?.contentType === CARD_TYPE && isObject(item.content))
    : null;

  return attachment ? attachment.content : null;
}
