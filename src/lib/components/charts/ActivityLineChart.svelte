<style>
  .chart-container {
    position: relative;
    width: 100%;
  }
</style>

<div class="chart-container" style="height: {height};">
  <canvas id={canvasId} bind:this={element}></canvas>
</div>

<script>
  /**
   * The day-bucketed activity chart, extracted from `WebsiteActivityChart` so the Statistics
   * page and the server Overview draw the same picture from different numbers (§2.4.19).
   *
   * Every series is a map of local-midnight epoch milliseconds to a number, exactly the shape
   * `PanelGetStatisticsAPI` and the server activity-chart endpoint return. Colours come from
   * Chart.js' own palette, so a caller only supplies labels and data.
   */
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
  } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import { onDestroy, onMount } from 'svelte';
  import {
    subWeeks,
    subMonths,
    subMinutes,
    subHours,
    startOfDay,
    startOfMonth,
    startOfMinute,
    startOfHour,
  } from 'date-fns';
  import * as dateFnsLocales from 'date-fns/locale';

  import { get } from 'svelte/store';

  import { currentLanguage } from '$lib/language.util.js';
  import { formatMetricTime } from '$lib/metricsSeries.util.js';

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
    Colors,
  );

  /** The id `DashboardPeriod.WEEK` carries; anything else is treated as the month range. */
  const WEEK = 'WEEK';
  /** §2.4.24 — thirteen month buckets: the current month and the twelve before it. */
  const YEAR = 'YEAR';
  /** §2.4.26 — the last 60 minutes in 1-minute buckets. */
  const HOUR = 'HOUR';
  /** §2.4.26 — the last 24 hours in 1-hour buckets. */
  const DAY = 'DAY';

  let element;
  let chart;
  let minDate;
  let maxDate;
  let displayFormats;
  /** `day` for the week and month views, `month` for the year view. */
  let timeUnit = 'day';
  /** Only the year view names months, so only it needs a locale and a tooltip format. */
  let tooltipFormat;
  let themeObserver;
  let mediaQuery;

  /** @type {Array<{ label: string, data: Record<string, number> | null | undefined }>} */
  export let series = [];
  export let period;
  export let canvasId = 'activityChart';
  /** Background grid lines; the Statistics page keeps them, the server Overview draws none. */
  export let grid = true;
  /** Any CSS length; the Statistics page's 300 px unless a caller asks otherwise. */
  export let height = '300px';
  /**
   * `default` is the Statistics page's look — point dots, 3 px lines, a padded bold legend.
   * `compact` is the server Overview's Performance chart: dots only on hover, 2 px lines, the
   * plain legend and the axis starting at the first point — so the Overview's two charts match.
   *
   * @type {'default' | 'compact'}
   */
  export let lineStyle = 'default';
  /**
   * IANA zone the Hour and Day views write their times in (the Overview's "Server time"
   * switch); the browser's when unset. The day-and-longer views name days, not times.
   */
  export let timeZone = undefined;

  $: compact = lineStyle === 'compact';

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

    timeUnit = 'day';
    tooltipFormat = undefined;

    if (period === HOUR || period === DAY) {
      // Bucket-start keys: the first and the last bucket of the window, so the line spans it.
      const hourly = period === DAY;

      minDate = hourly
        ? startOfHour(subHours(currentDate, 23)).getTime()
        : startOfMinute(subMinutes(currentDate, 59)).getTime();
      maxDate = hourly ? startOfHour(currentDate).getTime() : startOfMinute(currentDate).getTime();

      timeUnit = hourly ? 'hour' : 'minute';
      displayFormats = hourly ? { hour: 'HH:mm' } : { minute: 'HH:mm' };
    } else if (period === YEAR) {
      // The first and the last of the 13 buckets the endpoint returns, keyed by each month's
      // first day. The axis ends on the last bucket rather than at the end of this month, so
      // the line reaches across the card instead of stopping short of a month of empty axis.
      minDate = startOfMonth(subMonths(currentDate, 12)).getTime();
      maxDate = startOfMonth(currentDate).getTime();

      timeUnit = 'month';
      // Standalone month names (`LLL`), so a language that inflects them (Russian) reads right;
      // the two-digit year tells this month apart from the same month a year ago.
      displayFormats = { month: 'LLL yy' };
      tooltipFormat = 'LLLL yyyy';
    } else if (period === WEEK) {
      // Start: 7 days ago at 00:00
      const from = startOfDay(subWeeks(currentDate, 1));
      // End: today's bucket (its key is today at 00:00). Ending at 23:59 left almost a whole
      // day of empty axis after the last point — a strip on the right of the card.
      const to = startOfDay(currentDate);

      minDate = from.getTime();
      maxDate = to.getTime();

      displayFormats = { day: 'eee' };
    } else {
      // Start: 1 month ago at 00:00 (relative, not calendar-aligned)
      const from = startOfDay(subMonths(currentDate, 1));
      // End: today's bucket, as above.
      const to = startOfDay(currentDate);

      minDate = from.getTime();
      maxDate = to.getTime();

      displayFormats = { day: 'dd, eee' };
    }
  }

  // "Server time" moved: the Hour and Day labels and tooltip read the zone when drawn.
  $: if (chart && isIntraday()) {
    void timeZone;
    chart.update('none');
  }

  // Reload chart when the series or the period changes
  $: if (chart && series) {
    reloadChart(series);
  }

  const unsubscribeCurrentLanguage = currentLanguage.subscribe(() => {
    if (chart) {
      reloadChart();
    }
  });

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

  /**
   * The date-fns locale for the axis labels — only in the year view, where they are month
   * names. The week and month views keep the labels they have always had.
   */
  function chartLocale() {
    if (period !== YEAR) {
      return undefined;
    }

    const code = get(currentLanguage)?.dateFnsCode;

    return (code && dateFnsLocales[code]) || undefined;
  }

  function isIntraday() {
    return period === HOUR || period === DAY;
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
        if (data['y'] > highestValue) {
          highestValue = data['y'];
        }
      });
    });

    return highestValue + 5;
  }

  function getConvertedDatasets(seriesList = series) {
    return (Array.isArray(seriesList) ? seriesList : []).map((entry) => ({
      label: entry?.label ?? '',
      data: convertDataForChartJS(entry?.data),
    }));
  }

  function getDatasets(convertedDatasets) {
    // Use Chart.js default palette for modern, smooth lines (no fill)
    return convertedDatasets.map((entry) =>
      compact
        ? {
            // The Overview's Performance chart (ServerMetricsChart), point for point.
            label: entry.label,
            data: entry.data,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: false,
          }
        : {
            label: entry.label,
            data: entry.data,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3,
            tension: 0.4,
            fill: false,
          },
    );
  }

  function reloadChart(seriesList = series) {
    const convertedDatasets = getConvertedDatasets(seriesList);

    chart.data.datasets = getDatasets(convertedDatasets);

    chart.options.scales.x.min = minDate;
    chart.options.scales.x.max = maxDate;
    chart.options.scales.x.time.unit = timeUnit;
    chart.options.scales.x.time.displayFormats = displayFormats;
    chart.options.scales.x.time.tooltipFormat = tooltipFormat;
    chart.options.scales.x.adapters = { date: { locale: chartLocale() } };

    chart.options.scales.y.suggestedMax = getSuggestedMax(
      convertedDatasets.map((entry) => entry.data),
    );

    chart.update();
  }

  function renderChart() {
    const convertedDatasets = getConvertedDatasets();
    const suggestedMax = getSuggestedMax(convertedDatasets.map((entry) => entry.data));
    const colors = getColors();

    chart = new Chart(element, {
      type: 'line',
      data: {
        datasets: getDatasets(convertedDatasets),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          colors: {
            enabled: true,
            forceOverride: true,
          },
          legend: {
            display: true,
            position: 'top',
            labels: compact
              ? { usePointStyle: true, padding: 12, color: colors.text }
              : {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                    size: 12,
                    weight: '500',
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
              // Hour and Day are times of day, written by `Intl` so "Server time" can move
              // them; the day-and-longer views keep the adapter's own label.
              title: (items) =>
                isIntraday()
                  ? items.length
                    ? formatMetricTime(items[0].parsed.x, { timeZone, withDate: period === DAY })
                    : ''
                  : (items[0]?.label ?? ''),
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y;
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: timeUnit,
              displayFormats,
              tooltipFormat,
              isoWeekday: true,
            },
            adapters: { date: { locale: chartLocale() } },
            min: minDate,
            max: maxDate,
            // The Performance chart's time axis starts on its first point; so does compact.
            offset: !compact,
            grid: {
              display: grid,
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
              // Only the Hour and Day views replace the adapter's labels: a callback, even an
              // undefined one, skips them entirely, so the key is only there when it is used. It
              // reads `timeZone` at draw time, so a zone switch just redraws.
              ...(isIntraday()
                ? { callback: (value) => formatMetricTime(Number(value), { timeZone }) }
                : {}),
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: suggestedMax,
            grid: {
              display: grid,
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
