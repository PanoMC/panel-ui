<Layout {data}>
  {@render children()}
</Layout>

<script>
  import Layout from '$lib/layouts/PostsLayout.svelte';

  let { data, children } = $props();
</script>
