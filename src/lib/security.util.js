/**
 * Security utilities for sanitizing user-provided content.
 * Prevents XSS attacks via malicious image URLs, SVG data URLs, etc.
 */

/**
 * Whitelist of allowed image MIME types in data URLs.
 * SVG is intentionally excluded because it can contain embedded JavaScript.
 */
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

/**
 * Validates an image source URL for safe rendering.
 * - Allows relative URLs (e.g. /api/server/icon/default)
 * - Allows HTTPS URLs
 * - Allows data: URLs only if MIME type is in the whitelist
 * - Rejects javascript: URLs
 * - Rejects SVG data URLs
 *
 * @param {string} src - The image source to validate
 * @param {string} fallback - Fallback URL if the source is not safe
 * @returns {string} The safe image URL or fallback
 */
export function sanitizeImageSrc(src, fallback = '') {
  if (!src || typeof src !== 'string') return fallback;

  // Allow relative paths
  if (src.startsWith('/')) return src;

  // Allow HTTPS URLs
  if (src.startsWith('https://')) return src;

  // Allow HTTP URLs (some internal APIs may use them)
  if (src.startsWith('http://')) return src;

  // Validate data: URLs
  if (src.startsWith('data:')) {
    const semicolonIndex = src.indexOf(';');
    if (semicolonIndex === -1) return fallback;

    const mimeType = src.substring(5, semicolonIndex).toLowerCase();
    if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) return src;

    // Reject SVG and other non-whitelisted data URLs
    return fallback;
  }

  // Reject javascript: and other scheme URLs
  return fallback;
}
