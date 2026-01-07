import { get } from 'svelte/store';
import { page } from '$app/stores';

export const Permissions = Object.freeze({
  ACCESS_PANEL: 'ACCESS_PANEL',
  MANAGE_SERVERS: 'MANAGE_SERVERS',
  MANAGE_POSTS: 'MANAGE_POSTS',
  MANAGE_TICKETS: 'MANAGE_TICKETS',
  MANAGE_PLAYERS: 'MANAGE_PLAYERS',
  MANAGE_VIEW: 'MANAGE_VIEW',
  MANAGE_ADDONS: 'MANAGE_ADDONS',
  MANAGE_PLATFORM_SETTINGS: 'MANAGE_PLATFORM_SETTINGS',
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
    if (lower.startsWith('pano.panel.')) {
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
