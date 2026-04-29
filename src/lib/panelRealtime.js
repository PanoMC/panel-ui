import { get } from 'svelte/store';

import { base } from '$app/paths';

/**
 * SvelteKit `load` functions that call `depends(PANEL_SERVER_LIVE_LOAD_KEY)` re-run when
 * `invalidate(PANEL_SERVER_LIVE_LOAD_KEY)` is called (e.g. after WebSocket server updates).
 */
export const PANEL_SERVER_LIVE_LOAD_KEY = 'pano:panel-server-live';

/** @typedef {(server: object) => void} ServerListener */
/** @typedef {(serverId: number) => void} ServerRemovedListener */
/** @typedef {() => void} PanelNotificationRefreshListener */

const serverListeners = new Set();
const serverRemovedListeners = new Set();
const notificationRefreshListeners = new Set();

let ws;
let wantServersList = false;
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
  return wantServersList || wantServerId != null || wantNotifications;
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
  const sid =
    wantServerId == null || wantServerId === '' || Number.isNaN(Number(wantServerId))
      ? null
      : Number(wantServerId);
  ws.send(
    JSON.stringify({
      subscribeNotifications: !!wantNotifications,
      subscribeServers: !!wantServersList,
      subscribeServerId: sid
    })
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
    if (msg.type === 'server' && msg.server) {
      serverListeners.forEach((fn) => {
        try {
          fn(msg.server);
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
 * Subscribe to live server rows for the servers modal. Ref-count: multiple callers should pair true/false.
 * @param {boolean} active
 */
export function setPanelServersListSubscription(active) {
  wantServersList = !!active;
  updateConnection();
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
  wantServersList = false;
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
