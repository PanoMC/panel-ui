<!--
  "Included with Pano+" next to a store item panomc.com marks as part of Pano+ (`panoPlusIncluded`).
  Nothing while Pano+ is off or unknown.
-->
{#if included && isPanoPlusOn($panoPlus)}
  <span class="badge text-bg-primary">{$_('components.pano-plus.included')}</span>
{/if}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { isPanoPlusOn, loadPanoPlus, panoPlus } from '$lib/pano-plus.js';

  /** @type {{ included?: boolean }} */
  let { included = false } = $props();

  onMount(() => {
    if (included) loadPanoPlus();
  });
</script>
