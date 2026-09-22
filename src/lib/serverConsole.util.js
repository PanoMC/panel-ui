/**
 * Client-side plumbing for the live server console (§2.4.1 of the server-management contract).
 *
 * The panel keeps its own ring buffer because the hub only replays the last 500 lines over
 * REST and then pushes batches: everything the admin scrolled back to has to survive in the
 * browser. Entries are plain objects rather than strings so the view can key its virtualized
 * rows and render the synthetic "lines dropped" markers the protocol sends.
 */

import { format } from 'date-fns';

import ApiUtil from '$lib/api.util.js';
import { featureSource, isEndpointUnavailable } from '$lib/servers.util.js';

/** How many entries the browser keeps. Older ones fall off the top. */
export const CONSOLE_MAX_LINES = 5000;

/** Fixed row height of the virtualized view, in pixels. Must match the CSS line-height. */
export const CONSOLE_ROW_HEIGHT = 20;

/** `HH:mm:ss` — eight fixed-width characters plus the separating space. */
export const CONSOLE_TIME_COLUMNS = 9;

/** How many lines the REST hydrate replays — the size of the hub's ring buffer. */
export const CONSOLE_HYDRATE_LINES = 500;

/** How many commands the per-server ↑/↓ history remembers. */
export const CONSOLE_HISTORY_LIMIT = 50;

let sequence = 0;

/** Monotonic key for `{#each}`; never reused inside one page load. */
function nextEntryId() {
  sequence += 1;

  return sequence;
}

/**
 * Where a console's lines are tapped. `node` is the process' own stdout, `plugin` is
 * pano-mc-plugin's logger appender. A source this build has no label for shows no chip.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const CONSOLE_SOURCE_LABELS = Object.freeze({
  node: 'pages.servers.console.source-node',
  plugin: 'pages.servers.console.source-plugin',
});

/**
 * §2.4.17 — who taps the lines, as Pano resolved it: the node's stdout pipe, the plugin's logger
 * appender, or Pano's own ring buffer. A backend with no `features` falls back to what the last
 * `consoleState` frame reported, and one that reports neither names nothing.
 *
 * @param {object | null | undefined} server the server row.
 * @param {{ source?: string | null } | null} [state] the last `consoleState` frame, if any.
 * @returns {string} the source id, or '' when there is nothing to name.
 */
export function consoleStreamSource(server, state = null) {
  const source = featureSource(server, 'console.stream');

  // `null` is Pano saying nothing taps this server right now, which is not the same as an
  // older backend that never answered — only then is the frame's own word worth using.
  return source === undefined ? String(state?.source || '').toLowerCase() : source || '';
}

/**
 * @param {string} source a [consoleStreamSource] id.
 * @returns {string} the icon the console header shows for it.
 */
export function consoleSourceIcon(source) {
  return source === 'plugin' ? 'fa-solid fa-link' : 'fa-solid fa-server';
}

/**
 * Bootstrap text class per log level. Bootstrap utilities are global, so the virtualized view
 * can apply them dynamically without Svelte pruning them as unused scoped CSS.
 *
 * @param {string | null | undefined} level
 * @returns {string}
 */
export function consoleLevelClass(level) {
  switch (String(level || '').toUpperCase()) {
    case 'ERROR':
    case 'SEVERE':
    case 'FATAL':
      return 'text-danger';
    case 'WARN':
    case 'WARNING':
      return 'text-warning-emphasis';
    case 'DEBUG':
    case 'TRACE':
      return 'text-body-secondary';
    default:
      return '';
  }
}

/**
 * @param {number | null | undefined} time epoch millis.
 * @returns {string} local `HH:mm:ss`, or eight spaces when the line carries no timestamp.
 */
export function formatConsoleTime(time) {
  const value = Number(time);

  if (!Number.isFinite(value) || value <= 0) {
    return '--:--:--';
  }

  try {
    return format(new Date(value), 'HH:mm:ss');
  } catch {
    return '--:--:--';
  }
}

/**
 * §2.4.21 — one colour run of a line: `[start, end)` into `m`, a validated `#rrggbb` colour or
 * null for the default foreground, and the three text flags.
 *
 * @typedef {{ start: number, end: number, color: string|null, bold: boolean, italic: boolean,
 *   underline: boolean }} ConsoleColorSpan
 */

/**
 * @typedef {{ id: number, kind: 'line', t: number, l: string, m: string,
 *   c?: ConsoleColorSpan[] }} ConsoleLineEntry
 * @typedef {{ id: number, kind: 'dropped', count: number }} ConsoleDroppedEntry
 * @typedef {ConsoleLineEntry | ConsoleDroppedEntry} ConsoleEntry
 */

/** The only colour shape that ever reaches an inline `style`. */
const CONSOLE_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/** Most spans one line may carry, as on the wire (§2.4.21 A). */
export const CONSOLE_MAX_SPANS = 64;

/**
 * @param {unknown} value
 * @returns {string|null} the colour when it is exactly `#rrggbb`, otherwise null.
 */
export function safeConsoleColor(value) {
  return typeof value === 'string' && CONSOLE_COLOR_PATTERN.test(value) ? value : null;
}

/**
 * A span as the wire sends it (`[start, end, color, flags]`) or as [normalizeConsoleSpans]
 * already returned it (an object), so a stored entry can be validated again on render.
 *
 * @param {unknown} raw
 * @returns {[unknown, unknown, unknown, unknown] | null}
 */
function toSpanTuple(raw) {
  if (Array.isArray(raw)) {
    return [raw[0], raw[1], raw[2], raw[3]];
  }

  if (raw && typeof raw === 'object' && 'start' in raw) {
    const span = /** @type {Partial<ConsoleColorSpan>} */ (raw);
    const flags = (span.bold ? 1 : 0) | (span.italic ? 2 : 0) | (span.underline ? 4 : 0);

    return [span.start, span.end, span.color, flags];
  }

  return null;
}

/**
 * Validates the wire's `c` (§2.4.21) against the final text. Pano already re-validated it, but
 * this is the last stop before the DOM, so nothing is taken on trust.
 *
 * Input: `[[start, end, color|null, flags], …]` — half-open offsets into `m`, colour `#rrggbb`,
 * flags `1` bold, `2` italic, `4` underline — or the objects this function returns. Output: at most [CONSOLE_MAX_SPANS] spans, clipped to
 * `length`, sorted by `start`, with any span that overlaps the previous one, is empty, is not
 * made of integers, or carries neither a valid colour nor a flag dropped. A colour that fails
 * the pattern is read as the default foreground, keeping the span's flags.
 *
 * @param {unknown} spans
 * @param {number} length the length of the (already capped) `m`.
 * @returns {ConsoleColorSpan[]}
 */
export function normalizeConsoleSpans(spans, length) {
  if (!Array.isArray(spans) || length <= 0) {
    return [];
  }

  const parsed = [];

  for (const raw of spans.slice(0, CONSOLE_MAX_SPANS)) {
    const tuple = toSpanTuple(raw);

    if (!tuple) {
      continue;
    }

    const [start, end, color, flags] = tuple;

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      continue;
    }

    const from = Math.max(0, start);
    const to = Math.min(length, end);
    const bits = Number.isInteger(flags) && flags >= 0 && flags <= 7 ? flags : 0;
    const safeColor = safeConsoleColor(color);

    if (from >= to || (!safeColor && !bits)) {
      continue;
    }

    parsed.push({
      start: from,
      end: to,
      color: safeColor,
      bold: (bits & 1) !== 0,
      italic: (bits & 2) !== 0,
      underline: (bits & 4) !== 0,
    });
  }

  parsed.sort((a, b) => a.start - b.start);

  const result = [];

  for (const span of parsed) {
    const previous = result[result.length - 1];

    if (!previous || span.start >= previous.end) {
      result.push(span);
    }
  }

  return result;
}

/**
 * @param {{ t?: number, l?: string, m?: string, c?: unknown } | null | undefined} line
 * @returns {ConsoleLineEntry}
 */
export function toConsoleEntry(line) {
  // Never trust the text: it is rendered as text nodes only, and the length cap keeps one
  // pathological line from blowing up the virtual row width.
  const m = String(line?.m ?? '').slice(0, 4096);
  const spans = normalizeConsoleSpans(line?.c, m.length);

  /** @type {ConsoleLineEntry} */
  const entry = {
    id: nextEntryId(),
    kind: 'line',
    t: Number(line?.t) || 0,
    l: String(line?.l || 'INFO').toUpperCase(),
    m,
  };

  // Only a line that actually has colour carries the field, like on the wire.
  if (spans.length) {
    entry.c = spans;
  }

  return entry;
}

/**
 * @param {number} count
 * @returns {ConsoleDroppedEntry}
 */
export function toDroppedEntry(count) {
  return { id: nextEntryId(), kind: 'dropped', count: Number(count) || 0 };
}

/**
 * Appends a batch and trims the buffer back to [CONSOLE_MAX_LINES], returning a new array so
 * Svelte sees the change. Every line goes through [toConsoleEntry], so its colour spans come
 * along validated.
 *
 * @param {ConsoleEntry[]} buffer
 * @param {Array<{ t?: number, l?: string, m?: string, c?: unknown }>} lines
 * @param {number} [dropped] lines the backend threw away just before this batch.
 * @returns {ConsoleEntry[]}
 */
export function appendConsoleLines(buffer, lines, dropped = 0) {
  const incoming = Array.isArray(lines) ? lines : [];

  if (!incoming.length && !dropped) {
    return buffer;
  }

  const next = buffer.slice();

  if (dropped > 0) {
    next.push(toDroppedEntry(dropped));
  }

  for (const line of incoming) {
    next.push(toConsoleEntry(line));
  }

  return next.length > CONSOLE_MAX_LINES ? next.slice(next.length - CONSOLE_MAX_LINES) : next;
}

/**
 * Identity of a rendered line for the "load older" dedupe: the source file and the live stream
 * carry the same lines, so `(t, m)` is what says "this one is already on screen".
 *
 * @param {ConsoleLineEntry} entry
 * @returns {string}
 */
function consoleLineKey(entry) {
  return `${entry.t}\u0000${entry.m}`;
}

/**
 * Puts an older page (§2.4.14) in front of the buffer, dropping the lines already shown — the
 * backend counts `skip` in file lines, so a page routinely overlaps what the hydrate replayed.
 * Duplicates *inside* the page are kept: a message repeated within the same second is two real
 * lines, and only what is already on screen may be dropped.
 *
 * The buffer is deliberately not trimmed here: [CONSOLE_MAX_LINES] bounds the live ring, and
 * history the admin explicitly asked for should not vanish the moment it arrives. The next live
 * batch trims it back.
 *
 * @param {ConsoleEntry[]} buffer
 * @param {Array<{ t?: number, l?: string, m?: string }>} lines oldest first.
 * @returns {{ entries: ConsoleEntry[], added: number }} the same buffer when nothing was new.
 */
export function prependConsoleLines(buffer, lines) {
  const incoming = Array.isArray(lines) ? lines : [];

  if (!incoming.length) {
    return { entries: buffer, added: 0 };
  }

  const shown = new Set();

  for (const entry of buffer) {
    if (entry.kind === 'line') {
      shown.add(consoleLineKey(entry));
    }
  }

  const older = [];

  for (const line of incoming) {
    const entry = toConsoleEntry(line);

    if (!shown.has(consoleLineKey(entry))) {
      older.push(entry);
    }
  }

  if (!older.length) {
    return { entries: buffer, added: 0 };
  }

  return { entries: older.concat(buffer), added: older.length };
}

/**
 * How many monospace columns an entry occupies, used to size the horizontal scroll area.
 *
 * @param {ConsoleEntry} entry
 * @param {boolean} withTimestamps
 * @returns {number}
 */
export function consoleEntryColumns(entry, withTimestamps) {
  const prefix = withTimestamps ? CONSOLE_TIME_COLUMNS : 0;

  if (entry.kind === 'dropped') {
    return prefix + 32;
  }

  return prefix + entry.m.length;
}

/**
 * Case-insensitive `indexOf` split into alternating plain/matching segments. Segments are
 * rendered as text nodes, so the console never reaches the DOM as markup.
 *
 * @param {string} text
 * @param {string} query
 * @returns {Array<{ text: string, match: boolean }>}
 */
export function highlightSegments(text, query) {
  const needle = String(query || '');

  if (!needle) {
    return [{ text, match: false }];
  }

  const haystack = text.toLowerCase();
  const lowered = needle.toLowerCase();
  const segments = [];

  let cursor = 0;

  while (cursor < text.length) {
    const found = haystack.indexOf(lowered, cursor);

    if (found === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }

    if (found > cursor) {
      segments.push({ text: text.slice(cursor, found), match: false });
    }

    segments.push({ text: text.slice(found, found + needle.length), match: true });
    cursor = found + needle.length;
  }

  return segments.length ? segments : [{ text, match: false }];
}

/**
 * The half-open ranges where [query] occurs in [text], case-insensitively, left to right and
 * never overlapping — the same matches [highlightSegments] marks.
 *
 * @param {string} text
 * @param {string} query
 * @returns {Array<[number, number]>}
 */
function matchRanges(text, query) {
  const needle = String(query || '').toLowerCase();

  if (!needle) {
    return [];
  }

  const haystack = text.toLowerCase();
  const ranges = [];

  let cursor = 0;

  while (cursor < text.length) {
    const found = haystack.indexOf(needle, cursor);

    if (found === -1) {
      break;
    }

    ranges.push([found, found + needle.length]);
    cursor = found + needle.length;
  }

  return ranges;
}

/**
 * @typedef {{ text: string, match: boolean, color: string|null, bold: boolean,
 *   italic: boolean, underline: boolean }} ConsoleTextSegment
 */

/**
 * §2.4.21 E — a line's text cut at every colour-span boundary and every search-match boundary,
 * so each piece has one style. Pure: same input, same output, nothing touched outside.
 *
 * Input: the plain `m`, its validated spans (see [normalizeConsoleSpans]; anything else is
 * normalised first) and the Find text. Output: segments whose `text` concatenates back to
 * exactly `text`; `color` is set only when it matches `#rrggbb` and the piece is not a search
 * match (the highlight wins over colour), and the three flags come from the covering span.
 *
 * Checks, spelled out (`m = "ab"`):
 * - no spans, no query → `[{ text: 'ab', match: false, color: null, … }]`
 * - span `[0,1,'#ff0000',1]` → `'a'` red + bold, `'b'` plain
 * - span `[0,2,'#ff0000',0]`, query `'b'` → `'a'` red, `'b'` match with `color: null`
 * - span colour `'red; x:y'` → not `#rrggbb`, so no colour (and no flags → no span at all)
 *
 * @param {string} text
 * @param {unknown} spans
 * @param {string} [query]
 * @returns {ConsoleTextSegment[]}
 */
export function consoleTextSegments(text, spans, query = '') {
  const value = String(text ?? '');
  const runs = normalizeConsoleSpans(spans, value.length);
  const matches = matchRanges(value, query);

  if (!value) {
    return [{ text: '', match: false, color: null, bold: false, italic: false, underline: false }];
  }

  const cuts = new Set([0, value.length]);

  for (const run of runs) {
    cuts.add(run.start);
    cuts.add(run.end);
  }

  for (const [start, end] of matches) {
    cuts.add(start);
    cuts.add(end);
  }

  const points = [...cuts].sort((a, b) => a - b);
  const segments = [];

  let runIndex = 0;
  let matchIndex = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    while (runIndex < runs.length && runs[runIndex].end <= start) {
      runIndex += 1;
    }

    while (matchIndex < matches.length && matches[matchIndex][1] <= start) {
      matchIndex += 1;
    }

    const run = runIndex < runs.length && runs[runIndex].start <= start ? runs[runIndex] : null;
    const match = matchIndex < matches.length && matches[matchIndex][0] <= start;

    segments.push({
      text: value.slice(start, end),
      match,
      color: match ? null : safeConsoleColor(run?.color),
      bold: !!run?.bold,
      italic: !!run?.italic,
      underline: !!run?.underline,
    });
  }

  return segments;
}

/** §SM-56 follow-up — the console's "Wrap lines" switch, remembered per browser. */
const WRAP_LINES_KEY = 'pano.panel.server-console.wrap-lines';

/**
 * @returns {boolean} the saved "Wrap lines" choice. On by default: only a browser that switched
 *   it off (and saved that) starts unwrapped; unavailable storage (private browsing, blocked
 *   site data, SSR) reads as the default.
 */
export function loadConsoleWrapPreference() {
  try {
    return typeof localStorage === 'undefined' || localStorage.getItem(WRAP_LINES_KEY) !== 'false';
  } catch {
    return true;
  }
}

/**
 * @param {boolean} value
 */
export function saveConsoleWrapPreference(value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WRAP_LINES_KEY, value ? 'true' : 'false');
    }
  } catch {
    // Storage is a convenience here; the switch still works for this visit.
  }
}

/**
 * @param {number | string} serverId
 * @returns {string}
 */
function historyKey(serverId) {
  return `pano.panel.server-console.history.${serverId}`;
}

/**
 * The ↑/↓ command history, oldest first. Private browsing and blocked site data both make
 * `localStorage` throw, so every access is guarded and simply degrades to "no history".
 *
 * @param {number | string} serverId
 * @returns {string[]}
 */
export function loadCommandHistory(serverId) {
  try {
    const raw = window.localStorage.getItem(historyKey(serverId));
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry === 'string').slice(-CONSOLE_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

/**
 * @param {number | string} serverId
 * @param {string[]} history
 * @param {string} command
 * @returns {string[]} the stored history, oldest first.
 */
export function pushCommandHistory(serverId, history, command) {
  const value = String(command || '').trim();

  if (!value) {
    return history;
  }

  const next = history.filter((entry) => entry !== value);

  next.push(value);

  const trimmed = next.slice(-CONSOLE_HISTORY_LIMIT);

  try {
    window.localStorage.setItem(historyKey(serverId), JSON.stringify(trimmed));
  } catch {
    /* remembering commands is a convenience, not a feature */
  }

  return trimmed;
}

/**
 * `GET /api/panel/servers/:id/console?limit=` — the ring buffer the hub kept, which is what the
 * page opens with before the live stream takes over. `dropped` is cumulative here, so it becomes
 * a single marker at the top of the buffer.
 *
 * `skip` (§2.4.14) drops that many lines from the end of the source's log before the page is
 * cut, which is how "load older" walks backwards: it is the number of real lines already shown.
 * A backend that predates the paging simply ignores it and answers without `hasMore`, which
 * reads as "there is nothing older to offer" and keeps the button hidden.
 *
 * It never throws: a server whose plugin cannot tap the log, a build without the endpoint and a
 * request that never completed all come back as a status the page renders instead of an error.
 *
 * @param {object} options
 * @param {number|string} options.serverId
 * @param {number} [options.limit]
 * @param {number} [options.skip] lines to drop from the end of the log, 0 = the newest page.
 *   With a `query` it counts *matches* instead: the matching lines already shown.
 * @param {string} [options.query] §2.4.20 — a case-insensitive plain substring; the source
 *   walks its loadable window newest → oldest and returns only the lines whose text contains
 *   it. Blank means no filter at all.
 * @param {import('@sveltejs/kit').LoadEvent | Request} [options.request] the load event, for SSR.
 * @returns {Promise<{ status: string, error?: string, capable: boolean|null,
 *   lines: Array<{ t?: number, l?: string, m?: string }>, dropped: number, hasMore: boolean,
 *   query?: string|null }>} `query` is the backend's echo of the filter it applied, null when
 *   it sent none.
 */
export async function fetchConsoleHistory({
  serverId,
  limit = CONSOLE_HYDRATE_LINES,
  skip = 0,
  query = '',
  request,
}) {
  const pageSize = Number(limit) || CONSOLE_HYDRATE_LINES;
  const offset = Math.max(0, Math.trunc(Number(skip)) || 0);
  const text = String(query ?? '').trim();
  const filter = text ? `&query=${encodeURIComponent(text)}` : '';
  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/console?limit=${pageSize}&skip=${offset}${filter}`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  // `undefined`/`null` is the network-error path — ApiUtil already raised the offline splash.
  if (body === undefined || body === null) {
    return { status: 'network', capable: null, lines: [], dropped: 0, hasMore: false };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', capable: null, lines: [], dropped: 0, hasMore: false };
  }

  if (body.error) {
    return {
      status: 'error',
      error: String(body.error),
      capable: null,
      lines: [],
      dropped: 0,
      hasMore: false,
    };
  }

  return {
    status: 'ok',
    capable: body.capable !== false,
    lines: Array.isArray(body.lines) ? body.lines : [],
    dropped: Number(body.dropped) || 0,
    // Absent on a backend that does not page yet: no promise of older lines, no button.
    hasMore: body.hasMore === true,
    query: typeof body.query === 'string' ? body.query : null,
  };
}

/**
 * `GET /api/panel/servers/:id/console/search` — one step of a search through every log file the
 * server has, newest first (§2.4.20, deep search).
 *
 * Each call scans on from `cursor` for a time budget and answers with what it found in that
 * time, newest match first, and the cursor to carry on from; the panel keeps calling until
 * `done`. `status: 'unavailable'` is a backend (or a source) that does not know deep search —
 * the caller falls back to the windowed search of {@link fetchConsoleHistory}.
 *
 * @param {{ serverId: number | string, query: string, cursor?: string | null, limit?: number }} options
 */
export async function fetchConsoleSearch({ serverId, query, cursor = null, limit = 200 }) {
  const params = new URLSearchParams({ query: String(query ?? '').trim(), limit: String(limit) });

  if (cursor) {
    params.set('cursor', cursor);
  }

  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/console/search?${params.toString()}`,
    handler: (/** @type {object} */ response) => response,
  });

  if (body === undefined || body === null) {
    return { status: 'network', lines: [], done: true };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', lines: [], done: true };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error), lines: [], done: true };
  }

  return {
    status: 'ok',
    // Newest first, as found.
    lines: Array.isArray(body.lines) ? body.lines : [],
    cursor: typeof body.cursor === 'string' && body.cursor ? body.cursor : null,
    done: body.done === true || !body.cursor,
    scannedFiles: Number(body.scannedFiles) || 0,
    totalFiles: Number(body.totalFiles) || 0,
    capped: body.capped === true,
  };
}
