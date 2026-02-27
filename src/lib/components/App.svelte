<svelte:head>
  {#if dev}
    <link rel="stylesheet" href="/panel/style.css" />
  {/if}
</svelte:head>

<PageLoader />

<slot />

<script>
  import { browser, dev } from '$app/environment';
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import PageLoader from '$lib/components/PageLoader.svelte';
  import "@theme-style";

  function loadPopOver() {
    if (window.bootstrap) {
      const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
      popoverTriggerList.forEach(
        (popoverTriggerEl) => new window.bootstrap.Popover(popoverTriggerEl),
      );
      return;
    }

    setTimeout(() => {
      loadPopOver();
    }, 1);
  }

  if (browser) {
    import('$lib/init.libs.js');

    window.onload = () => {
      loadPopOver();
    };
  }

  onDestroy(
    page.subscribe(() => {
      if (browser) {
        loadPopOver();
      }
    }),
  );
</script>
