<style>
  /* The same art and fade the dashboard's welcome board uses, so the header reads as part of
     the panel rather than a one-off; the fade keeps the text on the left legible. */
  .server-detail-header {
    background-image:
      var(--server-header-gradient),
      url('/assets/img/MCV_SummerDrop_Hero_DotNet_Downloadable_Wallpaper_r1920x1080.png');
    background-size: cover;
    background-position: center 12%;
    border: none;
    overflow: hidden;
    --server-header-gradient: linear-gradient(
      90deg,
      rgba(20, 22, 25, 0.95) 25%,
      rgba(20, 22, 25, 0.55) 100%
    );
  }

  :global([data-bs-theme='light']) .server-detail-header {
    --server-header-gradient: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.95) 25%,
      rgba(255, 255, 255, 0.55) 100%
    );
  }

  @media (max-width: 991.98px) {
    .server-detail-header {
      --server-header-gradient: linear-gradient(
        180deg,
        rgba(var(--bs-body-bg-rgb), 0.95) 40%,
        rgba(var(--bs-body-bg-rgb), 0.8) 100%
      ) !important;
    }
  }

  .server-detail-header {
    position: sticky;
    top: 0;
    z-index: 3;
  }

  .server-favicon {
    image-rendering: pixelated;
  }

  /* The icon doubles as a drop target (§ header redesign): the zone keeps the icon's own solid
     frame, and a pencil fades in over it on hover — a spinner while an upload is out. */
  /* The icon's original 48 px frame, filled edge to edge: the drop zone's own padding and border
     would otherwise shrink the picture inside it. The 64 px icon is scaled without smoothing, so
     it stays crisp. */
  .server-icon {
    width: 48px;
    height: 48px;
  }

  .server-icon :global(.drop-zone) {
    padding: 0 !important;
    border: 0 !important;
  }

  .server-icon img {
    object-fit: cover;
  }

  .server-icon-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bs-border-radius);
    background-color: rgba(0, 0, 0, 0.45);
    color: #fff;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    pointer-events: none;
  }

  .server-icon:hover .server-icon-overlay,
  .server-icon-overlay.is-busy {
    opacity: 1;
  }

  /* The power buttons each sit in a tooltip wrapper (a disabled button swallows the pointer), so
     the group's joined corners are restored across the wrappers. */
  .power-group > span:not(:first-child) > .btn {
    margin-left: -1px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .power-group > span:not(:last-child) > .btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .server-address code {
    font-size: 0.85rem;
  }

  /*
   * Both are as wide as the column and never wider: a long Maven line must not count toward the
   * column's own width, or it would push the whole header block below the server icon.
   */
  .task-last-line,
  .task-log-panel {
    width: 0;
    min-width: 100%;
  }

  .task-log {
    max-height: 16rem;
    overflow: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-all;
    background-color: var(--bs-tertiary-bg);
    border: 1px solid var(--bs-border-color-translucent);
    border-radius: var(--bs-border-radius);
  }

  .task-log-chevron {
    transition: transform 0.2s ease;
  }

  .task-log-chevron.open {
    transform: rotate(90deg);
  }

  .task-last-line {
    font-size: 0.875em;
  }

  .task-last-line:hover,
  .task-last-line:focus-visible {
    color: var(--bs-body-color) !important;
  }
</style>

<div class="container">
  <div class="server-detail-header card mb-3">
    <div class="card-body d-flex flex-wrap align-items-center gap-3">
      <!-- The server icon, and — for an admin who may manage servers, where something can write
           the server's files — the place to drop a new one. -->
      <div
        class="server-icon position-relative flex-shrink-0"
        use:tooltip={[iconTooltip, { ...HEADER_TOOLTIP, placement: 'bottom' }]}>
        {#if canChangeIcon}
          <DragAndDropZone
            class="p-0"
            accept={SERVER_ICON_TYPES}
            maxFileSize={SERVER_ICON_MAX_BYTES}
            disabled={iconUploading}
            on:drop={(event) => uploadIcon(event.detail)}
            on:error={onIconFileError}>
            <img
              src={faviconSrc}
              class="server-favicon w-100 h-100"
              height="64"
              width="64"
              alt={getServerDisplayName($server)} />
            <span class="server-icon-overlay" class:is-busy={iconUploading} aria-hidden="true">
              {#if iconUploading}
                <span class="spinner-border spinner-border-sm"></span>
              {:else}
                <i class="fa-solid fa-pen"></i>
              {/if}
            </span>
          </DragAndDropZone>
        {:else}
          <img
            src={faviconSrc}
            class="server-favicon rounded w-100 h-100"
            height="64"
            width="64"
            alt={getServerDisplayName($server)} />
        {/if}
      </div>

      <div class="min-w-0 flex-grow-1">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <SoftwareLogo id={$server.type} size="1.5rem" />
          <h5 class="mb-0 text-break">{getServerDisplayName($server)}</h5>

          {#if managed}
            <!-- A managed server's real state is its process, not whether pano-mc-plugin has
                 linked back yet, so the process pill replaces the online/offline one. -->
            <span class="badge rounded-pill text-bg-{processColour}">
              {$_(processStateLabel(processState))}
            </span>
          {:else}
            <span
              class="badge rounded-pill"
              class:text-bg-success={isServerOnline($server)}
              class:text-bg-danger={!isServerOnline($server)}>
              {isServerOnline($server)
                ? $_('pages.servers.card.online')
                : $_('pages.servers.card.offline')}
            </span>
          {/if}

          <!-- How Pano reaches this server, as the icon the rest of the panel uses for it. -->
          <span
            class="text-body-secondary"
            role="img"
            aria-label={kindLabel}
            use:tooltip={[kindLabel, { ...HEADER_TOOLTIP, placement: 'bottom' }]}>
            <i
              class="fa-solid {agent ? 'fa-microchip' : managed ? 'fa-server' : 'fa-link'}"
              aria-hidden="true"></i>
          </span>

          <!-- The software logo already names the type; the version reads short, the raw
               string the server reported sits in the tooltip. -->
          {#if versionShort}
            <span
              class="small text-body-secondary"
              use:tooltip={[
                versionRaw && versionRaw !== versionShort ? versionRaw : '',
                { ...HEADER_TOOLTIP, placement: 'bottom' },
              ]}>
              {versionShort}
            </span>
          {/if}
        </div>

        {#if showStateReason}
          <!-- The node's last console line before the process died (§2.4.3). It is cut off at
               the header's width, and the tooltip carries the whole sentence. -->
          <div
            class="small text-danger-emphasis mt-1 text-truncate"
            use:tooltip={[stateReason, { ...HEADER_TOOLTIP, placement: 'bottom' }]}>
            {$_('pages.servers.header.state-reason', { values: { reason: stateReason } })}
          </div>
        {/if}

        <div class="server-address mt-1">
          <button
            type="button"
            class="bg-transparent border-0 p-0 focus-ring text-break"
            on:click={onCopyAddress}
            use:tooltip={[
              copied
                ? $_('components.modals.connect-server.copied')
                : $_('pages.servers.header.copy-address'),
              { ...HEADER_TOOLTIP, placement: 'bottom', hideOnClick: false },
            ]}>
            <code class="user-select-all cursor-pointer text-break d-inline-block"
              >{serverAddress}</code>
            <i class="fa-regular fa-copy ms-1 small" aria-hidden="true"></i>
          </button>
        </div>

        <!-- SM-77 — the Pano Agent replacing itself, as Pano reports it on the server JSON: every
             tab and every admin on this server sees the same bar, whoever pressed Update. -->
        {#if daemonUpdate}
          <DaemonUpdateProgress progress={daemonUpdate} subject="agent" class="mt-2" />
        {/if}

        {#if showTaskProgress}
          <div class="mt-2">
            <div
              class="d-flex justify-content-between small"
              class:text-body-secondary={!taskFailed}
              class:text-danger={taskFailed}>
              <span>
                {taskLabel}
                {#if taskDetailText && !taskHasLog}
                  <span class="text-break">&middot; {taskDetailText}</span>
                {/if}
              </span>
              <!-- A download says how much of how much and how fast, beside the percentage. -->
              <span class="d-inline-flex flex-wrap justify-content-end column-gap-2 text-end">
                {#if taskTransfer}
                  <span class="font-monospace text-nowrap">{taskTransfer}</span>
                {/if}
                <span class="font-monospace">{taskPercent}%</span>
              </span>
            </div>
            <div
              class="progress mt-1"
              style="height: 6px;"
              role="progressbar"
              aria-label={taskLabel}
              aria-valuenow={taskPercent}
              aria-valuemin="0"
              aria-valuemax="100">
              <div
                class="progress-bar progress-bar-striped"
                class:progress-bar-animated={!taskFailed}
                class:bg-danger={taskFailed}
                style="width: {taskPercent}%;">
              </div>
            </div>
            {#if taskHasLog && taskDetailText}
              <!-- BuildTools prints minutes of Maven output: this is the latest line, and the
                   whole line is the switch that opens the ones that came in while the page was
                   open. -->
              <button
                type="button"
                class="task-last-line btn btn-link p-0 mt-1 border-0 small font-monospace text-body-secondary text-start text-decoration-none d-flex align-items-center gap-1"
                aria-expanded={taskLogOpen}
                aria-controls="serverTaskLog"
                use:tooltip={[
                  $_(
                    taskLogOpen
                      ? 'pages.servers.header.task-log-hide'
                      : 'pages.servers.header.task-log-show',
                  ),
                  { ...HEADER_TOOLTIP, placement: 'bottom' },
                ]}
                on:click={() => (taskLogOpen = !taskLogOpen)}>
                <i
                  class="fa-solid fa-chevron-right fa-fw task-log-chevron"
                  class:open={taskLogOpen}
                  aria-hidden="true"></i>
                <span class="text-truncate">{taskDetailText}</span>
              </button>
            {/if}
            {#if taskHasLog && taskLogOpen}
              <div class="task-log-panel mt-2" id="serverTaskLog">
                <pre
                  class="task-log small mb-1"
                  bind:this={taskLogElement}
                  on:scroll={onTaskLogScroll}>{taskLines.join('\n')}</pre>
                <div class="small text-body-secondary">
                  {$_('pages.servers.header.task-log-hint')}
                </div>
              </div>
            {/if}
            {#if buildToolsNote}
              <div class="small text-body-secondary mt-1">
                <i class="fa-solid fa-hammer me-1" aria-hidden="true"></i>
                {$_('pages.servers.header.task-buildtools-note')}
              </div>
            {/if}
          </div>
        {/if}

        <div class="small text-body-secondary mt-1">
          {$_('pages.servers.header.protocol', { values: { version: protocolVersion } })}
          {#if $server.pluginVersion}
            &middot; {$_('pages.servers.header.plugin-version', {
              values: { version: $server.pluginVersion },
            })}
          {/if}
        </div>

        <!-- SM-77 §D — at most one update on the card. A Pano Agent server offers its agent first
             and the Pano plugin only once the agent is current and idle; a linked server offers
             the plugin; a server a node runs offers neither here (the node is updated on the
             Nodes page, its plugin under Settings → Updates and on the Overview). Hidden while
             that very update is running: its bar above says so instead. -->
        {#if agentNeedsUpdate}
          <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
            <span class="badge text-bg-warning">
              <i class="fa-solid fa-circle-arrow-up me-1" aria-hidden="true"></i>
              {$_('pages.servers.header.update-agent')}
            </span>
            <button
              type="button"
              class="btn btn-sm btn-outline-warning py-0"
              disabled={updatingAgent}
              on:click={updateAgent}>
              {#if updatingAgent}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_('buttons.update')}
            </button>
          </div>
        {:else if pluginNeedsUpdate}
          <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
            <span class="badge text-bg-warning text-wrap text-start">
              <i class="fa-solid fa-circle-arrow-up me-1" aria-hidden="true"></i>
              {pluginUpdate.available === true && pluginUpdate.latestVersion
                ? $_('pages.servers.header.update-plugin', {
                    values: { version: pluginUpdate.latestVersion },
                  })
                : $_('pages.servers.header.update-plugin-outdated')}
            </span>
            <PanoPluginUpdateButton
              server={$server}
              latestVersion={pluginUpdate.latestVersion ?? null}
              label="buttons.update"
              class="py-0" />
          </div>
        {/if}
      </div>

      <div class="btn-group power-group flex-shrink-0" role="group" data-layout-actions="right">
        {#each powerActions as action (action.id)}
          <!-- Disabled buttons swallow pointer events, so the tooltip sits on the wrapper. -->
          <span
            class="d-inline-block"
            use:tooltip={[action.tooltip, { ...HEADER_TOOLTIP, placement: 'bottom' }]}>
            <button
              type="button"
              class="btn {action.buttonClass}"
              aria-label={$_(action.text)}
              disabled={action.disabled}
              aria-disabled={action.disabled}
              on:click={() => askPower(action)}>
              {#if powerBusy === action.power}
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              {:else}
                <i class={action.icon} aria-hidden="true"></i>
              {/if}
              <!-- Icon plus a label from lg up, the way the panel's page-header actions read. -->
              <span class="d-lg-inline d-none ms-2">{$_(action.text)}</span>
            </button>
          </span>
        {/each}
      </div>
    </div>
  </div>

  <!-- SM-51/§2.4.16, SM-62/§2.4.27 — a process the node found still running after its own restart
       and took over. Until it is restarted from the panel once, it has no console input and no
       automatic crash recovery; the alert says so and offers that restart. Dismissed per server
       and per adoption, so the next adoption shows it again. -->
  {#if adopted && !adoptedDismissed}
    <div class="alert alert-warning alert-dismissible d-flex align-items-start gap-2" role="alert">
      <i class="fa-solid fa-triangle-exclamation mt-1" aria-hidden="true"></i>
      <div class="flex-grow-1">
        {$_('pages.servers.header.adopted-alert')}
        <!-- The header's own Restart, with its tooltip and disabled rules. -->
        <span
          class="d-inline-block ms-1"
          use:tooltip={[restartAction?.tooltip || '', { ...HEADER_TOOLTIP, placement: 'bottom' }]}>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            disabled={!restartAction || restartAction.disabled}
            on:click={() => restartAction && askPower(restartAction)}>
            {#if powerBusy === 'RESTART'}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {:else}
              <i class="fa-solid fa-rotate-right me-1" aria-hidden="true"></i>
            {/if}
            {$_('pages.servers.header.restart')}
          </button>
        </span>
      </div>
      <button
        type="button"
        class="btn-close"
        aria-label={$_('buttons.close')}
        on:click={dismissAdoptedAlert}></button>
    </div>
  {/if}
</div>

<!-- Stopping a server drops everyone on it, so both actions confirm first. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={powerModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-warning"></i>
        </div>
        {#if pendingPower}
          <h5 class="mb-2">{$_(pendingPower.confirmTitle)}</h5>
          <div class="text-body-secondary">
            {$_(pendingPower.confirmBody, {
              values: { name: getServerDisplayName($server) },
            })}
          </div>
        {/if}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          type="button"
          class="btn btn-link col-6 m-0"
          disabled={!!powerBusy}
          on:click={hidePowerModal}>
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn col-6 m-0 btn-{pendingPower?.variant || 'danger'}"
          disabled={!!powerBusy}
          on:click={confirmPower}>
          {#if powerBusy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {pendingPower ? $_(pendingPower.text) : ''}
        </button>
      </div>
    </div>
  </div>
</div>

<slot />

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';

  /**
   * Loads the server named by the route. Everything under `/servers/[id]` reads it from the
   * `server` context store this layout publishes, so no page has to fetch it again.
   *
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load(event) {
    const { parent, params } = event;

    await parent();

    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      throw redirect(302, base + '/');
    }

    const response = await ApiUtil.get({
      path: `/api/panel/servers/${id}`,
      request: event,
    });

    if (!response || !response.server) {
      throw redirect(302, base + '/');
    }

    return {
      server: response.server,
      requireEmailVerification: response.requireEmailVerification,
    };
  }
</script>

<script>
  import { getContext, onDestroy, onMount, setContext, tick } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { browser } from '$app/environment';
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';

  import { sanitizeImageSrc } from '$lib/security.util.js';
  import tooltip from '$lib/tooltip.util';
  import {
    notifyLocalServerActivity,
    onNode,
    onPanelServerRemoved,
    onPanelServerUpdate,
    onServerState,
    onTaskProgress,
    PANEL_SERVER_LIVE_LOAD_KEY,
    setPanelSelectedServerSubscription,
    subscribeNodes,
  } from '$lib/panelRealtime.js';
  import {
    applyTaskFrame,
    canKill,
    canRestart,
    canStart,
    canStop,
    createServerActionCooldown,
    featureSource,
    featureUnavailableReason,
    getActiveTask,
    getPrimaryAddress,
    getProcessState,
    getServerDisplayName,
    hasCapability,
    isAgentServer,
    isBuildToolsTask,
    isManaged,
    isPanoPluginUpdateTask,
    isRateLimitError,
    isPluginConnected,
    isServerOnline,
    LEGACY_PROTOCOL_VERSION,
    onServerRefreshRequest,
    processStateColour,
    processStateLabel,
    ProcessStates,
    ServerCapabilities,
    setActiveServer,
    showServerActionError,
    TASK_FAILURE_VISIBLE_MS,
    taskDetail,
    taskTransferText,
    taskLabelKey,
    taskPercent as percentOf,
  } from '$lib/servers.util.js';
  import {
    cacheNode,
    fetchNode,
    getCachedNode,
    DaemonUpdateStatuses,
    getNodeDisplayName,
    isDaemonUpdating,
    isNodeOnline,
    normalizeDaemonUpdate,
  } from '$lib/nodes.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
  import SoftwareLogo from '$lib/components/servers/SoftwareLogo.svelte';
  import PanoPluginUpdateButton from '$lib/components/servers/PanoPluginUpdateButton.svelte';
  import DaemonUpdateProgress from '$lib/components/servers/DaemonUpdateProgress.svelte';
  import { confirmAgentUpdate } from '$lib/components/modals/ConfirmUpdateModal.svelte';

  export let data;

  /**
   * The route's server, kept live by the realtime feed. Published as the `server` context so
   * every page under `/servers/[id]` reads the same object — the per-user `selectedServer`
   * context stays around for older code, but is no longer what these pages render from.
   */
  const server = writable(data.server);

  setContext('server', server);

  /**
   * The title is the section on screen, named as the server menu names it, so "Files" reads
   * "Files" and not the server's name on every page. Which server it is stays in the header
   * banner and in the browser tab (`pageSubtitle`). The pages under this layout do not set a title
   * of their own.
   */
  /**
   * The header card clips whatever leaves it (`overflow: hidden`, for its background art), and
   * tippy puts an interactive tooltip right after its element, inside the card: the header's
   * tooltips go on the page body instead, so they can reach past the card's edge.
   */
  const HEADER_TOOLTIP = { appendTo: () => document.body };

  const pageTitle = getContext('pageTitle');
  const pageSubtitle = getContext('pageSubtitle');

  /** The server menu's label for each section, keyed by the first path segment after the id. */
  const SECTION_TITLES = {
    '': 'components.server-navigation-menu.overview',
    console: 'components.server-navigation-menu.console',
    players: 'components.server-navigation-menu.players',
    files: 'components.server-navigation-menu.files',
    plugins: 'components.server-navigation-menu.plugins',
    backups: 'components.server-navigation-menu.backups',
    schedules: 'components.server-navigation-menu.schedules',
    settings: 'components.server-navigation-menu.settings',
  };

  /**
   * The section a `/servers/<id>/<section>/…` path is on; '' for the overview.
   *
   * @param {string} pathname
   * @returns {string}
   */
  function sectionOf(pathname) {
    const match = /\/servers\/[^/]+\/?([^/]*)/.exec(pathname || '');

    return match ? match[1].toLowerCase() : '';
  }

  /**
   * The per-user "selected server" the navbar switcher and the sidebar's game menu fall back to
   * off a server's own pages. Owned by `AppLayout`, filled from `basicData` once per load.
   */
  const selectedServer = getContext('selectedServer');

  $: pageTitle.set(SECTION_TITLES[sectionOf($page.url.pathname)] ?? SECTION_TITLES['']);
  $: pageSubtitle?.set($server ? getServerDisplayName($server) : null);

  /**
   * All four actions go to the same `POST /api/panel/servers/:id/power` endpoint (§2.4.3).
   * `feature` is who can do it at all (§2.4.17): Start and Kill are the node's alone, Stop and
   * Restart are the node's stdin or the plugin's own power call, whichever Pano picked. `can`
   * stays panel-side and answers the other half — "does this make sense in the current state".
   * `managedOnly` is what the same question was before `features`, for an older backend.
   */
  const POWER_BUTTONS = [
    {
      id: 'start',
      icon: 'fa-solid fa-play',
      text: 'pages.servers.header.start',
      power: 'START',
      // Outlined like the rest of the header chrome, so the group sits on the background art
      // instead of covering it; red marks the two that end the process.
      buttonClass: 'btn-outline-secondary',
      feature: 'power.start',
      managedOnly: true,
      can: canStart,
      variant: 'primary',
      confirmTitle: 'pages.servers.header.confirm-start-title',
      confirmBody: 'pages.servers.header.confirm-start-body',
      done: 'pages.servers.header.power-sent-start',
    },
    {
      id: 'stop',
      icon: 'fa-solid fa-stop',
      text: 'pages.servers.header.stop',
      power: 'STOP',
      buttonClass: 'btn-outline-danger',
      feature: 'power.stop',
      managedOnly: false,
      can: canStop,
      variant: 'danger',
      confirmTitle: 'pages.servers.header.confirm-stop-title',
      confirmBody: 'pages.servers.header.confirm-stop-body',
      done: 'pages.servers.header.power-sent-stop',
    },
    {
      id: 'restart',
      icon: 'fa-solid fa-rotate-right',
      text: 'pages.servers.header.restart',
      power: 'RESTART',
      buttonClass: 'btn-outline-secondary',
      feature: 'power.restart',
      managedOnly: false,
      can: canRestart,
      variant: 'danger',
      confirmTitle: 'pages.servers.header.confirm-restart-title',
      confirmBody: 'pages.servers.header.confirm-restart-body',
      done: 'pages.servers.header.power-sent-restart',
    },
    {
      id: 'kill',
      icon: 'fa-solid fa-plug-circle-xmark',
      text: 'pages.servers.header.kill',
      power: 'KILL',
      buttonClass: 'btn-outline-danger',
      feature: 'power.kill',
      managedOnly: true,
      can: canKill,
      variant: 'danger',
      confirmTitle: 'pages.servers.header.confirm-kill-title',
      confirmBody: 'pages.servers.header.confirm-kill-body',
      done: 'pages.servers.header.power-sent-kill',
    },
  ];

  let appliedServer = data.server;
  /** The action whose confirm dialog is open. */
  let pendingPower = null;
  /** The adoption the admin closed the alert for in this visit (see [adoptedAlertKey]). */
  let dismissedAdoptedKey = null;
  /** `STOP` / `RESTART` while that request is in flight. */
  let powerBusy = null;
  /**
   * §2.4.12 — power is rate-limited to 6/min per user and server. After a 429 the buttons
   * stay down for a few seconds, because the usual reaction to "nothing happened" is another
   * click, which is exactly what keeps the limiter closed.
   */
  const powerCooldown = createServerActionCooldown();
  let powerModalElement;
  let powerModalInstance;
  let subscribedId = null;
  let selectedId = null;
  /** The node row this server runs on, for the header badge and the node-offline tooltip. */
  let node = null;
  let nodeRequestedId = null;
  /** `() => void` while the node feed is held open for a managed server. */
  let releaseNodes = null;
  let nodeFeedActive = false;
  let copied = false;
  let copiedTimeout;
  let liveReloadTimer;

  applyServer(data.server);

  // `data` is a fresh object on every navigation, but SvelteKit reuses the loaded value when
  // the layout load did not re-run — so comparing the reference keeps a page-only invalidation
  // (PANEL_SERVER_LIVE_LOAD_KEY) from throwing away the realtime state merged into the store.
  $: if (data?.server && data.server !== appliedServer) {
    appliedServer = data.server;
    applyServer(data.server);
  }

  // Mirror every change to the store — a fresh load, a realtime frame, a rename saved on the
  // settings page — into the store the navbar and the sidebar read.
  $: setActiveServer($server);

  $: serverId = $server?.id ?? null;
  $: protocolVersion = Number($server?.protocolVersion ?? LEGACY_PROTOCOL_VERSION);
  $: managed = isManaged($server);
  $: processState = getProcessState($server) ?? ProcessStates.STOPPED;
  $: processColour = processStateColour(processState);
  /**
   * Why the process stopped, as the node worded it. It only ever lives in the store — nothing
   * persists it — so it is gone after a reload, which is exactly as long as it is interesting.
   */
  $: stateReason = String($server?.lastStateReason || '').trim();
  /**
   * §2.4.16 — the node found this process still running when it started back up and took it
   * over instead of reporting it stopped. Worth saying out loud, because such a process has no
   * stdin pipe: the console prompt reaches it through the plugin until the next restart. Only
   * a Pano that reports the flag can show it; an older one sends nothing and nothing is shown.
   */
  $: adopted = managed && processState === ProcessStates.RUNNING && $server?.adopted === true;
  // One key per server and per adoption: a later adoption starts the process anew, so its
  // `processStartedAt` differs and the alert comes back.
  $: adoptedAlertKey = `pano.panel.server.adopted-dismissed.${$server?.id}.${Number($server?.processStartedAt) || 0}`;
  $: adoptedDismissed =
    dismissedAdoptedKey === adoptedAlertKey || isAdoptedAlertDismissed(adoptedAlertKey);
  $: showStateReason =
    !!stateReason &&
    (processState === ProcessStates.CRASHED ||
      (processState === ProcessStates.STOPPED && Number($server?.lastExitCode ?? 0) !== 0));
  $: nodeId = $server?.nodeId ?? null;
  $: nodeName = node ? getNodeDisplayName(node) : '';
  $: agent = isAgentServer($server);
  $: agentHost = String($server?.agentInfo?.host || '').trim();
  $: pluginUpdate = $server?.panoPluginUpdate ?? null;
  /**
   * SM-77 — the Pano Agent replacing itself, from the server JSON and its frames alone, so every
   * tab shows the same thing. Only an agent's own card shows it (§D): a node is updated, and
   * followed, on the Nodes page.
   */
  $: daemonUpdate = agent ? normalizeDaemonUpdate($server?.daemonUpdate) : null;
  $: daemonUpdating = isDaemonUpdating(daemonUpdate);
  // Newer than what runs now, or speaking an older protocol; and something can do it.
  $: pluginOutdated =
    !!pluginUpdate &&
    (pluginUpdate.available === true || pluginUpdate.outdatedProtocol === true) &&
    (!!pluginUpdate.mode || pluginUpdate.manual === true);
  $: agentOutdated = agent && $server?.agentInfo?.updateAvailable === true;
  // With auto-update on this clears itself within seconds of connecting; the button is for an
  // install that turned it off, or an update that did not go through.
  // Not next to its own bar either: while it runs, and for the moment "Updated" shows (the
  // agent's row may still say "outdated" until it has said hello). A failed one offers it again.
  $: agentNeedsUpdate =
    agentOutdated &&
    (!daemonUpdate || daemonUpdate.status === DaemonUpdateStatuses.FAILED) &&
    $server?.agentInfo?.online === true &&
    hasPermission(Permissions.MANAGE_SERVERS);
  // §D — one badge: on an agent server only once the agent is current and idle, on a linked
  // server always, on a server a node runs never; and not while this very update runs.
  $: pluginNeedsUpdate =
    pluginOutdated &&
    !isPanoPluginUpdateTask(headerTask) &&
    (agent ? !agentOutdated && !daemonUpdating : !managed);

  let updatingAgent = false;

  /**
   * Updates the Pano Agent behind this server once the admin confirms; the server keeps running.
   * What happens next is `daemonUpdate` on the server JSON, which the header follows.
   */
  async function updateAgent() {
    if (updatingAgent || !$server) {
      return;
    }

    const id = $server.id;
    const confirmed = await confirmAgentUpdate({
      name: getServerDisplayName($server),
      current: $server.agentInfo?.version ?? null,
      latest: $server.agentInfo?.latestVersion ?? null,
    });

    if (!confirmed || Number(get(server)?.id) !== Number(id)) {
      return;
    }

    updatingAgent = true;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${id}/agent/update`,
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, node });

        return;
      }

      showSuccess('pages.servers.header.update-daemon-started');
    } finally {
      updatingAgent = false;
    }
  }
  $: kindLabel = agent
    ? agentHost
      ? $_('pages.servers.header.agent-on', { values: { host: agentHost } })
      : $_('pages.servers.header.agent')
    : managed
      ? nodeName
        ? $_('pages.servers.header.managed-on', { values: { node: nodeName } })
        : $_('pages.servers.header.managed')
      : $_('pages.servers.card.linked');
  $: serverAddress = addressWithPort($server, managed);
  $: versionRaw = String($server?.version || '').trim();
  $: versionShort = shortVersion($server);
  $: faviconSrc = sanitizeImageSrc(
    $server?.favicon ? $server.favicon : base + '/assets/img/server-icon.png',
    base + '/assets/img/server-icon.png',
  );
  // A new icon is a file on the server, so it needs whoever holds the files (§2.4.17).
  $: iconFilesSource = featureSource($server, 'files.source');
  $: mayManageServers = hasPermission(Permissions.MANAGE_SERVERS);
  $: canChangeIcon = mayManageServers && iconFilesSource !== null;
  $: iconTooltip = !mayManageServers
    ? ''
    : canChangeIcon
      ? $_('pages.servers.header.icon-change')
      : $_(
          featureUnavailableReason($server, 'files.source') ||
            'pages.servers.header.icon-unavailable',
          {
            values: { section: $_('components.server-navigation-menu.files') },
          },
        );
  $: syncNodeFeed(managed);
  $: loadNode(managed ? nodeId : null);

  // SM-68 — the server JSON's `activeTask`, which the `taskProgress` frames keep current
  // (applyTaskFrame), so a reload in the middle of a ten-minute build still shows the bar. SM-77 —
  // nothing else: the bar is the same in every tab, whichever one pressed the button.
  $: headerTask = getActiveTask($server);
  // A task that just failed stays on the bar, in red, for a few seconds.
  $: taskFailure = $server?.taskFailure ?? null;
  $: visibleFailure = visibleTaskFailure(taskFailure, taskFailureTick);
  $: failedTask = headerTask ? null : visibleFailure;
  $: barTask = headerTask ?? failedTask;
  // A managed server shows whatever it is busy with (SM-68). Elsewhere only the Pano plugin
  // update is a task (SM-77), on every card that offers it.
  $: showTaskProgress =
    !!$server &&
    (managed
      ? !!barTask || processState === ProcessStates.INSTALLING
      : isPanoPluginUpdateTask(barTask));
  $: taskFailed = !!failedTask;
  $: taskPercent = percentOf(barTask);
  $: taskLabel = $_(taskLabelKey(barTask));
  $: taskDetailText = taskDetail(barTask);
  $: taskTransfer = taskFailed ? '' : taskTransferText(barTask);
  $: buildToolsNote = !taskFailed && isBuildToolsTask(barTask, $server);
  // A failed build keeps its lines for as long as the bar still shows it.
  $: taskHasLog = isBuildToolsTask(barTask, $server);
  $: collectTaskLine($server?.id ?? null, headerTask);
  $: if (taskLogOpen && taskLogElement && taskLines) {
    void followTaskLog();
  }

  /** How many of the task's lines the open log keeps; the node's own log file has them all. */
  const MAX_TASK_LINES = 300;

  /**
   * The lines the running task reported while this page was open, oldest first: the node
   * forwards at most one BuildTools line a second (and every phase change), as the task's
   * message. Collected here, because the task itself only ever holds the latest one.
   *
   * @type {string[]}
   */
  let taskLines = [];
  /** Which server and task [taskLines] belong to. */
  let taskLinesOwner = null;
  let taskLogOpen = false;
  /** @type {HTMLPreElement | undefined} */
  let taskLogElement;
  /** Whether the log is scrolled to its end, so a new line keeps it there. */
  let taskLogAtEnd = true;

  /**
   * @param {number | string | null} serverId
   * @param {{ uuid?: string, id?: number, kind?: string, startedAt?: number } | null} task
   */
  function collectTaskLine(serverId, task) {
    // Kept once the task ends, so a build that just failed still shows how far it got; a new
    // task, or another server, starts over.
    if (!task) {
      if (taskLinesOwner && !String(taskLinesOwner).startsWith(`${serverId}:`)) {
        taskLines = [];
        taskLinesOwner = null;
      }

      return;
    }

    const owner = `${serverId}:${task.uuid ?? task.id ?? ''}:${task.kind ?? ''}:${task.startedAt ?? ''}`;

    if (owner !== taskLinesOwner) {
      taskLinesOwner = owner;
      taskLines = [];
      taskLogAtEnd = true;
    }

    const line = taskDetail(task);

    // A heartbeat repeats the phase line; one copy of it is enough.
    if (!line || taskLines[taskLines.length - 1] === line) {
      return;
    }

    taskLines = [...taskLines, line].slice(-MAX_TASK_LINES);
  }

  function onTaskLogScroll() {
    if (!taskLogElement) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = taskLogElement;

    taskLogAtEnd = scrollHeight - scrollTop - clientHeight < 8;
  }

  /** Keeps the newest line in view unless the reader scrolled up to read an older one. */
  async function followTaskLog() {
    if (!taskLogAtEnd) {
      return;
    }

    await tick();

    // Through a plain local, never `taskLogElement.scrollTop = …`: in a legacy component that
    // assignment counts as a change of `taskLogElement` itself, which re-runs the statement that
    // called this, which assigns again -- an endless loop of microtasks that froze the browser the
    // moment the log was opened.
    const element = taskLogElement;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  /** Bumped when a failure's few seconds are up, so [visibleFailure] is worked out again. */
  let taskFailureTick = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let taskFailureTimer = null;

  /**
   * @template {{ at?: number }} F
   * @param {F | null} failure
   * @param {number} _tick only there so the statement re-runs when the time is up.
   * @returns {F | null} [failure] while it is recent enough to show.
   */
  function visibleTaskFailure(failure, _tick) {
    if (taskFailureTimer) {
      clearTimeout(taskFailureTimer);
      taskFailureTimer = null;
    }

    const left = failure ? TASK_FAILURE_VISIBLE_MS - (Date.now() - (Number(failure.at) || 0)) : 0;

    if (!browser || left <= 0) {
      return null;
    }

    taskFailureTimer = setTimeout(() => {
      taskFailureTimer = null;
      taskFailureTick += 1;
    }, left);

    return failure;
  }

  $: restartAction = powerActions?.find((action) => action.id === 'restart') ?? null;

  $: powerActions = POWER_BUTTONS.map((button) => {
    const reason = $powerCooldown
      ? 'pages.servers.header.power-cooldown'
      : powerTooltip(button, $server, node);

    return {
      ...button,
      // `state` and `section` are what the sentences take: the process state for the "not in
      // this state" ones, the section's name for the two that predate §2.4.17.
      tooltip: reason
        ? $_(reason, {
            values: {
              state: $_(processStateLabel(processState)),
              section: $_('pages.servers.capabilities.power'),
            },
          })
        : '',
      disabled: !!powerBusy || !!reason,
    };
  });

  /**
   * Holds the node feed open while a managed server is on screen, so the header badge follows
   * the node going offline. The layout is reused when the route moves to another server, so
   * this runs on every `managed` change rather than once on mount.
   *
   * @param {boolean} isManagedServer
   */
  function syncNodeFeed(isManagedServer) {
    if (!browser) {
      return;
    }

    const want = isManagedServer && hasPermission(Permissions.MANAGE_NODES);

    if (want === nodeFeedActive) {
      return;
    }

    nodeFeedActive = want;

    if (want) {
      releaseNodes = subscribeNodes();

      return;
    }

    releaseNodes?.();
    releaseNodes = null;
  }

  /**
   * @param {number | string | null} id
   */
  function loadNode(id) {
    if (!browser || id == null) {
      if (id == null) {
        node = null;
        nodeRequestedId = null;
      }

      return;
    }

    if (nodeRequestedId === id) {
      return;
    }

    nodeRequestedId = id;
    node = getCachedNode(id);

    if (!hasPermission(Permissions.MANAGE_NODES)) {
      return;
    }

    void fetchNode(id).then((row) => {
      if (row && nodeRequestedId === id) {
        node = row;
      }
    });
  }

  /**
   * Why a power button cannot be pressed, as an i18n key — empty when it can.
   *
   * @param {{ id: string, power: string, feature: string, managedOnly: boolean,
   *   can: (server: object) => boolean }} button
   * @param {object | null} current
   * @param {object | null} nodeRow
   * @returns {string}
   */
  function powerTooltip(button, current, nodeRow) {
    if (!hasPermission(Permissions.MANAGE_SERVER_POWER)) {
      return 'pages.servers.header.power-no-permission';
    }

    const source = featureSource(current, button.feature);

    // §2.4.17 — the state first: a stopped server's Stop is unavailable because it is stopped,
    // and saying so beats explaining which side could have stopped it. Except on a linked
    // server, where no state brings Start or Kill back — what it lacks is the answer there.
    // §2.4.35 — whatever nothing serves is explained with the sentence the pages use.
    if (source !== undefined) {
      if (source === null && !isManaged(current)) {
        return featureUnavailableReason(current, button.feature, { node: nodeRow });
      }

      if (!button.can(current)) {
        return 'pages.servers.header.power-state';
      }

      if (source === null) {
        return featureUnavailableReason(current, button.feature, { node: nodeRow });
      }

      return '';
    }

    // Starting and killing need a process Pano owns; a linked server has none, whatever its state.
    if (button.managedOnly && !isManaged(current)) {
      return 'pages.servers.header.power-requires-managed';
    }

    if (isManaged(current)) {
      if (nodeRow && !isNodeOnline(nodeRow)) {
        return 'pages.servers.header.power-node-offline';
      }

      return button.can(current) ? '' : 'pages.servers.header.power-state';
    }

    if (button.managedOnly) {
      return 'pages.servers.header.power-requires-managed';
    }

    if (!hasCapability(current, ServerCapabilities.POWER)) {
      return 'pages.servers.header.power-requires-capability';
    }

    if (!isPluginConnected(current)) {
      return 'pages.servers.header.power-offline';
    }

    return '';
  }

  /**
   * @param {string} key
   * @returns {boolean} whether this adoption's alert was closed before, in this browser.
   */
  function isAdoptedAlertDismissed(key) {
    if (!browser) {
      return false;
    }

    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  function dismissAdoptedAlert() {
    dismissedAdoptedKey = adoptedAlertKey;

    try {
      localStorage.setItem(adoptedAlertKey, '1');
    } catch {
      // Storage is a convenience; the alert still stays closed for this visit.
    }
  }

  /**
   * @param {{ power: string | null, disabled?: boolean }} action
   */
  function askPower(action) {
    if (!action.power || action.disabled) {
      return;
    }

    pendingPower = action;

    if (!powerModalInstance && powerModalElement) {
      powerModalInstance = new window.bootstrap.Modal(powerModalElement, {
        backdrop: 'static',
        keyboard: false,
      });
    }

    powerModalInstance?.show();
  }

  function hidePowerModal() {
    // `pendingPower` deliberately survives the hide: Bootstrap fades the dialog out over
    // ~150 ms, and clearing it here would blank the title and the button mid-animation. The
    // next [askPower] overwrites it anyway.
    powerModalInstance?.hide();
  }

  async function confirmPower() {
    const action = pendingPower;

    if (!action || powerBusy || serverId == null) {
      return;
    }

    powerBusy = action.power;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/power`,
        body: { action: action.power },
        handler: (response) => response,
      });

      // `undefined` means the request never completed; ApiUtil already raised the offline
      // splash, so a second toast would only be noise.
      if (!body) {
        return;
      }

      if (body.error) {
        if (isRateLimitError(body.error)) {
          powerCooldown.trigger();
        }

        showServerActionError(body.error, body, { server: $server, feature: action.feature, node });

        return;
      }

      showSuccess(action.done, { name: getServerDisplayName($server) });
      // The action was logged; a backend without the live frame gets its cue from here.
      notifyLocalServerActivity($server?.id);
      hidePowerModal();
    } finally {
      powerBusy = null;
    }
  }

  $: if (browser && serverId != null && subscribedId !== serverId) {
    subscribedId = serverId;
    setPanelSelectedServerSubscription(serverId);
  }

  // Keeps `basicData.selectedServer` pointing at the last server the admin opened, which is
  // what the navbar falls back to outside the servers workspace.
  $: if (browser && serverId != null && selectedId !== serverId) {
    selectedId = serverId;
    void ApiUtil.post({ path: `/api/panel/servers/${serverId}/select` }).catch(() => {
      /* remembering the last opened server is best effort */
    });
  }

  // And the browser's own copy, right away: `basicData` is only read once per load, so without
  // this a server opened by URL stayed "selected" as whatever the previous load remembered — the
  // site pill and then the game pill brought the old server's menu back.
  $: if (browser && serverId != null && $server && Number($server.id) === Number(serverId)) {
    const current = get(selectedServer);

    if (!current || Number(current.id) !== Number(serverId)) {
      selectedServer.set({ ...$server });
    }
  }

  function applyServer(next) {
    const current = get(server);

    server.set(
      current && Number(current.id) === Number(next.id) ? { ...current, ...next } : { ...next },
    );
  }

  /** Re-fetch the pages that `depends(PANEL_SERVER_LIVE_LOAD_KEY)` after a realtime frame. */
  function scheduleLiveReload() {
    if (!browser) {
      return;
    }

    if (liveReloadTimer) {
      clearTimeout(liveReloadTimer);
    }

    liveReloadTimer = setTimeout(() => {
      liveReloadTimer = null;
      void invalidate(PANEL_SERVER_LIVE_LOAD_KEY);
    }, 400);
  }

  /** Pending re-fetch of the server row (see [scheduleServerRefetch]). */
  let serverRefetchTimer = null;
  let lastServerRefetchAt = 0;

  /**
   * §2.4.35 — a page ran into a state error (feature unavailable, node offline...), so the row's
   * `features` are behind: fetch it again so the notices say what is true now. At most one
   * request every few seconds, however many pages ask — a page that reloads its data whenever
   * the row changes must not be able to turn this into a loop.
   */
  function scheduleServerRefetch() {
    if (!browser || serverRefetchTimer) {
      return;
    }

    const wait = Math.max(250, lastServerRefetchAt + 3000 - Date.now());

    serverRefetchTimer = setTimeout(() => {
      serverRefetchTimer = null;
      lastServerRefetchAt = Date.now();
      void refetchServer();
    }, wait);
  }

  async function refetchServer() {
    const id = get(server)?.id;

    if (id == null) {
      return;
    }

    try {
      const response = await ApiUtil.get({ path: `/api/panel/servers/${id}` });

      if (response?.server && Number(get(server)?.id) === Number(id)) {
        applyServer(response.server);
      }
    } catch {
      // Best effort: the realtime feed catches the row up sooner or later anyway.
    }
  }

  /** The image types a server icon may be uploaded as; Pano turns it into the 64 px PNG. */
  const SERVER_ICON_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  const SERVER_ICON_MAX_BYTES = 1024 * 1024;

  let iconUploading = false;

  /**
   * The address players type, always with its port: the game port of a managed server, the
   * reported port otherwise. A public address that already names a port is left as it is.
   *
   * @param {object | null} current
   * @param {boolean} isManagedServer
   */
  function addressWithPort(current, isManagedServer) {
    const host = getPrimaryAddress(current);
    const port = isManagedServer ? (current?.gamePort ?? current?.port) : current?.port;

    if (!host || port == null || port === '' || /:\d+$/.test(host)) {
      return host;
    }

    return `${host}:${port}`;
  }

  /**
   * `26.3-32-0c803ba (MC: 26.3)` reads as `MC 26.3`; without the `MC:` part the software
   * version, and failing that the raw string.
   *
   * @param {object | null} current
   */
  function shortVersion(current) {
    const raw = String(current?.version || '').trim();
    const minecraft = raw.match(/\(MC:\s*([^)]+)\)/i);

    if (minecraft) {
      return `MC ${minecraft[1].trim()}`;
    }

    return String(current?.softwareVersion || '').trim() || raw;
  }

  /**
   * @param {CustomEvent<{ error: string }>} event
   */
  function onIconFileError(event) {
    showError(
      event.detail?.error === 'INVALID_SIZE'
        ? 'pages.servers.header.icon-too-large'
        : 'pages.servers.header.icon-wrong-type',
    );
  }

  /**
   * `POST /api/panel/servers/:id/icon`: the new icon as multipart; the answer carries the icon
   * as the panel should show it and whether the game only picks it up after a restart.
   *
   * @param {File} file
   */
  async function uploadIcon(file) {
    const id = $server?.id;

    if (id == null || iconUploading || !file) {
      return;
    }

    iconUploading = true;

    try {
      const form = new FormData();

      form.append('icon', file);

      const body = await ApiUtil.post({
        path: `/api/panel/servers/${id}/icon`,
        body: form,
        handler: (response) => response,
      });

      // `undefined` is the network-error path; ApiUtil already said so.
      if (!body) {
        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'files.source' });

        return;
      }

      if (body.favicon) {
        server.update((current) =>
          current && Number(current.id) === Number(id)
            ? { ...current, favicon: body.favicon }
            : current,
        );
      }

      showSuccess(
        body.restartRequired
          ? 'pages.servers.header.icon-updated-restart'
          : 'pages.servers.header.icon-updated',
      );
    } finally {
      iconUploading = false;
    }
  }

  function onCopyAddress() {
    copy(serverAddress);

    copied = true;

    if (copiedTimeout) {
      clearTimeout(copiedTimeout);
    }

    copiedTimeout = setTimeout(() => {
      copied = false;
    }, 2000);
  }

  onMount(() => {
    const offServerUpdate = onPanelServerUpdate((frame) => {
      if (!frame || frame.id == null) {
        return;
      }

      const current = get(server);

      if (!current || Number(current.id) !== Number(frame.id)) {
        return;
      }

      server.set({ ...current, ...frame });
      scheduleLiveReload();
    });

    const offServerRemoved = onPanelServerRemoved((removedId) => {
      if (Number(get(server)?.id) !== Number(removedId)) {
        return;
      }

      void goto(base + '/', { invalidateAll: true });
    });

    // §2.4.3 — the node pushes a state change on every transition; merge it so the pill and
    // the power buttons follow the process without a reload.
    const offServerState = onServerState((frame) => {
      const current = get(server);

      if (!current || Number(current.id) !== Number(frame.serverId)) {
        return;
      }

      server.set({
        ...current,
        processState: frame.state,
        lastExitCode: frame.exitCode ?? current.lastExitCode ?? null,
        processPid: frame.pid,
        processSince: frame.since,
        // A frame without a reason clears the old one: it belongs to the stop it came with,
        // not to the server.
        lastStateReason: frame.reason || null,
        // §2.4.28 — same lifetime as the reason: the overview offers a Java download off it.
        lastStateReasonCode: frame.reasonCode || null,
        lastStateJavaMajor: frame.javaMajor ?? null,
        // The server JSON carries the same thing as `lastStopReason` (kept by Pano, so it
        // survives a reload); a frame supersedes it the way Pano's own store does.
        lastStopReason:
          frame.reason || frame.reasonCode
            ? {
                reason: frame.reason || null,
                reasonCode: frame.reasonCode || null,
                javaMajor: frame.javaMajor ?? null,
                at: Date.now(),
              }
            : null,
        // §2.4.16 — a frame that says nothing about adoption leaves what the row reported in
        // place; an explicit `false` (a normal start, stdin back) does clear it.
        adopted: frame.adopted ?? current.adopted,
        stdinAvailable: frame.stdinAvailable ?? current.stdinAvailable,
      });
    });

    // Install/reinstall progress. Node-wide tasks carry no `serverId` and are none of this
    // page's business.
    const offTaskProgress = onTaskProgress((frame) => {
      const current = get(server);

      if (!current || frame.serverId == null || Number(frame.serverId) !== Number(current.id)) {
        return;
      }

      // The row's `activeTask` follows the frame, and the bar reads nothing else.
      server.set(applyTaskFrame(current, frame));

      if (frame.status === 'DONE') {
        scheduleLiveReload();

        return;
      }

      if (frame.status === 'FAILED') {
        void showServerActionError(frame.error || 'TASK_FAILED');
      }
    });

    // Node rows arrive for every node; keep the cache warm and re-read the one we show.
    const offNode = onNode(({ node: row }) => {
      const cached = cacheNode(row);
      const currentNodeId = get(server)?.nodeId;

      if (cached && currentNodeId != null && Number(cached.id) === Number(currentNodeId)) {
        node = cached;
      }
    });

    const offRefreshRequest = onServerRefreshRequest((id) => {
      if (Number(get(server)?.id) === id) {
        scheduleServerRefetch();
      }
    });

    return () => {
      offServerUpdate();
      offServerRemoved();
      offServerState();
      offTaskProgress();
      offNode();
      offRefreshRequest();

      if (serverRefetchTimer) {
        clearTimeout(serverRefetchTimer);
        serverRefetchTimer = null;
      }
    };
  });

  onDestroy(() => {
    pageSubtitle?.set(null);

    powerCooldown.cancel();

    if (copiedTimeout) {
      clearTimeout(copiedTimeout);
    }

    if (liveReloadTimer) {
      clearTimeout(liveReloadTimer);
    }

    if (taskFailureTimer) {
      clearTimeout(taskFailureTimer);
    }

    if (powerModalInstance) {
      powerModalInstance.hide();
      powerModalInstance.dispose();
      powerModalInstance = undefined;
    }

    releaseNodes?.();
    releaseNodes = null;
    nodeFeedActive = false;

    if (browser) {
      setPanelSelectedServerSubscription(null);
      setActiveServer(null);
    }
  });
</script>
