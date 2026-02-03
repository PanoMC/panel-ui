{#if $hookStore.length > 0 || specificHooks.length > 0}
  <div class="d-flex flex-column gap-3">
    <Hook name="panel:plugin-detail:content" addon={data.addon} />
    <Hook name={`panel:plugin-detail:content:${data.addon.id}`} addon={data.addon} />
  </div>
{:else}
  <NoContent
    title={$_('pages.addon-detail.no-settings', { default: 'No Settings' })}
    description={$_('pages.addon-detail.no-settings-desc', {
      default: 'This addon has no configurable settings.',
    })}
    icon="fas fa-cog" />
{/if}

<script>
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { onDestroy } from 'svelte';
  import Hook from '$lib/component/Hook.svelte';
  import NoContent from '$lib/component/NoContent.svelte';
  import { panoApiClient } from '$lib/PluginAPI.js';

  let { data } = $props();

  const hookStore = panoApiClient.ui.hook.get('panel:plugin-detail:content');

  function getSpecificHooks(id) {
    if (!id) return [];
    return get(panoApiClient.ui.hook.get(`panel:plugin-detail:content:${id}`));
  }

  let specificHooks = $state([]);
  let unsub;

  $effect(() => {
    if (unsub) unsub();
    if (data.addon?.id) {
      const store = panoApiClient.ui.hook.get(`panel:plugin-detail:content:${data.addon.id}`);
      specificHooks = get(store);
      unsub = store.subscribe((value) => {
        specificHooks = value;
      });
    } else {
      specificHooks = [];
    }
  });

  onDestroy(() => {
    if (unsub) unsub();
  });
</script>
