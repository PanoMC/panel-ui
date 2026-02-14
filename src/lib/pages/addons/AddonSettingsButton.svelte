<script>
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';
  import { panoApiClient } from '$lib/PluginAPI.js';
  import tooltip from '$lib/tooltip.util';

  export let plugin;

  $: hooks = panoApiClient.ui.hook.get(`panel:plugin-detail:content:${plugin.id}`);
</script>

{#if ($hooks.length > 0) && plugin.status === 'STARTED'}
  <a
    href="{base}/addons/detail/{plugin.id}/settings"
    class="btn btn-link p-0"
    use:tooltip={[$_('buttons.preferences')]}
    aria-label={$_('buttons.preferences')}>
    <i class="fa-solid fa-sliders-h"></i>
  </a>
{/if}
