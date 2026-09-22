<style>
  .daemon-update.compact {
    min-width: 10rem;
    max-width: 18rem;
  }
</style>

<!-- A node or a Pano Agent replacing its own daemon (SM-77), as Pano reports it: the node JSON's
     `updateProgress` or the server JSON's `daemonUpdate`, kept current by the realtime frames. The
     same for every tab and every admin — nothing here is remembered by the page. -->
{#if update}
  <div class="daemon-update {className}" class:compact>
    <div
      class="d-flex justify-content-between gap-2 small"
      class:text-body-secondary={!failed && !done}
      class:text-danger={failed}
      class:text-success={done}>
      <span class="text-break">
        {#if failed}
          <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
        {:else if done}
          <i class="fa-solid fa-check me-1" aria-hidden="true"></i>
        {/if}
        {label}
      </span>
      {#if update.status === DaemonUpdateStatuses.RUNNING}
        <span class="font-monospace">{update.percent}%</span>
      {/if}
    </div>
    <div
      class="progress mt-1"
      style:height={compact ? '4px' : '6px'}
      role="progressbar"
      aria-label={label}
      aria-valuenow={shownPercent}
      aria-valuemin="0"
      aria-valuemax="100">
      <div
        class="progress-bar"
        class:progress-bar-striped={updating}
        class:progress-bar-animated={updating}
        class:bg-danger={failed}
        class:bg-success={done}
        style:width="{shownPercent}%">
      </div>
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import {
    DaemonUpdateStatuses,
    isDaemonUpdating,
    normalizeDaemonUpdate,
  } from '$lib/nodes.util.js';

  /**
   * @type {{ progress: Record<string, any> | null | undefined, subject?: 'agent' | 'node',
   *   compact?: boolean, class?: string }}
   */
  let { progress, subject = 'node', compact = false, class: className = '' } = $props();

  const update = $derived(normalizeDaemonUpdate(progress));
  const updating = $derived(isDaemonUpdating(update));
  const failed = $derived(update?.status === DaemonUpdateStatuses.FAILED);
  const done = $derived(update?.status === DaemonUpdateStatuses.DONE);
  // Restarting has nothing left to download; a finished or failed one is shown as a full bar.
  const shownPercent = $derived(
    update?.status === DaemonUpdateStatuses.RUNNING ? update.percent : 100,
  );

  /** "the Pano Agent" by name on a server's card; a node's own page already names the node. */
  const agent = $derived(subject === 'agent');

  const label = $derived.by(() => {
    if (!update) {
      return '';
    }

    const values = { version: update.version, message: update.message };

    switch (update.status) {
      case DaemonUpdateStatuses.RUNNING:
        return $_(
          `components.daemon-update.running${agent ? '-agent' : ''}${update.version ? '' : '-plain'}`,
          { values },
        );
      case DaemonUpdateStatuses.RESTARTING:
        return $_(`components.daemon-update.restarting${agent ? '-agent' : ''}`);
      case DaemonUpdateStatuses.DONE:
        return $_(`components.daemon-update.done${update.version ? '' : '-plain'}`, { values });
      default:
        return $_(`components.daemon-update.failed${update.message ? '' : '-plain'}`, { values });
    }
  });
</script>
