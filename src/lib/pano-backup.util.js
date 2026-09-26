/**
 * Pure helpers of the Pano Backup pages (settings/backups): archive sniffing, job progress, the
 * mapping of backend/Pano Host error codes to lang keys, and small form rules. Kept free of
 * Svelte and `$lib` imports so `bun test` runs them as they are.
 */
import { formatBytes } from './string.util.js';

/** Local schedule (`PUT /api/panel/pano-backups/settings`). */
export const LOCAL_SCHEDULES = Object.freeze(['OFF', 'DAILY', 'WEEKLY']);

/** Pano Backup schedule (`PUT …/remote/settings`); `TIER` = as often as the tier allows. */
export const REMOTE_SCHEDULES = Object.freeze(['OFF', 'TIER', 'DAILY', 'WEEKLY']);

/** Must match the platform's `PassphraseFile.MIN_LENGTH`. */
export const MIN_PASSPHRASE_LENGTH = 8;

/** archive-format.md §3: `"PANOARC\x01" | u32 headerLen (big endian) | header JSON`. */
export const ENVELOPE_MAGIC = Object.freeze([0x50, 0x41, 0x4e, 0x4f, 0x41, 0x52, 0x43, 0x01]);

const MAX_HEADER_BYTES = 16 * 1024;

/** How many leading bytes {@link inspectArchiveFile} reads: magic + length + the largest header. */
export const ARCHIVE_SNIFF_BYTES = ENVELOPE_MAGIC.length + 4 + MAX_HEADER_BYTES;

/**
 * Errors (request `error`, Pano Host `hostError` or job `error`) that have their own sentence under
 * `pages.settings.backups.errors.*`. Anything else falls back to the generic one with the code.
 */
export const KNOWN_ERRORS = Object.freeze([
  'CURRENT_PASSWORD_NOT_CORRECT',
  'PANO_BACKUP_BUSY',
  'BACKUP_BUSY',
  'FILE_TOO_LARGE',
  'BAD_REQUEST',
  'NOT_EXISTS',
  'NOT_AN_ARCHIVE',
  'UNSUPPORTED_FORMAT',
  'PASSPHRASE_REQUIRED',
  'WRONG_PASSPHRASE',
  'TAMPERED',
  'TRUNCATED',
  'INVALID_ARCHIVE',
  'UNSAFE_ENTRY',
  'UNSAFE_SQL',
  'TOO_LARGE',
  'WRONG_KIND',
  'ARCHIVE_NEWER_THAN_TARGET',
  'HASH_MISMATCH',
  'RESTORE_FAILED',
  'ROLLBACK_FAILED',
  'SAFETY_BACKUP_FAILED',
  'DATABASE_CONNECTION_FAILED',
  'INTERNAL_ERROR',
  'PANO_HOST_UNAVAILABLE',
  'PANO_HOST_NOT_LINKED',
  'PASSPHRASE_NOT_SET',
  'NOT_AVAILABLE',
  'INVALID_TOKEN',
  'UPLOAD_FAILED',
  'DOWNLOAD_FAILED',
  'INTEGRITY_FAILED',
  'PAYMENT_REQUIRED',
  'QUOTA_EXCEEDED',
  'QUOTA_EXCEEDED_QUOTA',
  'QUOTA_EXCEEDED_FREQUENCY',
  'QUOTA_EXCEEDED_OPEN_UPLOADS',
  'NO_PERMISSION',
  'WORKLOAD_NOT_FOUND',
  'TRANSFER_NOT_FOUND',
  'BACKUP_NOT_FOUND',
  'NOT_A_FULL_BACKUP',
  'NETWORK_ERROR',
]);

/**
 * @param {ArrayLike<number> | null | undefined} bytes the first bytes of a file.
 * @returns {{ type: 'encrypted' | 'plain' | 'unknown', keyMode: string | null }} `encrypted` = a
 *   `.panoarc` envelope (`keyMode` from its header when it fits), `plain` = a zip (export format).
 */
export function inspectArchiveHeader(bytes) {
  const data = bytes ? Array.from(bytes) : [];

  if (data.length >= 4 && data[0] === 0x50 && data[1] === 0x4b && data[2] === 3 && data[3] === 4) {
    return { type: 'plain', keyMode: null };
  }

  if (data.length < ENVELOPE_MAGIC.length || ENVELOPE_MAGIC.some((b, i) => data[i] !== b)) {
    return { type: 'unknown', keyMode: null };
  }

  let keyMode = null;
  const offset = ENVELOPE_MAGIC.length;

  if (data.length >= offset + 4) {
    const length =
      ((data[offset] << 24) >>> 0) +
      (data[offset + 1] << 16) +
      (data[offset + 2] << 8) +
      data[offset + 3];

    if (length >= 2 && length <= MAX_HEADER_BYTES && data.length >= offset + 4 + length) {
      try {
        const text = new TextDecoder().decode(
          Uint8Array.from(data.slice(offset + 4, offset + 4 + length)),
        );
        const header = JSON.parse(text);

        keyMode = typeof header?.keyMode === 'string' ? header.keyMode : null;
      } catch {
        keyMode = null;
      }
    }
  }

  return { type: 'encrypted', keyMode };
}

/**
 * Reads the start of a picked file in the browser, so the restore dialog knows whether it needs a
 * passphrase before anything is uploaded (a failed setup/panel restore deletes the upload).
 *
 * @param {Blob} file
 */
export async function inspectArchiveFile(file) {
  const buffer = await file.slice(0, ARCHIVE_SNIFF_BYTES).arrayBuffer();

  return inspectArchiveHeader(new Uint8Array(buffer));
}

/**
 * @param {{ status?: string } | null | undefined} job
 * @returns {boolean}
 */
export function isJobRunning(job) {
  return job?.status === 'RUNNING';
}

/**
 * @param {{ bytesDone?: number, bytesTotal?: number } | null | undefined} job
 * @returns {number | null} 0–100 when the job reports bytes, else null (indeterminate bar).
 */
export function jobPercent(job) {
  const total = Number(job?.bytesTotal) || 0;

  if (total <= 0) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.floor(((Number(job?.bytesDone) || 0) / total) * 100)));
}

/**
 * @param {{ usedBytes?: number, quotaBytes?: number } | null | undefined} usage
 * @returns {number | null}
 */
export function usagePercent(usage) {
  const quota = Number(usage?.quotaBytes) || 0;

  if (quota <= 0) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(((Number(usage?.usedBytes) || 0) / quota) * 100)));
}

/**
 * @param {string} passphrase
 * @param {string} confirmation
 * @returns {'too-short' | 'mismatch' | null}
 */
export function passphraseProblem(passphrase, confirmation) {
  if ((passphrase || '').length < MIN_PASSPHRASE_LENGTH) {
    return 'too-short';
  }

  if (passphrase !== confirmation) {
    return 'mismatch';
  }

  return null;
}

/**
 * @param {Array<number | string>} ids
 * @param {number | string} id
 * @returns {number[]} a new list with `id` added or removed (numbers, sorted, no duplicates).
 */
export function toggleId(ids, id) {
  const wanted = Number(id);
  const set = new Set((ids || []).map(Number).filter((value) => Number.isFinite(value)));

  if (set.has(wanted)) {
    set.delete(wanted);
  } else if (Number.isFinite(wanted)) {
    set.add(wanted);
  }

  return [...set].sort((a, b) => a - b);
}

/**
 * @param {number | null | undefined} ms
 * @param {string} [locale]
 */
function formatTime(ms, locale) {
  const value = Number(ms);

  return Number.isFinite(value) && value > 0 ? new Date(value).toLocaleString(locale) : '';
}

/**
 * Turns an error into a lang key + values. Accepts a response body (`{error, hostError?, …}`) or a
 * job (`{error, details?, rolledBack?}`); Pano Host errors are unwrapped from `PANO_HOST_ERROR`.
 *
 * @param {object | null | undefined} source
 * @param {{ locale?: string }} [options]
 * @returns {{ code: string, key: string, values: Record<string, string | number> } | null}
 */
export function describeError(source, options = {}) {
  if (!source || !source.error) {
    return null;
  }

  const details = { ...(source.details || {}), ...source };
  let code = String(source.error);

  if (code === 'PANO_HOST_ERROR') {
    code = String(source.hostError || 'PANO_HOST_UNAVAILABLE');
  }

  if (code === 'QUOTA_EXCEEDED' && details.reason) {
    const specific = `QUOTA_EXCEEDED_${String(details.reason).toUpperCase()}`;

    if (KNOWN_ERRORS.includes(specific)) {
      code = specific;
    }
  }

  const values = {
    code,
    nextAllowedAt: formatTime(details.nextAllowedAt, options.locale),
    quota: details.quotaBytes != null ? formatBytes(Number(details.quotaBytes)) : '',
    used: details.usedBytes != null ? formatBytes(Number(details.usedBytes)) : '',
    max: details.maxBytes != null ? formatBytes(Number(details.maxBytes)) : '',
    minLength: Number(details.minLength) || MIN_PASSPHRASE_LENGTH,
  };

  const key = KNOWN_ERRORS.includes(code)
    ? `pages.settings.backups.errors.${code}`
    : 'pages.settings.backups.errors.generic';

  return { code, key, values };
}

/**
 * @param {string | null | undefined} tag `MANUAL` | `SCHEDULED` | `PRE_RESTORE`.
 */
export function tagColour(tag) {
  return { MANUAL: 'primary', SCHEDULED: 'info', PRE_RESTORE: 'warning' }[tag || ''] || 'secondary';
}

/**
 * Transfer statuses of the control plane (host_transfer) and whether they are still moving.
 */
export const TRANSFER_STATUSES = Object.freeze([
  'UPLOADING',
  'AWAITING_CONFIRMATION',
  'RESTORING',
  'DONE',
  'FAILED',
  'REJECTED',
  'CANCELED',
  'EXPIRED',
]);

/**
 * @param {string | null | undefined} status
 */
export function isTransferOpen(status) {
  return status === 'UPLOADING' || status === 'AWAITING_CONFIRMATION' || status === 'RESTORING';
}

/**
 * @param {string | null | undefined} status
 */
export function transferColour(status) {
  return (
    {
      UPLOADING: 'info',
      AWAITING_CONFIRMATION: 'warning',
      RESTORING: 'info',
      DONE: 'success',
      FAILED: 'danger',
      REJECTED: 'danger',
      CANCELED: 'secondary',
      EXPIRED: 'secondary',
    }[status || ''] || 'secondary'
  );
}

/**
 * The device-code poll interval in ms, never faster than 2 s nor slower than 30 s.
 *
 * @param {number | null | undefined} seconds
 */
export function pollDelay(seconds) {
  const value = Number(seconds);

  return Math.min(30, Math.max(2, Number.isFinite(value) && value > 0 ? value : 5)) * 1000;
}
