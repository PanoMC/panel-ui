import { error } from '@sveltejs/kit';

/**
 * Usage-mode aware navigation helpers.
 *
 * The platform runs in one of three usage modes (`config.conf` → `usage-mode`, exposed by
 * `/api/siteInfo` and `/api/panel/basicData`). The mode decides which parts of the panel exist at
 * all: absence caused by the mode is permanent, so those items are hidden rather than disabled.
 */

/**
 * @typedef {'WEBSITE' | 'SERVERS' | 'BOTH'} UsageMode
 */

/** @type {Readonly<{ WEBSITE: UsageMode, SERVERS: UsageMode, BOTH: UsageMode }>} */
export const UsageModes = Object.freeze({
  WEBSITE: 'WEBSITE',
  SERVERS: 'SERVERS',
  BOTH: 'BOTH',
});

/** Today's behaviour, and what every install that predates the setting resolves to. */
export const DEFAULT_USAGE_MODE = UsageModes.BOTH;

/**
 * Resolves anything the backend (or an older backend, which sends nothing) may report to a mode
 * this UI understands.
 *
 * @param {unknown} usageMode
 * @returns {UsageMode}
 */
export function normalizeUsageMode(usageMode) {
  if (typeof usageMode !== 'string') {
    return DEFAULT_USAGE_MODE;
  }

  const normalized = usageMode.trim().toUpperCase();

  return normalized === UsageModes.WEBSITE || normalized === UsageModes.SERVERS
    ? normalized
    : DEFAULT_USAGE_MODE;
}

/**
 * Whether a navigation item belongs in the current usage mode.
 *
 * An item opts into a subset of modes with `modes: ['WEBSITE', 'BOTH']`. Items without `modes` —
 * which includes every plugin-injected item (`pano.ui.nav.*.editNavLinks`) — are shown in every
 * mode. This is orthogonal to the permission filter; both have to pass.
 *
 * @param {{ modes?: UsageMode[] }} item
 * @param {unknown} usageMode
 * @returns {boolean}
 */
export function isNavItemVisible(item, usageMode) {
  if (!item || !Array.isArray(item.modes) || item.modes.length === 0) {
    return true;
  }

  return item.modes.includes(normalizeUsageMode(usageMode));
}

/**
 * The sidebar tab actually in effect, which is what `Sidebar` and `Navbar` render from.
 *
 * Both pills are rendered in every mode; what changes is where an install lands by default and
 * whether the servers pill can be reached at all.
 *
 * - `BOTH` and `SERVERS` follow the workspace the current page belongs to, only differing in what
 *   a page that belongs to neither gets: the site workspace for `BOTH`, the servers workspace for
 *   `SERVERS`.
 * - `WEBSITE` pins the site workspace: server management is off, so its pill is disabled.
 * - Without MANAGE_SERVERS there is no servers workspace to switch to in any mode.
 *
 * @param {object} options
 * @param {unknown} options.usageMode
 * @param {boolean} options.canManageServers
 * @param {() => ('website' | 'game' | null | undefined)} [options.getStoredTab] The workspace the
 *   page being opened belongs to, read lazily so it is only worked out when it can matter.
 * @returns {'website' | 'game'}
 */
export function resolveSidebarTab({ usageMode, canManageServers, getStoredTab }) {
  if (!canManageServers) {
    return 'website';
  }

  const mode = normalizeUsageMode(usageMode);

  if (mode === UsageModes.WEBSITE) {
    return 'website';
  }

  const storedTab = typeof getStoredTab === 'function' ? getStoredTab() : null;

  if (mode === UsageModes.SERVERS) {
    return storedTab === 'website' ? 'website' : 'game';
  }

  return storedTab === 'game' ? 'game' : 'website';
}

/**
 * Which workspace a panel path belongs to.
 *
 * The pills follow the page rather than a remembered choice: everything the servers workspace
 * links to lives under `/servers`, so a page outside it is a site page, and switching the sidebar
 * to a menu that cannot reach the page being shown is how the servers menu used to come back on
 * every navigation. It is also the same answer on the server and in the browser, which is what
 * hydration needs.
 *
 * @param {string} pathname
 * @param {string} [basePath] The panel's base path, when it is served under one.
 * @returns {'website' | 'game'}
 */
export function sidebarTabForPath(pathname, basePath = '') {
  const serversRoot = `${basePath}/servers`;
  const path = String(pathname || '');

  return path === serversRoot || path.startsWith(`${serversRoot}/`) ? 'game' : 'website';
}

/**
 * Stops a load for a website-only section (posts, tickets, the theme pages) on a SERVERS install:
 * there is no public website, the backend answers 404 for these endpoints, and the page answers the
 * same instead of rendering around failed requests.
 *
 * @param {unknown} usageMode the root layout's `usageMode`.
 */
export function requireWebsiteSection(usageMode) {
  if (normalizeUsageMode(usageMode) === UsageModes.SERVERS) {
    throw error(404);
  }
}

/**
 * Stops a load for the servers workspace (`/servers` and everything under it, nodes included) on
 * a WEBSITE install: server management is off, the backend answers 404 for its endpoints, and the
 * page answers the same.
 *
 * @param {unknown} usageMode the root layout's `usageMode`.
 */
export function requireServerSection(usageMode) {
  if (normalizeUsageMode(usageMode) === UsageModes.WEBSITE) {
    throw error(404);
  }
}
