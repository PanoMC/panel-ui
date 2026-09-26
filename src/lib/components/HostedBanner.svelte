<!--
  Pano Host banner: a "managed by Pano Host" link and the control plane's notices (quota, trial,
  scheduled deletion, …) from `GET /api/panel/hosted`. Informational only; renders nothing on a
  self-hosted Pano (`hosted: false`) or when the request fails.
-->
{#if info?.hosted}
  <div class="hosted-banner flex-shrink-0">
    <div class="alert alert-light border-0 border-bottom mb-0 rounded-0 py-1 small" role="status">
      <div class="container-fluid d-flex align-items-center">
        <i class="fa-solid fa-cloud me-2 text-primary"></i>
        <span class="text-muted">{$_('components.hosted-banner.managed')}</span>
        {#if info.manageUrl}
          <a
            class="alert-link ms-2"
            href={info.manageUrl}
            rel="noopener noreferrer"
            target="_blank">
            {$_('components.hosted-banner.manage')}
            <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
          </a>
        {/if}
      </div>
    </div>

    {#each visibleNotices as notice (notice.id)}
      <div
        class="alert {LEVEL_CLASS[notice.level] || LEVEL_CLASS.info} mb-0 rounded-0"
        role="alert">
        <div class="container-fluid d-flex align-items-center">
          <i class="fa-solid {LEVEL_ICON[notice.level] || LEVEL_ICON.info} me-3"></i>
          <div class="flex-grow-1">
            {#if notice.title}
              <strong class="me-2">{text(notice, 'title')}</strong>
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
  import ApiUtil from '$lib/api.util.js';

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
  let info = $state(null);

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

    return $_(`components.hosted-banner.notices.${notice.type}.${field}`, {
      default: fallback,
      values: notice.data || {},
    });
  }

  function load() {
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
