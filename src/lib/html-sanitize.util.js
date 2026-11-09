import { sanitize } from '@jill64/universal-sanitizer';

/*
 * HTML that other people wrote (ticket replies, category auto-replies, translation overrides) is
 * rendered with {@html}. These helpers keep only the markup the panel itself produces, on both
 * sides: DOMPurify in the browser, sanitize-html during SSR. Both get the same allow-list, so the
 * server and the client render the same thing.
 */

const RICH_TEXT_TAGS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'mark',
  'small',
  'sub',
  'sup',
  'span',
  'a',
  'img',
];

const TRANSLATION_TAGS = ['a', 'b', 'strong', 'i', 'em', 'u', 's', 'br', 'span', 'small', 'code'];

const SAFE_SCHEMES = ['http', 'https', 'mailto'];

// Only plain values: no url(), no expressions.
const CSS_VALUE = [/^[#a-z0-9\s.,%()-]+$/i];
const CSS_FONT_FAMILY = [/^[a-z0-9\s,'"-]+$/i];
const RICH_TEXT_STYLES = {
  '*': {
    color: CSS_VALUE,
    'background-color': CSS_VALUE,
    'font-size': CSS_VALUE,
    'line-height': CSS_VALUE,
    'font-family': CSS_FONT_FAMILY,
    'text-align': [/^(left|right|center|justify)$/],
  },
};

const UNSAFE_URL = /^\s*(javascript|vbscript|data):/i;

function hasMarkup(value) {
  return typeof value === 'string' && value.includes('<');
}

/**
 * Cleans user-written rich text (TipTap output) before it goes into {@html}.
 * @param {unknown} html
 * @returns {string}
 */
export function sanitizeRichText(html) {
  if (html === null || html === undefined) return '';
  const value = String(html);
  if (!hasMarkup(value)) return value;

  return sanitize(value, {
    dompurify: {
      ALLOWED_TAGS: RICH_TEXT_TAGS,
      ALLOWED_ATTR: [
        'href',
        'target',
        'rel',
        'src',
        'alt',
        'title',
        'width',
        'height',
        'style',
        'class',
      ],
    },
    sanitizeHtml: {
      allowedTags: RICH_TEXT_TAGS,
      allowedAttributes: {
        a: ['href', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['style', 'class'],
      },
      allowedStyles: RICH_TEXT_STYLES,
      allowedSchemes: SAFE_SCHEMES,
      allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    },
  });
}

/**
 * Cleans a translation text an admin overrode in the panel. Texts without markup are returned as
 * they are, so plain texts (also the ones shown escaped) never change.
 * @param {unknown} value
 * @returns {unknown}
 */
export function sanitizeTranslation(value) {
  if (!hasMarkup(value)) return value;

  return sanitize(value, {
    dompurify: {
      ALLOWED_TAGS: TRANSLATION_TAGS,
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    },
    sanitizeHtml: {
      allowedTags: TRANSLATION_TAGS,
      allowedAttributes: { a: ['href', 'target', 'rel'], '*': ['class'] },
      allowedSchemes: SAFE_SCHEMES,
    },
  });
}

/**
 * Sanitizes every string of a (nested) translations object.
 * @param {any} translations
 * @returns {any}
 */
export function sanitizeTranslations(translations) {
  if (typeof translations === 'string') return sanitizeTranslation(translations);
  if (Array.isArray(translations)) return translations.map(sanitizeTranslations);
  if (translations && typeof translations === 'object') {
    return Object.fromEntries(
      Object.entries(translations).map(([key, value]) => [key, sanitizeTranslations(value)]),
    );
  }

  return translations;
}

/**
 * A link href that cannot run script: http(s), mailto, relative or anchor links only.
 * @param {unknown} href
 * @returns {string}
 */
export function safeHref(href) {
  if (typeof href !== 'string') return '#';
  // Control characters and whitespace inside the scheme are ignored by browsers.
  // eslint-disable-next-line no-control-regex
  const compact = href.replace(/[\u0000- ]/g, '');
  if (UNSAFE_URL.test(compact)) return '#';
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact);
  if (scheme && !SAFE_SCHEMES.includes(scheme[1].toLowerCase())) return '#';

  return href;
}
