<style>
  .status-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .usage-bar {
    height: 4px;
    min-width: 72px;
  }

  .usage-cell {
    min-width: 96px;
  }
</style>

<!-- Nodes (SM-24c): the machines that run managed servers. -->
<div class="container vstack gap-3">
  <PageActions leftClasses="d-none" middleClasses="d-none">
    <div slot="right" class="d-flex flex-wrap align-items-center justify-content-end gap-2">
      <!-- §2.4.30: how often the CPU/RAM/disk cells move — the Overview's intervals. -->
      <label class="small text-body-secondary mb-0" for="nodesRefreshInterval">
        {$_('pages.servers.overview.refresh-interval')}
      </label>
      <select
        id="nodesRefreshInterval"
        class="form-select form-select-sm w-auto"
        bind:value={refreshInterval}
        onchange={onRefreshIntervalChange}>
        {#each METRIC_REFRESH_INTERVALS as interval (interval)}
          <option value={interval}>{metricRefreshIntervalLabel(interval, $_)}</option>
        {/each}
      </select>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        aria-label={$_('pages.servers.overview.refresh-now')}
        use:tooltip={[$_('pages.servers.overview.refresh-now'), { placement: 'bottom' }]}
        disabled={refreshing}
        onclick={refreshNow}>
        <i class="fa-solid fa-rotate-right" class:fa-spin={refreshing} aria-hidden="true"></i>
      </button>
      <button class="btn btn-sm btn-primary" type="button" onclick={openAddNode}>
        <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
        {$_('pages.servers.nodes.add-node')}
      </button>
    </div>
  </PageActions>

  {#if pendingNodes.length > 0}
    <div class="card border-warning">
      <CardHeader>
        <span slot="left">
          <i class="fa-solid fa-user-clock me-2" aria-hidden="true"></i>
          {$_('pages.servers.nodes.pending-title')}
        </span>
      </CardHeader>
      <div class="card-body vstack gap-2">
        <div class="small text-body-secondary">
          {$_('pages.servers.nodes.pending-description')}
        </div>

        {#each pendingNodes as node (node.id)}
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="fw-semibold text-break">{getNodeDisplayName(node)}</span>
            <span class="badge text-bg-secondary">{kindLabel(node)}</span>
            <span class="small text-body-secondary text-break">{systemOf(node)}</span>
            <span class="ms-auto d-flex gap-2">
              <button
                type="button"
                class="btn btn-sm btn-success"
                disabled={busyId === node.id}
                onclick={() => acceptNode(node)}>
                {#if busyId === node.id}
                  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {/if}
                {$_('pages.servers.nodes.accept')}
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick={() => askDelete(node)}>
                {$_('buttons.delete')}
              </button>
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="card">
    <CardHeader>
      <span slot="left">{$_('pages.servers.nodes.title')}</span>
      <span slot="right" class="small text-body-secondary">
        {$_('pages.servers.nodes.count', { values: { count: approvedNodes.length } })}
      </span>
    </CardHeader>

    <div class="card-body">
      {#if unavailable}
        <NoContent
          icon="fa-solid fa-plug-circle-xmark fa-3x"
          text={$_('pages.servers.nodes.unavailable')} />
      {:else if approvedNodes.length === 0}
        <NoContent
          icon="fa-solid fa-server fa-3x"
          text={$_('pages.servers.nodes.empty-description')}>
          <div class="d-flex flex-wrap justify-content-center gap-2 pb-3">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              disabled={localSetupBusy}
              onclick={setupLocalNode}>
              {#if localSetupBusy}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {:else}
                <i class="fa-solid fa-bolt me-1" aria-hidden="true"></i>
              {/if}
              {$_('pages.servers.create.setup-local-node')}
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick={openAddNode}>
              <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
              {$_('pages.servers.nodes.add-node')}
            </button>
          </div>
        </NoContent>
      {:else}
        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-name')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-kind')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.nodes.column-bootstrap')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-runtime')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-status')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-version')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-system')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-servers')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-cpu')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-memory')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.column-disk')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.nodes.column-last-seen')}</th>
                <th scope="col" class="text-end text-nowrap"
                  >{$_('pages.servers.nodes.column-actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each approvedNodes as node (node.id)}
                <tr>
                  <th scope="row" class="fw-semibold text-break">
                    <a class="text-reset" href="{base}/servers/nodes/{node.id}"
                      >{getNodeDisplayName(node)}</a>
                  </th>
                  <td>{kindLabel(node)}</td>
                  <td>
                    {#if nodeBootstrapBadge(node)}
                      <span class="badge text-bg-{nodeBootstrapBadge(node).colour}">
                        {$_(nodeBootstrapBadge(node).label)}
                      </span>
                    {:else}
                      <span class="text-body-secondary">—</span>
                    {/if}
                  </td>
                  <td>{node.runtime || NodeRuntimes.PROCESS}</td>
                  <td>
                    <span class="d-inline-flex align-items-center gap-2">
                      <span class="status-dot bg-{nodeStatusColour(node)}"></span>
                      {$_(nodeStatusLabel(node))}
                    </span>
                  </td>
                  <td class="text-break">
                    {node.version || '—'}
                    {#if node.updateAvailable && !updateUnderway(node)}
                      <span
                        class="badge text-bg-warning ms-1"
                        use:tooltip={[
                          node.platformVersion
                            ? $_('pages.servers.nodes.update-hint', {
                                values: { version: node.platformVersion },
                              })
                            : '',
                          { placement: 'top' },
                        ]}>
                        {$_('pages.servers.nodes.update-available')}
                      </span>
                    {/if}
                    <!-- SM-77 — the node replacing its daemon, as Pano reports it to everyone. -->
                    {#if updateProgressOf(node)}
                      <DaemonUpdateProgress
                        progress={updateProgressOf(node)}
                        compact
                        class="mt-1" />
                    {/if}
                  </td>
                  <td class="text-break">{systemOf(node)}</td>
                  <td>{serverCountOf(node)}</td>
                  <td class="usage-cell">{@render usage(cpuOf(node), cpuText(node))}</td>
                  <td class="usage-cell">
                    {@render usage(
                      ratio(metricsOf(node).memUsed, metricsOf(node).memTotal),
                      bytesText(metricsOf(node).memUsed, metricsOf(node).memTotal),
                    )}
                  </td>
                  <td class="usage-cell">
                    {@render usage(
                      ratio(metricsOf(node).diskUsed, metricsOf(node).diskTotal),
                      bytesText(metricsOf(node).diskUsed, metricsOf(node).diskTotal),
                    )}
                  </td>
                  <td>
                    {#if node.lastSeen}
                      <DateComponent time={node.lastSeen} relativeFormat />
                    {:else}
                      <span class="text-body-secondary"
                        >{$_('pages.servers.nodes.never-seen')}</span>
                    {/if}
                  </td>
                  <td class="text-end text-nowrap">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      aria-label={$_('pages.servers.nodes.rename-title')}
                      use:tooltip={[$_('pages.servers.nodes.rename-title'), { placement: 'top' }]}
                      onclick={() => askRename(node)}>
                      <i class="fa-solid fa-pen" aria-hidden="true"></i>
                    </button>
                    {#if canUpdate(node)}
                      <!-- `SELF_UPDATE` is a push down the daemon's own socket, so it only
                           makes sense while the node is connected. -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary ms-1"
                        disabled={isUpdating(node)}
                        aria-label={$_('pages.servers.nodes.update-title')}
                        use:tooltip={[$_('pages.servers.nodes.update-title'), { placement: 'top' }]}
                        onclick={() => updateNode(node)}>
                        {#if isUpdating(node)}
                          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        {:else}
                          <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
                        {/if}
                      </button>
                    {/if}
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger ms-1"
                      aria-label={$_('pages.servers.nodes.delete-title')}
                      use:tooltip={[$_('pages.servers.nodes.delete-title'), { placement: 'top' }]}
                      onclick={() => askDelete(node)}>
                      <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

{#snippet usage(percent, label)}
  {#if percent == null}
    <span class="text-body-secondary">—</span>
  {:else}
    <div class="small">{label}</div>
    <div
      class="progress usage-bar"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin="0"
      aria-valuemax="100">
      <div
        class="progress-bar"
        class:bg-danger={percent >= 90}
        class:bg-warning={percent >= 75 && percent < 90}
        style="width: {percent}%;">
      </div>
    </div>
  {/if}
{/snippet}

<!-- Rename -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={renameModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.servers.nodes.rename-title')}</h5>
        <button
          class="btn-close"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="modal"
          type="button">
        </button>
      </div>
      <div class="modal-body">
        <label class="form-label" for="nodeRenameInput">
          {$_('pages.servers.nodes.rename-label')}
        </label>
        <input
          id="nodeRenameInput"
          type="text"
          class="form-control"
          maxlength="64"
          bind:value={renameValue} />
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn btn-primary col-6 m-0"
          disabled={renameValue.trim().length < 2 || !!busyId}
          onclick={confirmRename}>
          {#if busyId}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.save')}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Delete (SM-64): the node uninstalls itself and takes its servers with it. -->
<DeleteNodeModal bind:this={deleteNodeModal} onDeleted={onNodeDeleted} />

<script module>
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchNodes } from '$lib/nodes.util.js';

  /**
   * Nodes are an admin-only view: `MANAGE_NODES` is checked here as well as in the sidebar, so
   * a hand-typed URL lands back on the servers overview.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const { user } = await parent();

    if (!hasPermission(Permissions.MANAGE_NODES, user)) {
      throw redirect(302, `${base}/servers`);
    }

    const result = await fetchNodes(event);

    return { nodes: result.nodes, unavailable: result.status === 'unavailable' };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { formatBytes } from '$lib/string.util.js';
  import {
    createKeyedLatestThrottle,
    loadMetricRefreshInterval,
    METRIC_REFRESH_INTERVAL_DEFAULT,
    METRIC_REFRESH_INTERVALS,
    metricRefreshIntervalLabel,
    metricRequestInterval,
    storeMetricRefreshInterval,
  } from '$lib/metricsSeries.util.js';
  import {
    cacheNode,
    forgetNode,
    getNodeDisplayName,
    isNodeApproved,
    isNodeOnline,
    newerNodeMetrics,
    NODE_METRICS_INTERVAL_KEY,
    nodeBootstrapBadge,
    NodeKinds,
    NodeRuntimes,
    nodeStatusColour,
    nodeStatusLabel,
    openAddNodeModal,
    requestLocalNodeSetup,
    requestNodeUpdate,
    DaemonUpdateStatuses,
    isDaemonUpdating,
    normalizeDaemonUpdate,
  } from '$lib/nodes.util.js';
  import { isEndpointUnavailable, showServerActionError } from '$lib/servers.util.js';
  import {
    onNode,
    onNodeMetrics,
    onNodeRemoved,
    subscribeNodeMetrics,
  } from '$lib/panelRealtime.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import DeleteNodeModal from '$lib/components/servers/DeleteNodeModal.svelte';
  import DaemonUpdateProgress from '$lib/components/servers/DaemonUpdateProgress.svelte';
  import { confirmNodeUpdate } from '$lib/components/modals/ConfirmUpdateModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { data } = $props();

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.servers.nodes.title');

  /**
   * The node list as the realtime feed has it, or null while the page still shows exactly what
   * `load` returned — which is what SSR renders.
   *
   * @type {object[] | null}
   */
  let liveNodes = $state(null);
  let localSetupBusy = $state(false);
  /** The node id whose request is in flight, so only its own button spins. */
  let busyId = $state(null);
  /**
   * Nodes whose daemon is being replaced (§2.4.3 `SELF_UPDATE`). A node applies the update by
   * restarting, so a row stays marked until it has connected again — that reconnect is the only
   * report that the new jar actually runs.
   *
   * @type {number[]}
   */
  let updatingIds = $state([]);
  /**
   * Set when Pano answered `NOT_EXISTS`: this install has no daemon jar to serve, which is true
   * for every node and not just the one that was clicked.
   */
  let updateUnsupported = $state(false);

  let targetNode = $state(null);
  let renameValue = $state('');
  let renameModalElement = $state();
  let renameModal;
  /** @type {{ show: (node: object) => void } | undefined} */
  let deleteNodeModal = $state();

  /** §2.4.30 — how often the usage cells move, in ms; 0 is Paused. Remembered per browser. */
  let refreshInterval = $state(
    typeof window === 'undefined'
      ? METRIC_REFRESH_INTERVAL_DEFAULT
      : loadMetricRefreshInterval(NODE_METRICS_INTERVAL_KEY),
  );
  let refreshing = $state(false);
  /**
   * Per node id, the newest `nodeMetrics` sample shown (throttled to the chosen interval).
   *
   * @type {Record<string, object>}
   */
  let liveMetrics = $state({});
  /**
   * Per node id, what the cells showed when Paused was chosen (or "Refresh now" was pressed while
   * paused); null while not paused.
   *
   * @type {Record<string, object | null> | null}
   */
  let frozenMetrics = $state(null);
  /** @type {{ release: () => void, update: (intervalMs: number|null) => void } | null} */
  let nodesSubscription = null;

  const metricsThrottle = createKeyedLatestThrottle((nodeId, metrics) => {
    if (refreshInterval === 0) {
      return;
    }

    liveMetrics = { ...liveMetrics, [nodeId]: newerNodeMetrics(liveMetrics[nodeId], metrics) };
  });

  const nodes = $derived(liveNodes ?? data.nodes ?? []);
  const unavailable = $derived(!!data.unavailable);
  const approvedNodes = $derived(nodes.filter((node) => isNodeApproved(node)));
  const pendingNodes = $derived(nodes.filter((node) => !isNodeApproved(node)));

  // A fresh load (navigating back to the page) replaces whatever the feed merged in.
  $effect(() => {
    void data.nodes;

    liveNodes = null;
  });

  /**
   * @param {object} node
   * @returns {string}
   */
  function kindLabel(node) {
    return $_(
      String(node?.kind || '').toUpperCase() === NodeKinds.LOCAL
        ? 'pages.servers.nodes.kind-local'
        : 'pages.servers.nodes.kind-remote',
    );
  }

  /**
   * @param {object} node
   * @returns {string}
   */
  function systemOf(node) {
    const resources = node?.resources || {};

    return (
      [node?.os ?? resources.os, node?.arch ?? resources.arch].filter(Boolean).join('/') || '—'
    );
  }

  /**
   * @param {object} node
   * @returns {number}
   */
  function serverCountOf(node) {
    if (Number.isFinite(Number(node?.serverCount))) {
      return Number(node.serverCount);
    }

    return Array.isArray(node?.servers) ? node.servers.length : 0;
  }

  /**
   * The latest `NODE_METRICS` sample. Where the backend puts it is not nailed down in the
   * contract, so `metrics` is preferred and `resources` (the `NODE_HELLO` totals) fills the
   * gaps.
   *
   * @param {object} node
   * @returns {{ cpu: number|null, memUsed: number|null, memTotal: number|null, diskUsed: number|null, diskTotal: number|null }}
   */
  function metricsOf(node) {
    const metrics = shownMetricsOf(node) || {};
    const resources = node?.resources || {};

    return {
      cpu: numberOrNull(metrics.cpu ?? resources.cpu),
      memUsed: numberOrNull(metrics.memUsed ?? resources.memUsed),
      memTotal: numberOrNull(metrics.memTotal ?? resources.memTotal),
      diskUsed: numberOrNull(metrics.diskUsed ?? resources.diskUsed),
      diskTotal: numberOrNull(metrics.diskTotal ?? resources.diskTotal),
    };
  }

  /**
   * The sample the cells draw: frozen while paused, otherwise the newest of the live frame and
   * the row's own.
   *
   * @param {object} node
   * @returns {object | null}
   */
  function shownMetricsOf(node) {
    // A node that appeared after the pause has no frozen picture yet; it shows its row's.
    if (frozenMetrics && node?.id in frozenMetrics) {
      return frozenMetrics[node.id];
    }

    return newerNodeMetrics(node?.metrics, liveMetrics[node?.id]);
  }

  /** Takes the current picture as the paused one. */
  function freezeMetrics() {
    frozenMetrics = null;
    frozenMetrics = Object.fromEntries(nodes.map((node) => [node.id, shownMetricsOf(node)]));
  }

  function onRefreshIntervalChange() {
    storeMetricRefreshInterval(NODE_METRICS_INTERVAL_KEY, refreshInterval);
    metricsThrottle.setInterval(refreshInterval || 1000);
    nodesSubscription?.update(metricRequestInterval(refreshInterval));

    if (refreshInterval === 0) {
      freezeMetrics();
    } else {
      frozenMetrics = null;
    }
  }

  /** Re-reads the list now — also while paused, where it becomes the new frozen picture. */
  async function refreshNow() {
    if (refreshing) {
      return;
    }

    refreshing = true;

    try {
      await refreshNodes();
    } finally {
      refreshing = false;
    }

    if (refreshInterval === 0) {
      frozenMetrics = null;
      liveMetrics = {};
      freezeMetrics();
    }
  }

  /**
   * @param {unknown} value
   * @returns {number|null}
   */
  function numberOrNull(value) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * @param {number|null} used
   * @param {number|null} total
   * @returns {number|null} 0-100, or null when the node reported nothing.
   */
  function ratio(used, total) {
    if (used == null || !total) {
      return null;
    }

    return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
  }

  /**
   * @param {object} node
   * @returns {number|null}
   */
  function cpuOf(node) {
    const cpu = metricsOf(node).cpu;

    return cpu == null ? null : Math.max(0, Math.min(100, Math.round(cpu)));
  }

  /**
   * @param {object} node
   * @returns {string}
   */
  function cpuText(node) {
    const cpu = cpuOf(node);

    return cpu == null ? '—' : `${cpu}%`;
  }

  /**
   * @param {number|null} used
   * @param {number|null} total
   * @returns {string}
   */
  function bytesText(used, total) {
    if (used == null || !total) {
      return '—';
    }

    return `${formatBytes(used, 1)} / ${formatBytes(total, 1)}`;
  }

  function openAddNode() {
    // The modal is mounted app-wide by the sidebar; the fallback covers a build without it.
    if (!openAddNodeModal()) {
      void showError('pages.servers.nodes.add-unavailable');
    }
  }

  async function setupLocalNode() {
    localSetupBusy = true;

    const result = await requestLocalNodeSetup();

    localSetupBusy = false;

    if (result.status === 'network') {
      return;
    }

    if (result.status === 'unavailable') {
      await showError('pages.servers.nodes.local-setup-unavailable');

      return;
    }

    if (result.status === 'error') {
      await showServerActionError(result.error);

      return;
    }

    await showSuccess('pages.servers.nodes.local-setup-started');
  }

  /**
   * @param {object} node
   * @returns {boolean} whether this node can be handed a new daemon right now.
   */
  function canUpdate(node) {
    // An update in flight keeps the button (and its spinner) on screen while the daemon
    // restarts and the node is briefly offline.
    if (isUpdating(node)) {
      return true;
    }

    return !updateUnsupported && node?.updateAvailable === true && isNodeOnline(node);
  }

  /**
   * @param {object | null | undefined} node
   * @returns {boolean} whether the node is on its way to a new daemon: Pano says so on the node
   *   (SM-77, the same for every tab), or — on a backend that does not — this tab asked for it and
   *   the node has not reconnected since.
   */
  function isUpdating(node) {
    return (
      updatingIds.includes(Number(node?.id)) ||
      isDaemonUpdating(normalizeDaemonUpdate(node?.updateProgress))
    );
  }

  /**
   * @param {object | null | undefined} node
   * @returns {object | null} the node's `updateProgress` (SM-77), when there is one to show.
   */
  function updateProgressOf(node) {
    return normalizeDaemonUpdate(node?.updateProgress);
  }

  /**
   * @param {object | null | undefined} node
   * @returns {boolean} whether the node's update bar stands in for its "Update available" badge:
   *   while it runs and while "Updated" shows. A failed one offers the update again.
   */
  function updateUnderway(node) {
    const status = updateProgressOf(node)?.status;

    return !!status && status !== DaemonUpdateStatuses.FAILED;
  }

  /**
   * @param {number|string} nodeId
   */
  function stopUpdating(nodeId) {
    updatingIds = updatingIds.filter((entry) => entry !== Number(nodeId));
  }

  /**
   * @param {object} node
   */
  async function updateNode(node) {
    if (isUpdating(node)) {
      return;
    }

    const confirmed = await confirmNodeUpdate({
      name: getNodeDisplayName(node),
      current: node.version ?? null,
      latest: node.platformVersion ?? null,
    });

    if (!confirmed || isUpdating(node)) {
      return;
    }

    const id = Number(node.id);

    updatingIds = [...updatingIds, id];

    const result = await requestNodeUpdate(id);

    if (result.status === 'network') {
      stopUpdating(id);

      return;
    }

    if (result.status === 'unavailable') {
      stopUpdating(id);
      await showError('pages.servers.nodes.update-unavailable');

      return;
    }

    if (result.status === 'error') {
      stopUpdating(id);

      // Pano has no daemon jar of its own to offer, so no node can be updated from here at all.
      if (result.error === 'NOT_EXISTS') {
        updateUnsupported = true;
        await showError('pages.servers.nodes.update-no-jar');

        return;
      }

      await showServerActionError(result.error);

      return;
    }

    if (result.upToDate) {
      stopUpdating(id);
      mergeNode({ ...node, updateAvailable: false });
      await showSuccess('pages.servers.nodes.update-up-to-date');

      return;
    }

    // A Pano that reports `updateProgress` pushes every step of it on the node's frames, to
    // every tab; only an older one leaves this tab to wait for the reconnect itself.
    if (node && 'updateProgress' in node) {
      stopUpdating(id);
    }

    await showSuccess('pages.servers.nodes.update-sent');
  }

  /** Re-reads the list, because `updateAvailable` and `platformVersion` are REST-only. */
  async function refreshNodes() {
    const result = await fetchNodes();

    if (result.status === 'ok') {
      liveNodes = result.nodes;
    }
  }

  /**
   * @param {object} node
   */
  async function acceptNode(node) {
    busyId = node.id;

    const body = await ApiUtil.post({
      path: `/api/panel/nodes/${node.id}/accept`,
      handler: (response) => response,
    });

    busyId = null;

    if (!handled(body)) {
      return;
    }

    mergeNode({ ...node, approved: true });
    await showSuccess('pages.servers.nodes.accepted', { name: getNodeDisplayName(node) });
  }

  /**
   * @param {object} node
   */
  function askRename(node) {
    targetNode = node;
    renameValue = getNodeDisplayName(node);
    renameModal?.show();
  }

  async function confirmRename() {
    const node = targetNode;

    if (!node || busyId) {
      return;
    }

    busyId = node.id;

    const body = await ApiUtil.put({
      path: `/api/panel/nodes/${node.id}`,
      body: { name: renameValue.trim() },
      handler: (response) => response,
    });

    busyId = null;

    if (!handled(body)) {
      return;
    }

    mergeNode({ ...node, name: renameValue.trim() });
    renameModal?.hide();
    await showSuccess('pages.servers.nodes.renamed', { name: renameValue.trim() });
  }

  /**
   * @param {object} node
   */
  function askDelete(node) {
    deleteNodeModal?.show(node);
  }

  /**
   * The node is gone, and so are its servers. A local node goes back to "not set up", so the
   * list is re-read rather than just filtered.
   *
   * @param {object} node
   */
  function onNodeDeleted(node) {
    liveNodes = nodes.filter((entry) => Number(entry.id) !== Number(node.id));
    forgetNode(node.id);
    stopUpdating(node.id);
    void refreshNodes();
  }

  /**
   * Shared response triage: false means the caller already told the user what went wrong.
   *
   * @param {unknown} body
   * @returns {boolean}
   */
  function handled(body) {
    // `undefined`/`null` is the network-error path — ApiUtil already raised the splash.
    if (body === undefined || body === null) {
      return false;
    }

    if (isEndpointUnavailable(body)) {
      void showError('pages.servers.errors.unavailable');

      return false;
    }

    const error = /** @type {{ error?: string }} */ (body).error;

    if (error) {
      void showServerActionError(error);

      return false;
    }

    return true;
  }

  /**
   * @param {object} node
   */
  function mergeNode(node) {
    const cached = cacheNode(node);

    if (!cached) {
      return;
    }

    const index = nodes.findIndex((entry) => Number(entry.id) === Number(cached.id));

    liveNodes =
      index === -1
        ? [...nodes, cached]
        : nodes.map((entry, position) => (position === index ? cached : entry));
  }

  onMount(() => {
    // The dialog holds input the admin would lose to a stray backdrop click.
    renameModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(renameModalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    nodesSubscription = subscribeNodeMetrics(metricRequestInterval(refreshInterval));
    metricsThrottle.setInterval(refreshInterval || 1000);

    if (refreshInterval === 0) {
      freezeMetrics();
    }

    const offNodeMetrics = onNodeMetrics(({ nodeId, metrics }) => {
      if (refreshInterval !== 0) {
        metricsThrottle.push(nodeId, metrics);
      }
    });

    const offNode = onNode(({ node }) => {
      const previous = nodes.find((entry) => Number(entry.id) === Number(node.id));
      const finished =
        updateProgressOf(node)?.status === DaemonUpdateStatuses.DONE &&
        updateProgressOf(previous)?.status !== DaemonUpdateStatuses.DONE;
      const reconnected =
        updatingIds.includes(Number(node.id)) && isNodeOnline(node) && !isNodeOnline(previous);

      mergeNode(node);

      // Updated (SM-77), or — from a Pano that does not say — back online after the self-update
      // restart: the node frame carries the row, not what the update did to `updateAvailable`,
      // so the list is re-read instead of guessed at.
      if (finished || reconnected) {
        stopUpdating(node.id);
        void refreshNodes();
      }
    });
    const offNodeRemoved = onNodeRemoved(({ nodeId }) => {
      liveNodes = nodes.filter((entry) => Number(entry.id) !== Number(nodeId));
      forgetNode(nodeId);
      stopUpdating(nodeId);
    });

    return () => {
      offNode();
      offNodeRemoved();
      offNodeMetrics();
      metricsThrottle.cancel();
      nodesSubscription?.release();
      nodesSubscription = null;
      renameModal?.hide();
      renameModal = null;
    };
  });
</script>
