<!-- The running / last Pano backup job. Polls `GET /api/panel/pano-backups/job` while it runs. -->
{#if job}
  <div class="card" aria-live="polite">
    <div class="card-body vstack gap-2">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        {#if running}
          <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
        {:else if job.status === 'DONE'}
          <i class="fa-solid fa-circle-check text-success" aria-hidden="true"></i>
        {:else}
          <i class="fa-solid fa-circle-xmark text-danger" aria-hidden="true"></i>
        {/if}
        <strong>{$_(`pages.settings.backups.job.type-${String(job.type).toLowerCase()}`)}</strong>
        <span
          class="badge text-bg-{running ? 'info' : job.status === 'DONE' ? 'success' : 'danger'}">
          {$_(`pages.settings.backups.job.status-${String(job.status).toLowerCase()}`)}
        </span>
        {#if running && job.phase}
          <span class="text-body-secondary small">
            {$_(`pages.settings.backups.job.phase-${String(job.phase).toLowerCase()}`)}
          </span>
        {/if}
        {#if job.startedAt}
          <span class="text-body-secondary small ms-auto">
            <DateComponent time={job.startedAt} relativeFormat />
          </span>
        {/if}
      </div>

      {#if running}
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
        {#if percent !== null}
          <div class="small text-body-secondary">
            {formatBytes(job.bytesDone || 0)} / {formatBytes(job.bytesTotal || 0)}
          </div>
        {/if}
        {#if job.type === 'RESTORE'}
          <div class="small text-warning">{$_('pages.settings.backups.job.restore-running')}</div>
        {/if}
      {:else if error}
        <div class="alert alert-danger mb-0 small">
          {$_(error.key, { values: error.values })}
          {#if job.rolledBack}
            <div class="mt-1">{$_('pages.settings.backups.job.rolled-back')}</div>
          {/if}
        </div>
      {:else if job.status === 'DONE' && job.type === 'TRANSFER'}
        <div class="small text-body-secondary">
          {$_('pages.settings.backups.job.transfer-done')}
        </div>
      {/if}

      {#if restartRequired}
        <div class="alert alert-warning mb-0 small">
          {$_('pages.settings.backups.job.restart-required')}
        </div>
      {/if}
    </div>
  </div>
{:else if restartRequired}
  <div class="alert alert-warning mb-0 small">
    {$_('pages.settings.backups.job.restart-required')}
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import { describeError, isJobRunning, jobPercent } from '$lib/pano-backup.util.js';

  import DateComponent from '$lib/components/Date.svelte';

  /**
   * @type {{
   *   job?: object | null,
   *   restartRequired?: boolean,
   *   onupdate?: (job: object) => void,
   *   onfinish?: (job: object) => void,
   * }}
   */
  let { job = null, restartRequired = false, onupdate, onfinish } = $props();

  const POLL_MS = 2000;
  /** Error answers in a row after which a restore is taken as done (its restart ended the session). */
  const RESTORE_ERROR_ANSWERS = 5;

  const running = $derived(isJobRunning(job));
  const jobId = $derived(job?.id);
  const percent = $derived(jobPercent(job));
  const error = $derived(job?.status === 'FAILED' ? describeError(job) : null);

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
      const body = await ApiUtil.get({ path: '/api/panel/pano-backups/job' }).catch(() => null);

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
        onfinish?.(ended);

        return;
      }

      if (sameJob) {
        onupdate?.(next);

        if (!isJobRunning(next)) {
          onfinish?.(next);

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
