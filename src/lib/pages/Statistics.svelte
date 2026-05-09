<!-- Statistics Page -->
<div class="container vstack gap-3">
  {#key data.period}
    <div class="row g-3">
      <!-- Online Players -->
      <div class="col-lg-4">
        <SummaryStatCard
          title={$_('pages.statistics.online-player-card.title')}
          value={data.onlinePlayerCount}
          previousValue={data.previousOnlinePlayerCount}
          data={data.websiteActivityDataList?.onlinePlayerData || {}}
          secondaryValue={periodLabel}
          color="#ffffff"
          colorClass="text-bg-success" />
      </div>
      <!-- New Registers -->
      <div class="col-lg-4">
        <SummaryStatCard
          title={$_('pages.statistics.new-register-card.title')}
          value={data.newRegisterCount}
          previousValue={data.previousNewRegisterCount}
          data={data.websiteActivityDataList?.newRegisterData || {}}
          secondaryValue={periodLabel}
          color="#ffffff"
          colorClass="text-bg-info" />
      </div>
      <!-- Total Players -->
      <div class="col-lg-4">
        <SummaryStatCard
          title={$_('pages.statistics.total-player-card.title')}
          value={data.registeredPlayerCount}
          previousValue={data.previousRegisteredPlayerCount}
          data={data.websiteActivityDataList?.totalPlayerData || {}}
          secondaryValue={periodLabel}
          color="#ffffff"
          colorClass="text-bg-primary" />
      </div>
    </div>
  {/key}

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
      {#key data.period}
        <WebsiteActivityChart
          newRegisterData={data.websiteActivityDataList.newRegisterData}
          visitorData={data.websiteActivityDataList.visitorData}
          viewData={data.websiteActivityDataList.viewData}
          period={data.period} />
      {/key}
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

    const stats = await ApiUtil.get({
      path: `/api/panel/statistics` + queryParams,
      request: event,
    });

    if (!stats.result) {
      throw error(404, stats);
    }

    return {
      ...stats,
      period,
    };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import WebsiteActivityChart from '$lib/components/charts/Dashboard/WebsiteActivityChart.svelte';
  import SummaryStatCard from '$lib/components/charts/SummaryStatCard.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.statistics.title');

  $: periodLabel =
    data.period === DashboardPeriod.WEEK
      ? $_('pages.statistics.period-label.week')
      : $_('pages.statistics.period-label.month');
</script>
