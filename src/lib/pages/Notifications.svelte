<div class="container vstack gap-3">
  <!-- Action Menu -->

  <PageActions>
    <div slot="left">
      {#if data.categoryUrl}
        <a class="btn btn-link" role="button" href="{base}/posts">
          <i class="fas fa-arrow-left ms-2"></i>
          {$_("buttons.posts")}
        </a>
      {/if}
    </div>


    <div slot="right">
      {#if $notifications.length !== 0}
      <button
        type="button"
        class="btn btn-danger"
        on:click="{() => onDeleteAllClick()}"
        >
        <i class="fa fa-trash me-2"></i>
        {$_("pages.notifications.delete-all")}
      </button>
    {/if}
    </div>
  </PageActions>



  <!-- All Notifications -->

  <div class="card">
    <div class="card-header">
      1 Bildirim
    </div>
    <div class="card-body">
      <div class="list-group">
        {#each $notifications as notification, index (notification)}
          <a
            href="javascript:void(0);"
            on:click="{() => onNotificationClick(notification)}"
            class="list-group-item list-group-item-action text-wrap"
            class:notification-unread="{notification.status === 'NOT_READ'}">
            {notification.type}
            <br />
            <small class="text-muted">
              {getTime(
                checkTime,
                parseInt(notification.date),
                locales[$currentLanguage["date-fns-code"]],
              )}
            </small>
          </a>
        {/each}
      </div>
    </div>
  </div>

  {#if $notifications.length === 0}
    <NoContent />
  {/if}

  {#if $notifications.length < $count && $count > 10 + 10 * page}
    <div class="mt-3">
      <button
        class="btn btn-link bg-light d-block m-auto"
        class:disabled="{loadMoreLoading}"
        on:click="{loadMore}"
        >{$_("pages.notifications.show-more", {
          values: { count: $count - $notifications.length },
        })}
      </button>
    </div>
  {/if}
</div>

<ConfirmRemoveAllNotificationsModal />

<script context="module">
  import { writable, get } from "svelte/store";

  import { browser } from "$app/environment";

  import ApiUtil from "$lib/api.util.js";

  const notifications = writable([]);
  const count = writable(0);

  Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);

    return this;
  };

  Array.prototype.remove = function (index) {
    this.splice(index, 1);

    return this;
  };

  function setNotifications(newNotifications) {
    if (get(notifications).length === 0 || newNotifications.length === 0)
      notifications.set(newNotifications);
    else {
      const listOfFilterIsNotificationExists = [];

      newNotifications.forEach((item, index) => {
        listOfFilterIsNotificationExists[index] = get(notifications).filter(
          (filterItem) => filterItem.id === item.id,
        );
      });

      newNotifications.forEach((item, index) => {
        if (listOfFilterIsNotificationExists[index].length === 0) {
          notifications.set(get(notifications).insert(index, item));
        }
      });
    }
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const body = await ApiUtil.get({
      path: "/api/panel/notifications",
      request: event,
    });

    setNotifications(body.notifications);

    count.set(parseInt(body.notificationCount));

    return body;
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from "svelte";
  import { formatDistanceToNow } from "date-fns";
  import { _ } from "svelte-i18n";
  import * as locales from "date-fns/locale";

  import ConfirmRemoveAllNotificationsModal, {
    show as showDeleteAllNotificationsModal,
    setCallback as setDeleteAllNotificationsModalCallback,
  } from "$lib/component/modals/ConfirmRemoveAllNotificationsModal.svelte";
  import { onNotificationClick } from "$lib/NotificationManager.js";

  import NoContent from "$lib/component/NoContent.svelte";
  import { currentLanguage } from "$lib/language.util.js";
    import PageActions from "$lib/component/PageActions.svelte";
    import CardMenu from "$lib/component/CardMenu.svelte";
    import CardMenuItem from "$lib/component/CardMenuItem.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.notifications.title");

  let notificationProcessID = 0;
  let page = 0;
  let loadMoreLoading = false;

  let checkTime = 0;
  let interval;

  function getNotifications(id) {
    ApiUtil.get({
      path: "/api/panel/notifications",
      handler: (body) => {
        if (notificationProcessID !== id) {
          return;
        }

        if (body.result === "ok") {
          setNotifications(body.notifications);

          count.set(parseInt(body.notificationCount));
        }

        setTimeout(() => {
          if (notificationProcessID === id) {
            startnotificationCountdown();
          }
        }, 1000);
      },
    });
  }

  function loadMore() {
    loadMoreLoading = true;

    ApiUtil.get({
      path: `/api/panel/notifications/${
        get(notifications)[get(notifications).length - 1].id
      }/more`,
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        body.notifications.forEach((notification) => {
          notifications.update((value) =>
            value.insert(value.length, notification),
          );
        });

        loadMoreLoading = false;
      },
    });
  }

  function deleteNotification(id) {
    ApiUtil.delete({
      path: `/api/panel/notifications/${id}`,
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        get(notifications).forEach((notification) => {
          if (notification.id === id) {
            notifications.update((value) =>
              value.remove(value.indexOf(notification)),
            );

            count.update((value) => value--);
          }
        });
      },
    });
  }

  function startnotificationCountdown() {
    notificationProcessID++;

    const id = notificationProcessID;

    getNotifications(id);
  }

  function stopnotificationCountdown() {
    notificationProcessID++;

    clearInterval(interval);
  }

  function getTime(check, time, locale) {
    return formatDistanceToNow(time, { addSuffix: true });
  }

  function onDeleteAllClick() {
    stopnotificationCountdown();

    showDeleteAllNotificationsModal();
  }

  if (browser) startnotificationCountdown();

  onMount(() => {
    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    stopnotificationCountdown();
  });

  setDeleteAllNotificationsModalCallback(() => {
    startnotificationCountdown();
  });
</script>
