<div class="container vstack gap-3">
  <!-- Action Menu -->

  <PageActions leftClasses="d-lg-flex d-none" middleClasses="d-lg-flex d-none">
    <div slot="right">
      {#if $notifications.length !== 0}
        <button
          type="button"
          title={$_('pages.notifications.delete-all')}
          aria-label={$_('pages.notifications.delete-all')}
          class="btn btn-link link-danger"
          on:click={() => onDeleteAllClick()}>
          <i class="fa fa-trash"></i>
        </button>
      {/if}
    </div>
  </PageActions>

  <!-- All Notifications -->

  <div class="card">
    <div class="card-header">{$_('pages.notifications.title')}</div>
    <div class="card-body vstack gap-3" class:d-none={$notifications.length === 0}>
      <div class="list-group">
        {#each $notifications as notification (notification.id)}
          <div
            class="panel-notification-row list-group-item list-group-item-action d-flex align-items-center gap-3 text-wrap"
            class:notification-unread={isPanelNotificationUnread(notification)}>
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
                    src={sanitizeImageSrc(
                      notification.details.image ||
                        `/api/profile/picture/${notification.details.username}?${$avatarVersion}`,
                      '/api/server/icon/default',
                    )}
                    alt={$_('buttons.view')}
                    width="30"
                    height="30"
                    class="rounded" />
                {:else if panelNotificationServerIcon(notification)}
                  <!-- The server the notification is about, by id; one without an icon gets the default. -->
                  <img
                    src={panelNotificationServerIcon(notification)}
                    use:imageFallback={base + '/assets/img/server-icon.png'}
                    alt={notification.details?.serverName || $_('buttons.view')}
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
              title={$_('pages.notifications.delete-notification')}
              on:click={() => onDeleteNotificationClick(notification.id)}>
            </button>
          </div>
        {/each}
      </div>
    </div>

    {#if $notifications.length === 0}
      <NoContent />
    {/if}
    <!-- Scrolling near the end loads the next ten; the spinner is only there while it does. -->
    {#if hasMore}
      <div class="card-footer d-flex justify-content-center py-3" bind:this={sentinel}>
        {#if loadMoreLoading}
          <span
            class="spinner-border spinner-border-sm text-primary"
            role="status"
            aria-hidden="true"></span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<ConfirmRemoveAllNotificationsModal />

<script context="module">
  import { writable, get } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';

  const notifications = writable([]);
  const count = writable(0);
  /**
   * The unread count the backend reported after its last answer here, which marks what it sends as
   * read: the navbar's badge takes it, or it would keep counting what was just read.
   *
   * @type {import('svelte/store').Writable<number | null>}
   */
  const notReadCount = writable(null);

  /** @param {any} body */
  function takeNotReadCount(body) {
    const value = Number(body?.notReadCount);

    if (body && body.notReadCount != null && Number.isFinite(value)) {
      notReadCount.set(Math.max(0, value));
    }
  }

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

    // A fresh first page on every visit: the store outlives the page, and merging into what an
    // earlier visit left behind kept rows (and their unread look) from a list that is gone.
    notifications.set(body.notifications || []);

    count.set(parseInt(body.notificationCount));
    takeNotReadCount(body);

    return body;
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { formatDistanceToNow } from 'date-fns';
  import { _ } from 'svelte-i18n';
  import * as locales from 'date-fns/locale';
  import { sanitize } from '@jill64/universal-sanitizer';
  import { sanitizeImageSrc } from '$lib/security.util.js';

  import ConfirmRemoveAllNotificationsModal, {
    show as showDeleteAllNotificationsModal,
    setCallback as setDeleteAllNotificationsModalCallback,
  } from '$lib/components/modals/ConfirmRemoveAllNotificationsModal.svelte';
  import { onNotificationClick } from '$lib/NotificationManager.js';
  import { base } from '$app/paths';
  import {
    imageFallback,
    isPanelNotificationUnread,
    panelNotificationServerIcon,
  } from '$lib/panelNotification.util.js';

  import NoContent from '$lib/components/NoContent.svelte';
  import { currentLanguage } from '$lib/language.util.js';
  import { avatarVersion } from '$lib/Store';
  import PageActions from '$lib/components/PageActions.svelte';
  import { onPanelNotificationRefresh } from '$lib/panelRealtime.js';

  const pageTitle = getContext('pageTitle');
  const notificationCount = getContext('notificationCount');

  $: if ($notReadCount != null) {
    notificationCount?.set($notReadCount);
  }

  pageTitle.set('pages.notifications.title');

  let listFetchInFlight = false;
  let listFetchPending = false;
  let listFetchGeneration = 0;

  let loadMoreLoading = false;

  /** @type {HTMLDivElement | undefined} */
  let sentinel;
  /** @type {IntersectionObserver | undefined} */
  let observer;

  $: hasMore = $notifications.length < $count;

  // (Re)watch the footer whenever it is (re)rendered; it only exists while there is more.
  $: if (observer) {
    observer.disconnect();

    if (sentinel) {
      observer.observe(sentinel);
    }
  }

  /**
   * How long a notification that arrived unread keeps its unread look. The backend marked it read
   * the moment it was fetched; this is only so the reader sees which ones are new.
   */
  const UNREAD_VISIBLE_MS = 3000;

  /** id → the timer that turns that row read, so every row gets exactly one. */
  const readTimers = new Map();

  // Every row that shows up unread -- the first page, a live refresh, the next page while
  // scrolling -- fades to read on its own clock.
  $: scheduleRead($notifications);

  /**
   * @param {Array<{ id: number, status: string }>} list
   */
  function scheduleRead(list) {
    for (const notification of list) {
      if (!isPanelNotificationUnread(notification) || readTimers.has(notification.id)) {
        continue;
      }

      const id = notification.id;

      readTimers.set(
        id,
        setTimeout(() => {
          notifications.update((rows) =>
            rows.map((row) => (row.id === id ? { ...row, status: 'READ' } : row)),
          );
        }, UNREAD_VISIBLE_MS),
      );
    }
  }

  let checkTime = 0;
  let interval;

  function runNextListIfPending() {
    if (listFetchPending) {
      listFetchPending = false;
      fetchNotificationsListOnce();
    }
  }

  function fetchNotificationsListOnce() {
    if (listFetchInFlight) {
      listFetchPending = true;
      return;
    }
    const gen = listFetchGeneration;
    listFetchInFlight = true;

    ApiUtil.get({
      path: '/api/panel/notifications',
      handler: (body) => {
        listFetchInFlight = false;
        if (gen !== listFetchGeneration) {
          runNextListIfPending();
          return;
        }

        if (body.result === 'ok') {
          setNotifications(body.notifications);

          count.set(parseInt(body.notificationCount));
          takeNotReadCount(body);
        }

        runNextListIfPending();
      },
    });
  }

  /** The ten older than the last row, appended; ones already shown are not shown twice. */
  function loadMore() {
    const list = get(notifications);
    const last = list[list.length - 1];

    if (loadMoreLoading || !last || list.length >= get(count)) {
      return;
    }

    loadMoreLoading = true;

    ApiUtil.get({
      path: `/api/panel/notifications/${last.id}/more`,
      handler: (body, reject) => {
        loadMoreLoading = false;

        if (body.error) {
          reject();

          return;
        }

        const older = body.notifications || [];

        takeNotReadCount(body);

        notifications.update((rows) => {
          const shown = new Set(rows.map((row) => row.id));

          return [...rows, ...older.filter((row) => !shown.has(row.id))];
        });

        // Nothing older came back although the count says there is more: the count was stale.
        if (older.length === 0) {
          count.set(get(notifications).length);
        }
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

        takeNotReadCount(body);

        if (!get(notifications).some((notification) => notification.id === id)) {
          return;
        }

        notifications.update((rows) => rows.filter((notification) => notification.id !== id));
        count.update((value) => Math.max(0, value - 1));

        // The row that was removed makes room for the next older one: fetch it rather than let
        // the list shrink while there are more behind it.
        if (get(notifications).length < get(count)) {
          loadMore();
        }
      },
    });
  }

  function stopnotificationCountdown() {
    listFetchGeneration++;
    listFetchPending = false;
    clearInterval(interval);
  }

  function clearReadTimers() {
    readTimers.forEach((timer) => clearTimeout(timer));
    readTimers.clear();
  }

  function getTime(check, time, locale) {
    return formatDistanceToNow(time, { addSuffix: true });
  }

  function onDeleteAllClick() {
    stopnotificationCountdown();

    showDeleteAllNotificationsModal();
  }

  let offPanelNotificationRefresh;

  onMount(() => {
    // A margin, so the next page is asked for before the reader actually hits the end.
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '200px 0px' },
    );

    if (sentinel) {
      observer.observe(sentinel);
    }

    offPanelNotificationRefresh = onPanelNotificationRefresh(() => fetchNotificationsListOnce());
    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    offPanelNotificationRefresh?.();
    stopnotificationCountdown();
    observer?.disconnect();
    // A row whose timer never fired stays unread in the store; the next visit starts over anyway.
    clearReadTimers();
  });

  setDeleteAllNotificationsModalCallback(() => {
    fetchNotificationsListOnce();
  });

  function sanitizeObject(obj) {
    return Object.keys(obj).reduce((sanitizedObj, key) => {
      // A detail can be a list — SM-48 sends the names of the plugins that have an update —
      // and the sanitizer only takes text.
      const value = obj[key];

      sanitizedObj[key] = sanitize(Array.isArray(value) ? value.join(', ') : value);
      return sanitizedObj;
    }, {});
  }
</script>
