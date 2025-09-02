<canvas height="120" id="websiteActivityChart" bind:this="{element}"></canvas>

<script>
  import { _, locale } from "svelte-i18n";
  import Chart from "chart.js/auto";
  import "chartjs-adapter-date-fns";
  import { onDestroy, onMount } from "svelte";
  import { subWeeks, subMonths, startOfDay, endOfDay, subDays } from "date-fns";

  import { DashboardPeriod } from "$lib/pages/Statistics.svelte";
  import { hasPermission, Permissions } from "$lib/auth.util.js";
  import { currentLanguage } from "$lib/language.util.js";
  import { get } from "svelte/store";

  let element;
  let chart;
  let minDate;
  let maxDate;
  let displayFormats;
  export let newRegisterData;
  export let ticketsData;
  export let visitorData;
  export let viewData;
  export let period;

  const weekConfiguration = { weekStartsOn: 1 };

  $: {
    const currentDate = new Date();

    if (period === DashboardPeriod.WEEK) {
      // Başlangıç: 7 gün önce 00:00
      const from = startOfDay(subWeeks(currentDate, 1));
      // Bitiş: bugün 23:59:59.999  (bugünü dahil)
      const to = endOfDay(currentDate);

      minDate = from.getTime();
      maxDate = to.getTime();

      displayFormats = { day: "eee" };
    } else {
      // Başlangıç: 1 ay önce aynı günün 00:00 (takvim değil, relatif 1 ay)
      const from = startOfDay(subMonths(currentDate, 1));
      // Bitiş: bugün 23:59:59.999  (bugünü dahil)
      const to = endOfDay(currentDate);

      minDate = from.getTime();
      maxDate = to.getTime();

      displayFormats = { day: "dd, eee" };
    }

    if (chart) {
      reloadChart(
        newRegisterData,
        ticketsData,
        visitorData,
        viewData,
      );
    }
  }

  const unsubscribeCurrentLanguage = currentLanguage.subscribe(() => {
    if (chart) {
      reloadChart()
    }
  })

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

    datasets.push({
      label: $_("components.website-activity-chart.new-registration"),
      data: convertedNewRegisterData,
      borderColor: "orange",
      backgroundColor: "rgba(25, 118, 210, .05)",
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: "#fff",
    });

    datasets.push({
      label: $_("components.website-activity-chart.new-ticket"),
      data: convertedTicketsData,
      borderColor: "purple",
      backgroundColor: "rgba(25, 118, 210, .05)",
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: "#fff",
    });

    datasets.push({
      label: $_("components.website-activity-chart.visitor"),
      data: convertedVisitorData,
      borderColor: "red",
      backgroundColor: "rgba(25, 118, 210, .05)",
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: "#fff",
    });
    datasets.push({
      label: $_("buttons.view"),
      data: convertedViewData,
      borderColor: "green",
      backgroundColor: "rgba(25, 118, 210, .05)",
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: "#fff",
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

    chart = new Chart(element, {
      type: "line",
      data: {
        datasets: getDatasets(convertedDatasets),
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              displayFormats,
              isoWeekday: true,
              padding: 5,
            },
            min: minDate,
            max: maxDate,
            offset: true,
          },
          y: {
            suggestedMax: suggestedMax,
            ticks: {
              precision: false,
            },
          },
        },
      },
    });
  }

  onMount(() => {
    renderChart();
  });

  onDestroy(unsubscribeCurrentLanguage)
</script>
