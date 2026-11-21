<!--
  "Active with Pano+ · until …" for a premium addon or theme whose license comes through the
  owner's Pano+ (`licensePanoPlus`). Otherwise (Pano+ off or unknown) the usual line, passed as children.
-->
{#if viaPanoPlus && isPanoPlusOn($panoPlus)}
  <p class="mb-0 text-body-secondary">
    <span class="me-2"><PanoPlusBadge /></span>
    {#if until}
      {$_('components.pano-plus.license-active', {
        values: { date: new Date(until).toLocaleDateString($currentLanguage?.code) },
      })}
    {:else}
      {$_('components.pano-plus.license-active-no-date')}
    {/if}
  </p>
{:else}
  {@render children?.()}
{/if}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import PanoPlusBadge from '$lib/components/PanoPlusBadge.svelte';
  import { currentLanguage } from '$lib/language.util.js';
  import { isPanoPlusOn, loadPanoPlus, panoPlus, panoPlusUntil } from '$lib/pano-plus.js';

  /** @type {{ viaPanoPlus?: boolean, children?: import('svelte').Snippet }} */
  let { viaPanoPlus = false, children } = $props();

  const until = $derived(panoPlusUntil($panoPlus));

  onMount(() => {
    if (viaPanoPlus) loadPanoPlus();
  });
</script>
