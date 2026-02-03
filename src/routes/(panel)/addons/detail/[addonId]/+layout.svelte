<Layout {data}>
  {@render children()}
</Layout>

<script>
  import Layout from '$lib/layouts/AddonDetailLayout.svelte';

  let { data, children } = $props();
</script>
