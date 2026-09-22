<style>
  .bootstrap-log {
    height: 14rem;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.8125rem;
    line-height: 1.45;
  }
</style>

<div class="vstack gap-2">
  <div class="d-flex justify-content-between align-items-center small">
    <span class="d-flex align-items-center gap-2">
      {#if running}
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      {/if}
      <span class="badge rounded-pill text-bg-{statusColour}">{$_(statusLabel)}</span>
    </span>
    <span class="font-monospace text-body-secondary">{safePercent}%</span>
  </div>

  <div
    class="progress"
    style="height: 6px;"
    role="progressbar"
    aria-label={$_('components.modals.add-node.progress-label')}
    aria-valuenow={safePercent}
    aria-valuemin="0"
    aria-valuemax="100">
    <div
      class="progress-bar progress-bar-striped"
      class:progress-bar-animated={running}
      class:bg-danger={failed}
      style="width: {safePercent}%;">
    </div>
  </div>

  <!-- Node output is untrusted text (§2.7): it is rendered as text, never as HTML. -->
  <pre
    class="bootstrap-log bg-body-tertiary border rounded p-2 mb-0 font-monospace"
    aria-live="polite"
    aria-label={$_('components.modals.add-node.log-label')}
    bind:this={logElement}>{lines.length
      ? lines.join('\n')
      : $_('components.modals.add-node.waiting')}</pre>

  {#if error}
    <div class="alert alert-danger mb-0 py-2 small" role="alert">
      {$_('components.modals.add-node.failed', { values: { error } })}
    </div>
  {/if}
</div>

<script>
  /**
   * The live output of a node bootstrap (§2.4.10). Pano relays the install script's stdout as
   * `taskProgress` frames of kind `NODE_BOOTSTRAP`; the caller collects the `message` lines and
   * hands them over here, and this only renders them and follows the tail.
   */
  import { _ } from 'svelte-i18n';

  let {
    /** @type {string[]} oldest first. */
    lines = [],
    /** `PENDING` | `RUNNING` | `DONE` | `FAILED`. */
    status = 'PENDING',
    percent = 0,
    /** The failure code Pano reported, when the task failed. */
    error = '',
  } = $props();

  let logElement = $state();
  /** Only pin to the bottom while the reader has not scrolled up to read something. */
  let followTail = $state(true);

  const safePercent = $derived(Math.max(0, Math.min(100, Math.round(Number(percent) || 0))));
  const normalizedStatus = $derived(String(status || 'PENDING').toUpperCase());
  const failed = $derived(normalizedStatus === 'FAILED');
  const running = $derived(normalizedStatus === 'PENDING' || normalizedStatus === 'RUNNING');

  const statusColour = $derived(
    failed ? 'danger' : normalizedStatus === 'DONE' ? 'success' : 'info',
  );

  const statusLabel = $derived(
    failed
      ? 'components.modals.add-node.status-failed'
      : normalizedStatus === 'DONE'
        ? 'components.modals.add-node.status-done'
        : 'components.modals.add-node.status-running',
  );

  $effect(() => {
    // Re-runs on every new batch of lines.
    void lines.length;

    if (!logElement || !followTail) {
      return;
    }

    logElement.scrollTop = logElement.scrollHeight;
  });

  $effect(() => {
    const element = logElement;

    if (!element) {
      return;
    }

    const onScroll = () => {
      followTail = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
    };

    element.addEventListener('scroll', onScroll);

    return () => element.removeEventListener('scroll', onScroll);
  });
</script>
