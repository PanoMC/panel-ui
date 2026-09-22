<style>
  .vital-card {
    overflow: hidden;
    min-height: 160px;
  }

  .vital-card .card-body {
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .vital-card .card-top {
    padding: 1rem 1rem 0.5rem;
    min-width: 0;
  }

  .vital-card .sparkline-wrapper {
    position: relative;
    height: 64px;
    min-height: 64px;
    width: 100%;
    margin-top: auto;
  }
</style>

<!-- One vital of a server in the Statistics page's stat-card look (`SummaryStatCard`): title, big
     value, a secondary line and a 64 px sparkline over the last hour — without the
     previous-period badge, since a live figure has no "previous period". -->
<div class="card h-100 vital-card {colorClass}">
  <div class="card-body">
    <div class="card-top">
      <p class="text-truncate m-0 small">{title}</p>
      {#if loading}
        <!-- The figure's own height, so nothing moves when the first sample lands. -->
        <!-- A normal-size line (`fs-6`) inside the figure's line box: the panel's placeholder size,
             at the figure's height. -->
        <div class="{valueClass} lh-1 placeholder-glow">
          <span class="placeholder col-7 fs-6 align-middle"></span>
        </div>
      {:else}
        <div class="d-flex align-items-baseline flex-wrap column-gap-2 min-w-0">
          <span class="{valueClass} lh-1">{value || '—'}</span>
          {#if secondary}
            <span class="text-truncate small">{secondary}</span>
          {/if}
        </div>
      {/if}
    </div>
    <div class="sparkline-wrapper">
      <canvas bind:this={canvas} aria-hidden="true"></canvas>
    </div>
  </div>
</div>

<script>
  /**
   * §2.4.22 B — a stat card whose sparkline is a real time series: the x axis is the sample's
   * epoch milliseconds (a linear axis — hidden, so the date adapter would add nothing), and
   * hovering it shows the local time of the nearest point and its value through `format`.
   *
   * One line comes from `points`; several (the Network card's ↓ and ↑) from `series`, each with
   * its own label that the tooltip puts in front of the value. A point whose value is null is a
   * gap, and a series without a single value draws no line at all.
   */
  import { onMount } from 'svelte';
  import {
    Chart,
    Filler,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
  } from 'chart.js';

  import { fillMetricGaps, formatMetricTime } from '$lib/metricsSeries.util.js';

  Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip);

  /**
   * @typedef {{ ts: number, value: number | null }} VitalPoint
   * @typedef {{ label?: string, points: VitalPoint[], color?: string, dashed?: boolean }} VitalSeries
   */

  /**
   * @type {{
   *   title?: string,
   *   value?: string,
   *   secondary?: string,
   *   points?: VitalPoint[],
   *   series?: VitalSeries[] | null,
   *   format?: (value: number) => string,
   *   color?: string,
   *   colorClass?: string,
   *   valueClass?: string,
   *   bucketMs?: number,
   *   timeZone?: string,
   *   showDate?: boolean,
   *   loading?: boolean,
   *   liveWindowMs?: number | null,
   * }}
   * @property value the big figure, already formatted; empty reads as "—".
   * @property format how a hovered point's value is written.
   * @property color the line colour (the card background comes from `colorClass`).
   * @property valueClass the big figure's size; a long figure (the Network card) steps down.
   * @property bucketMs the spacing of the stored points; a stretch with no sample longer than 2.5
   *   of these is drawn as a drop to zero (§2.4.25).
   * @property timeZone the IANA zone the tooltip's time is written in; the browser's when unset.
   * @property showDate put the day in the tooltip too, for ranges longer than a day.
   * @property loading before the first figure arrives: the value is a `placeholder` line of its
   *   own size (the panel's usual `placeholder-glow` pattern) and the sparkline stays empty.
   * @property liveWindowMs a live scrolling window: the x axis is always `[now − window, now]`,
   *   so a fresh chart starts at the right edge and grows leftwards, then scrolls; the stretch
   *   before the first sample is simply empty. Null spans the first point to the last instead,
   *   which is right for a fetched history that should fill the card.
   */
  let {
    title = '',
    value = '',
    secondary = '',
    points = [],
    series = null,
    format = (number) => Number(number).toLocaleString(),
    color = '#ffffff',
    colorClass = '',
    valueClass = 'fs-2',
    bucketMs = 60_000,
    timeZone = undefined,
    showDate = false,
    loading = false,
    liveWindowMs = null,
  } = $props();

  /** @type {HTMLCanvasElement | undefined} */
  let canvas = $state();
  /** @type {Chart | undefined} */
  let chart;

  onMount(() => {
    renderChart();

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });

  // New samples arrive every ten seconds; the datasets are swapped in place.
  $effect(() => {
    const datasets = buildDatasets(series, points, color, bucketMs);
    const windowMs = liveWindowMs;

    if (!chart) {
      return;
    }

    chart.data.datasets = datasets;
    applyBounds(chart, datasets, windowMs);
    chart.update('none');
  });

  /**
   * §2.4.23 — the x axis runs from the first point to the last, so the line touches both edges
   * of the card instead of floating in whatever range Chart.js would pad it to.
   *
   * @param {Chart} target
   * @param {Array<{ data: Array<{ x: number }> }>} datasets
   * @param {number | null} windowMs
   */
  function applyBounds(target, datasets, windowMs) {
    const bounds = xBounds(datasets, windowMs);
    const scale = /** @type {any} */ (target.options.scales?.x);

    if (!scale) {
      return;
    }

    scale.min = bounds.min;
    scale.max = bounds.max;
  }

  /**
   * @param {Array<{ data: Array<{ x: number }> }>} datasets
   * @param {number | null} [windowMs] a live window: the axis is `[now − window, now]`, whatever
   *   the points are — recomputed on every update, which is every new sample.
   * @returns {{ min: number | undefined, max: number | undefined }}
   */
  function xBounds(datasets, windowMs = null) {
    if (Number(windowMs) > 0) {
      // "Now" is the later of the browser's clock and the newest sample, so a source whose clock
      // runs a little ahead still draws its newest point at the right edge instead of past it.
      let now = Date.now();

      for (const dataset of datasets) {
        for (const point of dataset.data) {
          now = Math.max(now, point.x);
        }
      }

      return { min: now - Number(windowMs), max: now };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const dataset of datasets) {
      for (const point of dataset.data) {
        min = Math.min(min, point.x);
        max = Math.max(max, point.x);
      }
    }

    return Number.isFinite(min) && max > min ? { min, max } : { min: undefined, max: undefined };
  }

  /**
   * @param {VitalSeries[] | null} seriesList
   * @param {VitalPoint[]} single
   * @param {string} lineColor
   * @param {number} bucket the spacing of the stored points, for the gap rule.
   */
  function buildDatasets(seriesList, single, lineColor, bucket) {
    const list = (Array.isArray(seriesList) ? seriesList : [{ label: '', points: single }]).filter(
      // A series that never measured anything (network on a server with no node) is left out
      // rather than drawn as a flat zero that would read as "no traffic".
      (entry) =>
        (Array.isArray(entry.points) ? entry.points : []).some(
          (point) => point?.value != null && Number.isFinite(Number(point.value)),
        ),
    );

    return list
      .map((entry, index) => ({
        label: entry.label ?? '',
        data: fillMetricGaps(
          (Array.isArray(entry.points) ? entry.points : [])
            .filter((point) => Number(point?.ts) > 0)
            .map((point) => ({
              x: Number(point.ts),
              y:
                point.value == null || !Number.isFinite(Number(point.value))
                  ? null
                  : Number(point.value),
            }))
            .sort((a, b) => a.x - b.x),
          bucket,
        ),
        borderColor: entry.color ?? lineColor,
        // Only the first line is filled, so only it needs a (translucent) fill colour.
        backgroundColor: index === 0 ? `${entry.color ?? lineColor}33` : 'transparent',
        borderDash: entry.dashed ? [4, 3] : [],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.4,
        // A second filled area would hide the first.
        fill: index === 0,
        spanGaps: false,
      }))
      .filter((dataset) => (Array.isArray(dataset.data) ? dataset.data : []).length > 0);
  }

  function renderChart() {
    if (!canvas || chart) {
      return;
    }

    const datasets = buildDatasets(series, points, color, bucketMs);
    const bounds = xBounds(datasets, liveWindowMs);

    chart = new Chart(canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: 0 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            padding: 6,
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            displayColors: false,
            callbacks: {
              // Read at hover time, so a switch to server time applies without a redraw.
              title: (items) =>
                items.length
                  ? formatMetricTime(items[0].parsed.x, { timeZone, withDate: showDate })
                  : '',
              label: (context) => {
                const formatted = format(context.parsed.y);

                return context.dataset.label ? `${context.dataset.label} ${formatted}` : formatted;
              },
            },
          },
        },
        scales: {
          x: { type: 'linear', display: false, offset: false, min: bounds.min, max: bounds.max },
          y: { display: false, beginAtZero: true },
        },
      },
    });
  }
</script>
