<div class="chart-container">
  <canvas id="websiteActivityChart" bind:this="{element}"></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    height: 300px;
    width: 100%;
  }
</style>

<script>
  import { _, locale } from "svelte-i18n";
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    Colors,
  } from "chart.js";
  import "chartjs-adapter-date-fns";
  import { onDestroy, onMount } from "svelte";
  import { subWeeks, subMonths, startOfDay, endOfDay, subDays } from "date-fns";

  import { DashboardPeriod } from "$lib/pages/Statistics.svelte";
  import { hasPermission, Permissions } from "$lib/auth.util.js";
  import { currentLanguage } from "$lib/language.util.js";
  import { get } from "svelte/store";

  // Chart.js v4 - Register required components with Colors plugin for default palette
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    Colors
  );

  let element;
  let chart;
  let minDate;
  let maxDate;
  let displayFormats;
  let isDarkMode = false;
  let themeObserver;
  let mediaQuery;
  export let newRegisterData;
  export let ticketsData;
  export let visitorData;
  export let viewData;
  export let period;

  const weekConfiguration = { weekStartsOn: 1 };

  // Dark mode detection
  function checkDarkMode() {
    if (typeof window !== 'undefined') {
      const htmlTheme = document.documentElement.getAttribute('data-bs-theme');
      if (htmlTheme) {
        return htmlTheme === 'dark';
      }
      // Fallback to prefers-color-scheme
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  // Update min/max date and displayFormats when period changes
  $: {
    const currentDate = new Date();

    if (period === DashboardPeriod.WEEK) {
      // Start: 7 days ago at 00:00
      const from = startOfDay(subWeeks(currentDate, 1));
      // End: today at 23:59:59.999 (inclusive)
      const to = endOfDay(currentDate);

      minDate = from.getTime();
      maxDate = to.getTime();

      displayFormats = { day: "eee" };
    } else {
      // Start: 1 month ago at 00:00 (relative, not calendar-aligned)
      const from = startOfDay(subMonths(currentDate, 1));
      // End: today at 23:59:59.999 (inclusive)
      const to = endOfDay(currentDate);

      minDate = from.getTime();
      maxDate = to.getTime();

      displayFormats = { day: "dd, eee" };
    }
  }

  // Reload chart when data props or period changes
  $: if (chart && newRegisterData && ticketsData && visitorData && viewData) {
    reloadChart(
      newRegisterData,
      ticketsData,
      visitorData,
      viewData,
    );
  }

  const unsubscribeCurrentLanguage = currentLanguage.subscribe(() => {
    if (chart) {
      reloadChart()
    }
  })

  // Return colors based on dark mode
  function getColors() {
    const dark = checkDarkMode();
    
    return {
      grid: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      text: dark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
      tooltipBg: dark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      tooltipText: dark ? '#000' : '#fff',
      tooltipBorder: dark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    };
  }

  function convertDataForChartJS(data) {
    const newData = [];

    if (data) {
      Object.keys(data).forEach((key) => {
        newData.push({ x: Number(key), y: data[key] });
      });
    }

    return newData;
  }

  function getSuggestedMax(datasets) {
    let highestValue = 0;

    Object.values(datasets).forEach((dataset) => {
      dataset.forEach((data) => {
        if (data["y"] > highestValue) {
          highestValue = data["y"];
        }
      });
    });

    return highestValue + 5;
  }

  function getConvertedDatasets(
    newRegisterDataObj = newRegisterData,
    ticketsDataObj = ticketsData,
    visitorDataObj = visitorData,
    viewDataObj = viewData
  ) {
    const convertedNewRegisterData = convertDataForChartJS(newRegisterDataObj);
    const convertedTicketsData = convertDataForChartJS(ticketsDataObj);
    const convertedVisitorData = convertDataForChartJS(visitorDataObj);
    const convertedViewData = convertDataForChartJS(viewDataObj);

    return {
      convertedNewRegisterData,
      convertedTicketsData,
      convertedVisitorData,
      convertedViewData,
    };
  }

  function getDatasets(convertedDatasets) {
    const {
      convertedNewRegisterData,
      convertedTicketsData,
      convertedVisitorData,
      convertedViewData,
    } = convertedDatasets;

    const datasets = [];

    // Use Chart.js default palette for modern, smooth lines (no fill)
    datasets.push({
      label: $_("components.website-activity-chart.new-registration"),
      data: convertedNewRegisterData,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: false,
    });

    datasets.push({
      label: $_("components.website-activity-chart.new-ticket"),
      data: convertedTicketsData,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: false,
    });

    datasets.push({
      label: $_("components.website-activity-chart.visitor"),
      data: convertedVisitorData,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: false,
    });

    datasets.push({
      label: $_("buttons.view"),
      data: convertedViewData,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: false,
    });

    return datasets;
  }

  function reloadChart(
    newRegisterDataObj = newRegisterData,
    ticketsDataObj = ticketsData,
    visitorDataObj = visitorData,
    viewDataObj = viewData
  ) {
    const convertedDatasets = getConvertedDatasets(
      newRegisterDataObj,
      ticketsDataObj,
      visitorDataObj,
      viewDataObj
    );

    chart.data.datasets = getDatasets(convertedDatasets);

    chart.options.scales.x.min = minDate;
    chart.options.scales.x.max = maxDate;
    chart.options.scales.x.time.displayFormats = displayFormats;

    chart.options.scales.y.suggestedMax = getSuggestedMax(convertedDatasets);

    chart.update();
  }

  function renderChart() {
    const convertedDatasets = getConvertedDatasets();
    const suggestedMax = getSuggestedMax(convertedDatasets);
    const colors = getColors();

    chart = new Chart(element, {
      type: "line",
      data: {
        datasets: getDatasets(convertedDatasets),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          colors: {
            enabled: true,
            forceOverride: true,
          },
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: "500",
              },
              color: colors.text,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                label += context.parsed.y;
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              displayFormats,
              isoWeekday: true,
            },
            min: minDate,
            max: maxDate,
            offset: true,
            grid: {
              display: true,
              color: colors.grid,
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 11,
              },
              color: colors.text,
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: suggestedMax,
            grid: {
              display: true,
              color: colors.grid,
              drawBorder: false,
            },
            ticks: {
              precision: 0,
              font: {
                size: 11,
              },
              color: colors.text,
            },
          },
        },
      },
    });
  }

  // Listen for theme changes and refresh the chart
  function updateChartColors() {
    if (!chart) return;
    
    const colors = getColors();
    
    // Legend renkleri
    chart.options.plugins.legend.labels.color = colors.text;
    
    // Tooltip renkleri
    chart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
    chart.options.plugins.tooltip.titleColor = colors.tooltipText;
    chart.options.plugins.tooltip.bodyColor = colors.tooltipText;
    chart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
    
    // Grid ve tick renkleri
    chart.options.scales.x.grid.color = colors.grid;
    chart.options.scales.x.ticks.color = colors.text;
    chart.options.scales.y.grid.color = colors.grid;
    chart.options.scales.y.ticks.color = colors.text;
    
    chart.update();
  }

  onMount(() => {
    renderChart();
    
    // Listen for theme changes
    themeObserver = new MutationObserver(() => {
      updateChartColors();
    });
    
    if (typeof document !== 'undefined') {
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme', 'class'],
      });
    }
    
    // Also listen for color scheme changes
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateChartColors);
    }
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
    
    if (themeObserver) {
      themeObserver.disconnect();
    }
    
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', updateChartColors);
    }
    
    unsubscribeCurrentLanguage();
  });
</script>
