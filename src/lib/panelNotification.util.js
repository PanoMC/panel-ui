import { get, writable } from 'svelte/store';

import { base } from '$app/paths';

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
 * The ids of the servers the panel has seen a row of and knows to have no icon. Their icon
 * endpoint answers 404, so the image is not asked for at all. Only ever written in the browser
 * (a module-level store is shared by every SSR render).
 *
 * @type {import('svelte/store').Writable<Set<number>>}
 */
export const serversWithoutIcon = writable(new Set());

/**
 * Notes whether a server row carries an icon (`favicon`). Call it with any row the panel loads
 * or receives; a row without a `favicon` key at all says nothing and is ignored.
 *
 * @param {{ id?: number | string, favicon?: string | null } | null | undefined} server
 */
export function rememberServerIcon(server) {
  if (typeof window === 'undefined' || !server || !('favicon' in server)) {
    return;
  }

  const id = Number(server.id);

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const iconless = !String(server.favicon || '').trim();

  if (get(serversWithoutIcon).has(id) === iconless) {
    return;
  }

  serversWithoutIcon.update((ids) => {
    const next = new Set(ids);

    if (iconless) {
      next.add(id);
    } else {
      next.delete(id);
    }

    return next;
  });
}

/**
 * The icon of the server a notification is about, served by id, or '' when it is about no one
 * server. A server known to have no icon gets the default one straight away; for one the panel
 * has not seen, a 404 is what {@link imageFallback} turns into the default server icon.
 *
 * @param {{ type?: string, details?: Record<string, unknown> } | null | undefined} n
 * @param {Set<number>} [iconless] `$serversWithoutIcon`, passed in so a template follows it.
 * @returns {string}
 */
export function panelNotificationServerIcon(n, iconless = get(serversWithoutIcon)) {
  if (!n || !SERVER_NOTIFICATION_TYPES.includes(String(n.type || ''))) {
    return '';
  }

  const id = Number(n.details?.serverId ?? n.details?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return '';
  }

  return iconless.has(id) ? `${base}/assets/img/server-icon.png` : `/api/panel/servers/${id}/icon`;
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
