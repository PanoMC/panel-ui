<!--
  Freemium license panel: the tier catalogue and what this platform owns live in the store, so the
  panel embeds the view from the website instead of duplicating the data.

  The platform mints a fresh single-use token on every mount, which is why this refetches each time
  the page opens rather than caching the URL.
-->
{#if addon.freemium}
  <div class="card">
    <div class="card-header d-flex align-items-center justify-content-between gap-2">
      <strong>{$_('components.license-embed.title')}</strong>
      <!--
        Buying a package does not notify the platform, so a plugin that checked its tier at startup
        stays locked until this re-checks. Mirrors the premium license refresh; deliberately shows
        no owned-package state of its own — the embed below is the single source for that.
      -->
      <button
        type="button"
        class="btn btn-sm btn-link"
        onclick={refreshTiers}
        disabled={refreshing || notConnected}
        title={$_('components.license-embed.refresh-hint')}
        aria-label={$_('buttons.refresh')}>
        {#if refreshing}
          <i class="fa-solid fa-spinner fa-spin me-1"></i>
        {:else}
          <i class="fa-solid fa-rotate me-1"></i>
        {/if}
        {$_('buttons.refresh')}
      </button>
    </div>
    <div class="card-body">
      {#if loading}
        <div class="text-body-secondary small">
          <i class="fa-solid fa-spinner fa-spin me-2"></i>
          {$_('components.license-embed.loading')}
        </div>
      {:else if notConnected}
        <div class="d-flex flex-column gap-2">
          <div class="small text-body-secondary">
            {$_('components.license-embed.not-connected', {
              values: { website: websiteDisplayHost() },
            })}
          </div>
          <a class="btn btn-sm btn-secondary align-self-start" href="{base}/settings/platform">
            {$_('components.license-embed.connect')}
          </a>
        </div>
      {:else if error}
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div class="small text-body-secondary">
            {$_('components.license-embed.error')}
          </div>
          <button type="button" class="btn btn-sm btn-link" onclick={load}>
            {$_('buttons.refresh')}
          </button>
        </div>
      {:else if url}
        <!--
          allow-same-origin keeps the frame on its own (website) origin rather than an opaque
          one. Without it the embed cannot touch storage, SvelteKit hydration throws, and the
          height message never fires. It grants nothing over the panel: the embed is a different
          origin, so same-origin access still stops at the website.
        -->
        <iframe
          bind:this={frameElement}
          src={url}
          title={$_('components.license-embed.title')}
          referrerpolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          style="width: 100%; height: {height}px; border: 0; display: block;"></iframe>
      {/if}
    </div>
  </div>
{/if}

<script>
  import { getContext, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import { websiteDisplayHost } from '$lib/website-display.util.js';
  import { currentLanguage } from '$lib/language.util.js';

  let { addon } = $props();

  /** Same context the store flow reads to hand the panel's look to the website. */
  const panelTheme = getContext('panelTheme');

  let url = $state(null);
  let loading = $state(true);
  let error = $state(false);
  let notConnected = $state(false);
  let refreshing = $state(false);
  /** Starting height; the embed reports its real height over postMessage. */
  let height = $state(160);
  let frameElement = $state(null);

  function load() {
    loading = true;
    error = false;
    notConnected = false;

    const theme = (panelTheme && get(panelTheme)) === 'light' ? 'light' : 'dark';
    const hl = get(currentLanguage)?.code || '';

    ApiUtil.get({
      path:
        `/api/panel/plugins/${addon.id}/license/embed` +
        `?theme=${encodeURIComponent(theme)}&hl=${encodeURIComponent(hl)}`,
      handler: (body) => {
        loading = false;

        if (body?.error === 'PANO_NOT_CONNECTED') {
          notConnected = true;

          return;
        }

        if (body?.error || !body?.data?.url) {
          error = true;

          return;
        }

        url = body.data.url;
      },
    });
  }

  /**
   * Asks the platform to re-read what this account owns, then reloads the embed with a fresh token
   * so the store view reflects the new state. Shows only success/failure — never a package list.
   */
  function refreshTiers() {
    if (refreshing) return;

    refreshing = true;

    ApiUtil.post({
      path: `/api/panel/plugins/${addon.id}/license/tiers/refresh`,
      handler: (body) => {
        refreshing = false;

        if (body?.error === 'PANO_NOT_CONNECTED') {
          notConnected = true;

          return;
        }

        if (body?.error) {
          showToast('components.toasts.tiers-refresh-failed');

          return;
        }

        showToast('components.toasts.tiers-refreshed');

        // New token, new iframe: the embed re-reads the catalogue and ownership server-side.
        url = null;
        load();
      },
    });
  }

  onMount(() => {
    if (!addon.freemium) return;

    load();

    const onMessage = (event) => {
      // Identity check first: only our own frame may resize itself, whatever it claims to be.
      if (!frameElement || event.source !== frameElement.contentWindow) return;
      // And it must still come from the configured website origin.
      if (!PANO_WEBSITE_URL || event.origin !== new URL(PANO_WEBSITE_URL).origin) return;
      if (event.data?.type !== 'pano-license-embed:height') return;

      const reported = Number(event.data.height);

      if (Number.isFinite(reported) && reported > 0) {
        // Cap it so a misbehaving embed cannot grow the panel page without bound.
        height = Math.min(Math.ceil(reported) + 2, 2000);
      }
    };

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  });
</script>
