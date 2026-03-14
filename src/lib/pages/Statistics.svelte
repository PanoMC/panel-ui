<!-- Statistics Page -->
<div class="container vstack gap-3">
  <div class="row g-3 justify-content-between">
    <div class="col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <p class="card-text">
            {$_('pages.statistics.online-player-text', {
              values: { onlinePlayerCount: data.onlinePlayerCount },
            })}
          </p>
        </div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <p class="card-text">
            {$_('pages.statistics.new-register-text', {
              values: { newRegisterCount: data.newRegisterCount },
            })}
          </p>
        </div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <p class="card-text">
            {$_('pages.statistics.total-player-text', {
              values: { totalPlayerCount: data.registeredPlayerCount },
            })}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.statistics.website-graph.title')}
      </div>
      <CardFilters slot="right">
        <CardFiltersItem
          href="/statistics?period={DashboardPeriod.WEEK}"
          active={data.period === DashboardPeriod.WEEK}>
          {$_('pages.statistics.website-graph.week')}
        </CardFiltersItem>
        <CardFiltersItem
          href="/statistics?period={DashboardPeriod.MONTH}"
          active={data.period === DashboardPeriod.MONTH}>
          {$_('pages.statistics.website-graph.month')}
        </CardFiltersItem>
      </CardFilters>
    </CardHeader>

    <div class="d-flex">
      <WebsiteActivityChart
        newRegisterData={data.websiteActivityDataList.newRegisterData}
        ticketsData={data.websiteActivityDataList.ticketsData}
        visitorData={data.websiteActivityDataList.visitorData}
        viewData={data.websiteActivityDataList.viewData}
        period={data.period} />
    </div>
  </div>

  <!-- Statistic Table -->
  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.statistics.total-statistics.title')}
      </div>
    </CardHeader>
    <div class="table-responsive">
      <table class="table">
        <tbody>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.posts')}</th>
            <td>{data.postCount}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.players')}</th>
            <td>{data.registeredPlayerCount}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.admins')}</th>
            <td>{data.adminCount}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.tickets')}</th>
            <td>{data.ticketCount}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.connected-servers')}</th>
            <td>{data.connectedServerCount}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.addons')}</th>
            <td>{data.installedPlugins}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.active-addons')}</th>
            <td>{data.activePlugins}</td>
          </tr>
          <tr>
            <th scope="row">{$_('pages.statistics.total-statistics.themes')}</th>
            <td>{data.installedThemes}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Player Statistics Page End -->

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { error } from '@sveltejs/kit';

  export const DashboardPeriod = Object.freeze({
    WEEK: 'WEEK',
    MONTH: 'MONTH',
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

    const period = searchParams.get('period') || DashboardPeriod.WEEK;

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
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import WebsiteActivityChart from '$lib/components/charts/Dashboard/WebsiteActivityChart.svelte';
  import { goto } from '$app/navigation';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';

  export let data;
  let reloading = false;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.statistics.title');

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
