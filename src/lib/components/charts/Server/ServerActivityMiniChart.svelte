<style>
  .mini-chart-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    z-index: 5; /* Higher than card-body to receive hover events */
    overflow: hidden;
  }
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
</style>

<div class="mini-chart-container">
  <canvas bind:this={element}></canvas>
</div>

<script>
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    TimeScale,
    Filler,
  } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import { onMount, onDestroy } from 'svelte';

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    TimeScale,
    Filler,
  );

  export let activityData = {};
  let element;
  let chart;

  function renderChart() {
    if (!element) return;
    try {
      const ctx = element.getContext('2d');
      if (!ctx) return;

      // Generate points safely
      let points = [];
      const now = Date.now();
      
      if (activityData && typeof activityData === 'object' && Object.keys(activityData).length > 0) {
        points = Object.keys(activityData)
          .map((key) => ({
            x: Number(key),
            y: activityData[key],
          }))
          .sort((a, b) => a.x - b.x);
      }

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              data: points,
              fill: true,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 2,
              tension: 0.4, // Curvy lines
              pointRadius: 0,
              pointHoverRadius: 4, // Show point on hover
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: 0
          },
          interaction: {
            mode: 'index',
            intersect: false,
          },
          animation: {
            duration: 800,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 10,
              displayColors: false,
              callbacks: {
                title: (context) => {
                  if (!context[0]) return '';
                  const date = new Date(context[0].parsed.x);
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                },
                label: (context) => {
                  return `${$_('pages.server.dashboard.online')}: ${context.parsed.y}`;
                },
              },
            },
          },
          scales: {
            x: { 
              type: 'time',
              display: false,
              offset: false,
            },
            y: {
              type: 'linear',
              display: false,
              beginAtZero: true,
              suggestedMax: points.length > 0 ? Math.max(...points.map(p => p.y || 0)) + 2 : 10,
            },
          },
        },
      });
    } catch (err) {
      console.error('Chart.js render error:', err);
    }
  }

  $: if (chart && activityData && typeof activityData === 'object') {
    try {
      const points = Object.keys(activityData)
        .map((key) => ({
          x: Number(key),
          y: activityData[key],
        }))
        .sort((a, b) => a.x - b.x);
      chart.data.datasets[0].data = points;
      if (points.length > 0) {
        chart.options.scales.y.suggestedMax = Math.max(...points.map(p => p.y || 0)) + 2;
      }
      chart.update('none');
    } catch (err) {
      console.error('Chart update error:', err);
    }
  }

  onMount(renderChart);

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>
