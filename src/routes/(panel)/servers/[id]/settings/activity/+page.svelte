<!-- Keyed on the server: switching servers reloads the log instead of patching the old one. -->
{#key data.serverId}
  <ServerActivity {data} />
{/key}

<script>
  import ServerActivity from '$lib/pages/servers/settings/ServerActivity.svelte';

  export let data;
</script>
