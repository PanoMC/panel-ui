/**
 * Helpers for the maintenance mode card on the Platform settings page.
 *
 * Everything here is advisory: the backend re-validates and re-normalizes the same values,
 * and it is the only side that can see the live router. These checks just keep the panel
 * from sending an address the platform is already known to refuse.
 */

/** Prefixes the platform serves itself, so a custom login address may never live under them. */
export const RESERVED_LOGIN_URL_PREFIXES = ['/api', '/panel/api'];

/** The single i18n key the card shows for every invalid custom login address. */
export const CUSTOM_LOGIN_URL_ERROR =
  'pages.settings.platform.maintenance.custom-login-url-invalid';

/** The i18n key the card shows for a bypass node the platform would refuse. */
export const BYPASS_PERMISSION_NODE_ERROR =
  'pages.settings.platform.maintenance.permission-node-invalid';

/** The i18n key the card shows when the custom permission mode is left without a node. */
export const BYPASS_PERMISSION_NODE_REQUIRED_ERROR =
  'pages.settings.platform.maintenance.permission-node-required';

const LOGIN_URL_CHARS = /^\/[A-Za-z0-9\-._~/]*$/;

const MAX_BYPASS_PERMISSION_NODE_LENGTH = 128;

/**
 * @param {unknown} value
 * @returns {string} leading slash, collapsed slashes, no trailing slash ('' when blank)
 */
export function normalizeLoginUrl(value) {
  let path = String(value ?? '').trim();

  if (!path) {
    return '';
  }

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  path = path.replace(/\/{2,}/g, '/');

  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }

  return path;
}

/**
 * @param {unknown} value
 * @returns {string|null} i18n key of the error, or null when the address is usable
 */
export function validateCustomLoginUrl(value) {
  const raw = String(value ?? '').trim();

  // Optional: an empty address falls back to /login or /panel on the backend.
  if (!raw) {
    return null;
  }

  if (/\s/.test(raw) || !raw.startsWith('/')) {
    return CUSTOM_LOGIN_URL_ERROR;
  }

  if (raw.includes('?') || raw.includes('#') || raw.includes('..')) {
    return CUSTOM_LOGIN_URL_ERROR;
  }

  if (!LOGIN_URL_CHARS.test(raw)) {
    return CUSTOM_LOGIN_URL_ERROR;
  }

  const normalized = normalizeLoginUrl(raw);

  if (normalized === '/' || normalized.length > 128) {
    return CUSTOM_LOGIN_URL_ERROR;
  }

  const lowered = normalized.toLowerCase();
  const reserved = RESERVED_LOGIN_URL_PREFIXES.some(
    (prefix) => lowered === prefix || lowered.startsWith(prefix + '/'),
  );

  if (reserved) {
    return CUSTOM_LOGIN_URL_ERROR;
  }

  return null;
}

/**
 * Mirrors the platform rule for the bypass node: no wildcard (it is matched as a literal
 * target, so `admins.*` would only ever match holders of that exact string), no whitespace,
 * at most 128 characters.
 *
 * @param {unknown} value
 * @param {boolean} [required] true while the card is in custom mode, where a blank node would
 *   silently fall back to the default panel permission
 * @returns {string|null} i18n key of the error, or null when the node is usable
 */
export function validateBypassPermissionNode(value, required = false) {
  const node = String(value ?? '').trim();

  if (!node) {
    return required ? BYPASS_PERMISSION_NODE_REQUIRED_ERROR : null;
  }

  if (node.length > MAX_BYPASS_PERMISSION_NODE_LENGTH || node.includes('*') || /\s/.test(node)) {
    return BYPASS_PERMISSION_NODE_ERROR;
  }

  return null;
}

/** Anything the empty TipTap document cannot be made of; seeing one means there is content. */
const MEANINGFUL_HTML_ELEMENT = '*:not(p):not(br)';

/**
 * TipTap may produce an empty document `<p></p>`; for consistency with the API and `isNotBlank`, it counts as an empty string when there is no text.
 *
 * The maintenance page is regularly a banner image, a rule or a styled block with no text at
 * all (the same modal ships a Custom CSS field and a raw HTML view), so only that empty
 * document collapses \u2014 never markup that merely happens to be text-free.
 *
 * @param {unknown} html
 * @returns {string}
 */
export function normalizeMaintenanceHtml(html) {
  if (html == null || typeof html !== 'string') return '';
  const trimmed = html.trim();
  if (!trimmed) return '';
  if (typeof document === 'undefined') {
    // Same rule as the DOM branch, without a parser: drop the empty-document scaffolding
    // first, then keep the value if any text or any other tag survives.
    const stripped = trimmed.replace(/<\/?(?:p|br)\b[^>]*>/gi, ' ');
    const textOnly = stripped
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textOnly || /<[a-z]/i.test(stripped) ? trimmed : '';
  }
  try {
    const doc = new DOMParser().parseFromString(trimmed, 'text/html');
    const text = (doc.body.textContent || '').replace(/\u00a0/g, ' ').trim();
    return text || doc.body.querySelector(MEANINGFUL_HTML_ELEMENT) ? trimmed : '';
  } catch {
    return trimmed;
  }
}
