<style>
  .main-container {
    background-image: radial-gradient(circle at 50% 0%, var(--bs-body-bg) 0%, transparent 500%);
    background-attachment: fixed;
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
