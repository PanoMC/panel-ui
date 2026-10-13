<!--
  A running Pano restore locks the panel: this dialog shows its progress on every page, cannot be
  closed and refuses navigation until the restore is done and the restarted Pano answers again
  (then the page reloads). A failed restore is said here and unlocks with "Close".
  Fed by the `restoreJob` store (the backups page sets it when it starts a restore; a restore that
  was already running when the panel loaded is picked up here).
-->
<style>
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .spin {
    animation: spin 2s linear infinite;
  }
</style>

{#if job}
  <div
    class="modal show"
    style="display: block; z-index: 1070;"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="restoreProgressTitle"
    data-testid="restore-progress-modal">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content text-center shadow-lg border-0" style="border-radius: 1.5rem;">
        <div class="modal-body p-5 vstack gap-3">
          <div>
            {#if stage === 'failed'}
              <i class="fas fa-circle-xmark fa-3x text-danger" aria-hidden="true"></i>
            {:else}
              <i class="fas fa-arrows-rotate fa-3x text-primary spin" aria-hidden="true"></i>
            {/if}
          </div>

          {#if stage === 'failed'}
            <h4 class="mb-0 fw-bold" id="restoreProgressTitle">
              {$_('pages.settings.backups.restore-lock.failed-title')}
            </h4>
            <div class="text-start alert alert-danger mb-0" role="alert">
              {#if error}{$_(error.key, { values: error.values })}{/if}
              {#if job.rolledBack}
                <div class="mt-1">{$_('pages.settings.backups.job.rolled-back')}</div>
              {/if}
            </div>
            <button type="button" class="btn btn-secondary w-100" onclick={close}>
              {$_('buttons.close')}
            </button>
          {:else}
            <h4 class="mb-0 fw-bold" id="restoreProgressTitle">
              {$_('pages.settings.backups.restore-lock.title')}
            </h4>
            <p class="mb-0" aria-live="polite">
              {#if stage === 'restarting'}
                {$_('pages.settings.backups.restore-lock.restarting')}
              {:else}
                {$_(
                  `pages.settings.backups.job.phase-${String(job.phase || 'restoring').toLowerCase()}`,
                )}
              {/if}
            </p>

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
            {#if stage === 'running' && (hasBytes || speedText)}
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

            <p class="small text-body-secondary mb-0">
              {$_(
                stage === 'restarting'
                  ? 'pages.settings.backups.restore-lock.restarting-hint'
                  : 'pages.settings.backups.restore-lock.description',
              )}
            </p>
            {#if leaveWarning}
              <div
                class="alert alert-warning text-start mb-0"
                role="alert"
                data-testid="restore-leave-warning">
                <i class="fa-solid fa-triangle-exclamation me-2" aria-hidden="true"></i>
                {$_('pages.settings.backups.restore-lock.leave-warning')}
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="modal-backdrop fade show" style="z-index: 1060;"></div>
{/if}

<svelte:window onbeforeunload={onBeforeUnload} />

<script>
  import { _ } from 'svelte-i18n';
  import { beforeNavigate } from '$app/navigation';

  import ApiUtil from '$lib/api.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import { formatSpeed, jobPercent, jobSpeed, waitForRestart } from '$lib/pano-backup.util.js';
  import { describeBackupError } from '$lib/pano-backup-error.js';
  import { isRunningRestore, restoreJob } from '$lib/pano-restore.store.js';

  /** @type {{ signedIn?: boolean }} */
  let { signedIn = false } = $props();

  const POLL_MS = 2000;
  /** Error answers in a row after which the restore is taken as done (its restart ended the session). */
  const ERROR_ANSWERS = 5;

  const job = $derived($restoreJob);
  const jobId = $derived(job?.id);

  /** @type {'running' | 'restarting' | 'failed'} */
  let stage = $state('running');
  /** Shown after a refused attempt to leave the page. */
  let leaveWarning = $state(false);
  /** Smoothed bytes per second of the current step, or null while nothing moves. */
  let speed = $state(null);

  const locked = $derived(!!job && stage !== 'failed');
  const percent = $derived(stage === 'running' ? jobPercent(job) : null);
  const hasBytes = $derived((Number(job?.bytesTotal) || 0) > 0);
  const speedText = $derived(formatSpeed(speed));
  const error = $derived(stage === 'failed' && job ? describeBackupError(job) : null);

  /** Our own reload at the end must not be refused or asked about. */
  let reloading = false;

  beforeNavigate((navigation) => {
    if (!locked || reloading) {
      return;
    }

    // In-app navigation is refused; for a tab close / outside link this makes the browser ask.
    navigation.cancel();
    leaveWarning = true;
  });

  /** @param {BeforeUnloadEvent} event */
  function onBeforeUnload(event) {
    if (locked && !reloading) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  function reload() {
    reloading = true;
    window.location.reload();
  }

  function close() {
    restoreJob.set(null);
    reload();
  }

  // A restore that was already running when the panel loaded (another tab, a reload).
  let checked = false;

  $effect(() => {
    if (!signedIn || checked) {
      return;
    }

    checked = true;

    ApiUtil.get({ path: '/panel/pano-backups/job' })
      .then((body) => {
        if (isRunningRestore(body?.job) && !$restoreJob) {
          restoreJob.set(body.job);
        }
      })
      .catch(() => {});
  });

  // Speed from successive polls.
  /** @type {Array<{ at: number, bytes: number, phase: string | null }>} */
  let samples = [];

  $effect(() => {
    if (!job || stage !== 'running') {
      samples = [];
      speed = null;

      return;
    }

    const next = jobSpeed(samples, {
      at: Date.now(),
      bytes: job.bytesDone || 0,
      phase: job.phase ?? null,
    });

    samples = next.samples;
    speed = next.bytesPerSecond;
  });

  // A new restore starts unlocked-state fresh.
  $effect(() => {
    if (jobId) {
      stage = 'running';
      leaveWarning = false;
    }
  });

  $effect(() => {
    const id = jobId;

    if (!id) {
      return;
    }

    let stopped = false;
    let errorAnswers = 0;
    let sawDown = false;
    let timer;

    /** The restore is applied: wait until the restarted Pano answers, then start over. */
    const finish = async () => {
      stage = 'restarting';

      if (!sawDown) {
        await waitForRestart({
          probe: () =>
            ApiUtil.get({ path: '/panel/basicData' }).then(
              (body) => !!body && typeof body === 'object',
            ),
        });
      }

      if (!stopped) {
        reload();
      }
    };

    const tick = async () => {
      // The restore restarts Pano: a failed read is that restart, not an error — try again.
      const body = await ApiUtil.get({ path: '/panel/pano-backups/job' }).catch(() => null);

      if (stopped) {
        return;
      }

      const answered = !!body && typeof body === 'object';
      const next = answered && !body.error ? body.job : null;
      const sameJob = !!next && next.id === id;

      if (!answered) {
        sawDown = true;
      }

      errorAnswers = answered && body.error ? errorAnswers + 1 : 0;

      if (sameJob && next.status === 'FAILED') {
        restoreJob.set(next);
        stage = 'failed';

        return;
      }

      // Pano answers but no longer knows the job (it restarted), the job ended, or the restored
      // Pano no longer accepts this session (repeated errors): the restore is applied.
      if (
        (sameJob && next.status === 'DONE') ||
        (answered && !body.error && !sameJob) ||
        errorAnswers >= ERROR_ANSWERS
      ) {
        void finish();

        return;
      }

      if (sameJob) {
        restoreJob.set(next);
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
