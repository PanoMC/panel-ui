<!--
  Premium license panel: icon + guidance when attention is needed;
  LICENSED shows green key + short confirmation (no expiry / refresh clutter).
-->
{#if addon.premium}
  <div class="card">
    <div class="card-header d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <strong>{$_('pages.addon-detail.license-section')}</strong>
        <LicenseStatusBadge status={addon.licenseStatus} labeled={false} />
      </div>
      {#if addon.licenseStatus !== 'LICENSED'}
        <button
          type="button"
          class="btn btn-sm btn-link"
          onclick={refresh}
          disabled={refreshing}
          aria-label={$_('buttons.refresh')}>
          {#if refreshing}
            <i class="fa-solid fa-spinner fa-spin me-1"></i>
          {:else}
            <i class="fa-solid fa-rotate me-1"></i>
          {/if}
          {$_('buttons.refresh')}
        </button>
      {/if}
    </div>
    <div class="card-body">
      {#if addon.licenseStatus === 'LICENSED'}
        <p class="mb-0 text-body-secondary">
          {$_('pages.addon-detail.license.active')}
        </p>
      {:else}
        {#if addon.licenseStatus === 'NO_PURCHASE' || addon.licenseStatus === 'MISSING'}
          <p class="mb-3">
            {$_('pages.addon-detail.license.no-purchase', websiteI18n)}
          </p>
          {#if addon.purchaseUrl}
            <a class="btn btn-warning" href={addon.purchaseUrl} target="_blank" rel="noopener">
              <i class="fa-solid fa-store me-2"></i>
              {$_('buttons.buy-addon-on-market', websiteI18n)}
            </a>
          {/if}
        {:else if addon.licenseStatus === 'NEEDS_REFRESH'}
          <p class="mb-0 text-body-secondary">
            {$_('pages.addon-detail.license.needs-refresh', websiteI18n)}
          </p>
        {:else if addon.licenseStatus === 'NOT_CONNECTED'}
          <p class="mb-3">
            {$_('pages.addon-detail.license.not-connected', websiteI18n)}
          </p>
          <a class="btn btn-primary" href="{base}/settings/platform">
            <i class="fa-solid fa-link me-2"></i>
            {$_('buttons.connect-pano-account')}
          </a>
        {:else if addon.licenseStatus === 'EXPIRED'}
          <p class="mb-3">
            {$_('pages.addon-detail.license.expired')}
          </p>
        {:else if addon.licenseStatus === 'NETWORK_ERROR'}
          <p class="mb-0">
            {$_('pages.addon-detail.license.network-error', websiteI18n)}
          </p>
        {:else if addon.licenseStatus === 'JAR_TAMPERED' || addon.licenseStatus === 'SIGNATURE_INVALID'}
          <p class="mb-0">
            {$_('pages.addon-detail.license.tampered', websiteI18n)}
          </p>
        {:else if addon.licenseStatus === 'VERSION_MISMATCH'}
          <p class="mb-0">
            {$_('pages.addon-detail.license.version-mismatch', websiteI18n)}
          </p>
        {:else}
          <p class="mb-0">
            {addon.licenseFailureMessage ||
              $_('components.license-status.UNKNOWN-tooltip', {
                ...websiteI18n,
                default: 'Unknown license issue',
              })}
          </p>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';
  import { invalidateAll } from '$app/navigation';
  import ApiUtil from '$lib/api.util.js';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import LicenseStatusBadge from '$lib/components/LicenseStatusBadge.svelte';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  let { addon } = $props();
  let refreshing = $state(false);

  const websiteI18n = $derived({ values: { website: websiteDisplayHost() } });

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      await new Promise((resolve) => {
        ApiUtil.post({
          path: `/api/panel/plugins/${addon.id}/license/refresh`,
          handler: () => resolve(),
        });
      });
      await invalidateAll();
      showToast('components.toasts.license-refreshed');
    } finally {
      refreshing = false;
    }
  }
</script>
