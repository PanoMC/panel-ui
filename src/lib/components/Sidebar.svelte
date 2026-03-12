<style>
  @media (min-width: 992px) {
    .offcanvas-lg {
      display: flex !important;
      flex-direction: column;
      height: 100% !important;
      max-height: 100% !important;
      position: sticky !important;
      top: 0;
      width: 280px !important;
      flex-shrink: 0;
      align-self: stretch;
    }
  }

  .nav-pills .nav-link.active {
    background-color: var(--bs-white) !important;
    color: var(--bs-primary) !important;
  }

  .sidebar-header-container {
    position: relative;
    background-color: var(--bs-primary);
    z-index: 3;
  }

  .sidebar-scroll-area {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
  }

  .sidebar-top-fade-overlay {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 16px;
    background: linear-gradient(to bottom, var(--bs-primary), transparent);
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .sidebar-top-fade-overlay.show {
    opacity: 1;
  }

  .sidebar-bottom-container {
    position: relative;
    background-color: var(--bs-primary);
    z-index: 3;
    margin-top: auto;
  }

  .sidebar-bottom-fade-overlay {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    height: 16px;
    background: linear-gradient(to top, var(--bs-primary), transparent);
    pointer-events: none;
    z-index: 2;
  }

  /* Custom rounding for sidebar */
  #sidebar {
    border-top-right-radius: 1rem !important;
    border-bottom-right-radius: 1rem !important;
    border: none !important;
  }
</style>

{#if hasPermission(Permissions.MANAGE_SERVERS)}
  <ServersModal />
  <ConnectServerModal />
{/if}

<div
  class="offcanvas offcanvas-start bg-primary h-100 overflow-hidden"
  tabindex="-1"
  id="sidebar"
  aria-labelledby="sidebarLabel" data-bs-scroll="true" data-bs-backdrop="false" class:offcanvas-lg={$isSidebarOpen}>
  <div class="offcanvas-body d-flex flex-column p-0 overflow-hidden h-100">
    <!-- Fixed Header Area -->
    <div class="sidebar-header-container p-2 flex-shrink-0">
      <div class="sidebar-top-fade-overlay" class:show={isScrolledTop}></div>
      <!-- Sidebar Toggler & Logo -->
      <div class="navbar navbar-expand navbar-dark">
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
              class="badge text-bg-info position-absolute top-100 start-50 translate-middle small d-none"
              use:tooltip={[
                $_('components.sidebar.version-alpha-tooltip'),
                { placement: 'bottom' },
              ]}>
              Alpha
            </span>
          {:else if isBeta}
            <span
              class="badge text-bg-primary position-absolute top-100 start-50 translate-middle small d-none"
              use:tooltip={[
                $_('components.sidebar.version-beta-tooltip'),
                { placement: 'bottom' },
              ]}>
              Beta
            </span>
          {/if}
        </a>
      </div>

      <!-- Buttons removed as per user request -->

      <!-- Sidebar Tabs -->
      <ul class="nav nav-pills nav-fill gap-1" data-bs-theme="dark">
        <li class="nav-item">
          <button
            class="nav-link p-1 text-center"
            aria-label={$_('components.sidebar.website')}
            use:tooltip={[$_('components.sidebar.website'), { placement: 'bottom' }]}
            on:click={onWebsiteMenuClick}
            class:active={$sidebarTabsState === 'website'}>
            <i class="fas fa-globe"></i>
          </button>
        </li>
        {#if hasPermission(Permissions.MANAGE_SERVERS)}
          <li class="nav-item">
            <button
              class="nav-link p-1 text-center"
              aria-label={$_('components.sidebar.server')}
              use:tooltip={[$_('components.sidebar.server'), { placement: 'bottom' }]}
              on:click={onGameMenuClick}
              class:active={$sidebarTabsState === 'game'}>
              <i class="fas fa-cube"></i>
            </button>
          </li>
        {/if}
      </ul>
    </div>

    <!-- Scrollable Menu Area -->
    <div class="sidebar-scroll-area px-2" on:scroll={handleScroll} bind:this={scrollArea}>
      <!-- Sidebar Site Navigation Menu || Sidebar Server Navigation Menu -->
      <svelte:component this={menuComponent} />
    </div>

    <!-- Fixed Bottom Area -->
    <div class="sidebar-bottom-container p-2">
      <div class="sidebar-bottom-fade-overlay"></div>
      <Bottom />
    </div>
  </div>

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

  let scrollArea;
  let isScrolledTop = false;

  const unsubscribeSidebarTabsState = sidebarTabsState.subscribe((value) => {
    if (value === 'website' || !hasPermission(Permissions.MANAGE_SERVERS)) {
      menuComponent = SiteNavigationMenu;
    } else {
      menuComponent = ServerNavigationMenu;
    }
    // Reset scroll when tab changes
    if (scrollArea) {
      scrollArea.scrollTop = 0;
      isScrolledTop = false;
    }
  });

  function handleScroll(e) {
    isScrolledTop = e.target.scrollTop > 0;
  }

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
