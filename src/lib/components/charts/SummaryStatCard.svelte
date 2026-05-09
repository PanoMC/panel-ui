<style>
  .summary-stat-card {
    overflow: hidden;
    min-height: 160px;
  }

  .summary-stat-card :global(.card-body) {
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .summary-stat-card .card-top {
    padding: 1rem 1rem 0.5rem;
  }

  .summary-stat-card .sparkline-wrapper {
    height: 64px;
    min-height: 64px;
    width: 100%;
    margin-top: auto;
  }
</style>

<div class="card summary-stat-card {colorClass}">
  <div class="card-body">
    <div class="card-top">
      <div class="d-flex justify-content-between align-items-start">
        <p class="text-truncate m-0 small">{title}</p>
        {#if hasComparison}
          <span
            class="badge rounded-pill"
            class:text-bg-success={trend === 'up'}
            class:text-bg-danger={trend === 'down'}
            class:text-bg-secondary={trend === 'neutral'}
            use:tooltip={[tooltipText, { placement: 'top' }]}>
            {#if trend === 'up'}
              <i class="fa-solid fa-arrow-up me-1"></i>
            {:else if trend === 'down'}
              <i class="fa-solid fa-arrow-down me-1"></i>
            {/if}
            <span>{formattedDiff}</span>
          </span>
        {/if}
      </div>
      <div class="d-flex align-items-baseline gap-2">
        <span class="fs-2 lh-1">{formattedValue}</span>
        {#if secondaryValue}
          <span class="text-truncate small">{secondaryValue}</span>
        {/if}
      </div>
    </div>
    <div class="sparkline-wrapper">
      <canvas bind:this={canvasEl}></canvas>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';
  import { onDestroy, onMount, tick } from 'svelte';
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip,
  } from 'chart.js';

  import tooltip from '$lib/tooltip.util';

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip,
  );

  export let title = '';
  export let value = 0;
  export let previousValue = null;
  export let data = {};
  export let secondaryValue = '';
  export let color = '#0d6efd';
  export let colorClass = '';
  export let valueFormatter = null;
  export let hasComparison = true;

  let canvasEl;
  let chart;

  $: formattedValue = valueFormatter ? valueFormatter(value) : formatNumber(value);

  $: diff = computeDiff(value, previousValue);

  $: formattedDiff = formatDiff(diff, valueFormatter);

  $: trend = computeTrend(value, previousValue);

  $: tooltipText = computeTooltip($_, value, previousValue, trend);

  $: sortedEntries = computeSortedEntries(data);

  $: if (chart && sortedEntries) {
    updateChart();
  }

  function computeSortedEntries(d) {
    if (!d) return [];

    const entries = Object.keys(d).map((key) => ({
      date: Number(key),
      value: Number(d[key] ?? 0),
    }));

    entries.sort((a, b) => a.date - b.date);

    return entries;
  }

  function computeTrend(current, previous) {
    if (previous === null || previous === undefined) return 'neutral';
    const currentNum = Number(current);
    const previousNum = Number(previous);
    if (Number.isNaN(currentNum) || Number.isNaN(previousNum)) return 'neutral';
    if (currentNum > previousNum) return 'up';
    if (currentNum < previousNum) return 'down';
    return 'neutral';
  }

  function computeDiff(current, previous) {
    if (previous === null || previous === undefined) return 0;
    const currentNum = Number(current);
    const previousNum = Number(previous);
    if (Number.isNaN(currentNum) || Number.isNaN(previousNum)) return 0;
    return currentNum - previousNum;
  }

  function formatDiff(value, customFormatter) {
    if (value === 0 || Number.isNaN(Number(value))) return '0';
    const abs = Math.abs(value);
    return customFormatter ? customFormatter(abs) : formatNumber(abs);
  }

  function computeTooltip(t, current, previous, direction) {
    if (previous === null || previous === undefined) return '';
    const diff = Number(current) - Number(previous);
    const sign = diff > 0 ? '+' : '';
    const directionLabel =
      direction === 'up'
        ? t('components.summary-stat-card.trend-up')
        : direction === 'down'
          ? t('components.summary-stat-card.trend-down')
          : t('components.summary-stat-card.trend-same');
    return `${directionLabel} (${sign}${formatNumber(diff)})`;
  }

  function formatNumber(n) {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
    return Number(n).toLocaleString();
  }

  function buildDataset() {
    return sortedEntries.map((entry) => entry.value);
  }

  function buildLabels() {
    return sortedEntries.map((entry) => entry.date);
  }

  function renderChart() {
    if (!canvasEl) return;

    chart = new Chart(canvasEl, {
      type: 'line',
      data: {
        labels: buildLabels(),
        datasets: [
          {
            data: buildDataset(),
            borderColor: color,
            backgroundColor: color + '33',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            displayColors: false,
            callbacks: {
              title: () => '',
              label: (ctx) => formatNumber(ctx.parsed.y),
            },
          },
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true },
        },
      },
    });
  }

  function updateChart() {
    if (!chart) return;
    chart.data.labels = buildLabels();
    chart.data.datasets[0].data = buildDataset();
    chart.data.datasets[0].borderColor = color;
    chart.data.datasets[0].backgroundColor = color + '33';
    chart.update();
  }

  onMount(async () => {
    await tick();
    renderChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });
</script>
