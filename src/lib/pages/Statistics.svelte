<!-- Statistics Page -->
<div class="container vstack gap-3">
  <div class="row g-3">
    <!-- Online Players -->
    <div class="col-lg-4">
      <div class="card aspect-ratio-1x1">
        <CardHeader>
          <span slot="left">
            {$_('pages.statistics.online-player-text', { values: { onlinePlayerCount: '' } }).trim()}
          </span>
          <span slot="right">
            {data.onlinePlayerCount}
          </span>
        </CardHeader>
        <div class="card-body overflow-auto">
          <div class="row g-2">
            {#each data.onlinePlayers || [] as player (player.username)}
              <div class="col-auto">
                <a href="{base}/players/detail/{player.username}" class="d-inline-block rounded focus-ring">
                  <img
                    alt={player.username}
                    class="rounded"
                    src="/api/profile/picture/{player.username}?{$avatarVersion}"
                    use:tooltip={[player.username, { placement: 'bottom' }]}
                    width="32"
                    height="32"
                    loading="lazy" />
                </a>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    <!-- New Registers -->
    <div class="col-lg-4">
      <div class="card aspect-ratio-1x1">
        <CardHeader>
          <span slot="left">Yeni Kayıtlar</span>
          <span slot="right">
            {data.newRegisterCount}
          </span>
        </CardHeader>
        <div class="card-body overflow-auto">
          <div class="row g-2">
            {#each data.lastRegisters || [] as player (player.username)}
              <div class="col-auto">
                <a href="{base}/players/detail/{player.username}" class="d-inline-block rounded focus-ring">
                  <img
                    alt={player.username}
                    class="rounded"
                    src="/api/profile/picture/{player.username}?{$avatarVersion}"
                    use:tooltip={[player.username, { placement: 'bottom' }]}
                    width="32"
                    height="32"
                    loading="lazy" />
                </a>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    <!-- Total Players -->
    <div class="col-lg-4">
      <div class="card aspect-ratio-1x1">
        <CardHeader>
          <span slot="left">
            {$_('pages.statistics.total-player-text', { values: { totalPlayerCount: '' } }).trim()}
          </span>
          <span slot="right">
            {data.registeredPlayerCount}
          </span>
        </CardHeader>
        <div class="card-body d-flex align-items-center justify-content-center text-center">
          <!-- Body empty as requested, content moved to header -->
        </div>
      </div>
    </div>
  </div>

<style>
  .aspect-ratio-1x1 {
    aspect-ratio: 1 / 1;
  }
</style>

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

    const [stats, dashboard] = await Promise.all([
      ApiUtil.get({
        path: `/api/panel/statistics` + queryParams,
        request: event,
      }),
      ApiUtil.get({
        path: `/api/panel/dashboard`,
        request: event,
      }).catch(() => ({})),
    ]);

    if (!stats.result) {
      throw error(404, stats);
    }

    const body = {
      ...stats,
      lastRegisters: dashboard.lastRegisters || [],
      onlinePlayers: dashboard.onlinePlayers || [], // Assuming it exists there or from server stats
      period: period,
    };

    return body;
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import WebsiteActivityChart from '$lib/components/charts/Dashboard/WebsiteActivityChart.svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { avatarVersion } from '$lib/Store';
  import tooltip from '$lib/tooltip.util';
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
