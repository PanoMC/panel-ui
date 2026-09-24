<style>
  .main-container {
    background-image: radial-gradient(circle at 50% 0%, var(--bs-body-bg) 0%, transparent 500%);
    background-attachment: fixed;
  }

  /*
   * Unread notifications: a soft tint and a small dot at the start of the row, both fading out
   * once the row counts as read. Nothing about the row's size changes (no border that grows, no
   * text that turns bold), so a row turning read never makes the list jump.
   */
  :global(.panel-notification-row.list-group-item) {
    position: relative;
    /* Room for the dot on every row, read or not, so nothing moves when one turns read. */
    padding-left: 1.75rem;
    transition: background-color 0.6s ease;
  }

  :global(.panel-notification-row.list-group-item::before) {
    content: '';
    position: absolute;
    top: 50%;
    left: 0.7rem;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    /* The theme's readable shade of primary: plain primary is nearly invisible on the dark theme. */
    background-color: var(--bs-primary-text-emphasis, var(--bs-primary));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--bs-primary-text-emphasis, var(--bs-primary)) 22%, transparent);
    opacity: 0;
    transform: translateY(-50%) scale(0.2);
    transition:
      opacity 0.45s ease,
      transform 0.45s ease;
    pointer-events: none;
  }

  :global(.panel-notification-row.list-group-item.notification-unread:not(.active)) {
    background-color: color-mix(in srgb, var(--bs-primary-text-emphasis, var(--bs-primary)) 9%, transparent);
  }

  :global(.panel-notification-row.list-group-item.notification-unread:not(.active):hover) {
    background-color: color-mix(in srgb, var(--bs-primary-text-emphasis, var(--bs-primary)) 14%, transparent);
  }

  :global(.panel-notification-row.list-group-item.notification-unread:not(.active)::before) {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }

  :global(.panel-notification-row.list-group-item.notification-unread .markdown-renderer) {
    color: var(--bs-emphasis-color);
  }

  :global(.panel-notification-row .markdown-renderer) {
    transition: color 0.6s ease;
  }
</style>

<Sidebar />

<!--  Main  -->
<main class="main-container d-flex h-100 flex-grow-1 flex-column overflow-auto">
  {#if $siteInfo?.isDemo}
    <div class="alert alert-info fade show mb-0" role="alert">
      <div class="container-fluid d-flex align-items-center">
        <i class="fa-solid fa-circle-info me-3"></i>
        <div>
          <strong class="me-2">{$_('components.alerts.demo-mode-title')}</strong>
          {$_('components.alerts.demo-mode-description')}
        </div>
      </div>
    </div>
  {/if}
  {#if $showDevModeAlert}
    <div
      class="alert alert-warning alert-dismissible fade show mb-0"
      role="alert">
      <div class="container-fluid d-flex align-items-center">
        <i class="fa-solid fa-triangle-exclamation me-3"></i>
        <div>
          <strong class="me-2">{$_('components.alerts.dev-mode-title')}</strong>
          {$_('components.alerts.dev-mode-description')}
        </div>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
          on:click={dismissDevModeAlert}></button>
      </div>
    </div>
  {/if}

  <Navbar />

  <slot />
</main>

<script context="module">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Navbar from '$lib/components/Navbar.svelte';
</script>

<script>
  import ApiUtil from '$lib/api.util.js';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { invalidateAll } from '$app/navigation';

  const showDevModeAlert = getContext('showDevModeAlert');
  const siteInfo = getContext('siteInfo');

  function dismissDevModeAlert() {
    $showDevModeAlert = false;
    ApiUtil.post({
      path: '/api/panel/dashboard/closeDevModeAlert',
      handler: async () => {
        await invalidateAll();
      },
    });
  }
</script>
