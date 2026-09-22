<style>
  .nav .nav-link {
    color: rgba(255, 255, 255, 0.65);
  }

  .nav .nav-link:hover {
    color: var(--bs-body-color) !important;
  }

  .nav .nav-link.active {
    color: var(--bs-body-color) !important;
    font-weight: 600;
  }
</style>

<div data-bs-theme="dark">
  <!-- Which servers exist is the servers modal's job; the sidebar shows the sections of the
       server in hand, and its name is already in the navbar beside the switcher. A section
       nothing can serve at this moment is still listed: its page opens with the controls off
       and says why. -->
  {#if currentServer}
    <ul class="nav flex-column">
      {#each $serverNavigationItems as item (item.href)}
        {#if isServerNavItemVisible(item, currentServer, $usageMode)}
          <li class="nav-item">
            <a
              class="nav-link text-truncate"
              href={serverItemHref(item, currentServer.id)}
              class:active={matching(
                $page.url.pathname,
                serverItemHref(item, currentServer.id),
                item.startsWith,
              )}>
              <i class="{item.icon} fa-fw me-2"></i>
              {$_(item.text)}
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</div>

<script context="module">
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { isNavItemVisible } from '$lib/navigation.util.js';
  import {
    featureSource,
    hasFeature,
    isFeatureNotSupported,
    isManaged,
  } from '$lib/servers.util.js';

  /**
   * The sections an older backend hides outright: a linked server has no node to list its files
   * or zip its directory, and a plugin that predates SM-47 cannot do it from the inside either.
   */
  const NODE_BOUND_FEATURES = ['files.source', 'backups.create'];

  /**
   * Sections of the server named by `/servers/[id]`, rendered under the server list.
   *
   * Plugins add their own through `pano.ui.nav.server.editNavLinks`. An item is
   * `{ href, icon, text, startsWith?, permission?, feature?, modes? }`:
   *
   * - `href` is relative to the server, so `/console` renders as `/servers/<id>/console` and
   *   `''` is the server overview itself;
   * - `permission` is a `Permissions` key the signed-in user must hold;
   * - `feature` is a `features` path (§2.4.17) the section lives on — `console.stream`,
   *   `players.list`, ... The panel no longer asks whether a server is managed or which
   *   capability its plugin announced: Pano resolves who can serve each feature and the item
   *   follows that answer;
   * - `managedOnly` is the flag `feature` replaced. Only honoured for items a plugin
   *   registered, so a plugin built against the old shape keeps gating the way it meant to.
   */
  export const originalServerNavItems = [
    {
      href: '',
      icon: 'fas fa-table-columns',
      text: 'components.server-navigation-menu.overview',
      startsWith: false,
    },
    {
      href: '/console',
      icon: 'fas fa-terminal',
      text: 'components.server-navigation-menu.console',
      startsWith: true,
      permission: Permissions.MANAGE_SERVER_CONSOLE,
      feature: 'console.stream',
    },
    {
      href: '/players',
      icon: 'fas fa-users',
      text: 'components.server-navigation-menu.players',
      startsWith: true,
      permission: Permissions.MANAGE_SERVER_PLAYERS,
      feature: 'players.list',
    },
    {
      href: '/files',
      icon: 'fas fa-folder-open',
      text: 'components.server-navigation-menu.files',
      startsWith: true,
      permission: Permissions.MANAGE_SERVER_FILES,
      feature: 'files.source',
    },
    {
      href: '/plugins',
      icon: 'fas fa-puzzle-piece',
      text: 'components.server-navigation-menu.plugins',
      startsWith: true,
      permission: Permissions.MANAGE_SERVER_PLUGINS,
      feature: 'plugins.list',
    },
    {
      href: '/backups',
      icon: 'fas fa-box-archive',
      text: 'components.server-navigation-menu.backups',
      startsWith: true,
      permission: Permissions.MANAGE_SERVER_BACKUPS,
      feature: 'backups.create',
    },
    {
      href: '/schedules',
      icon: 'fas fa-clock',
      text: 'components.server-navigation-menu.schedules',
      startsWith: true,
      permission: Permissions.MANAGE_SERVER_SCHEDULES,
      feature: 'schedules.runner',
    },
    {
      href: '/settings',
      icon: 'fas fa-cog',
      text: 'components.server-navigation-menu.settings',
      startsWith: true,
    },
  ];

  /**
   * Sections a server can never serve are hidden; a section whose source is merely away right
   * now (the node is offline, the process is stopped) keeps its link, because the page says so
   * far better than an entry that silently disappears (decided 2026-09-21).
   *
   * @param {{ permission?: string, feature?: string, modes?: string[], managedOnly?: boolean }} item
   * @param {object | null} server
   * @param {unknown} usageMode
   * @returns {boolean}
   */
  export function isServerNavItemVisible(item, server, usageMode) {
    if (!isNavItemVisible(item, usageMode)) {
      return false;
    }

    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }

    if (!item.feature) {
      // A plugin's own item, gated the way plugins could gate one before §2.4.17.
      return !item.managedOnly || isManaged(server);
    }

    // What the software itself can never do (plugins on Vanilla) is a permanent absence, and a
    // permanent absence is hidden (§6); a hand-typed URL still opens the page and its notice.
    if (isFeatureNotSupported(server, item.feature)) {
      return false;
    }

    if (hasFeature(server, item.feature)) {
      return true;
    }

    // `null` is Pano saying "nobody can do this at this moment" — the link stays.
    if (featureSource(server, item.feature) === null) {
      return true;
    }

    // `undefined`: a backend with no `features` at all. Today's rule, unchanged — only the two
    // sections that need something behind the server are hidden, and only when nothing there
    // could ever serve them.
    return !NODE_BOUND_FEATURES.includes(item.feature);
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { page } from '$app/stores';

  import { activeServer } from '$lib/servers.util.js';
  import { serverNavigationItems } from '$lib/PluginAPI.js';

  const usageMode = getContext('usageMode');

  const selectedServer = getContext('selectedServer');

  // The server the URL points at. `page.data.server` is what `ServerDetailLayout` loaded, so it
  // is right during SSR too; the `activeServer` store is the same row kept live by the realtime
  // feed, and only exists in the browser. Off a server's own pages -- the nodes page, say -- the
  // switcher's server stands in, so leaving a server does not empty the menu that leads back to
  // it; the navbar picks its server exactly the same way.
  $: routeServer = $page.data?.server ?? null;
  $: currentServer =
    ($activeServer && routeServer && Number($activeServer.id) === Number(routeServer.id)
      ? $activeServer
      : routeServer) ?? $selectedServer;

  /**
   * @param {{ href: string }} item
   * @param {number | string} serverId
   */
  function serverItemHref(item, serverId) {
    return `${base}/servers/${serverId}${item.href || ''}`;
  }

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + '/').toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
