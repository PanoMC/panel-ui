/**
 * Helpers shared by everything that talks about nodes — the hosts that run managed servers
 * (§2.1). A node is the `pano-node` daemon: it pairs with Pano over an outbound WebSocket,
 * reports `NODE_HELLO` resources plus 10-second metrics, and executes the install / power /
 * startup pushes Pano sends it.
 *
 * The panel never gets node rows over REST more than once: the nodes page and the managed
 * server header subscribe to the `node` feed and merge the frames into the cache below.
 */

import ApiUtil from '$lib/api.util.js';
import { isEndpointUnavailable } from '$lib/servers.util.js';
import { formatBytes } from '$lib/string.util.js';

/** Where the node runs (§2.1). */
export const NodeKinds = Object.freeze({
  LOCAL: 'LOCAL',
  REMOTE: 'REMOTE',
});

/** How the node runs the servers it hosts. `DOCKER` lands with SM-43. */
export const NodeRuntimes = Object.freeze({
  PROCESS: 'PROCESS',
  DOCKER: 'DOCKER',
});

/**
 * How the node got here (§2.4.10, `node.bootstrap`). Purely informational — it changes nothing
 * about how Pano talks to the daemon, but it is what tells an admin whether a machine was
 * paired by hand or provisioned for them.
 */
export const NodeBootstraps = Object.freeze({
  LOCAL: 'LOCAL',
  MANUAL: 'MANUAL',
  SSH: 'SSH',
  COOLIFY: 'COOLIFY',
});

/** Bootstrap badge colour + label key. An older node row has no `bootstrap` at all. */
const BOOTSTRAP_BADGES = Object.freeze({
  [NodeBootstraps.LOCAL]: { colour: 'secondary', label: 'pages.servers.nodes.bootstrap-local' },
  [NodeBootstraps.MANUAL]: { colour: 'secondary', label: 'pages.servers.nodes.bootstrap-manual' },
  [NodeBootstraps.SSH]: { colour: 'info', label: 'pages.servers.nodes.bootstrap-ssh' },
  [NodeBootstraps.COOLIFY]: { colour: 'primary', label: 'pages.servers.nodes.bootstrap-coolify' },
});

/**
 * @param {{ bootstrap?: string, kind?: string } | null | undefined} node
 * @returns {{ colour: string, label: string } | null} null when the row predates the column, so
 *   the cell can stay empty instead of inventing a value.
 */
export function nodeBootstrapBadge(node) {
  const bootstrap = String(node?.bootstrap || '').toUpperCase();

  return BOOTSTRAP_BADGES[bootstrap] || null;
}

/**
 * Where a node or a Pano Agent replacing its own daemon is (SM-77): Pano's in-memory record of it,
 * on the node JSON as `updateProgress` and on the server JSON as `daemonUpdate`, and pushed with
 * every change — so every tab and every admin sees the same thing.
 */
export const DaemonUpdateStatuses = Object.freeze({
  RUNNING: 'RUNNING',
  RESTARTING: 'RESTARTING',
  DONE: 'DONE',
  FAILED: 'FAILED',
});

/**
 * @typedef {{ kind: 'agent' | 'node', nodeId: number | null, nodeName: string, version: string,
 *   status: string, percent: number, message: string }} DaemonUpdate
 */

/**
 * [value] (`updateProgress` or `daemonUpdate`) in one shape, or null when there is none — also
 * for a backend that sends neither, or a status this panel does not know.
 *
 * @param {Record<string, any> | null | undefined} value
 * @returns {DaemonUpdate | null}
 */
export function normalizeDaemonUpdate(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const status = String(value.status || '').toUpperCase();

  if (!(status in DaemonUpdateStatuses)) {
    return null;
  }

  const percent = Number(value.percent);
  const nodeId = Number(value.nodeId);

  return {
    kind: String(value.kind || '').toLowerCase() === 'agent' ? 'agent' : 'node',
    nodeId: value.nodeId != null && Number.isFinite(nodeId) ? nodeId : null,
    nodeName: String(value.nodeName ?? '').trim(),
    version: String(value.version ?? '').trim(),
    status,
    percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.round(percent))) : 0,
    message: String(value.message ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

/**
 * @param {DaemonUpdate | Record<string, any> | null | undefined} update
 * @returns {boolean} whether the daemon is still on its way to the new version.
 */
export function isDaemonUpdating(update) {
  const status = String(update?.status || '').toUpperCase();

  return status === DaemonUpdateStatuses.RUNNING || status === DaemonUpdateStatuses.RESTARTING;
}

/** Connection state of the daemon's WebSocket, as the backend stores it. */
export const NodeStatuses = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
});

/**
 * @param {{ status?: string } | null | undefined} node
 * @returns {boolean}
 */
export function isNodeOnline(node) {
  return String(node?.status || '').toUpperCase() === NodeStatuses.ONLINE;
}

/**
 * A node the admin paired but has not accepted yet cannot host anything. `approved` is only
 * ever false for a manually paired node — a local node bootstraps with a token and is
 * approved on arrival (§2.4.3).
 *
 * @param {{ approved?: boolean } | null | undefined} node
 * @returns {boolean}
 */
export function isNodeApproved(node) {
  return node?.approved !== false;
}

/**
 * A node that can take a new server right now.
 *
 * @param {object | null | undefined} node
 * @returns {boolean}
 */
export function isNodeUsable(node) {
  return isNodeOnline(node) && isNodeApproved(node);
}

/**
 * @param {{ name?: string, hostname?: string, id?: number|string } | null | undefined} node
 * @returns {string}
 */
export function getNodeDisplayName(node) {
  const name = String(node?.name || '').trim();

  if (name) {
    return name;
  }

  const hostname = String(node?.hostname || '').trim();

  return hostname || (node?.id == null ? '' : `#${node.id}`);
}

/**
 * @param {object | null | undefined} node
 * @returns {string} a Bootstrap contextual colour name.
 */
export function nodeStatusColour(node) {
  if (!isNodeApproved(node)) {
    return 'warning';
  }

  return isNodeOnline(node) ? 'success' : 'danger';
}

/**
 * @param {object | null | undefined} node
 * @returns {string} the i18n key of the status label.
 */
export function nodeStatusLabel(node) {
  if (!isNodeApproved(node)) {
    return 'pages.servers.nodes.status-pending';
  }

  return isNodeOnline(node)
    ? 'pages.servers.nodes.status-online'
    : 'pages.servers.nodes.status-offline';
}

/**
 * The Java majors the node reported in `NODE_HELLO.javaRuntimes`, deduplicated and sorted.
 *
 * @param {{ resources?: { javaRuntimes?: { major: number|string }[] } } | null | undefined} node
 * @returns {number[]}
 */
export function getNodeJavaMajors(node) {
  const runtimes = node?.resources?.javaRuntimes;

  if (!Array.isArray(runtimes)) {
    return [];
  }

  const majors = runtimes
    .map((runtime) => Number(runtime?.major))
    .filter((major) => Number.isFinite(major) && major > 0);

  return [...new Set(majors)].sort((a, b) => a - b);
}

/**
 * Node rows the panel has seen, keyed by id. Written by the REST loads, the `node` feed and
 * [cacheNode]; read by anything that only needs a name (the managed-server header badge).
 *
 * @type {Map<number, object>}
 */
const nodeCache = new Map();
/** @type {Map<number, Promise<object|null>>} */
const nodeRequests = new Map();

/**
 * @param {number|string|null|undefined} nodeId
 * @returns {number|null}
 */
function normalizeNodeId(nodeId) {
  if (nodeId == null || nodeId === '' || Number.isNaN(Number(nodeId))) {
    return null;
  }

  return Number(nodeId);
}

/**
 * @param {object | null | undefined} node
 * @returns {object | null} the cached row, merged with what was already known.
 */
export function cacheNode(node) {
  const id = normalizeNodeId(node?.id);

  if (id == null) {
    return null;
  }

  const merged = { ...(nodeCache.get(id) || {}), ...node };

  nodeCache.set(id, merged);

  return merged;
}

/**
 * @param {number|string|null|undefined} nodeId
 * @returns {object | null}
 */
export function getCachedNode(nodeId) {
  const id = normalizeNodeId(nodeId);

  return id == null ? null : nodeCache.get(id) || null;
}

/**
 * @param {number|string|null|undefined} nodeId
 */
export function forgetNode(nodeId) {
  const id = normalizeNodeId(nodeId);

  if (id != null) {
    nodeCache.delete(id);
    nodeRequests.delete(id);
  }
}

/**
 * One row straight from `GET /api/panel/nodes/:id`, uncached. Anything that is not a node row —
 * no `MANAGE_NODES`, a deleted node, a backend without the endpoint, a request that never
 * completed — resolves to null, so no caller ever has to catch.
 *
 * @param {number} id
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request]
 * @returns {Promise<object|null>}
 */
function requestNode(id, request) {
  return ApiUtil.get({
    path: `/api/panel/nodes/${id}`,
    request,
    handler: (response) => response,
  })
    .then((body) => {
      if (!body || typeof body !== 'object' || body.error) {
        return null;
      }

      return body.node || body;
    })
    .catch(() => null);
}

/**
 * One `GET /api/panel/nodes/:id` per node per page load: concurrent callers share the same
 * promise, and a node that is already cached resolves without a request. A failure (no
 * `MANAGE_NODES`, node deleted, backend without the endpoint) resolves to null so callers can
 * fall back to "Managed" without a node name instead of blowing up.
 *
 * @param {number|string|null|undefined} nodeId
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request] pass a load event for SSR. That
 *   path skips the cache entirely — module state is shared by every SSR render, so the row is
 *   handed to the page instead, which caches it once it is in the browser.
 * @returns {Promise<object|null>}
 */
export function fetchNode(nodeId, request) {
  const id = normalizeNodeId(nodeId);

  if (id == null) {
    return Promise.resolve(null);
  }

  if (request) {
    return requestNode(id, request);
  }

  const cached = nodeCache.get(id);

  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = nodeRequests.get(id);

  if (pending) {
    return pending;
  }

  const inflight = requestNode(id)
    .then((row) => (row ? cacheNode(row) : null))
    .finally(() => {
      nodeRequests.delete(id);
    });

  nodeRequests.set(id, inflight);

  return inflight;
}

/**
 * The add-node modal registers its opener here so the create-server wizard can offer "Add a
 * node" without importing it (and keeps working in a build where it is not mounted, e.g. for
 * an admin without `MANAGE_NODES`).
 *
 * @type {(() => void) | null}
 */
let addNodeOpener = null;

/**
 * @param {() => void} opener
 * @returns {() => void} unregister function.
 */
export function setAddNodeOpener(opener) {
  addNodeOpener = opener;

  return () => {
    if (addNodeOpener === opener) {
      addNodeOpener = null;
    }
  };
}

/**
 * @returns {boolean} false when no add-node modal is mounted, so the caller can explain why.
 */
export function openAddNodeModal() {
  if (!addNodeOpener) {
    return false;
  }

  addNodeOpener();

  return true;
}

/**
 * Ask Pano to download and spawn the daemon on its own machine (SM-23). The endpoint may not
 * exist in an older build, so the result is a status the caller turns into a toast rather than
 * an exception.
 *
 * @returns {Promise<{ status: 'ok'|'unavailable'|'network'|'error', error?: string, node?: object|null }>}
 */
export async function requestLocalNodeSetup() {
  const body = await ApiUtil.post({
    path: '/api/panel/nodes/local/setup',
    handler: (response) => response,
  });

  // `undefined`/`null` is the network-error path — ApiUtil already raised the offline splash.
  if (body === undefined || body === null) {
    return { status: 'network' };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable' };
  }

  if (body.error) {
    // The backend explains a refused start in `message` (no Java, no jar, disabled in
    // config.conf); the code alone would only say "bad request" back.
    return {
      status: 'error',
      error: String(body.error),
      message: body.message == null ? '' : String(body.message),
    };
  }

  return { status: 'ok', local: body, node: body.node ? cacheNode(body.node) : null };
}

/**
 * `GET /api/panel/nodes/local` — the supervisor's view of the local daemon: `status`
 * (`RUNNING`/`STOPPED`/`FAILED`/`NOT_SET_UP`/`DISABLED`), `nodeId`, `pid`, `javaMajor`,
 * `javaPath`, `error`, `givenUp`.
 *
 * @returns {Promise<{ status: 'ok'|'unavailable'|'network'|'error', error?: string, local?: Record<string, any> }>}
 */
export async function fetchLocalNodeStatus() {
  const body = await ApiUtil.get({
    path: '/api/panel/nodes/local',
    handler: (response) => response,
  });

  if (body === undefined || body === null) {
    return { status: 'network' };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable' };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error) };
  }

  return { status: 'ok', local: body };
}

/**
 * One node straight from the backend, bypassing the cache: for the moments where the question
 * is "is it online *now*", which a cached row cannot answer.
 *
 * @param {number | string} nodeId
 * @returns {Promise<object | null>}
 */
export async function fetchNodeStatus(nodeId) {
  const id = normalizeNodeId(nodeId);

  if (id == null) {
    return null;
  }

  const body = await ApiUtil.get({
    path: `/api/panel/nodes/${id}`,
    handler: (response) => response,
  });

  if (!body || body.error || !body.node) {
    return null;
  }

  return cacheNode(body.node);
}

/**
 * Hand a node the daemon jar this Pano serves (§2.4.3 `SELF_UPDATE`): the node downloads it,
 * checks the SHA-256 and restarts into it. So the answer is only ever "the update is on its
 * way" — `upToDate` is the other outcome, where the node already runs exactly these bytes and
 * nothing was sent.
 *
 * @param {number|string} nodeId
 * @returns {Promise<{ status: 'ok'|'unavailable'|'network'|'error', error?: string,
 *   upToDate?: boolean, version?: string }>}
 */
export async function requestNodeUpdate(nodeId) {
  const body = await ApiUtil.post({
    path: `/api/panel/nodes/${nodeId}/update`,
    handler: (response) => response,
  });

  // `undefined`/`null` is the network-error path — ApiUtil already raised the offline splash.
  if (body === undefined || body === null) {
    return { status: 'network' };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable' };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error) };
  }

  return {
    status: 'ok',
    upToDate: body.upToDate === true,
    version: body.version == null ? '' : String(body.version),
  };
}

/**
 * `GET /api/panel/nodes`, normalized: the list endpoint may answer with `{ nodes: [...] }` or a
 * bare array, and every row is pushed into the cache.
 *
 * @param {import('@sveltejs/kit').LoadEvent | undefined} [request] pass a load event for SSR.
 * @returns {Promise<{ status: 'ok'|'unavailable'|'network'|'error', error?: string, nodes: object[] }>}
 */
export async function fetchNodes(request) {
  const body = await ApiUtil.get({
    path: '/api/panel/nodes',
    request,
    handler: (response) => response,
  });

  if (body === undefined || body === null) {
    return { status: 'network', nodes: [] };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', nodes: [] };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error), nodes: [] };
  }

  const nodes = Array.isArray(body.nodes) ? body.nodes : Array.isArray(body) ? body : [];

  nodes.forEach((node) => cacheNode(node));

  return { status: 'ok', nodes };
}

/*
 * Managed Java runtimes (SM-63, §2.4.28). The node finds the runtimes a host already has and can
 * download the ones it lacks (Eclipse Temurin, Azul Zulu where Temurin has a gap). The panel reads
 * the node's catalogue — what is installed, what could be downloaded for this os/arch — and hands
 * the node install/remove tasks that report back over the usual `taskProgress` frames.
 */

/** Task kinds the Java card and the server overview follow. */
export const JavaTaskKinds = Object.freeze({
  INSTALL: 'JAVA_INSTALL',
  REMOVE: 'JAVA_REMOVE',
});

/**
 * What each downloadable major is for, as the i18n key of a short hint. Only the majors the
 * Minecraft ladder can ask for have one; anything else the node offers stays unlabelled.
 *
 * @type {Readonly<Record<number, string>>}
 */
const JAVA_MAJOR_HINTS = Object.freeze({
  8: 'pages.servers.nodes.java.hint-8',
  11: 'pages.servers.nodes.java.hint-11',
  16: 'pages.servers.nodes.java.hint-16',
  17: 'pages.servers.nodes.java.hint-17',
  21: 'pages.servers.nodes.java.hint-21',
  25: 'pages.servers.nodes.java.hint-25',
});

/**
 * @param {number|string} major
 * @returns {string} the i18n key of the "what is this Java for" hint, or '' when there is none.
 */
export function javaMajorHint(major) {
  return JAVA_MAJOR_HINTS[Number(major)] || '';
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function positiveNumber(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function text(value) {
  return value == null ? '' : String(value).trim();
}

/**
 * One installed runtime, whether it came from the catalogue or from `resources.javaRuntimes`.
 *
 * @param {any} runtime
 * @returns {{ major: number, version: string, vendor: string, path: string, managed: boolean,
 *   usedBy: { id: number|null, name: string }[] } | null}
 */
function normalizeJavaRuntime(runtime) {
  const major = positiveNumber(runtime?.major);

  if (major == null) {
    return null;
  }

  // A server the node runs but Pano has no row for comes back with `id: null` and its uuid; it
  // still counts as "in use", it just has nothing to link to.
  const usedBy = Array.isArray(runtime?.usedBy)
    ? runtime.usedBy.map((entry) => {
        const raw = entry && typeof entry === 'object' ? entry : { id: entry };
        const id = raw.id == null || raw.id === '' ? null : Number(raw.id);

        return { id: Number.isFinite(id) ? id : null, name: text(raw.name) };
      })
    : [];

  return {
    major,
    version: text(runtime?.version),
    vendor: text(runtime?.vendor),
    path: text(runtime?.path ?? runtime?.home),
    managed: runtime?.managed === true,
    usedBy,
  };
}

/**
 * @param {any} entry
 * @returns {{ major: number, available: boolean, vendor: string, version: string,
 *   size: number|null, installedVersion: string, updateAvailable: boolean } | null}
 */
function normalizeJavaDownload(entry) {
  const major = positiveNumber(entry?.major);

  if (major == null) {
    return null;
  }

  return {
    major,
    available: entry?.available !== false,
    vendor: text(entry?.vendor),
    version: text(entry?.version),
    size: positiveNumber(entry?.size),
    installedVersion: text(entry?.installedVersion),
    updateAvailable: entry?.updateAvailable === true,
  };
}

/**
 * The runtimes a node row carries in `resources.javaRuntimes`, normalized like the catalogue's.
 *
 * @param {object | null | undefined} node
 */
export function getNodeJavaRuntimes(node) {
  const runtimes = /** @type {any} */ (node)?.resources?.javaRuntimes;

  return Array.isArray(runtimes)
    ? runtimes.map(normalizeJavaRuntime).filter((runtime) => runtime !== null)
    : [];
}

/**
 * @typedef {{
 *   online: boolean,
 *   supported: boolean,
 *   downloads: boolean,
 *   os: string,
 *   arch: string,
 *   libc: string,
 *   autoDownload: boolean|null,
 *   runtimes: ReturnType<typeof getNodeJavaRuntimes>,
 *   downloadable: NonNullable<ReturnType<typeof normalizeJavaDownload>>[],
 *   catalogError: string,
 * }} JavaCatalog
 */

/**
 * `GET /api/panel/nodes/:id/java`, normalized. An offline node answers with only the runtimes it
 * reported last; a node older than SM-63 has no catalogue at all, which the backend says with a
 * flag — either way `downloads` is false and nothing may be offered for download.
 *
 * @param {any} body
 * @returns {JavaCatalog}
 */
export function normalizeJavaCatalog(body) {
  const online = body?.online !== false;
  const unsupported =
    body?.supported === false ||
    body?.downloadsSupported === false ||
    body?.outdated === true ||
    body?.nodeOutdated === true;

  return {
    online,
    supported: !unsupported,
    downloads: online && !unsupported && Array.isArray(body?.downloadable),
    os: text(body?.os),
    arch: text(body?.arch),
    libc: text(body?.libc),
    autoDownload: typeof body?.autoDownload === 'boolean' ? body.autoDownload : null,
    runtimes: Array.isArray(body?.runtimes)
      ? body.runtimes.map(normalizeJavaRuntime).filter((runtime) => runtime !== null)
      : [],
    downloadable: Array.isArray(body?.downloadable)
      ? body.downloadable
          .map(normalizeJavaDownload)
          .filter((entry) => entry !== null)
          .sort((a, b) => a.major - b.major)
      : [],
    catalogError: text(body?.catalogError),
  };
}

/**
 * The node's Java catalogue. Never throws: `unavailable` is a backend without the endpoint, and
 * callers fall back to the majors in `resources.javaRuntimes`.
 *
 * @param {number|string} nodeId
 * @returns {Promise<{ status: 'ok'|'unavailable'|'network'|'error', error?: string,
 *   catalog?: JavaCatalog }>}
 */
export async function fetchNodeJava(nodeId) {
  const id = normalizeNodeId(nodeId);

  if (id == null) {
    return { status: 'error', error: 'NOT_EXISTS' };
  }

  let body;

  try {
    body = await ApiUtil.get({
      path: `/api/panel/nodes/${id}/java`,
      handler: (response) => response,
    });
  } catch {
    return { status: 'network' };
  }

  if (body === undefined || body === null) {
    return { status: 'network' };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable' };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error) };
  }

  return { status: 'ok', catalog: normalizeJavaCatalog(body) };
}

/**
 * @param {any} body
 * @returns {{ status: 'ok'|'unavailable'|'network'|'error', error?: string, taskId?: string }}
 */
function taskResult(body) {
  if (body === undefined || body === null) {
    return { status: 'network' };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable' };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error) };
  }

  return { status: 'ok', taskId: body.taskId == null ? '' : String(body.taskId) };
}

/**
 * `POST /api/panel/nodes/:id/java { major }` — download (or update) a Java major on the node.
 *
 * @param {number|string} nodeId
 * @param {number} major
 */
export async function requestJavaInstall(nodeId, major) {
  return taskResult(
    await ApiUtil.post({
      path: `/api/panel/nodes/${nodeId}/java`,
      body: { major: Number(major) },
      handler: (response) => response,
    }),
  );
}

/**
 * `POST /api/panel/nodes/:id/java/:major/delete { version? }` — remove a runtime Pano installed.
 *
 * @param {number|string} nodeId
 * @param {number} major
 * @param {string} [version] a specific managed version; the node picks the major's otherwise.
 */
export async function requestJavaRemove(nodeId, major, version) {
  return taskResult(
    await ApiUtil.post({
      path: `/api/panel/nodes/${nodeId}/java/${Number(major)}/delete`,
      body: version ? { version } : {},
      handler: (response) => response,
    }),
  );
}

/**
 * The Java choices a server on this node can have: the majors installed there, plus — when the
 * node can download and has not been told not to — the ones it would fetch on first use. A major
 * neither source has for this os/arch is left out entirely.
 *
 * @param {object | null | undefined} node the node row (its `resources.javaRuntimes`).
 * @param {JavaCatalog | null | undefined} catalog null when the catalogue could not be read.
 * @returns {{ installed: number[], downloadable: { major: number, size: number|null }[],
 *   autoDownload: boolean }}
 */
export function javaChoicesFor(node, catalog) {
  const installed = [
    ...new Set([
      ...getNodeJavaMajors(node),
      ...(catalog?.runtimes || []).map((runtime) => runtime.major),
    ]),
  ].sort((a, b) => a - b);

  // `resources.javaDownloads` is the node's own "I can install Java" flag from its hello.
  const autoDownload =
    !!catalog?.downloads &&
    catalog.autoDownload !== false &&
    /** @type {any} */ (node)?.resources?.javaDownloads !== false;

  const downloadable = autoDownload
    ? catalog.downloadable
        .filter((entry) => entry.available && !installed.includes(entry.major))
        .map((entry) => ({ major: entry.major, size: entry.size }))
    : [];

  return { installed, downloadable, autoDownload };
}

/**
 * Which Java "Automatic" ends up on, mirroring the node's choice (`MinecraftJavaVersions.choose`
 * plus SM-63's download): the lowest installed runtime inside the version's supported band;
 * failing that, the minimum itself when the node would download it; failing that, the node's
 * last-resort pick among what is installed.
 *
 * @param {{ minimum: number|null, maximum: number|null } | null} requirement
 * @param {ReturnType<typeof javaChoicesFor>} choices
 * @returns {{ major: number, download: boolean, size: number|null } | null} null when the
 *   version's requirement is unknown.
 */
export function resolveAutomaticJava(requirement, choices) {
  const minimum = positiveNumber(requirement?.minimum);

  if (minimum == null) {
    return null;
  }

  const maximum = positiveNumber(requirement?.maximum);
  const installed = choices?.installed || [];
  const inBand = installed.filter(
    (major) => major >= minimum && (maximum == null || major <= maximum),
  );

  if (inBand.length > 0) {
    return { major: Math.min(...inBand), download: false, size: null };
  }

  const download = (choices?.downloadable || []).find((entry) => entry.major === minimum);

  if (download) {
    return { major: minimum, download: true, size: download.size };
  }

  if (maximum != null) {
    const older = installed.filter((major) => major <= maximum);

    if (older.length > 0) {
      return { major: Math.max(...older), download: false, size: null };
    }
  }

  const newer = installed.filter((major) => major >= minimum);

  if (newer.length > 0) {
    return { major: Math.min(...newer), download: false, size: null };
  }

  // Nothing installed can run it and nothing will be downloaded: the node refuses the start, but
  // the number is still the right one to show.
  return { major: minimum, download: false, size: null };
}

/**
 * The Java a software version needs, from the wizard's version resolve
 * (`GET /api/panel/software/:id/versions/:version`): `java: { minimum, maximum }`, or the older
 * `javaMajor` alone. Best effort — null when the version cannot be resolved.
 *
 * @param {string} softwareId catalogue id (lowercase).
 * @param {string} version
 * @returns {Promise<{ minimum: number, maximum: number|null } | null>}
 */
export async function fetchSoftwareJavaRequirement(softwareId, version) {
  const id = text(softwareId).toLowerCase();
  const name = text(version);

  if (!id || !name) {
    return null;
  }

  let body;

  try {
    body = await ApiUtil.get({
      path: `/api/panel/software/${encodeURIComponent(id)}/versions/${encodeURIComponent(name)}`,
      handler: (response) => response,
    });
  } catch {
    return null;
  }

  if (!body || typeof body !== 'object' || body.error) {
    return null;
  }

  const source = body.resolution && typeof body.resolution === 'object' ? body.resolution : body;
  const minimum = positiveNumber(source.java?.minimum ?? source.javaMajor);

  if (minimum == null) {
    return null;
  }

  return { minimum, maximum: positiveNumber(source.java?.maximum) };
}

/**
 * "~50 MB" for a download size, or '' when the node did not say.
 *
 * @param {number|null|undefined} size bytes.
 * @returns {string}
 */
export function javaDownloadSize(size) {
  const bytes = positiveNumber(size);

  return bytes == null ? '' : `~${formatBytes(bytes, 0)}`;
}

/**
 * What deleting a node takes with it (SM-64, §2.4.29): `GET /api/panel/nodes/:id/delete-preview`.
 * `status` is `'unavailable'` on a Pano built before SM-64 and `'error'`/`'network'` when it could
 * not be read — the delete dialog then falls back to what the node row says.
 *
 * @param {number|string} nodeId
 * @returns {Promise<{ status: 'ok'|'unavailable'|'network'|'error', error?: string,
 *   preview: { online: boolean, uninstallSupported: boolean, servers: { id: number, name: string }[],
 *   backupCount: number, backupBytes: number|null, javaRuntimes: number } | null }>}
 */
export async function fetchNodeDeletePreview(nodeId) {
  const body = await ApiUtil.get({
    path: `/api/panel/nodes/${nodeId}/delete-preview`,
    handler: (response) => response,
  });

  if (body === undefined || body === null) {
    return { status: 'network', preview: null };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', preview: null };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error), preview: null };
  }

  const backupBytes = Number(body.backupBytes);

  return {
    status: 'ok',
    preview: {
      online: body.online === true,
      uninstallSupported: body.uninstallSupported !== false,
      servers: (Array.isArray(body.servers) ? body.servers : [])
        .map((server) => ({
          id: Number(server?.id),
          name: String(server?.name ?? server?.customName ?? '').trim(),
        }))
        .filter((server) => Number.isFinite(server.id)),
      backupCount: Math.max(0, Number(body.backupCount) || 0),
      backupBytes: Number.isFinite(backupBytes) ? Math.max(0, backupBytes) : null,
      javaRuntimes: Math.max(0, Number(body.javaRuntimes) || 0),
    },
  };
}

/**
 * The commands (or instructions) a node delete reports for what Pano could not remove itself.
 *
 * @param {unknown} list
 * @returns {string[]}
 */
function normalizeManualSteps(list) {
  return (Array.isArray(list) ? list : []).map((step) => String(step ?? '').trim()).filter(Boolean);
}

/**
 * `POST /api/panel/nodes/:id/delete { currentPassword, force? }` (SM-64). An online node
 * uninstalls itself first, which can take up to two minutes — the request is simply left
 * running (ApiUtil sets no timeout) while `NODE_UNINSTALL` progress arrives over the realtime
 * socket.
 *
 * `NODE_OFFLINE` and `NODE_UNINSTALL_FAILED` come back as `status: 'refused'`: the dialog then
 * offers "Remove from Pano anyway" (`force`). The error body's extras sit at the top level of the
 * response (`Error.encode`), so the node's own error is read from whichever field carries it.
 *
 * @param {number|string} nodeId
 * @param {string} currentPassword
 * @param {boolean} force
 * @returns {Promise<{ status: 'ok'|'refused'|'unavailable'|'network'|'error', error?: string,
 *   detail?: string, removedFiles?: boolean, serversDeleted?: number, manualSteps: string[] }>}
 */
export async function requestNodeDelete(nodeId, currentPassword, force) {
  const body = await ApiUtil.post({
    path: `/api/panel/nodes/${nodeId}/delete`,
    body: force ? { currentPassword, force: true } : { currentPassword },
    handler: (response) => response,
  });

  if (body === undefined || body === null) {
    return { status: 'network', manualSteps: [] };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', manualSteps: [] };
  }

  if (body.error) {
    const error = String(body.error);
    const manualSteps = normalizeManualSteps(body.manualSteps);

    if (error === 'NODE_OFFLINE' || error === 'NODE_UNINSTALL_FAILED') {
      const detail = [body.nodeError, body.reason, body.detail, body.message].find(
        (value) => typeof value === 'string' && value.trim(),
      );

      return { status: 'refused', error, detail: detail ? String(detail) : '', manualSteps };
    }

    return { status: 'error', error, manualSteps };
  }

  return {
    status: 'ok',
    removedFiles: body.removedFiles === true,
    serversDeleted: Math.max(0, Number(body.serversDeleted) || 0),
    manualSteps: normalizeManualSteps(body.manualSteps),
  };
}

/**
 * §2.4.30 — where the Nodes page and the node detail page remember their refresh interval (one
 * key for both: they show the same numbers).
 */
export const NODE_METRICS_INTERVAL_KEY = 'pano.panel.nodes.refresh-interval';

/**
 * The newer of two host-metrics samples by their `t` (a sample without one counts as oldest), so
 * a full `node` frame carrying the hub's cached sample never rolls a live `nodeMetrics` one back.
 *
 * @param {object | null | undefined} a
 * @param {object | null | undefined} b
 * @returns {object | null}
 */
export function newerNodeMetrics(a, b) {
  if (!a) {
    return b || null;
  }

  if (!b) {
    return a;
  }

  return (Number(b.t) || 0) >= (Number(a.t) || 0) ? b : a;
}
