/**
 * Readers for the `/api/v1` error envelope: `{ error: { code, message?, details?, fields? } }`.
 * A success body never has a top-level `error` key, so `body.error` stays the "did it fail" test.
 */

/**
 * The error code of a response body, or '' when the body is not an error.
 * @param {any} body
 * @returns {string}
 */
export function errorCode(body) {
  const error = body?.error;

  if (error == null) return '';

  return typeof error === 'string' ? error : String(error.code ?? '');
}

/**
 * The `error.details` object (extras such as `reason`, `until`, `licenseDeniedReason`).
 * @param {any} body
 * @returns {Record<string, any>}
 */
export function errorDetails(body) {
  return body?.error?.details ?? {};
}

/**
 * The `error.fields` object (field name to field error code).
 * @param {any} body
 * @returns {Record<string, any>}
 */
export function errorFields(body) {
  return body?.error?.fields ?? {};
}
