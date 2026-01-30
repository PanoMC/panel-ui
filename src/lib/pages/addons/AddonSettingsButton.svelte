<script>
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';
  import { panoApiClient } from '$lib/PluginAPI.js';

  export let plugin;

  $: hooks = panoApiClient.ui.hook.get(`panel:plugin-detail:content:${plugin.id}`);
</script>

{#if ($hooks.length > 0) && plugin.status === 'STARTED'}
  <a
    href="{base}/addons/detail/{plugin.id}"
    class="btn btn-link p-0"
    title={$_('buttons.preferences')}>
    <i class="fa-solid fa-sliders-h"></i>
  </a>
{/if}
