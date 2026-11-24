<!-- A running upload: phase and percent, the bar, "305 MB / 612 MB · 5.8 MB/s · 2 min left" and
     Cancel. `compact` is the one-line form for a row of a list (thin bar, no phase line). -->
{#if stats}
  <div class="vstack gap-1" class:small={compact}>
    {#if !compact && (phase || name)}
      <div class="d-flex align-items-center gap-2 small">
        <span class="text-break flex-grow-1">
          {#if phase}
            {phase}
          {/if}
          {#if name}
            <span class="font-monospace text-body-secondary" class:ms-1={!!phase}>{name}</span>
          {/if}
        </span>
        <span class="font-monospace flex-shrink-0">{stats.percent}%</span>
      </div>
    {/if}
    <div
      class="progress"
      style="height: {compact ? 4 : 8}px;"
      role="progressbar"
      aria-label={label || phase || name || $_('components.upload-progress.uploading')}
      aria-valuenow={stats.percent}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuetext="{stats.percent}% · {figures}">
      <div
        class="progress-bar"
        class:progress-bar-striped={stats.sent}
        class:progress-bar-animated={stats.sent}
        style="width: {stats.percent}%;">
      </div>
    </div>
    <div class="d-flex align-items-center gap-2 small text-body-secondary">
      <span class="font-monospace flex-grow-1 text-break">
        {compact ? `${stats.percent}% · ${figures}` : figures}
      </span>
      {#if oncancel}
        <button
          type="button"
          class="btn btn-sm btn-link text-danger text-capitalize p-0 flex-shrink-0"
          disabled={cancelDisabled}
          onclick={oncancel}>
          {$_('components.upload-progress.cancel')}
        </button>
      {/if}
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { formatBytes } from '$lib/string.util.js';

  /**
   * @type {{
   *   stats: import('$lib/upload.util.js').UploadStats | null,
   *   phase?: string,
   *   name?: string,
   *   label?: string,
   *   compact?: boolean,
   *   oncancel?: (() => void) | null,
   *   cancelDisabled?: boolean,
   * }}
   */
  let {
    stats = null,
    phase = '',
    name = '',
    label = '',
    compact = false,
    oncancel = null,
    cancelDisabled = false,
  } = $props();

  /** @param {number} bytes */
  function bytes(bytes) {
    return formatBytes(bytes, bytes < 1024 ? 0 : 1);
  }

  /** @param {number} seconds */
  function timeLeft(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;

    if (hours > 0) {
      return $_('components.upload-progress.hours-left', { values: { hours, minutes } });
    }

    if (minutes > 0) {
      return $_('components.upload-progress.minutes-left', { values: { minutes, seconds: rest } });
    }

    return $_('components.upload-progress.seconds-left', { values: { seconds: rest } });
  }

  const figures = $derived.by(() => {
    if (!stats) {
      return '';
    }

    const parts = [`${bytes(stats.loaded)} / ${bytes(stats.total)}`];

    if (stats.sent) {
      return parts.join(' · ');
    }

    if (stats.speed != null && stats.speed > 0) {
      parts.push($_('components.upload-progress.speed', { values: { speed: bytes(stats.speed) } }));
    }

    parts.push(
      stats.secondsLeft == null
        ? $_('components.upload-progress.calculating')
        : timeLeft(stats.secondsLeft),
    );

    return parts.join(' · ');
  });
</script>
