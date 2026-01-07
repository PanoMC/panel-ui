<nav class="sidebar-nav navbar-dark animate__animated animate__fadeIn">
  {#if $selectedServer}
    <ul class="navbar-nav px-3">
      {#each serverNavigationItems as item}
        <li class="nav-item">
          <a
            class="nav-link"
            href={base + '/server' + item.href}
            class:active={matching(
              $page.url.pathname,
              base + '/server' + item.href,
              item.startsWith,
            )}>
            <i class="{item.icon} me-2"></i>
            {$_(item.text)}
          </a>
        </li>
      {/each}
    </ul>
  {:else if $connectedServerCount > 0}
    <NoContent
      icon="fas fa-cube fa-3x"
      text={$_('components.server-navigation-menu.no-selected-server')}
      dark={true} />
  {:else}
    <NoContent
      icon="fas fa-cube fa-3x"
      text={$_('components.server-navigation-menu.no-server-text')}
      dark={true}>
    </NoContent>
  {/if}
</nav>

<script context="module">
  export const originalServerNavItems = [
    {
      href: '/dashboard',
      icon: 'fas fa-chart-pie',
      text: 'components.server-navigation-menu.statistics',
      startsWith: false,
    },
    {
      href: '/settings',
      icon: 'fas fa-cog',
      text: 'components.server-navigation-menu.settings',
      startsWith: true,
    },
  ];
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { page } from '$app/stores';

  import NoContent from '$lib/component/NoContent.svelte';
  import { serverNavigationItems } from '$lib/PluginAPI.js';

  const selectedServer = getContext('selectedServer');
  const connectedServerCount = getContext('connectedServerCount');

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + '/').toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
