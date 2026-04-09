{#if !data.server}
  <PageLoading />
{:else}
  <div class="container vstack gap-3">
    <div class="row g-3">
      <!-- Server Status -->
      <div class="col-lg-3">
        <div class="card aspect-ratio-1x1">
          <CardHeader>
            <span slot="left">{$_('pages.server.dashboard.server-status').split('{')[0].trim()}</span>
            <span slot="right">
              {data.server?.status === ServerStatus.ONLINE
                ? $_('pages.server.dashboard.online')
                : $_('pages.server.dashboard.offline')}
            </span>
          </CardHeader>
          <div class="card-body p-0 d-flex align-items-center justify-content-center overflow-hidden">
            {#if data.server.status === ServerStatus.ONLINE}
              <ServerActivityMiniChart activityData={data.server.activityData} />
            {/if}
          </div>
        </div>
      </div>

      <!-- Player Count -->
      <div class="col-lg-3">
        <div class="card aspect-ratio-1x1">
          <CardHeader>
            <span slot="left">{$_('pages.statistics.total-statistics.players').replace(':', '')}</span>
            <span slot="right">
              {data.server.playerCount} / {data.server.maxPlayerCount}
            </span>
          </CardHeader>
          <div class="card-body d-flex flex-column align-items-center justify-content-center overflow-hidden">
            <div class="w-100 p-2">
              <ServerPlayerChart
                playerCount={data.server.playerCount}
                maxPlayerCount={data.server.maxPlayerCount} />
            </div>
          </div>
        </div>
      </div>

      <!-- Uptime -->
      <div class="col-lg-3">
        <div class="card aspect-ratio-1x1">
          <CardHeader>
            <span slot="left">{($_('pages.server.dashboard.working-time') || '').split(':')[0]}</span>
            <span slot="right">
              {data.server?.status === ServerStatus.ONLINE ? 'Active' : 'Offline'}
            </span>
          </CardHeader>
          <div class="card-body d-flex align-items-center justify-content-center text-center">
            {#if data.server?.status === ServerStatus.ONLINE}
              <div class="fs-4 font-monospace fw-bold">
                {getUptime(data.server?.startTime, checkTime)}
              </div>
            {:else}
              <DateComponent time={data.server.stopTime} />
            {/if}
          </div>
        </div>
      </div>

      <!-- Server Version -->
      <div class="col-lg-3">
        <div class="card aspect-ratio-1x1">
          <CardHeader>
            <span slot="left">{$_('pages.server.dashboard.server-version').replace(':', '')}</span>
            <span slot="right">Stable</span>
          </CardHeader>
          <div class="card-body d-flex align-items-center justify-content-center text-center">
            <div class="fs-4 font-monospace fw-bold">
              {data.server.version}
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .aspect-ratio-1x1 {
        aspect-ratio: 1 / 1;
      }
    </style>

    <!-- Statistic Table -->
    <div class="card">
      <CardHeader>
        <span slot="left">{$_('pages.server.dashboard.statistics')}</span>
      </CardHeader>
      <div class="table-responsive">
        <table class="table table-hover">
          <tbody>
            <tr>
              <th scope="row">{$_('pages.server.dashboard.server-name')}</th>
              <td>{data.server.customName || data.server.name}</td>
            </tr>
            <tr>
              <th scope="row">{$_('pages.server.dashboard.server-type')}</th>
              <td>{data.server.type}</td>
            </tr>
            <tr>
              <th scope="row">{$_('pages.server.dashboard.local-ip-address')}</th>
              <td>{data.server.host}:{data.server.port}</td>
            </tr>
            <tr>
              <th scope="row">{$_('pages.server.dashboard.server-version')}</th>
              <td>{data.server.version}</td>
            </tr>
            <tr>
              <th scope="row">{$_('pages.server.dashboard.total-connected-servers')}</th>
              <td>{data.connectedServerCount}</td>
            </tr>
            <tr>
              <th scope="row">{$_('pages.server.dashboard.date-added')}</th>
              <td><DateComponent time={data.server.acceptedTime} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<script context="module">
  import ApiUtil from '$lib/api.util.js';

  export const ServerStatus = Object.freeze({
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
  });

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const parentData = await parent();
    const { selectedServer } = parentData;

    return await ApiUtil.get({
      path: `/api/panel/servers/${selectedServer.id}/dashboard`,
      request: event,
    });
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { differenceInCalendarDays, intervalToDuration } from 'date-fns';
  import { _ } from 'svelte-i18n';

  import DateComponent from '$lib/components/Date.svelte';
  import PageLoading from '$lib/components/PageLoading.svelte';
  import ServerPlayerChart from '$lib/components/charts/Server/ServerPlayerChart.svelte';
  import ServerActivityMiniChart from '$lib/components/charts/Server/ServerActivityMiniChart.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.server.dashboard.title');

  export let data;

  let checkTime = 0;
  let interval;

  function getUptime(time, checkTime) {
    const now = new Date();

    const duration = intervalToDuration({
      start: new Date(time),
      end: now,
    });

    const days = duration.days || 0;
    const hours = duration['hours'] || 0;
    const minutes = duration['minutes'] || 0;
    const seconds = duration['seconds'] || 0;

    return `${days}:${hours}:${minutes}:${seconds}`;
  }

  onMount(() => {
    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>
