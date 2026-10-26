<!-- Transfer this Pano to a Pano Host instance of the connected account: pick it, Pano Host e-mails a code, the code (second modal) confirms, then a plain archive is pushed and restored at once. -->
<BsModal
  bind:this={modal}
  onhidden={() => {
    stopEstimate();
    codeModal?.openIfPending();
  }}>
  <div class="modal-body text-center vstack gap-3">
    <div>
      <div class="pb-3">
        <i class="fas fa-right-left fa-3x d-block m-auto text-gray"></i>
      </div>
      <div class="text-capitalize">{$_('pages.settings.backups.transfer.title')}</div>
    </div>
    <div>{$_('pages.settings.backups.transfer.replace-note')}</div>

    {#if workloadList === null}
      <div class="spinner-border spinner-border-sm text-body-secondary mx-auto" role="status"></div>
    {:else if workloadsError}
      <div class="alert alert-danger mb-0 d-flex align-items-start">
        <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{$_(workloadsError.key, { values: workloadsError.values })}</div>
      </div>
    {:else if workloads.length === 0}
      <div>{$_('pages.settings.backups.transfer.no-workloads')}</div>
    {:else}
      <div class="text-start">
        <div class="form-floating">
          <select id="pano-transfer-workload" class="form-select" bind:value={workloadId}>
            {#each workloads as option (option.id)}
              <option value={String(option.id)}>{workloadLabel(option)}</option>
            {/each}
          </select>
          <label class="text-capitalize" for="pano-transfer-workload">
            {$_('pages.settings.backups.transfer.target')}
          </label>
        </div>
        {#if selectedWorkload?.maxBytes}
          <div class="mt-1 small text-body-secondary">
            {$_('pages.settings.backups.transfer.max-size', {
              values: { size: formatBytes(selectedWorkload.maxBytes) },
            })}
          </div>
        {/if}
        <!-- An estimate of this Pano's content; it never blocks the select or the button while unknown. -->
        {#if estimateBytes !== null}
          <div class="small text-body-secondary">
            {$_('pages.settings.backups.transfer.estimate', {
              values: { size: formatBytes(estimateBytes) },
            })}
          </div>
        {:else if estimating}
          <div class="small text-body-secondary">
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {$_('pages.settings.backups.transfer.estimating')}
          </div>
        {/if}
      </div>

      {#if tooBig}
        <div class="alert alert-danger mb-0 d-flex align-items-start text-start">
          <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
          <div>
            {$_('pages.settings.backups.errors.QUOTA_EXCEEDED_TRANSFER', {
              values: { max: formatBytes(selectedWorkload.maxBytes) },
            })}
          </div>
        </div>
      {/if}
    {/if}

    {#if error}
      <div class="alert alert-danger mb-0 d-flex align-items-start">
        <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{$_(error.key, { values: error.values })}</div>
      </div>
    {/if}
  </div>
  <div class="modal-footer flex-nowrap text-capitalize">
    <button
      type="button"
      class="btn btn-link text-decoration-none col-6 m-0"
      data-bs-dismiss="modal">
      {$_('buttons.cancel')}
    </button>
    <button
      type="button"
      class="btn btn-secondary text-capitalize col-6 m-0"
      disabled={!selectedWorkload || disabled || starting || tooBig}
      onclick={() => void start()}>
      {#if starting}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('pages.settings.backups.transfer.start')}
    </button>
  </div>
</BsModal>

<PanoTransferCodeModal bind:this={codeModal} {onstarted} />

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import { transferFits } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import BsModal from './BsModal.svelte';
  import PanoTransferCodeModal from './PanoTransferCodeModal.svelte';

  /**
   * `remote` = `GET /api/v1/panel/pano-backups/remote`; `disabled` while another job runs;
   * `onstarted(job)` puts the transfer job on the page (called by the code modal).
   *
   * @type {{ remote: any, disabled?: boolean, onstarted?: (job: any) => void }}
   */
  let { remote, disabled = false, onstarted } = $props();

  /** @type {BsModal | undefined} */
  let modal = $state();
  /** @type {PanoTransferCodeModal | undefined} */
  let codeModal = $state();

  /** `GET …/remote/workloads`, read on open; `null` while loading. */
  /** @type {any} */
  let workloadList = $state(null);
  let workloadId = $state('');
  let starting = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let error = $state(null);

  /** Bytes of the finished estimate, or null while it is unknown (calculating, failed, not asked yet). */
  /** @type {number | null} */
  let estimateBytes = $state(null);
  let estimating = $state(false);
  /** Bumped on every open and close, so a late answer of an earlier round is dropped. */
  let estimateRound = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let estimateTimer = null;

  const ESTIMATE_POLL_MS = 2000;

  const tooBig = $derived(
    !!selectedWorkload && transferFits(estimateBytes, selectedWorkload.maxBytes) === false,
  );
  const workloadsError = $derived(workloadList?.error ? describeError(workloadList) : null);
  const workloads = $derived(
    /** @type {any[]} */ (
      workloadList && !workloadList.error && Array.isArray(workloadList.workloads)
        ? workloadList.workloads
        : []
    ),
  );
  const selectedWorkload = $derived(
    workloads.find((option) => String(option.id) === workloadId) ?? workloads[0] ?? null,
  );

  // Picks the first workload until the owner chooses one (or when the chosen one is gone).
  $effect(() => {
    if (workloads.length > 0 && !workloads.some((option) => String(option.id) === workloadId)) {
      workloadId = String(workloads[0].id);
    }
  });

  /** @param {any} option */
  function workloadLabel(option) {
    const name = option.label || option.name || option.id;

    return option.label && option.name && option.label !== option.name
      ? `${option.label} (${option.name})`
      : name;
  }

  function stopEstimate() {
    estimateRound++;
    estimating = false;

    if (estimateTimer) {
      clearTimeout(estimateTimer);
      estimateTimer = null;
    }
  }

  /** Asks for the size of this Pano and asks again every couple of seconds while it is being calculated. */
  function pollEstimate() {
    const round = ++estimateRound;

    estimateBytes = null;
    estimating = true;

    const ask = async () => {
      const body = await ApiUtil.get({
        path: '/panel/pano-backups/remote/transfers/estimate',
      }).catch(() => null);

      if (round !== estimateRound) {
        return;
      }

      if (body?.status === 'DONE' && Number.isFinite(Number(body.bytes))) {
        estimateBytes = Number(body.bytes);
        estimating = false;
      } else if (body?.status === 'CALCULATING') {
        estimateTimer = setTimeout(() => void ask(), ESTIMATE_POLL_MS);
      } else {
        // Failed or unreachable: nothing is shown and nothing is blocked.
        estimating = false;
      }
    };

    void ask();
  }

  export function open() {
    error = null;
    workloadList = null;
    stopEstimate();
    pollEstimate();

    modal?.show();

    void ApiUtil.get({ path: '/panel/pano-backups/remote/workloads' })
      .catch(() => ({ error: { code: 'NETWORK_ERROR' } }))
      .then((body) => (workloadList = body || { error: { code: 'NETWORK_ERROR' } }));
  }

  /** Asks Pano Host to e-mail the code, then hands over to the code modal once this one is hidden. */
  async function start() {
    const target = selectedWorkload;

    if (!target) {
      return;
    }

    starting = true;
    error = null;

    try {
      const body = await ApiUtil.post({
        path: '/panel/pano-backups/remote/transfers/code',
        body: { workloadId: String(target.id) },
      }).catch(() => ({ error: { code: 'NETWORK_ERROR' } }));

      if (body?.error) {
        error = describeError(body);

        return;
      }

      codeModal?.prepare(String(target.id), body);
      modal?.hide();
    } finally {
      starting = false;
    }
  }
</script>
