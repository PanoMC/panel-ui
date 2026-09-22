<!-- Keyed on the server: switching servers rebuilds the form instead of patching it. -->
{#key data.serverId}
  <StartupSettings {data} />
{/key}

<script>
  import StartupSettings from '$lib/pages/servers/settings/StartupSettings.svelte';

  export let data;
</script>
