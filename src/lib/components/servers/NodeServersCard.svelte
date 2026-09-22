<style>
  .usage-bar {
    height: 4px;
    min-width: 72px;
  }

  .usage-cell {
    min-width: 96px;
  }

  .task-cell {
    max-width: 14rem;
  }

  .task-bar {
    height: 4px;
  }
</style>

<!-- The servers placed on a node: what they run, how they are configured and, for the running
     ones, what they take right now. -->
{#if canListServers}
  <div class="card">
    <CardHeader truncateLeftSlot={false}>
      <span slot="left" class="d-inline-flex align-items-center gap-2">
        <span>
          <i class="fa-solid fa-server me-2" aria-hidden="true"></i>
          {$_('pages.servers.nodes.column-servers')}
        </span>
        {#if !loading}
          <span class="badge rounded-pill text-bg-secondary">{nodeServers.length}</span>
        {/if}
      </span>
      <span slot="right" class="d-flex align-items-center gap-2">
        {#if canCreateServers}
          <button type="button" class="btn btn-sm btn-primary" onclick={openCreateServer}>
            <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
            {$_('components.modals.create-server.create-button')}
          </button>
        {/if}
      </span>
    </CardHeader>

    <div class="card-body vstack gap-2">
      {#if loading}
        <div class="placeholder-glow" aria-busy="true">
          <span class="placeholder col-6"></span>
          <span class="placeholder col-4"></span>
        </div>
      {:else if nodeServers.length === 0}
        <NoContent icon="fa-solid fa-server fa-3x" text={$_('pages.servers.nodes.servers-empty')} />
      {:else}
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-name')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-status')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('components.modals.create-server.review-software')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('components.modals.create-server.review-port')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('components.modals.create-server.review-memory')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.overview.info.java')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-cpu')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-memory')}</th>
              </tr>
            </thead>
            <tbody>
              {#each nodeServers as server (server.id)}
                {@const online = isServerOnline(server)}
                {@const sample = online ? latest[server.id] : null}
                {@const cpu = resolveCpu(sample)}
                {@const ram = resolveMemory(sample)}
                {@const software = server.software || server.type}
                {@const task = getActiveTask(server)}
                <tr>
                  <th scope="row" class="text-nowrap">
                    <a class="text-decoration-none" href="{base}/servers/{server.id}">
                      {getServerDisplayName(server) || `#${server.id}`}
                    </a>
                  </th>
                  <td class="text-nowrap task-cell">
                    {#if isManaged(server)}
                      {@const processState = getProcessState(server) ?? ProcessStates.STOPPED}
                      <span class="badge rounded-pill text-bg-{processStateColour(processState)}">
                        {$_(processStateLabel(processState))}
                      </span>
                      {#if task}
                        {@render taskProgress(task)}
                      {/if}
                    {:else}
                      <span
                        class="badge rounded-pill"
                        class:text-bg-success={online}
                        class:text-bg-danger={!online}>
                        {online
                          ? $_('pages.servers.card.online')
                          : $_('pages.servers.card.offline')}
                      </span>
                    {/if}
                  </td>
                  <td class="text-nowrap">
                    {#if software}
                      <span class="d-inline-flex align-items-center gap-1">
                        <SoftwareLogo id={software} size="1.25rem" />
                        {softwareLabel(software)}
                        {#if server.softwareVersion}
                          <span class="text-body-secondary">{server.softwareVersion}</span>
                        {/if}
                      </span>
                    {:else}
                      <span class="text-body-secondary">—</span>
                    {/if}
                  </td>
                  <td class="text-nowrap font-monospace"
                    >{server.gamePort ?? server.port ?? '—'}</td>
                  <td class="text-nowrap">
                    {server.memoryMb ? `${server.memoryMb} MB` : '—'}
                  </td>
                  <td class="text-nowrap">
                    {server.javaVersion
                      ? `Java ${server.javaVersion}`
                      : $_('pages.servers.overview.info.java-automatic')}
                  </td>
                  <td class="usage-cell">{@render usage(cpu)}</td>
                  <td class="usage-cell">{@render usage(ram)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#snippet taskProgress(/** @type {{ kind: string, percent: number, message?: string }} */ task)}
  {@const label = $_(taskLabelKey(task))}
  {@const percent = taskPercent(task)}
  {@const message = taskDetail(task) || label}
  <!-- SM-68 — what the node is doing to this server right now (install, backup, ...). -->
  <div
    class="progress task-bar mt-1"
    role="progressbar"
    aria-label={label}
    aria-valuenow={percent}
    aria-valuemin="0"
    aria-valuemax="100">
    <div
      class="progress-bar progress-bar-striped progress-bar-animated bg-info"
      style:width="{percent}%">
    </div>
  </div>
  <div class="d-flex gap-1 small text-body-secondary">
    <span class="text-truncate" title={message}>{message}</span>
    <span class="font-monospace flex-shrink-0">{percent}%</span>
  </div>
{/snippet}

{#snippet usage(/** @type {{ percent: number | null, text: string } | null} */ stat)}
  {#if stat == null}
    <span class="text-body-secondary">—</span>
  {:else}
    <div class="small text-nowrap">{stat.text}</div>
    {#if stat.percent != null}
      <div
        class="progress usage-bar"
        role="progressbar"
        aria-label={stat.text}
        aria-valuenow={Math.round(stat.percent)}
        aria-valuemin="0"
        aria-valuemax="100">
        <div
          class="progress-bar"
          class:bg-danger={stat.percent >= 90}
          class:bg-warning={stat.percent >= 75 && stat.percent < 90}
          style:width="{stat.percent}%">
        </div>
      </div>
    {/if}
  {/if}
{/snippet}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { createKeyedLatestThrottle, metricRequestInterval } from '$lib/metricsSeries.util.js';
  import {
    onPanelServerRemoved,
    onPanelServerUpdate,
    onServerMetrics,
    onTaskProgress,
    subscribePanelServersList,
    subscribeServersMetrics,
  } from '$lib/panelRealtime.js';
  import {
    applyTaskFrame,
    getActiveTask,
    getProcessState,
    getServerDisplayName,
    isManaged,
    isServerOnline,
    ProcessStates,
    processStateColour,
    processStateLabel,
    taskDetail,
    taskLabelKey,
    taskPercent,
  } from '$lib/servers.util.js';
  import { softwareLabel } from '$lib/software.util.js';
  import { formatBytes } from '$lib/string.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import { show as showCreateServerModal } from '$lib/components/modals/CreateServerModal.svelte';
  import SoftwareLogo from '$lib/components/servers/SoftwareLogo.svelte';

  /**
   * @type {{ node: { id: number | string } | null | undefined, refreshInterval?: number }}
   * @property refreshInterval How often the CPU/RAM cells move, in ms; 0 is Paused. The page's
   *   own interval select drives it.
   */
  let { node, refreshInterval = 0 } = $props();

  /** `GET /api/panel/servers` needs `MANAGE_SERVERS`; without it the card is left out. */
  const canListServers = hasPermission(Permissions.MANAGE_SERVERS);
  const canCreateServers = hasPermission(Permissions.CREATE_SERVERS);

  /** Every server the panel lists; the card shows the ones on this node. */
  /** @type {Array<Record<string, any>>} */
  let servers = $state([]);
  let loading = $state(true);
  /**
   * Per server id, the newest metric sample (`latest` of `GET /api/panel/servers-metrics`,
   * then the hub's frames merged on top).
   *
   * @type {Record<string, Record<string, any>>}
   */
  let latest = $state({});

  /** @type {{ release: () => void, update: (ids: Array<number|string>, intervalMs: number|null) => void } | null} */
  let metricsSubscription = null;
  let mounted = false;

  const nodeServers = $derived(
    servers
      .filter((server) => server.nodeId != null && Number(server.nodeId) === Number(node?.id))
      .sort((a, b) =>
        getServerDisplayName(a).localeCompare(getServerDisplayName(b), undefined, {
          sensitivity: 'base',
        }),
      ),
  );
  const nodeServerIds = $derived(nodeServers.map((server) => server.id));

  const metricsThrottle = createKeyedLatestThrottle((serverId, sample) => {
    if (refreshInterval === 0) {
      return;
    }

    latest = { ...latest, [serverId]: { ...(latest[serverId] ?? {}), ...sample } };
  });

  // The ids and the rate travel with the subscription; changing either re-sends it.
  $effect(() => {
    const ids = nodeServerIds;
    const interval = refreshInterval;

    metricsThrottle.setInterval(interval || 1000);
    metricsSubscription?.update(ids, metricRequestInterval(interval));
  });

  async function loadServers() {
    const body = await ApiUtil.get({
      path: '/api/panel/servers',
      handler: (response) => response,
    });

    if (!mounted) {
      return;
    }

    if (body && typeof body === 'object' && !body.error) {
      const hasNewShape = body.pinned != null || body.otherServers != null;

      servers = hasNewShape
        ? [...(body.pinned ?? []), ...(body.otherServers ?? [])]
        : (body.servers ?? []);
    }

    loading = false;
  }

  /**
   * One bulk read for the first numbers, so the cells are not empty until the first frame. A
   * backend without the endpoint answers with an error body, which is ignored on purpose.
   */
  async function loadInitialMetrics() {
    const body = await ApiUtil.get({
      path: '/api/panel/servers-metrics?range=1h',
      handler: (response) => response,
    });

    if (!mounted || !body || typeof body !== 'object' || body.error || !body.servers) {
      return;
    }

    /** @type {Record<string, Record<string, any>>} */
    const next = { ...latest };

    for (const [id, entry] of Object.entries(body.servers)) {
      if (entry?.latest) {
        next[id] = { ...entry.latest, ...(next[id] ?? {}) };
      }
    }

    latest = next;
  }

  function openCreateServer() {
    showCreateServerModal({ nodeId: node?.id });
  }

  /**
   * @param {unknown} value
   * @returns {number | null}
   */
  function numberOrNull(value) {
    const number = value == null ? Number.NaN : Number(value);

    return Number.isFinite(number) ? number : null;
  }

  /**
   * @param {unknown} value
   * @returns {number | null}
   */
  function positiveOrNull(value) {
    const number = numberOrNull(value);

    return number != null && number > 0 ? number : null;
  }

  /**
   * The plugin measures the server process itself (`cpu`); a node only sees the process it
   * started (`processCpu`). Same reading as the servers modal.
   *
   * @param {Record<string, any> | null | undefined} sample
   * @returns {{ percent: number, text: string } | null}
   */
  function resolveCpu(sample) {
    const value = numberOrNull(sample?.cpu) ?? numberOrNull(sample?.processCpu);

    if (value == null) {
      return null;
    }

    const percent = Math.max(0, Math.min(100, value));

    return { percent, text: `${Math.round(percent)}%` };
  }

  /**
   * A node reports the process' resident set, which is measured against the host's memory; the
   * plugin reports the JVM heap against `-Xmx`. Same reading as the servers modal.
   *
   * @param {Record<string, any> | null | undefined} sample
   * @returns {{ percent: number | null, text: string } | null}
   */
  function resolveMemory(sample) {
    const fromNode = sample?.source === 'node';
    const used = fromNode
      ? (positiveOrNull(sample?.memRss) ?? positiveOrNull(sample?.memUsed))
      : (positiveOrNull(sample?.memUsed) ?? positiveOrNull(sample?.memRss));
    const total = fromNode ? positiveOrNull(sample?.hostMemTotal) : positiveOrNull(sample?.memMax);

    if (used == null) {
      return null;
    }

    return {
      percent: total == null ? null : Math.min(100, (used / total) * 100),
      text:
        total == null ? formatBytes(used, 1) : `${formatBytes(used, 1)} / ${formatBytes(total, 1)}`,
    };
  }

  onMount(() => {
    if (!canListServers) {
      return;
    }

    mounted = true;

    const releaseServersList = subscribePanelServersList();

    metricsSubscription = subscribeServersMetrics(
      nodeServerIds,
      metricRequestInterval(refreshInterval),
    );
    metricsThrottle.setInterval(refreshInterval || 1000);

    const offMetrics = onServerMetrics((frame) => {
      if (
        refreshInterval === 0 ||
        !frame?.sample ||
        !nodeServerIds.some((id) => Number(id) === Number(frame.serverId))
      ) {
        return;
      }

      metricsThrottle.push(frame.serverId, frame.sample);
    });

    const offUpdate = onPanelServerUpdate((server) => {
      if (!server || server.id == null) {
        return;
      }

      const index = servers.findIndex((entry) => Number(entry.id) === Number(server.id));

      if (index >= 0) {
        servers = servers.map((entry, position) =>
          position === index ? { ...entry, ...server } : entry,
        );
      } else if (server.nodeId != null && Number(server.nodeId) === Number(node?.id)) {
        // A server that just landed on this node: the full row comes from the list endpoint.
        void loadServers();
      }
    });

    // SM-68 — install/backup/... progress of the servers on this node.
    const offTask = onTaskProgress((frame) => {
      if (frame?.serverId == null) {
        return;
      }

      servers = servers.map((entry) =>
        Number(entry.id) === Number(frame.serverId) ? applyTaskFrame(entry, frame) : entry,
      );
    });

    const offRemoved = onPanelServerRemoved((id) => {
      servers = servers.filter((entry) => Number(entry.id) !== Number(id));
    });

    void loadServers();
    void loadInitialMetrics();

    return () => {
      mounted = false;
      offMetrics();
      offUpdate();
      offTask();
      offRemoved();
      releaseServersList();
      metricsThrottle.cancel();
      metricsSubscription?.release();
      metricsSubscription = null;
    };
  });
</script>
