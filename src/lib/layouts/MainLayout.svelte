<Sidebar />

<!--  Main  -->
<main class="w-100 min-vh-100 overflow-auto pb-5">
  {#if $showDevModeAlert}
    <div class="alert alert-warning alert-dismissible fade show rounded-0 border-0 mb-0 shadow-sm" role="alert">
      <div class="container-fluid d-flex align-items-center">
        <i class="fa-solid fa-triangle-exclamation me-3 fa-lg"></i>
        <div>
          <strong class="me-2">{$_('components.alerts.dev-mode-title')}</strong>
          <span class="small py-1">{$_('components.alerts.dev-mode-description')}</span>
        </div>
        <button type="button" class="btn-close shadow-none" aria-label="Close" on:click={dismissDevModeAlert}></button>
      </div>
    </div>
  {/if}

  <Navbar />

  <slot />
</main>

<script context="module">
  import Sidebar from '$lib/component/Sidebar.svelte';
  import Navbar from '$lib/component/Navbar.svelte';
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import ApiUtil from '$lib/api.util.js';

  const showDevModeAlert = getContext('showDevModeAlert');

  function dismissDevModeAlert() {
    $showDevModeAlert = false;
    ApiUtil.post({
      path: '/api/panel/dashboard/closeDevModeAlert',
      handler: () => {},
    });
  }
</script>
