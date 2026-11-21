<!--
  Pano+ grace bar: shown while the subscription has ended and the grace runs (`me.status == GRACE`),
  with a link to pay on panomc.com. Not a hint: closing the hints does not hide it. Renders nothing
  when Pano+ is off or the request failed.
-->
{#if $panoPlusGraceVisible}
  <div class="alert alert-warning mb-0 rounded-0 flex-shrink-0" role="alert">
    <div class="container-fluid d-flex align-items-center">
      <i class="fa-solid fa-triangle-exclamation me-3" aria-hidden="true"></i>
      <div>
        <span class="me-2"><PanoPlusBadge /></span>
        {$_('components.pano-plus.grace', { values: { days } })}
        <a
          class="alert-link ms-2"
          href={$panoPlus.plusUrl}
          rel="noopener noreferrer"
          target="_blank">
          {$_('components.pano-plus.pay-now')}
          <i class="fa-solid fa-arrow-right ms-1"></i>
        </a>
      </div>
    </div>
  </div>
{/if}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import PanoPlusBadge from '$lib/components/PanoPlusBadge.svelte';
  import { daysLeft, loadPanoPlus, panoPlus, panoPlusGraceVisible } from '$lib/pano-plus.js';

  const days = $derived(daysLeft($panoPlus?.me?.graceUntil) ?? 0);

  onMount(() => {
    loadPanoPlus();
  });
</script>
