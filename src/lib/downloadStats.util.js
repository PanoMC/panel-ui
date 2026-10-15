/**
 * Size, speed and time left of a download, from the `downloadedBytes` / `totalBytes` a progress
 * event carries. The speed is smoothed so the figure does not jump with every chunk.
 */

/** Weight of the newest sample in the smoothed speed. */
const SMOOTHING = 0.3;

/** Samples closer together than this are folded into the next one (a burst of tiny chunks). */
const MIN_SAMPLE_MS = 250;

/**
 * @typedef {{ downloaded: number, total: number | null, speed: number | null, secondsLeft: number | null }} DownloadStats
 */

export function createDownloadTracker() {
  /** @type {{ at: number, bytes: number } | null} */
  let last = null;
  /** @type {number | null} bytes per second */
  let speed = null;

  return {
    /**
     * @param {number} downloaded
     * @param {number | null | undefined} total
     * @param {number} [now]
     * @returns {DownloadStats}
     */
    update(downloaded, total, now = Date.now()) {
      if (last == null || downloaded < last.bytes) {
        last = { at: now, bytes: downloaded };
      } else if (now - last.at >= MIN_SAMPLE_MS) {
        const sample = ((downloaded - last.bytes) * 1000) / (now - last.at);

        speed = speed == null ? sample : SMOOTHING * sample + (1 - SMOOTHING) * speed;
        last = { at: now, bytes: downloaded };
      }

      const size = total != null && total > 0 ? total : null;
      const secondsLeft =
        size != null && speed != null && speed > 0
          ? Math.max(0, Math.ceil((size - downloaded) / speed))
          : null;

      return { downloaded, total: size, speed, secondsLeft };
    },

    reset() {
      last = null;
      speed = null;
    },
  };
}

/**
 * The stats of a progress event, or null when it carries no byte counts (an older Pano, or a
 * step that is not a download).
 *
 * @param {ReturnType<typeof createDownloadTracker>} tracker
 * @param {Record<string, any>} message
 * @returns {DownloadStats | null}
 */
export function trackDownload(tracker, message) {
  const downloaded = Number(message?.downloadedBytes);

  if (!Number.isFinite(downloaded)) {
    return null;
  }

  const total = Number(message?.totalBytes);

  return tracker.update(downloaded, Number.isFinite(total) ? total : null);
}
