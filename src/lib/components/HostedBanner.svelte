<!--
  Pano Host banner: the control plane's notices (quota, trial, payment, …) from
  `GET /api/panel/hosted`. Informational only; renders nothing on a self-hosted Pano
  (`hosted: false`), without notices, or when the request fails.
-->
{#if info?.hosted && visibleNotices.length}
  <div class="hosted-banner flex-shrink-0">
    {#each visibleNotices as notice (notice.id)}
      <div
        class="alert {LEVEL_CLASS[notice.level] || LEVEL_CLASS.info} mb-0 rounded-0"
        role="alert">
        <div class="container-fluid d-flex align-items-center">
          <i class="fa-solid {LEVEL_ICON[notice.level] || LEVEL_ICON.info} me-3" aria-hidden="true"
          ></i>
          <div class="flex-grow-1">
            {#if notice.title}
              <b class="me-2">{text(notice, 'title')}</b>
            {/if}
            {text(notice, 'message')}
            {#if notice.url}
              <a
                class="alert-link ms-2"
                href={notice.url}
                rel="noopener noreferrer"
                target="_blank">
                {$_('components.hosted-banner.details')}
                <i class="fa-solid fa-arrow-right ms-1"></i>
              </a>
            {/if}
          </div>
          <button
            class="btn-close ms-3"
            aria-label={$_('components.hosted-banner.dismiss')}
            onclick={() => dismiss(notice.id)}
            type="button"></button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { websiteDisplayHost } from '$lib/website-display.util.js';
  import ApiUtil from '$lib/api.util.js';
  import { hostedMocked, mockHostedInfo } from '$lib/hosted-mock.util.js';

  /** Same cadence as the backend's notice cache. */
  const REFRESH_MS = 5 * 60 * 1000;
  const DISMISSED_KEY = 'pano-host-dismissed-notices';

  const LEVEL_CLASS = {
    info: 'alert-info',
    warning: 'alert-warning',
    critical: 'alert-danger',
  };

  const LEVEL_ICON = {
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
    critical: 'fa-circle-exclamation',
  };

  /** @type {{ hosted: boolean, workloadId?: string, manageUrl?: string, notices: any[] } | null} */
  let info = $state(hostedMocked ? mockHostedInfo() : null);

  /** Where the instance is managed (the control plane's `manageUrl`), else this panel's Pano website. */
  const manageHost = $derived(websiteDisplayHost(info?.manageUrl || undefined));

  /** @type {string[]} */
  let dismissed = $state(readDismissed());

  let visibleNotices = $derived((info?.notices || []).filter((n) => !dismissed.includes(n.id)));

  function readDismissed() {
    try {
      const raw = sessionStorage.getItem(DISMISSED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  /** Dismissed for this browser session only: a notice that still applies comes back next time. */
  function dismiss(id) {
    dismissed = [...dismissed, id];

    try {
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    } catch {
      // Storage blocked: the dismissal lasts until the next reload.
    }
  }

  /**
   * The localised text of a notice when the panel knows its `type`, else the control plane's own
   * English text.
   */
  function text(notice, field) {
    const fallback = notice[field] || '';

    if (!notice.type) return fallback;

    const values = { website: manageHost, ...(notice.data || {}) };

    // The payment notice only carries the grace end; its text needs the days left (or `none`).
    if (notice.type === 'HOST_PAYMENT_PAST_DUE')
      values.days = daysUntil(values.graceExpiresAt) ?? 'none';

    return $_(`components.hosted-banner.notices.${notice.type}.${field}`, {
      default: fallback,
      values,
    });
  }

  /** Whole days (rounded up, as the control plane counts) until [at], or null when past / missing. */
  function daysUntil(at) {
    const left = typeof at === 'number' ? at - Date.now() : 0;

    return left > 0 ? Math.ceil(left / (24 * 60 * 60 * 1000)) : null;
  }

  function load() {
    if (hostedMocked) return;

    ApiUtil.get({
      path: '/api/panel/hosted',
      handler: (body) => {
        if (body && body.result === 'ok') {
          info = body;
        }
      },
    });
  }

  onMount(() => {
    load();

    const timer = setInterval(load, REFRESH_MS);

    return () => clearInterval(timer);
  });
</script>
