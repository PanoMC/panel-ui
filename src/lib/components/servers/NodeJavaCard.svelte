<style>
  .java-path {
    display: block;
    max-width: 22rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
  }

  .java-progress {
    height: 4px;
    min-width: 96px;
  }
</style>

<!-- Java runtimes on a node (SM-63, §2.4.28): what the host has, which of it Pano installed, and
     the downloads the node can make for its os/arch. -->
<div class="card">
  <CardHeader truncateLeftSlot={false}>
    <span slot="left">
      <i class="fa-brands fa-java me-2" aria-hidden="true"></i>
      {$_('pages.servers.nodes.java.title')}
    </span>
    <span slot="right" class="d-flex align-items-center gap-2">
      {#if catalogLoaded && (!managesJava || endpointMissing)}
        <!-- An older daemon cannot download Java at all; updating it is the fix. -->
        <span
          class="text-body-secondary small"
          use:tooltip={[$_('pages.servers.nodes.java.outdated-node'), { placement: 'top' }]}>
          <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
          {$_('pages.servers.nodes.java.downloads-unsupported')}
        </span>
      {:else if catalogLoaded}
        <!-- A disabled button swallows pointer events, so the tooltip sits on the wrapper. -->
        <span class="d-inline-block" use:tooltip={[installTooltip, { placement: 'top' }]}>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            disabled={!canInstall}
            onclick={openInstallModal}>
            <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
            {$_('pages.servers.nodes.java.install')}
          </button>
        </span>
      {/if}
    </span>
  </CardHeader>

  <div class="card-body vstack gap-2">
    {#if loading && !catalogLoaded}
      <div class="placeholder-glow" aria-busy="true">
        <span class="placeholder col-6"></span>
        <span class="placeholder col-4"></span>
      </div>
    {:else if rows.length === 0 && pendingInstalls.length === 0}
      <div class="text-body-secondary small">
        {$_('pages.servers.nodes.java.empty')}
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" class="text-nowrap">{$_('pages.servers.nodes.java.column-major')}</th>
              <th scope="col" class="text-nowrap"
                >{$_('pages.servers.nodes.java.column-version')}</th>
              <th scope="col" class="text-nowrap"
                >{$_('pages.servers.nodes.java.column-vendor')}</th>
              <th scope="col" class="text-nowrap"
                >{$_('pages.servers.nodes.java.column-source')}</th>
              <th scope="col">{$_('pages.servers.nodes.java.column-path')}</th>
              <th scope="col" class="text-nowrap"
                >{$_('pages.servers.nodes.java.column-used-by')}</th>
              <th scope="col" class="text-end text-nowrap"
                >{$_('pages.servers.nodes.column-actions')}</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as runtime (runtime.path || `${runtime.major}-${runtime.version}`)}
              {@const task = taskFor(runtime.major)}
              {@const update = updateFor(runtime)}
              <tr>
                <th scope="row" class="text-nowrap">Java {runtime.major}</th>
                <td class="text-nowrap">{runtime.version || '—'}</td>
                <td class="text-nowrap">{vendorLabel(runtime.vendor)}</td>
                <td>
                  {#if runtime.managed}
                    <span
                      class="badge text-bg-primary"
                      use:tooltip={[
                        $_('pages.servers.nodes.java.source-pano-hint'),
                        { placement: 'top' },
                      ]}>
                      {$_('pages.servers.nodes.java.source-pano')}
                    </span>
                  {:else}
                    <span
                      class="badge text-bg-secondary"
                      use:tooltip={[
                        $_('pages.servers.nodes.java.source-system-hint'),
                        { placement: 'top' },
                      ]}>
                      {$_('pages.servers.nodes.java.source-system')}
                    </span>
                  {/if}
                </td>
                <td>
                  <span class="font-monospace text-body-secondary java-path" title={runtime.path}
                    >{runtime.path || '—'}</span>
                </td>
                <td>
                  {#if runtime.usedBy.length === 0}
                    <span class="text-body-secondary">—</span>
                  {:else}
                    <span class="d-flex flex-wrap gap-1">
                      {#each runtime.usedBy as server, index (server.id ?? `uuid-${index}`)}
                        {#if server.id != null}
                          <a
                            class="badge text-bg-light border text-decoration-none"
                            href="{base}/servers/{server.id}">
                            {server.name || `#${server.id}`}
                          </a>
                        {:else}
                          <span class="badge text-bg-light border"
                            >{server.name || $_('pages.servers.nodes.java.unknown-server')}</span>
                        {/if}
                      {/each}
                    </span>
                  {/if}
                </td>
                <td class="text-end text-nowrap">
                  {#if task && runtime.managed}
                    {@render progress(task)}
                  {:else if runtime.managed && managesJava}
                    {#if update}
                      <span
                        class="d-inline-block"
                        use:tooltip={[
                          update.version
                            ? $_('pages.servers.nodes.java.update-hint', {
                                values: { version: update.version },
                              })
                            : '',
                          { placement: 'top' },
                        ]}>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          disabled={!nodeOnline || !!task}
                          onclick={() => install(runtime.major)}>
                          <i class="fa-solid fa-arrow-up me-1" aria-hidden="true"></i>
                          {$_('pages.servers.nodes.java.update')}
                        </button>
                      </span>
                    {/if}
                    <span
                      class="d-inline-block ms-1"
                      use:tooltip={[removeTooltip(runtime), { placement: 'top' }]}>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        aria-label={$_('pages.servers.nodes.java.remove')}
                        disabled={!canRemove(runtime)}
                        onclick={() => askRemove(runtime)}>
                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                      </button>
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
            {#each pendingInstalls as task (task.major)}
              <tr>
                <th scope="row" class="text-nowrap">Java {task.major}</th>
                <td colspan="5" class="text-body-secondary small text-break">
                  {task.message || $_('pages.servers.nodes.java.installing')}
                </td>
                <td class="text-end">{@render progress(task)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if catalogError}
      <div class="small text-warning-emphasis">
        <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
        {catalogError}
      </div>
    {/if}

    {#if autoDownload !== null}
      <div class="small text-body-secondary">
        <i
          class="fa-solid {autoDownload ? 'fa-wand-magic-sparkles' : 'fa-hand'} me-1"
          aria-hidden="true"></i>
        {$_(
          autoDownload
            ? 'pages.servers.nodes.java.auto-download-on'
            : 'pages.servers.nodes.java.auto-download-off',
        )}
      </div>
    {/if}
  </div>
</div>

{#snippet progress(task)}
  <div class="d-inline-flex flex-column align-items-end gap-1">
    <span class="small text-body-secondary text-nowrap">
      {$_(
        task.kind === JavaTaskKinds.REMOVE
          ? 'pages.servers.nodes.java.removing'
          : 'pages.servers.nodes.java.installing',
      )}
      <span class="font-monospace">{task.percent}%</span>
    </span>
    <div
      class="progress java-progress"
      role="progressbar"
      aria-label={$_('pages.servers.nodes.java.installing')}
      aria-valuenow={task.percent}
      aria-valuemin="0"
      aria-valuemax="100">
      <div
        class="progress-bar progress-bar-striped progress-bar-animated"
        class:bg-danger={task.kind === JavaTaskKinds.REMOVE}
        style="width: {Math.max(task.percent, 5)}%;">
      </div>
    </div>
  </div>
{/snippet}

<!-- Install Java: the majors this node's os/arch can download. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={installModalElement}>
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.servers.nodes.java.install-title')}</h5>
        <button
          class="btn-close"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="modal"
          type="button">
        </button>
      </div>
      <div class="modal-body">
        <p class="small text-body-secondary">
          {$_('pages.servers.nodes.java.install-description')}
        </p>
        {#if downloadable.length === 0}
          <div class="small text-body-secondary">
            {catalogError || $_('pages.servers.nodes.java.install-empty')}
          </div>
        {:else}
          <div class="list-group">
            {#each downloadable as entry (entry.major)}
              {@const hint = javaMajorHint(entry.major)}
              {@const running = taskFor(entry.major)}
              <div
                class="list-group-item d-flex align-items-center gap-3"
                class:opacity-50={!entry.available}>
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-semibold">
                    Java {entry.major}
                    {#if entry.installedVersion && !entry.updateAvailable}
                      <span class="badge text-bg-success ms-1"
                        >{$_('pages.servers.nodes.java.installed')}</span>
                    {:else if entry.updateAvailable}
                      <span class="badge text-bg-warning ms-1"
                        >{$_('pages.servers.nodes.java.update-available')}</span>
                    {/if}
                  </div>
                  {#if entry.available}
                    <div class="small text-body-secondary text-break">
                      {[vendorLabel(entry.vendor), entry.version, javaDownloadSize(entry.size)]
                        .filter((part) => part && part !== '—')
                        .join(' · ')}
                    </div>
                    {#if hint}
                      <div class="small text-body-secondary">{$_(hint)}</div>
                    {/if}
                  {:else}
                    <div class="small text-body-secondary">
                      {$_('pages.servers.nodes.java.not-available', {
                        values: { platform: platformLabel },
                      })}
                    </div>
                  {/if}
                </div>
                {#if entry.available}
                  <button
                    type="button"
                    class="btn btn-sm {entry.installedVersion && !entry.updateAvailable
                      ? 'btn-outline-secondary'
                      : 'btn-outline-primary'} flex-shrink-0"
                    disabled={!!running ||
                      !nodeOnline ||
                      (!!entry.installedVersion && !entry.updateAvailable)}
                    onclick={() => install(entry.major, true)}>
                    {#if running}
                      <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                    {/if}
                    {$_(
                      entry.updateAvailable
                        ? 'pages.servers.nodes.java.update'
                        : entry.installedVersion
                          ? 'pages.servers.nodes.java.installed'
                          : 'pages.servers.nodes.java.install',
                    )}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Remove a runtime Pano installed. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={removeModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-danger"></i>
        </div>
        <h5 class="mb-2">{$_('pages.servers.nodes.java.remove-title')}</h5>
        <div class="text-body-secondary">
          {$_('pages.servers.nodes.java.remove-description', {
            values: {
              name: removeTarget
                ? `Java ${removeTarget.major}${removeTarget.version ? ` (${removeTarget.version})` : ''}`
                : '',
            },
          })}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn btn-danger col-6 m-0"
          disabled={removeBusy}
          onclick={confirmRemove}>
          {#if removeBusy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('pages.servers.nodes.java.remove')}
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import tooltip from '$lib/tooltip.util';
  import {
    fetchNodeJava,
    getNodeJavaRuntimes,
    isNodeOnline,
    javaDownloadSize,
    javaMajorHint,
    JavaTaskKinds,
    requestJavaInstall,
    requestJavaRemove,
  } from '$lib/nodes.util.js';
  import { onTaskProgress } from '$lib/panelRealtime.js';
  import { showServerActionError } from '$lib/servers.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /** @type {{ node: object }} */
  let { node } = $props();

  /** Vendor ids the node reports, spelled the way people know them. */
  const VENDORS = Object.freeze({
    temurin: 'Eclipse Temurin',
    zulu: 'Azul Zulu',
  });

  /** Why a remove task failed, when the node said so in a word. */
  const REMOVE_ERRORS = Object.freeze({
    JAVA_IN_USE: 'pages.servers.nodes.java.error-in-use',
    NOT_MANAGED: 'pages.servers.nodes.java.error-not-managed',
    NOT_FOUND: 'pages.servers.nodes.java.error-not-found',
    JAVA_INSTALLING: 'pages.servers.nodes.java.error-installing',
  });

  /** @type {import('$lib/nodes.util.js').JavaCatalog | null} */
  let catalog = $state(null);
  let loading = $state(false);
  /** The endpoint is missing (older Pano): the card lists what the node row says and no more. */
  let endpointMissing = $state(false);

  /**
   * Tasks this card started, keyed by task id.
   *
   * @type {Record<string, { taskId: string, major: number, kind: string, percent: number,
   *   message: string }>}
   */
  let tasks = $state({});
  /**
   * Frames that arrived before the POST answered with their task id — a fast node can finish a
   * "already up to date" install before the response is back.
   *
   * @type {Map<string, any>}
   */
  const earlyFrames = new Map();

  let installModalElement = $state();
  let removeModalElement = $state();
  let installModal;
  let removeModal;
  let removeTarget = $state(null);
  let removeBusy = $state(false);

  const nodeId = $derived(Number(node?.id));
  const nodeOnline = $derived(isNodeOnline(node));
  const catalogLoaded = $derived(catalog !== null || endpointMissing);
  const downloadsSupported = $derived(!!catalog?.downloads);
  /**
   * Whether this node can install and remove Java at all. An older node (`supported: false`, or
   * `resources.javaDownloads` false) never can — its Update/Remove buttons are hidden, not
   * disabled. Offline is transient: the buttons stay, disabled, with a tooltip.
   */
  const managesJava = $derived(
    !endpointMissing && catalog?.supported !== false && node?.resources?.javaDownloads !== false,
  );
  const downloadable = $derived(catalog?.downloadable ?? []);
  /** The node did not answer in time, or the vendors' APIs could not be reached. */
  const catalogError = $derived(
    catalog?.catalogError === 'TIMEOUT'
      ? $_('pages.servers.nodes.java.catalog-timeout')
      : catalog?.catalogError
        ? $_('pages.servers.nodes.java.catalog-error', { values: { error: catalog.catalogError } })
        : '',
  );
  /** Known from the last hello even while the node is offline; an older node has no such thing. */
  const autoDownload = $derived(catalog?.supported ? (catalog.autoDownload ?? null) : null);
  const platformLabel = $derived(
    [catalog?.os || node?.resources?.os, catalog?.arch || node?.resources?.arch]
      .filter(Boolean)
      .join('/') || '—',
  );

  /**
   * The runtimes to list: the catalogue's (which knows who uses what) while the node is online,
   * the row's `resources.javaRuntimes` otherwise — those are kept current by `NODE_JAVA_RUNTIMES`.
   */
  const rows = $derived.by(() => {
    const source =
      catalog && catalog.runtimes.length > 0 ? catalog.runtimes : getNodeJavaRuntimes(node);

    return [...source].sort(
      (a, b) => a.major - b.major || String(a.version).localeCompare(String(b.version)),
    );
  });

  const taskList = $derived(Object.values(tasks));
  /** Installs of a major the node does not have yet get a row of their own. */
  const pendingInstalls = $derived(
    taskList.filter(
      (task) =>
        task.kind === JavaTaskKinds.INSTALL &&
        !rows.some((runtime) => runtime.major === task.major && runtime.managed),
    ),
  );

  const canInstall = $derived(nodeOnline && downloadsSupported);
  const installTooltip = $derived(!nodeOnline ? $_('pages.servers.nodes.java.node-offline') : '');

  // Refresh the catalogue whenever the node comes (back) online or the runtime list it reported
  // changes — an install finishing elsewhere, a boot-time cleanup.
  const runtimesKey = $derived(
    JSON.stringify(
      (node?.resources?.javaRuntimes || []).map((entry) => [entry?.path, entry?.version]),
    ),
  );

  $effect(() => {
    void nodeOnline;
    void runtimesKey;

    if (Number.isFinite(nodeId)) {
      void loadCatalog();
    }
  });

  let loadSeq = 0;

  async function loadCatalog() {
    const seq = ++loadSeq;

    loading = true;

    const result = await fetchNodeJava(nodeId);

    if (seq !== loadSeq) {
      return;
    }

    loading = false;

    if (result.status === 'ok') {
      catalog = result.catalog ?? null;
      endpointMissing = false;
    } else if (result.status === 'unavailable' || result.status === 'error') {
      endpointMissing = true;
      catalog = null;
    }
  }

  /**
   * @param {string} vendor
   * @returns {string}
   */
  function vendorLabel(vendor) {
    const key = String(vendor || '').toLowerCase();

    return VENDORS[key] || vendor || '—';
  }

  /**
   * @param {number} major
   */
  function taskFor(major) {
    return taskList.find((task) => task.major === major) ?? null;
  }

  /**
   * The downloadable entry that would update this runtime, when there is a newer one and this is
   * the newest managed runtime of its major.
   *
   * @param {{ major: number, managed: boolean, version: string }} runtime
   */
  function updateFor(runtime) {
    if (!runtime.managed || !downloadsSupported) {
      return null;
    }

    const entry = downloadable.find((item) => item.major === runtime.major);

    if (!entry?.updateAvailable) {
      return null;
    }

    return !entry.installedVersion || entry.installedVersion === runtime.version ? entry : null;
  }

  /**
   * @param {{ managed: boolean, usedBy: unknown[] }} runtime
   * @returns {boolean}
   */
  function canRemove(runtime) {
    return runtime.managed && nodeOnline && runtime.usedBy.length === 0 && !removeBusy;
  }

  /**
   * @param {{ managed: boolean, usedBy: { name: string, id: number }[] }} runtime
   * @returns {string}
   */
  function removeTooltip(runtime) {
    if (!nodeOnline) {
      return $_('pages.servers.nodes.java.node-offline');
    }

    if (runtime.usedBy.length > 0) {
      return $_('pages.servers.nodes.java.remove-in-use', {
        values: {
          servers: runtime.usedBy
            .map(
              (server) =>
                server.name ||
                (server.id != null
                  ? `#${server.id}`
                  : $_('pages.servers.nodes.java.unknown-server')),
            )
            .join(', '),
        },
      });
    }

    return $_('pages.servers.nodes.java.remove');
  }

  function openInstallModal() {
    if (!canInstall) {
      return;
    }

    void loadCatalog();
    installModal?.show();
  }

  /**
   * @param {number} major
   * @param {boolean} [fromModal]
   */
  async function install(major, fromModal = false) {
    if (taskFor(major)) {
      return;
    }

    const result = await requestJavaInstall(nodeId, major);

    if (!handleStart(result, major, JavaTaskKinds.INSTALL)) {
      return;
    }

    if (fromModal) {
      installModal?.hide();
    }
  }

  /**
   * @param {{ major: number, version: string }} runtime
   */
  function askRemove(runtime) {
    removeTarget = runtime;
    removeModal?.show();
  }

  async function confirmRemove() {
    const target = removeTarget;

    if (!target || removeBusy) {
      return;
    }

    removeBusy = true;

    const result = await requestJavaRemove(nodeId, target.major, target.version || undefined);

    removeBusy = false;

    if (handleStart(result, target.major, JavaTaskKinds.REMOVE)) {
      removeModal?.hide();
    }
  }

  /**
   * @param {{ status: string, error?: string, taskId?: string }} result
   * @param {number} major
   * @param {string} kind
   * @returns {boolean} whether a task is now running.
   */
  function handleStart(result, major, kind) {
    if (result.status === 'network') {
      return false;
    }

    if (result.status === 'unavailable') {
      void showError('pages.servers.nodes.java.unavailable');

      return false;
    }

    if (result.status === 'error') {
      void showJavaError(result.error);

      return false;
    }

    const taskId = String(result.taskId || '');

    if (!taskId) {
      // Nothing to follow: re-read what the node has now.
      void loadCatalog();

      return true;
    }

    tasks = {
      ...tasks,
      [taskId]: { taskId, major, kind, percent: 0, message: '' },
    };

    const early = earlyFrames.get(taskId);

    if (early) {
      earlyFrames.delete(taskId);
      applyFrame(early);
    }

    return true;
  }

  /**
   * @param {string | undefined} error
   */
  function showJavaError(error) {
    const code = String(error || '').toUpperCase();

    if (REMOVE_ERRORS[code]) {
      return showError(REMOVE_ERRORS[code]);
    }

    // The node is too old to download Java (Pano answers 409 FEATURE_UNAVAILABLE).
    if (code === 'FEATURE_UNAVAILABLE') {
      return showError('pages.servers.nodes.java.outdated-node');
    }

    return showServerActionError(code || 'TASK_FAILED');
  }

  /**
   * @param {{ taskId: string, kind: string, status: string, percent: number, message: string,
   *   error: string|null }} frame
   */
  function applyFrame(frame) {
    const task = tasks[frame.taskId];

    if (!task) {
      return;
    }

    if (frame.status === 'DONE' || frame.status === 'FAILED') {
      const { [frame.taskId]: _finished, ...rest } = tasks;

      tasks = rest;

      if (frame.status === 'DONE') {
        void showSuccess(
          task.kind === JavaTaskKinds.REMOVE
            ? 'pages.servers.nodes.java.removed'
            : 'pages.servers.nodes.java.installed-toast',
          { major: task.major },
        );
      } else {
        void showJavaError(frame.error || undefined);
      }

      void loadCatalog();

      return;
    }

    tasks = {
      ...tasks,
      [frame.taskId]: {
        ...task,
        percent: Math.max(0, Math.min(100, Math.round(Number(frame.percent) || 0))),
        message: frame.message || task.message,
      },
    };
  }

  onMount(() => {
    installModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(installModalElement)
      : null;
    removeModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(removeModalElement)
      : null;

    const offTask = onTaskProgress((frame) => {
      if (frame.kind !== JavaTaskKinds.INSTALL && frame.kind !== JavaTaskKinds.REMOVE) {
        return;
      }

      if (tasks[frame.taskId]) {
        applyFrame(frame);

        return;
      }

      // Possibly ours, with the POST still in flight; keep the newest few.
      earlyFrames.set(frame.taskId, frame);

      if (earlyFrames.size > 20) {
        earlyFrames.delete(earlyFrames.keys().next().value);
      }
    });

    return () => {
      offTask();
      installModal?.hide();
      removeModal?.hide();
      installModal = null;
      removeModal = null;
    };
  });
</script>
