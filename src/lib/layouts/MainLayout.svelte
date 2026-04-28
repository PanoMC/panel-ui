<style>
  .main-container {
    background-image: radial-gradient(circle at 50% 0%, var(--bs-body-bg) 0%, transparent 500%);
    background-attachment: fixed;
  }

  /*
   * Okunmamış vurgu: alan renk değişimi `::after` + opacity ile “solarak” gider (sınıf kalkınca 0.8s+).
   */
  :global(.panel-notification-row.list-group-item) {
    position: relative;
    z-index: 0;
    border-left: 1px solid transparent;
    transition:
      border-left-color 0.75s ease,
      border-left-width 0.75s ease,
      box-shadow 0.75s ease;
  }

  :global(.panel-notification-row.list-group-item::after) {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      var(--bs-primary-bg-subtle, rgba(13, 110, 253, 0.3)) 0%,
      rgba(13, 110, 253, 0.08) 78%,
      transparent 100%
    );
    box-shadow: inset 0 0 0 1px rgba(13, 110, 253, 0.2);
    opacity: 0;
    transition: opacity 0.85s ease, filter 0.25s ease;
  }

  :global(
    .panel-notification-row.list-group-item.notification-unread:not(.active)::after
  ) {
    opacity: 1;
  }

  :global(
    .panel-notification-row.list-group-item.notification-unread:not(.active)
  ) {
    border-left: 4px solid var(--bs-primary, #0d6efd);
    box-shadow: 0 0 0 1px rgba(13, 110, 253, 0.1);
  }

  :global(
    .panel-notification-row.list-group-item.notification-unread:not(.active):hover::after
  ) {
    filter: brightness(1.04);
  }

  :global(.panel-notification-row > *) {
    position: relative;
    z-index: 1;
  }

  :global(
    .panel-notification-row.list-group-item.notification-unread .markdown-renderer
  ) {
    font-weight: 700;
    transition: font-weight 0.5s ease;
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
