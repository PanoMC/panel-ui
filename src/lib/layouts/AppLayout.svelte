<svelte:head>
  <link href="/api/favicon?hash={data.siteInfo.faviconHash}" rel="icon" />

  <title>{title}</title>

  <meta content={$session.basicData.panelTheme || 'dark'} name="x-theme" />
</svelte:head>

<App>
  {#if $showSplash}
    <Splash />
  {/if}

  <div class:d-flex={!$showSplash} hidden={$showSplash}>
    {#if $resetLayout}
      <slot />
    {:else}
      <MainLayout>
        <slot />
      </MainLayout>
    {/if}
  </div>

  <NotificationContainer />
  <ToastContainer />
  {#if hasPermission(Permissions.MANAGE_SERVERS)}
    <ServerRequestModal />
  {/if}

  {#if hasPermission(Permissions.MANAGE_VIEW) || hasPermission(Permissions.MANAGE_ADDONS)}
    <InstallingResourceModal />
  {/if}
  
  <RestartingModal />
  <ConfirmActionModal />
</App>

<script context="module">
  import { writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { setPanoContext } from '@panomc/sdk/internal';

  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';

  import { navigating } from '$app/stores';

  import PageActions from '$lib/component/PageActions.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import PageNavItem from '$lib/component/PageNavItem.svelte';
  import PageNav from '$lib/component/PageNav.svelte';
  import Pagination from '$lib/component/Pagination.svelte';
  import PageLoading from '$lib/component/PageLoading.svelte';
  import Toast from '$lib/component/Toast.svelte';
  import CardFilters from '$lib/component/CardFilters.svelte';
  import CardFiltersItem from '$lib/component/CardFiltersItem.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import CardMenu from '$lib/component/CardMenu.svelte';
  import CardMenuItem from '$lib/component/CardMenuItem.svelte';
  import DateComponent from '$lib/component/Date.svelte';
  import NoContent from '$lib/component/NoContent.svelte';
  import Editor from '$lib/component/Editor.svelte';
  import DragAndDropZone from '$lib/component/DragAndDropZone.svelte';

  import tooltip from '$lib/tooltip.util';

  import * as languageStuff from '$lib/language.util';
  import ApiUtil, * as ApiUtilStuff from '$lib/api.util.js';
  import * as toastStuff from '$lib/component/ToastContainer.svelte';
  import * as variableStuff from '$lib/variables';

  import { networkErrorCallbacks, showNetworkError } from '$lib/Store.js';

  import { addListener } from '$lib/NotificationManager.js';

  import { show as showServerRequestModal } from '$lib/component/modals/ServerRequestModal.svelte';
  import { initializePlugins, preparePlugins } from '$lib/PluginManager.js';
  import { updateApiUrl, updatePanoWebsiteUrl } from '$lib/variables.js';

  const initLanguage = languageStuff.init;

  function initNotificationListeners() {
    addListener('NEW_TICKET', (notification) => {
      const {
        details: { id },
      } = notification;

      goto(base + '/tickets/detail/' + id, { invalidateAll: true });
    });

    addListener('NEW_TICKET_MESSAGE', (notification) => {
      const {
        details: { id },
      } = notification;

      goto(base + '/tickets/detail/' + id, { invalidateAll: true });
    });

    addListener('TICKET_CLOSED_BY_USER', (notification) => {
      const {
        details: { id },
      } = notification;

      goto(base + '/tickets/detail/' + id, { invalidateAll: true });
    });

    addListener('SERVER_CONNECT_REQUEST', (notification) => {
      const {
        details: { id },
      } = notification;

      showServerRequestModal(id);
    });

    addListener('PANO_UPDATE_FOUND', () => {
      goto(base + '/settings/updates', { invalidateAll: true });
    });
  }

  /**
   * @type {import('@sveltejs/kit').LayoutServerLoad}
   */
  export async function loadServer(event) {
    const {
      locals: { basicData, csrfToken, apiUrlEnv, panoWebsiteUrlEnv, panoWebsiteApiUrlEnv },
    } = event;

    let siteInfo = await ApiUtil.get({
      path: '/api/siteInfo',
      request: event,
      csrfToken,
    });

    await preparePlugins(siteInfo);

    return {
      basicData,
      csrfToken,
      siteInfo,
      apiUrlEnv,
      panoWebsiteUrlEnv,
      panoWebsiteApiUrlEnv,
    };
  }

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load(event) {
    const {
      data: { basicData, csrfToken, siteInfo, apiUrlEnv, panoWebsiteUrlEnv, panoWebsiteApiUrlEnv },
      parent,
    } = event;
    await parent();

    if (apiUrlEnv) {
      updateApiUrl(apiUrlEnv);
    }

    if (panoWebsiteUrlEnv) {
      updatePanoWebsiteUrl(panoWebsiteUrlEnv);
    }

    if (panoWebsiteApiUrlEnv) {
      updatePanoWebsiteUrl(panoWebsiteApiUrlEnv);
    }

    setPanoContext({
      page,
      base,
      navigating,
      browser,
      goto,
      invalidate,
      invalidateAll,
      components: {
        PageActions,
        PageLoader,
        PageNavItem,
        PageNav,
        Pagination,
        PageLoading,
        Toast,
        CardFilters,
        CardFiltersItem,
        CardHeader,
        CardMenu,
        CardMenuItem,
        Date: DateComponent,
        NoContent,
        Editor,
        DragAndDropZone
      },
      utils: {
        api: {
          ApiUtil,
          ...ApiUtilStuff,
        },
        language: {
          ...languageStuff,
          _,
        },
        tooltip: {
          tooltip,
        },
        toast: {
          ...toastStuff,
        },
      },
      variables: {
        ...variableStuff,
      },
    });

    await initializePlugins(siteInfo);

    await initLanguage(siteInfo.locale, event);

    if (browser) {
      ApiUtil.interceptors.errorHandler = (requestProcess) => {
        showNetworkError(requestProcess);
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
      platformServerMatchKey: basicData.platformServerMatchKey || '',
      platformKeyRefreshedTime: basicData.platformServerMatchKeyTimeStarted || Date.now(),
      platformHostAddress: basicData.platformHostAddress || '',
      notificationCount: basicData.notificationCount || 0,
      mainServer: basicData.mainServer || {},
      selectedServer: basicData.selectedServer,
      connectedServerCount: basicData.connectedServerCount,
      siteInfo,
      resetLayout: writable(false),
      pageTitle: writable(null)
    };

    if (basicData.result !== 'ok') {
      output.NETWORK_ERROR = true;
    }

    return output;
  }
</script>

<script>
  import { onDestroy, onMount, setContext } from 'svelte';
  import { get } from 'svelte/store';

  import { options, logoutLoading, initialized } from '$lib/Store';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { PanelSidebarStorageUtil } from '$lib/storage.util.js';

  import Splash from '$lib/component/Splash.svelte';
  import App from '$lib/component/App.svelte';
  import NotificationContainer from '$lib/component/NotificationContainer.svelte';
  import ServerRequestModal from '$lib/component/modals/ServerRequestModal.svelte';
  import InstallingResourceModal from '$lib/component/modals/InstallingResourceModal.svelte';
  import MainLayout from '$lib/layouts/MainLayout.svelte';
  import ToastContainer from '$lib/component/ToastContainer.svelte';
  import RestartingModal from '$lib/component/modals/RestartingModal.svelte';
  import ConfirmActionModal from '$lib/component/modals/ConfirmActionModal.svelte';

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
  const platformUpdating = writable(false);
  const platformRestarting = writable(false);
  const panelTheme = writable(data.session.basicData.panelTheme || 'dark');
  const showDevModeAlert = writable(data.session.basicData.showDevModeAlert);
  const { resetLayout, pageTitle } = data;

  const sidebarTabsState = writable(getCurrentSidebarState());
  const isSidebarOpen = writable(
    PanelSidebarStorageUtil.isThereSideBarOpenStatus()
      ? PanelSidebarStorageUtil.getSidebarOpenStatus()
      : true,
  );

  const pageUnsubscribe = page.subscribe((page) => {
    session.set(data.session);
    user.set(data.user);
    website.set(data.website);
    platformServerMatchKey.set(data.platformServerMatchKey);
    platformKeyRefreshedTime.set(data.platformKeyRefreshedTime);
    platformHostAddress.set(data.platformHostAddress);
    notificationCount.set(data.notificationCount);
    mainServer.set(data.mainServer);
    selectedServer.set(data.selectedServer);
    connectedServerCount.set(data.connectedServerCount);
    siteInfo.set(data.siteInfo);
    panelTheme.set(data.session.basicData.panelTheme || 'dark');

    sidebarTabsState.set(getCurrentSidebarState());
  });

  $: if (data?.session?.basicData) {
    showDevModeAlert.set(data.session.basicData.showDevModeAlert);
  }

  setContext('pageTitle', pageTitle);

  setContext('session', session);
  setContext('user', user);
  setContext('website', website);
  setContext('platformServerMatchKey', platformServerMatchKey);
  setContext('platformKeyRefreshedTime', platformKeyRefreshedTime);
  setContext('platformHostAddress', platformHostAddress);
  setContext('notificationCount', notificationCount);
  setContext('mainServer', mainServer);
  setContext('selectedServer', selectedServer);
  setContext('connectedServerCount', connectedServerCount);

  setContext('sidebarTabsState', sidebarTabsState);
  setContext('isSidebarOpen', isSidebarOpen);
  setContext('siteInfo', siteInfo);
  setContext('platformUpdating', platformUpdating);
  setContext('platformRestarting', platformRestarting);
  setContext('panelTheme', panelTheme);
  setContext('showDevModeAlert', showDevModeAlert);

  $: title = $pageTitle
    ? `${$_($pageTitle)} \u2014 ${options.DEFAULT_PAGE_TITLE}`
    : options.DEFAULT_PAGE_TITLE;

  let showSplashAlways = false;
  let waitAnimation = false;
  let mounted = false;

  function getCurrentSidebarState() {
    if (!hasPermission(Permissions.MANAGE_SERVERS)) {
      return 'website';
    }

    if (PanelSidebarStorageUtil.isThereSideBarTabsState()) {
      return PanelSidebarStorageUtil.getSidebarTabsState();
    }

    return 'website';
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
        if ($platformUpdating || $platformRestarting) {
          return;
        }

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
