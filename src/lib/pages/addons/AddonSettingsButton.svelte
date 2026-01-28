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
    href="{base}/addons/detail/{plugin.id}"
    class="btn btn-link text-secondary p-0 me-2"
    aria-label={$_('buttons.settings')}
    use:tooltip={[$_('buttons.settings'), { placement: 'top' }]}>
    <i class="fa-solid fa-gear"></i>
  </a>
{/if}
