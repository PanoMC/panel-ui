import { get } from 'svelte/store';
import { page } from '$app/stores';

export const Permissions = Object.freeze({
  ACCESS_PANEL: 'ACCESS_PANEL',
  MANAGE_SERVERS: 'MANAGE_SERVERS',
  CREATE_SERVERS: 'CREATE_SERVERS',
  MANAGE_SERVER_CONSOLE: 'MANAGE_SERVER_CONSOLE',
  MANAGE_SERVER_POWER: 'MANAGE_SERVER_POWER',
  MANAGE_SERVER_PLAYERS: 'MANAGE_SERVER_PLAYERS',
  MANAGE_SERVER_FILES: 'MANAGE_SERVER_FILES',
  MANAGE_SERVER_BACKUPS: 'MANAGE_SERVER_BACKUPS',
  MANAGE_SERVER_PLUGINS: 'MANAGE_SERVER_PLUGINS',
  MANAGE_SERVER_SCHEDULES: 'MANAGE_SERVER_SCHEDULES',
  MANAGE_SERVER_STARTUP: 'MANAGE_SERVER_STARTUP',
  MANAGE_NODES: 'MANAGE_NODES',
  MANAGE_POSTS: 'MANAGE_POSTS',
  MANAGE_TICKETS: 'MANAGE_TICKETS',
  MANAGE_PLAYERS: 'MANAGE_PLAYERS',
  MANAGE_VIEW: 'MANAGE_VIEW',
  MANAGE_ADDONS: 'MANAGE_ADDONS',
  MANAGE_PLATFORM_SETTINGS: 'MANAGE_PLATFORM_SETTINGS',
  MANAGE_PANO_BACKUPS: 'MANAGE_PANO_BACKUPS',
  MANAGE_PERMISSION_GROUPS: 'MANAGE_PERMISSION_GROUPS',
  ACCESS_ACTIVITY_LOGS: 'ACCESS_ACTIVITY_LOGS',
  MANAGE_TRANSLATIONS: 'MANAGE_TRANSLATIONS',
});

export function hasPermission(permission, user) {
  if (!user) {
    const { user: pageUser } = get(page).data;

    user = pageUser;
  }

  const userObject = user;

  if (userObject.admin) {
    return true;
  }

  if (!userObject.permissions) {
    return false;
  }

  const toPanelNode = (p) => {
    const raw = String(p || '').trim();
    if (!raw) return '';

    const lower = raw.toLowerCase();
    if (lower.startsWith('pano.panel.') || lower.startsWith('pano.plugin.')) {
      return lower;
    }

    // old enum format: MANAGE_PERMISSION_GROUPS -> pano.panel.manage.permission.groups
    return `pano.panel.${lower.replaceAll('_', '.')}`;
  };

  const wantedNode = toPanelNode(permission);
  const wantedKey = String(permission || '')
    .trim()
    .toUpperCase();
  const perms = Array.isArray(userObject.permissions) ? userObject.permissions : [];
  const permsLower = perms.map((x) => String(x || '').toLowerCase());

  // Prefer node-style checks; keep legacy key check for backward compatibility.
  return (
    (wantedNode && permsLower.includes(wantedNode)) || (wantedKey && perms.includes(wantedKey))
  );
}

/**
 * Permission nodes that can be narrowed to individual servers (§2.6). `MANAGE_SERVERS` is the
 * umbrella node; every granular `MANAGE_SERVER_*` permission lives under
 * `pano.panel.manage.server.`, so both shapes are recognised.
 *
 * @param {string | null | undefined} node the node string, e.g. `pano.panel.manage.server.console`.
 * @returns {boolean}
 */
export function isServerScopedNode(node) {
  const value = String(node || '')
    .trim()
    .toLowerCase();

  return value === 'pano.panel.manage.servers' || value.startsWith('pano.panel.manage.server.');
}

/**
 * The server ids a permission node is limited to, read out of `permission_node.context`. An empty
 * list means "every server" — which is exactly what an absent key has always meant, so an
 * un-scoped node keeps behaving the way it does today.
 *
 * @param {object | null | undefined} context the node's `context` object.
 * @returns {string[]}
 */
export function getServerScope(context) {
  if (!context || typeof context !== 'object') {
    return [];
  }

  const raw = /** @type {{ server?: unknown }} */ (context).server;
  const list = Array.isArray(raw) ? raw : raw == null || raw === '' ? [] : [raw];

  return [...new Set(list.map((entry) => String(entry).trim()).filter(Boolean))];
}

/**
 * Writes `context.server` without disturbing the other context keys. An empty selection drops the
 * key entirely rather than storing `[]`, because "no scope" and "all servers" are the same thing
 * and an empty array would read as "no server at all" to a stricter backend.
 *
 * @param {object | null | undefined} context the node's current `context` object.
 * @param {Array<string|number>} serverIds
 * @returns {object} a new context object.
 */
export function withServerScope(context, serverIds) {
  const next = { ...(context && typeof context === 'object' ? context : {}) };
  const ids = [
    ...new Set(
      (Array.isArray(serverIds) ? serverIds : [])
        .map((entry) => String(entry).trim())
        .filter(Boolean),
    ),
  ];

  if (ids.length === 0) {
    delete next.server;

    return next;
  }

  next.server = ids;

  return next;
}

/**
 * The permission nodes a denied-command policy can hang off (§2.4.12). Sending a console command
 * is authorised by `MANAGE_SERVER_CONSOLE` — or by the `MANAGE_SERVERS` umbrella, which implies
 * it — so those two are the only nodes whose `context.denyCommands` the backend ever reads, and
 * the only ones the editor offers the chip input on.
 *
 * @param {string | null | undefined} node
 * @returns {boolean}
 */
export function isCommandPolicyNode(node) {
  const value = String(node || '')
    .trim()
    .toLowerCase();

  return value === 'pano.panel.manage.servers' || value === 'pano.panel.manage.server.console';
}

/**
 * What a deny pattern may look like: one command token — letters, digits, `_`, `:` (the
 * namespace separator Bukkit uses, as in `worldedit:set`) and `-` — with an optional trailing
 * `*`. Only the first token of a command is matched, so a pattern never contains a space.
 */
export const DENY_COMMAND_PATTERN = /^[a-z0-9_:-]+\*?$/i;

/**
 * @param {string | null | undefined} token
 * @returns {boolean}
 */
export function isValidDenyCommand(token) {
  return DENY_COMMAND_PATTERN.test(String(token || '').trim());
}

/**
 * Cleans a list of patterns for storage: trimmed, lowercased (the backend matches
 * case-insensitively, so case only ever produces confusing duplicates), de-duplicated, and
 * without anything that is not a valid pattern.
 *
 * @param {Array<string|number> | null | undefined} patterns
 * @returns {string[]}
 */
export function normalizeDenyCommands(patterns) {
  const list = (Array.isArray(patterns) ? patterns : [])
    .map((entry) =>
      String(entry ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter((entry) => isValidDenyCommand(entry));

  return [...new Set(list)];
}

/**
 * The command patterns a permission node refuses, read out of `permission_node.context`. An
 * absent key means the grant denies nothing, which is how every node behaved before command
 * policies existed.
 *
 * @param {object | null | undefined} context
 * @returns {string[]}
 */
export function getDenyCommands(context) {
  if (!context || typeof context !== 'object') {
    return [];
  }

  const raw = /** @type {{ denyCommands?: unknown }} */ (context).denyCommands;
  const list = Array.isArray(raw) ? raw : raw == null || raw === '' ? [] : String(raw).split(',');

  return normalizeDenyCommands(list);
}

/**
 * Writes `context.denyCommands` without disturbing the other context keys. An empty policy drops
 * the key instead of storing `[]`, for the same reason {@link withServerScope} does: "denies
 * nothing" is the absence of a policy, not an empty one.
 *
 * @param {object | null | undefined} context
 * @param {Array<string|number>} patterns
 * @returns {object} a new context object.
 */
export function withDenyCommands(context, patterns) {
  const next = { ...(context && typeof context === 'object' ? context : {}) };
  const list = normalizeDenyCommands(patterns);

  if (list.length === 0) {
    delete next.denyCommands;

    return next;
  }

  next.denyCommands = list;

  return next;
}
