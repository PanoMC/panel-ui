<!-- SM-63 (§2.4.28) — the last start failed because the node has no Java the server can run on.
     Offers the one-click way out: download that Java on the node, then start the server. -->
{#if visible}
  <div class="alert alert-warning d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
    <i class="fa-brands fa-java fa-lg" aria-hidden="true"></i>
    <div class="flex-grow-1 min-w-0">
      {$_('pages.servers.overview.java-missing', { values: { major } })}
      {#if task}
        <div class="d-flex align-items-center gap-2 mt-2">
          <div
            class="progress flex-grow-1"
            style="height: 6px;"
            role="progressbar"
            aria-label={$_('pages.servers.header.task-java-install')}
            aria-valuenow={task.percent}
            aria-valuemin="0"
            aria-valuemax="100">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              style="width: {Math.max(task.percent, 5)}%;">
            </div>
          </div>
          <span class="small font-monospace">{task.percent}%</span>
        </div>
        {#if task.message}
          <div class="small text-body-secondary text-break mt-1">{task.message}</div>
        {/if}
      {/if}
    </div>
    {#if mayDownload}
      <!-- A disabled button swallows pointer events, so the tooltip sits on the wrapper. -->
      <span class="d-inline-block" use:tooltip={[buttonTooltip, { placement: 'bottom' }]}>
        <button
          type="button"
          class="btn btn-sm btn-warning"
          disabled={busy || !nodeOnline}
          onclick={downloadAndStart}>
          {#if busy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {:else}
            <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
          {/if}
          {$_('pages.servers.overview.java-missing-action', { values: { major } })}
        </button>
      </span>
    {:else}
      <span class="small text-body-secondary">
        {$_('pages.servers.overview.java-missing-no-permission')}
      </span>
    {/if}
  </div>
{/if}

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import tooltip from '$lib/tooltip.util';
  import {
    getCachedNode,
    isNodeOnline,
    JavaTaskKinds,
    requestJavaInstall,
  } from '$lib/nodes.util.js';
  import { notifyLocalServerActivity, onNode, onTaskProgress } from '$lib/panelRealtime.js';
  import {
    getServerDisplayName,
    isManaged,
    ProcessStates,
    showServerActionError,
  } from '$lib/servers.util.js';

  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /** Published by `ServerDetailLayout`, and kept live by the realtime feeds. */
  const server = getContext('server');

  /** Older nodes only say it in words: "No Java 21 runtime on this host…". */
  const JAVA_MISSING_TEXT = /\bno java (\d{1,2}) runtime\b/i;

  let busy = $state(false);
  /** @type {{ taskId: string, percent: number, message: string } | null} */
  let task = $state(null);
  /** Bumped by the node feed so the online check re-reads the cache. */
  let nodeTick = $state(0);
  /** @type {Map<string, any>} frames that beat the POST's answer. */
  const earlyFrames = new Map();

  const processState = $derived(String($server?.processState || '').toUpperCase());
  const major = $derived.by(() => {
    // `lastStopReason` is what Pano keeps per server (and the layout refreshes from each
    // `serverState` frame), so the alert is still there after a reload.
    const stop = $server?.lastStopReason;
    const code = String(stop?.reasonCode ?? '').toUpperCase();
    const needed = Number(stop?.javaMajor);

    if (code === 'JAVA_MISSING' && Number.isFinite(needed) && needed > 0) {
      return needed;
    }

    const match = JAVA_MISSING_TEXT.exec(String(stop?.reason || $server?.lastStateReason || ''));

    return match ? Number(match[1]) : null;
  });
  const visible = $derived(
    isManaged($server) &&
      major != null &&
      (!!task ||
        busy ||
        processState === ProcessStates.STOPPED ||
        processState === ProcessStates.CRASHED),
  );
  const mayDownload = $derived(
    hasPermission(Permissions.MANAGE_NODES) && hasPermission(Permissions.MANAGE_SERVER_POWER),
  );
  const nodeOnline = $derived.by(() => {
    void nodeTick;

    const node = getCachedNode($server?.nodeId);

    // Unknown is not offline: the request itself says NODE_OFFLINE if it is.
    return node ? isNodeOnline(node) : true;
  });
  const buttonTooltip = $derived(nodeOnline ? '' : $_('pages.servers.nodes.java.node-offline'));

  async function downloadAndStart() {
    const current = $server;

    if (busy || !current?.nodeId || major == null) {
      return;
    }

    busy = true;

    const result = await requestJavaInstall(current.nodeId, major);

    if (result.status !== 'ok') {
      busy = false;

      if (result.status === 'unavailable') {
        await showError('pages.servers.nodes.java.unavailable');
      } else if (result.status === 'error') {
        await showServerActionError(result.error);
      }

      return;
    }

    if (!result.taskId) {
      // Nothing to follow — the node answered at once; go straight to the start.
      await start();

      return;
    }

    task = { taskId: result.taskId, percent: 0, message: '' };

    const early = earlyFrames.get(result.taskId);

    if (early) {
      earlyFrames.delete(result.taskId);
      void applyFrame(early);
    }
  }

  /**
   * @param {{ taskId: string, status: string, percent: number, message: string,
   *   error: string|null }} frame
   */
  async function applyFrame(frame) {
    if (!task || frame.taskId !== task.taskId) {
      return;
    }

    if (frame.status === 'FAILED') {
      task = null;
      busy = false;
      await showServerActionError(frame.error || 'TASK_FAILED');

      return;
    }

    if (frame.status === 'DONE') {
      task = null;
      await start();

      return;
    }

    task = {
      ...task,
      percent: Math.max(0, Math.min(100, Math.round(Number(frame.percent) || 0))),
      message: frame.message || task.message,
    };
  }

  async function start() {
    const current = $server;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${current.id}/power`,
        body: { action: 'START' },
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (body.error) {
        await showServerActionError(body.error, body);

        return;
      }

      // The reason belonged to the failed start; this one supersedes it.
      server.update((row) => ({
        ...row,
        lastStateReason: null,
        lastStateReasonCode: null,
        lastStateJavaMajor: null,
        lastStopReason: null,
      }));
      notifyLocalServerActivity(current.id);
      await showSuccess('pages.servers.header.power-sent-start', {
        name: getServerDisplayName(current),
      });
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    const offTask = onTaskProgress((frame) => {
      if (frame.kind !== JavaTaskKinds.INSTALL) {
        return;
      }

      if (task && frame.taskId === task.taskId) {
        void applyFrame(frame);

        return;
      }

      if (busy) {
        earlyFrames.set(frame.taskId, frame);
      }
    });
    const offNode = onNode(() => {
      nodeTick += 1;
    });

    return () => {
      offTask();
      offNode();
    };
  });
</script>
