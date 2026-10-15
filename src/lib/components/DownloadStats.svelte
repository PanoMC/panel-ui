<!-- "12.3 MB / 98 MB · 4.2 MB/s · ~20 s left" under a download's progress bar. Each part shows
     once it is known: no total without a size from the server, no speed before the second sample. -->
{#if stats}
  <div class="small text-body-secondary font-monospace" aria-live="polite">
    {parts.join(' · ')}
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { formatBytes } from '$lib/string.util.js';

  /** @type {{ stats: import('$lib/downloadStats.util.js').DownloadStats | null }} */
  let { stats = null } = $props();

  const parts = $derived.by(() => {
    if (!stats) {
      return [];
    }

    const list = [
      stats.total != null
        ? `${formatBytes(stats.downloaded, 1)} / ${formatBytes(stats.total, 1)}`
        : formatBytes(stats.downloaded, 1),
    ];

    if (stats.speed != null && stats.speed > 0) {
      list.push(
        $_('components.download-stats.speed', { values: { speed: formatBytes(stats.speed, 1) } }),
      );
    }

    if (stats.secondsLeft != null) {
      const minutes = Math.floor(stats.secondsLeft / 60);
      const seconds = stats.secondsLeft % 60;

      list.push(
        minutes > 0
          ? $_('components.download-stats.minutes-left', { values: { minutes, seconds } })
          : $_('components.download-stats.seconds-left', { values: { seconds } }),
      );
    }

    return list;
  });
</script>
