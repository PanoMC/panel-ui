<style>
  @media (min-width: 992px) {
    .offcanvas-lg {
      min-height: 100dvh !important;
      position: sticky !important;
      top: 0;
      width: 280px !important;
      flex-shrink: 0;
      align-self: stretch;
    }
  }

  .nav-pills .nav-link.active {
    background-color: #fff !important;
    color: var(--bs-primary) !important;
  }
</style>

{#if hasPermission(Permissions.MANAGE_SERVERS)}
  <ServersModal />
  <ConnectServerModal />
{/if}

<div
  class="offcanvas offcanvas-start bg-primary h-100 rounded-end-4"
  tabindex="-1"
  id="sidebar"
  aria-labelledby="sidebarLabel"
  class:offcanvas-lg={$isSidebarOpen}>
  <div class="offcanvas-body p-0">
    <div class="container-fluid position-relative">
      <!-- Sidebar Toggler & Logo -->
      <div class="navbar navbar-expand navbar-dark bg-body-primary">
        <button
          type="button"
          class="navbar-toggler d-block float-left position-absolute"
          aria-label={$_('components.sidebar.hide-menu')}
          use:tooltip={[$_('components.sidebar.hide-menu')]}
          on:click={onMobileSideBarCollapseClick}
          data-bs-dismiss="offcanvas">
          <i class="fa-solid fa-step-backward"></i>
        </button>

        <a class="navbar-brand m-auto position-relative focus-ring" href="{base}/">
          <img alt="Pano" use:tooltip={['Pano']} src={base + '/assets/img/logo.svg'} width="20" />
          {#if isAlpha}
            <span
              class="badge text-bg-info position-absolute top-100 start-50 translate-middle"
              style="font-size: 10px;"
              use:tooltip={[
                $_('components.sidebar.version-alpha-tooltip'),
                { placement: 'bottom' },
              ]}>
              Alpha
            </span>
          {:else if isBeta}
            <span
              class="badge text-bg-primary position-absolute top-100 start-50 translate-middle"
              style="font-size: 10px;"
              use:tooltip={[
                $_('components.sidebar.version-beta-tooltip'),
                { placement: 'bottom' },
              ]}>
              Beta
            </span>
          {/if}
        </a>
      </div>

      <div class="my-2">
        {#if $sidebarTabsState === 'website'}
          <a type="button" href={UI_URL} class="btn btn-sm btn-secondary w-100" target="_blank">
            {$_('components.sidebar.show-website')}
            <i class="fa-solid fa-arrow-up-right-from-square ms-2"></i>
          </a>
        {/if}

        {#if $sidebarTabsState === 'game'}
          <div class="hstack gap-1">
            <button
              class="btn btn-sm btn-secondary w-100"
              type="button"
              on:click={showServersModal}>
              {$_('components.sidebar.show-servers')}
            </button>
            <button
              class="btn btn-sm btn-secondary"
              data-bs-target="#connectServer"
              data-bs-toggle="modal"
              aria-label={$_('components.server-navigation-menu.connect-server')}
              type="button"
              use:tooltip={[$_('components.server-navigation-menu.connect-server')]}>
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        {/if}
      </div>

      <!-- Sidebar Tabs -->
      <ul class="nav nav-pills nav-fill mb-2" data-bs-theme="dark">
        <li class="nav-item">
          <button
            class="nav-link text-center"
            aria-label={$_('components.sidebar.website')}
            use:tooltip={[$_('components.sidebar.website'), { placement: 'bottom' }]}
            on:click={onWebsiteMenuClick}
            class:active={$sidebarTabsState === 'website'}>
            <i class="fas fa-globe fa-lg my-2 d-block"></i>
          </button>
        </li>
        {#if hasPermission(Permissions.MANAGE_SERVERS)}
          <li class="nav-item">
            <button
              class="nav-link text-center"
              aria-label={$_('components.sidebar.server')}
              use:tooltip={[$_('components.sidebar.server'), { placement: 'bottom' }]}
              on:click={onGameMenuClick}
              class:active={$sidebarTabsState === 'game'}>
              <i class="fas fa-cube fa-lg my-2 d-block"></i>
            </button>
          </li>
        {/if}
      </ul>

      <!-- Sidebar Site Navigation Menu || Sidebar Server Navigation Menu -->
      <svelte:component this={menuComponent} />
    </div>
  </div>
  <!-- Sidebar Bottom -->
  <Bottom />
</div>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { base } from '$app/paths';

  import { toggleSidebar, setSidebarTabsState } from '$lib/Store';

  import Bottom from './sidebar/Bottom.svelte';

  import SiteNavigationMenu from './sidebar/SiteNavigationMenu.svelte';
  import ServerNavigationMenu from './sidebar/ServerNavigationMenu.svelte';

  import ServersModal, { show as showServersModal } from './modals/ServersModal.svelte';
  import ConnectServerModal from './modals/ConnectServerModal.svelte';
  import { UI_URL } from '$lib/variables.js';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { browser } from '$app/environment';

  let menuComponent = SiteNavigationMenu;

  const sidebarTabsState = getContext('sidebarTabsState');
  const isSidebarOpen = getContext('isSidebarOpen');
  const siteInfo = getContext('siteInfo');

  $: panoVersion = $siteInfo?.panoVersion || '';
  $: isAlpha = panoVersion.toLowerCase().includes('alpha') || panoVersion === 'local-build';
  $: isBeta = panoVersion.toLowerCase().includes('beta');

  const unsubscribeSidebarTabsState = sidebarTabsState.subscribe((value) => {
    if (value === 'website' || !hasPermission(Permissions.MANAGE_SERVERS)) {
      menuComponent = SiteNavigationMenu;
    } else {
      menuComponent = ServerNavigationMenu;
    }
  });

  function onMobileSideBarCollapseClick() {
    toggleSidebar(isSidebarOpen);
  }

  function onWebsiteMenuClick() {
    setSidebarTabsState('website', sidebarTabsState);
  }

  function onGameMenuClick() {
    setSidebarTabsState('game', sidebarTabsState);
  }

  onDestroy(unsubscribeSidebarTabsState);

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  onMount(async () => {
    const sidebar = document.getElementById('sidebar');
    const off = window.bootstrap.Offcanvas.getOrCreateInstance(sidebar);

    sidebar.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      if (window.innerWidth < 992) {
        // only work in mobile
        off.hide(); // href will work normally
      }
    });
  });
</script>
