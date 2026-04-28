import { base } from '$app/paths';

/**
 * SvelteKit `load` functions that call `depends(PANEL_SERVER_LIVE_LOAD_KEY)` re-run when
 * `invalidate(PANEL_SERVER_LIVE_LOAD_KEY)` is called (e.g. after WebSocket server updates).
 */
export const PANEL_SERVER_LIVE_LOAD_KEY = 'pano:panel-server-live';

/** @typedef {(server: object) => void} ServerListener */
/** @typedef {(serverId: number) => void} ServerRemovedListener */

const serverListeners = new Set();
const serverRemovedListeners = new Set();

let ws;
let wantServersList = false;
let wantServerId = null;
let reconnectTimer;
let shouldReconnect = false;
const RECONNECT_MS = 4000;

function buildWsUrl() {
  if (typeof window === 'undefined') return '';
  const withBase = `${base || ''}/api/panel/ws`.replace(/\/+/g, '/');
  const path = withBase.startsWith('/') ? withBase : `/${withBase}`;
  const u = new URL(path, window.location.origin);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return u.toString();
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
    if (shouldReconnect && (wantServersList || wantServerId != null)) {
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
  try {
    ws = new WebSocket(buildWsUrl());
  } catch {
    scheduleReconnect();
    return;
  }
  ws.onopen = () => {
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
    ws = null;
    if (shouldReconnect && (wantServersList || wantServerId != null)) {
      scheduleReconnect();
    }
  };
  ws.onerror = () => {
    /* close handler will reconnect */
  };
}

function updateConnection() {
  if (typeof window === 'undefined') {
    return;
  }
  if (wantServersList || wantServerId != null) {
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

/** Drop all listeners and close the socket (e.g. full logout / teardown). */
export function teardownPanelRealtime() {
  serverListeners.clear();
  serverRemovedListeners.clear();
  wantServersList = false;
  wantServerId = null;
  shouldReconnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
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
  if (!wantServersList && wantServerId == null) {
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
