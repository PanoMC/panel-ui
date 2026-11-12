/** The Discord format: the visual editor's model of one message (bot, text and one embed). */

export const format = 'DISCORD';
export const DEFAULT_COLOR = '#5865F2';
export const MAX_FIELDS = 25;

const present = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * @typedef {object} MessageModel
 * @property {string} content
 * @property {string} username
 * @property {string} avatarUrl
 * @property {boolean} hasEmbed
 * @property {string} title
 * @property {string} url
 * @property {string} description
 * @property {string} color `#rrggbb`
 * @property {string} authorName
 * @property {string} authorIcon
 * @property {string} thumbnail
 * @property {string} image
 * @property {Array<{ name: string, value: string, inline: boolean }>} fields
 * @property {string} footerText
 * @property {string} footerIcon
 * @property {boolean} timestamp
 */

/** @returns {MessageModel} */
export function blankModel() {
  return {
    content: '',
    username: '',
    avatarUrl: '',
    hasEmbed: true,
    title: '',
    url: '',
    description: '',
    color: DEFAULT_COLOR,
    authorName: '',
    authorIcon: '',
    thumbnail: '',
    image: '',
    fields: [],
    footerText: '{site.name}',
    footerIcon: '',
    timestamp: true,
  };
}

const TOP_KEYS = new Set(['content', 'username', 'avatar_url', 'embeds', 'allowed_mentions']);
const EMBED_KEYS = new Set([
  'title',
  'url',
  'description',
  'color',
  'author',
  'thumbnail',
  'image',
  'fields',
  'footer',
  'timestamp',
]);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = (value) => (typeof value === 'string' ? value : '');
const onlyKeys = (object, keys) => Object.keys(object).every((key) => keys.includes(key));

/** `#rrggbb` of a Discord colour number. */
export const colorToHex = (number) =>
  `#${(Number(number) & 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`;

/** The Discord colour number of `#rrggbb` (a bad value is the default colour). */
export function hexToColor(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());

  return parseInt(match ? match[1] : DEFAULT_COLOR.slice(1), 16);
}

/**
 * The visual model of a template, or null when the visual editor cannot show it as it is (no JSON,
 * a token outside a string, more than one embed, keys the editor has no input for).
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

  const embeds = root.embeds ?? [];

  if (!Array.isArray(embeds) || embeds.length > 1) return null;

  const model = {
    ...blankModel(),
    content: str(root.content),
    username: str(root.username),
    avatarUrl: str(root.avatar_url),
    hasEmbed: embeds.length === 1,
    footerText: '',
    timestamp: false,
  };

  if (embeds.length === 0) return model;

  const embed = embeds[0];

  if (!isObject(embed) || !Object.keys(embed).every((key) => EMBED_KEYS.has(key))) return null;
  if (embed.color !== undefined && typeof embed.color !== 'number') return null;
  if (
    embed.author !== undefined &&
    !(isObject(embed.author) && onlyKeys(embed.author, ['name', 'icon_url']))
  )
    return null;
  if (
    embed.footer !== undefined &&
    !(isObject(embed.footer) && onlyKeys(embed.footer, ['text', 'icon_url']))
  )
    return null;

  for (const key of ['thumbnail', 'image']) {
    if (embed[key] !== undefined && !(isObject(embed[key]) && onlyKeys(embed[key], ['url'])))
      return null;
  }

  const fields = embed.fields ?? [];

  if (!Array.isArray(fields)) return null;

  for (const field of fields) {
    if (!isObject(field) || !onlyKeys(field, ['name', 'value', 'inline'])) return null;
  }

  return {
    ...model,
    title: str(embed.title),
    url: str(embed.url),
    description: str(embed.description),
    color: typeof embed.color === 'number' ? colorToHex(embed.color) : DEFAULT_COLOR,
    authorName: str(embed.author?.name),
    authorIcon: str(embed.author?.icon_url),
    thumbnail: str(embed.thumbnail?.url),
    image: str(embed.image?.url),
    fields: fields.map((field) => ({
      name: str(field.name),
      value: str(field.value),
      inline: field.inline === true,
    })),
    footerText: str(embed.footer?.text),
    footerIcon: str(embed.footer?.icon_url),
    timestamp: present(embed.timestamp),
  };
}

/**
 * The template text of a visual model (pretty JSON; empty inputs are left out).
 *
 * @param {MessageModel} model
 */
export function modelToTemplate(model) {
  const root = {};

  if (present(model.username)) root.username = model.username;
  if (present(model.avatarUrl)) root.avatar_url = model.avatarUrl;
  if (present(model.content)) root.content = model.content;

  if (model.hasEmbed) {
    const embed = {};

    if (present(model.authorName)) {
      embed.author = { name: model.authorName };

      if (present(model.authorIcon)) embed.author.icon_url = model.authorIcon;
    }

    if (present(model.title)) embed.title = model.title;
    if (present(model.url)) embed.url = model.url;
    if (present(model.description)) embed.description = model.description;

    embed.color = hexToColor(model.color);

    const fields = (model.fields ?? [])
      .filter((field) => present(field.name) || present(field.value))
      .map((field) => ({ name: field.name, value: field.value, inline: field.inline === true }));

    if (fields.length > 0) embed.fields = fields;
    if (present(model.thumbnail)) embed.thumbnail = { url: model.thumbnail };
    if (present(model.image)) embed.image = { url: model.image };

    if (present(model.footerText)) {
      embed.footer = { text: model.footerText };

      if (present(model.footerIcon)) embed.footer.icon_url = model.footerIcon;
    }

    if (model.timestamp) embed.timestamp = '{event.iso}';

    root.embeds = [embed];
  }

  return JSON.stringify(root, null, 2);
}

