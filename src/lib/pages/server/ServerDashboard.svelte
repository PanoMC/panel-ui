<div class="container vstack gap-3">
  <div
    class="row g-3 justify-content-between animate__animated animate__slideInUp">
    <div class="col-lg-4">
      <div
        class="card h-100"
        class:text-bg-success={data.server.status === ServerStatus.ONLINE}
        class:text-bg-danger={data.server.status === ServerStatus.OFFLINE}>
        <div class="card-body">
          {$_("pages.server.dashboard.server-status", {
            values: {
              status:
                data.server.status === ServerStatus.ONLINE
                  ? $_("pages.server.dashboard.online")
                  : $_("pages.server.dashboard.offline"),
            },
          })}
        </div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card text-bg-primary h-100">
        <div class="card-body">
          {$_("pages.server.dashboard.player", {
            values: {
              playerCount: data.server.playerCount,
              maxPlayerCount: data.server.maxPlayerCount,
            },
          })}
        </div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card text-bg-info h-100">
        <div class="card-body">
          {#if data.server.status === ServerStatus.ONLINE}
            {$_("pages.server.dashboard.player", {
              values: { upTime: getUptime(data.server.startTime, checkTime) },
            })}
          {:else}
            {$_("pages.server.dashboard.last-online")}
            <DateComponent time={data.server.stopTime} />
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Statistic Table -->
  <div class="card">
    <div class="card-header">{$_("pages.server.dashboard.statistics")}</div>
    <div class="table-responsive">
      <table class="table table-hover">
        <tbody>
          <tr>
            <th scope="row">{$_("pages.server.dashboard.server-name")}</th>
            <td>{data.server.name}</td>
          </tr>
          <tr>
            <th scope="row">{$_("pages.server.dashboard.server-type")}</th>
            <td>{data.server.type}</td>
          </tr>
          <tr>
            <th scope="row">{$_("pages.server.dashboard.local-ip-address")}</th>
            <td>{data.server.host}:{data.server.port}</td>
          </tr>
          <tr>
            <th scope="row">{$_("pages.server.dashboard.server-version")}</th>
            <td>{data.server.version}</td>
          </tr>
          <tr>
            <th scope="row"
              >{$_("pages.server.dashboard.total-connected-servers")}</th>
            <td>{data.connectedServerCount}</td>
          </tr>
          <tr>
            <th scope="row">{$_("pages.server.dashboard.date-added")}</th>
            <td><DateComponent time={data.server.acceptedTime} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil from "$lib/api.util.js";

  export const ServerStatus = Object.freeze({
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
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
  import { getContext, onDestroy, onMount } from "svelte";
  import { differenceInCalendarDays, intervalToDuration } from "date-fns";
  import { _ } from "svelte-i18n";

  import DateComponent from "$lib/component/Date.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.server.dashboard.title");

  export let data;

  let checkTime = 0;
  let interval;

  function getUptime(time, checkTime) {
    const now = new Date();

    const duration = intervalToDuration({
      start: time,
      end: now,
    });

    const days = differenceInCalendarDays(time, now);
    const hours = duration["hours"];
    const minutes = duration["minutes"];
    const seconds = duration["seconds"];

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
