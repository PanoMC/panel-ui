<AppLayout data="{data}">
  <slot />
</AppLayout>

<script>
  import AppLayout from "$lib/layouts/AppLayout.svelte";

  export let data;
</script>
