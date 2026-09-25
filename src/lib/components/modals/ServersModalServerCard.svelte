<style>
  .server-card {
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    overflow-x: clip;
    overflow-y: visible;
  }

  :global(.server-card .card-body) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 0;
    padding: 1rem;
  }

  @media (min-width: 576px) {
    :global(.server-card .card-body) {
      padding: 0.75rem !important;
    }
  }

  .server-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-color: var(--bs-primary);
  }

  .server-card .server-ip {
    font-size: 0.75rem;
  }

  .server-card .player-count {
    font-size: 0.7rem;
  }

  .server-card.is-selecting {
    pointer-events: none;
  }

  .status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.is-busy {
    animation: status-dot-pulse 1.2s ease-in-out infinite;
  }

  @keyframes status-dot-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--bs-info) 60%, transparent);
    }
    50% {
      box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--bs-info) 0%, transparent);
    }
  }

  .task-progress {
    height: 4px;
  }

  .task-line {
    font-size: 0.7rem;
  }

  .selecting-overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bs-border-radius);
    background: color-mix(in srgb, var(--bs-body-bg) 78%, transparent);
    backdrop-filter: blur(2px);
    animation: selecting-pulse 1.1s ease-in-out infinite;
  }

  @keyframes selecting-pulse {
    0%,
    100% {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bs-primary) 45%, transparent);
    }
    50% {
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--bs-primary) 70%, transparent);
    }
  }
</style>

<div class="col">
  <div
    class="card h-100 server-card position-relative"
    class:is-selecting={selectingServerId === server.id}
    class:border-primary={$selectedServer?.id === server.id}
    class:border-2={$selectedServer?.id === server.id}
    class:shadow-sm={$selectedServer?.id === server.id}
    class:opacity-50={selectingServerId != null && selectingServerId !== server.id}
    on:click={() => {
      if (!selectingServerId) onSelectCard(server);
    }}
    on:keydown={onKeyDown}
    tabindex="0"
    role="button"
    aria-busy={selectingServerId === server.id ? 'true' : undefined}>
    {#if selectingServerId === server.id}
      <div class="selecting-overlay">
        <div class="d-flex flex-column align-items-center gap-2 px-2 text-center text-primary">
          <div class="spinner-border" style="width: 2.25rem; height: 2.25rem;" role="status">
            <span class="visually-hidden">{$_('components.modals.servers.selecting-server')}</span>
          </div>
          <span class="small fw-semibold text-body"
            >{$_('components.modals.servers.selecting-server')}</span>
        </div>
      </div>
    {/if}
    <!-- How Pano got hold of this server, in the corner opposite the crown so neither pushes the
         centred body around. Same icons and wording as the server header. -->
    <div
      class="position-absolute top-0 start-0 p-2 text-body-secondary small"
      role="img"
      aria-label={kindLabel}
      use:tooltip={[kindLabel, { appendTo: TOOLTIP_HOST }]}>
      <i class="fa-solid {managed ? 'fa-server' : 'fa-link'}" aria-hidden="true"></i>
    </div>
    {#if problemsText || ($mainServer && server.id === $mainServer.id)}
      <div class="position-absolute top-0 end-0 p-2 d-flex align-items-center gap-2">
        {#if problemsText}
          <!-- A crash, or a plugin / node too old for this Pano: say what, on hover. -->
          <span
            class="text-danger"
            role="img"
            aria-label={problemsText}
            use:tooltip={[problemsText, { appendTo: TOOLTIP_HOST }]}>
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          </span>
        {/if}
        {#if $mainServer && server.id === $mainServer.id}
          <span
            class="text-warning"
            use:tooltip={[$_('components.modals.servers.main-server'), { appendTo: TOOLTIP_HOST }]}>
            <i class="fa-solid fa-crown"></i>
          </span>
        {/if}
      </div>
    {/if}

    <div
      class="card-body d-flex flex-column flex-grow-1 align-items-center text-center p-3 min-w-0">
      <!-- The card as a whole is the click target, but only this block carries the "select"
           tooltip: on the root it fired underneath every inner tooltip at once. -->
      <div
        class="d-flex flex-column align-items-center w-100 min-w-0"
        use:tooltip={[selectTooltip, { placement: 'bottom', appendTo: TOOLTIP_HOST }]}>
        <img
          src={sanitizeImageSrc(
            server.favicon ? server.favicon : base + '/assets/img/server-icon.png',
            base + '/assets/img/server-icon.png',
          )}
          class="rounded border mb-2"
          height="32"
          width="32"
          alt={server.customName || server.name} />

        <div class="d-flex align-items-center justify-content-center gap-1 w-100 mb-1 px-1 min-w-0">
          <SoftwareLogo id={server.type} size="1.25rem" />
          <span class="fw-bold text-break min-w-0 server-name">
            {server.customName || server.name}
          </span>
        </div>
      </div>

      <div class="small w-100 mb-1 px-1 server-ip text-break">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <code
          class="user-select-all cursor-pointer text-break d-inline-block"
          on:click|stopPropagation={onCodeClick}
          on:keydown|stopPropagation={(e) => e.key === 'Enter' && onCodeClick(e)}
          tabindex="0"
          use:tooltip={[
            copiedId === server.id
              ? $_('components.modals.connect-server.copied')
              : $_('buttons.copy'),
            { placement: 'top', hideOnClick: false, appendTo: TOOLTIP_HOST },
          ]}>{getPrimaryAddress(server)}</code>
      </div>

      <div class="mt-auto w-100">
        <div class="player-count d-flex align-items-center justify-content-center gap-1">
          <span
            class="status-dot"
            class:is-busy={!!task}
            class:bg-info={!!task}
            class:bg-success={!task && online}
            class:bg-danger={!task && !online}
            role="img"
            aria-label={statusLabel}
            use:tooltip={[statusLabel, { appendTo: TOOLTIP_HOST }]}></span>
          {#if task}
            <span class="badge text-bg-info">{taskLabel}</span>
          {:else}
            <span>{server.playerCount}/{server.maxPlayerCount}</span>
          {/if}
        </div>

        {#if task}
          <!-- SM-68 — while a task runs the gauges have nothing to say; the task does. -->
          <div class="w-100 mt-2 px-1 text-start">
            <div
              class="progress task-progress"
              role="progressbar"
              aria-label={taskLabel}
              aria-valuenow={percent}
              aria-valuemin="0"
              aria-valuemax="100">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated bg-info"
                style="width: {percent}%;">
              </div>
            </div>
            <div class="d-flex gap-1 mt-1 task-line text-body-secondary min-w-0">
              <span class="text-truncate flex-grow-1" title={message || taskLabel}
                >{message || taskLabel}</span>
              <span class="font-monospace flex-shrink-0">{percent}%</span>
            </div>
          </div>
        {:else}
          {#if failureShown && failure}
            <div
              class="task-line text-danger text-truncate w-100 mt-1 px-1"
              title={failure.error || failureLabel}>
              <i class="fa-solid fa-circle-exclamation me-1" aria-hidden="true"></i>{failureLabel}
            </div>
          {/if}
          <div class="d-flex align-items-start justify-content-center gap-2 w-100 mt-2">
            {#each vitals as vital (vital.key)}
              <VitalsGauge
                value={vital.value}
                text={vital.text}
                label={vital.label}
                detail={vital.detail}
                dangerAbove={vital.dangerAbove}
                dim={!online} />
            {/each}
          </div>
        {/if}
      </div>
    </div>

    {#if $selectedServer?.id === server.id}
      <div class="card-footer bg-primary text-white text-center py-1 small">
        <i class="fas fa-check-circle me-1"></i>
        {$_('buttons.selected') || 'Selected'}
      </div>
    {/if}
  </div>
</div>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import SoftwareLogo from '$lib/components/servers/SoftwareLogo.svelte';
  import VitalsGauge from '$lib/components/servers/VitalsGauge.svelte';
  import { sanitizeImageSrc } from '$lib/security.util.js';
  import {
    getActiveTask,
    isManaged,
    isServerOnline,
    serverProblems,
    TASK_FAILURE_VISIBLE_MS,
    taskDetail,
    taskLabelKey,
    taskPercent,
    formatMemoryPair,
  } from '$lib/servers.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import tooltip from '$lib/tooltip.util';

  // Interactive tippies default to the reference's parent, where the next card in the grid paints
  // over them; the body is the only host every card can share.
  const TOOLTIP_HOST = () => document.body;

  export let server;

  /** @type {import('svelte/store').Readable<unknown> | null} */
  const selectedServer = getContext('selectedServer');
  const mainServer = getContext('mainServer');

  export let selectingServerId;
  export let copiedId;
  export let onSelectCard;
  export let onCopy;

  /**
   * The newest metric sample for this server, straight from the `latest` of
   * `GET /api/panel/servers-metrics`. It stays null on a backend without that endpoint, and
   * every gauge then reads "—" instead of the card breaking.
   *
   * @type {{ cpu?: number|null, processCpu?: number|null, memUsed?: number|null, memMax?: number|null, memRss?: number|null, hostMemTotal?: number|null, diskUsed?: number|null, diskTotal?: number|null, source?: string } | null}
   */
  export let latest = null;

  /** What an unknown value reads as, in every gauge. */
  const UNKNOWN_TEXT = '—';

  /** Percentage from which the CPU and RAM rings turn red. */
  const DANGER_PERCENT = 90;

  $: online = isServerOnline(server);
  $: managed = isManaged(server);
  $: problemsText = serverProblems(server)
    .map((problem) => $_(problem.key, { values: problem.values }))
    .join(' · ');
  // The server row carries a node id but no node name, so the card says "Managed" plainly and
  // leaves "Managed on <node>" to the server header, which has the node loaded.
  $: kindLabel = managed ? $_('pages.servers.header.managed') : $_('pages.servers.card.linked');
  $: selectTooltip =
    $selectedServer?.id !== server.id ? $_('components.modals.servers.select-server-tooltip') : '';
  // SM-68 — the task the server is busy with (install, backup, ...), from the server JSON's
  // `activeTask`, kept live by the modal's `taskProgress` frames.
  $: task = getActiveTask(server);
  $: taskLabel = task ? $_(taskLabelKey(task)) : '';
  $: percent = taskPercent(task);
  $: message = taskDetail(task);
  $: statusLabel = task
    ? taskLabel
    : online
      ? $_('components.modals.servers.online')
      : $_('components.modals.servers.offline');

  // A task that just failed says so for a few seconds, then the card is itself again.
  $: failure = server.taskFailure ?? null;
  $: failureLabel = failure
    ? $_('components.modals.servers.task-failed', {
        values: { task: $_(taskLabelKey(failure)) },
      })
    : '';
  $: showFailure(failure);

  let failureShown = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let failureTimer = null;

  /** @param {{ at?: number } | null} next */
  function showFailure(next) {
    if (failureTimer) {
      clearTimeout(failureTimer);
      failureTimer = null;
    }

    const left = next ? TASK_FAILURE_VISIBLE_MS - (Date.now() - (Number(next.at) || 0)) : 0;

    failureShown = left > 0;

    if (failureShown) {
      failureTimer = setTimeout(() => {
        failureShown = false;
        failureTimer = null;
      }, left);
    }
  }

  onMount(() => () => {
    if (failureTimer) {
      clearTimeout(failureTimer);
    }
  });

  // A sample from before the server went down would be a lie about what it is doing now, so an
  // offline server keeps only its disk figure — the directory is still there.
  $: cpu = online ? resolveCpu(latest) : null;
  $: memory = online ? resolveMemory($_, latest, server) : null;
  $: disk = resolveDisk(latest, server);
  $: vitals = buildVitals($_, cpu, memory, disk);

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectingServerId == null) onSelectCard(server);
    }
  }

  function onCodeClick(e) {
    e.stopPropagation();
    onCopy(e, server);
  }

  function getPrimaryAddress(server) {
    const remoteAddress = String(server?.remoteAddress || '').trim();
    return remoteAddress || server?.host || '';
  }

  /**
   * @param {unknown} value
   * @returns {number|null}
   */
  function numberOrNull(value) {
    const number = value == null ? Number.NaN : Number(value);

    return Number.isFinite(number) ? number : null;
  }

  /**
   * A figure that is only meaningful above zero — a limit of 0 bytes is "nothing measured", not
   * a limit.
   *
   * @param {unknown} value
   * @returns {number|null}
   */
  function positiveOrNull(value) {
    const number = numberOrNull(value);

    return number != null && number > 0 ? number : null;
  }

  /**
   * The plugin measures the server process itself (`cpu`); a node only sees the process it
   * started (`processCpu`), so it is the fallback. A node measuring several cores can report
   * more than 100, which the ring caps.
   *
   * @param {object|null} sample
   */
  function resolveCpu(sample) {
    const value = numberOrNull(sample?.cpu) ?? numberOrNull(sample?.processCpu);

    if (value == null) {
      return null;
    }

    const percent = Math.max(0, Math.min(100, value));

    return { percent, text: `${Math.round(percent)}%`, detail: null };
  }

  /**
   * In use over what it may use — but the two reporters do not measure the same thing, so they
   * do not share a denominator.
   *
   * The plugin reports the JVM heap against `-Xmx`, which is a ratio. A node reports the
   * process' resident set, and an RSS is *always* larger than `-Xmx` (the JVM's own metaspace,
   * threads, code cache and buffers live outside the heap), so dividing it by the allotment
   * painted every healthy node-only server a red 100 %. Against the node's total memory it is
   * the share of the host the server actually takes, which is the question an admin has.
   *
   * The node measures the whole process (`memRss`, also on a plugin's sample) and a server's
   * memory setting is the whole process too (the node's JvmHeap), so that pair comes first and
   * is a real "in use over what it may use"; the host and the heap are what is left when one
   * half of it is missing.
   *
   * @param {(key: string, options?: object) => string} t
   * @param {object|null} sample
   * @param {object|null} [row] the server, for its memory setting.
   */
  function resolveMemory(t, sample, row) {
    const process =
      positiveOrNull(sample?.memRss) ??
      (sample?.source === 'node' ? positiveOrNull(sample?.memUsed) : null);
    const setting = positiveOrNull(row?.memoryMb);

    if (process != null && setting != null) {
      const total = setting * 1024 * 1024;

      return {
        percent: Math.min(100, (process / total) * 100),
        text: compactBytes(process),
        detail: formatMemoryPair(process, total),
      };
    }

    if (sample?.source === 'node') {
      const rss = positiveOrNull(sample?.memRss) ?? positiveOrNull(sample?.memUsed);
      const hostTotal = positiveOrNull(sample?.hostMemTotal);

      if (rss == null) {
        return null;
      }

      return {
        percent: hostTotal == null ? null : Math.min(100, (rss / hostTotal) * 100),
        text: compactBytes(rss),
        detail:
          hostTotal == null
            ? null
            : t('components.modals.servers.ram-of-host', {
                values: { used: formatBytes(rss, 1), total: formatBytes(hostTotal, 1) },
              }),
      };
    }

    const used = positiveOrNull(sample?.memUsed) ?? positiveOrNull(sample?.memRss);
    const max = positiveOrNull(sample?.memMax);

    if (used == null) {
      return null;
    }

    return {
      percent: max == null ? null : Math.min(100, (used / max) * 100),
      text: compactBytes(used),
      detail: max == null ? null : `${formatBytes(used, 1)} / ${formatBytes(max, 1)}`,
    };
  }

  /**
   * The server directory against the partition holding it. Both halves survive a restart on the
   * server row, so a server that has been stopped for weeks still shows what it takes on disk.
   *
   * @param {object|null} sample
   * @param {object|null} row
   */
  function resolveDisk(sample, row) {
    const used = numberOrNull(sample?.diskUsed) ?? numberOrNull(row?.diskUsed);
    const total = positiveOrNull(sample?.diskTotal) ?? positiveOrNull(row?.diskTotal);

    if (used == null) {
      return null;
    }

    return {
      percent: total == null ? null : Math.min(100, (used / total) * 100),
      text: compactBytes(used),
      detail: total == null ? null : `${formatBytes(used, 1)} / ${formatBytes(total, 1)}`,
    };
  }

  /**
   * @param {(key: string) => string} t The `svelte-i18n` formatter, passed in so the gauges are
   *   rebuilt when the language changes.
   * @param {{ percent: number|null, text: string, detail: string|null }|null} cpuStat
   * @param {{ percent: number|null, text: string, detail: string|null }|null} ramStat
   * @param {{ percent: number|null, text: string, detail: string|null }|null} diskStat
   */
  function buildVitals(t, cpuStat, ramStat, diskStat) {
    const unknown = t('components.modals.servers.vitals-unknown');

    const gauge = (key, label, stat, dangerAbove = null) =>
      stat == null
        ? { key, label, value: null, text: UNKNOWN_TEXT, detail: unknown, dangerAbove: null }
        : {
            key,
            label,
            value: stat.percent,
            text: stat.text,
            detail: stat.detail ? `${label} · ${stat.detail}` : label,
            dangerAbove,
          };

    return [
      gauge('cpu', t('components.modals.servers.cpu'), cpuStat, DANGER_PERCENT),
      gauge('ram', t('components.modals.servers.ram'), ramStat, DANGER_PERCENT),
      gauge('disk', t('components.modals.servers.disk'), diskStat),
    ];
  }

  /**
   * `formatBytes` kept short enough for the middle of a 44 px ring: the decimal is only worth
   * its width while the figure itself is small.
   *
   * @param {number} bytes
   */
  function compactBytes(bytes) {
    const rounded = formatBytes(bytes, 0);

    return Number(rounded.split(' ')[0]) >= 10 ? rounded : formatBytes(bytes, 1);
  }
</script>
