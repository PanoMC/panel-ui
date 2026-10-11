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

/** Pano Backup type (`PUT …/remote/settings` `mode`): snapshots by default. */
export const BACKUP_MODES = Object.freeze(['SNAPSHOT', 'FULL']);

/**
 * @param {unknown} mode
 * @returns {'SNAPSHOT' | 'FULL'} the backup type to use; anything unknown is the default, snapshot.
 */
export function normaliseMode(mode) {
  return mode === 'FULL' ? 'FULL' : 'SNAPSHOT';
}

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
  'TRANSFER_FAILED',
  'TRANSFER_CODE_INVALID',
  'TRANSFER_CODE_REQUIRED',
  'TRANSFER_CODE_COOLDOWN',
  'TRANSFER_TIMEOUT',
  'QUOTA_EXCEEDED_TRANSFER',
  'BACKUP_NOT_FOUND',
  'NOT_A_FULL_BACKUP',
  'NETWORK_ERROR',
  'SNAPSHOT_BUSY',
  'SNAPSHOT_NOT_FOUND',
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
 * @param {{ bytesDone?: number, bytesTotal?: number, percent?: number | null } | null | undefined} job
 * @returns {number | null} 0–100 when the job reports bytes (or a percent of the remote side), else null
 *   (indeterminate bar).
 */
export function jobPercent(job) {
  const total = Number(job?.bytesTotal) || 0;

  if (total <= 0) {
    const remote = job?.percent;

    return typeof remote === 'number' && Number.isFinite(remote)
      ? Math.max(0, Math.min(100, Math.round(remote)))
      : null;
  }

  return Math.max(0, Math.min(100, Math.floor(((Number(job?.bytesDone) || 0) / total) * 100)));
}

/** Speed is measured over the last ten seconds of samples, which also smooths the jumps of part-wise uploads. */
export const SPEED_WINDOW_MS = 10_000;

/**
 * Adds one poll of a running job to its speed samples.
 *
 * @param {Array<{ at: number, bytes: number, phase: string | null }>} samples earlier samples of this job.
 * @param {{ at: number, bytes: number, phase?: string | null }} sample epoch ms, `bytesDone`, `phase`.
 * @returns {{ samples: Array<{ at: number, bytes: number, phase: string | null }>, bytesPerSecond: number | null }}
 *   `bytesPerSecond` is null while nothing moved in the window (or there is only one sample).
 */
export function jobSpeed(samples, sample) {
  const next = { at: sample.at, bytes: Number(sample.bytes) || 0, phase: sample.phase ?? null };
  const last = samples[samples.length - 1];

  // A new phase or counter restarted from zero measures from scratch.
  let kept =
    last && (last.phase !== next.phase || next.bytes < last.bytes || next.at <= last.at)
      ? []
      : samples.slice();

  kept.push(next);

  while (kept.length > 2 && kept[0].at < next.at - SPEED_WINDOW_MS) {
    kept.shift();
  }

  const first = kept[0];
  const seconds = (next.at - first.at) / 1000;
  const moved = next.bytes - first.bytes;

  return {
    samples: kept,
    bytesPerSecond: kept.length >= 2 && seconds > 0 && moved > 0 ? moved / seconds : null,
  };
}

/**
 * @param {number | null | undefined} bytesPerSecond
 * @returns {string} e.g. `3.2 MB/s`, or an empty string when there is no speed.
 */
export function formatSpeed(bytesPerSecond) {
  const value = Number(bytesPerSecond);

  return Number.isFinite(value) && value > 0 ? `${formatBytes(value)}/s` : '';
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
 * @param {'backups' | 'instances' | 'new'} [section]
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
 * @param {number | null | undefined} bytes
 * @returns {string} a short size, or a dash when the number is missing.
 */
export function formatSnapshotBytes(bytes) {
  const value = Number(bytes);

  return bytes == null || !Number.isFinite(value) || value < 0 ? '—' : formatBytes(value);
}

/**
 * @param {Record<string, any> | null | undefined} snapshot
 * @returns {boolean} whether this Pano can restore it.
 */
export function canRestoreSnapshot(snapshot) {
  return snapshot?.status === 'DONE';
}

/**
 * @param {Record<string, any> | null | undefined} snapshot
 * @returns {boolean} whether it can be downloaded as a `.panoarc` (any finished snapshot of the account).
 */
export function canDownloadSnapshot(snapshot) {
  return snapshot?.status === 'DONE';
}

/**
 * @param {string} jobId the finished `DOWNLOAD` job.
 * @returns {string} where the archive that job built is fetched from.
 */
export function snapshotDownloadUrl(jobId) {
  return `/api/v1/panel/pano-backups/remote/downloads/${encodeURIComponent(jobId)}`;
}

/**
 * @param {Record<string, any> | null | undefined} snapshot
 * @returns {boolean} only this Pano's own finished or failed snapshots can be deleted.
 */
export function canDeleteSnapshot(snapshot) {
  return snapshot?.own === true && (snapshot?.status === 'DONE' || snapshot?.status === 'FAILED');
}

/**
 * Why a snapshot failed: a full storage has its own short sentence (and the page offers the plan
 * link), any other reason the usual error text.
 *
 * @param {Record<string, any> | null | undefined} snapshot
 * @returns {{ key: string, values: Record<string, string | number>, storageFull: boolean } | null}
 *   null unless the snapshot failed.
 */
export function snapshotProblem(snapshot) {
  if (snapshot?.status !== 'FAILED') {
    return null;
  }

  const code = String(snapshot.error?.code ?? snapshot.error ?? '');

  if (code === 'QUOTA_EXCEEDED') {
    return { key: 'pages.settings.backups.snapshot.storage-full', values: {}, storageFull: true };
  }

  const described = describeError({ error: code || 'INTERNAL_ERROR' });

  return {
    key:
      described?.code === 'INTERNAL_ERROR' || !KNOWN_ERRORS.includes(described?.code ?? '')
        ? 'pages.settings.backups.snapshot.failed'
        : described.key,
    values: described?.values ?? {},
    storageFull: false,
  };
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
 * @param {{ locale?: string, website?: string, context?: 'transfer' }} [options] `website`: the Pano
 *   website's host (`{website}` in the texts), see `describeBackupError`; `context: 'transfer'` words a
 *   `QUOTA_EXCEEDED` for a transfer (the archive does not fit the instance).
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

  // The archive does not fit the chosen instance: not the Pano Backup limit.
  if (code === 'QUOTA_EXCEEDED' && options.context === 'transfer') {
    code = 'QUOTA_EXCEEDED_TRANSFER';
  } else if ((code === 'QUOTA_EXCEEDED' || code === 'PAYMENT_REQUIRED') && details.reason) {
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
    seconds: Number(details.retryAfterSeconds) || 0,
    minLength: Number(details.minLength) || MIN_PASSPHRASE_LENGTH,
    website: options.website || 'panomc.com',
  };

  const key = KNOWN_ERRORS.includes(code)
    ? `pages.settings.backups.errors.${code}`
    : 'pages.settings.backups.errors.generic';

  return { code, key, values };
}

/**
 * @param {number | string | null | undefined} resendAfter when a new transfer code may be asked for (epoch
 *   milliseconds; a value that small is taken as epoch seconds).
 * @param {number} now epoch milliseconds.
 * @returns {number} whole seconds left until then; 0 when it has passed or is unknown.
 */
export function resendWaitSeconds(resendAfter, now) {
  const value = Number(resendAfter);

  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const at = value < 1e11 ? value * 1000 : value;

  return Math.max(0, Math.ceil((at - now) / 1000));
}

/**
 * @param {string | null | undefined} tag `MANUAL` | `SCHEDULED` | `PRE_RESTORE`.
 */
export function tagColour(tag) {
  return { MANUAL: 'primary', SCHEDULED: 'info', PRE_RESTORE: 'warning' }[tag || ''] || 'secondary';
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
