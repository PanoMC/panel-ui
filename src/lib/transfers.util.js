/**
 * The free-space check before an upload, the reason a broken upload died, and the archive formats
 * a server can be created from. Pano holds no upload any more: it streams it to the node, so the
 * only limit is the node's free disk space.
 */
import ApiUtil from '$lib/api.util.js';
import { errorCode, errorDetails } from '$lib/apiError.util.js';
import { formatBytes } from '$lib/string.util.js';
import { NETWORK_ERROR, UPLOAD_CANCELLED } from '$lib/upload.util.js';

const KEY = 'components.upload-progress.errors';

/**
 * @typedef {{ key: string, values?: Record<string, unknown> }} UploadMessage
 */

/** @param {number | null | undefined} bytes */
function size(bytes) {
  const value = Number(bytes);

  return Number.isFinite(value) && value >= 0 ? formatBytes(value, value < 1024 ? 0 : 1) : '?';
}

/**
 * "Not enough disk space: X needed, Y free".
 *
 * @param {{ required?: unknown, free?: unknown }} numbers
 * @returns {UploadMessage}
 */
export function notEnoughSpaceMessage(numbers) {
  const required = Number(numbers?.required);
  const free = Number(numbers?.free);

  if (!Number.isFinite(required) || !Number.isFinite(free)) {
    return { key: `${KEY}.not-enough-space-plain` };
  }

  return { key: `${KEY}.not-enough-space`, values: { required: size(required), free: size(free) } };
}

/**
 * The extras of an error body: `error.details`, or the fields next to `error` when the body is
 * the answer of the failures endpoint (`{ error: "<CODE>", required, free }`).
 *
 * @param {any} body
 */
function extras(body) {
  const details = errorDetails(body);

  return {
    required: details.required ?? body?.error?.required ?? body?.required,
    free: details.free ?? body?.error?.free ?? body?.free,
  };
}

/**
 * The plain sentence for an error code of an upload.
 *
 * @param {string} code
 * @param {any} [body] the body the code came from, for the disk space numbers.
 * @returns {UploadMessage}
 */
export function uploadErrorMessage(code, body = null) {
  switch (code) {
    case 'NOT_ENOUGH_SPACE':
      return notEnoughSpaceMessage(extras(body));
    case UPLOAD_CANCELLED:
      return { key: `${KEY}.cancelled` };
    case 'TRANSFER_FAILED':
      return { key: `${KEY}.transfer-failed` };
    case 'UNSUPPORTED_ARCHIVE':
      return { key: `${KEY}.unsupported-archive` };
    case 'RAR_UNAVAILABLE':
      return { key: `${KEY}.rar-unavailable` };
    case 'CORRUPT_ARCHIVE':
      return { key: `${KEY}.corrupt-archive` };
    case 'UPLOAD_ABORTED':
    case 'INTERRUPTED':
    case NETWORK_ERROR:
      return { key: `${KEY}.interrupted` };
    default:
      return { key: `${KEY}.generic`, values: { error: code || 'UNKNOWN' } };
  }
}

/** Codes that belong to the transfer itself, not to the endpoint around it. */
const UPLOAD_FAILURE_CODES = new Set([
  NETWORK_ERROR,
  UPLOAD_CANCELLED,
  'NOT_ENOUGH_SPACE',
  'TRANSFER_FAILED',
  'UPLOAD_ABORTED',
]);

/**
 * Whether an error code is explained by {@link describeUploadFailure} (anything else is the
 * endpoint's own error and is shown the way the page shows its errors).
 *
 * @param {string} code
 */
export function isUploadFailureCode(code) {
  return UPLOAD_FAILURE_CODES.has(code);
}

/**
 * `POST /panel/transfers/check`: whether the upload fits on the node. Null when it does (or the
 * node is too old to tell, or the check itself could not be made: the upload then still fails
 * cleanly if the disk fills up), else the message to show.
 *
 * @param {{ serverId?: number | string, nodeId?: number | string, size: number, format?: string }} input
 * @returns {Promise<UploadMessage | null>}
 */
export async function checkTransferSpace({ serverId, nodeId, size: bytes, format }) {
  /** @type {Record<string, unknown>} */
  const body = { size: Number(bytes) || 0 };

  if (serverId != null) body.serverId = Number(serverId);
  if (nodeId != null) body.nodeId = Number(nodeId);
  if (format) body.format = format;

  const answer = await ApiUtil.post({
    path: '/panel/transfers/check',
    body,
    handler: (/** @type {any} */ result) => result,
  }).catch(() => null);

  return errorCode(answer) === 'NOT_ENOUGH_SPACE' ? notEnoughSpaceMessage(extras(answer)) : null;
}

/**
 * Why an upload request failed. A body with a real error code is answered directly; one that
 * never got an answer (the connection was cut) asks `GET /panel/transfers/failures/<uploadId>`.
 *
 * @param {any} body what {@link import('$lib/upload.util.js').sendUpload} resolved with.
 * @param {string} [uploadId]
 * @returns {Promise<UploadMessage>}
 */
export async function describeUploadFailure(body, uploadId) {
  const code = errorCode(body);

  if (code !== NETWORK_ERROR || !uploadId) {
    return uploadErrorMessage(code, body);
  }

  const known = await ApiUtil.get({
    path: `/panel/transfers/failures/${encodeURIComponent(uploadId)}`,
  }).catch(() => null);
  const reason = errorCode(known);

  // `NOT_EXISTS`: nothing is known about it, so the plain "interrupted".
  if (!reason || reason === 'NOT_EXISTS' || reason === NETWORK_ERROR) {
    return { key: `${KEY}.interrupted` };
  }

  return uploadErrorMessage(reason, known);
}

export {
  ARCHIVE_ACCEPT,
  ARCHIVE_FORMATS,
  archiveFormatOf,
  detectArchiveFormat,
  EXTRACT_AFTER_UPLOAD,
  stripArchiveExtension,
  taskErrorCode,
} from '$lib/upload-meter.util.js';
