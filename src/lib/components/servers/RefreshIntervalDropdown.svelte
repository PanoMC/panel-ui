<!-- The live-metrics refresh interval as an icon dropdown: the title sits in the list, the
     chosen interval is checked, and the icon carries the tooltip. -->
<div class="dropdown">
  <button
    type="button"
    class="btn btn-sm btn-link text-decoration-none"
    data-bs-toggle="dropdown"
    aria-expanded="false"
    aria-label={$_('pages.servers.overview.refresh-interval')}
    use:tooltip={[$_('pages.servers.overview.refresh-interval'), { placement: 'bottom' }]}>
    <i class="fa-solid fa-stopwatch" aria-hidden="true"></i>
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    <li>
      <h6 class="dropdown-header">{$_('pages.servers.overview.refresh-interval')}</h6>
    </li>
    {#each METRIC_REFRESH_INTERVALS as interval (interval)}
      <li>
        <button
          type="button"
          class="dropdown-item d-flex align-items-center justify-content-between gap-3"
          class:active={interval === value}
          onclick={() => onselect?.(interval)}>
          {metricRefreshIntervalLabel(interval, $_)}
          {#if interval === value}
            <i class="fa-solid fa-check" aria-hidden="true"></i>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import tooltip from '$lib/tooltip.util';
  import { METRIC_REFRESH_INTERVALS, metricRefreshIntervalLabel } from '$lib/metricsSeries.util.js';

  /** @type {{ value: number, onselect?: (interval: number) => void }} */
  let { value, onselect } = $props();
</script>
