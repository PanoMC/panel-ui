<svelte:head>
  <title>{title}</title>
</svelte:head>

<App>
  {#if $showSplash}
    <Splash />
  {/if}

  <div class:d-flex="{!$showSplash}" hidden="{$showSplash}">
    <Sidebar />
    <!--  Main  -->
    <main class="w-100 min-vh-100 overflow-auto">
      <Navbar />

      <div hidden="{showLoading}">
        <slot />
      </div>

      <PageLoading show="{showLoading}" />
    </main>
  </div>

  <NotificationContainer />
  <ToastContainer />
  {#if hasPermission(Permissions.MANAGE_SERVERS)}
    <ServerRequestModal />
  {/if}
</App>

<script context="module">
  import { writable } from "svelte/store";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { browser } from "$app/environment";

  import { init as initLanguage } from "$lib/language.util";
  import ApiUtil from "$lib/api.util.js";

  import { networkErrorCallbacks, showNetworkError } from "$lib/Store.js";

  import { addListener } from "$lib/NotificationManager.js";

  import { show as showServerRequestModal } from "$lib/component/modals/ServerRequestModal.svelte";
  import { initializePlugins } from "$lib/PluginManager.js";
  import { updateApiUrl } from "$lib/variables.js";

  function initNotificationListeners() {
    addListener("NEW_TICKET", (notification) => {
      const {
        properties: { id },
      } = notification;

      goto(base + "/tickets/detail/" + id, { invalidateAll: true });
    });

    addListener("NEW_TICKET_MESSAGE", (notification) => {
      const {
        properties: { id },
      } = notification;

      goto(base + "/tickets/detail/" + id, { invalidateAll: true });
    });

    addListener("TICKET_CLOSED_BY_USER", (notification) => {
      const {
        properties: { id },
      } = notification;

      goto(base + "/tickets/detail/" + id, { invalidateAll: true });
    });

    addListener("SERVER_CONNECT_REQUEST", (notification) => {
      const {
        properties: { id },
      } = notification;

      showServerRequestModal(id);
    });
  }

  /**
   * @type {import('@sveltejs/kit').LayoutServerLoad}
   */
  export async function loadServer(event) {
    const {
      locals: { basicData, csrfToken, apiUrlEnv },
    } = event;

    let siteInfo = await ApiUtil.get({
      path: "/api/siteInfo",
      request: event,
      csrfToken,
    });

    return { basicData, csrfToken, siteInfo, apiUrlEnv };
  }

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load(event) {
    const {
      data: { basicData, csrfToken, siteInfo, apiUrlEnv },
      parent,
    } = event;
    await parent();

    if (apiUrlEnv) {
      updateApiUrl(apiUrlEnv);
    }

    await initializePlugins(siteInfo);

    await initLanguage(basicData.locale, event);

    if (browser) {
      ApiUtil.interceptors.errorHandler = (requestProcess) => {
        showNetworkError(requestProcess)
      };

      initNotificationListeners();
    }

    const output = {
      session: {
        basicData,
        csrfToken,
      },
      user: basicData.user || {},
      website: basicData.website || {},
      platformServerMatchKey: basicData.platformServerMatchKey || "",
      platformKeyRefreshedTime:
        basicData.platformServerMatchKeyTimeStarted || Date.now(),
      platformHostAddress: basicData.platformHostAddress || "",
      notificationCount: basicData.notificationCount || 0,
      mainServer: basicData.mainServer || {},
      selectedServer: basicData.selectedServer,
      connectedServerCount: basicData.connectedServerCount,
      siteInfo,
    };

    if (basicData.result !== "ok") {
      output.NETWORK_ERROR = true;
    }

    return output;
  }
</script>

<script>
  import { onDestroy, onMount, setContext } from "svelte";
  import { get } from "svelte/store";
  import { _ } from "svelte-i18n";

  import { page } from "$app/stores";

  import { options, logoutLoading, initialized } from "$lib/Store";

  import Splash from "$lib/component/Splash.svelte";
  import Navbar from "$lib/component/Navbar.svelte";
  import Sidebar from "$lib/component/Sidebar.svelte";
  import PageLoading from "$lib/component/PageLoading.svelte";
  import App from "$lib/component/App.svelte";
  import NotificationContainer from "$lib/component/NotificationContainer.svelte";
  import ToastContainer from "$lib/component/ToastContainer.svelte";
  import ServerRequestModal from "$lib/component/modals/ServerRequestModal.svelte";
  import { hasPermission, Permissions } from "$lib/auth.util.js";
  import { PanelSidebarStorageUtil } from "$lib/storage.util.js";

  export let data;

  const session = writable(data.session);
  const user = writable(data.user);
  const website = writable(data.website);
  const platformServerMatchKey = writable(data.platformServerMatchKey);
  const platformKeyRefreshedTime = writable(data.platformKeyRefreshedTime);
  const platformHostAddress = writable(data.platformHostAddress);
  const notificationCount = writable(data.notificationCount);
  const mainServer = writable(data.mainServer);
  const selectedServer = writable(data.selectedServer);
  const connectedServerCount = writable(data.connectedServerCount);
  const siteInfo = writable(data.siteInfo);
  const showSplash = writable(true);

  const pageTitle = writable(null);

  const sidebarTabsState = writable(getCurrentSidebarState());
  const isSidebarOpen = writable(
    PanelSidebarStorageUtil.isThereSideBarOpenStatus()
      ? PanelSidebarStorageUtil.getSidebarOpenStatus()
      : true,
  );

  const pageUnsubscribe = page.subscribe((page) => {
    session.set(page.data.session);
    user.set(page.data.user);
    website.set(page.data.website);
    platformServerMatchKey.set(page.data.platformServerMatchKey);
    platformKeyRefreshedTime.set(page.data.platformKeyRefreshedTime);
    platformHostAddress.set(page.data.platformHostAddress);
    notificationCount.set(page.data.notificationCount);
    mainServer.set(page.data.mainServer);
    selectedServer.set(page.data.selectedServer);
    connectedServerCount.set(page.data.connectedServerCount);
    siteInfo.set(page.data.siteInfo);

    sidebarTabsState.set(getCurrentSidebarState());
  });

  setContext("pageTitle", pageTitle);

  setContext("session", session);
  setContext("user", user);
  setContext("website", website);
  setContext("platformServerMatchKey", platformServerMatchKey);
  setContext("platformKeyRefreshedTime", platformKeyRefreshedTime);
  setContext("platformHostAddress", platformHostAddress);
  setContext("notificationCount", notificationCount);
  setContext("mainServer", mainServer);
  setContext("selectedServer", selectedServer);
  setContext("connectedServerCount", connectedServerCount);

  setContext("sidebarTabsState", sidebarTabsState);
  setContext("isSidebarOpen", isSidebarOpen);
  setContext("siteInfo", siteInfo);

  $: title = $pageTitle
    ? `${$_($pageTitle)} \u2014 ${options.DEFAULT_PAGE_TITLE}`
    : options.DEFAULT_PAGE_TITLE;

  let showSplashAlways = false;
  let showLoading = false;
  let waitAnimation = false;
  let mounted = false;

  function getCurrentSidebarState() {
    if (!hasPermission(Permissions.MANAGE_SERVERS)) {
      return "website";
    }

    if (PanelSidebarStorageUtil.isThereSideBarTabsState()) {
      return PanelSidebarStorageUtil.getSidebarTabsState();
    }

    return "website";
  }

  setTimeout(function () {
    waitAnimation = false;

    if (
      !showSplashAlways &&
      get(networkErrorCallbacks).length === 0 &&
      !get(logoutLoading) &&
      mounted
    ) {
      $showSplash = false;
    }
  }, 1500);

  onMount(() => {
    mounted = true;

    initialized.set(true);

    if (
      !showSplashAlways &&
      get(networkErrorCallbacks).length === 0 &&
      !get(logoutLoading) &&
      !waitAnimation
    ) {
      $showSplash = false;
    }
  });

  onDestroy(
    networkErrorCallbacks.subscribe((value) => {
      if (!$showSplash && value.length !== 0) {
        $showSplash = true;
      } else if (
        $showSplash &&
        value.length === 0 &&
        !waitAnimation &&
        !get(logoutLoading) &&
        !showSplashAlways &&
        mounted
      ) {
        $showSplash = false;
      }
    }),
  );

  onDestroy(pageUnsubscribe);
</script>
