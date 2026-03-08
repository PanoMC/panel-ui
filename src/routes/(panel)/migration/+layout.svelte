<Layout {data}>
  <slot />
</Layout>

<script>
  import Layout from '$lib/layouts/MigrationLayout.svelte';

  export let data;
</script>
