<AddonProblemIcon {plugin} {report} />

{#if $hooks.length > 0 && plugin.status === 'STARTED'}
  <a
    href="{base}/addons/detail/{plugin.id}/settings"
    class="btn btn-link p-0"
    title={$_('buttons.preferences')}
    aria-label={$_('buttons.preferences')}>
    <i class="fa-solid fa-sliders-h"></i>
  </a>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';
  import { panoApiClient } from '$lib/PluginAPI.js';
  import AddonProblemIcon from './AddonProblemIcon.svelte';

  export let plugin;

  /** The compatibility report the list loaded (accepted levels, changed addresses), or null. */
  export let report = null;

  $: hooks = panoApiClient.ui.hook.get(`panel:plugin-detail:content:${plugin.id}`);
</script>
