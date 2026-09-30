<!-- Transfer this Pano to a Pano Host instance of the connected account: pick it, push a plain archive, owner confirms. -->
<BsModal bind:this={modal}>
  <div class="modal-header">
    <h5 class="modal-title">{$_('pages.settings.backups.transfer.title')}</h5>
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label={$_('buttons.close')}
    ></button>
  </div>
  <div class="modal-body vstack gap-3">
    <ol class="small mb-0 vstack gap-1">
      <li>{$_('pages.settings.backups.transfer.step-pick')}</li>
      <li>{$_('pages.settings.backups.transfer.step-push')}</li>
      <li>
        {$_('pages.settings.backups.transfer.step-confirm', {
          values: { website: websiteDisplayHost() },
        })}
      </li>
    </ol>

    {#if workloadList === null}
      <div class="spinner-border spinner-border-sm text-body-secondary" role="status"></div>
    {:else if workloadsError}
      <div class="alert alert-danger small mb-0">
        {$_(workloadsError.key, { values: workloadsError.values })}
      </div>
    {:else if workloads.length === 0}
      <div class="small text-body-secondary">
        {$_('pages.settings.backups.transfer.no-workloads')}
        <a href={manageUrl} target="_blank" rel="noopener noreferrer">
          {$_('pages.settings.backups.transfer.get-instance', {
            values: { website: websiteDisplayHost() },
          })}
        </a>
      </div>
    {:else}
      <div>
        <label class="form-label small" for="pano-transfer-workload">
          {$_('pages.settings.backups.transfer.target')}
        </label>
        <select id="pano-transfer-workload" class="form-select" bind:value={workloadId}>
          {#each workloads as option (option.id)}
            <option value={String(option.id)}>{workloadLabel(option)}</option>
          {/each}
        </select>
        {#if selectedWorkload?.maxBytes}
          <div class="form-text">
            {$_('pages.settings.backups.transfer.max-size', {
              values: { size: formatBytes(selectedWorkload.maxBytes) },
            })}
          </div>
        {/if}
      </div>
    {/if}

    <div class="alert alert-info small mb-0">
      {$_('pages.settings.backups.transfer.plain-note')}
    </div>

    {#if error}
      <div class="alert alert-danger small mb-0">
        {$_(error.key, { values: error.values })}
      </div>
    {/if}
  </div>
  <div class="modal-footer">
    <button type="button" class="btn btn-link" data-bs-dismiss="modal">
      {$_('buttons.cancel')}
    </button>
    <button
      type="button"
      class="btn btn-primary"
      disabled={!selectedWorkload || disabled || starting}
      onclick={() => void start()}>
      {#if starting}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {:else}
        <i class="fa-solid fa-paper-plane me-1" aria-hidden="true"></i>
      {/if}
      {$_('pages.settings.backups.transfer.start')}
    </button>
  </div>
</BsModal>

<script>
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import ApiUtil from '$lib/api.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import { hostManageUrl } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  import BsModal from './BsModal.svelte';

  /**
   * `remote` = `GET /api/panel/pano-backups/remote`; `disabled` while another job runs;
   * `onstarted(job)` puts the transfer job on the page.
   *
   * @type {{ remote: any, disabled?: boolean, onstarted?: (job: any) => void }}
   */
  let { remote, disabled = false, onstarted } = $props();

  /** @type {BsModal | undefined} */
  let modal = $state();

  /** `GET …/remote/workloads`, read on open; `null` while loading. */
  /** @type {any} */
  let workloadList = $state(null);
  let workloadId = $state('');
  let starting = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let error = $state(null);

  const manageUrl = $derived(hostManageUrl(PANO_WEBSITE_URL, 'instances'));
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

  export function open() {
    error = null;
    workloadList = null;

    modal?.show();

    void ApiUtil.get({ path: '/api/panel/pano-backups/remote/workloads' })
      .catch(() => ({ error: 'NETWORK_ERROR' }))
      .then((body) => (workloadList = body || { error: 'NETWORK_ERROR' }));
  }

  async function start() {
    const target = selectedWorkload;

    if (!target) {
      return;
    }

    starting = true;
    error = null;

    try {
      const body = await ApiUtil.post({
        path: '/api/panel/pano-backups/remote/transfers',
        body: { workloadId: String(target.id) },
      }).catch(() => ({ error: 'NETWORK_ERROR' }));

      if (body?.error) {
        error = describeError(body);

        return;
      }

      modal?.hide();
      onstarted?.(body?.job ?? null);
    } finally {
      starting = false;
    }
  }
</script>
