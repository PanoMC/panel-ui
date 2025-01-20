<!-- Statistics Page -->
<div class="container vstack gap-3">
  <div class="row justify-content-between animate__animated animate__slideInUp">
    <div class="col-4">
      <div class="card bg-success h-100">
        <div class="card-body">
          <p class="mb-0 text-white">
            {$_("pages.statistics.online-player-text", {
              values: { onlinePlayerCount: data.onlinePlayerCount },
            })}
          </p>
        </div>
      </div>
    </div>
    <div class="col-4">
      <div class="card bg-primary h-100">
        <div class="card-body">
          <p class="mb-0 text-white">
            {$_("pages.statistics.new-register-text", {
              values: { newRegisterCount: data.newRegisterCount },
            })}
          </p>
        </div>
      </div>
    </div>
    <div class="col-4">
      <div class="card bg-warning h-100">
        <div class="card-body">
          <p class="mb-0 text-white">
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
      <div class="row justify-content-between mb-3">
        <div class="col">
          <h5 class="card-title">
            {$_("pages.statistics.website-graph.title")}
          </h5>
        </div>
        <div class="col-auto">
          <div class="btn-group">
            <button
              class="btn btn-sm btn-outline-primary"
              class:active="{data.period === DashboardPeriod.WEEK}"
              on:click="{() => reloadDataByPeriod()}"
              class:disabled="{reloading}">
              {$_("pages.statistics.website-graph.week")}
            </button>
            <button
              class="btn btn-sm btn-outline-primary"
              class:active="{data.period === DashboardPeriod.MONTH}"
              on:click="{() => reloadDataByPeriod(DashboardPeriod.MONTH)}"
              class:disabled="{reloading}">
              {$_("pages.statistics.website-graph.month")}
            </button>
          </div>
        </div>
      </div>
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
        <table class="table m-0">
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
  import { showNetworkErrorOnCatch } from "$lib/Store.js";
  import ApiUtil from "$lib/api.util.js";

  export const DashboardPeriod = Object.freeze({
    WEEK: "week",
    MONTH: "month",
  });

  async function loadData({ period, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/statistics?period=${period}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          resolve(body);
        } else {
          reject(body);
        }
      });
    });
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const parentData = await parent();

    let data = {
      registeredPlayerCount: 0,
      postCount: 0,
      ticketCount: 0,
      openTicketCount: 0,
      adminCount: 0,
      connectedServerCount: 0,
      newRegisterCount: 0,
      period: "",
      websiteActivityDataList: {},
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ period: DashboardPeriod.WEEK, request: event }).then(
      (body) => {
        data = { ...data, ...body };
      },
    );

    return data;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import WebsiteActivityChart from "$lib/component/charts/Dashboard/WebsiteActivityChart.svelte";

  export let data;
  let reloading = false;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.statistics.title");

  function reloadDataByPeriod(period = DashboardPeriod.WEEK) {
    if (data.period === period) {
      return;
    }

    reloading = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({ period })
        .then((loadedData) => {
          resolve();

          data = loadedData;
          reloading = false;
        })
        .catch(() => {
          reject();
        });
    });
  }
</script>
