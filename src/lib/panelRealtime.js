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
const RECONNECT_MS = 1000;
/** If the socket never reaches OPEN, show the same splash as failed HTTP (expecting WS). */
const WS_OPEN_DEADLINE_MS = 12000;
let wsConnectWatchdog;
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

function clearWsConnectWatchdog() {
  if (wsConnectWatchdog) {
    clearTimeout(wsConnectWatchdog);
    wsConnectWatchdog = null;
  }
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
  if (!shouldReconnect || typeof window === 'undefined') {
    return;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shouldReconnect && shouldKeepWebSocket()) {
      connect();
    }
  }, RECONNECT_MS);
}

function connect() {
  if (typeof window === 'undefined') {
    return;
  }
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }
  shouldReconnect = true;
  clearWsConnectWatchdog();
  try {
    ws = new WebSocket(buildWsUrl());
  } catch {
    scheduleReconnect();
    return;
  }
  ws.onopen = () => {
    clearWsConnectWatchdog();
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
    clearWsConnectWatchdog();
    ws = null;
    if (shouldReconnect && shouldKeepWebSocket()) {
      scheduleReconnect();
    }
  };
  ws.onerror = () => {
    /* close handler will reconnect */
  };
  clearWsConnectWatchdog();
  wsConnectWatchdog = setTimeout(() => {
    wsConnectWatchdog = null;
    if (typeof window === 'undefined') {
      return;
    }
    if (!shouldReconnect || !shouldKeepWebSocket()) {
      return;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }
    void registerWsBackendUnreachable();
  }, WS_OPEN_DEADLINE_MS);
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
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    clearWsConnectWatchdog();
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
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  clearWsConnectWatchdog();
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
