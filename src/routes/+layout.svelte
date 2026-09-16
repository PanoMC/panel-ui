<AppLayout {data}>
  <slot />
</AppLayout>

<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { markAppBooted } from '$pano/kit/hooks-client.js';
  import AppLayout from '$lib/layouts/AppLayout.svelte';

  export let data;

  onMount(() => {
    // Arms the hydration watchdog in app.html only once the panel really rendered; an error
    // render (a route chunk that failed to load) keeps it unarmed so the one recovery reload
    // can still fire. See theme-core kit/hooks-client.js markAppBooted().
    if (!$page.error) {
      markAppBooted();
    }
  });
</script>
