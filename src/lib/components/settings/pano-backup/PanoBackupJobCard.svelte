<!-- The running / last Pano backup job. Polls `GET /api/v1/panel/pano-backups/job` while it runs. -->
{#if job && running}
  <div class="card" aria-live="polite">
    <div class="card-body vstack gap-2">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
        <strong>{$_(`pages.settings.backups.job.type-${String(job.type).toLowerCase()}`)}</strong>
        {#if job.phase}
          <span class="text-body-secondary small">
            {$_(`pages.settings.backups.job.phase-${String(job.phase).toLowerCase()}`)}
            {#if job.remotePhase}· {job.remotePhase}{/if}
          </span>
        {/if}
        {#if job.startedAt}
          <span class="text-body-secondary small ms-auto">
            <DateComponent time={job.startedAt} relativeFormat />
          </span>
        {/if}
      </div>

      <div
        class="progress"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percent ?? undefined}>
        <div
          class="progress-bar"
          class:progress-bar-striped={percent === null}
          class:progress-bar-animated={percent === null}
          style="width: {percent ?? 100}%">
          {#if percent !== null}{percent}%{/if}
        </div>
      </div>
      {#if hasBytes || speedText}
        <div class="small text-body-secondary d-flex flex-wrap gap-2">
          {#if hasBytes}
            <span>
              {$_('pages.settings.backups.job.bytes-of', {
                values: {
                  done: formatBytes(job.bytesDone || 0),
                  total: formatBytes(job.bytesTotal),
                },
              })}
            </span>
          {/if}
          {#if speedText}
            <span class="ms-auto">{speedText}</span>
          {/if}
        </div>
      {/if}
      {#if job.type === 'RESTORE'}
        <div class="small text-warning">{$_('pages.settings.backups.job.restore-running')}</div>
      {/if}
    </div>
  </div>
{:else if job && job.status !== 'DONE' && dismissedId !== job.id}
  <!-- A finished job says so in a toast (`finished`); only a failed one stays on the page. -->
  <div
    class="alert alert-danger alert-dismissible d-flex align-items-center gap-2 mb-0"
    role="alert">
    <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>
    <div>
      {#if error}
        {$_(error.key, { values: error.values })}
        {#if job.rolledBack}
          <div class="mt-1">{$_('pages.settings.backups.job.rolled-back')}</div>
        {/if}
      {/if}
    </div>
    <button
      type="button"
      class="btn-close"
      aria-label={$_('buttons.close')}
      onclick={() => (dismissedId = job.id)}></button>
  </div>
{/if}

{#if restartRequired}
  <div class="alert alert-warning d-flex align-items-center gap-2 mb-0">
    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
    <div>{$_('pages.settings.backups.job.restart-required')}</div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import ApiUtil from '$lib/api.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import { formatSpeed, isJobRunning, jobPercent, jobSpeed } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import DateComponent from '$lib/components/Date.svelte';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';

  /**
   * @type {{
   *   job?: object | null,
   *   restartRequired?: boolean,
   *   onupdate?: (job: object) => void,
   *   onfinish?: (job: object) => void,
   * }}
   */
  let { job = null, restartRequired = false, onupdate, onfinish } = $props();

  /** Smoothed bytes per second of the running job's current phase, or null while nothing moves. */
  let speed = $state(null);

  /** The failed job whose alert the owner closed. */
  let dismissedId = $state(null);

  /**
   * A job that just ended: success is said in a toast, a failure stays on the page as an alert.
   *
   * @param {any} ended
   */
  function finished(ended) {
    if (ended?.status === 'DONE') {
      void showSuccess(`pages.settings.backups.job.done-${String(ended.type).toLowerCase()}`, {
        website: websiteDisplayHost(),
      });
    }

    onfinish?.(ended);
  }

  const POLL_MS = 2000;
  /** Error answers in a row after which a restore is taken as done (its restart ended the session). */
  const RESTORE_ERROR_ANSWERS = 5;

  const running = $derived(isJobRunning(job));
  const jobId = $derived(job?.id);
  const percent = $derived(jobPercent(job));
  const hasBytes = $derived((Number(job?.bytesTotal) || 0) > 0);
  const speedText = $derived(formatSpeed(speed));
  const error = $derived(
    job?.status === 'FAILED'
      ? describeError(job, { context: job?.type === 'TRANSFER' ? 'transfer' : undefined })
      : null,
  );

  // Speed from successive polls of the job (the card is re-fed with every poll answer).
  /** @type {Array<{ at: number, bytes: number, phase: string | null }>} */
  let samples = [];
  let sampledJob = null;

  $effect(() => {
    if (!running || !job) {
      samples = [];
      sampledJob = null;
      speed = null;

      return;
    }

    if (sampledJob !== job.id) {
      samples = [];
      sampledJob = job.id;
    }

    const next = jobSpeed(samples, {
      at: Date.now(),
      bytes: /** @type {any} */ (job).bytesDone || 0,
      phase: /** @type {any} */ (job).phase ?? null,
    });

    samples = next.samples;
    speed = next.bytesPerSecond;
  });

  $effect(() => {
    if (!running) {
      return;
    }

    const id = jobId;
    let stopped = false;
    let errorAnswers = 0;
    let timer;

    const tick = async () => {
      // A restore restarts Pano: a failed read here is the restart, not an error — try again.
      const body = await ApiUtil.get({ path: '/panel/pano-backups/job' }).catch(() => null);

      if (stopped) {
        return;
      }

      const answered = !!body && typeof body === 'object';
      const next = answered && !body.error ? body.job : null;
      const sameJob = !!next && next.id === id;

      errorAnswers = answered && body.error ? errorAnswers + 1 : 0;

      // Pano answered but no longer knows the job: it restarted. After a restore that is the
      // success path (the new process has no job and, restored from another Pano, may not
      // accept this session any more — hence the repeated errors); any other job was cut off.
      const restarted =
        (answered && !body.error && !sameJob) ||
        (job?.type === 'RESTORE' && errorAnswers >= RESTORE_ERROR_ANSWERS);

      if (restarted) {
        const ended =
          job?.type === 'RESTORE'
            ? { ...job, status: 'DONE' }
            : { ...job, status: 'FAILED', error: job?.error || 'INTERNAL_ERROR' };

        onupdate?.(ended);
        finished(ended);

        return;
      }

      if (sameJob) {
        onupdate?.(next);

        if (!isJobRunning(next)) {
          finished(next);

          return;
        }
      }

      timer = setTimeout(tick, POLL_MS);
    };

    timer = setTimeout(tick, POLL_MS);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  });
</script>
