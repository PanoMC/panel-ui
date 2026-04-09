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

<ul class="nav flex-column" data-bs-theme="dark">
  {#each $siteNavigationItems as item}
    {#if !item.permission || hasPermission(item.permission)}
      <li class="nav-item">
        <a
          class="nav-link text-truncate"
          href={base + item.href}
          class:active={matching($page.url.pathname, base + item.href, item.startsWith)}>
          {#if item.hasUpdate}
            <span class="position-relative" class:pe-2={$session.basicData.hasUpdate}>
              <i class="{item.icon} me-2"></i>
              {$_(item.text)}
              {#if $session.basicData.hasUpdate}
                <span class="position-absolute bg-warning rounded-circle p-1 top-0 end-0"> </span>
              {/if}
            </span>
          {:else}
            <i class="{item.icon} me-2"></i>
            {$_(item.text)}
          {/if}
        </a>
      </li>
    {/if}
  {/each}
</ul>

<script context="module">
  import { Permissions } from '$lib/auth.util.js';

  export const originalSiteNavItems = [
    {
      href: '/',
      icon: 'fas fa-table-columns',
      text: 'components.site-navigation-menu.panel',
      startsWith: false,
    },
    {
      href: '/statistics',
      icon: 'fas fa-chart-simple',
      text: 'components.site-navigation-menu.statistics',
      startsWith: true,
    },
    {
      href: '/posts',
      icon: 'fas fa-pen',
      text: 'components.site-navigation-menu.posts',
      startsWith: true,
      permission: Permissions.MANAGE_POSTS,
    },
    {
      href: '/tickets',
      icon: 'fas fa-ticket',
      text: 'components.site-navigation-menu.tickets',
      startsWith: true,
      permission: Permissions.MANAGE_TICKETS,
    },
    {
      href: '/players',
      icon: 'fas fa-users',
      text: 'components.site-navigation-menu.players',
      startsWith: true,
      permission: Permissions.MANAGE_PLAYERS,
    },
    {
      href: '/permissions',
      icon: 'fas fa-gavel',
      text: 'components.site-navigation-menu.permissions',
      startsWith: true,
      permission: Permissions.MANAGE_PERMISSION_GROUPS,
    },
    {
      href: '/view',
      icon: 'fas fa-palette',
      text: 'components.site-navigation-menu.view',
      startsWith: true,
      permission: Permissions.MANAGE_VIEW,
    },
    {
      href: '/translations',
      icon: 'fa-solid fa-language',
      text: 'components.site-navigation-menu.translations',
      startsWith: true,
      permission: Permissions.MANAGE_TRANSLATIONS,
    },
    {
      href: '/addons',
      icon: 'fas fa-puzzle-piece',
      text: 'components.site-navigation-menu.addons',
      startsWith: true,
      permission: Permissions.MANAGE_ADDONS,
    },
    {
      href: '/logs',
      icon: 'fas fa-align-left',
      text: 'components.site-navigation-menu.logs',
      startsWith: true,
    },
    {
      href: '/migration',
      icon: 'fas fa-right-left',
      text: 'components.settings-layout.migration',
      startsWith: true,
      permission: Permissions.MANAGE_PLATFORM_SETTINGS,
    },
    {
      href: '/settings',
      icon: 'fas fa-cog',
      text: 'components.site-navigation-menu.settings',
      startsWith: true,
      permission: Permissions.MANAGE_PLATFORM_SETTINGS,
      hasUpdate: true,
    },
  ];
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { page } from '$app/stores';

  import { hasPermission } from '$lib/auth.util.js';
  import { siteNavigationItems } from '$lib/PluginAPI.js';

  const session = getContext('session');

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + '/').toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
