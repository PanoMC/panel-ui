<!-- Navbar -->
<nav class="navbar navbar-expand navbar-light">
  <div class="container">
    <div class="col-4 d-flex justify-content-start">
      <!-- Navbar Toggler -->
      <div class="navbar-nav">
        <button
          class="navbar-toggler d-inline-block"
          class:invisible={$isSidebarOpen}
          type="button"
          title={$_("components.navbar.navbar-toggle-tooltip")}
          on:click={onSideBarCollapseClick}>
          <i class="fa-solid fa-bars"></i>
        </button>
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
        <!-- Notifications Dropdown -->
        <div class="nav-item position-relative" id="quickNotificationsDropdown">
          <button
            href="javascript:void(0);"
            class="nav-link"
            data-bs-toggle="dropdown"
            tpye="button"
            title={$_("components.navbar.notifications")}>
            <i class="fa-regular fa-bolt"></i>
            {#if $notificationCount !== 0}
              <span
                class="position-absolute px-2 py-1 translate-middle badge rounded-pill bg-danger">
                {$notificationCount}
              </span>
            {/if}
          </button>

          <div
            style="width: 300px;"
            class="dropdown-menu dropdown-menu-end animate__animated animate__zoomIn">
            <h6 class="dropdown-header">
              {$_("components.navbar.notifications")}
              {$notificationCount === 0 ? "" : "(" + $notificationCount + ")"}
            </h6>

            {#if $quickNotifications.length === 0}
              <NoContent />
            {:else}
              {#each $quickNotifications as notification, index (notification)}
                <button
                  title={$_("buttons.view")}
                  type="button"
                  on:click={() => onNotificationClick(notification)}
                  class="dropdown-item d-flex align-items-center"
                  class:notification-unread={notification.status ===
                    "NOT_READ"}>
                  <div class="row g-3">
                    <div class="col-auto d-flex align-items-center">
                      <i
                        class="fa fa-fw fa-bolt"
                        class:text-danger={notification.status === "NOT_READ"}
                      ></i>
                      <img
                        src="https://minotar.net/avatar/connor4312/64"
                        alt="NOTIFICATION AUTHOR"
                        width="32"
                        height="32"
                        class="rounded d-none" />
                    </div>
                    <div class="col">
                      {notification.type}
                      <br />
                      <small class="text-muted"> DATE</small>
                    </div>
                  </div>
                </button>
              {/each}
            {/if}

            <a class="dropdown-item bg-transparent" href="{base}/notifications">
              <button class="btn btn-sm btn-primary w-100">
                {$_("components.navbar.show-all")}</button>
            </a>
          </div>
        </div>

        <!-- Account Dropdown -->
        <div class="nav-item dropdown d-lg-block d-none">
          <button
            type="button"
            class="nav-link"
            data-bs-toggle="dropdown"
            title={$_("components.navbar.account-dropdown.session")}>
            <img
              src="https://minotar.net/avatar/{$user.username}"
              width="20"
              height="20"
              class="rounded-circle animate__animated animate__zoomIn"
              alt={$user.username} />
          </button>
          <ul
            class="dropdown-menu dropdown-menu-end animate__animated animate__zoomIn">
            <h6 class="dropdown-header">{$user.username}</h6>
            <li>
              <a
                class="dropdown-item"
                href="{base}/players/detail/{$user.username}">
                {$_("components.navbar.account-dropdown.profile")}
              </a>
            </li>
            <li class="dropdown-item bg-transparent">
              <button
                class="btn btn-sm btn-danger w-100"
                on:click={onLogout}>
                {$_("components.navbar.account-dropdown.logout")}</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</nav>

<script>
  import { onDestroy, onMount, getContext } from "svelte";
  import { formatDistanceToNow } from "date-fns";
  import { _ } from "svelte-i18n";
  import * as locales from "date-fns/locale";

  import { base } from "$app/paths";

  import ApiUtil from "$lib/api.util";
  import {
    logoutLoading,
    options,
    quickNotifications,
    toggleSidebar,
  } from "$lib/Store";
  import { onNotificationClick } from "$lib/NotificationManager.js";
  import NoContent from "$lib/component/NoContent.svelte";

  let quickNotificationProcessID = 0;

  let checkTime = 0;
  let interval;

  const pageTitle = getContext("pageTitle");
  const user = getContext("user");
  const notificationCount = getContext("notificationCount");
  const isSidebarOpen = getContext("isSidebarOpen");

  function onSideBarCollapseClick() {
    toggleSidebar(isSidebarOpen);
  }

  function onLogout() {
    logoutLoading.set(true);

    ApiUtil.post({
      path: "/api/auth/logout",
      handler: () => {
        window.location.href = "/";
      },
    });
  }

  function markQuickNotificationsAsRead(id) {
    ApiUtil.post({
      path: "/api/panel/notifications/quick/markAsRead",
      handler: (body, reject) => {
        if (quickNotificationProcessID !== id) {
          return;
        }

        if (body.result === "ok") {
          notificationCount.set(body.notificationCount);
        }

        setTimeout(() => {
          if (quickNotificationProcessID === id) {
            startMarkQuickNotificationsAsReadCountDown();
          }
        }, 1000);
      },
    });
  }

  function startMarkQuickNotificationsAsReadCountDown() {
    quickNotificationProcessID++;

    const id = quickNotificationProcessID;

    markQuickNotificationsAsRead(id);
  }

  function getTime(check, time, locale) {
    return formatDistanceToNow(time, { addSuffix: true, locale });
  }

  onMount(() => {
    const dropdown = document.getElementById("quickNotificationsDropdown");

    dropdown.addEventListener("show.bs.dropdown", function () {
      startMarkQuickNotificationsAsReadCountDown();
    });

    dropdown.addEventListener("hide.bs.dropdown", function () {
      quickNotificationProcessID++;
    });

    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>
