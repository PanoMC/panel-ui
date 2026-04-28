<div class="toast-container position-fixed bottom-0 end-0 p-3 d-xl-block d-none">
  {#each $notifications as notification, index (notification)}
    <article
      id="notificationToast{notification.id}"
      class="toast position-relative"
      aria-live="assertive"
      aria-atomic="true">
      <div class="toast-header text-bg-primary">
        <strong class="me-auto">
          {$_('components.notification-container.notification')}
        </strong>
        <small>
          {getTime(
            checkTime,
            parseInt(notification.createdAt),
            locales[$currentLanguage.dateFnsCode],
          )}
        </small>

        <button
          type="button"
          class="btn-close btn-close-white position-relative z-3"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="toast"
          on:click|stopPropagation>
        </button>
      </div>

      <div class="toast-body">
        <div
          class="fw-normal list-group-item list-group-item-action d-flex align-items-center gap-3 text-wrap">
          <button
            type="button"
            use:tooltip={[$_('buttons.view')]}
            on:click={() => onNotificationClick(notification)}
            class="text-start border-0 bg-transparent p-0 d-flex align-items-center gap-3">
            <span class="d-flex align-items-center">
              {#if notification.details.faIcon}
                <i class="{notification.details.faIcon} fa-fw"></i>
              {:else if notification.details.image || notification.details.username}
                <img
                  src={sanitizeImageSrc(
                    notification.details.image ||
                      `/api/profile/picture/${notification.details.username}?${$avatarVersion}`,
                    '/api/server/icon/default'
                  )}
                  alt={$_('buttons.view')}
                  width="48"
                  height="48"
                  class="rounded" />
              {:else}
                <i class="fa fa-fw fa-bolt"></i>
              {/if}
            </span>

            <span class="text-start">
              <span class="text-wrap markdown-renderer text-break">
                {@html $_('notifications.' + notification.type, {
                  values: { ...sanitizeObject(notification.details || {}) },
                })}
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- Invisible button covering whole area without creating spacing -->
      <button
        type="button"
        class="stretched-link p-0 border-0 bg-transparent position-absolute top-0 start-0 w-100 h-100"
        aria-label={$_('buttons.view')}
        on:click={() => onClick(notification)}>
      </button>
    </article>
  {/each}
</div>

<script context="module">
  import { tick } from 'svelte';
  import { get, writable } from 'svelte/store';

  const notifications = writable([]);
  const notificationToasts = writable({});

  Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);

    return this;
  };

  Array.prototype.remove = function (index) {
    this.splice(index, 1);

    return this;
  };

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  function deleteFromNotifications(id) {
    notifications.update((notifications) => {
      const foundNotification = notifications.find((notification) => notification.id === id);

      notifications.remove(notifications.indexOf(foundNotification));
      delete notificationToasts[id];

      return notifications;
    });
  }

  export async function show(id) {
    await tick();

    const notificationElement = document.getElementById('notificationToast' + id);

    if (notificationElement) {
      const toast = new window.bootstrap.Toast(notificationElement);

      notificationToasts[id] = toast;

      toast.show();

      notificationElement.addEventListener('hidden.bs.toast', () => {
        deleteFromNotifications(id);
      });
    }
  }

  export async function hide(id) {
    notificationToasts[id].hide();
    deleteFromNotifications(id);
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
  import * as locales from 'date-fns/locale';
  import { sanitize } from '@jill64/universal-sanitizer';
  import { sanitizeImageSrc } from '$lib/security.util.js';

  import { quickNotifications, avatarVersion } from '$lib/Store';
  import ApiUtil from '$lib/api.util';
  import { formatDistanceToNow } from 'date-fns';
  import { onNotificationClick } from '$lib/NotificationManager.js';
  import { currentLanguage } from '$lib/language.util.js';
  import { onPanelNotificationRefresh } from '$lib/panelRealtime.js';

  let checkTime = 0;
  let interval;
  let quickFetchInFlight = false;
  let quickFetchPending = false;

  const notificationCount = getContext('notificationCount');

  function getTime(check, time, locale) {
    return formatDistanceToNow(time, { addSuffix: true, locale });
  }

  function addNotification(notification) {
    notifications.update((notifications) => {
      notifications.push(notification);

      return notifications;
    });

    show(notification.id);
  }

  function normalizePanelNotificationStatus(n) {
    if (n == null || n.status == null) {
      return n;
    }
    const s = n.status;
    if (typeof s === 'string') {
      return n;
    }
    if (typeof s === 'object' && s !== null) {
      return { ...n, status: s.name != null ? String(s.name) : s };
    }
    return n;
  }

  /**
   * Replace store with the server snapshot (correct read/unread for navbar + toasts) and
   * show a toast only for new NOT_READ ids (avoids duplicating the old poller merge bugs).
   */
  function setNotifications(newNotifications) {
    const list = Array.isArray(newNotifications) ? newNotifications : [];
    const prev = get(quickNotifications);
    const prevById = new Map(prev.map((p) => [p.id, p]));

    const next = list.map((n) => normalizePanelNotificationStatus(n));
    quickNotifications.set(next);

    for (const notification of next) {
      if (notification.status !== 'NOT_READ') {
        continue;
      }
      const was = prevById.get(notification.id);
      if (was) {
        continue;
      }
      addNotification(notification);
    }
  }

  function runNextQuickFetchIfPending() {
    if (quickFetchPending) {
      quickFetchPending = false;
      fetchQuickNotificationsOnce();
    }
  }

  function fetchQuickNotificationsOnce() {
    if (quickFetchInFlight) {
      quickFetchPending = true;
      return;
    }
    quickFetchInFlight = true;

    ApiUtil.get({
      path: '/api/panel/notifications/quick',
      handler: (body, reject) => {
        quickFetchInFlight = false;
        if (body.error) {
          reject();
          runNextQuickFetchIfPending();
          return;
        }

        setNotifications(body.notifications);

        notificationCount.set(body.notificationCount);
        runNextQuickFetchIfPending();
      },
    });
  }

  function markRead(id) {
    ApiUtil.post({
      path: `/api/panel/notifications/${id}/read`,
      handler: () => {},
    });
  }

  function onClick(notification) {
    markRead(notification.id);
    onNotificationClick(notification);
    hide(notification.id);
  }

  let offPanelNotificationRefresh;

  onMount(() => {
    fetchQuickNotificationsOnce();
    offPanelNotificationRefresh = onPanelNotificationRefresh(() => fetchQuickNotificationsOnce());

    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    offPanelNotificationRefresh?.();
    clearInterval(interval);
  });

  function sanitizeObject(obj) {
    return Object.keys(obj).reduce((sanitizedObj, key) => {
      sanitizedObj[key] = sanitize(obj[key]);
      return sanitizedObj;
    }, {});
  }
</script>
