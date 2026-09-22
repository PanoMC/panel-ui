<!-- Keyed on the server: switching servers rebuilds the form instead of patching it. -->
{#key data.serverId}
  <ServerProperties {data} />
{/key}

<script>
  import ServerProperties from '$lib/pages/servers/settings/ServerProperties.svelte';

  export let data;
</script>
