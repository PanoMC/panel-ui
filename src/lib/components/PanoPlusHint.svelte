<!--
  A short Pano+ hint (backups, e-mail settings). Shows only while Pano+ is on, this Pano has no
  Pano+ and no hint was closed yet: closing one turns every Pano+ hint off on this Pano for good.
-->
{#if $panoPlusHintsVisible}
  <div class="alert alert-info alert-dismissible d-flex align-items-start {classes}" role="alert">
    <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
    <div>
      <div>
        <span class="me-2"><PanoPlusBadge /></span>{text}
      </div>
      <a
        class="alert-link d-inline-block mt-2 text-capitalize"
        href={$panoPlus.plusUrl}
        rel="noopener noreferrer"
        target="_blank">{$_('components.pano-plus.learn-more')}</a>
    </div>
    <button
      class="btn-close"
      type="button"
      aria-label={$_('components.pano-plus.dismiss')}
      onclick={dismissPanoPlusHints}></button>
  </div>
{/if}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import PanoPlusBadge from '$lib/components/PanoPlusBadge.svelte';
  import {
    dismissPanoPlusHints,
    loadPanoPlus,
    panoPlus,
    panoPlusHintsVisible,
  } from '$lib/pano-plus.js';

  /** @type {{ text: string, classes?: string }} */
  let { text, classes = 'mb-0' } = $props();

  onMount(() => {
    loadPanoPlus();
  });
</script>
