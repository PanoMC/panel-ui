<Layout>
  {@render children?.()}
</Layout>

<script>
  import Layout from '$lib/layouts/PanoBackupsLayout.svelte';

  let { children } = $props();
</script>
