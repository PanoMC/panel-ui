/**
 * Helpers shared by the `/servers` workspace.
 *
 * A server row carries `features` (§2.4.17): what this server can do right now and which
 * side does it — the node, the Pano plugin in the game, or Pano itself. Everything gates on
 * that map ({@link hasFeature}, {@link featureSource}), never on the server's kind or on a
 * single plugin capability, so a node-only server, a plugin-only one and one with both are
 * treated the same.
 *
 * A backend from before the ticket sends no `features`, so the row still carries what the
 * plugin announced on connect: `protocolVersion` (1 = a plugin released before the capability
 * handshake), `pluginVersion` and `capabilities`. Those are what the legacy rules below fall
 * back to, which is why nothing regresses while the two sides are out of step.
 */

import { get, writable } from 'svelte/store';
import { _, json } from 'svelte-i18n';

import { browser } from '$app/environment';

import ApiUtil from '$lib/api.util.js';
import { formatBytes } from '$lib/string.util.js';
import { showError } from '$lib/components/ToastContainer.svelte';

/**
 * Capability ids, mirroring `com.panomc.platform.server.ServerCapability`. They are part of
 * the plugin wire protocol, so they must stay in sync with the backend enum.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ServerCapabilities = Object.freeze({
  CONSOLE: 'console',
  COMMANDS: 'commands',
  POWER: 'power',
  METRICS: 'metrics',
  PLAYERS: 'players',
  PLUGINS: 'plugins',
  // SM-47 — what a protocol-2 plugin grew for a server with no node behind it. They are only
  // ever read by the legacy rules below (and by Pano, when it resolves `features`), so they are
  // deliberately not in the chip order: the chips show the original six.
  FILES: 'files',
  BACKUPS: 'backups',
  PLUGIN_INSTALL: 'plugin-install',
  SCHEDULES: 'schedules',
});

/** Order the capability list is rendered in (overview card, sidebar chips). */
export const SERVER_CAPABILITY_ORDER = Object.freeze([
  ServerCapabilities.CONSOLE,
  ServerCapabilities.COMMANDS,
  ServerCapabilities.POWER,
  ServerCapabilities.METRICS,
  ServerCapabilities.PLAYERS,
  ServerCapabilities.PLUGINS,
]);

/** Font Awesome icon per capability, used by the chips. */
export const SERVER_CAPABILITY_ICONS = Object.freeze({
  [ServerCapabilities.CONSOLE]: 'fa-solid fa-terminal',
  [ServerCapabilities.COMMANDS]: 'fa-solid fa-keyboard',
  [ServerCapabilities.POWER]: 'fa-solid fa-power-off',
  [ServerCapabilities.METRICS]: 'fa-solid fa-gauge-high',
  [ServerCapabilities.PLAYERS]: 'fa-solid fa-users',
  [ServerCapabilities.PLUGINS]: 'fa-solid fa-puzzle-piece',
});

/**
 * How Pano got hold of a server (§2.5 `server.kind`). A LINKED server runs anywhere and only
 * talks to Pano through pano-mc-plugin; a MANAGED one is a process Pano created on a node and
 * therefore owns.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ServerKinds = Object.freeze({
  LINKED: 'LINKED',
  MANAGED: 'MANAGED',
});

/**
 * The process states a managed server reports through `serverState` frames (§2.5).
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ProcessStates = Object.freeze({
  STOPPED: 'STOPPED',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  CRASHED: 'CRASHED',
  INSTALLING: 'INSTALLING',
});

/** Bootstrap contextual colour per process state, used by the pill in the server header. */
const PROCESS_STATE_COLOURS = Object.freeze({
  [ProcessStates.STOPPED]: 'secondary',
  [ProcessStates.STARTING]: 'info',
  [ProcessStates.RUNNING]: 'success',
  [ProcessStates.STOPPING]: 'warning',
  [ProcessStates.CRASHED]: 'danger',
  [ProcessStates.INSTALLING]: 'primary',
});

/** Every plugin released before the capability handshake reports this protocol version. */
export const LEGACY_PROTOCOL_VERSION = 1;

/** @typedef {{ id?: number|string, capabilities?: string[], protocolVersion?: number }} ServerLike */

/**
 * @param {ServerLike | null | undefined} server
 * @returns {string[]} the capability ids this server announced, never null.
 */
export function getServerCapabilities(server) {
  return Array.isArray(server?.capabilities) ? server.capabilities : [];
}

/**
 * @param {ServerLike | null | undefined} server
 * @param {string | string[]} capability One id, or a list of which any one is enough.
 * @returns {boolean}
 */
export function hasCapability(server, capability) {
  if (!capability) {
    return true;
  }

  const announced = getServerCapabilities(server);
  const wanted = Array.isArray(capability) ? capability : [capability];

  return wanted.some((id) => announced.includes(id));
}

/**
 * A server whose plugin predates the capability handshake: it can do nothing beyond the
 * status/player-count basics, and the only fix is updating pano-mc-plugin.
 *
 * @param {ServerLike | null | undefined} server
 * @returns {boolean}
 */
export function isLegacyPluginServer(server) {
  if (!server) {
    return false;
  }

  const protocolVersion = Number(server.protocolVersion ?? LEGACY_PROTOCOL_VERSION);

  return protocolVersion <= LEGACY_PROTOCOL_VERSION || getServerCapabilities(server).length === 0;
}

/**
 * A server Pano runs itself on a node — the only kind with a process to start, kill, reinstall
 * or reconfigure.
 *
 * @param {{ kind?: string } | null | undefined} server
 * @returns {boolean}
 */
export function isManaged(server) {
  return String(server?.kind || '').toUpperCase() === ServerKinds.MANAGED;
}

/**
 * Whether a Pano Agent runs this server: a node dedicated to it on its own machine, which the
 * panel never lists as a node. The server is managed all the same.
 */
export function isAgentServer(server) {
  return server?.agent === true;
}

/** Whether the server runs from a folder it already lived in, which Pano never deletes. */
export function isInPlace(server) {
  return server?.inPlace === true;
}

/**
 * The reported process state, normalized, or null for a linked server (which has none).
 *
 * @param {{ processState?: string } | null | undefined} server
 * @returns {string | null}
 */
export function getProcessState(server) {
  const state = String(server?.processState || '').toUpperCase();

  return ProcessStates[state] ? state : null;
}

/**
 * @param {string | null | undefined} state
 * @returns {string} the i18n key of the state's label.
 */
export function processStateLabel(state) {
  const normalized = String(state || '').toUpperCase();

  return `pages.servers.process-state.${(ProcessStates[normalized] || ProcessStates.STOPPED).toLowerCase()}`;
}

/**
 * @param {string | null | undefined} state
 * @returns {string} a Bootstrap contextual colour name (`success`, `danger`, ...).
 */
export function processStateColour(state) {
  const normalized = String(state || '').toUpperCase();

  return PROCESS_STATE_COLOURS[normalized] || 'secondary';
}

/**
 * Power rules (§2.2). A managed server is gated on its process state, because Pano owns the
 * process; a linked one can only ask its plugin to stop or restart, and only while it is
 * online and announced the `power` capability.
 *
 * Permission (`MANAGE_SERVER_POWER`) and node availability are checked by the caller — these
 * four only answer "does this action make sense for this server right now".
 *
 * @param {object | null | undefined} server
 * @returns {boolean}
 */
export function canStart(server) {
  if (!isManaged(server)) {
    return false;
  }

  const state = getProcessState(server);

  return state === ProcessStates.STOPPED || state === ProcessStates.CRASHED;
}

/**
 * @param {object | null | undefined} server
 * @returns {boolean}
 */
export function canStop(server) {
  if (isManaged(server)) {
    const state = getProcessState(server);

    return state === ProcessStates.RUNNING || state === ProcessStates.STARTING;
  }

  return isPluginConnected(server) && hasCapability(server, ServerCapabilities.POWER);
}

/**
 * @param {object | null | undefined} server
 * @returns {boolean}
 */
export function canRestart(server) {
  if (isManaged(server)) {
    return getProcessState(server) === ProcessStates.RUNNING;
  }

  return isPluginConnected(server) && hasCapability(server, ServerCapabilities.POWER);
}

/**
 * @param {object | null | undefined} server
 * @returns {boolean}
 */
export function canKill(server) {
  if (!isManaged(server)) {
    return false;
  }

  const state = getProcessState(server);

  return (
    state === ProcessStates.RUNNING ||
    state === ProcessStates.STARTING ||
    state === ProcessStates.STOPPING
  );
}

/**
 * Aikar's flags — the JVM tuning nearly every Paper guide recommends. Region size and the
 * new-size percentages differ above 12 GB, which is why they are computed from the heap.
 *
 * @param {number|string} memoryMb
 * @returns {string}
 */
/**
 * The Java heap a managed server gets out of its memory setting, in MB: the node's rule
 * (`JvmHeap.heapMb` -- the setting minus 512 MB plus 15 % of it, at most 2 GB, never below half).
 * Mirrored here so the settings say what the heap will be; change both together.
 *
 * @param {unknown} memoryMb
 * @returns {number | null}
 */
export function heapMbOf(memoryMb) {
  const setting = Math.trunc(Number(memoryMb));

  if (!Number.isFinite(setting) || setting <= 0) {
    return null;
  }

  const overhead = Math.min(2048, 512 + Math.round(setting * 0.15));

  return Math.max(setting - overhead, Math.trunc(setting / 2));
}

/**
 * "1092 MB / 1536 MB", or in GB with a decimal from 10 GB up: in the unit the memory setting is
 * typed in, and exact enough that a process just over its setting does not read "1.5 GB / 1.5 GB"
 * next to a 102 %.
 *
 * @param {number} used bytes
 * @param {number} total bytes
 * @returns {string}
 */
export function formatMemoryPair(used, total) {
  const MiB = 1024 * 1024;
  const GiB = 1024 * MiB;

  if (total < 10 * GiB) {
    return `${Math.round(used / MiB)} MB / ${Math.round(total / MiB)} MB`;
  }

  return `${(used / GiB).toFixed(1)} GB / ${(total / GiB).toFixed(1)} GB`;
}

export function aikarFlags(memoryMb) {
  const large = Number(memoryMb) >= 12288;

  return [
    '-XX:+UseG1GC',
    '-XX:+ParallelRefProcEnabled',
    '-XX:MaxGCPauseMillis=200',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:+DisableExplicitGC',
    '-XX:+AlwaysPreTouch',
    `-XX:G1NewSizePercent=${large ? 40 : 30}`,
    `-XX:G1MaxNewSizePercent=${large ? 50 : 40}`,
    `-XX:G1HeapRegionSize=${large ? '16M' : '8M'}`,
    `-XX:G1ReservePercent=${large ? 15 : 20}`,
    '-XX:G1HeapWastePercent=5',
    '-XX:G1MixedGCCountTarget=4',
    `-XX:InitiatingHeapOccupancyPercent=${large ? 20 : 15}`,
    '-XX:G1MixedGCLiveThresholdPercent=90',
    '-XX:G1RSetUpdatingPauseTimePercent=5',
    '-XX:SurvivorRatio=32',
    '-XX:+PerfDisableSharedMem',
    '-XX:MaxTenuringThreshold=1',
  ].join(' ');
}

/**
 * The JVM arguments of a server as one editable line. The backend stores them as text but the
 * node contract hands them over as a list, so both shapes are accepted.
 *
 * @param {string[] | string | null | undefined} jvmArgs
 * @returns {string}
 */
export function jvmArgsToText(jvmArgs) {
  if (Array.isArray(jvmArgs)) {
    return jvmArgs.join(' ');
  }

  return String(jvmArgs || '').trim();
}

/**
 * @param {string} text
 * @returns {string[]} the arguments as the node contract wants them (`jvmArgs: []`).
 */
export function jvmArgsToList(text) {
  const trimmed = String(text || '').trim();

  return trimmed ? trimmed.split(/\s+/) : [];
}

/**
 * Whether a response body means "this build of Pano does not have that endpoint". Unknown
 * `/api` paths fall through to the reverse proxy, so the body comes back as an HTML string
 * instead of JSON; a backend that knows the route but has the feature switched off answers
 * with one of the codes below.
 *
 * `undefined`/`null` is *not* unavailable — that is the network-error path, which `ApiUtil`
 * already turned into the offline splash.
 *
 * @param {unknown} body
 * @returns {boolean}
 */
export function isEndpointUnavailable(body) {
  if (typeof body === 'string') {
    return true;
  }

  if (!body || typeof body !== 'object') {
    return false;
  }

  const error = String(/** @type {{ error?: string }} */ (body).error || '').toUpperCase();

  return error === 'NOT_IMPLEMENTED' || error === 'UNSUPPORTED' || error === 'PAGE_NOT_FOUND';
}

/**
 * The address players connect to: the address the plugin reported to the outside world, or
 * the host it bound to when it never reported one.
 *
 * @param {{ remoteAddress?: string, host?: string } | null | undefined} server
 * @returns {string}
 */
export function getPrimaryAddress(server) {
  const remoteAddress = String(server?.remoteAddress || '').trim();

  return remoteAddress || server?.host || '';
}

/**
 * @param {{ host?: string, port?: number|string } | null | undefined} server
 * @returns {string}
 */
export function getLocalAddress(server) {
  return `${server?.host || ''}:${server?.port ?? ''}`;
}

/**
 * The name the admin gave the server, falling back to the one it reported itself.
 *
 * @param {{ customName?: string|null, name?: string } | null | undefined} server
 * @returns {string}
 */
export function getServerDisplayName(server) {
  const customName = String(server?.customName || '').trim();

  return customName || server?.name || '';
}

/**
 * Whether the Pano plugin inside the server is connected right now (`status` is the plugin
 * socket, nothing else). Use it only where the plugin itself is the one answering — a
 * managed server with no plugin can be running with this false.
 *
 * @param {{ status?: string } | null | undefined} server
 * @returns {boolean}
 */
export function isPluginConnected(server) {
  return server?.status === 'ONLINE';
}

/**
 * Whether the server is up, as the panel shows it: a managed server by its process state on
 * the node (RUNNING or STARTING), a linked one by its plugin connection. This is what every
 * online/offline dot, badge and "server is not running" check should read.
 *
 * @param {{ status?: string, kind?: string, processState?: string } | null | undefined} server
 * @returns {boolean}
 */
export function isServerOnline(server) {
  return isServerRunning(server);
}

/**
 * The server whose `/servers/[id]` route is open, kept live by `ServerDetailLayout` (realtime
 * frames are merged into it). `Navbar` and `ServerNavigationMenu` read it so they follow the
 * route instead of the per-user "selected server".
 *
 * Only ever written in the browser: a module-level store is shared by every SSR render, so on
 * the server the same components fall back to `page.data.server`, which is request-scoped.
 *
 * @type {import('svelte/store').Writable<object|null>}
 */
export const activeServer = writable(null);

/**
 * @param {object | null} server
 */
export function setActiveServer(server) {
  if (browser) {
    activeServer.set(server);
  }
}

/**
 * Why a linked server's plugin does not serve a section, as the i18n key of the sentence the
 * notice and the disabled controls show. Takes `{ section }` when rendered.
 *
 * Only reached for a server that carries no `features` at all; {@link featureUnavailableReason}
 * is what everything asks, and it delegates here for an older backend.
 *
 * @param {ServerLike | null | undefined} server
 * @returns {string}
 */
export function capabilityMissingReasonKey(server) {
  return isLegacyPluginServer(server)
    ? FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_OUTDATED]
    : FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_LACKS];
}

/**
 * Why Pano says a feature has no source (§2.4.35), mirroring
 * `com.panomc.platform.server.feature.ServerFeatureReason`. The backend decides it once, next to
 * the table it explains, and sends it as `features.reasons[path]` and as the `reason` of a
 * `409 FEATURE_UNAVAILABLE`; these are wire values and must stay in sync with the enum.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const FeatureReasons = Object.freeze({
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  NODE_OFFLINE: 'NODE_OFFLINE',
  NODE_ONLY: 'NODE_ONLY',
  SERVER_STOPPED: 'SERVER_STOPPED',
  SERVER_RUNNING: 'SERVER_RUNNING',
  NO_STDIN: 'NO_STDIN',
  PLUGIN_NOT_CONNECTED: 'PLUGIN_NOT_CONNECTED',
  PLUGIN_OUTDATED: 'PLUGIN_OUTDATED',
  PLUGIN_LACKS: 'PLUGIN_LACKS',
});

/**
 * The sentence for each reason. All but `NO_STDIN` take `{ section }` — the name of the page (or
 * control group) the feature belongs to; `NO_STDIN` keeps the sentence it has always had.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const FEATURE_REASON_KEYS = Object.freeze({
  [FeatureReasons.NOT_SUPPORTED]: 'pages.servers.capability.not-supported',
  [FeatureReasons.NODE_OFFLINE]: 'pages.servers.capability.node-offline',
  [FeatureReasons.NODE_ONLY]: 'pages.servers.capability.node-only',
  [FeatureReasons.SERVER_STOPPED]: 'pages.servers.capability.server-stopped',
  [FeatureReasons.SERVER_RUNNING]: 'pages.servers.capability.server-running',
  [FeatureReasons.NO_STDIN]: 'pages.servers.errors.no-stdin',
  [FeatureReasons.PLUGIN_NOT_CONNECTED]: 'pages.servers.capability.plugin-not-connected',
  [FeatureReasons.PLUGIN_OUTDATED]: 'pages.servers.capability.plugin-outdated',
  [FeatureReasons.PLUGIN_LACKS]: 'pages.servers.capability.plugin-lacks',
});

/**
 * @param {unknown} reason a reason code, as the backend sent it.
 * @returns {string} the i18n key of its sentence, or `''` for a code this build does not know.
 */
export function featureReasonKey(reason) {
  return FEATURE_REASON_KEYS[normalizeServerErrorCode(/** @type {string} */ (reason))] || '';
}

/**
 * @param {ServerLike | null | undefined} server
 * @param {string} path `group.field`.
 * @returns {string} the reason code Pano gave for this feature (`features.reasons[path]`), or
 *   `''` when it gave none — the feature is served, or the backend predates §2.4.35.
 */
export function featureReason(server, path) {
  const reasons = getServerFeatures(server)?.reasons;

  if (!reasons || typeof reasons !== 'object' || Array.isArray(reasons)) {
    return '';
  }

  return normalizeServerErrorCode(/** @type {string} */ (reasons[path]));
}

/**
 * Whether Pano said the server's software can never do this (`NOT_SUPPORTED`: plugins on
 * Vanilla, ticks on a proxy). That is a permanent absence, so its entry points are hidden rather
 * than disabled (§6 gating rule); a hand-typed URL still reaches the page and its notice.
 *
 * @param {ServerLike | null | undefined} server
 * @param {string} path `group.field`.
 * @returns {boolean}
 */
export function isFeatureNotSupported(server, path) {
  return featureReason(server, path) === FeatureReasons.NOT_SUPPORTED;
}

/**
 * The name each feature group is shown under in a sentence (`{section}`): the page's own name
 * where it has one, the capability's name for the two groups that live on the header and the
 * overview. A full path overrides its group where the group's name would say too much — the
 * console's prompt can be out of reach while its log streams perfectly well.
 *
 * @type {Readonly<Record<string, string>>}
 */
const FEATURE_SECTION_KEYS = Object.freeze({
  'console.input': 'pages.servers.capabilities.commands',
  'metrics.tps': 'pages.servers.overview.chart-tps',
  console: 'components.server-navigation-menu.console',
  power: 'pages.servers.capabilities.power',
  metrics: 'pages.servers.capabilities.metrics',
  players: 'components.server-navigation-menu.players',
  plugins: 'components.server-navigation-menu.plugins',
  files: 'components.server-navigation-menu.files',
  backups: 'components.server-navigation-menu.backups',
  schedules: 'components.server-navigation-menu.schedules',
});

/**
 * @param {string | null | undefined} path `group.field`.
 * @returns {string} the i18n key of the section `path` belongs to, or `''` for an unknown one.
 */
export function featureSectionKey(path) {
  const value = String(path || '');
  const own = (/** @type {string} */ key) =>
    Object.prototype.hasOwnProperty.call(FEATURE_SECTION_KEYS, key)
      ? FEATURE_SECTION_KEYS[key]
      : '';

  return own(value) || own(value.split('.')[0]);
}

/**
 * Who serves a feature (§2.4.17). Pano picks one per feature: the node's own process when it
 * is there, the plugin inside the game when it is the one that can answer, or Pano itself.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const FeatureSources = Object.freeze({
  NODE: 'node',
  PLUGIN: 'plugin',
  PANO: 'pano',
});

/**
 * @param {ServerLike | null | undefined} server
 * @returns {Record<string, Record<string, unknown>> | null} the `features` map the backend
 *   resolved for this server, or null when the row carries none (a Pano from before §2.4.17).
 */
export function getServerFeatures(server) {
  const features = /** @type {Record<string, Record<string, unknown>> | undefined} */ (
    server?.features
  );

  return features && typeof features === 'object' && !Array.isArray(features) ? features : null;
}

/**
 * The raw value of one `features` field. Most of them are sources ({@link featureSource} is
 * what reads those); this is for the two that are not: `players.listQuality` (`full` /
 * `sample`) and `backups.restoreMode` (`live` / `next-start`).
 *
 * @param {ServerLike | null | undefined} server
 * @param {string} path `group.field`, e.g. `players.listQuality`.
 * @returns {unknown} `undefined` when this server has no `features`, or none for that field.
 */
export function featureValue(server, path) {
  const features = getServerFeatures(server);

  if (!features) {
    return undefined;
  }

  const [group, field] = String(path).split('.');
  const section = features[group];

  if (!section || typeof section !== 'object') {
    return undefined;
  }

  return section[field];
}

/**
 * @param {ServerLike | null | undefined} server
 * @param {string} path `group.field`, e.g. `console.input`, `players.list`, `power.stop`.
 * @returns {string | null | undefined} the source that serves it, `null` when nothing can right
 *   now, and `undefined` when this server carries no answer for it at all — an older backend, or
 *   a feature it does not know. `undefined` is the signal to fall back to the legacy rules, so
 *   it must never be confused with `null`, which is Pano saying "nobody".
 */
export function featureSource(server, path) {
  const value = featureValue(server, path);

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  // `power.start`, `power.kill` and `metrics.host` are booleans in the contract, and all three
  // are node-only — nothing else could have answered `true`.
  if (typeof value === 'boolean') {
    return value ? FeatureSources.NODE : null;
  }

  const source = String(value).trim().toLowerCase();

  // A source id this build does not know still means somebody serves it; only `null` disables.
  return source || null;
}

/**
 * What every feature meant before `features` existed, keyed by `group.field` and falling back to
 * the group. This is today's gating verbatim: a panel talking to an older backend keeps behaving
 * exactly as it did.
 *
 * @type {Readonly<Record<string, (server: object | null | undefined) => boolean>>}
 */
const LEGACY_FEATURE_RULES = Object.freeze({
  console: (server) => hasCapability(server, ServerCapabilities.CONSOLE) || isManaged(server),
  // The node keeps the log file whether the process runs or not; the plugin only has it while
  // the game is up.
  'console.history': (server) => isManaged(server) || isPluginConnected(server),
  // The prompt was always the `commands` capability, plus the stdin pipe of a managed process
  // the node still owns (§2.4.16).
  'console.input': (server) =>
    hasCapability(server, ServerCapabilities.COMMANDS) ||
    (isManaged(server) && server?.stdinAvailable !== false),
  players: (server) =>
    hasCapability(server, [ServerCapabilities.PLAYERS, ServerCapabilities.METRICS]),
  'players.actions': (server) =>
    hasCapability(server, [ServerCapabilities.PLAYERS, ServerCapabilities.COMMANDS]),
  metrics: (server) => hasCapability(server, ServerCapabilities.METRICS),
  plugins: (server) => hasCapability(server, ServerCapabilities.PLUGINS) || isManaged(server),
  // Installing a jar and hashing one are node work; a plugin only grew them with SM-47.
  'plugins.install': (server) =>
    isManaged(server) || hasCapability(server, ServerCapabilities.PLUGIN_INSTALL),
  'plugins.identify': (server) => isManaged(server),
  files: (server) => isManaged(server) || hasCapability(server, ServerCapabilities.FILES),
  backups: (server) => isManaged(server) || hasCapability(server, ServerCapabilities.BACKUPS),
  // Only a process Pano owns can be started from nothing or killed outright.
  'power.start': (server) => isManaged(server),
  'power.kill': (server) => isManaged(server),
  power: (server) => isManaged(server) || hasCapability(server, ServerCapabilities.POWER),
  // Pano's own runner drives a server that has neither a node nor a plugin schedule runner.
  schedules: () => true,
});

/**
 * Whether this server can do something at all — `features` when it has them, today's rule when
 * it does not.
 *
 * @param {ServerLike | null | undefined} server
 * @param {string} path `group.field`.
 * @returns {boolean}
 */
export function hasFeature(server, path) {
  const source = featureSource(server, path);

  if (source !== undefined) {
    return source !== null;
  }

  const rule =
    LEGACY_FEATURE_RULES[path] || LEGACY_FEATURE_RULES[String(path).split('.')[0]] || null;

  // A path with no rule of its own is something the old panel never gated at all.
  return typeof rule === 'function' ? !!rule(server) : true;
}

/**
 * Features that need something alive on the other end: the process itself, or the plugin
 * running inside it. Everything else (a file listing, a backup, a jar scan) is work the node
 * does on a stopped server just as well.
 */
const RUNTIME_FEATURE_PATHS = Object.freeze([
  'console.input',
  'players.list',
  'players.actions',
  'power.stop',
  'power.restart',
  'metrics.tps',
  'metrics.memory',
  'metrics.players',
]);

/** Features only a node can ever serve: a linked server has nothing to do them with. */
const NODE_ONLY_FEATURE_PATHS = Object.freeze(['power.start', 'power.kill', 'metrics.host']);

/**
 * Whether the node behind a managed server is known to be away. The server row does not carry
 * the node's state, so this is what the caller handed over — the server header keeps the node
 * row live — plus the two fields a backend may put on the row itself.
 *
 * @param {ServerLike | null | undefined} server
 * @param {{ status?: string } | null | undefined} node
 * @returns {boolean}
 */
function isNodeAway(server, node) {
  // `ONLINE` is `NodeStatuses.ONLINE`, spelled out rather than imported: `nodes.util.js` reads
  // this module, and a cycle between the two would only be waiting to bite during SSR.
  if (node) {
    return String(node.status || '').toUpperCase() !== 'ONLINE';
  }

  if (server?.nodeOnline === false) {
    return true;
  }

  const status = String(server?.nodeStatus || '').trim();

  return !!status && status.toUpperCase() !== 'ONLINE';
}

/**
 * @param {ServerLike | null | undefined} server
 * @returns {boolean} whether there is a live server on the other end — a running process for a
 *   managed server, a connected plugin for a linked one.
 */
function isServerRunning(server) {
  if (isManaged(server)) {
    const state = getProcessState(server);

    return state === ProcessStates.RUNNING || state === ProcessStates.STARTING;
  }

  return isPluginConnected(server);
}

/**
 * Why a feature has no source right now, as the i18n key of the sentence the notice, the
 * tooltip or the disabled control shows (§2.4.35) — what the server lacks and what would fix
 * it. Callers pass `{ values: { section } }`, the name of the page the feature belongs to.
 *
 * Pano's own answer (`features.reasons[path]`) comes first: it is decided from the same facts as
 * the source itself, so it cannot disagree with it. The guesses below are only for a backend
 * that sends no reasons, and follow the same order.
 *
 * @param {ServerLike | null | undefined} server
 * @param {string} path `group.field`.
 * @param {{ node?: object | null }} [context] the node row, when the caller keeps one.
 * @returns {string}
 */
export function featureUnavailableReason(server, path, context = {}) {
  const reported = featureReasonKey(featureReason(server, path));

  if (reported) {
    return reported;
  }

  // An older backend can only be explained the way it was explained before §2.4.17.
  if (!getServerFeatures(server)) {
    return capabilityMissingReasonKey(server);
  }

  if (
    String(path).startsWith('plugins.') &&
    String(server?.type || '').toUpperCase() === 'VANILLA'
  ) {
    return FEATURE_REASON_KEYS[FeatureReasons.NOT_SUPPORTED];
  }

  // The node is the preferred source of nearly everything, so a managed server whose node is
  // gone is the first thing worth saying — the rest would only be a consequence of it.
  if (isManaged(server) && isNodeAway(server, context.node)) {
    return FEATURE_REASON_KEYS[FeatureReasons.NODE_OFFLINE];
  }

  if (NODE_ONLY_FEATURE_PATHS.includes(path) && !isManaged(server)) {
    return FEATURE_REASON_KEYS[FeatureReasons.NODE_ONLY];
  }

  if (RUNTIME_FEATURE_PATHS.includes(path) && !isServerRunning(server)) {
    return FEATURE_REASON_KEYS[FeatureReasons.SERVER_STOPPED];
  }

  if (!isPluginConnected(server)) {
    return FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_NOT_CONNECTED];
  }

  // A plugin that is connected but predates the capability handshake contributes nothing, and
  // updating it is the one thing that would change the answer.
  return isLegacyPluginServer(server)
    ? FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_OUTDATED]
    : FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_LACKS];
}

/**
 * Codes that describe the server's state rather than a failure (§2.4.35): something is not
 * there right now, and the page already has a notice saying what. They never become the
 * generic "the action failed" toast — a load swallows them and refreshes the server row, an
 * action toasts the specific sentence.
 */
const SERVER_STATE_ERRORS = Object.freeze([
  'FEATURE_UNAVAILABLE',
  'SERVER_CAPABILITY_MISSING',
  'NODE_OFFLINE',
  'NODE_NOT_CONNECTED',
  'SERVER_NO_STDIN',
]);

/**
 * @param {string | null | undefined} error
 * @returns {boolean} whether `error` is one of the {@link SERVER_STATE_ERRORS}.
 */
export function isServerStateError(error) {
  return SERVER_STATE_ERRORS.includes(normalizeServerErrorCode(error));
}

/**
 * @param {unknown} path
 * @returns {string} `path` when it looks like a `features` path (`group.field`), `''` otherwise.
 */
function cleanFeaturePath(path) {
  const value = String(path ?? '').trim();

  return /^[a-z]+\.[A-Za-z]+$/.test(value) ? value : '';
}

/**
 * @param {string} key
 * @returns {string} `key` translated in the active locale, or `''` when that fails.
 */
function translate(key) {
  try {
    return key ? String(get(_)(key)) : '';
  } catch {
    return '';
  }
}

/**
 * The sentence a refused action is explained with when the refusal is a state (§2.4.35): the
 * `reason` Pano put on the 409 first, then what the server row implies for the feature, then
 * the code's own sentence — never "the action failed".
 *
 * @param {string | null | undefined} error the `error` field of the response body.
 * @param {unknown} [body] the whole response body — `{ feature, reason, capability }` on a 409.
 * @param {{ server?: ServerLike | null, feature?: string, section?: string,
 *   node?: object | null }} [context] the server row the action was on and the feature it
 *   needed, for a backend that sends no reason; `section` overrides the feature's section name.
 * @returns {{ key: string, values: Record<string, string> }}
 */
export function serverStateErrorMessage(error, body = null, context = {}) {
  const code = normalizeServerErrorCode(error);
  const row = /** @type {{ feature?: unknown, reason?: unknown }} */ (
    body && typeof body === 'object' ? body : {}
  );
  const feature = cleanFeaturePath(row.feature) || cleanFeaturePath(context.feature);
  const section = translate(context.section || featureSectionKey(feature));

  if (code === 'SERVER_NO_STDIN') {
    return { key: FEATURE_REASON_KEYS[FeatureReasons.NO_STDIN], values: {} };
  }

  // A sentence without its section would read "Start the server to use ." — without one, the
  // code's own sentence below is the better answer.
  if (section) {
    const reported =
      code === 'NODE_OFFLINE' || code === 'NODE_NOT_CONNECTED'
        ? FEATURE_REASON_KEYS[FeatureReasons.NODE_OFFLINE]
        : featureReasonKey(row.reason);

    if (reported) {
      return { key: reported, values: { section } };
    }

    if (context.server && feature) {
      return {
        key: featureUnavailableReason(context.server, feature, context),
        values: { section },
      };
    }
  }

  return { key: SERVER_ERROR_KEYS[code] || 'pages.servers.errors.feature-unavailable', values: {} };
}

/** @type {Set<(serverId: number) => void>} */
const serverRefreshListeners = new Set();

/**
 * Registers the owner of a live server row (`ServerDetailLayout`) as the one that re-fetches it
 * when a page learns the row is out of date. Browser only — call it from `onMount`.
 *
 * @param {(serverId: number) => void} listener
 * @returns {() => void} unregisters it.
 */
export function onServerRefreshRequest(listener) {
  serverRefreshListeners.add(listener);

  return () => {
    serverRefreshListeners.delete(listener);
  };
}

/**
 * Asks for [serverId]'s row to be fetched again — a state error means its `features` no longer
 * describe the server, and the notice on the page is only as current as they are.
 *
 * @param {number | string | null | undefined} serverId
 */
export function requestServerRefresh(serverId) {
  const id = Number(serverId);

  if (!browser || serverId == null || !Number.isFinite(id)) {
    return;
  }

  for (const listener of serverRefreshListeners) {
    listener(id);
  }
}

/**
 * The error of a page or data load (a listing, a table, a history page). A state error is
 * swallowed — the page's notice already explains it — and the server row is refreshed so that
 * notice is current; anything else is toasted like an action's error.
 *
 * @param {string | null | undefined} error the `error` field of the response body.
 * @param {number | string | null | undefined} serverId the server the load was for.
 * @param {unknown} [body] the whole response body, when the caller has it.
 * @returns {Promise<void> | void}
 */
export function showServerLoadError(error, serverId, body = null) {
  if (isServerStateError(error)) {
    requestServerRefresh(serverId);

    return;
  }

  return showServerActionError(error, body);
}

/**
 * How long a server action stays disabled after the backend rate-limited it (§2.4.12). Not the
 * backend's window — it is a short nudge so an impatient double-click does not immediately earn
 * a second 429; the toast names the real retry hint.
 */
export const SERVER_ACTION_COOLDOWN_MS = 3000;

/**
 * @param {string | null | undefined} error
 * @returns {boolean} whether this code is the 429 the rate limiters answer with.
 */
export function isRateLimitError(error) {
  const code = normalizeServerErrorCode(error);

  return code === 'RATE_LIMITED' || code === 'RATE_LIMIT_EXCEEDED';
}

/**
 * How long the backend says to wait, in seconds. A build that sends nothing falls back to the
 * local cooldown, which is the only number the panel can honestly promise.
 *
 * @param {unknown} body the response body of the refused request.
 * @returns {number}
 */
export function getRetryAfterSeconds(body) {
  const row = /** @type {Record<string, unknown>} */ (body && typeof body === 'object' ? body : {});
  const seconds = Number(row.retryAfter ?? row.retryAfterSeconds ?? row.retry_after);

  // Clamped: a nonsense value from an unknown build must not produce "wait 9000000 seconds".
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(3600, Math.ceil(seconds))
    : Math.ceil(SERVER_ACTION_COOLDOWN_MS / 1000);
}

/**
 * A short "stop pressing that" window a component can hold an action in after a 429. Create one
 * per component instance, so it never leaks between SSR renders, and call [cancel] from
 * `onDestroy` so a pending timer cannot outlive the page.
 *
 * The returned value is itself a readable store — `$cooldown` is the boolean — with the two
 * controls hung off it, so one name covers both reading and driving it.
 *
 * @param {number} [ms]
 * @returns {import('svelte/store').Readable<boolean> & { trigger: () => void, cancel: () => void }}
 */
export function createServerActionCooldown(ms = SERVER_ACTION_COOLDOWN_MS) {
  const active = writable(false);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    active.set(false);
  }

  function trigger() {
    if (!browser) {
      return;
    }

    if (timer) {
      clearTimeout(timer);
    }

    active.set(true);
    timer = setTimeout(() => {
      timer = null;
      active.set(false);
    }, ms);
  }

  return { subscribe: active.subscribe, trigger, cancel };
}

/**
 * @param {string | null | undefined} error
 * @returns {string} the code, with everything a code cannot contain removed.
 */
function normalizeServerErrorCode(error) {
  return String(error || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '');
}

/**
 * Maps the API error shape of the server-management endpoints onto a toast. The codes come
 * from `com.panomc.platform.error`: `SERVER_CAPABILITY_MISSING` (the plugin cannot do it),
 * `SERVER_OFFLINE` (transient — the socket is down) and `RATE_LIMITED` (429).
 *
 * A state error (§2.4.35 — `FEATURE_UNAVAILABLE`, `SERVER_CAPABILITY_MISSING`, `NODE_OFFLINE`,
 * `SERVER_NO_STDIN`) is toasted as the sentence that says what the server lacks, from the 409's
 * `reason` or, for a backend that sends none, from `context` ({@link serverStateErrorMessage}),
 * and the server row is refreshed so the page's notice catches up.
 *
 * Only the codes this workspace words itself live in the map below; anything the rest of the
 * panel already translates is read from the shared `errors.*` catalogue. What is left is a real
 * failure, and the generic sentence names its code.
 *
 * The toast body is rendered as HTML, so the unknown-code fallback only ever interpolates a
 * sanitized code, never the raw string the backend sent.
 *
 * @param {string | null | undefined} error the `error` field of the response body.
 * @param {unknown} [body] the whole response body, when the caller has it — a 429 reads its
 *   retry hint out of it instead of guessing, a 409 its `reason`.
 * @param {{ server?: ServerLike | null, serverId?: number | string | null, feature?: string,
 *   section?: string, node?: object | null }} [context] the server the action was on (its row,
 *   or only its id where the caller has no row) and the feature it needed.
 * @returns {Promise<void>}
 */
export function showServerActionError(error, body = null, context = {}) {
  const code = normalizeServerErrorCode(error);

  if (isServerStateError(code)) {
    const message = serverStateErrorMessage(code, body, context);

    requestServerRefresh(context.server?.id ?? context.serverId);

    return showError(message.key, message.values);
  }

  const key = serverActionErrorKey(error);

  // The page may predate the failure: reloading the row brings its install-failure alert up.
  if (code === 'SERVER_INSTALL_FAILED') {
    requestServerRefresh(context.server?.id ?? context.serverId);
  }

  if (SERVER_ERROR_KEYS[code]) {
    return showError(key, isRateLimitError(code) ? { seconds: getRetryAfterSeconds(body) } : {});
  }

  if (key === 'pages.servers.errors.generic') {
    // Sanitized to [A-Z0-9_] above, so it is safe inside the markup.
    return showError(key, { error: `<code>${code || 'UNKNOWN'}</code>` });
  }

  return showError(key);
}

/**
 * The translation key [showServerActionError] would toast for `error`, for a screen that wants
 * the same sentence inline rather than as a toast.
 *
 * @param {string | null | undefined} error the `error` field of the response body.
 * @returns {string}
 */
export function serverActionErrorKey(error) {
  const code = normalizeServerErrorCode(error);
  const key = SERVER_ERROR_KEYS[code];

  if (key) {
    return key;
  }

  if (code && hasMessage(`errors.${code}`)) {
    return `errors.${code}`;
  }

  return 'pages.servers.errors.generic';
}

/**
 * Whether the active locale translates `key`. `json` resolves the same nested path `$_` would,
 * so a key the catalogue does not have never reaches a toast as its own id.
 *
 * @param {string} key
 * @returns {boolean}
 */
function hasMessage(key) {
  try {
    return get(json)(key) !== undefined;
  } catch {
    return false;
  }
}

/**
 * The deny pattern a refused console command ran into (§2.4.12). `POST …/console/command`
 * answers 403 `COMMAND_DENIED` with the pattern that matched; a build that only sends the code
 * falls back to the first token of the command, which is the only part the backend matches on
 * anyway.
 *
 * The toast body is rendered as HTML, so the result is stripped down to the characters a
 * pattern may contain — the backend's string is never interpolated as it arrived.
 *
 * @param {unknown} body the response body.
 * @param {string} [command] the command that was refused.
 * @returns {string}
 */
export function getDeniedCommandPattern(body, command = '') {
  const row = /** @type {{ pattern?: unknown, error?: { pattern?: unknown } }} */ (
    body && typeof body === 'object' ? body : {}
  );
  const reported =
    row.pattern ?? (row.error && typeof row.error === 'object' ? row.error.pattern : null);
  const raw =
    reported ??
    String(command || '')
      .trim()
      .split(/\s+/)[0] ??
    '';

  return String(raw)
    .trim()
    .replace(/[^A-Za-z0-9_:*-]/g, '')
    .slice(0, 64);
}

/** @type {Readonly<Record<string, string>>} */
const SERVER_ERROR_KEYS = Object.freeze({
  // §2.4.35 — only what a state error falls back to when neither the 409 nor the caller says
  // which feature it was; `serverStateErrorMessage` prefers the reason's own sentence.
  FEATURE_UNAVAILABLE: 'pages.servers.errors.feature-unavailable',
  SERVER_CAPABILITY_MISSING: 'pages.servers.errors.capability-missing',
  SERVER_OFFLINE: 'pages.servers.errors.offline',
  // A start of a managed server whose install failed: its node never set it up.
  SERVER_INSTALL_FAILED: 'pages.servers.errors.install-failed',
  RATE_LIMITED: 'pages.servers.errors.rate-limited',
  RATE_LIMIT_EXCEEDED: 'pages.servers.errors.rate-limited',
  NODE_OFFLINE: 'pages.servers.errors.node-offline',
  NODE_NOT_CONNECTED: 'pages.servers.errors.node-offline',
  NODE_NOT_EXISTS: 'pages.servers.errors.node-not-exists',
  SERVER_NOT_MANAGED: 'pages.servers.errors.not-managed',
  // §2.4.16 — the node adopted this process across its own restart, so it holds no stdin pipe
  // for it, and the plugin that could have relayed the command is not connected either.
  SERVER_NO_STDIN: 'pages.servers.errors.no-stdin',
  CURRENT_PASSWORD_NOT_CORRECT: 'pages.servers.errors.wrong-password',
  PATH_DENIED: 'pages.servers.errors.path-denied',
  FILE_TOO_LARGE: 'pages.servers.errors.file-too-large',
  TRANSFER_EXPIRED: 'pages.servers.errors.transfer-expired',
  // §2.4.28 — removing a Java runtime a server still runs from (or is pinned to).
  JAVA_IN_USE: 'pages.servers.nodes.java.error-in-use',
});

/**
 * The `note` values `/api/panel/software` can put on a catalogue entry (§2.4.15). A note says how
 * the jar is obtained, never how the server runs once it exists: `build` is compiled on the node by
 * BuildTools, `jenkins` is downloaded from the project's own CI, `deprecated` marks a project that
 * is end of life. A Pano built before SM-49 sends no note at all, so an entry without one is simply
 * an entry with nothing to warn about.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const SoftwareNotes = Object.freeze({
  BUILD: 'build',
  JENKINS: 'jenkins',
  DEPRECATED: 'deprecated',
});

/** The moving "newest build" a CI-published software lists first, instead of a version name. */
const LATEST_VERSION = 'latest';

/**
 * The badge a software card shows for its catalogue note: a Bootstrap contextual class plus the
 * i18n keys of the label and of the tooltip that explains it (`hint` is `''` when the badge needs
 * no explaining).
 *
 * @param {{ id?: string, note?: string|null, deprecated?: boolean } | null | undefined} item
 *   a catalogue entry as `/api/panel/software` reports it.
 * @returns {{ className: string, label: string, hint: string } | null} null when there is nothing
 *   to flag.
 */
export function softwareNoteBadge(item) {
  const note = String(item?.note ?? '')
    .trim()
    .toLowerCase();

  if (note === SoftwareNotes.BUILD) {
    return {
      className: 'text-bg-warning',
      label: 'components.modals.create-server.software-build',
      hint: 'components.modals.create-server.software-build-hint',
    };
  }

  if (note === SoftwareNotes.JENKINS) {
    return {
      className: 'text-bg-secondary',
      label: 'components.modals.create-server.software-jenkins',
      hint: 'components.modals.create-server.software-jenkins-hint',
    };
  }

  // `deprecated` is accepted next to the note so an entry that only carries the flag still warns.
  if (note === SoftwareNotes.DEPRECATED || item?.deprecated === true) {
    return {
      className: 'text-bg-warning',
      label: 'components.modals.create-server.software-deprecated',
      hint: '',
    };
  }

  return null;
}

/**
 * BungeeCord is published build by build, so the versions it offers are Jenkins build numbers and
 * the first of them is the moving `latest`. Only that one value is relabelled — a build number is
 * a fine label for itself.
 *
 * @param {{ id?: string, note?: string|null } | null | undefined} item a catalogue entry.
 * @param {string | number | null | undefined} version one of the versions it lists.
 * @returns {string} the i18n key to show in place of the raw value, or `''` to show it as it is.
 */
export function softwareVersionLabelKey(item, version) {
  const value = String(version ?? '')
    .trim()
    .toLowerCase();

  if (value !== LATEST_VERSION) {
    return '';
  }

  const note = String(item?.note ?? '')
    .trim()
    .toLowerCase();
  const id = String(item?.id ?? '')
    .trim()
    .toLowerCase();

  return note === SoftwareNotes.JENKINS || id === 'bungeecord'
    ? 'components.modals.create-server.version-latest-build'
    : '';
}

/* ---------------------------------------------------------------------------------------------
 * Section loaders
 *
 * One helper per `/servers/[id]` section, so a page's `load` and its client-side reloads (after
 * an action, on a realtime nudge) go through exactly the same request and the same
 * normalization. Pass the `LoadEvent` as `request` on the `load` path — that is what lets the
 * fetch run during SSR with the admin's cookies; the browser path passes nothing.
 *
 * None of them throw. A build without the endpoint (`unavailable`), a node that is offline or a
 * backend that refused (`error`) and a request that never completed (`network`) are all ordinary
 * answers the page renders as its own empty/error state, so opening the page always works.
 * ------------------------------------------------------------------------------------------- */

/**
 * The answer shared by every section loader when there is nothing to parse.
 *
 * @param {unknown} body
 * @returns {{ status: string, error?: string } | null} null when `body` is a usable payload.
 */
function sectionFailure(body) {
  // `undefined`/`null` is the network-error path — ApiUtil already raised the offline splash.
  if (body === undefined || body === null) {
    return { status: 'network' };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable' };
  }

  const error = /** @type {{ error?: unknown }} */ (body).error;

  if (error) {
    return { status: 'error', error: String(error) };
  }

  return null;
}

/**
 * The plugins (or mods) the game reported it has loaded.
 *
 * @param {unknown} list
 * @returns {Array<{ name: string, version: string, authors: string[], description: string, enabled: boolean }>}
 */
export function normalizeServerPlugins(list) {
  return (Array.isArray(list) ? list : [])
    .map((plugin) => ({
      name: String(plugin?.name ?? ''),
      version: String(plugin?.version ?? ''),
      authors: Array.isArray(plugin?.authors)
        ? plugin.authors.map((/** @type {unknown} */ author) => String(author))
        : [],
      description: String(plugin?.description ?? ''),
      enabled: plugin?.enabled !== false,
    }))
    .filter((plugin) => !!plugin.name);
}

/**
 * The jar files of the target directory (`plugins/` or `mods/`), switched-off ones included, which
 * only a managed server reports — a linked one has no node to ask.
 *
 * @param {unknown} list
 */
function normalizePluginFiles(list) {
  return (Array.isArray(list) ? list : [])
    .map((file) => ({
      filename: String(file?.filename ?? ''),
      size: Number(file?.size) || 0,
      modified: file?.modified ?? null,
      matchedPlugin: file?.matchedPlugin == null ? '' : String(file.matchedPlugin),
      // A switched-off jar is `<name>.jar.disabled`; a backend that does not say reads by the name.
      enabled:
        typeof file?.enabled === 'boolean'
          ? file.enabled
          : !/\.disabled$/i.test(String(file?.filename ?? '')),
    }))
    .filter((file) => !!file.filename);
}

/**
 * Project pages are links a source API handed us, so only http(s) ones survive.
 *
 * @param {unknown} url
 * @returns {string}
 */
function sanitizePluginLink(url) {
  const value = String(url || '');

  return value.startsWith('https://') || value.startsWith('http://') ? value : '';
}

/**
 * The install rows Pano keeps per file (§2.4.13). Every field is optional on the wire: a
 * hand-uploaded jar that was identified has no `pageUrl` on some sources, and a backend that
 * has not checked for updates yet reports no latest version.
 *
 * @param {unknown} list
 */
function normalizeTrackedPlugins(list) {
  return (Array.isArray(list) ? list : [])
    .map((entry) => ({
      filename: String(entry?.filename ?? ''),
      source: String(entry?.source ?? '').toUpperCase(),
      projectName: entry?.projectName == null ? '' : String(entry.projectName),
      pageUrl: sanitizePluginLink(entry?.pageUrl),
      versionNumber: entry?.versionNumber == null ? '' : String(entry.versionNumber),
      updateAvailable: entry?.updateAvailable === true,
      latestVersion: entry?.latestVersionNumber == null ? '' : String(entry.latestVersionNumber),
      identified: entry?.identified === true,
    }))
    .filter((entry) => !!entry.filename);
}

/**
 * @param {unknown} list
 * @returns {string[]}
 */
function normalizeFilenames(list) {
  return (Array.isArray(list) ? list : [])
    .map((entry) => String(entry ?? ''))
    .filter((entry) => !!entry);
}

/**
 * `GET /api/panel/servers/:id/plugins` (SM-16 / SM-32 / SM-48) — the loaded plugins, the jars in
 * the directory, and what Pano knows about where each one came from.
 *
 * @param {number|string} serverId
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request]
 * @returns {Promise<{ status: string, error?: string, capable: boolean, toggleable: boolean,
 *   managed: boolean, online: boolean, restartRequired: boolean, identifySupported: boolean,
 *   plugins: object[], files: object[], tracked: object[], unknownFiles: string[] }>}
 */
export async function fetchServerPlugins(serverId, request) {
  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/plugins`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  const empty = {
    capable: true,
    toggleable: false,
    managed: false,
    online: false,
    restartRequired: false,
    identifySupported: false,
    plugins: [],
    files: [],
    tracked: [],
    unknownFiles: [],
  };

  const failure = sectionFailure(body);

  if (failure) {
    return { ...empty, ...failure };
  }

  return {
    status: 'ok',
    capable: body.capable !== false,
    toggleable: body.toggleable === true,
    managed: body.managed === true,
    online: body.online === true,
    restartRequired: body.restartRequired === true,
    identifySupported: body.identifySupported === true,
    plugins: normalizeServerPlugins(body.plugins),
    files: normalizePluginFiles(body.files),
    tracked: normalizeTrackedPlugins(body.tracked),
    unknownFiles: normalizeFilenames(body.unknownFiles),
  };
}

/**
 * @param {unknown} list
 * @returns {Array<object>}
 */
function normalizeBackups(list) {
  return (Array.isArray(list) ? list : [])
    .map((backup) => ({
      id: backup?.id ?? backup?.uuid ?? '',
      uuid: backup?.uuid ?? null,
      name: String(backup?.name ?? ''),
      sizeBytes: Number(backup?.sizeBytes) || 0,
      sha256: String(backup?.sha256 ?? ''),
      status: String(backup?.status ?? ''),
      createdBy: backup?.createdBy == null ? '' : String(backup.createdBy),
      createdAt: backup?.createdAt ?? null,
      // Absent on a backend older than backup modes, which only ever made full zips of it all.
      mode: backup?.mode === 'SNAPSHOT' ? 'SNAPSHOT' : 'FULL',
      scope: backup?.scope === 'WORLDS' || backup?.scope === 'CUSTOM' ? backup.scope : 'ALL',
      pinned: backup?.pinned === true,
      fileCount: backup?.fileCount == null ? null : Number(backup.fileCount),
      storedBytes: backup?.storedBytes == null ? null : Number(backup.storedBytes),
      include: Array.isArray(backup?.include) ? backup.include.map(String) : [],
    }))
    .filter((backup) => backup.id !== '');
}

/**
 * `GET /api/panel/servers/:id/backups` (SM-33). `keepLast` is null on a build whose backup
 * settings are not exposed yet, which is what hides the retention control.
 *
 * @param {number|string} serverId
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request]
 * @returns {Promise<{ status: string, error?: string, backups: object[], keepLast: number|null, snapshotKeepLast: number|null, snapshotMaxBytes: number|null }>}
 */
export async function fetchServerBackups(serverId, request) {
  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/backups`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  const failure = sectionFailure(body);

  if (failure) {
    return {
      ...failure,
      backups: [],
      keepLast: null,
      snapshotKeepLast: null,
      snapshotMaxBytes: null,
    };
  }

  const retention = body.settings?.keepLast ?? body.keepLast;
  const snapshotRetention = body.settings?.snapshotKeepLast;

  return {
    status: 'ok',
    backups: normalizeBackups(body.backups),
    keepLast: retention == null ? null : Math.max(1, Number(retention) || 10),
    snapshotKeepLast:
      snapshotRetention == null ? null : Math.max(1, Number(snapshotRetention) || 24),
    snapshotMaxBytes: Number(body.settings?.snapshotMaxBytes) || null,
  };
}

/**
 * The payload of a task is per kind (§2.4.6) and may arrive as a JSON string, so the row keeps
 * both the raw payload (for the editor) and the flattened fields the summary needs.
 *
 * @param {object} task
 */
function normalizeScheduleTask(task) {
  const raw = task?.payload;
  /** @type {Record<string, unknown>} */
  let payload = {};

  if (typeof raw === 'string') {
    try {
      payload = JSON.parse(raw) || {};
    } catch {
      payload = {};
    }
  } else if (raw && typeof raw === 'object') {
    payload = raw;
  }

  const kind = String(task?.kind || 'COMMAND').toUpperCase();

  return {
    kind: kind === 'POWER' || kind === 'BACKUP' ? kind : 'COMMAND',
    payload,
    action: String(payload.action ?? 'RESTART').toUpperCase(),
    command: String(payload.command ?? ''),
  };
}

/**
 * @param {unknown} list
 * @returns {Array<object>}
 */
function normalizeSchedules(list) {
  return (Array.isArray(list) ? list : [])
    .map((schedule) => ({
      id: schedule?.id ?? schedule?.uuid ?? '',
      uuid: schedule?.uuid ?? null,
      name: String(schedule?.name ?? ''),
      cron: String(schedule?.cron ?? ''),
      timezone: String(schedule?.timezone ?? ''),
      enabled: schedule?.enabled !== false,
      warnMinutes: Number(schedule?.warnMinutes) || 0,
      nextRunAt: schedule?.nextRunAt ?? null,
      lastRunAt: schedule?.lastRunAt ?? null,
      lastStatus: schedule?.lastStatus == null ? '' : String(schedule.lastStatus),
      tasks: (Array.isArray(schedule?.tasks) ? schedule.tasks : []).map(
        (/** @type {object} */ task) => normalizeScheduleTask(task),
      ),
    }))
    .filter((schedule) => schedule.id !== '');
}

/**
 * `GET /api/panel/servers/:id/schedules` (SM-34, §2.4.6).
 *
 * @param {number|string} serverId
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request]
 * @returns {Promise<{ status: string, error?: string, schedules: object[] }>}
 */
export async function fetchServerSchedules(serverId, request) {
  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/schedules`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  const failure = sectionFailure(body);

  if (failure) {
    return { ...failure, schedules: [] };
  }

  return { status: 'ok', schedules: normalizeSchedules(body.schedules) };
}

/**
 * @param {unknown} list
 * @returns {Array<{ uuid: string, username: string, ping: number|null, loginTime: number, ip: string, op: boolean|null, whitelisted: boolean|null, gamemode: string|null, panoUser: boolean }>}
 */
export function normalizeServerPlayers(list) {
  return (Array.isArray(list) ? list : []).map((player) => ({
    uuid: String(player?.uuid ?? ''),
    username: String(player?.username ?? ''),
    ping: player?.ping == null ? null : Number(player.ping),
    loginTime: Number(player?.loginTime) || 0,
    ip: player?.ip ? String(player.ip) : '',
    // Null is "unknown" (a proxy, a node's ping sample, a plugin that predates the fields), which
    // the menu answers by offering both "give" and "take".
    op: typeof player?.op === 'boolean' ? player.op : null,
    whitelisted: typeof player?.whitelisted === 'boolean' ? player.whitelisted : null,
    gamemode: player?.gamemode ? String(player.gamemode) : null,
    panoUser: player?.panoUser === true,
  }));
}

/**
 * `GET /api/panel/servers/:id/players` (SM-14, §2.4.2) — the roster as it was when the page
 * opened; the `players` and `metrics` feeds keep it live from there.
 *
 * @param {number|string} serverId
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request]
 * @returns {Promise<{ status: string, error?: string, players: object[], online: number|null, max: number|null }>}
 */
export async function fetchServerPlayers(serverId, request) {
  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/players`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  const failure = sectionFailure(body);

  if (failure) {
    return { ...failure, players: [], online: null, max: null };
  }

  return {
    status: 'ok',
    players: normalizeServerPlayers(body.players),
    // `online` in the body is whether the server answered, not a count; the count is
    // `playerCount`, which a sampled list (the ping's twelve names) can exceed.
    online: body.playerCount == null ? null : Number(body.playerCount),
    max: body.maxPlayerCount == null ? null : Number(body.maxPlayerCount),
  };
}

/**
 * i18n keys of the task kinds a server can be busy with (SM-68, §2.4.33), shared by the server
 * header, the Servers modal card and the node page's Servers card so all three say the same thing.
 *
 * @type {Readonly<Record<string, string>>}
 */
const TASK_KIND_KEYS = Object.freeze({
  INSTALL: 'pages.servers.header.task-install',
  REINSTALL: 'pages.servers.header.task-reinstall',
  DELETE: 'pages.servers.header.task-delete',
  BACKUP: 'pages.servers.header.task-backup',
  RESTORE: 'pages.servers.header.task-restore',
  IMPORT: 'pages.servers.header.task-import',
  JAVA_INSTALL: 'pages.servers.header.task-java-install',
  JAVA_REMOVE: 'pages.servers.header.task-java-remove',
});

/** Software ids a node can only get by compiling them with BuildTools (§2.4.15). */
const BUILD_TOOLS_SOFTWARE = Object.freeze(['SPIGOT', 'CRAFTBUKKIT', 'BUKKIT']);

/**
 * @param {string | null | undefined} kind a task kind (INSTALL, REINSTALL, BACKUP, ...).
 * @returns {string} the i18n key of its label; "Working" for a kind this panel does not know.
 */
export function taskKindLabelKey(kind) {
  return (
    TASK_KIND_KEYS[String(kind || 'INSTALL').toUpperCase()] || 'pages.servers.header.task-working'
  );
}

/**
 * @param {{ status?: string } | null | undefined} task
 * @returns {boolean} whether the task has neither finished nor failed yet.
 */
export function isTaskRunning(task) {
  const status = String(task?.status || '').toUpperCase();

  return status === 'PENDING' || status === 'RUNNING';
}

/**
 * @param {{ percent?: number|string|null } | null | undefined} task
 * @returns {number} the task's progress as a whole percentage, clamped to 0–100.
 */
export function taskPercent(task) {
  return Math.max(0, Math.min(100, Math.round(Number(task?.percent) || 0)));
}

/**
 * @param {{ message?: string|null } | null | undefined} task
 * @returns {string} the node's one-line status of the task, trimmed; `''` when it sent none.
 */
export function taskMessage(task) {
  return String(task?.message ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * How Pano words a Pano plugin update's task when it opens one (`PanoPluginUpdateService`), for a
 * backend that does not flag the task yet.
 */
const PANO_PLUGIN_UPDATE_MESSAGE = /^updating the pano plugin\b/i;

/**
 * Whether [task] is the Pano plugin being updated (SM-77): flagged `panoPluginUpdate` by Pano, or
 * — before the flag — a `PLUGIN_INSTALL` Pano opened with its own "Updating the Pano plugin" line.
 *
 * @param {{ kind?: string, message?: string|null, panoPluginUpdate?: boolean } | null | undefined} task
 * @returns {boolean}
 */
export function isPanoPluginUpdateTask(task) {
  if (!task || typeof task !== 'object') {
    return false;
  }

  if (task.panoPluginUpdate === true) {
    return true;
  }

  return (
    String(task.kind || '').toUpperCase() === 'PLUGIN_INSTALL' &&
    PANO_PLUGIN_UPDATE_MESSAGE.test(taskMessage(task))
  );
}

/**
 * @param {{ kind?: string, message?: string|null, panoPluginUpdate?: boolean } | null | undefined} task
 * @returns {string} the i18n key of what [task] is doing: "Updating the Pano plugin" for that
 *   update, the kind's label otherwise.
 */
export function taskLabelKey(task) {
  return isPanoPluginUpdateTask(task)
    ? 'pages.servers.header.task-pano-plugin-update'
    : taskKindLabelKey(task?.kind);
}

/**
 * @param {{ kind?: string, message?: string|null, panoPluginUpdate?: boolean } | null | undefined} task
 * @returns {string} the task's own status line, without Pano's opening line of a Pano plugin
 *   update, which only repeats the label in English.
 */
export function taskDetail(task) {
  const message = taskMessage(task);

  return isPanoPluginUpdateTask(task) && PANO_PLUGIN_UPDATE_MESSAGE.test(message) ? '' : message;
}

/**
 * The task a server is busy with, as a card shows it: the server JSON's `activeTask` (SM-68),
 * when it is still running.
 *
 * @param {{ activeTask?: object|null } | null | undefined} server
 * @returns {{ id?: number, uuid?: string, kind: string, status: string, percent: number, message: string, startedAt?: number } | null}
 */
export function getActiveTask(server) {
  const task = server?.activeTask;

  return task && typeof task === 'object' && isTaskRunning(task) ? task : null;
}

/**
 * Whether [task] is BuildTools compiling the server — an install or reinstall of software that
 * has no download (§2.4.15) — which is worth a "this takes 5–10 minutes" note.
 *
 * @param {{ kind?: string } | null | undefined} task
 * @param {{ software?: string|null } | null | undefined} server
 */
export function isBuildToolsTask(task, server) {
  const kind = String(task?.kind || '').toUpperCase();

  return (
    (kind === 'INSTALL' || kind === 'REINSTALL') &&
    BUILD_TOOLS_SOFTWARE.includes(String(server?.software || '').toUpperCase())
  );
}

/** How long a card keeps the "failed" line of a task that just failed. */
export const TASK_FAILURE_VISIBLE_MS = 10000;

/**
 * [server] with one `taskProgress` frame applied (SM-68): a running task becomes its
 * `activeTask`, an ended one clears it, and a FAILED one leaves `taskFailure` behind for the card's
 * short danger line. Returns [server] itself when the frame is about something else, so a caller
 * can skip the store write.
 *
 * @template {{ id?: number|string, activeTask?: object|null }} T
 * @param {T} server
 * @param {{ taskId?: string, taskUuid?: string|null, serverId?: number|null, kind?: string, status?: string, percent?: number, message?: string, error?: string|null, startedAt?: number|null, panoPluginUpdate?: boolean }} frame
 * @returns {T}
 */
/**
 * What a task is downloading, for the line beside its percentage: "120.4 MB / 1 GB · 12.4 MB/s",
 * just the bytes when the upstream sent no size, and "" for a task that is not downloading.
 *
 * @param {{ transfer?: { done?: number, total?: number | null, bytesPerSecond?: number | null } | null } | null | undefined} task
 * @returns {string}
 */
export function taskTransferText(task) {
  const transfer = task?.transfer;
  const done = Number(transfer?.done);

  if (!transfer || !Number.isFinite(done) || done < 0) {
    return '';
  }

  const total = Number(transfer.total);
  const rate = transfer.bytesPerSecond == null ? NaN : Number(transfer.bytesPerSecond);
  const size =
    total > 0 ? `${formatBytes(done, 1)} / ${formatBytes(total, 1)}` : formatBytes(done, 1);

  return Number.isFinite(rate) && rate >= 0 ? `${size} · ${formatBytes(rate, 1)}/s` : size;
}

export function applyTaskFrame(server, frame) {
  if (!server || frame?.serverId == null || Number(frame.serverId) !== Number(server.id)) {
    return server;
  }

  const current = server.activeTask;
  const sameTask =
    current &&
    ((frame.taskUuid && current.uuid === frame.taskUuid) ||
      (frame.taskId != null && String(current.id) === String(frame.taskId)));

  // SM-77 — a Pano plugin update stays one for its whole run: the node's progress lines replace
  // the message it was recognised by, and a frame need not repeat the flag the JSON carried.
  const panoPluginUpdate =
    isPanoPluginUpdateTask(frame) || (!!sameTask && isPanoPluginUpdateTask(current));

  if (isTaskRunning(frame)) {
    // An older task still running (a backup under a Java download) does not take the card from
    // the newer one; the server JSON picks the newest the same way.
    const startedAt = Number(frame.startedAt) || Date.now();

    if (current && !sameTask && isTaskRunning(current) && Number(current.startedAt) > startedAt) {
      return server;
    }

    return {
      ...server,
      activeTask: {
        id: frame.taskId == null ? null : Number(frame.taskId),
        uuid: frame.taskUuid ?? null,
        kind: String(frame.kind || ''),
        status: String(frame.status || ''),
        percent: taskPercent(frame),
        message: frame.message ?? '',
        startedAt,
        panoPluginUpdate,
        // Only on the frames of a step that is downloading; a later step's frame drops it.
        transfer: frame.transfer ?? null,
      },
      taskFailure: null,
    };
  }

  // DONE, FAILED, or a restore waiting for the next start: nothing is happening on the server.
  // A frame for a task the card is not showing still clears nothing it should keep.
  if (current && !sameTask) {
    return server;
  }

  return {
    ...server,
    activeTask: null,
    // Where it stopped and what it was, so the server header can hold a red bar for a moment.
    taskFailure:
      String(frame.status || '').toUpperCase() === 'FAILED'
        ? {
            kind: String(frame.kind || ''),
            error: frame.error ?? null,
            at: Date.now(),
            percent: taskPercent(frame),
            message: frame.message ?? '',
            panoPluginUpdate,
          }
        : null,
  };
}

/**
 * What is wrong with [server] that the servers modal marks with a red exclamation mark, as the
 * sentences its tooltip reads: a crash (with the exit code and the reason the node gave, when it
 * gave them), a Pano plugin that speaks an older protocol than this Pano, and a node or Pano Agent
 * that does. Empty when nothing is.
 *
 * Each entry is an i18n key and its values; the crash reason is the node's own text and travels
 * as a value, never as markup.
 *
 * @param {Record<string, any> | null | undefined} server
 * @returns {Array<{ key: string, values?: Record<string, unknown> }>}
 */
export function serverProblems(server) {
  /** @type {Array<{ key: string, values?: Record<string, unknown> }>} */
  const problems = [];

  if (!server) {
    return problems;
  }

  if (String(server.processState || '').toUpperCase() === ProcessStates.CRASHED) {
    const code = server.lastExitCode;

    problems.push(
      code == null || code === ''
        ? { key: 'components.modals.servers.problems.crashed' }
        : { key: 'components.modals.servers.problems.crashed-exit', values: { code } },
    );

    const reason = String(server.lastStopReason?.reason || server.lastStateReason || '').trim();

    if (reason) {
      problems.push({ key: 'components.modals.servers.problems.crash-reason', values: { reason } });
    }
  }

  if (server.panoPluginUpdate?.outdatedProtocol === true) {
    problems.push({ key: 'components.modals.servers.problems.plugin-outdated' });
  }

  if (server.nodeOutdated === true) {
    problems.push({
      key: server.agent
        ? 'components.modals.servers.problems.agent-outdated'
        : 'components.modals.servers.problems.node-outdated',
    });
  }

  return problems;
}
