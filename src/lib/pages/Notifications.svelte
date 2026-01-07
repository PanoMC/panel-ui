<div class="container vstack gap-3">
  <!-- Action Menu -->

  <PageActions leftClasses="d-lg-flex d-none" middleClasses="d-lg-flex d-none">
    <div slot="right">
      {#if $notifications.length !== 0}
        <button
          type="button"
          aria-label={$_('pages.notifications.delete-all')}
          class="btn btn-secondary"
          on:click={() => onDeleteAllClick()}>
          <i class="fa fa-trash"></i>
          <span class="d-lg-inline d-none ms-2"> {$_('pages.notifications.delete-all')}</span>
        </button>
      {/if}
    </div>
  </PageActions>

  <!-- All Notifications -->

  <div class="card">
    <div class="card-header">{$_('pages.notifications.title')}</div>
    <div class="card-body vstack gap-3" class:d-none={$notifications.length === 0}>
      <div class="list-group">
        {#each $notifications as notification (notification)}
          <div
            class="list-group-item list-group-item-action d-flex align-items-center gap-3 text-wrap"
            class:notification-unread={notification.status === 'NOT_READ'}>
            <button
              type="button"
              title={$_('buttons.view')}
              on:click={() => onNotificationClick(notification)}
              class="btn btn-link text-decoration-none flex-grow-1 text-start border-0 bg-transparent p-0 d-flex align-items-center gap-3">
              <span class="d-flex align-items-center">
                {#if notification.details.faIcon}
                  <i class="{notification.details.faIcon} fa-fw fa-xl text-primary"></i>
                {:else if notification.details.image || notification.details.username}
                  <img
                    src={notification.details.image ||
                      `https://minotar.net/avatar/${notification.details.username}/64`}
                    alt={$_('buttons.view')}
                    width="30"
                    height="30"
                    class="rounded" />
                {:else}
                  <i class="fa fa-bolt fa-xl fa-fw text-primary"></i>
                {/if}
              </span>

              <div class="fw-normal">
                <span class="text-wrap markdown-renderer"
                  >{@html $_('notifications.' + notification.type, {
                    values: { ...sanitizeObject(notification.details || {}) },
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

            <button
              type="button"
              class="btn-close ms-2"
              aria-label={$_('pages.notifications.delete-notification')}
              use:tooltip={[$_('pages.notifications.delete-notification'), { placement: 'bottom' }]}
              on:click={() => onDeleteNotificationClick(notification.id)}>
            </button>
          </div>
        {/each}
      </div>
    </div>

    {#if $notifications.length === 0}
      <NoContent />
    {/if}
    {#if $notifications.length < $count && $count > 10 + 10 * page}
      <div class="card-footer">
        <button
          class="btn btn-sm btn-outline-primary"
          class:disabled={loadMoreLoading}
          on:click={loadMore}
          >{$_('pages.notifications.show-more', {
            values: { count: $count - $notifications.length },
          })}
        </button>
      </div>
    {/if}
  </div>
</div>

<ConfirmRemoveAllNotificationsModal />

<script context="module">
  import { writable, get } from 'svelte/store';

  import { browser } from '$app/environment';

  import ApiUtil from '$lib/api.util.js';

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
      path: '/api/panel/notifications',
      request: event,
    });

    setNotifications(body.notifications);

    if (browser) {
      body.notifications.slice(0, 5).forEach((notification) => {
        if (notification.status === 'NOT_READ') {
          setTimeout(() => {
            notifications.update((notifications) => {
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

    count.set(parseInt(body.notificationCount));

    return body;
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { formatDistanceToNow } from 'date-fns';
  import { _ } from 'svelte-i18n';
  import * as locales from 'date-fns/locale';
  import { sanitize } from '@jill64/universal-sanitizer';

  import tooltip from '$lib/tooltip.util';

  import ConfirmRemoveAllNotificationsModal, {
    show as showDeleteAllNotificationsModal,
    setCallback as setDeleteAllNotificationsModalCallback,
  } from '$lib/component/modals/ConfirmRemoveAllNotificationsModal.svelte';
  import { onNotificationClick } from '$lib/NotificationManager.js';

  import NoContent from '$lib/component/NoContent.svelte';
  import { currentLanguage } from '$lib/language.util.js';
  import PageActions from '$lib/component/PageActions.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.notifications.title');

  let notificationProcessID = 0;
  let page = 0;
  let loadMoreLoading = false;

  let checkTime = 0;
  let interval;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function getNotifications(id) {
    await delay(1000);

    ApiUtil.get({
      path: '/api/panel/notifications',
      handler: (body) => {
        if (notificationProcessID !== id) {
          return;
        }

        if (body.result === 'ok') {
          setNotifications(body.notifications);

          count.set(parseInt(body.notificationCount));
        }

        setTimeout(() => {
          if (notificationProcessID === id) {
            startnotificationCountdown();
          }
        }, 1000);

        $notifications.forEach((notification) => {
          if (notification.status === 'NOT_READ') {
            setTimeout(() => {
              notifications.update((notifications) => {
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
      },
    });
  }

  function loadMore() {
    loadMoreLoading = true;

    ApiUtil.get({
      path: `/api/panel/notifications/${get(notifications)[get(notifications).length - 1].id}/more`,
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        body.notifications.forEach((notification) => {
          notifications.update((value) => value.insert(value.length, notification));
        });

        loadMoreLoading = false;
      },
    });
  }

  function onDeleteNotificationClick(id) {
    ApiUtil.delete({
      path: `/api/panel/notifications/${id}`,
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        $notifications.forEach((notification) => {
          if (notification.id === id) {
            notifications.update((value) => {
              return value.remove(value.indexOf(notification));
            });

            count.update((value) => {
              value--;

              return value;
            });
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

  function sanitizeObject(obj) {
    return Object.keys(obj).reduce((sanitizedObj, key) => {
      sanitizedObj[key] = sanitize(obj[key]);
      return sanitizedObj;
    }, {});
  }
</script>
