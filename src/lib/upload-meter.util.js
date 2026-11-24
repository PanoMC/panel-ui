/**
 * The pure half of uploads (no browser, no API): the progress meter, the archive formats and the
 * small readers around them. Kept apart so the tests run without the SDK.
 */

/** The speed is the average over this window. */
export const UPLOAD_SPEED_WINDOW_MS = 5_000;

/** Before this much time has passed the time left is "calculating". */
export const UPLOAD_ETA_WARMUP_MS = 2_000;

/**
 * @typedef {object} UploadStats
 * @property {number} loaded bytes sent so far
 * @property {number} total bytes to send
 * @property {number} percent 0..100, whole numbers
 * @property {number | null} speed bytes per second, null while it cannot be told yet
 * @property {number | null} secondsLeft null while calculating
 * @property {boolean} sent every byte went out; the server is still working on the answer
 */

/**
 * Turns progress events into {@link UploadStats}. Pure, so it is tested without a browser.
 *
 * @param {number} total
 * @param {number} [startedAt]
 */
export function createUploadMeter(total, startedAt = Date.now()) {
  /** @type {Array<{ at: number, bytes: number }>} */
  let samples = [{ at: startedAt, bytes: 0 }];
  /** The file size: what the admin sees. The browser's total also counts the multipart framing. */
  const fileSize = Math.max(0, Number(total) || 0);
  let size = fileSize;

  return {
    /**
     * @param {number} loaded
     * @param {number | null} [eventTotal] the total the browser reports (it includes the multipart framing).
     * @param {number} [now]
     * @returns {UploadStats}
     */
    update(loaded, eventTotal = null, now = Date.now()) {
      let bytes = Math.max(0, Number(loaded) || 0);

      if (eventTotal != null && eventTotal > 0) {
        if (fileSize > 0) {
          bytes = Math.round((Math.min(bytes, eventTotal) / eventTotal) * fileSize);
        } else {
          size = eventTotal;
        }
      }

      bytes = size > 0 ? Math.min(bytes, size) : bytes;

      samples.push({ at: now, bytes });

      while (samples.length > 2 && samples[1].at <= now - UPLOAD_SPEED_WINDOW_MS) {
        samples.shift();
      }

      const first = samples[0];
      const seconds = (now - first.at) / 1000;
      const moved = bytes - first.bytes;
      const speed = seconds > 0 && moved > 0 ? moved / seconds : null;
      const warm = now - startedAt >= UPLOAD_ETA_WARMUP_MS;
      const sent = size > 0 && bytes >= size;

      return {
        loaded: bytes,
        total: size,
        percent: size > 0 ? Math.min(100, Math.floor((bytes / size) * 100)) : 0,
        speed: warm ? speed : null,
        secondsLeft: sent ? 0 : warm && speed ? Math.ceil((size - bytes) / speed) : null,
        sent,
      };
    },
  };
}

/**
 * The code a failed task's `error` starts with (`NOT_ENOUGH_SPACE: …`), or ''.
 *
 * @param {unknown} error
 */
export function taskErrorCode(error) {
  const match = /^\s*([A-Z][A-Z0-9_]+)\s*(?::|$)/.exec(String(error ?? ''));

  return match ? match[1] : '';
}

/** What a server can be created from, as `format` of the check. */
export const ARCHIVE_FORMATS = Object.freeze([
  'zip',
  'tar',
  'tar.gz',
  'tar.bz2',
  'tar.xz',
  'gz',
  '7z',
  'rar',
]);

/** The drop zone's accept list for those formats. */
export const ARCHIVE_ACCEPT = Object.freeze([
  '.zip',
  '.tar',
  '.tar.gz',
  '.tgz',
  '.tar.bz2',
  '.tbz2',
  '.tbz',
  '.tar.xz',
  '.txz',
  '.gz',
  '.7z',
  '.rar',
]);

/** Formats whose content is only unpacked after the last byte came in. */
export const EXTRACT_AFTER_UPLOAD = Object.freeze(['7z', 'rar']);

/**
 * @param {Uint8Array} bytes
 * @param {number[]} signature
 * @param {number} [offset]
 */
function startsWith(bytes, signature, offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

/**
 * The archive format of the first bytes of a file, from the magic numbers; '' when it is none of
 * the accepted ones. A compressed stream is called a tarball when the name says so (the tar
 * header is inside the compressed data), `gz` otherwise.
 *
 * @param {Uint8Array} bytes at least the first 512 bytes, when the file has them.
 * @param {string} [name]
 * @returns {string}
 */
export function archiveFormatOf(bytes, name = '') {
  const lower = String(name).toLowerCase();

  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])) {
    return 'zip';
  }

  if (startsWith(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    return '7z';
  }

  if (startsWith(bytes, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) {
    return 'rar';
  }

  if (startsWith(bytes, [0x1f, 0x8b])) {
    return /\.(tar\.gz|tgz)$/.test(lower) ? 'tar.gz' : 'gz';
  }

  if (startsWith(bytes, [0x42, 0x5a, 0x68])) {
    return 'tar.bz2';
  }

  if (startsWith(bytes, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) {
    return 'tar.xz';
  }

  if (startsWith(bytes, [0x75, 0x73, 0x74, 0x61, 0x72], 257)) {
    return 'tar';
  }

  return '';
}

/**
 * {@link archiveFormatOf} for a picked file.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function detectArchiveFormat(file) {
  const buffer = await file.slice(0, 512).arrayBuffer();

  return archiveFormatOf(new Uint8Array(buffer), file.name);
}

/**
 * The name of a server made from an archive: the file name without its archive extension.
 *
 * @param {string} name
 */
export function stripArchiveExtension(name) {
  return String(name || '').replace(
    /\.(tar\.gz|tar\.bz2|tar\.xz|tgz|tbz2?|txz|zip|tar|gz|bz2|xz|7z|rar)$/i,
    '',
  );
}
