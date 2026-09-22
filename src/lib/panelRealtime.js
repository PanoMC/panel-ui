import { get, writable } from 'svelte/store';

import { base } from '$app/paths';

/**
 * SvelteKit `load` functions that call `depends(PANEL_SERVER_LIVE_LOAD_KEY)` re-run when
 * `invalidate(PANEL_SERVER_LIVE_LOAD_KEY)` is called (e.g. after WebSocket server updates).
 */
export const PANEL_SERVER_LIVE_LOAD_KEY = 'pano:panel-server-live';

/** @typedef {(server: object) => void} ServerListener */
/** @typedef {(serverId: number) => void} ServerRemovedListener */
/** @typedef {() => void} PanelNotificationRefreshListener */
/** @typedef {{ t: number, l: string, m: string }} ConsoleLine */
/** @typedef {(frame: { serverId: number, lines: ConsoleLine[], dropped: number }) => void} ServerConsoleListener */
/** @typedef {(frame: { serverId: number, streaming: boolean, capable: boolean, source: string|null }) => void} ServerConsoleStateListener */
/** @typedef {(frame: { serverId: number, sample: object | null }) => void} ServerMetricsListener */
/** @typedef {(frame: { serverId: number, players: object[] }) => void} ServerPlayersListener */
/** @typedef {(frame: { serverId: number, plugins: object[]|null }) => void} ServerPluginsListener */
/** @typedef {(frame: { serverId: number }) => void} ServerBackupsListener */
/** @typedef {(frame: { serverId: number }) => void} ServerSchedulesListener */
/**
 * @typedef {(frame: { serverId: number, scheduleId: number|null, ok: boolean,
 *   error: string|null }) => void} ScheduleRunListener
 */
/** @typedef {(frame: { node: object }) => void} NodeListener */
/** @typedef {(frame: { nodeId: number }) => void} NodeRemovedListener */
/**
 * @typedef {(frame: { nodeId: number, metrics: { t: number|null, cpu: number|null,
 *   memUsed: number|null, memTotal: number|null, diskUsed: number|null, diskTotal: number|null,
 *   netRxBps: number|null, netTxBps: number|null } }) => void} NodeMetricsListener
 */
/**
 * @typedef {(frame: { serverId: number, state: string, exitCode: number|null, pid: number|null,
 *   since: number|null, reason: string|null, adopted: boolean|undefined,
 *   stdinAvailable: boolean|undefined, reasonCode: string|null,
 *   javaMajor: number|null }) => void} ServerStateListener
 */
/**
 * @typedef {(frame: { taskId: string, serverId: number|null, nodeId: number|null, kind: string,
 *   status: string, percent: number, message: string, error: string|null, taskUuid?: string|null, startedAt?: number|null }) => void} TaskProgressListener
 */

const serverListeners = new Set();
const serverRemovedListeners = new Set();
const notificationRefreshListeners = new Set();
const serverConsoleListeners = new Set();
const serverConsoleStateListeners = new Set();
const serverMetricsListeners = new Set();
const serverPlayersListeners = new Set();
const serverPluginsListeners = new Set();
const serverBackupsListeners = new Set();
const serverSchedulesListeners = new Set();
const serverActivityListeners = new Set();
const scheduleRunListeners = new Set();
const nodeListeners = new Set();
const nodeRemovedListeners = new Set();
const nodeMetricsListeners = new Set();
const serverStateListeners = new Set();
const taskProgressListeners = new Set();

/** How many tasks the servers overview's "recent tasks" list keeps. */
const RECENT_TASK_LIMIT = 10;

/**
 * The newest `taskProgress` frame per task, newest first, for this browser session only. It is
 * kept here rather than in a page so it survives navigation between the server pages — and it is
 * deliberately not persisted: the point is "what did I just kick off", not an audit trail (that
 * is what the activity log is for).
 *
 * @type {import('svelte/store').Writable<Array<{ taskId: string, serverId: number|null,
 *   kind: string, status: string, percent: number, message: string, error: string|null,
 *   at: number }>>}
 */
export const recentTasks = writable([]);

/**
 * @param {{ taskId: string, serverId: number|null, kind: string, status: string, percent: number,
 *   message: string, error: string|null }} frame
 */
function rememberTask(frame) {
  recentTasks.update((list) =>
    [{ ...frame, at: Date.now() }, ...list.filter((entry) => entry.taskId !== frame.taskId)].slice(
      0,
      RECENT_TASK_LIMIT,
    ),
  );
}
/**
 * Live tokens handed out by [subscribePanelServersList]. The servers-list feed has more than
 * one consumer now (the sidebar server list and the servers modal), so it is reference
 * counted: a boolean would let whichever consumer closed last cut the feed for the others.
 */
const serversListSubscribers = new Set();
/**
 * Same reference counting for the nodes feed (§2.4.3 `subscribeNodes`): the nodes page, the
 * add-node modal and a managed server's header can all want it at the same time. A token can
 * also carry a host-metrics rate and the nodes it is about (§2.4.30, [subscribeNodeMetrics]).
 *
 * @type {Set<{ intervalMs: number|null, nodeIds: number[]|null }>}
 */
const nodesSubscribers = new Set();

/**
 * @param {number|string|null|undefined} value
 * @returns {number|null}
 */
function normalizeServerId(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value);
}

/**
 * A per-server push feed (console, metrics, roster, plugin list). The client frame carries a
 * single server id per feed, so the feed keeps a stack of live tokens instead of a boolean:
 * overlapping subscribers — SvelteKit mounts the next page before the previous one tears down —
 * resolve to the newest, and releasing a token that is no longer on top is harmless.
 *
 * The resolved id is re-sent by [sendConfig] on every (re)connect, so a dropped socket resumes
 * the same feeds without the pages having to notice.
 */
function createServerFeed() {
  /** @type {{ serverId: number, intervalMs?: number | null }[]} */
  let tokens = [];

  return {
    /** @returns {number|null} the id the client frame should carry, or null when idle. */
    current() {
      return tokens.length ? tokens[tokens.length - 1].serverId : null;
    },
    /**
     * §2.4.23 — the rate the newest subscriber asked for, or null when it asked for none (the
     * hub then keeps its default).
     *
     * @returns {number|null}
     */
    currentInterval() {
      return tokens.length ? (tokens[tokens.length - 1].intervalMs ?? null) : null;
    },
    /**
     * @param {number|string} serverId
     * @param {number|null} [intervalMs] how often this subscriber wants a sample.
     * @returns {() => void} release function; calling it twice is a no-op.
     */
    subscribe(serverId, intervalMs = null) {
      const id = normalizeServerId(serverId);

      if (id == null) {
        return () => {};
      }

      const token = { serverId: id, intervalMs: normalizeMetricsInterval(intervalMs) };

      tokens.push(token);
      updateConnection();

      let released = false;

      return () => {
        if (released) {
          return;
        }

        released = true;
        tokens = tokens.filter((entry) => entry !== token);
        updateConnection();
      };
    },
    /**
     * Changes the rate every live subscription to [serverId] asked for, and tells the hub.
     *
     * @param {number|string} serverId
     * @param {number|null} intervalMs
     */
    setInterval(serverId, intervalMs) {
      const id = normalizeServerId(serverId);
      const next = normalizeMetricsInterval(intervalMs);
      let changed = false;

      tokens.forEach((token) => {
        if (token.serverId === id && token.intervalMs !== next) {
          token.intervalMs = next;
          changed = true;
        }
      });

      if (changed) {
        updateConnection();
      }
    },
    reset() {
      tokens = [];
    },
  };
}

/** §2.4.23 — the range the hub accepts for `metricsIntervalMs`. */
export const METRICS_INTERVAL_MIN_MS = 500;
export const METRICS_INTERVAL_MAX_MS = 60000;
/** What the sources report at when nobody asks for anything faster. */
export const METRICS_INTERVAL_DEFAULT_MS = 10000;

/**
 * @param {unknown} value
 * @returns {number|null} a whole number of milliseconds inside the accepted range, or null.
 */
function normalizeMetricsInterval(value) {
  const number = value == null ? Number.NaN : Math.round(Number(value));

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.min(METRICS_INTERVAL_MAX_MS, Math.max(METRICS_INTERVAL_MIN_MS, number));
}

/**
 * A feed over several servers at once (the servers modal's gauges). Every live subscription
 * contributes its ids and its rate; the frame carries the union of the ids and — shared with the
 * single-server metrics feed, since the hub takes one `metricsIntervalMs` — the fastest rate
 * anyone asked for.
 */
function createMultiServerFeed() {
  /** @type {{ serverIds: number[], intervalMs: number | null }[]} */
  let tokens = [];

  return {
    /** @returns {number[]} every id any subscription asked for, deduplicated. */
    currentIds() {
      return [...new Set(tokens.flatMap((token) => token.serverIds))];
    },
    /** @returns {number|null} the fastest rate asked for, or null. */
    currentInterval() {
      const rates = tokens.map((token) => token.intervalMs).filter((value) => value != null);

      return rates.length ? Math.min(...rates) : null;
    },
    /**
     * @param {Array<number|string>} serverIds
     * @param {number|null} [intervalMs]
     * @returns {{ release: () => void, update: (serverIds: Array<number|string>, intervalMs: number|null) => void }}
     */
    subscribe(serverIds, intervalMs = null) {
      const token = {
        serverIds: normalizeIds(serverIds),
        intervalMs: normalizeMetricsInterval(intervalMs),
      };

      tokens.push(token);
      updateConnection();

      let released = false;

      return {
        release() {
          if (released) {
            return;
          }

          released = true;
          tokens = tokens.filter((entry) => entry !== token);
          updateConnection();
        },
        update(nextIds, nextInterval) {
          if (released) {
            return;
          }

          token.serverIds = normalizeIds(nextIds);
          token.intervalMs = normalizeMetricsInterval(nextInterval);
          updateConnection();
        },
      };
    },
    reset() {
      tokens = [];
    },
  };
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function numberOrNull(value) {
  const number = value == null ? Number.NaN : Number(value);

  return Number.isFinite(number) ? number : null;
}

/**
 * A `NODE_METRICS` sample as the hub relays it (`NodeMetricSample`).
 *
 * @param {any} metrics
 */
function normalizeNodeMetrics(metrics) {
  return {
    t: numberOrNull(metrics?.t),
    cpu: numberOrNull(metrics?.cpu),
    memUsed: numberOrNull(metrics?.memUsed),
    memTotal: numberOrNull(metrics?.memTotal),
    diskUsed: numberOrNull(metrics?.diskUsed),
    diskTotal: numberOrNull(metrics?.diskTotal),
    netRxBps: numberOrNull(metrics?.netRxBps),
    netTxBps: numberOrNull(metrics?.netTxBps),
  };
}

/**
 * @param {Array<number|string>} ids
 * @returns {number[]}
 */
function normalizeIds(ids) {
  return [
    ...new Set(
      (Array.isArray(ids) ? ids : []).map((id) => normalizeServerId(id)).filter((id) => id != null),
    ),
  ];
}

/**
 * §2.4.30 — the fastest host-metrics rate any node subscriber asked for, or null (the node's own
 * 10-second default).
 *
 * @returns {number|null}
 */
function currentNodeMetricsInterval() {
  const rates = [...nodesSubscribers]
    .map((token) => token.intervalMs)
    .filter((value) => value != null);

  return rates.length ? Math.min(...rates) : null;
}

/**
 * §2.4.30 — the nodes this session is about, or null for all of them. Only a narrowing when
 * every subscriber named its nodes (the node detail page): one that wants the whole list (the
 * nodes page, the add-node modal) keeps it at "all".
 *
 * @returns {number[]|null}
 */
function currentNodeIds() {
  const tokens = [...nodesSubscribers];

  if (!tokens.length || tokens.some((token) => token.nodeIds == null)) {
    return null;
  }

  return [...new Set(tokens.flatMap((token) => token.nodeIds))];
}

/** The fastest `metricsIntervalMs` any metrics subscriber — single or multi — asked for. */
function currentMetricsInterval() {
  const rates = [
    metricsFeed.current() == null ? null : metricsFeed.currentInterval(),
    multiMetricsFeed.currentIds().length ? multiMetricsFeed.currentInterval() : null,
  ].filter((value) => value != null);

  return rates.length ? Math.min(...rates) : null;
}

const consoleFeed = createServerFeed();
const metricsFeed = createServerFeed();
const multiMetricsFeed = createMultiServerFeed();
const playersFeed = createServerFeed();
const pluginsFeed = createServerFeed();

let ws;
let wantServersList = false;
let wantNodes = false;
let wantServerId = null;
let wantNotifications = false;
let reconnectTimer;
let shouldReconnect = false;
/**
 * Fast retry cadence used while we still have hope (within the first MAX_FAST_RETRIES).
 * Once a connection has reached OPEN, the counter is reset so any later disconnection
 * starts a brand new fast-retry cycle.
 */
const FAST_RECONNECT_MS = 200;
/** Number of fast retries before we hand off to the splash + HTTP recovery flow. */
const MAX_FAST_RETRIES = 3;
let consecutiveFailedAttempts = 0;
/**
 * Latched once the splash is shown. Stops the automatic retry loop so we don't busy-loop
 * (and spam the browser console with "Firefox can't establish a connection..." noise)
 * while the backend is unreachable. Cleared by [nudgePanelRealtimeReconnect] (which is
 * how the splash UI / a successful HTTP probe restarts realtime).
 */
let splashLatched = false;
/** @type {((isRetry?: boolean) => Promise<void>) | null} */
let panelWsRecoveryCallback = null;

function shouldKeepWebSocket() {
  return (
    wantServersList ||
    wantNodes ||
    wantServerId != null ||
    wantNotifications ||
    consoleFeed.current() != null ||
    metricsFeed.current() != null ||
    multiMetricsFeed.currentIds().length > 0 ||
    playersFeed.current() != null ||
    pluginsFeed.current() != null
  );
}

/**
 * @param {Set<Function>} listeners
 * @param {any} payload
 */
function emit(listeners, payload) {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* one bad listener must not stop the others */
    }
  });
}

function buildWsUrl() {
  if (typeof window === 'undefined') return '';
  const withBase = `${base || ''}/api/panel/ws`.replace(/\/+/g, '/');
  const path = withBase.startsWith('/') ? withBase : `/${withBase}`;
  const u = new URL(path, window.location.origin);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return u.toString();
}

function buildSiteInfoProbeUrl() {
  if (typeof window === 'undefined') return '';
  const withBase = `${base || ''}/api/siteInfo`.replace(/\/+/g, '/');
  const path = withBase.startsWith('/') ? withBase : `/${withBase}`;
  return new URL(path, window.location.origin).href;
}

async function registerWsBackendUnreachable() {
  if (typeof window === 'undefined') {
    return;
  }
  const { showNetworkError, networkErrorCallbacks } = await import('$lib/Store.js');
  if (!panelWsRecoveryCallback) {
    panelWsRecoveryCallback = async () => {
      const url = buildSiteInfoProbeUrl();
      const r = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!r.ok) {
        throw new Error('offline');
      }
    };
  }
  if (get(networkErrorCallbacks).includes(panelWsRecoveryCallback)) {
    return;
  }
  showNetworkError(panelWsRecoveryCallback);
}

async function clearWsNetworkErrorIfRegistered() {
  if (!panelWsRecoveryCallback) {
    return;
  }
  const { networkErrorCallbacks } = await import('$lib/Store.js');
  networkErrorCallbacks.update((list) => list.filter((cb) => cb !== panelWsRecoveryCallback));
}

function sendConfig() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(
    JSON.stringify({
      subscribeNotifications: !!wantNotifications,
      subscribeServers: !!wantServersList,
      subscribeNodes: !!wantNodes,
      // §2.4.30 — how often the nodes' host metrics should arrive while this session watches
      // them; absent (null) keeps the node's 10-second default. `subscribeNodeIds` narrows the
      // session to the listed nodes, absent means all of them.
      nodeMetricsIntervalMs: wantNodes ? currentNodeMetricsInterval() : null,
      subscribeNodeIds: wantNodes ? currentNodeIds() : null,
      subscribeServerId: normalizeServerId(wantServerId),
      subscribeConsoleServerId: consoleFeed.current(),
      subscribeMetricsServerId: metricsFeed.current(),
      // The servers modal's gauges: `metrics` frames for every listed server.
      subscribeMetricsServerIds: multiMetricsFeed.currentIds(),
      // §2.4.23 — how often the metrics subscribers want a sample; absent (null) keeps the hub's
      // 10-second default. One rate for both feeds, so the fastest request wins.
      metricsIntervalMs: currentMetricsInterval(),
      subscribePlayersServerId: playersFeed.current(),
      subscribePluginsServerId: pluginsFeed.current(),
    }),
  );
}

function scheduleReconnect() {
  if (!shouldReconnect || splashLatched || typeof window === 'undefined') {
    return;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shouldReconnect && !splashLatched && shouldKeepWebSocket()) {
      connect();
    }
  }, FAST_RECONNECT_MS);
}

function connect() {
  if (typeof window === 'undefined') {
    return;
  }
  if (splashLatched) {
    return;
  }
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }
  shouldReconnect = true;

  // Tracks whether THIS specific attempt ever made it to OPEN; closure-scoped so a late
  // onclose from a previous socket cannot poison the next attempt's bookkeeping.
  let attemptHasOpened = false;

  try {
    ws = new WebSocket(buildWsUrl());
  } catch {
    consecutiveFailedAttempts++;
    if (consecutiveFailedAttempts >= MAX_FAST_RETRIES) {
      latchSplashAndStop();
    } else {
      scheduleReconnect();
    }
    return;
  }
  ws.onopen = () => {
    attemptHasOpened = true;
    consecutiveFailedAttempts = 0;
    void clearWsNetworkErrorIfRegistered();
    sendConfig();
  };
  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      sendConfig();
      return;
    }
    if (msg.type === 'notificationRefresh' || msg.type === 'panelNotificationRefresh') {
      notificationRefreshListeners.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
      return;
    }
    if (msg.type === 'console' && msg.serverId != null) {
      emit(serverConsoleListeners, {
        serverId: Number(msg.serverId),
        lines: Array.isArray(msg.lines) ? msg.lines : [],
        dropped: Number(msg.dropped) || 0,
      });
      return;
    }
    if (msg.type === 'consoleState' && msg.serverId != null) {
      emit(serverConsoleStateListeners, {
        serverId: Number(msg.serverId),
        streaming: !!msg.streaming,
        capable: !!msg.capable,
        // Which end of a managed server the lines are coming from: the node pipes the process'
        // stdout, the plugin taps the game's logger. A build that does not report it sends
        // nothing, and the console simply does not label the stream.
        source:
          msg.source == null ? (msg.src == null ? null : String(msg.src)) : String(msg.source),
      });
      return;
    }
    if (msg.type === 'metrics' && msg.serverId != null) {
      emit(serverMetricsListeners, {
        serverId: Number(msg.serverId),
        sample: msg.sample || null,
      });
      return;
    }
    if (msg.type === 'players' && msg.serverId != null) {
      emit(serverPlayersListeners, {
        serverId: Number(msg.serverId),
        players: Array.isArray(msg.players) ? msg.players : [],
      });
      return;
    }
    if (msg.type === 'plugins' && msg.serverId != null) {
      // §2.4.5: the same frame is a list push (the game re-reported its plugins) and a bare
      // nudge after an install or a removal. `null` is the nudge — the jar list and the
      // restart flag only exist on the REST side, so the page re-reads them.
      emit(serverPluginsListeners, {
        serverId: Number(msg.serverId),
        plugins: Array.isArray(msg.plugins) ? msg.plugins : null,
      });
      return;
    }
    if (msg.type === 'backups' && msg.serverId != null) {
      emit(serverBackupsListeners, { serverId: Number(msg.serverId) });
      return;
    }
    if (msg.type === 'serverActivity' && msg.serverId != null) {
      emit(serverActivityListeners, { serverId: Number(msg.serverId), local: false });
      return;
    }
    if (msg.type === 'schedules' && msg.serverId != null) {
      emit(serverSchedulesListeners, { serverId: Number(msg.serverId) });
      return;
    }
    if (msg.type === 'scheduleRun' && msg.serverId != null) {
      emit(scheduleRunListeners, {
        serverId: Number(msg.serverId),
        scheduleId: msg.scheduleId == null ? null : Number(msg.scheduleId),
        ok: msg.ok !== false,
        error: msg.error == null ? null : String(msg.error),
      });
      return;
    }
    if (msg.type === 'node' && msg.node) {
      emit(nodeListeners, { node: msg.node });
      return;
    }
    if (msg.type === 'nodeMetrics' && msg.nodeId != null && msg.metrics) {
      emit(nodeMetricsListeners, {
        nodeId: Number(msg.nodeId),
        metrics: normalizeNodeMetrics(msg.metrics),
      });
      return;
    }
    if (msg.type === 'nodeRemoved' && msg.nodeId != null) {
      emit(nodeRemovedListeners, { nodeId: Number(msg.nodeId) });
      return;
    }
    if (msg.type === 'serverState' && msg.serverId != null) {
      emit(serverStateListeners, {
        serverId: Number(msg.serverId),
        state: String(msg.state || '').toUpperCase(),
        exitCode: msg.exitCode == null ? null : Number(msg.exitCode),
        pid: msg.pid == null ? null : Number(msg.pid),
        since: msg.since == null ? null : Number(msg.since),
        // The cleaned console line that explains an unexpected stop — a crash mostly, and only
        // for as long as this page is open: Pano does not store it anywhere.
        reason: msg.reason == null ? null : String(msg.reason),
        // §2.4.16 — a process the node picked back up after its own restart, and whether it
        // still owns that process's stdin. A Pano built before SM-51 sends neither, which is
        // `undefined` rather than `false`: "not reported" is not "no".
        adopted: msg.adopted == null ? undefined : msg.adopted === true,
        stdinAvailable: msg.stdinAvailable == null ? undefined : msg.stdinAvailable === true,
        // §2.4.28 — a start that failed for want of a Java runtime says so in a word, and names
        // the major, so the overview can offer to download it.
        reasonCode: msg.reasonCode == null ? null : String(msg.reasonCode).toUpperCase(),
        javaMajor:
          Number.isFinite(Number(msg.javaMajor)) && msg.javaMajor != null
            ? Number(msg.javaMajor)
            : null,
      });
      return;
    }
    if (msg.type === 'taskProgress' && msg.taskId != null) {
      rememberTask({
        taskId: String(msg.taskId),
        serverId: msg.serverId == null ? null : Number(msg.serverId),
        kind: String(msg.kind || '').toUpperCase(),
        status: String(msg.status || '').toUpperCase(),
        percent: Number.isFinite(Number(msg.percent)) ? Number(msg.percent) : 0,
        message: msg.message == null ? '' : String(msg.message),
        error: msg.error == null ? null : String(msg.error),
      });
      emit(taskProgressListeners, {
        taskId: String(msg.taskId),
        serverId: msg.serverId == null ? null : Number(msg.serverId),
        // Node-scoped tasks (`NODE_UNINSTALL`, Java downloads) carry no server; null when absent.
        nodeId: msg.nodeId == null ? null : Number(msg.nodeId),
        kind: String(msg.kind || '').toUpperCase(),
        status: String(msg.status || '').toUpperCase(),
        percent: Number.isFinite(Number(msg.percent)) ? Number(msg.percent) : 0,
        message: msg.message == null ? '' : String(msg.message),
        error: msg.error == null ? null : String(msg.error),
        // SM-68 — what the server JSON's `activeTask` is keyed and ordered by.
        taskUuid: msg.taskUuid == null ? null : String(msg.taskUuid),
        startedAt: Number.isFinite(Number(msg.task?.createdAt)) ? Number(msg.task.createdAt) : null,
        // SM-77 — a Pano plugin update, which the server header names as such. Pano may flag the
        // frame itself or only the row riding along under `task`.
        panoPluginUpdate: msg.panoPluginUpdate === true || msg.task?.panoPluginUpdate === true,
      });
      return;
    }
    if (msg.type === 'server' && msg.server) {
      // §2.4.17 — the frame carries the whole `features` map whenever an input changed (the
      // plugin connected, the process stopped, the node said hello). Listeners merge the row
      // one level deep, so a `features` on the frame replaces the cached one outright, which is
      // what it must do: a source that went away is an absent key, and keeping the old object's
      // keys alive would leave a control enabled that nothing can serve any more. A frame
      // without `features` (an older backend) leaves whatever the row had alone.
      const row =
        msg.server.features && typeof msg.server.features === 'object'
          ? { ...msg.server, features: { ...msg.server.features } }
          : msg.server;

      serverListeners.forEach((fn) => {
        try {
          fn(row);
        } catch {
          /* ignore */
        }
      });
    }
    if (msg.type === 'serverRemoved' && msg.serverId != null) {
      serverRemovedListeners.forEach((fn) => {
        try {
          fn(msg.serverId);
        } catch {
          /* ignore */
        }
      });
    }
  };
  ws.onclose = () => {
    const wasOpen = attemptHasOpened;
    ws = null;
    if (!shouldReconnect || !shouldKeepWebSocket()) {
      return;
    }
    if (wasOpen) {
      // We had a healthy session; treat the next series as a fresh fast-retry cycle.
      consecutiveFailedAttempts = 0;
      scheduleReconnect();
      return;
    }
    consecutiveFailedAttempts++;
    if (consecutiveFailedAttempts >= MAX_FAST_RETRIES) {
      // Three consecutive failures — give up the busy retry, hand off to splash. After
      // this point the only way back into the loop is via [nudgePanelRealtimeReconnect],
      // which the splash UI / a successful HTTP probe call when the user retries.
      latchSplashAndStop();
      return;
    }
    scheduleReconnect();
  };
  ws.onerror = () => {
    /* close handler will reconnect */
  };
}

function latchSplashAndStop() {
  splashLatched = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  void registerWsBackendUnreachable();
}

function updateConnection() {
  if (typeof window === 'undefined') {
    return;
  }
  if (shouldKeepWebSocket()) {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      connect();
    } else if (ws.readyState === WebSocket.OPEN) {
      sendConfig();
    }
  } else {
    shouldReconnect = false;
    splashLatched = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    consecutiveFailedAttempts = 0;
    void clearWsNetworkErrorIfRegistered();
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
    }
  }
}

/**
 * Panel layout: request WebSocket nudges when new panel notifications are created. Pair with `false` on unmount.
 * @param {boolean} active
 */
export function setPanelNotificationsSubscription(active) {
  wantNotifications = !!active;
  updateConnection();
}

/**
 * Subscribe to live rows for every server (sidebar list, `/servers` overview, servers modal).
 * The feed stays open until every subscriber has released its token.
 *
 * @returns {() => void} release function; calling it twice is a no-op.
 */
export function subscribePanelServersList() {
  const token = {};
  serversListSubscribers.add(token);
  wantServersList = true;
  updateConnection();

  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    serversListSubscribers.delete(token);
    wantServersList = serversListSubscribers.size > 0;
    updateConnection();
  };
}

/**
 * Subscribe to the node feed (§2.4.3): `node` frames on every node change (status, metrics,
 * resources) and `nodeRemoved` when one is deleted. Reference counted like the servers list.
 *
 * @returns {() => void} release function; calling it twice is a no-op.
 */
export function subscribeNodes() {
  return subscribeNodeMetrics(null).release;
}

/**
 * [subscribeNodes] plus a host-metrics rate (§2.4.30): while this subscription lives the hub asks
 * the nodes to report `NODE_METRICS` at [intervalMs] and pushes each sample as a `nodeMetrics`
 * frame ([onNodeMetrics]). [nodeIds] limits it to those nodes — the node detail page watches one.
 *
 * @param {number|null} intervalMs 500–60000; null keeps the node's default.
 * @param {Array<number|string>|null} [nodeIds] null for every node.
 * @returns {{ release: () => void, update: (intervalMs: number|null, nodeIds?: Array<number|string>|null) => void }}
 *   `update` changes the rate (or the nodes) in place and re-sends the subscription.
 */
export function subscribeNodeMetrics(intervalMs, nodeIds = null) {
  const token = {
    intervalMs: normalizeMetricsInterval(intervalMs),
    nodeIds: nodeIds == null ? null : normalizeIds(nodeIds),
  };

  nodesSubscribers.add(token);
  wantNodes = true;
  updateConnection();

  let released = false;

  return {
    release() {
      if (released) {
        return;
      }

      released = true;
      nodesSubscribers.delete(token);
      wantNodes = nodesSubscribers.size > 0;
      updateConnection();
    },
    update(nextInterval, nextIds = token.nodeIds) {
      if (released) {
        return;
      }

      token.intervalMs = normalizeMetricsInterval(nextInterval);
      token.nodeIds = nextIds == null ? null : normalizeIds(nextIds);
      updateConnection();
    },
  };
}

/**
 * When set, receive pushes for that server (player count, online/offline, etc.). Pass null to stop.
 * @param {number | null} serverId
 */
export function setPanelSelectedServerSubscription(serverId) {
  if (serverId == null || serverId === '' || Number.isNaN(Number(serverId))) {
    wantServerId = null;
  } else {
    wantServerId = Number(serverId);
  }
  updateConnection();
}

/**
 * Stream the live console of one server. The hub answers with a `consoleState` frame (which is
 * the authoritative streaming/capable state — the subscribe is permission-checked server-side
 * and therefore asynchronous) and then `console` frames as lines arrive.
 *
 * @param {number|string} serverId
 * @returns {() => void} release function; calling it twice is a no-op.
 */
export function subscribeServerConsole(serverId) {
  return consoleFeed.subscribe(serverId);
}

/**
 * Receive the metrics sample of one server (TPS, MSPT, memory, CPU, players) — every 10 s by
 * default, or as often as [intervalMs] asks while this subscription lives (§2.4.23: the hub asks
 * the node or plugin to report faster only while someone is watching).
 *
 * @param {number|string} serverId
 * @param {number|null} [intervalMs] 500–60000; null keeps the default.
 * @returns {() => void} release function; calling it twice is a no-op.
 */
export function subscribeServerMetrics(serverId, intervalMs = null) {
  return metricsFeed.subscribe(serverId, intervalMs);
}

/**
 * Receive the metrics samples of several servers at once — the servers modal's gauges. The same
 * `onServerMetrics` listeners get the frames, one per server id.
 *
 * @param {Array<number|string>} serverIds
 * @param {number|null} [intervalMs] 500–60000; null keeps the default.
 * @returns {{ release: () => void, update: (serverIds: Array<number|string>, intervalMs: number|null) => void }}
 *   `update` changes the ids or the rate in place and re-sends the subscription.
 */
export function subscribeServersMetrics(serverIds, intervalMs = null) {
  return multiMetricsFeed.subscribe(serverIds, intervalMs);
}

/**
 * Changes the sample rate of a live metrics subscription (§2.4.23) without resubscribing.
 *
 * @param {number|string} serverId
 * @param {number|null} intervalMs 500–60000; null goes back to the default.
 */
export function setServerMetricsInterval(serverId, intervalMs) {
  metricsFeed.setInterval(serverId, intervalMs);
}

/**
 * Receive roster pushes for one server. Separate from the metrics feed: the hub gates it on
 * `MANAGE_SERVER_PLAYERS`, so a metrics subscriber does not get the roster for free.
 *
 * @param {number|string} serverId
 * @returns {() => void} release function; calling it twice is a no-op.
 */
export function subscribeServerPlayers(serverId) {
  return playersFeed.subscribe(serverId);
}

/**
 * Receive installed-plugin pushes for one server (gated on `MANAGE_SERVER_PLUGINS`). A frame
 * whose `plugins` is null is the install/remove nudge, not an empty server.
 *
 * @param {number|string} serverId
 * @returns {() => void} release function; calling it twice is a no-op.
 */
export function subscribeServerPlugins(serverId) {
  return pluginsFeed.subscribe(serverId);
}

/**
 * A batch of console lines. `dropped` is the count for *this* batch (the REST hydrate carries
 * the cumulative total instead).
 *
 * @param {ServerConsoleListener} fn
 * @returns {() => void}
 */
export function onServerConsole(fn) {
  serverConsoleListeners.add(fn);
  return () => serverConsoleListeners.delete(fn);
}

/**
 * @param {ServerConsoleStateListener} fn
 * @returns {() => void}
 */
export function onServerConsoleState(fn) {
  serverConsoleStateListeners.add(fn);
  return () => serverConsoleStateListeners.delete(fn);
}

/**
 * @param {ServerMetricsListener} fn
 * @returns {() => void}
 */
export function onServerMetrics(fn) {
  serverMetricsListeners.add(fn);
  return () => serverMetricsListeners.delete(fn);
}

/**
 * @param {ServerPlayersListener} fn
 * @returns {() => void}
 */
export function onServerPlayers(fn) {
  serverPlayersListeners.add(fn);
  return () => serverPlayersListeners.delete(fn);
}

/**
 * @param {ServerPluginsListener} fn
 * @returns {() => void}
 */
export function onServerPlugins(fn) {
  serverPluginsListeners.add(fn);
  return () => serverPluginsListeners.delete(fn);
}

/**
 * The backup list of one server changed (§2.4.4): a backup finished, was restored or was
 * deleted. The frame is a nudge — it carries no rows, so the page re-reads `GET …/backups`.
 * Pushed to the subscribers of that server, which `ServerDetailLayout` already holds open.
 *
 * @param {ServerBackupsListener} fn
 * @returns {() => void}
 */
export function onServerBackupsChanged(fn) {
  serverBackupsListeners.add(fn);
  return () => serverBackupsListeners.delete(fn);
}

/**
 * The schedules of one server changed (§2.4.6): one was added, edited, toggled or deleted —
 * by this admin or another one. Like the backups frame it is a nudge with no rows, so the page
 * re-reads `GET …/schedules`.
 *
 * @param {ServerSchedulesListener} fn
 * @returns {() => void}
 */
export function onServerSchedulesChanged(fn) {
  serverSchedulesListeners.add(fn);
  return () => serverSchedulesListeners.delete(fn);
}

/**
 * A new entry was written to a server's activity log (the hub's `serverActivity` frame), or —
 * `local: true` — this tab just did something that writes one (a power action, a console
 * command), which is the only cue an older backend without the frame gives.
 *
 * @param {(frame: { serverId: number, local: boolean }) => void} fn
 * @returns {() => void}
 */
export function onServerActivity(fn) {
  serverActivityListeners.add(fn);
  return () => serverActivityListeners.delete(fn);
}

/**
 * Tells this tab's listeners that it just caused an activity-log entry for [serverId] — the
 * fallback for a backend that does not push `serverActivity` frames yet.
 *
 * @param {number|string} serverId
 */
export function notifyLocalServerActivity(serverId) {
  const id = normalizeServerId(serverId);

  if (id != null) {
    emit(serverActivityListeners, { serverId: id, local: true });
  }
}

/**
 * A schedule finished a run (§2.4.6), reported by the node for a managed server and by Pano's
 * own runner for a linked one. `ok` is false when a task failed, and `error` carries the code.
 *
 * @param {ScheduleRunListener} fn
 * @returns {() => void}
 */
export function onScheduleRun(fn) {
  scheduleRunListeners.add(fn);
  return () => scheduleRunListeners.delete(fn);
}

/**
 * A node row changed (paired, approved, went online/offline, new metrics). Needs
 * [subscribeNodes].
 *
 * @param {NodeListener} fn
 * @returns {() => void}
 */
export function onNode(fn) {
  nodeListeners.add(fn);
  return () => nodeListeners.delete(fn);
}

/**
 * One host-metrics sample of a node (§2.4.30 `nodeMetrics`), pushed as the node reports it — at
 * the rate a [subscribeNodeMetrics] subscriber asked for. The full `node` frame still carries
 * state changes.
 *
 * @param {NodeMetricsListener} fn
 * @returns {() => void}
 */
export function onNodeMetrics(fn) {
  nodeMetricsListeners.add(fn);
  return () => nodeMetricsListeners.delete(fn);
}

/**
 * A node was deleted. Needs [subscribeNodes].
 *
 * @param {NodeRemovedListener} fn
 * @returns {() => void}
 */
export function onNodeRemoved(fn) {
  nodeRemovedListeners.add(fn);
  return () => nodeRemovedListeners.delete(fn);
}

/**
 * The process state of a managed server changed (STOPPED/STARTING/RUNNING/STOPPING/CRASHED/
 * INSTALLING). Pushed to the subscribers of that server.
 *
 * @param {ServerStateListener} fn
 * @returns {() => void}
 */
export function onServerState(fn) {
  serverStateListeners.add(fn);
  return () => serverStateListeners.delete(fn);
}

/**
 * Progress of a long node task (install, reinstall, delete, backup...). Pushed to the user who
 * started it and to the node subscribers, and — for a task on a server, at most twice a second —
 * to the servers list and to a page on that server (SM-68).
 *
 * @param {TaskProgressListener} fn
 * @returns {() => void}
 */
export function onTaskProgress(fn) {
  taskProgressListeners.add(fn);
  return () => taskProgressListeners.delete(fn);
}

/**
 * @param {ServerListener} fn
 * @returns {() => void}
 */
export function onPanelServerUpdate(fn) {
  serverListeners.add(fn);
  return () => serverListeners.delete(fn);
}

/**
 * @param {ServerRemovedListener} fn
 * @returns {() => void}
 */
export function onPanelServerRemoved(fn) {
  serverRemovedListeners.add(fn);
  return () => serverRemovedListeners.delete(fn);
}

/**
 * Fired when the server signals new panel notification(s); re-fetch over HTTP.
 * @param {PanelNotificationRefreshListener} fn
 * @returns {() => void}
 */
export function onPanelNotificationRefresh(fn) {
  notificationRefreshListeners.add(fn);
  return () => notificationRefreshListeners.delete(fn);
}

/** Drop all listeners and close the socket (e.g. full logout / teardown). */
export function teardownPanelRealtime() {
  serverListeners.clear();
  serverRemovedListeners.clear();
  notificationRefreshListeners.clear();
  serverConsoleListeners.clear();
  serverConsoleStateListeners.clear();
  serverMetricsListeners.clear();
  serverPlayersListeners.clear();
  serverPluginsListeners.clear();
  serverBackupsListeners.clear();
  serverSchedulesListeners.clear();
  serverActivityListeners.clear();
  scheduleRunListeners.clear();
  nodeListeners.clear();
  nodeRemovedListeners.clear();
  nodeMetricsListeners.clear();
  serverStateListeners.clear();
  taskProgressListeners.clear();
  recentTasks.set([]);
  serversListSubscribers.clear();
  nodesSubscribers.clear();
  consoleFeed.reset();
  metricsFeed.reset();
  multiMetricsFeed.reset();
  playersFeed.reset();
  pluginsFeed.reset();
  wantServersList = false;
  wantNodes = false;
  wantServerId = null;
  wantNotifications = false;
  shouldReconnect = false;
  splashLatched = false;
  consecutiveFailedAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  void clearWsNetworkErrorIfRegistered();
  if (ws) {
    try {
      stripWebSocketHandlers(ws);
      ws.close();
    } catch {
      /* ignore */
    }
    ws = null;
  }
}

function stripWebSocketHandlers(socket) {
  if (!socket) {
    return;
  }
  try {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  } catch {
    /* ignore */
  }
}

/**
 * After HTTP recovers (e.g. splash "Retry" / notification fetch works again), force a fresh
 * WebSocket if we still want server push. Otherwise the panel can stay on a dead or stuck
 * connection until a full page reload.
 */
export function nudgePanelRealtimeReconnect() {
  if (typeof window === 'undefined') {
    return;
  }
  if (!shouldKeepWebSocket()) {
    return;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  // Recovery flows (HTTP probe succeeded, user hit "Retry"...) lift the splash latch
  // and restart the retry budget so we get another fast-retry burst.
  splashLatched = false;
  consecutiveFailedAttempts = 0;
  shouldReconnect = true;
  const oldWs = ws;
  if (oldWs) {
    try {
      stripWebSocketHandlers(oldWs);
      oldWs.close();
    } catch {
      /* ignore */
    }
  }
  ws = null;
  connect();
}
