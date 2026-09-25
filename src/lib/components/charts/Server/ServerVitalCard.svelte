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

  import { fillMetricGaps, fillMetricWindow, formatMetricTime } from '$lib/metricsSeries.util.js';

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
   *   windowMs?: number | null,
   *   online?: boolean,
   *   padStart?: boolean,
   *   scaleMax?: number | null,
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
   * @property windowMs the span the card shows: the x axis is always `[now − window, now]`, so a
   *   day is a day whatever the data covers, and the stretches nothing was measured in read as
   *   zero. Null spans the first point to the last instead.
   * @property online whether the server runs: its newest stretch is then only not received yet,
   *   and is not drawn as zero the way the time after a server stopped is. While it is off the
   *   card redraws on its own every second, so the zero keeps reaching "now".
   * @property padStart whether the stretch before the first point is zero (a stored range, where
   *   a missing minute is one nothing measured) or left empty (the live minute, whose earlier
   *   part was simply not watched).
   * @property scaleMax where the top of the sparkline is at least, in the points' own unit: 100 for
   *   a percentage, the total for an amount of something limited. Without it the line fills the
   *   card from 0 to its own highest point, so an idle CPU wobbling between 0.1 and 0.4 % is drawn
   *   as high as a busy one while the figure above it says 0 %.
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
    windowMs = null,
    online = true,
    padStart = true,
    scaleMax = null,
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
    // Read here so the effect follows every prop the drawing depends on.
    void series;
    void points;
    void color;
    void bucketMs;
    void windowMs;
    void online;
    void padStart;
    void scaleMax;

    redraw();
  });

  // A server that is off sends nothing, so nothing else would move the window: the zero after
  // its last sample has to keep reaching "now" on its own.
  $effect(() => {
    if (!windowMs || online) {
      return;
    }

    const timer = setInterval(redraw, 1000);

    return () => clearInterval(timer);
  });

  function redraw() {
    if (!chart) {
      return;
    }

    const bounds = windowBounds(windowMs);
    const datasets = buildDatasets(series, points, color, bucketMs, bounds);

    chart.data.datasets = datasets;
    applyBounds(chart, datasets, bounds);
    /** @type {any} */ (chart.options.scales).y.suggestedMax = suggestedTop(scaleMax);
    chart.update('none');
  }

  /**
   * The fixed span, `[now − window, now]`, or null to span the data. "Now" is the later of the
   * browser's clock and the newest point, so a source whose clock runs a little ahead still
   * draws its newest point at the right edge instead of past it.
   *
   * @param {number | null} span
   * @returns {{ min: number, max: number } | null}
   */
  function windowBounds(span) {
    if (!(Number(span) > 0)) {
      return null;
    }

    let now = Date.now();

    for (const entry of Array.isArray(series) ? series : [{ points }]) {
      for (const point of Array.isArray(entry?.points) ? entry.points : []) {
        now = Math.max(now, Number(point?.ts) || 0);
      }
    }

    return { min: now - Number(span), max: now };
  }

  /**
   * @param {number | null | undefined} max
   * @returns {number | undefined} [max] when it is a usable ceiling.
   */
  function suggestedTop(max) {
    const value = Number(max);

    return max != null && Number.isFinite(value) && value > 0 ? value : undefined;
  }

  /**
   * §2.4.23 — the x axis runs over the window, or from the first point to the last, so the line
   * touches both edges of the card instead of floating in whatever range Chart.js would pad it to.
   *
   * @param {Chart} target
   * @param {Array<{ data: Array<{ x: number }> }>} datasets
   * @param {{ min: number, max: number } | null} window
   */
  function applyBounds(target, datasets, window) {
    const bounds = window ?? xBounds(datasets);
    const scale = /** @type {any} */ (target.options.scales?.x);

    if (!scale) {
      return;
    }

    scale.min = bounds.min;
    scale.max = bounds.max;
  }

  /**
   * @param {Array<{ data: Array<{ x: number }> }>} datasets
   * @returns {{ min: number | undefined, max: number | undefined }}
   */
  function xBounds(datasets) {
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
   * @param {{ min: number, max: number } | null} window the span to fill with zeros where nothing
   *   was measured; null only closes the gaps between points.
   */
  function buildDatasets(seriesList, single, lineColor, bucket, window = null) {
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
        data: filled(
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
          window,
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

  /**
   * @param {Array<{ x: number, y: number | null }>} sorted
   * @param {number} bucket
   * @param {{ min: number, max: number } | null} window
   */
  function filled(sorted, bucket, window) {
    return window
      ? fillMetricWindow(sorted, bucket, { ...window, open: online, leading: padStart })
      : fillMetricGaps(sorted, bucket);
  }

  function renderChart() {
    if (!canvas || chart) {
      return;
    }

    const window = windowBounds(windowMs);
    const datasets = buildDatasets(series, points, color, bucketMs, window);
    const bounds = window ?? xBounds(datasets);

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
          y: { display: false, beginAtZero: true, suggestedMax: suggestedTop(scaleMax) },
        },
      },
    });
  }
</script>
