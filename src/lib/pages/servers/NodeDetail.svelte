<!-- One node (SM-63): what it is, and the Java runtimes it has. -->
<div class="container vstack gap-3">
  <PageActions middleClasses="d-none">
    <div slot="left">
      <a class="btn btn-sm btn-link" href="{base}/servers/nodes">
        <i class="fa-solid fa-arrow-left me-1" aria-hidden="true"></i>
        {$_('pages.servers.nodes.title')}
      </a>
    </div>
    <div slot="right">
      <button
        type="button"
        class="btn btn-sm btn-link link-danger"
        aria-label={$_('buttons.delete')}
        use:tooltip={[$_('buttons.delete'), { placement: 'bottom' }]}
        onclick={() => deleteNodeModal?.show(node)}>
        <i class="fa-solid fa-trash" aria-hidden="true"></i>
      </button>
    </div>
  </PageActions>

  {#if node?.unreachable}
    <div
      class="alert alert-danger d-flex align-items-start mb-0"
      role="alert"
      data-node-unreachable>
      <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
      <div>
        <h5 class="alert-heading mb-2">{$_('pages.servers.nodes.unreachable-title')}</h5>
        <div>{$_('pages.servers.nodes.unreachable-description')}</div>
        {#if unreachablePath}
          <a class="btn alert-btn mt-2" href={unreachablePath} download>
            {$_('pages.servers.nodes.unreachable-download')}
          </a>
        {/if}
      </div>
    </div>
  {/if}

  <div class="card">
    <CardHeader truncateLeftSlot={false}>
      <span slot="left" class="d-inline-flex align-items-center gap-2 text-break">
        {getNodeDisplayName(node)}
        <span class="badge text-bg-{nodeStatusColour(node)}">{$_(nodeStatusLabel(node))}</span>
      </span>
      <span slot="right" class="d-flex flex-wrap align-items-center justify-content-end gap-2">
        <!-- §2.4.30: how often the usage rows below move. -->
        <select
          class="form-select form-select-sm w-auto"
          aria-label={$_('pages.servers.overview.refresh-interval')}
          bind:value={refreshInterval}
          onchange={onRefreshIntervalChange}>
          {#each METRIC_REFRESH_INTERVALS as interval (interval)}
            <option value={interval}>{metricRefreshIntervalLabel(interval, $_)}</option>
          {/each}
        </select>
        <button
          type="button"
          class="btn btn-sm btn-primary"
          aria-label={$_('pages.servers.overview.refresh-now')}
          use:tooltip={[$_('pages.servers.overview.refresh-now'), { placement: 'bottom' }]}
          disabled={refreshing}
          onclick={refreshNow}>
          <i class="fa-solid fa-rotate-right" class:fa-spin={refreshing} aria-hidden="true"></i>
        </button>
      </span>
    </CardHeader>
    <div class="card-body">
      <dl class="row mb-0 small">
        <dt class="col-sm-4 col-lg-2">{$_('pages.servers.nodes.column-kind')}</dt>
        <dd class="col-sm-8 col-lg-4">{kindLabel}</dd>
        <dt class="col-sm-4 col-lg-2">{$_('pages.servers.nodes.column-version')}</dt>
        <dd class="col-sm-8 col-lg-4 text-break">
          <span class="d-inline-flex flex-wrap align-items-center gap-2">
            {node?.version || '—'}
            {#if node?.updateAvailable === true && !updateUnderway}
              <span
                class="badge text-bg-warning"
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
              {#if canUpdate}
                <!-- `SELF_UPDATE` goes down the daemon's own socket, so only while it is
                     connected; the servers keep running (SM-77 asks first). -->
                <button
                  type="button"
                  class="btn btn-sm btn-outline-warning py-0"
                  disabled={updateBusy}
                  onclick={updateNode}>
                  {#if updateBusy}
                    <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                  {/if}
                  {$_('buttons.update')}
                </button>
              {/if}
            {/if}
          </span>
          <!-- SM-77 — the node replacing its daemon, as Pano reports it to everyone. -->
          {#if updateProgress}
            <DaemonUpdateProgress progress={updateProgress} compact class="mt-1" />
          {/if}
        </dd>
        <dt class="col-sm-4 col-lg-2">{$_('pages.servers.nodes.column-system')}</dt>
        <dd class="col-sm-8 col-lg-4 text-break">{systemLabel}</dd>
        <dt class="col-sm-4 col-lg-2">{$_('pages.servers.nodes.column-runtime')}</dt>
        <dd class="col-sm-8 col-lg-4">{node?.runtime || NodeRuntimes.PROCESS}</dd>
        <dt class="col-sm-4 col-lg-2">{$_('pages.servers.nodes.column-last-seen')}</dt>
        <dd class="col-sm-8 col-lg-4 mb-0">
          {#if node?.lastSeen}
            <DateComponent time={node.lastSeen} relativeFormat />
          {:else}
            {$_('pages.servers.nodes.never-seen')}
          {/if}
        </dd>
      </dl>
    </div>
  </div>

  <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-xl-4">
    <div class="col">
      <div class="card text-bg-warning h-100">
        <div class="card-body">
          <p class="text-truncate m-0">{$_('pages.servers.nodes.column-cpu')}</p>
          <span class="fs-2 lh-1">{cpuPercent == null ? '—' : `${cpuPercent}%`}</span>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-bg-primary h-100">
        <div class="card-body">
          <p class="text-truncate m-0">{$_('pages.servers.nodes.column-memory')}</p>
          <div class="d-flex align-items-baseline gap-2">
            <span class="fs-2 lh-1">{usedText(metrics.memUsed, metrics.memTotal)}</span>
            <span class="text-truncate small">{totalText(metrics.memTotal)}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-bg-secondary h-100">
        <div class="card-body">
          <p class="text-truncate m-0">{$_('pages.servers.nodes.column-disk')}</p>
          <div class="d-flex align-items-baseline gap-2">
            <span class="fs-2 lh-1">{usedText(metrics.diskUsed, metrics.diskTotal)}</span>
            <span class="text-truncate small">{totalText(metrics.diskTotal)}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-bg-info h-100">
        <div class="card-body">
          <p class="text-truncate m-0">{$_('pages.servers.nodes.column-network')}</p>
          <div class="d-flex align-items-baseline gap-2">
            <span class="fs-2 lh-1">
              <i class="fa-solid fa-arrow-down fs-6 me-1" aria-hidden="true"></i>{rateText(
                metrics.netRxBps,
              )}
            </span>
            <span class="text-truncate small">
              <i class="fa-solid fa-arrow-up me-1" aria-hidden="true"></i>{rateText(
                metrics.netTxBps,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#key node?.id}
    <NodeServersCard {node} {refreshInterval} />
    <NodeJavaCard {node} />
  {/key}
</div>

<DeleteNodeModal bind:this={deleteNodeModal} onDeleted={leaveDeletedNode} />

<script module>
  import { error, redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchNode } from '$lib/nodes.util.js';

  /**
   * `MANAGE_NODES` only, like the list. A node that does not exist (or a backend that cannot say)
   * sends the admin back to the list.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { user } = await parent();

    if (!hasPermission(Permissions.MANAGE_NODES, user)) {
      throw redirect(302, `${base}/`);
    }

    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      throw error(404, 'Not found');
    }

    const node = await fetchNode(id, event);

    if (!node) {
      throw redirect(302, `${base}/servers/nodes`);
    }

    return { node };
  }
</script>

<script>
  import { getContext, onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import {
    cacheNode,
    DaemonUpdateStatuses,
    fetchNodeStatus,
    forgetNode,
    getNodeDisplayName,
    isNodeOnline,
    newerNodeMetrics,
    NODE_METRICS_INTERVAL_KEY,
    NodeKinds,
    NodeRuntimes,
    nodeStatusColour,
    nodeStatusLabel,
    normalizeDaemonUpdate,
    requestNodeUpdate,
  } from '$lib/nodes.util.js';
  import { showServerActionError } from '$lib/servers.util.js';
  import {
    onNode,
    onNodeMetrics,
    onNodeRemoved,
    subscribeNodeMetrics,
  } from '$lib/panelRealtime.js';
  import {
    createKeyedLatestThrottle,
    loadMetricRefreshInterval,
    METRIC_REFRESH_INTERVAL_DEFAULT,
    METRIC_REFRESH_INTERVALS,
    metricRefreshIntervalLabel,
    metricRequestInterval,
    storeMetricRefreshInterval,
  } from '$lib/metricsSeries.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import tooltip from '$lib/tooltip.util';
  import { goto } from '$app/navigation';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import NodeJavaCard from '$lib/components/servers/NodeJavaCard.svelte';
  import NodeServersCard from '$lib/components/servers/NodeServersCard.svelte';
  import DeleteNodeModal from '$lib/components/servers/DeleteNodeModal.svelte';
  import DaemonUpdateProgress from '$lib/components/servers/DaemonUpdateProgress.svelte';
  import { confirmNodeUpdate } from '$lib/components/modals/ConfirmUpdateModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { data } = $props();

  const pageTitle = getContext('pageTitle');

  /** The row the node feed last pushed, or null while the page still shows what `load` read. */
  let liveNode = $state(null);
  /** @type {{ show: (node: object) => void, isActive: () => boolean } | undefined} */
  let deleteNodeModal = $state();

  /** §2.4.30 — how often the usage rows move, in ms; 0 is Paused. Shared with the Nodes page. */
  let refreshInterval = $state(
    typeof window === 'undefined'
      ? METRIC_REFRESH_INTERVAL_DEFAULT
      : loadMetricRefreshInterval(NODE_METRICS_INTERVAL_KEY),
  );
  let refreshing = $state(false);
  /** The newest `nodeMetrics` sample and the node it belongs to, throttled to the interval. */
  /** @type {{ nodeId: number, sample: object } | null} */
  let liveMetrics = $state(null);
  /** What the rows showed when Paused was chosen; undefined while not paused. */
  /** @type {object | null | undefined} */
  let frozenMetrics = $state(undefined);
  /** @type {{ release: () => void, update: (intervalMs: number|null) => void } | null} */
  let nodeSubscription = null;

  const metricsThrottle = createKeyedLatestThrottle((nodeId, sample) => {
    if (refreshInterval !== 0) {
      const previous = Number(liveMetrics?.nodeId) === Number(nodeId) ? liveMetrics.sample : null;

      liveMetrics = { nodeId: Number(nodeId), sample: newerNodeMetrics(previous, sample) };
    }
  });

  const node = $derived(
    liveNode && Number(liveNode.id) === Number(data.node?.id) ? liveNode : data.node,
  );
  const unreachablePath = $derived.by(() => {
    const path = node?.unreachable?.downloadPath;

    return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '';
  });
  const kindLabel = $derived(
    $_(
      String(node?.kind || '').toUpperCase() === NodeKinds.LOCAL
        ? 'pages.servers.nodes.kind-local'
        : 'pages.servers.nodes.kind-remote',
    ),
  );
  const systemLabel = $derived(
    [node?.os ?? node?.resources?.os, node?.arch ?? node?.resources?.arch]
      .filter(Boolean)
      .join('/') || '—',
  );

  const currentMetrics = $derived(
    newerNodeMetrics(
      node?.metrics,
      Number(liveMetrics?.nodeId) === Number(node?.id) ? liveMetrics.sample : null,
    ),
  );
  const metrics = $derived(
    /** @type {Record<string, number | null>} */ (
      (frozenMetrics === undefined ? currentMetrics : frozenMetrics) || {}
    ),
  );
  /** SM-77 — Pano's record of this node replacing its daemon, from the node JSON and its frames. */
  const updateProgress = $derived(normalizeDaemonUpdate(node?.updateProgress));
  /** The bar stands in for the badge while it runs and says "Updated"; a failure offers it again. */
  const updateUnderway = $derived(
    !!updateProgress && updateProgress.status !== DaemonUpdateStatuses.FAILED,
  );
  /** Only while the POST is out: what the update does after that is [updateProgress]. */
  let updateBusy = $state(false);
  const canUpdate = $derived(updateBusy || isNodeOnline(node));

  const cpuPercent = $derived(
    Number.isFinite(Number(metrics.cpu)) && metrics.cpu != null
      ? Math.max(0, Math.min(100, Math.round(Number(metrics.cpu))))
      : null,
  );

  /**
   * @param {number | null | undefined} used
   * @param {number | null | undefined} total
   * @returns {string}
   */
  function usedText(used, total) {
    return used == null || !total ? '—' : formatBytes(used, 1);
  }

  /**
   * @param {number | null | undefined} total
   * @returns {string}
   */
  function totalText(total) {
    return total ? `/ ${formatBytes(total, 1)}` : '';
  }

  /**
   * @param {number | null | undefined} bytesPerSecond
   * @returns {string}
   */
  function rateText(bytesPerSecond) {
    return bytesPerSecond == null ? '—' : `${formatBytes(bytesPerSecond, 1)}/s`;
  }

  function onRefreshIntervalChange() {
    storeMetricRefreshInterval(NODE_METRICS_INTERVAL_KEY, refreshInterval);
    metricsThrottle.setInterval(refreshInterval || 1000);
    nodeSubscription?.update(metricRequestInterval(refreshInterval));
    frozenMetrics = refreshInterval === 0 ? currentMetrics : undefined;
  }

  /** Re-reads the node now — also while paused, where it becomes the new frozen picture. */
  async function refreshNow() {
    if (refreshing) {
      return;
    }

    refreshing = true;

    try {
      const row = await fetchNodeStatus(data.node?.id);

      if (row) {
        liveNode = row;
        liveMetrics = null;
      }
    } finally {
      refreshing = false;
    }

    if (refreshInterval === 0) {
      frozenMetrics = currentMetrics;
    }
  }

  // Another node in the same page instance (a link between node pages): its own samples only.
  $effect(() => {
    const id = data.node?.id;

    nodeSubscription?.update(metricRequestInterval(untrack(() => refreshInterval)), [id]);
  });

  $effect(() => {
    pageTitle.set(getNodeDisplayName(node) || 'pages.servers.nodes.title');
  });

  /** Hands the node the daemon this Pano serves, once the admin confirms. */
  async function updateNode() {
    const target = node;

    if (updateBusy || !target) {
      return;
    }

    const confirmed = await confirmNodeUpdate({
      name: getNodeDisplayName(target),
      current: target.version ?? null,
      latest: target.platformVersion ?? null,
    });

    if (!confirmed) {
      return;
    }

    updateBusy = true;

    try {
      const result = await requestNodeUpdate(target.id);

      if (result.status === 'network') {
        return;
      }

      if (result.status === 'unavailable') {
        await showError('pages.servers.nodes.update-unavailable');

        return;
      }

      if (result.status === 'error') {
        await (result.error?.code === 'NOT_EXISTS'
          ? showError('pages.servers.nodes.update-no-jar')
          : showServerActionError(result.error));

        return;
      }

      if (result.upToDate) {
        liveNode = cacheNode({ ...target, updateAvailable: false });
        await showSuccess('pages.servers.nodes.update-up-to-date');

        return;
      }

      await showSuccess('pages.servers.nodes.update-sent');
    } finally {
      updateBusy = false;
    }
  }

  /** The node this page shows is gone — back to the list, which re-reads the nodes. */
  function leaveDeletedNode() {
    forgetNode(data.node?.id);
    void goto(`${base}/servers/nodes`, { replaceState: true, invalidateAll: true });
  }

  onMount(() => {
    // Only this node's samples: the hub asks just this one to report faster.
    nodeSubscription = subscribeNodeMetrics(metricRequestInterval(refreshInterval), [
      data.node?.id,
    ]);
    metricsThrottle.setInterval(refreshInterval || 1000);

    if (refreshInterval === 0) {
      frozenMetrics = currentMetrics;
    }

    const offNodeMetrics = onNodeMetrics(({ nodeId, metrics: sample }) => {
      if (refreshInterval !== 0 && Number(nodeId) === Number(data.node?.id)) {
        metricsThrottle.push(nodeId, sample);
      }
    });

    const offNode = onNode(({ node: row }) => {
      if (Number(row?.id) !== Number(data.node?.id)) {
        return;
      }

      const wasDone = updateProgress?.status === DaemonUpdateStatuses.DONE;

      liveNode = cacheNode({ ...node, ...row });

      // Updated (SM-77): `updateAvailable` is not on the frame, so the row is read again.
      if (
        !wasDone &&
        normalizeDaemonUpdate(row?.updateProgress)?.status === DaemonUpdateStatuses.DONE
      ) {
        void fetchNodeStatus(row.id).then((fresh) => {
          if (fresh && Number(fresh.id) === Number(data.node?.id)) {
            liveNode = fresh;
          }
        });
      }
    });
    const offNodeRemoved = onNodeRemoved(({ nodeId }) => {
      // Deleted from this page: the dialog is still showing progress or the manual steps, and
      // takes the admin back to the list itself once it closes.
      if (Number(nodeId) === Number(data.node?.id) && !deleteNodeModal?.isActive()) {
        void goto(`${base}/servers/nodes`);
      }
    });

    return () => {
      offNode();
      offNodeRemoved();
      offNodeMetrics();
      metricsThrottle.cancel();
      nodeSubscription?.release();
      nodeSubscription = null;
    };
  });
</script>
