<!-- Navbar -->
<nav class="navbar navbar-expand navbar-light py-3">
  <div class="container">
    <div class="col-4 d-flex justify-content-start">
      <!-- Navbar Toggler -->
      <div class="navbar-nav">
        <button
          class:d-lg-none={$isSidebarOpen}
          class="navbar-toggler d-inline-block me-2"
          type="button"
          aria-label={$_('components.navbar.show-menu')}
          title={windowWidth < 992 ? $_('components.navbar.show-menu') : null}
          use:tooltip={windowWidth >= 992 ? [$_('components.navbar.show-menu'), { placement: 'bottom' }] : null}
          on:click={onSideBarCollapseClick}
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebar"
          aria-controls="sidebar">
          <i class="fa-solid fa-step-forward"></i>
        </button>

        {#if $sidebarTabsState === 'website'}
          <!-- Show Website Link -->
          <div class="nav-item">
            <a
              href={UI_URL}
              target="_blank"
              class="nav-link d-flex align-items-center px-2"
              use:tooltip={windowWidth > 0 && windowWidth < 992
                ? [$_('components.sidebar.show-website'), { placement: 'bottom' }]
                : null}>
              <i class="fas fa-globe text-success d-lg-none"></i>
              <span class="d-none d-lg-inline text-success"
                >{$_('components.sidebar.show-website')}</span>
            </a>
          </div>
        {:else if $sidebarTabsState === 'game'}
          <!-- Selected Server & Connect button -->
          <div class="nav-item d-flex align-items-center">
            <div class="btn-group">
              <button
                type="button"
                class="btn btn-sm btn-link nav-link d-flex align-items-center border-0 px-2"
                on:click={showServersModal}
                use:tooltip={[
                  $selectedServer
                    ? $_('components.navbar.selected-server')
                    : windowWidth >= 992
                      ? $_('components.server-navigation-menu.select-server')
                      : $_('components.server-navigation-menu.no-selected-server'),
                  { placement: 'bottom' },
                ]}>
                {#if $selectedServer}
                  <i
                    class="fas fa-check-circle me-2 d-none"
                    class:text-success={$selectedServer.status === 'ONLINE'}
                    class:text-danger={$selectedServer.status !== 'ONLINE'}></i>
                  <span
                    class="text-truncate d-none d-lg-inline"
                    class:text-success={$selectedServer.status === 'ONLINE'}
                    class:text-danger={$selectedServer.status !== 'ONLINE'}
                    style="max-width: 150px;">
                    {$selectedServer.customName || $selectedServer.name}
                  </span>
                  <!-- Mobile view icon -->
                  <i
                    class="fas fa-server d-lg-none"
                    class:text-success={$selectedServer.status === 'ONLINE'}
                    class:text-danger={$selectedServer.status !== 'ONLINE'}></i>
                {:else}
                  <i class="fa-solid fa-ghost me-2 d-lg-none"></i>
                  <span>{$_('components.server-navigation-menu.no-selected-server')}</span>
                {/if}
              </button>
              <button
                class="btn btn-sm btn-link nav-link border-0 px-2"
                data-bs-target="#connectServer"
                data-bs-toggle="modal"
                aria-label={$_('components.server-navigation-menu.connect-server')}
                type="button"
                use:tooltip={[
                  $_('components.server-navigation-menu.connect-server'),
                  { placement: 'bottom' },
                ]}>
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
    <div class="col-4 d-flex justify-content-center">
      <!-- Page Title -->
      <h5 class="text-truncate mb-0">
        {$pageTitle ? $_($pageTitle) : options.DEFAULT_PAGE_TITLE}
      </h5>
    </div>
    <div class="col-4 d-flex justify-content-end">
      <div class="navbar-nav">
        <!-- Panel Theme Switcher -->
        <div class="nav-item dropdown">
          {#if selectingPanelTheme}
            <i class="nav-link fa-solid fa-spinner fa-spin"></i>
          {:else}
            <button
              use:tooltip={[$_('components.navbar.panel-theme'), { placement: 'bottom' }]}
              aria-label={$_('components.navbar.panel-theme')}
              class="nav-link"
              data-bs-toggle="dropdown"
              type="button"
              class:disabled={selectingPanelTheme}
              disabled={selectingPanelTheme}>
              <i class="fa-solid fa-palette"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <h6 class="dropdown-header">{$_('components.navbar.panel-theme')}</h6>
              {#each panelThemes as theme}
                <li>
                  <button
                    type="button"
                    class="dropdown-item"
                    class:active={($session.basicData.panelTheme || 'dark') === theme}
                    on:click={() => changePanelTheme(theme)}>
                    {$_('panel-themes.' + theme)}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <!-- Report a bug -->
        <div class="nav-item">
          <a
            class="nav-link"
            href="https://github.com/PanoMC/Pano/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={$_('components.navbar.report-a-bug')}
            use:tooltip={[$_('components.navbar.report-a-bug'), { placement: 'bottom' }]}>
            <i class="fa-solid fa-bug"></i>
          </a>
        </div>

        <!-- Notifications Dropdown -->
        <div class="nav-item dropdown" id="quickNotificationsDropdown">
          <button
            class="nav-link position-relative"
            data-bs-toggle="dropdown"
            type="button"
            aria-label={$_('components.navbar.notifications')}
            use:tooltip={[$_('components.navbar.notifications'), { placement: 'bottom' }]}>
            <i class="fa-regular fa-bolt"></i>
            {#if $notificationCount !== 0}
              <span
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {$notificationCount}
              </span>
            {/if}
          </button>

          <div style="width: 300px;" class="dropdown-menu dropdown-menu-end">
            <h6 class="dropdown-header">
              {$_('components.navbar.notifications')}
              {$notificationCount === 0 ? '' : '(' + $notificationCount + ')'}
            </h6>

            {#if $quickNotifications.length === 0}
              <NoContent />
            {:else}
              <div class="list-group list-group-flush">
                {#each $quickNotifications as notification, index (notification)}
                  <div
                    class="fw-normal list-group-item list-group-item-action d-flex align-items-center gap-3 text-wrap"
                    class:notification-unread={notification.status === 'NOT_READ'}>
                    <button
                      type="button"
                      use:tooltip={[$_('buttons.view'), { placement: 'bottom' }]}
                      on:click={() => onNotificationClick(notification)}
                      class="text-start border-0 bg-transparent p-0 d-flex align-items-center gap-3">
                      <div class="d-flex align-items-center">
                        {#if notification.details.faIcon}
                          <i class="{notification.details.faIcon} fa-lg fa-fw text-primary"></i>
                        {:else if notification.details.image || notification.details.username}
                          <img
                            src={sanitizeImageSrc(
                              notification.details.image ||
                                `/api/profile/picture/${notification.details.username}?${$avatarVersion}`,
                              '/api/server/icon/default',
                            )}
                            alt={$_('buttons.view')}
                            width="18"
                            height="18"
                            class="rounded-circle" />
                        {:else}
                          <i class="fa fa-bolt fa-lg fa-fw text-primary"></i>
                        {/if}
                      </div>

                      <div class="fw-normal">
                        <span class="text-wrap markdown-renderer text-break"
                          >{@html $_('notifications.' + notification.type, {
                            values: {
                              ...sanitizeObject(notification.details || {}),
                            },
                          })}</span>
                        <br />
                        <small>
                          {getTime(
                            checkTime,
                            parseInt(notification.createdAt),
                            locales[$currentLanguage.dateFnsCode],
                          )}
                        </small>
                      </div>
                    </button>
                  </div>
                {/each}
              </div>
            {/if}

            <a class="dropdown-item bg-transparent" href="{base}/notifications">
              <button class="btn btn-sm btn-primary w-100">
                {$_('components.navbar.show-all')}</button>
            </a>
          </div>
        </div>

        <!-- Account Dropdown -->
        <div class="nav-item dropdown d-lg-block d-none">
          <button
            type="button"
            class="nav-link h-100 d-flex align-items-center"
            data-bs-toggle="dropdown"
            aria-label={$_('components.navbar.account-dropdown.session')}
            use:tooltip={[
              $_('components.navbar.account-dropdown.session'),
              { placement: 'bottom' },
            ]}>
            <img
              src="/api/profile/picture/{$user.username}?{$avatarVersion}"
              width="20"
              height="20"
              class="rounded-circle"
              alt={$user.username} />
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <h6 class="dropdown-header">{$user.username}</h6>
            <li>
              <a class="dropdown-item focus-ring" href="{base}/players/detail/{$user.username}">
                {$_('components.navbar.account-dropdown.profile')}
              </a>
            </li>
            <li class="dropdown-item bg-transparent">
              <button class="btn btn-sm btn-danger w-100" on:click={onLogout}>
                {$_('components.navbar.account-dropdown.logout')}</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</nav>

<script>
  import { onDestroy, onMount, getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { formatDistanceToNow } from 'date-fns';
  import * as locales from 'date-fns/locale';
  import { sanitize } from '@jill64/universal-sanitizer';
  import { sanitizeImageSrc } from '$lib/security.util.js';

  import { base } from '$app/paths';
  import { page } from '$app/stores';

  import ApiUtil from '$lib/api.util';
  import {
    logout,
    logoutLoading,
    options,
    quickNotifications,
    toggleSidebar,
    avatarVersion,
  } from '$lib/Store';

  import { currentLanguage } from '$lib/language.util';
  import { browser } from '$app/environment';

  import { onNotificationClick } from '$lib/NotificationManager.js';
  import NoContent from '$lib/components/NoContent.svelte';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import SiteNavigationMenu from '$lib/components/sidebar/SiteNavigationMenu.svelte';
  import ServerNavigationMenu from '$lib/components/sidebar/ServerNavigationMenu.svelte';
  import { show as showServersModal } from './modals/ServersModal.svelte';
  import { UI_URL } from '$lib/variables.js';


  const selectedServer = getContext('selectedServer');
  const pageTitle = getContext('pageTitle');
  const user = getContext('user');
  const notificationCount = getContext('notificationCount');
  const isSidebarOpen = getContext('isSidebarOpen');
  const session = getContext('session');
  const panelTheme = getContext('panelTheme');
  const sidebarTabsState = getContext('sidebarTabsState');
  const siteInfo = getContext('siteInfo');

  const panelThemes = ['light', 'dark', 'copper'];

  let quickNotificationProcessID = 0;
  let windowWidth = browser ? window.innerWidth : 1200;

  let checkTime = 0;
  let interval;
  let showingQuickNotification;
  let selectingPanelTheme;

  let showSelectedServer;

  $: isServerPath = $page.url.pathname.startsWith((base || '') + '/server');

  function onSideBarCollapseClick() {
    toggleSidebar(isSidebarOpen);
  }

  function changePanelTheme(theme) {
    if ($siteInfo?.isDemo) {
      document.documentElement.setAttribute('data-bs-theme', theme);
      $session.basicData.panelTheme = theme;
      $panelTheme = theme;
      return;
    }

    selectingPanelTheme = true;

    ApiUtil.put({
      path: '/api/panel/panelTheme/select',
      body: { theme },
      handler: (body) => {
        if (body.error) {
          location.reload();
          return;
        }

        document.documentElement.setAttribute('data-bs-theme', theme);
        $session.basicData.panelTheme = theme;
        $panelTheme = theme;
        selectingPanelTheme = false;
      },
    });
  }

  function onLogout() {
    logout();
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function markQuickNotificationsAsRead(id) {
    await delay(1000);

    ApiUtil.post({
      path: '/api/panel/notifications/quick/markAsRead',
      handler: (body) => {
        if (quickNotificationProcessID !== id) {
          return;
        }

        if (body.result === 'ok') {
          notificationCount.set(body.notificationCount);
        }

        setTimeout(() => {
          if (quickNotificationProcessID === id) {
            startMarkQuickNotificationsAsReadCountDown(id);
          }
        }, 1000);
      },
    });
  }

  function startMarkQuickNotificationsAsReadCountDown(id) {
    markQuickNotificationsAsRead(id);
  }

  function getTime(check, time, locale) {
    return formatDistanceToNow(time, { addSuffix: true, locale });
  }

  function scheduleReadForLast5(notifications) {
    if (!showingQuickNotification) return;

    notifications.slice(0, 5).forEach((notification) => {
      if (notification.status === 'NOT_READ') {
        setTimeout(() => {
          if (!showingQuickNotification) return;

          quickNotifications.update((notifications) => {
            notifications.forEach((subNotification) => {
              if (subNotification.id === notification.id) {
                notification.status = 'READ';
              }
            });

            return notifications;
          });
        }, 3000);
      }
    });
  }

  onDestroy(quickNotifications.subscribe(scheduleReadForLast5));

  onMount(() => {
    const dropdown = document.getElementById('quickNotificationsDropdown');

    dropdown.addEventListener('show.bs.dropdown', function () {
      quickNotificationProcessID++;

      const id = quickNotificationProcessID;

      startMarkQuickNotificationsAsReadCountDown(id);

      showingQuickNotification = true;

      scheduleReadForLast5($quickNotifications);
    });

    dropdown.addEventListener('hide.bs.dropdown', function () {
      quickNotificationProcessID++;

      showingQuickNotification = false;
    });

    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);

    const onResize = () => {
      windowWidth = window.innerWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(interval);
    };
  });

  onDestroy(() => {
    // interval cleaned up in onMount return
  });

  // herhangi bir manuel abonelik yok

  function sanitizeObject(obj) {
    return Object.keys(obj).reduce((sanitizedObj, key) => {
      sanitizedObj[key] = sanitize(obj[key]);
      return sanitizedObj;
    }, {});
  }
</script>
