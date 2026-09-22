<Layout {data}>
  <slot />
</Layout>

<script>
  import Layout from '$lib/layouts/ServerDetailLayout.svelte';

  export let data;
</script>
