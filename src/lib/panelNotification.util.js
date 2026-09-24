/**
 * panel-ui quick + full list; because the API / theme may return a different shape.
 * @param { { status?: string | { name?: string } } } n
 * @returns { boolean }
 */
export function isPanelNotificationUnread(n) {
  const s = n?.status;
  if (s === 'NOT_READ') {
    return true;
  }
  if (typeof s === 'string' && s.toUpperCase() === 'NOT_READ') {
    return true;
  }
  if (s && typeof s === 'object' && s.name != null) {
    return String(s.name).toUpperCase() === 'NOT_READ';
  }
  return false;
}

/**
 * The notifications about one server (the server alerts and plugin updates). They carry the
 * server's id as `serverId` or, like the older ones, as plain `id`.
 */
const SERVER_NOTIFICATION_TYPES = Object.freeze([
  'SERVER_CRASHED',
  'BACKUP_FAILED',
  'TPS_LOW',
  'SCHEDULE_FAILED',
  'PLUGIN_UPDATES',
]);

/**
 * The icon of the server a notification is about, served by id, or '' when it is about no one
 * server. A server without an icon answers 404, which {@link imageFallback} turns into the
 * default server icon.
 *
 * @param {{ type?: string, details?: Record<string, unknown> } | null | undefined} n
 * @returns {string}
 */
export function panelNotificationServerIcon(n) {
  if (!n || !SERVER_NOTIFICATION_TYPES.includes(String(n.type || ''))) {
    return '';
  }

  const id = Number(n.details?.serverId ?? n.details?.id);

  return Number.isInteger(id) && id > 0 ? `/api/panel/servers/${id}/icon` : '';
}

/**
 * Swaps an image that failed to load for `src`, once. Also covers an image that already failed
 * before this ran, as a server-rendered one can before the page hydrates.
 *
 * @param {HTMLImageElement} node
 * @param {string} src
 */
export function imageFallback(node, src) {
  let fallback = src;

  const onError = () => {
    if (!fallback || node.dataset.fallback === 'true') {
      return;
    }

    node.dataset.fallback = 'true';
    node.src = fallback;
  };

  node.addEventListener('error', onError);

  if (node.complete && node.naturalWidth === 0 && node.getAttribute('src')) {
    onError();
  }

  return {
    /** @param {string} next */
    update(next) {
      fallback = next;
    },
    destroy() {
      node.removeEventListener('error', onError);
    },
  };
}
