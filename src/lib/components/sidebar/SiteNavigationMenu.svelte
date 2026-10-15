<style>
  .nav .nav-link {
    color: rgba(255, 255, 255, 0.65);
  }

  .nav .nav-link:hover {
    color: var(--bs-body-color) !important;
  }

  .nav .nav-link.active {
    color: var(--bs-body-color) !important;
  }
</style>

<ul class="nav flex-column" data-bs-theme="dark">
  {#each $siteNavigationItems as item}
    {#if (!item.permission || hasPermission(item.permission)) && isNavItemVisible(item, $usageMode)}
      {@const count = navCount(item, $compatAttention, $session)}
      <li class="nav-item">
        <a
          class="nav-link fw-normal text-truncate"
          href={base + item.href}
          class:active={matching($page.url.pathname, base + item.href, item.startsWith)}>
          <!-- Something inside needs the admin (a pending update, an addon or theme Pano keeps off, a
               missing licence): a dot at the top right of the entry. -->
          <span class="position-relative" class:pe-3={count > 0}>
            <i class="{item.icon} fa-fw me-2"></i>
            {$_(item.text)}
            {#if count > 0}
              <span
                class="position-absolute bg-secondary rounded-circle p-1 top-0 end-0"
                role="img"
                aria-label={navLabel(item, $compatAttention)}
                data-nav-attention={item.attention ?? 'updates'}>
              </span>
            {/if}
          </span>
        </a>
      </li>
    {/if}
  {/each}
</ul>

<script context="module">
  import { Permissions } from '$lib/auth.util.js';
  import { UsageModes } from '$lib/navigation.util.js';

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
      // Site-only section: a SERVERS install has no public website to manage.
      modes: [UsageModes.WEBSITE, UsageModes.BOTH],
    },
    {
      href: '/tickets',
      icon: 'fas fa-ticket',
      text: 'components.site-navigation-menu.tickets',
      startsWith: true,
      permission: Permissions.MANAGE_TICKETS,
      // Site-only section: a SERVERS install has no public website to manage.
      modes: [UsageModes.WEBSITE, UsageModes.BOTH],
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
      // Site-only section: a SERVERS install has no public website to manage.
      modes: [UsageModes.WEBSITE, UsageModes.BOTH],
      attention: 'themes',
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
      attention: 'addons',
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
      href: '/backups',
      icon: 'fas fa-box-archive',
      text: 'components.site-navigation-menu.backups',
      startsWith: true,
      permission: Permissions.MANAGE_PANO_BACKUPS,
    },
    {
      href: '/settings',
      icon: 'fas fa-cog',
      text: 'components.site-navigation-menu.settings',
      startsWith: true,
      // Mail templates live in Settings with their own permission.
      permission: [Permissions.MANAGE_PLATFORM_SETTINGS, Permissions.MANAGE_MAIL_TEMPLATES],
      hasUpdate: true,
    },
  ];
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '@panomc/sdk/core/js/basePath.js';
  import { page } from '@panomc/sdk/core/js/appStores.js';

  import { hasPermission } from '$lib/auth.util.js';
  import { compatAttention, refreshCompatAttention } from '$lib/compat-attention.store.js';
  import { isNavItemVisible } from '$lib/navigation.util.js';
  import { siteNavigationItems } from '$lib/PluginAPI.js';

  const session = getContext('session');
  const usageMode = getContext('usageMode');

  onMount(() => {
    if (hasPermission(Permissions.MANAGE_ADDONS)) {
      refreshCompatAttention();
    }
  });

  /** How many things inside this entry need the admin: addons, or a pending update. */
  function navCount(item, counts, sessionData) {
    if (item.attention) {
      return counts?.[item.attention] ?? 0;
    }

    if (item.hasUpdate) {
      // The platform only tells whether an update is waiting, not how many.
      const flag = sessionData?.basicData?.hasUpdate;

      return typeof flag === 'number' ? flag : flag ? 1 : 0;
    }

    return 0;
  }

  /** The tooltip of the badge, empty when there is none to say. */
  function navLabel(item, counts) {
    const count = item.attention ? (counts?.[item.attention] ?? 0) : 0;

    if (count > 0) {
      return $_(`components.site-navigation-menu.attention.${item.attention}`, {
        values: { count },
      });
    }

    return item.hasUpdate ? $_('components.settings-layout.updates') : '';
  }

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + '/').toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
