<Layout {data}>
  {@render children()}
</Layout>

<script>
  import Layout from '$lib/layouts/PlayerDetailLayout.svelte';

  let { data, children } = $props();
</script>
