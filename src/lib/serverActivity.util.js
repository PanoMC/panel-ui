/**
 * The per-server activity log (§2.4.12).
 *
 * `GET /api/panel/servers/:id/activity?limit=50&before=<cursor>` answers
 * `{ entries: [{ id, type, userId, username, createdAt, details }] }`, newest first, filtered to
 * the log types that belong to one server. Everything an entry carries was written by a person —
 * a command they typed, a file they edited — so it is untrusted text and is only ever rendered
 * as text, never as HTML (§2.7).
 */

import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
import { isEndpointUnavailable } from '$lib/servers.util.js';

/** How many entries one page asks for, and therefore how "there is more" is detected. */
export const SERVER_ACTIVITY_PAGE_SIZE = 50;

/**
 * Icon and colour per log type. `SERVER_PLUGIN_*` and `SERVER_SCHEDULE_*` are families whose
 * exact members the backend may still grow, so they are matched by prefix and an unknown member
 * still gets the right icon instead of the generic one.
 *
 * @type {ReadonlyArray<{ prefix: string, icon: string, colour: string }>}
 */
const ACTIVITY_TYPE_STYLES = Object.freeze([
  { prefix: 'SENT_SERVER_COMMAND', icon: 'fa-solid fa-terminal', colour: 'secondary' },
  { prefix: 'SERVER_POWER_ACTION', icon: 'fa-solid fa-power-off', colour: 'warning' },
  { prefix: 'SERVER_PLAYER_ACTION', icon: 'fa-solid fa-users', colour: 'info' },
  { prefix: 'SERVER_PLUGIN_', icon: 'fa-solid fa-puzzle-piece', colour: 'primary' },
  { prefix: 'SERVER_PANO_PLUGIN_', icon: 'fa-solid fa-puzzle-piece', colour: 'warning' },
  { prefix: 'LINKED_AGENT_SERVER', icon: 'fa-solid fa-microchip', colour: 'success' },
  { prefix: 'SERVER_FILE_CHANGED', icon: 'fa-solid fa-file-pen', colour: 'secondary' },
  { prefix: 'SERVER_BACKUP_ACTION', icon: 'fa-solid fa-box-archive', colour: 'success' },
  { prefix: 'SERVER_SCHEDULE_', icon: 'fa-solid fa-clock', colour: 'primary' },
  { prefix: 'SERVER_CRASHED', icon: 'fa-solid fa-triangle-exclamation', colour: 'danger' },
]);

/**
 * @param {string | null | undefined} type
 * @returns {string} the type as the backend spells it, or '' when there is none.
 */
export function normalizeActivityType(type) {
  return String(type || '')
    .trim()
    .toUpperCase();
}

/**
 * @param {string | null | undefined} type
 * @returns {{ type: string, icon: string, colour: string, labelKey: string }}
 */
export function activityTypeMeta(type) {
  const normalized = normalizeActivityType(type);
  const style = ACTIVITY_TYPE_STYLES.find((entry) => normalized.startsWith(entry.prefix));

  return {
    type: normalized,
    icon: style?.icon || 'fa-solid fa-clock-rotate-left',
    colour: style?.colour || 'secondary',
    labelKey: `pages.servers.activity.types.${normalized.toLowerCase()}`,
  };
}

/**
 * The label of a type, falling back to the raw code. A build that logs a type this panel has no
 * translation for still shows something an admin can read (and search the docs for) instead of a
 * missing-key placeholder.
 *
 * @param {string | null | undefined} type
 * @param {(key: string, options?: object) => string} translate the `$_` store's value.
 * @returns {string}
 */
export function activityTypeLabel(type, translate) {
  const { labelKey, type: normalized } = activityTypeMeta(type);
  const label = translate(labelKey);

  return label === labelKey ? normalized : label;
}

/**
 * An entry's `details` as one line of plain text. The backend attaches whatever the action had
 * to say — a command line, a path, a plugin name — as a string or as a small object, so both are
 * flattened here rather than at every call site.
 *
 * @param {unknown} details
 * @returns {string}
 */
export function formatActivityDetails(details) {
  if (details == null || details === '') {
    return '';
  }

  if (typeof details === 'string') {
    return details.trim();
  }

  if (Array.isArray(details)) {
    return details
      .map((entry) => formatActivityDetails(entry))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof details === 'object') {
    return Object.entries(/** @type {Record<string, unknown>} */ (details))
      .filter(([key]) => key)
      .map(([key, value]) => {
        const text =
          value != null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');

        return `${key}: ${text}`;
      })
      .join(' · ');
  }

  return String(details);
}

/**
 * One entry normalized for rendering. `id` doubles as the paging cursor, so an entry without one
 * falls back to its timestamp — the endpoint accepts either as `before`.
 *
 * @param {object} entry
 * @returns {{ id: string, type: string, userId: string, username: string, createdAt: number|string|null, details: string }}
 */
function normalizeEntry(entry) {
  const row = /** @type {Record<string, unknown>} */ (entry || {});
  const id = row.id ?? row.createdAt ?? '';

  return {
    id: String(id),
    type: normalizeActivityType(/** @type {string} */ (row.type)),
    userId: row.userId == null ? '' : String(row.userId),
    username: row.username == null ? '' : String(row.username),
    createdAt: /** @type {number|string|null} */ (row.createdAt ?? null),
    details: formatActivityDetails(row.details),
  };
}

/**
 * One page of the log.
 *
 * `status` is `ok`, `unavailable` (a build without the endpoint — §2.4.12 landed after this
 * panel), `network` (the request never completed; `ApiUtil` already raised the offline splash)
 * or `error` with the backend's code.
 *
 * @param {object} options
 * @param {number|string} options.serverId
 * @param {number} [options.limit]
 * @param {string} [options.before] the id of the oldest entry already shown.
 * @param {import('@sveltejs/kit').LoadEvent | Request} [options.request]
 * @returns {Promise<{ status: string, entries: object[], hasMore: boolean, error?: string }>}
 */
export async function fetchServerActivity({
  serverId,
  limit = SERVER_ACTIVITY_PAGE_SIZE,
  before = '',
  request,
}) {
  const query = buildQueryParams({ limit, before: before || undefined });

  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/activity${query}`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  if (body === undefined || body === null) {
    return { status: 'network', entries: [], hasMore: false };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', entries: [], hasMore: false };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error), entries: [], hasMore: false };
  }

  const raw = Array.isArray(body.entries) ? body.entries : Array.isArray(body) ? body : [];
  const entries = raw.map((/** @type {object} */ entry) => normalizeEntry(entry));

  // A short page is the end of the log. `hasMore` is only ever a hint for the button — asking
  // again and getting nothing back simply hides it.
  return {
    status: 'ok',
    entries,
    hasMore: typeof body.hasMore === 'boolean' ? body.hasMore : entries.length >= Number(limit),
  };
}

/**
 * The user-filter value that stands for "Pano itself" -- a crash, a schedule run, a restart the
 * node did on its own. Not a username anybody can have.
 */
export const SYSTEM_ACTIVITY_USER = '\u0000system';

/**
 * Whether Pano itself wrote [entry] rather than a person: it has no user at all. An entry whose
 * user was deleted still has the id, and stays "Unknown user".
 *
 * @param {{ userId?: string | null, username?: string | null } | null | undefined} entry
 * @returns {boolean}
 */
export function isSystemActivity(entry) {
  return !entry?.userId && !entry?.username;
}
