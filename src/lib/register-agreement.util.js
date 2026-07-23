/**
 * TipTap may produce an empty document `<p></p>`; for consistency with the API and `isNotBlank`, it counts as an empty string when there is no text.
 * @param {unknown} html
 * @returns {string}
 */
export function normalizeRegisterAgreement(html) {
  if (html == null || typeof html !== 'string') return '';
  const trimmed = html.trim();
  if (!trimmed) return '';
  if (typeof document === 'undefined') {
    const textOnly = trimmed
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textOnly ? trimmed : '';
  }
  try {
    const doc = new DOMParser().parseFromString(trimmed, 'text/html');
    const text = (doc.body.textContent || '')
      .replace(/\u00a0/g, ' ')
      .trim();
    return text ? trimmed : '';
  } catch {
    return trimmed;
  }
}
