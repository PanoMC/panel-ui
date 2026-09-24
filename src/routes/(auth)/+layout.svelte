<AuthShell>
  {@render children?.()}
</AuthShell>

<script>
  import AuthShell from '$lib/layouts/AuthShell.svelte';

  let { children } = $props();
</script>
