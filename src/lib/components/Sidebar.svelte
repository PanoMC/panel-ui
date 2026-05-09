<style>
  @media (min-width: 992px) {
    .offcanvas-lg {
      display: flex !important;
      flex-direction: column;
      height: 100% !important;
      max-height: 100% !important;
      position: sticky !important;
      top: 0;
      width: 240px !important;
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

  #sidebar {
    width: 240px !important;
    border-top-right-radius: 1rem !important;
    border-bottom-right-radius: 1rem !important;
    border: none !important;
  }

  /* --- Copper Theme Specific Adjustments --- */
  :global([data-bs-theme="copper"]) #sidebar {
    background-color: #1a1512 !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
  }

  :global([data-bs-theme="copper"]) .sidebar-header-container,
  :global([data-bs-theme="copper"]) .sidebar-scroll-area,
  :global([data-bs-theme="copper"]) .sidebar-bottom-container {
    background-color: #1a1512 !important;
  }

  :global([data-bs-theme="copper"]) .sidebar-header-container {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  :global([data-bs-theme="copper"]) .sidebar-bottom-container {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  :global([data-bs-theme="copper"]) .sidebar-top-fade-overlay {
    background: linear-gradient(to bottom, #1a1512, transparent);
  }

  :global([data-bs-theme="copper"]) .sidebar-bottom-fade-overlay {
    background: linear-gradient(to top, #1a1512, transparent);
  }

  :global([data-bs-theme="copper"]) .nav-pills .nav-link {
    color: rgba(255, 255, 255, 0.6) !important;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  :global([data-bs-theme="copper"]) .nav-pills .nav-link:hover {
    color: #fff !important;
    background-color: rgba(255, 255, 255, 0.05);
  }

  :global([data-bs-theme="copper"]) .nav-pills .nav-link.active {
    background-color: var(--bs-primary) !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .sidebar-header-container .navbar-brand {
    transition: none;
  }


  .navbar-toggler i {
    transition: transform 0.2s ease;
  }

  .navbar-toggler:hover i {
    transform: translateX(-2px);
  }

  /* Desktop: collapse in-flow — keep .offcanvas-lg so base .offcanvas never applies fixed overlay */
  @media (min-width: 992px) {
    /* Expanding: show immediately so width/opacity animate in */
    #sidebar:not(.sidebar-desktop-collapsed) {
      visibility: visible !important;
    }

    /* Collapsing: defer visibility until shrink finishes (!important beats main.scss .offcanvas-lg) */
    #sidebar.sidebar-desktop-collapsed {
      flex: 0 0 0 !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      overflow: hidden !important;
      opacity: 0;
      pointer-events: none;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      visibility: hidden !important;
      border-radius: 0 !important;
    }
  }
</style>

{#if hasPermission(Permissions.MANAGE_SERVERS)}
  <ServersModal />
  <ConnectServerModal />
{/if}

<div
  class="offcanvas offcanvas-start offcanvas-lg bg-primary h-100 overflow-hidden border"
  tabindex="-1"
  id="sidebar"
  aria-labelledby="sidebarLabel"
  data-bs-scroll="true"
  data-bs-backdrop="true"
  class:sidebar-desktop-collapsed={!$isSidebarOpen}>
  <div class="offcanvas-body d-flex flex-column p-0 overflow-hidden h-100">
    <!-- Fixed Header Area -->
    <div class="sidebar-header-container p-2 flex-shrink-0">
      <div class="sidebar-top-fade-overlay" class:show={isScrolledTop}></div>
      <!-- Sidebar Toggler & Logo -->
      <div class="navbar navbar-expand navbar-dark navbar-nav flex-row w-100 justify-content-center align-items-center position-relative">
        <button
          bind:this={closeButton}
          class:active={isFocused}
          on:focus={() => (isFocused = true)}
          on:blur={() => (isFocused = false)}
          type="button"
          class="navbar-toggler d-block position-absolute start-0 ms-2"
          aria-label={$_('components.sidebar.hide-menu')}
          title={windowWidth < 992 ? $_('components.sidebar.hide-menu') : null}
          use:tooltip={windowWidth >= 992 ? [$_('components.sidebar.hide-menu')] : null}
          on:click={onMobileSideBarCollapseClick}
          data-bs-dismiss={windowWidth < 992 ? 'offcanvas' : undefined}>
          <i class="fa-solid fa-bars"></i>
        </button>

        <a
          class="navbar-brand m-auto position-relative focus-ring focus-ring-white rounded d-flex align-items-center justify-content-center"
          href="{base}/"
          style="width: 48px; height: 48px;">
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
  import { PanelSidebarStorageUtil } from '$lib/storage.util';

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

  let windowWidth = browser ? window.innerWidth : 1200;
  let closeButton;
  let isFocused = false;

  $: if ($isSidebarOpen && closeButton && browser) {
    closeButton.focus();
  }

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

    /** Sync store when offcanvas closes via backdrop, ESC, or programmatic hide (navbar uses toggleSidebar). */
    const onOffcanvasHidden = () => {
      isSidebarOpen.set(false);
      PanelSidebarStorageUtil.savePanelSidebarStorageUtil(false);
    };
    sidebar.addEventListener('hidden.bs.offcanvas', onOffcanvasHidden);

    const onResize = () => {
      windowWidth = window.innerWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      sidebar.removeEventListener('hidden.bs.offcanvas', onOffcanvasHidden);
      window.removeEventListener('resize', onResize);
    };
  });
</script>
