<!--
  Premium-theme license panel (mirrors AddonLicenseCard). Renders only for premium themes;
  status copy + refresh button + purchase link, no "premium" badging anywhere else needed.
-->
{#if theme.premium}
  <div class="card">
    <div class="card-header d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <strong>{$_('pages.theme-detail.license-section')}</strong>
        <LicenseStatusBadge status={theme.licenseStatus} labeled={false} />
      </div>
      {#if theme.licenseStatus !== 'LICENSED'}
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
      {#if theme.licenseStatus === 'LICENSED'}
        <PanoPlusLicenseLine viaPanoPlus={theme.licensePanoPlus === true}>
          <p class="mb-0 text-body-secondary">
            {$_('pages.theme-detail.license-status.active')}
          </p>
        </PanoPlusLicenseLine>
      {:else if theme.licenseStatus === 'NOT_CONNECTED'}
        <p class="mb-3">
          {$_('pages.theme-detail.license-status.not-connected', websiteI18n)}
        </p>
        <a class="btn btn-primary" href="{base}/settings/platform">
          <i class="fa-solid fa-link me-2"></i>
          {$_('buttons.connect-pano-account')}
        </a>
      {:else if theme.licenseStatus === 'EXPIRED'}
        <p class="mb-0">
          {$_('pages.theme-detail.license-status.expired', websiteI18n)}
        </p>
      {:else if theme.licenseStatus === 'NETWORK_ERROR'}
        <p class="mb-0">
          {$_('pages.theme-detail.license-status.network-error', websiteI18n)}
        </p>
      {:else if theme.licenseStatus === 'VERSION_MISMATCH' || theme.licenseStatus === 'AUDIENCE_MISMATCH' || theme.licenseStatus === 'PLATFORM_MISMATCH'}
        <p class="mb-0">
          {$_('pages.theme-detail.license-status.version-mismatch', websiteI18n)}
        </p>
      {:else}
        <!-- NO_PURCHASE, MISSING, NEEDS_REFRESH, JAR_TAMPERED, SIGNATURE_INVALID, UNKNOWN -->
        <p class="mb-3">
          {$_('pages.theme-detail.license-status.no-purchase', websiteI18n)}
        </p>
        {#if purchaseUrl}
          <a class="btn btn-warning" href={purchaseUrl} target="_blank" rel="noopener">
            <i class="fa-solid fa-store me-2"></i>
            {$_('buttons.buy-theme-on-market', websiteI18n)}
          </a>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import { base } from '@panomc/sdk/core/js/basePath.js';
  import { invalidateAll } from '$app/navigation';
  import ApiUtil from '$lib/api.util.js';
  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';
  import LicenseStatusBadge from '$lib/components/LicenseStatusBadge.svelte';
  import PanoPlusLicenseLine from '$lib/components/PanoPlusLicenseLine.svelte';
  import { websiteDisplayHost } from '$lib/website-display.util.js';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  let { theme } = $props();
  let refreshing = $state(false);

  const websiteI18n = $derived({ values: { website: websiteDisplayHost() } });

  // Themes don't currently ship a backend-provided `purchaseUrl`, but we can derive a
  // best-effort link to the theme's panomc.com page using the standard URL shape.
  const purchaseUrl = $derived(theme?.id ? `${PANO_WEBSITE_URL}/themes/${theme.id}` : null);

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      await new Promise((resolve) => {
        ApiUtil.post({
          path: `/panel/themes/${theme.id}/license/refresh`,
          handler: () => resolve(),
        });
      });
      await invalidateAll();
      showSuccessToast('components.toasts.license-refreshed');
    } finally {
      refreshing = false;
    }
  }
</script>
