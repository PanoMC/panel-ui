<!-- Statistics Page -->
<div class="container vstack gap-3">
  <div
    class="row g-3 justify-content-between animate__animated animate__slideInUp">
    <div class="col-4">
      <div class="card text-bg-success h-100">
        <div class="card-body">
          <p class="card-text">
            {$_("pages.statistics.online-player-text", {
              values: { onlinePlayerCount: data.onlinePlayerCount },
            })}
          </p>
        </div>
      </div>
    </div>
    <div class="col-4">
      <div class="card text-bg-primary h-100">
        <div class="card-body">
          <p class="card-text">
            {$_("pages.statistics.new-register-text", {
              values: { newRegisterCount: data.newRegisterCount },
            })}
          </p>
        </div>
      </div>
    </div>
    <div class="col-4">
      <div class="card text-bg-warning h-100">
        <div class="card-body">
          <p class="card-text">
            {$_("pages.statistics.total-player-text", {
              values: { totalPlayerCount: data.registeredPlayerCount },
            })}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">
          {$_("pages.statistics.website-graph.title")}
        </h5>

        <div
          class="nav nav-underline small col-sm-auto col justify-content-md-start justify-content-center"
          slot="right">
          <div class="nav-item">
            <button
              class="nav-link text-truncate"
              class:active="{data.period === DashboardPeriod.WEEK}"
              on:click="{() => reloadDataByPeriod()}"
              class:disabled="{reloading}">
              {$_("pages.statistics.website-graph.week")}
            </button>
          </div>
          <div class="nav-item">
            <button
              class="nav-link text-truncate"
              class:active="{data.period === DashboardPeriod.MONTH}"
              on:click="{() => reloadDataByPeriod(DashboardPeriod.MONTH)}"
              class:disabled="{reloading}">
              {$_("pages.statistics.website-graph.month")}
            </button>
          </div>
        </div>
      </CardHeader>

      <WebsiteActivityChart
        newRegisterData="{data.websiteActivityDataList.newRegisterData}"
        ticketsData="{data.websiteActivityDataList.ticketsData}"
        visitorData="{data.websiteActivityDataList.visitorData}"
        viewData="{data.websiteActivityDataList.viewData}"
        period="{data.period}" />
    </div>
  </div>

  <!-- Statistic Table -->
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">
        {$_("pages.statistics.total-statistics.title")}
      </h5>
      <div class="table-responsive">
        <table class="table">
          <tbody>
            <tr>
              <th scope="row"
                >{$_("pages.statistics.total-statistics.posts")}</th>
              <td>{data.postCount}</td>
            </tr>
            <tr>
              <th scope="row"
                >{$_("pages.statistics.total-statistics.players")}</th>
              <td>{data.registeredPlayerCount}</td>
            </tr>
            <tr>
              <th scope="row"
                >{$_("pages.statistics.total-statistics.admins")}</th>
              <td>{data.adminCount}</td>
            </tr>
            <tr>
              <th scope="row"
                >{$_("pages.statistics.total-statistics.tickets")}</th>
              <td>{data.ticketCount}</td>
            </tr>
            <tr>
              <th scope="row"
                >{$_(
                  "pages.statistics.total-statistics.connected-servers",
                )}</th>
              <td>{data.connectedServerCount}</td>
            </tr>
            <tr>
              <th scope="row"
                >{$_("pages.statistics.total-statistics.addons")}</th>
              <td>?</td>
            </tr>
            <tr>
              <th scope="row"
                >{$_("pages.statistics.total-statistics.themes")}</th>
              <td>?</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Player Statistics Page End -->

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  export const DashboardPeriod = Object.freeze({
    WEEK: "WEEK",
    MONTH: "MONTH",
  });

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const period = searchParams.get("period") || DashboardPeriod.WEEK;

    const queryParams = buildQueryParams({
      period,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/statistics` + queryParams,
      request: event,
    });

    if (!body.result) {
      throw error(404, body);
    }

    body.period = period;

    return body;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import WebsiteActivityChart from "$lib/component/charts/Dashboard/WebsiteActivityChart.svelte";
  import { goto } from "$app/navigation";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;
  let reloading = false;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.statistics.title");

  async function refreshData() {
    const queryParams = buildQueryParams({
      period: data.period,
    });

    await goto(queryParams);
  }

  async function reloadDataByPeriod(period = DashboardPeriod.WEEK) {
    if (data.period === period) {
      return;
    }

    reloading = true;

    data.period = period;

    await refreshData();

    reloading = false;
  }
</script>
