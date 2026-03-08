<PostEditor bind:data />

<script>
  import PostEditor from '$lib/pages/PostEditor.svelte';

  let { data = $bindable() } = $props();
</script>
