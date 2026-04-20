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

  .summary-stat-card .card-title-text {
    font-size: 0.875rem;
    opacity: 0.9;
    margin: 0 0 0.25rem 0;
  }

  .summary-stat-card .card-main-value {
    font-size: 1.75rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .summary-stat-card .card-secondary-value {
    font-size: 0.8rem;
    opacity: 0.85;
  }

  .summary-stat-card .trend-badge {
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background-color: rgba(var(--bs-secondary-rgb, 108, 117, 125), 0.15);
    color: var(--bs-secondary-color, inherit);
  }

  .summary-stat-card .trend-badge.trend-up {
    background-color: rgba(25, 135, 84, 0.18);
    color: #198754;
  }

  .summary-stat-card .trend-badge.trend-down {
    background-color: rgba(220, 53, 69, 0.18);
    color: #dc3545;
  }

  .summary-stat-card .trend-badge.trend-same {
    opacity: 0.65;
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
        <p class="card-title-text text-truncate me-2">{title}</p>
        {#if hasComparison}
          <span
            class="trend-badge"
            class:trend-up={trend === 'up'}
            class:trend-down={trend === 'down'}
            class:trend-same={trend === 'neutral'}
            use:tooltip={[tooltipText, { placement: 'top' }]}>
            {#if trend === 'up'}
              <i class="fa-solid fa-arrow-up"></i>
            {:else if trend === 'down'}
              <i class="fa-solid fa-arrow-down"></i>
            {/if}
            <span>{formattedDiff}</span>
          </span>
        {/if}
      </div>
      <div class="d-flex align-items-baseline gap-2 mt-1">
        <span class="card-main-value">{formattedValue}</span>
        {#if secondaryValue}
          <span class="card-secondary-value text-truncate">{secondaryValue}</span>
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
