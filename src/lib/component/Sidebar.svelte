{#if hasPermission(Permissions.MANAGE_SERVERS)}
  <ServersModal />
  <ConnectServerModal />
{/if}

<div class="sidebar bg-primary min-vh-100" class:active={$isSidebarOpen}>
  <div class="container-fluid">
    <!-- Sidebar Toggler & Logo -->
    <div class="navbar navbar-expand navbar-dark bg-body-primary">
      <button
        type="button"
        class="navbar-toggler d-block float-left position-absolute"
        title={$_("components.sidebar.sidebar-toggle-tooltip")}
        on:click={onMobileSideBarCollapseClick}>
        <i class="fa-solid fa-bars"></i>
      </button>

      <a class="navbar-brand m-auto ps-1" href="{base}/">
        <img
          alt="Pano"
          title="Pano"
          src={base + "/assets/img/logo.svg"}
          width="20" />
      </a>
    </div>

    <!-- Sidebar Tabs -->
    <div class="navbar-dark">
      <ul class="navbar-nav flex-row nav-fill">
        <li class="nav-item">
          <button
            class="nav-link text-center"
            on:click={onWebsiteMenuClick}
            class:active={$sidebarTabsState === "website"}>
            <i class="fas fa-globe fa-lg mb-3"></i>
            <br />
            {$_("components.sidebar.website")}
          </button>
        </li>
        {#if hasPermission(Permissions.MANAGE_SERVERS)}
          <li class="nav-item">
            <button
              class="nav-link text-center"
              on:click={onGameMenuClick}
              class:active={$sidebarTabsState === "game"}>
              <i class="fas fa-cube fa-lg mb-3"></i>
              <br />
              {$_("components.sidebar.server")}
            </button>
          </li>
        {/if}
      </ul>
    </div>

    <!-- Sidebar Info Section -->
    {#if $sidebarTabsState === "website"}
      <a
        type="button"
        href={UI_URL}
        class="btn btn-sm btn-secondary w-100"
        target="_blank">
        {$_("components.sidebar.show-website")}
        <i class="fa-solid fa-arrow-up-right-from-square ms-2"></i>
      </a>
    {/if}

    {#if $sidebarTabsState === "game"}
      <div class="hstack gap-1">
        <button
          class="btn btn-sm btn-secondary w-100"
          type="button"
          on:click={showServersModal}>
          <i class="fa-solid fa-cubes me-2"></i>
          {$_("components.sidebar.show-servers")}
        </button>
        <button
          class="btn btn-sm btn-secondary"
          data-bs-target="#connectServer"
          data-bs-toggle="modal"
          aria-label={$_("components.server-navigation-menu.connect-server")}
          type="button"
          title="
          {$_('components.server-navigation-menu.connect-server')}">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    {/if}

    <!-- Sidebar Site Navigation Menu || Sidebar Server Navigation Menu -->
    <svelte:component this={menuComponent} />

    <!-- Sidebar Bottom -->
    <Bottom />
  </div>
</div>

<script>
  import { getContext, onDestroy } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import tooltip from "$lib/tooltip.util";

  import { toggleSidebar, setSidebarTabsState } from "$lib/Store";

  import Bottom from "./sidebar/Bottom.svelte";

  import SiteNavigationMenu from "./sidebar/SiteNavigationMenu.svelte";
  import ServerNavigationMenu from "./sidebar/ServerNavigationMenu.svelte";

  import ServersModal, {
    show as showServersModal,
  } from "./modals/ServersModal.svelte";
  import ConnectServerModal from "./modals/ConnectServerModal.svelte";
  import { UI_URL } from "$lib/variables.js";

  import { websiteLogoSrc } from "$lib/Store.js";
  import { hasPermission, Permissions } from "$lib/auth.util.js";

  let menuComponent = SiteNavigationMenu;

  const website = getContext("website");
  const sidebarTabsState = getContext("sidebarTabsState");
  const isSidebarOpen = getContext("isSidebarOpen");
  const selectedServer = getContext("selectedServer");

  const unsubscribeSidebarTabsState = sidebarTabsState.subscribe((value) => {
    if (value === "website" || !hasPermission(Permissions.MANAGE_SERVERS)) {
      menuComponent = SiteNavigationMenu;
    } else {
      menuComponent = ServerNavigationMenu;
    }
  });

  function onMobileSideBarCollapseClick() {
    toggleSidebar(isSidebarOpen);
  }

  function onWebsiteMenuClick() {
    setSidebarTabsState("website", sidebarTabsState);
  }

  function onGameMenuClick() {
    setSidebarTabsState("game", sidebarTabsState);
  }

  onDestroy(unsubscribeSidebarTabsState);
</script>
