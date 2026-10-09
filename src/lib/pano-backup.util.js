/**
 * Pure helpers of the backups page (/backups): archive sniffing, job progress, the
 * mapping of backend/Pano Host error codes to lang keys, and small form rules. Kept free of
 * Svelte and `$lib` imports so `bun test` runs them as they are.
 */
import { formatBytes } from './string.util.js';

/** Local schedule (`PUT /api/v1/panel/pano-backups/settings`). */
export const LOCAL_SCHEDULES = Object.freeze(['OFF', 'DAILY', 'WEEKLY']);

/** Pano Backup schedule (`PUT …/remote/settings`); plans have no frequency limit. */
export const REMOTE_SCHEDULES = Object.freeze(['OFF', 'DAILY', 'WEEKLY']);

/** The panel page that runs the panomc.com platform connection flow. */
export const CONNECT_PATH = '/settings/platform';

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
  'CONNECT_REQUIRED',
  'STOPPED_REMOTELY',
  'PASSPHRASE_NOT_SET',
  'NOT_AVAILABLE',
  'INVALID_TOKEN',
  'UPLOAD_FAILED',
  'DOWNLOAD_FAILED',
  'INTEGRITY_FAILED',
  'PAYMENT_REQUIRED',
  'PAYMENT_REQUIRED_NO_SUBSCRIPTION',
  'PAYMENT_REQUIRED_LAPSED',
  'QUOTA_EXCEEDED',
  'QUOTA_EXCEEDED_QUOTA',
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
 * Account-wide Pano Backup usage, from the panel's `usage {used, reserved, quota, free}` or the
 * control plane's `usage {usedBytes, reservedBytes, quotaBytes, freeBytes}`.
 *
 * @param {Record<string, any> | null | undefined} usage
 * @returns {{ used: number, reserved: number, quota: number | null, free: number | null, percent: number | null } | null}
 *   `percent` counts running uploads too (they already hold their space); null without a quota.
 */
export function accountUsage(usage) {
  if (!usage) {
    return null;
  }

  const used = Math.max(0, Number(usage.used ?? usage.usedBytes) || 0);
  const reserved = Math.max(0, Number(usage.reserved ?? usage.reservedBytes) || 0);
  const rawQuota = usage.quota ?? usage.quotaBytes;
  const quota = rawQuota == null || !(Number(rawQuota) > 0) ? null : Number(rawQuota);
  const rawFree = usage.free ?? usage.freeBytes;
  const free =
    quota == null
      ? null
      : rawFree != null && Number.isFinite(Number(rawFree))
        ? Math.max(0, Number(rawFree))
        : Math.max(0, quota - used - reserved);
  const percent =
    quota == null
      ? null
      : Math.max(0, Math.min(100, Math.round(((used + reserved) / quota) * 100)));

  return { used, reserved, quota, free, percent };
}

/**
 * @param {Record<string, any> | null | undefined} usage
 * @returns {number | null}
 */
export function usagePercent(usage) {
  return accountUsage(usage)?.percent ?? null;
}

/**
 * @param {number | null | undefined} percent
 * @returns {'danger' | 'warning' | 'primary'} the usage bar colour.
 */
export function usageColour(percent) {
  if (percent != null && percent >= 90) {
    return 'danger';
  }

  return percent != null && percent >= 75 ? 'warning' : 'primary';
}

/**
 * The connection state of `GET /api/v1/panel/pano-backups/remote`.
 *
 * @param {Record<string, any> | null | undefined} remote
 * @returns {'connected' | 'not-connected' | 'unavailable'} `not-connected` = show the connect prompt
 *   (never connected, or the platform connection was revoked); `unavailable` = connected, but
 *   panomc.com could not be asked (plan and usage unknown).
 */
export function connectionState(remote) {
  if (!remote || remote.error || !remote.connected) {
    return 'not-connected';
  }

  const code = remote.hostError?.code;

  if (code === 'CONNECT_REQUIRED') {
    return 'not-connected';
  }

  return code ? 'unavailable' : 'connected';
}

/**
 * A Pano Host manage page on the Pano website this panel is configured with (siteInfo's website
 * URL, `PANO_WEBSITE_URL`), e.g. `<website>/host/manage/instances`.
 *
 * @param {string | null | undefined} websiteUrl
 * @param {'backups' | 'instances'} [section]
 */
export function hostManageUrl(websiteUrl, section = 'backups') {
  const origin = String(websiteUrl || 'https://panomc.com').replace(/\/+$/, '');

  return `${origin}/host/manage/${section}`;
}

/**
 * The website's Pano Backup plan page, with this panel's backups page as `panoCallback` — the same
 * round trip as installing from the store: the website sends the browser back to
 * `<panoCallback>?planUpdated` once a plan is picked (or `?back` when the owner just returns).
 *
 * @param {string} websiteUrl `PANO_WEBSITE_URL`.
 * @param {string} callback absolute URL of this panel's backups page.
 */
export function backupPlanUrl(websiteUrl, callback) {
  const origin = String(websiteUrl || 'https://panomc.com').replace(/\/+$/, '');

  return `${origin}/host/manage/backups?panoCallback=${encodeURIComponent(callback)}`;
}

/**
 * @param {Record<string, any> | null | undefined} backup a control-plane backup row.
 * @returns {boolean} whether this Pano can restore it (any finished Pano backup of the account).
 */
export function canRestoreRemote(backup) {
  return backup?.status === 'DONE' && backup?.kind !== 'mc-server';
}

/**
 * Groups `GET …/remote/backups` for the page: this Pano first, then the account's other Panos
 * (newest activity first, as sent); lapsed/failed rows are left to the website.
 *
 * @param {Record<string, any> | null | undefined} list
 * @returns {{ instanceId: string, instanceName: string, current: boolean, connected: boolean | null,
 *   usedBytes: number, lastBackupAt: number | null, backups: any[] }[]}
 */
export function groupRemoteBackups(list) {
  const panos = Array.isArray(list?.panos) ? list.panos : [];

  return panos
    .map((pano, index) => ({
      index,
      instanceId: String(pano?.instanceId ?? ''),
      instanceName: String(pano?.instanceName || pano?.instanceId || ''),
      current:
        pano?.current === true || (!!list?.instanceId && pano?.instanceId === list.instanceId),
      connected: typeof pano?.connected === 'boolean' ? pano.connected : null,
      usedBytes: Number(pano?.usedBytes) || 0,
      lastBackupAt: pano?.lastBackupAt ?? null,
      backups: (Array.isArray(pano?.backups) ? pano.backups : []).filter(
        (backup) => backup && (backup.status === 'DONE' || backup.status === 'UPLOADING'),
      ),
    }))
    .filter((pano) => pano.current || pano.backups.length > 0)
    .sort((a, b) => Number(b.current) - Number(a.current) || a.index - b.index)
    .map(({ index: _index, ...pano }) => pano);
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
 * Turns an error into a lang key + values. Accepts a response body (`{ error: { code, details } }`, `hostError` and `reason` sit in `details`) or a
 * job (`{error, details?, rolledBack?}`); Pano Host errors are unwrapped from `PANO_HOST_ERROR`.
 *
 * @param {object | null | undefined} source
 * @param {{ locale?: string, website?: string }} [options] `website`: the Pano website's host
 *   (`{website}` in the texts), see `describeBackupError`.
 * @returns {{ code: string, key: string, values: Record<string, string | number> } | null}
 */
export function describeError(source, options = {}) {
  if (!source || !source.error) {
    return null;
  }

  // A response body carries the envelope `{ error: { code, details } }`; a job record keeps its
  // own flat `{ error: 'CODE', details }` shape. Both read the same way below.
  const envelope = typeof source.error === 'object' ? source.error : null;
  const details = envelope
    ? { ...(envelope.details || {}) }
    : { ...(source.details || {}), ...source };
  let code = String(envelope ? envelope.code : source.error);

  if (code === 'PANO_HOST_ERROR') {
    code = String(details.hostError || 'PANO_HOST_UNAVAILABLE');
  }

  if ((code === 'QUOTA_EXCEEDED' || code === 'PAYMENT_REQUIRED') && details.reason) {
    const specific = `${code}_${String(details.reason).toUpperCase()}`;

    if (KNOWN_ERRORS.includes(specific)) {
      code = specific;
    }
  }

  const values = {
    code,
    graceUntil: formatTime(details.graceUntil, options.locale),
    quota: details.quotaBytes != null ? formatBytes(Number(details.quotaBytes)) : '',
    used: details.usedBytes != null ? formatBytes(Number(details.usedBytes)) : '',
    max: details.maxBytes != null ? formatBytes(Number(details.maxBytes)) : '',
    minLength: Number(details.minLength) || MIN_PASSPHRASE_LENGTH,
    website: options.website || 'panomc.com',
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
 * Waits for Pano to come back after a restore restarted it, so the page is not reloaded into a
 * dead port. `probe` answers whether Pano responds right now. It returns once Pano was seen down
 * and is up again; a Pano that never goes down (it is restarted by hand later) is taken as up
 * after `graceMs`. Gives up after `timeoutMs` and returns false.
 *
 * @param {{
 *   probe: () => Promise<boolean>,
 *   sleep?: (ms: number) => Promise<void>,
 *   now?: () => number,
 *   intervalMs?: number,
 *   graceMs?: number,
 *   timeoutMs?: number,
 * }} options
 * @returns {Promise<boolean>}
 */
export async function waitForRestart({
  probe,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
  intervalMs = 1500,
  graceMs = 15000,
  timeoutMs = 180000,
}) {
  const startedAt = now();
  let sawDown = false;

  while (now() - startedAt < timeoutMs) {
    const up = await probe().catch(() => false);

    if (!up) {
      sawDown = true;
    } else if (sawDown || now() - startedAt >= graceMs) {
      return true;
    }

    await sleep(intervalMs);
  }

  return false;
}
