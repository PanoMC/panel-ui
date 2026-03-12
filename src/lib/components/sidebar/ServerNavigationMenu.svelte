<style>
  .nav-pills .nav-link {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.65);
    transition: all 0.2s ease;
  }

  .nav-pills .nav-link:hover {
    color: var(--bs-white);
    background: rgba(255, 255, 255, 0.05);
  }

  .nav-pills .nav-link.active {
    background: linear-gradient(to left, rgba(255, 255, 255, 0.15), transparent) var(--bs-primary) !important;
    color: var(--bs-white);
    font-weight: 600;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
</style>

{#if $selectedServer}
  <ul class="nav nav-pills flex-column" data-bs-theme="dark">
    {#each $serverNavigationItems as item}
      <li class="nav-item">
        <a
          class="nav-link text-truncate p-2"
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
  <div data-bs-theme="dark">
    <NoContent
      icon="fas fa-cube fa-3x"
      text={$_('components.server-navigation-menu.no-selected-server')} />
  </div>
{:else}
  <div data-bs-theme="dark">
    <NoContent
      icon="fas fa-cube fa-3x"
      text={$_('components.server-navigation-menu.no-server-text')} />
  </div>
{/if}

<script context="module">
  export const originalServerNavItems = [
    {
      href: '/dashboard',
      icon: 'fas fa-table-columns',
      text: 'components.site-navigation-menu.panel',
      startsWith: false,
    },
    {
      href: '/statistics',
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

  import NoContent from '$lib/components/NoContent.svelte';
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
