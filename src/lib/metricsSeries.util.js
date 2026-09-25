/**
 * Shared helpers for the server metric charts (the Overview's vital cards and its Performance
 * chart): the bucket each stored range is rolled up into, the "no data is zero" gap rule and the
 * time formatting that can follow the server's own time zone (§2.4.25).
 *
 * Everything here is pure: same input, same output, no DOM and no stores.
 */

/**
 * The stored ranges `GET /servers/:id/metrics` answers and the bucket (ms) each one is rolled up
 * into. `1m` is not a stored range — the panel draws it from live samples only.
 *
 * @type {Readonly<Record<string, number>>}
 */
export const METRIC_RANGE_BUCKET_MS = Object.freeze({
  '1h': 60_000,
  '12h': 300_000,
  '24h': 600_000,
  '7d': 3_600_000,
  '30d': 21_600_000,
});

/** How long each selectable window is, in ms — also how far back live samples are kept. */
export const METRIC_RANGE_WINDOW_MS = Object.freeze({
  '1m': 60_000,
  '1h': 3_600_000,
  '12h': 43_200_000,
  '24h': 86_400_000,
  '7d': 604_800_000,
  '30d': 2_592_000_000,
});

/**
 * §2.4.23 — the refresh intervals the panel offers wherever live metrics are shown (the server
 * Overview's toolbar, the servers modal), in ms; 0 is Paused.
 */
export const METRIC_REFRESH_INTERVALS = Object.freeze([
  500, 1000, 2000, 5000, 10000, 30000, 60000, 0,
]);
export const METRIC_REFRESH_INTERVAL_DEFAULT = 1000;
/** Paused still keeps the feed open, at the sources' own pace. */
export const METRIC_PAUSED_INTERVAL_MS = 10000;

/**
 * @param {number} interval a [METRIC_REFRESH_INTERVALS] entry.
 * @param {(key: string, options?: object) => string} t the `svelte-i18n` formatter.
 * @returns {string} "0.5 s", "1 min", "Paused" — in the panel's language.
 */
export function metricRefreshIntervalLabel(interval, t) {
  if (interval === 0) {
    return t('pages.servers.overview.refresh-paused');
  }

  return interval >= 60000
    ? t('pages.servers.overview.refresh-interval-minutes', { values: { count: interval / 60000 } })
    : t('pages.servers.overview.refresh-interval-seconds', { values: { count: interval / 1000 } });
}

/**
 * @param {number} interval a [METRIC_REFRESH_INTERVALS] entry.
 * @returns {number} the `metricsIntervalMs` to ask the hub for (Paused asks for the default pace).
 */
export function metricRequestInterval(interval) {
  return interval === 0 ? METRIC_PAUSED_INTERVAL_MS : interval;
}

/**
 * A remembered refresh interval; the default when nothing valid is stored or storage is
 * unavailable (private browsing, blocked site data, SSR).
 *
 * @param {string} key
 * @returns {number}
 */
export function loadMetricRefreshInterval(key) {
  try {
    const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    const value = stored == null ? Number.NaN : Number(stored);

    return METRIC_REFRESH_INTERVALS.includes(value) ? value : METRIC_REFRESH_INTERVAL_DEFAULT;
  } catch {
    return METRIC_REFRESH_INTERVAL_DEFAULT;
  }
}

/**
 * @param {string} key
 * @param {number} interval
 */
export function storeMetricRefreshInterval(key, interval) {
  try {
    localStorage.setItem(key, String(interval));
  } catch {
    // Storage is a convenience; the choice still holds for this visit.
  }
}

/** A stretch with no sample longer than this many usual spacings is "nothing measured". */
export const METRIC_GAP_BUCKETS = 2.5;

/**
 * "Nothing measured" drawn as zero rather than as a straight line across it (§2.4.25): a stretch
 * with no sample for more than [METRIC_GAP_BUCKETS] times the usual spacing (server stopped, node
 * offline) gets a zero one spacing after its start and one before its end, so the line drops to
 * the floor and comes back up.
 *
 * Two things are deliberately *not* a drop to zero, because both made the line hit the floor
 * every few seconds on a perfectly healthy server:
 * - a point without this value: a live sample often carries only one side's numbers (the node
 *   sends CPU and disk, the plugin heap and TPS), so a missing value is "not in this sample",
 *   not "zero" -- the point is left out and the line runs on to the next one;
 * - a gap that is only as long as the samples really are apart: the spacing is the median of
 *   the points' own intervals, never less than [bucketMs]. On the live window [bucketMs] is the
 *   refresh interval somebody picked, while the samples arrive at whatever pace the server
 *   reports (every 10 s for the plugin), and comparing against the pick called every pause an
 *   outage.
 *
 * Input: points sorted by `x` (epoch ms), `y` a number or null; the bucket size of the data in
 * ms. Output: a new array; the input is left alone.
 *
 * - `[{x:0,y:5},{x:60e3,y:null},{x:120e3,y:6}]`, bucket 60 s → the null point is left out
 * - one point a minute and a 10-minute hole, bucket 60 s → a zero a minute into the hole and a
 *   minute before its end
 * - live samples 10 s apart, bucket 1 s → no zeros (the spacing is 10 s, not 1 s)
 *
 * @param {Array<{ x: number, y: number | null }>} points
 * @param {number} bucketMs
 * @returns {Array<{ x: number, y: number }>}
 */
export function fillMetricGaps(points, bucketMs) {
  const bucket = Number(bucketMs) > 0 ? Number(bucketMs) : 60_000;
  const measured = (Array.isArray(points) ? points : [])
    .filter((point) => point && Number.isFinite(Number(point.x)) && point.y != null)
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
    .filter((point) => Number.isFinite(point.y));

  const step = Math.max(bucket, typicalSpacing(measured));
  const threshold = step * METRIC_GAP_BUCKETS;
  const out = [];

  measured.forEach((point, index) => {
    const previous = measured[index - 1];

    if (previous && point.x - previous.x > threshold) {
      out.push({ x: previous.x + step, y: 0 });
      out.push({ x: point.x - step, y: 0 });
    }

    out.push(point);
  });

  return out;
}

/**
 * [fillMetricGaps] over a whole window, with the stretches at its edges that have no data drawn
 * as zero too (§2.4.25): a chart that shows "the last day" or "this week" says 0 for the hours
 * and days nothing was measured instead of leaving them blank.
 *
 * - Before the first point: zero from [window.min] up to one spacing before it, when the first
 *   point is more than a spacing into the window.
 * - After the last point: the same up to [window.max], but only when [window.open] is false. An
 *   open window is a server that is still running, whose newest point simply has not been
 *   fetched yet; drawing that as zero would show a running server as down.
 * - Nothing measured at all: a flat zero across the window.
 *
 * @param {Array<{ x: number, y: number | null }>} points sorted by `x`.
 * @param {number} bucketMs
 * @param {{ min: number, max: number, open?: boolean }} window
 * @returns {Array<{ x: number, y: number }>}
 */
export function fillMetricWindow(points, bucketMs, window) {
  const min = Number(window?.min);
  const max = Number(window?.max);
  const filled = fillMetricGaps(points, bucketMs);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return filled;
  }

  if (filled.length === 0) {
    return [
      { x: min, y: 0 },
      { x: max, y: 0 },
    ];
  }

  const bucket = Number(bucketMs) > 0 ? Number(bucketMs) : 60_000;
  const step = Math.max(bucket, typicalSpacing(filled.filter((point) => point.y !== 0)));
  const out = [...filled];
  const first = out[0];
  const last = out[out.length - 1];

  if (first.x - min > step) {
    out.unshift({ x: min, y: 0 }, { x: first.x - step, y: 0 });
  }

  if (!window.open && max - last.x > step) {
    out.push({ x: last.x + step, y: 0 }, { x: max, y: 0 });
  }

  return out;
}

/**
 * @param {Array<{ x: number }>} points sorted by `x`.
 * @returns {number} the median interval between neighbouring points, 0 with fewer than two.
 */
function typicalSpacing(points) {
  const deltas = [];

  for (let index = 1; index < points.length; index++) {
    const delta = points[index].x - points[index - 1].x;

    if (delta > 0) {
      deltas.push(delta);
    }
  }

  if (deltas.length === 0) {
    return 0;
  }

  deltas.sort((a, b) => a - b);

  const middle = Math.floor(deltas.length / 2);

  return deltas.length % 2 ? deltas[middle] : (deltas[middle - 1] + deltas[middle]) / 2;
}

/**
 * @param {unknown} zone
 * @returns {boolean} whether `Intl` knows this IANA zone id.
 */
export function isValidTimeZone(zone) {
  if (typeof zone !== 'string' || !zone.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: zone });

    return true;
  } catch {
    return false;
  }
}

/**
 * A metric timestamp as text, in the browser's zone or — when [timeZone] is given — in the
 * server's (§2.4.25 "Server time").
 *
 * @param {number} ts epoch ms
 * @param {{ timeZone?: string, withDate?: boolean, dateOnly?: boolean, locale?: string }} [options]
 *   `withDate` adds the day and month to the time; `dateOnly` drops the time (day buckets).
 * @returns {string}
 */
export function formatMetricTime(
  ts,
  { timeZone, withDate = false, dateOnly = false, locale } = {},
) {
  const value = Number(ts);

  if (!Number.isFinite(value)) {
    return '';
  }

  /** @type {Intl.DateTimeFormatOptions} */
  const options = dateOnly
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : withDate
      ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { hour: '2-digit', minute: '2-digit' };

  if (timeZone && isValidTimeZone(timeZone)) {
    options.timeZone = timeZone;
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(value);
  } catch {
    return new Date(value).toLocaleString();
  }
}

/**
 * "At most once per interval, always the newest": what a live figure on screen needs when the
 * feed can be faster than the rate the admin picked — a server with both a node and a plugin
 * gets a merged sample on each side's frame, and the hub sends the fastest rate any watcher
 * asked for.
 *
 * The first value is applied at once; values that arrive within the interval after it are
 * held, and the newest of them is applied when the interval ends (a trailing update), so what
 * is shown is never more than one interval behind the newest value received.
 *
 * @template T
 * @param {(value: T) => void} apply
 * @param {number} [intervalMs]
 * @returns {{ push: (value: T) => void, setInterval: (ms: number) => void, cancel: () => void }}
 */
export function createLatestThrottle(apply, intervalMs = 1000) {
  let interval = intervalMs;
  let lastAppliedAt = 0;
  /** @type {T | undefined} */
  let pending;
  let hasPending = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  function flush() {
    timer = null;

    if (!hasPending) {
      return;
    }

    hasPending = false;
    lastAppliedAt = Date.now();
    apply(/** @type {T} */ (pending));
  }

  return {
    push(value) {
      pending = value;
      hasPending = true;

      if (timer != null) {
        return;
      }

      const wait = lastAppliedAt + interval - Date.now();

      if (wait <= 0) {
        flush();
      } else {
        timer = setTimeout(flush, wait);
      }
    },
    setInterval(ms) {
      interval = Math.max(0, Number(ms) || 0);
    },
    /** Drops anything held — an explicit fetch or a pause has just set the value itself. */
    cancel() {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }

      hasPending = false;
    },
  };
}

/**
 * [createLatestThrottle] per key (one per server in the servers modal), sharing one interval.
 *
 * @template T
 * @param {(key: string | number, value: T) => void} apply
 * @param {number} [intervalMs]
 */
export function createKeyedLatestThrottle(apply, intervalMs = 1000) {
  let interval = intervalMs;
  /** @type {Map<string | number, ReturnType<typeof createLatestThrottle>>} */
  const throttles = new Map();

  return {
    /**
     * @param {string | number} key
     * @param {T} value
     */
    push(key, value) {
      let throttle = throttles.get(key);

      if (!throttle) {
        throttle = createLatestThrottle((latest) => apply(key, latest), interval);
        throttles.set(key, throttle);
      }

      throttle.push(value);
    },
    /** @param {number} ms */
    setInterval(ms) {
      interval = ms;
      throttles.forEach((throttle) => throttle.setInterval(ms));
    },
    cancel() {
      throttles.forEach((throttle) => throttle.cancel());
      throttles.clear();
    },
  };
}
