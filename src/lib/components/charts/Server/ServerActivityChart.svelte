<!-- Drawn like the Overview's Performance chart (220 px, hover-only points, no grid), which it
     sits next to. -->
<ActivityLineChart
  {series}
  {period}
  canvasId="serverActivityChart"
  grid={false}
  height="220px"
  lineStyle="compact"
  {timeZone} />

<script>
  /**
   * Peak and average players for one server — per minute, hour, day or month depending on the
   * period — the Overview's counterpart to the Statistics page's Website Activity card
   * (§2.4.19, §2.4.26).
   *
   * Both maps come from `GET /api/panel/servers/:id/activity-chart` keyed by bucket start, and an
   * empty map is a perfectly good answer: a server Pano has never recorded simply draws flat.
   */
  import { _ } from 'svelte-i18n';

  import ActivityLineChart from '$lib/components/charts/ActivityLineChart.svelte';

  /**
   * @type {{
   *   peakPlayerData?: Record<string, number>,
   *   averagePlayerData?: Record<string, number>,
   *   period?: string,
   *   timeZone?: string,
   * }}
   */
  let {
    peakPlayerData = {},
    averagePlayerData = {},
    period = 'WEEK',
    timeZone = undefined,
  } = $props();

  const series = $derived([
    { label: $_('pages.servers.overview.chart-peak-players'), data: peakPlayerData },
    { label: $_('pages.servers.overview.chart-average-players'), data: averagePlayerData },
  ]);
</script>
