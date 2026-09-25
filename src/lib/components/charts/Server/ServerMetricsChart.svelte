<style>
  .metrics-chart-container {
    position: relative;
    height: 220px;
    width: 100%;
  }
</style>

<div class="metrics-chart-container">
  <canvas bind:this={element}></canvas>
</div>

<script>
  /**
   * TPS and player count over the requested range, from `GET /servers/:id/metrics`.
   *
   * Only the 1-minute TPS is persisted, so the chart draws `tps` straight from the rollup
   * rows. §2.4.25 — no holes: a missing value is drawn as 0 and a stretch with no sample longer
   * than 2.5 buckets drops to 0 and comes back, the same rule as the vital cards. A series that
   * never measured anything (a proxy has no TPS) draws no line at all rather than a flat zero.
   * Times on the axis and in the tooltip follow `timeZone` when the Overview's "Server time"
   * switch is on.
   */
  import {
    Chart,
    Colors,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    TimeScale,
    Tooltip,
  } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { currentLanguage } from '$lib/language.util.js';
  import { fillMetricGaps, formatMetricTime } from '$lib/metricsSeries.util.js';

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
    Colors,
  );

  /** @type {Array<{ ts: number, tps: number|null, players: number|null }>} */
  export let series = [];
  /** The spacing of the rows in ms (1-min, 10-min or day buckets), for the gap rule. */
  export let bucketMs = 60_000;
  /** IANA zone for the axis and tooltip times; the browser's when unset. */
  export let timeZone = undefined;
  /** `1h`, `24h` or `7d` — decides how a time on the axis and in the tooltip is written. */
  export let range = '1h';

  let element;
  let chart;
  let themeObserver;
  let mediaQuery;

  $: if (chart && series) {
    updateData(bucketMs, timeZone, range);
  }

  const unsubscribeCurrentLanguage = currentLanguage.subscribe(() => {
    if (chart) {
      chart.update('none');
    }
  });

  function isDarkMode() {
    if (typeof document === 'undefined') {
      return false;
    }

    const attribute = document.documentElement.getAttribute('data-bs-theme');

    if (attribute) {
      return attribute === 'dark';
    }

    return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getColors() {
    const dark = isDarkMode();

    return {
      grid: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      text: dark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    };
  }

  function toPoints(key) {
    const points = (Array.isArray(series) ? series : [])
      .map((row) => ({
        x: Number(row.ts) || 0,
        y: row[key] == null || !Number.isFinite(Number(row[key])) ? null : Number(row[key]),
      }))
      .filter((point) => point.x > 0)
      .sort((a, b) => a.x - b.x);

    return points.some((point) => point.y != null) ? fillMetricGaps(points, bucketMs) : [];
  }

  /**
   * @param {number} value epoch ms
   * @param {boolean} forTooltip
   */
  function formatTime(value, forTooltip) {
    if (range === '7d') {
      return formatMetricTime(value, { timeZone, dateOnly: true });
    }

    return formatMetricTime(value, { timeZone, withDate: forTooltip && range !== '1h' });
  }

  /**
   * The x axis' tick spacing per range: a tick an hour across a day and one a day across a week,
   * where Chart.js on its own picks something far finer (a label every few minutes on a day).
   * The hour lets it choose, which lands on round minutes.
   *
   * @param {string} value the range key (`1h`, `24h`, `7d`).
   * @returns {'hour' | 'day' | undefined}
   */
  function timeUnitOf(value) {
    return value === '7d' ? 'day' : value === '24h' ? 'hour' : undefined;
  }

  function updateData() {
    if (!chart) {
      return;
    }

    chart.data.datasets[0].data = toPoints('tps');
    chart.data.datasets[1].data = toPoints('players');
    chart.options.scales.x.time.unit = timeUnitOf(range);
    chart.update('none');
  }

  function applyColors() {
    if (!chart) {
      return;
    }

    const colors = getColors();

    chart.options.plugins.legend.labels.color = colors.text;
    chart.options.scales.x.grid.color = colors.grid;
    chart.options.scales.x.ticks.color = colors.text;
    chart.options.scales.y.grid.color = colors.grid;
    chart.options.scales.y.ticks.color = colors.text;

    chart.update('none');
  }

  function renderChart() {
    if (!element) {
      return;
    }

    const colors = getColors();

    chart = new Chart(element, {
      type: 'line',
      data: {
        datasets: [
          {
            label: $_('pages.servers.overview.chart-tps'),
            data: toPoints('tps'),
            yAxisID: 'y',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: false,
          },
          {
            label: $_('pages.servers.overview.chart-players'),
            data: toPoints('players'),
            // §2.4.26 — players share the left axis with TPS; no second axis on the right.
            yAxisID: 'y',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          colors: { enabled: true, forceOverride: true },
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 12, color: colors.text },
          },
          tooltip: {
            enabled: true,
            padding: 10,
            usePointStyle: true,
            callbacks: {
              title: (items) => (items.length ? formatTime(items[0].parsed.x, true) : ''),
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: timeUnitOf(range),
              displayFormats: { minute: 'HH:mm', hour: 'HH:mm' },
            },
            grid: { display: false, color: colors.grid },
            ticks: {
              color: colors.text,
              maxRotation: 0,
              autoSkip: true,
              font: { size: 11 },
              // Written by `Intl` rather than the date adapter, so "Server time" can move them.
              callback: (value) => formatTime(Number(value), false),
            },
          },
          y: {
            position: 'left',
            beginAtZero: true,
            suggestedMax: 20,
            grid: { display: false, color: colors.grid },
            ticks: { color: colors.text, font: { size: 11 } },
          },
        },
      },
    });
  }

  onMount(() => {
    renderChart();

    if (typeof document !== 'undefined') {
      themeObserver = new MutationObserver(applyColors);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme', 'class'],
      });
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyColors);
    }
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = undefined;
    }

    if (themeObserver) {
      themeObserver.disconnect();
    }

    if (mediaQuery) {
      mediaQuery.removeEventListener('change', applyColors);
    }

    unsubscribeCurrentLanguage();
  });
</script>
