<!-- Second step of the transfer: the code Pano Host e-mailed to the account owner confirms it. -->
<BsModal bind:this={modal} onhidden={() => (ticker = stopTicker(ticker))}>
  <form onsubmit={confirm}>
    <div class="modal-body text-center">
      <div class="pb-3">
        <i class="fa-solid fa-envelope-open-text fa-3x d-block m-auto"></i>
      </div>
      <h5 class="mb-2">{$_('pages.settings.backups.transfer.code-title')}</h5>
      <div class="text-body-secondary">
        {$_('pages.settings.backups.transfer.code-sent', { values: { email: info?.email ?? '' } })}
      </div>

      <div class="text-start mt-3">
        <input
          id="pano-transfer-code"
          class="form-control form-control-lg text-center font-monospace"
          class:is-invalid={error?.code === 'TRANSFER_CODE_INVALID'}
          type="text"
          inputmode="numeric"
          maxlength={CODE_LENGTH}
          autocomplete="one-time-code"
          placeholder="000000"
          aria-label={$_('pages.settings.backups.transfer.code-label')}
          title={$_('pages.settings.backups.transfer.code-label')}
          bind:this={input}
          bind:value={code}
          oninput={() => (code = code.replace(/\D/g, '').slice(0, CODE_LENGTH))} />

        {#if error}
          <div class="alert alert-danger mt-3 mb-0 d-flex align-items-start">
            <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>{$_(error.key, { values: error.values })}</div>
          </div>
        {/if}

        {#if waitSeconds === 0}
          <div class="text-center mt-2">
            <button
              type="button"
              class="btn btn-link text-decoration-none"
              disabled={busy}
              onclick={() => void resend()}>
              {$_('pages.settings.backups.transfer.code-resend')}
            </button>
          </div>
        {/if}
      </div>
    </div>
    <div class="modal-footer flex-nowrap text-capitalize">
      <button
        type="button"
        class="btn btn-link text-decoration-none col-6 m-0"
        disabled={busy}
        data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button
        type="submit"
        class="btn btn-primary col-6 m-0"
        disabled={busy || code.length !== CODE_LENGTH}>
        {#if busy}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('pages.settings.backups.transfer.start')}
      </button>
    </div>
  </form>
</BsModal>

<script>
  import { onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { resendWaitSeconds } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import BsModal from './BsModal.svelte';

  const CODE_LENGTH = 6;

  /** @type {{ onstarted?: (job: any) => void }} */
  let { onstarted } = $props();

  /** @type {BsModal | undefined} */
  let modal = $state();
  /** @type {HTMLInputElement | undefined} */
  let input = $state();

  /** `{email, expiresAt, resendAfter}` of the code that was sent. */
  /** @type {any} */
  let info = $state(null);
  let workloadId = '';
  let pending = false;
  let code = $state('');
  let busy = $state(false);
  let waitSeconds = $state(0);
  /** @type {ReturnType<typeof describeError>} */
  let error = $state(null);
  /** @type {ReturnType<typeof setInterval> | null} */
  let ticker = null;

  onDestroy(() => (ticker = stopTicker(ticker)));

  /** @param {ReturnType<typeof setInterval> | null} timer */
  function stopTicker(timer) {
    if (timer) {
      clearInterval(timer);
    }

    return null;
  }

  /**
   * @param {string} id the chosen Pano Host instance.
   * @param {any} sent the answer of `POST …/transfers/code`.
   */
  export function prepare(id, sent) {
    workloadId = id;
    pending = true;
    code = '';
    error = null;

    track(sent);
  }

  /** Opens the modal when a code was requested (called once the instance modal is hidden). */
  export function openIfPending() {
    if (!pending) {
      return;
    }

    pending = false;
    modal?.show();
    setTimeout(() => input?.focus(), 300);
  }

  /** @param {any} sent */
  function track(sent) {
    info = sent;
    ticker = stopTicker(ticker);

    const update = () => (waitSeconds = resendWaitSeconds(info?.resendAfter, Date.now()));

    update();
    ticker = setInterval(update, 1000);
  }

  async function resend() {
    busy = true;
    error = null;

    try {
      const body = await ApiUtil.post({
        path: '/panel/pano-backups/remote/transfers/code',
        body: { workloadId },
      }).catch(() => ({ error: { code: 'NETWORK_ERROR' } }));

      if (body?.error) {
        error = describeError(body);

        return;
      }

      code = '';
      track(body);
    } finally {
      busy = false;
    }
  }

  /** @param {Event} event */
  async function confirm(event) {
    event.preventDefault();

    if (busy || code.length !== CODE_LENGTH) {
      return;
    }

    busy = true;
    error = null;

    try {
      const body = await ApiUtil.post({
        path: '/panel/pano-backups/remote/transfers',
        body: { workloadId, code },
      }).catch(() => ({ error: { code: 'NETWORK_ERROR' } }));

      if (body?.error) {
        error = describeError(body, { context: 'transfer' });

        return;
      }

      modal?.hide();
      onstarted?.(body?.job ?? null);
    } finally {
      busy = false;
    }
  }
</script>
