<style>
  .chart-container {
    position: relative;
    height: 120px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<div class="chart-container">
  <canvas bind:this={element}></canvas>
</div>

<script>
  import {
    Chart,
    PieController,
    ArcElement,
    Tooltip,
    Legend,
    Colors
  } from 'chart.js';
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  Chart.register(
    PieController,
    ArcElement,
    Tooltip,
    Legend,
    Colors
  );

  export let playerCount = 0;
  export let maxPlayerCount = 0;

  let element;
  let chart;
  let themeObserver;

  function checkDarkMode() {
    if (typeof window !== 'undefined') {
      const htmlTheme = document.documentElement.getAttribute('data-bs-theme');
      if (htmlTheme) {
        return htmlTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  function getColors() {
    const dark = checkDarkMode();
    const style = getComputedStyle(document.documentElement);
    return {
      online: '#0d6efd', // primary
      empty: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      text: dark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
      border: style.getPropertyValue('--bs-border-color') || (dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.175)')
    };
  }

  function renderChart() {
    const colors = getColors();
    let displayMax = maxPlayerCount === 0 ? 1 : maxPlayerCount;
    let displayPlayerCount = playerCount;
    const emptyCount = Math.max(0, displayMax - displayPlayerCount);

    chart = new Chart(element, {
      type: 'pie',
      data: {
        labels: [$_('pages.server.dashboard.online'), $_('pages.server.dashboard.offline')],
        datasets: [{
          data: maxPlayerCount === 0 && playerCount === 0 ? [0, 1] : [displayPlayerCount, emptyCount],
          backgroundColor: [colors.online, colors.empty],
          borderColor: colors.border,
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }

  function updateChart() {
    if (!chart) return;
    const colors = getColors();
    let displayMax = maxPlayerCount === 0 ? 1 : maxPlayerCount;
    let displayPlayerCount = playerCount;
    const emptyCount = Math.max(0, displayMax - displayPlayerCount);
    
    chart.data.datasets[0].data = maxPlayerCount === 0 && playerCount === 0 ? [0, 1] : [displayPlayerCount, emptyCount];
    chart.data.datasets[0].backgroundColor = [colors.online, colors.empty];
    chart.data.datasets[0].borderColor = colors.border;
    chart.update();
  }

  $: if (chart && (playerCount !== undefined || maxPlayerCount !== undefined)) {
    updateChart();
  }

  onMount(() => {
    renderChart();

    themeObserver = new MutationObserver(() => {
      updateChart();
    });

    if (typeof document !== 'undefined') {
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme', 'class'],
      });
    }
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
    if (themeObserver) {
      themeObserver.disconnect();
    }
  });
</script>
