<!--
  DRM license status: plain icon + tooltip (no colored pill/badge).

  On error-style statuses the key icon is red; LICENSED uses a green key.
  Optional `labeled` adds a short caption next to the icon (still not a badge).
-->
{#if status && status !== 'NOT_PREMIUM'}
  <span
    class="d-inline-flex align-items-center gap-1"
    use:tooltip={[
      $_(entry.tooltipKey, { ...websiteI18n, default: entry.tooltipKey }),
      { placement: 'bottom' },
    ]}>
    <i class="fa-solid {entry.icon} {entry.iconClass}" aria-hidden="true"></i>
    {#if labeled}
      <span class="small text-body-secondary">{$_(entry.labelKey, { ...websiteI18n, default: entry.labelKey })}</span>
    {/if}
  </span>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  const websiteI18n = $derived({ values: { website: websiteDisplayHost() } });

  /**
   * @typedef {'NOT_PREMIUM' | 'LICENSED' | 'MISSING' | 'NO_PURCHASE' | 'EXPIRED' | 'NETWORK_ERROR' | 'JAR_TAMPERED' | 'SIGNATURE_INVALID' | 'VERSION_MISMATCH' | 'AUDIENCE_MISMATCH' | 'PLATFORM_MISMATCH' | 'NOT_CONNECTED' | 'NEEDS_REFRESH' | 'UNKNOWN'} LicenseStatus
   */

  let { status, labeled = false } = $props();

  const entry = $derived(mapStatus(status));

  function mapStatus(s) {
    switch (s) {
      case 'LICENSED':
        return {
          icon: 'fa-key',
          iconClass: 'text-success',
          labelKey: 'components.license-status.LICENSED',
          tooltipKey: 'components.license-status.LICENSED-tooltip',
        };
      case 'MISSING':
      case 'NO_PURCHASE':
      case 'NEEDS_REFRESH':
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.NO_PURCHASE',
          tooltipKey: 'components.license-status.NO_PURCHASE-tooltip',
        };
      case 'EXPIRED':
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.EXPIRED',
          tooltipKey: 'components.license-status.EXPIRED-tooltip',
        };
      case 'NETWORK_ERROR':
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.NETWORK_ERROR',
          tooltipKey: 'components.license-status.NETWORK_ERROR-tooltip',
        };
      case 'NOT_CONNECTED':
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.NOT_CONNECTED',
          tooltipKey: 'components.license-status.NOT_CONNECTED-tooltip',
        };
      case 'JAR_TAMPERED':
      case 'SIGNATURE_INVALID':
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.JAR_TAMPERED',
          tooltipKey: 'components.license-status.JAR_TAMPERED-tooltip',
        };
      case 'VERSION_MISMATCH':
      case 'AUDIENCE_MISMATCH':
      case 'PLATFORM_MISMATCH':
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.VERSION_MISMATCH',
          tooltipKey: 'components.license-status.VERSION_MISMATCH-tooltip',
        };
      default:
        return {
          icon: 'fa-key',
          iconClass: 'text-danger',
          labelKey: 'components.license-status.UNKNOWN',
          tooltipKey: 'components.license-status.UNKNOWN-tooltip',
        };
    }
  }
</script>
