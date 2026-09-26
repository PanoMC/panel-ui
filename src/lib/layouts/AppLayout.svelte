<svelte:head>
  <link href="/api/favicon?hash={data.siteInfo.faviconHash}" rel="icon" />

  <title>{title}</title>

  <meta content={$session.basicData.panelTheme || 'dark'} name="x-theme" />
</svelte:head>

<App>
  {#if $showSplash}
    <Splash />
  {/if}

  <div class="vh-100 overflow-hidden flex-column" class:d-flex={!$showSplash} hidden={$showSplash}>
    <!-- Kept outside <main> (which is overflow-auto) so it can't be scrolled away. -->
    {#if $maintenanceMode}
      <div class="alert alert-danger fade show mb-0 rounded-0 flex-shrink-0" role="alert">
        <div class="container-fluid d-flex align-items-center">
          <i class="fa-solid fa-screwdriver-wrench me-3"></i>
          <div>
            {$_('components.maintenance-banner.text')}
            {#if hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS)}
              <a class="alert-link ms-2" href="{base}/settings/platform">
                {$_('components.maintenance-banner.go-to-settings')}
                <i class="fa-solid fa-arrow-right ms-1"></i>
              </a>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Pano Host: "managed by" link + control-plane notices; nothing on a self-hosted Pano. -->
    {#if signedIn && !$resetLayout && !inlineLogin}
      <HostedBanner />
    {/if}

    <div class="d-flex flex-grow-1 overflow-hidden" style="min-height: 0;">
      <!-- The login form shown in place of a page (`requireSignedIn`) is chrome-free like the
           auth pages, decided from `$page` rather than `resetLayout`: the store is set by a load
           the browser never runs when it hydrates an error page. -->
      {#if $resetLayout || inlineLogin}
        <slot />
      {:else}
        <MainLayout>
          <slot />
        </MainLayout>
      {/if}
    </div>
  </div>

  <!-- Only with a session: it polls /notifications/quick, and a 401 from that on the login page
       would raise the "Session error" splash over the very form that fixes it. -->
  {#if signedIn}
    <NotificationContainer />
  {/if}
  <ToastContainer />
  <!-- `signedIn &&` makes these re-evaluate when a sign-in happens in place (no reload). -->
  {#if signedIn && hasPermission(Permissions.MANAGE_SERVERS)}
    <ServerRequestModal />
  {/if}

  {#if signedIn && (hasPermission(Permissions.MANAGE_VIEW) || hasPermission(Permissions.MANAGE_ADDONS))}
    <InstallingResourceModal />
  {/if}

  <RestartingModal />
  <ConfirmActionModal />
  <WhatsNewModal />
</App>

<script context="module">
  import { writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { setPanoContext } from '@panomc/sdk/internal';
  import copy from 'copy-to-clipboard';

  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';
  import { error, redirect } from '@sveltejs/kit';

  import { navigating } from '$app/stores';

  import PageActions from '$lib/components/PageActions.svelte';
  import HostedBanner from '$lib/components/HostedBanner.svelte';
  import PageLoader from '$lib/components/PageLoader.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import PageLoading from '$lib/components/PageLoading.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';

  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import Editor from '$lib/components/Editor.svelte';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';

  import tooltip from '$lib/tooltip.util';

  import * as languageStuff from '$lib/language.util';
  import ApiUtil, * as ApiUtilStuff from '$lib/api.util.js';
  import * as toastStuff from '$lib/components/ToastContainer.svelte';
  import * as variableStuff from '$lib/variables';

  import { networkErrorCallbacks, showNetworkError, avatarVersion } from '$lib/Store.js';
  import { isInlineLogin, isNotLoggedIn } from '$lib/auth.api.js';
  import { normalizeUsageMode, UsageModes } from '$lib/navigation.util.js';

  import { addListener } from '$lib/NotificationManager.js';

  import { show as showServerRequestModal } from '$lib/components/modals/ServerRequestModal.svelte';
  import { initializePlugins, preparePlugins } from '$lib/PluginManager.js';
  import {
    updateApiUrl,
    updatePanoWebsiteUrl,
    updatePanoWebsiteApiUrl,
    checkDomainRedirection,
  } from '$lib/variables.js';

  const initLanguage = languageStuff.init;

  /**
   * The `(auth)` route group — the panel's own login and logout pages. They are the two routes
   * a signed-out visitor is allowed to reach, and the two that render without the sidebar and
   * the navbar.
   *
   * @param {string | null | undefined} routeId
   * @returns {boolean}
   */
  export function isAuthRoute(routeId) {
    return String(routeId || '').startsWith('/(auth)');
  }

  /**
   * Whether a signed-out visitor is sent to the theme's own login page — the one players already
   * use, with its captcha and social-login plugins; the session it creates opens the panel too.
   * Only a SERVERS install, which runs no theme at all, keeps the visitor here: the panel's own
   * form then renders in place of the page they asked for (`requireSignedIn`).
   *
   * @param {{ usageMode?: string } | null | undefined} siteInfo
   * @returns {boolean}
   */
  export function signsInOnTheme(siteInfo) {
    return normalizeUsageMode(siteInfo?.usageMode) !== UsageModes.SERVERS;
  }

  /** Alert kinds that belong to one server (§2.4.7). */
  const SERVER_ALERT_TYPES = ['SERVER_CRASHED', 'BACKUP_FAILED', 'TPS_LOW', 'SCHEDULE_FAILED'];

  /** Alert kinds that belong to a node, which has no per-server page to open. */
  const NODE_ALERT_TYPES = ['NODE_OFFLINE', 'DISK_LOW'];

  function hideAllModals() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.modal.show').forEach((modalEl) => {
      const inst =
        window.bootstrap.Modal.getInstance(modalEl) ||
        window.bootstrap.Modal.getOrCreateInstance(modalEl);
      inst.hide();
    });
  }

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

      const openModals = Array.from(document.querySelectorAll('.modal.show'));

      if (openModals.length === 0) {
        showServerRequestModal(id);
        return;
      }

      let pendingHidden = openModals.length;
      const onModalFullyHidden = () => {
        pendingHidden -= 1;
        if (pendingHidden <= 0) {
          showServerRequestModal(id);
        }
      };

      for (const el of openModals) {
        el.addEventListener('hidden.bs.modal', onModalFullyHidden, { once: true });
      }

      hideAllModals();
    });

    addListener('PANO_UPDATE_FOUND', () => {
      goto(base + '/settings/updates', { invalidateAll: true });
    });

    // SM-35 (§2.4.7) — an alert is about one server or about a node, so clicking it lands on
    // the page that can do something about it. The server id may be carried as `serverId` or,
    // like the older notifications, as plain `id`.
    SERVER_ALERT_TYPES.forEach((type) => {
      addListener(type, (notification) => {
        const serverId = notification?.details?.serverId ?? notification?.details?.id ?? null;

        goto(base + (serverId == null ? '/servers' : `/servers/${serverId}`), {
          invalidateAll: true,
        });
      });
    });

    NODE_ALERT_TYPES.forEach((type) => {
      addListener(type, () => {
        goto(base + '/servers/nodes', { invalidateAll: true });
      });
    });

    // SM-48 (§2.4.13) — the plugin page is the only one that can act on a plugin-updates
    // alert, so this one lands a level deeper than the other server alerts.
    addListener('PLUGIN_UPDATES', (notification) => {
      const serverId = notification?.details?.serverId ?? notification?.details?.id ?? null;

      goto(base + (serverId == null ? '/servers' : `/servers/${serverId}/plugins`), {
        invalidateAll: true,
      });
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

    // U-06: with the website on, a signed-out visitor is sent to the theme's login rather than
    // shown the offline splash. Only `NOT_LOGGED_IN` redirects — a user who *is* signed in but
    // lacks ACCESS_PANEL answers NO_PERMISSION, and bouncing them to a login page they are
    // already past would loop. A SERVERS install redirects nowhere: the page's own layout stops
    // the load and the login form renders in place (`requireSignedIn`).
    if (isNotLoggedIn(basicData) && !isAuthRoute(event.route?.id) && signsInOnTheme(siteInfo)) {
      throw redirect(302, '/login');
    }

    await preparePlugins(siteInfo);

    const avatarVersionDate = `&v=${Date.now()}`;

    return {
      basicData,
      csrfToken,
      siteInfo,
      apiUrlEnv,
      panoWebsiteUrlEnv,
      panoWebsiteApiUrlEnv,
      avatarVersionDate,
    };
  }

  // Stable singletons for stores that must persist across navigations
  let clientResetLayout;
  let clientPageTitle;

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load(event) {
    const {
      data: {
        basicData,
        csrfToken,
        siteInfo,
        apiUrlEnv,
        panoWebsiteUrlEnv,
        panoWebsiteApiUrlEnv,
        avatarVersionDate,
      },
      parent,
    } = event;
    await parent();
    avatarVersion.set(avatarVersionDate);

    if (apiUrlEnv) {
      updateApiUrl(apiUrlEnv);
    }

    if (panoWebsiteUrlEnv) {
      updatePanoWebsiteUrl(panoWebsiteUrlEnv);
    }

    if (panoWebsiteApiUrlEnv) {
      updatePanoWebsiteApiUrl(panoWebsiteApiUrlEnv);
    }

    if (browser) {
      checkDomainRedirection();
    }

    setPanoContext({
      page,
      base,
      navigating,
      browser,
      goto,
      invalidate,
      invalidateAll,
      error,
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

        Date: DateComponent,
        NoContent,
        Editor,
        DragAndDropZone,
        SearchInput,
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
        text: {
          copy,
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
      // Which parts of the panel exist at all. An install that predates the setting sends
      // nothing, which resolves to BOTH — today's behaviour.
      usageMode: normalizeUsageMode(siteInfo?.usageMode),
      resetLayout: browser
        ? clientResetLayout || (clientResetLayout = writable(false))
        : writable(false),
      pageTitle: browser ? clientPageTitle || (clientPageTitle = writable(null)) : writable(null),
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
  import {
    invalidateAll as runInvalidateAll,
    invalidate as runInvalidateByKey,
  } from '$app/navigation';

  import { options, logoutLoading, initialized } from '$lib/Store';
  import { isSignedIn } from '$lib/auth.api.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import {
    onPanelServerRemoved,
    onPanelServerUpdate,
    PANEL_SERVER_LIVE_LOAD_KEY,
    setPanelNotificationsSubscription,
    setPanelSelectedServerSubscription,
  } from '$lib/panelRealtime.js';
  import { activeServer } from '$lib/servers.util.js';
  import { PanelSidebarStorageUtil } from '$lib/storage.util.js';
  import { resolveSidebarTab, sidebarTabForPath } from '$lib/navigation.util.js';
  import { cleanupOrphanOverlays } from '$lib/modal.util.js';
  import { WHATS_NEW_VERSION } from '$lib/components/modals/WhatsNewModal.svelte';

  import Splash from '$lib/components/Splash.svelte';
  import App from '$lib/components/App.svelte';
  import NotificationContainer from '$lib/components/NotificationContainer.svelte';
  import ServerRequestModal from '$lib/components/modals/ServerRequestModal.svelte';
  import InstallingResourceModal from '$lib/components/modals/InstallingResourceModal.svelte';
  import MainLayout from '$lib/layouts/MainLayout.svelte';
  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import RestartingModal from '$lib/components/modals/RestartingModal.svelte';
  import ConfirmActionModal from '$lib/components/modals/ConfirmActionModal.svelte';
  import WhatsNewModal, {
    show as showWhatsNewModal,
  } from '$lib/components/modals/WhatsNewModal.svelte';

  export let data;

  const session = writable(data.session);
  const user = writable(data.user);
  const website = writable(data.website);
  const platformServerMatchKey = writable(data.platformServerMatchKey);
  const platformKeyRefreshedTime = writable(data.platformKeyRefreshedTime);
  const platformHostAddress = writable(data.platformHostAddress);
  const notificationCount = writable(data.notificationCount);
  /** The layout data whose count the badge last took. */
  let notificationCountSource = data;

  // Only a count the layout load just fetched, never on a plain navigation: `data` keeps its
  // identity until that load runs again, and re-applying its first count on every page change put
  // back the unread number of notifications that had been read since.
  $: takeNotificationCount(data);

  /** @param {any} next */
  function takeNotificationCount(next) {
    if (next === notificationCountSource) {
      return;
    }

    notificationCountSource = next;
    notificationCount.set(next.notificationCount);
  }
  const mainServer = writable(data.mainServer);
  const selectedServer = writable(data.selectedServer);
  const connectedServerCount = writable(data.connectedServerCount);
  const siteInfo = writable(data.siteInfo);
  const usageMode = writable(data.usageMode);
  const showSplash = writable(true);
  const platformUpdating = writable(false);
  const platformRestarting = writable(false);
  const panelTheme = writable(data.session.basicData.panelTheme || 'dark');
  const showDevModeAlert = writable(data.session.basicData.showDevModeAlert);
  const maintenanceMode = writable(!!data.session.basicData.maintenanceMode);
  let { resetLayout, pageTitle } = data;
  $: ({ resetLayout, pageTitle } = data);

  // Re-establish contexts reactively to handle potential store swaps (though unlikely with singletons)
  $: setContext('resetLayout', resetLayout);
  $: setContext('pageTitle', pageTitle);

  const sidebarTabsState = writable(getCurrentSidebarState());
  const isSidebarOpen = writable(
    PanelSidebarStorageUtil.isThereSideBarOpenStatus()
      ? PanelSidebarStorageUtil.getSidebarOpenStatus()
      : true,
  );

  // Defensive overlay cleanup after every navigation. If a Bootstrap modal or
  // the sidebar offcanvas was mid-hide when SvelteKit moved to a new route,
  // the backdrop element (z-index 1050, fixed) can survive and block touch
  // scrolling on mobile. We wait for Bootstrap's transition to settle before
  // removing any leftover backdrop / body scroll-lock styles.
  const navigatingUnsubscribe = navigating.subscribe((nav) => {
    if (!browser || nav !== null) return;
    setTimeout(cleanupOrphanOverlays, 350);
  });

  const pageUnsubscribe = page.subscribe((p) => {
    session.set(data.session);
    user.set(data.user);
    website.set(data.website);
    platformServerMatchKey.set(data.platformServerMatchKey);
    platformKeyRefreshedTime.set(data.platformKeyRefreshedTime);
    platformHostAddress.set(data.platformHostAddress);
    mainServer.set(data.mainServer);
    // selectedServer: keep in sync via $: if (data) below (merge with live WebSocket state)
    connectedServerCount.set(data.connectedServerCount);
    siteInfo.set(data.siteInfo);
    usageMode.set(data.usageMode);
    panelTheme.set(data.session.basicData.panelTheme || 'dark');

    sidebarTabsState.set(getCurrentSidebarState());

    // Auto-Reset Layout State: If we navigate to a non-plugin route, force resetLayout to false.
    // The auth pages are chrome-free too, so they keep the flag their layout load set — and so
    // does the login form the root error page shows in place of a page (`requireSignedIn`).
    if (
      browser &&
      p.route &&
      p.route.id &&
      !p.route.id.includes('(plugin-ui)') &&
      !isAuthRoute(p.route.id) &&
      !isInlineLogin(p)
    ) {
      resetLayout.set(false);
    }
  });

  $: if (data && data.selectedServer !== undefined) {
    const next = data.selectedServer;
    if (next == null) {
      selectedServer.set(null);
    } else {
      const cur = get(selectedServer);
      if (cur && Number(cur.id) === Number(next.id)) {
        selectedServer.set({ ...next, ...cur });
      } else {
        selectedServer.set(next);
      }
    }
  }

  $: if (data?.session?.basicData) {
    showDevModeAlert.set(data.session.basicData.showDevModeAlert);

    // Only follow the backend when it actually reports the flag, so an optimistic
    // set() from the platform settings page isn't wiped by an unrelated navigation.
    if (data.session.basicData.maintenanceMode !== undefined) {
      maintenanceMode.set(!!data.session.basicData.maintenanceMode);
    }
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
  setContext('usageMode', usageMode);
  setContext('platformUpdating', platformUpdating);
  setContext('platformRestarting', platformRestarting);
  setContext('panelTheme', panelTheme);
  setContext('showDevModeAlert', showDevModeAlert);
  setContext('maintenanceMode', maintenanceMode);

  /**
   * What the page is about when its title alone does not say — the server a server page belongs to.
   * Only the browser tab shows it ("Files · Survival — Pano"); the navbar keeps the page's name.
   * The layout that sets it clears it when it goes away.
   */
  const pageSubtitle = writable(/** @type {string | null} */ (null));

  setContext('pageSubtitle', pageSubtitle);

  $: title = $pageTitle
    ? `${$_($pageTitle)}${$pageSubtitle ? ` \u00b7 ${$pageSubtitle}` : ''} \u2014 ${options.DEFAULT_PAGE_TITLE}`
    : options.DEFAULT_PAGE_TITLE;

  let showSplashAlways = false;
  let waitAnimation = false;
  let mounted = false;
  let whatsNewShown = false;

  let offPanelRealtimeServer;
  let offPanelRealtimeRemoved;

  /** Re-fetch server pages that `depends(PANEL_SERVER_LIVE_LOAD_KEY)` (e.g. statistics). */
  let serverLiveReloadTimer;
  function scheduleServerLivePageReload() {
    if (!browser) {
      return;
    }
    if (serverLiveReloadTimer) {
      clearTimeout(serverLiveReloadTimer);
    }
    serverLiveReloadTimer = setTimeout(() => {
      serverLiveReloadTimer = null;
      void runInvalidateByKey(PANEL_SERVER_LIVE_LOAD_KEY);
    }, 400);
  }

  $: if (browser) {
    if ($activeServer) {
      // A `/servers/[id]` route is open: its layout owns the per-server subscription, so the
      // navbar's "selected server" must not pull the feed back to a different server.
    } else if (hasPermission(Permissions.MANAGE_SERVERS)) {
      const id = $selectedServer?.id;
      setPanelSelectedServerSubscription(id == null || id === '' ? null : id);
    } else {
      setPanelSelectedServerSubscription(null);
    }
  }

  /**
   * The tab `Sidebar` and `Navbar` both render from. Every usage mode has the pills, so the
   * persisted choice is honoured wherever the mode leaves both workspaces reachable.
   */
  function getCurrentSidebarState() {
    return resolveSidebarTab({
      usageMode: data.usageMode,
      canManageServers: hasPermission(Permissions.MANAGE_SERVERS),
      // The page decides, not a remembered pill: a site page must not be shown with the servers
      // menu beside it, and the answer has to be the same on the server and in the browser.
      getStoredTab: () => sidebarTabForPath(get(page).url.pathname, base),
    });
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

  /** Whether [wireSignedInSession] has run for the session this document is showing. */
  let sessionWired = false;

  /**
   * What a signed-in session needs wired once: the realtime hub and the server listeners. Done
   * on mount for a document that loads signed in, and again from the reactive statement below
   * when a visitor signs in *in place* (the login form `requireSignedIn` shows, then
   * `invalidateAll`) — that sign-in reloads the data, not the document.
   */
  function wireSignedInSession() {
    if (sessionWired || !browser || !signedIn) {
      return;
    }

    sessionWired = true;

    // The hub rejects an unauthenticated socket and the client would reconnect forever, so the
    // login form never opens one.
    setPanelNotificationsSubscription(true);

    if (hasPermission(Permissions.MANAGE_SERVERS)) {
      offPanelRealtimeServer = onPanelServerUpdate((server) => {
        if (!server || server.id == null) {
          return;
        }
        const sel = get(selectedServer);
        if (sel && Number(sel.id) === Number(server.id)) {
          selectedServer.set({ ...sel, ...server });
          scheduleServerLivePageReload();
        }
        const main = get(mainServer);
        if (main && Number(main.id) === Number(server.id)) {
          mainServer.set({ ...main, ...server });
        }
      });
      offPanelRealtimeRemoved = onPanelServerRemoved(async (serverId) => {
        if (Number(get(selectedServer)?.id) === Number(serverId)) {
          selectedServer.set(null);
          await runInvalidateAll();
        }
        if (Number(get(mainServer)?.id) === Number(serverId)) {
          mainServer.set(null);
        }
      });
    }
  }

  onMount(() => {
    mounted = true;

    initialized.set(true);

    wireSignedInSession();

    if (
      !showSplashAlways &&
      get(networkErrorCallbacks).length === 0 &&
      !get(logoutLoading) &&
      !waitAnimation
    ) {
      $showSplash = false;
    }
  });

  $: signedIn = isSignedIn(data?.session?.basicData);

  // A sign-in that happened in place: the same document, new data.
  $: if (mounted && signedIn) {
    wireSignedInSession();
  }

  $: inlineLogin = isInlineLogin($page);

  $: if (signedIn && !$showSplash && !whatsNewShown) {
    const backendDismissedVersion = data.session.basicData.dismissedWhatsNewVersion;

    if (backendDismissedVersion === WHATS_NEW_VERSION) {
      whatsNewShown = true;
    } else {
      showWhatsNewModal();
      whatsNewShown = true;
    }
  }

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
  onDestroy(navigatingUnsubscribe);

  onDestroy(() => {
    if (serverLiveReloadTimer) {
      clearTimeout(serverLiveReloadTimer);
    }
    offPanelRealtimeServer?.();
    offPanelRealtimeRemoved?.();
    if (browser) {
      setPanelNotificationsSubscription(false);
      setPanelSelectedServerSubscription(null);
    }
  });
</script>
