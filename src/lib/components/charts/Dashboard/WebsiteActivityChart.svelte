<ActivityLineChart {series} {period} canvasId="websiteActivityChart" />

<script>
  /**
   * The site's registrations, visitors and views over the selected period.
   *
   * Everything that draws lives in {@link ActivityLineChart} (§2.4.19); this is the Statistics
   * page's own set of series, so the page itself did not have to change.
   */
  import { _ } from 'svelte-i18n';

  import ActivityLineChart from '$lib/components/charts/ActivityLineChart.svelte';

  // The Statistics page passes these four; there has never been a tickets line to draw, so the
  // old `ticketsData` prop nothing ever set is gone with the extraction.
  export let newRegisterData;
  export let visitorData;
  export let viewData;
  export let period;

  $: series = [
    { label: $_('components.website-activity-chart.new-registration'), data: newRegisterData },
    { label: $_('components.website-activity-chart.visitor'), data: visitorData },
    { label: $_('buttons.view'), data: viewData },
  ];
</script>
