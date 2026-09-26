<!-- Transfer this Pano to a Pano Host instance: TRANSFER link, push a plain archive, owner confirms. -->
<div class="vstack gap-3">
  <PanoBackupJobCard
    job={job?.type === 'TRANSFER' ? job : null}
    onupdate={(next) => (job = next)}
    onfinish={() => void refresh()} />

  <div class="row g-3">
    <div class="col-lg-7 vstack gap-3">
      <HostLinkCard
        purpose="TRANSFER"
        link={remote.links?.TRANSFER ?? null}
        pending={remote.pending?.TRANSFER ?? null}
        onchange={() => void refresh()} />

      {#if transferLinked}
        <div class="card">
          <div class="card-header d-flex align-items-center">
            <span>{$_('pages.settings.backups.transfer.history')}</span>
            <button
              type="button"
              class="btn btn-link btn-sm ms-auto"
              aria-label={$_('buttons.refresh')}
              onclick={() => void refresh()}>
              <i class="fa-solid fa-arrows-rotate" class:fa-spin={refreshing}></i>
            </button>
          </div>
          {#if listError}
            <div class="card-body">
              <div class="alert alert-danger small mb-0">
                {$_(listError.key, { values: listError.values })}
              </div>
            </div>
          {:else if transfers.length === 0}
            <NoContent
              icon="fa-solid fa-right-left fa-3x"
              text={$_('pages.settings.backups.transfer.none')} />
          {:else}
            <div class="table-responsive">
              <table class="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>{$_('pages.settings.backups.column-created')}</th>
                    <th>{$_('pages.settings.backups.column-status')}</th>
                    <th>{$_('pages.settings.backups.column-size')}</th>
                    <th class="text-end"></th>
                  </tr>
                </thead>
                <tbody>
                  {#each transfers as transfer (transfer.id)}
                    <tr>
                      <td><DateComponent time={transfer.createdAt} relativeFormat /></td>
                      <td>
                        <span class="badge text-bg-{transferColour(transfer.status)}">
                          {$_(
                            `pages.settings.backups.transfer.status-${String(transfer.status).toLowerCase()}`,
                          )}
                        </span>
                        {#if transfer.status === 'AWAITING_CONFIRMATION' && transfer.expiresAt}
                          <div class="small text-body-secondary">
                            {$_('pages.settings.backups.transfer.confirm-until')}
                            <DateComponent time={transfer.expiresAt} relativeFormat />
                          </div>
                        {/if}
                      </td>
                      <td>{formatBytes(transfer.sizeBytes || 0)}</td>
                      <td class="text-end">
                        {#if transfer.status === 'UPLOADING' || transfer.status === 'AWAITING_CONFIRMATION'}
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            disabled={cancelling === transfer.id}
                            onclick={() => void cancel(transfer)}>
                            {$_('buttons.cancel')}
                          </button>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="col-lg-5 vstack gap-3">
      <div class="card">
        <div class="card-header">{$_('pages.settings.backups.transfer.title')}</div>
        <div class="card-body vstack gap-3">
          <ol class="small mb-0 vstack gap-1">
            <li>{$_('pages.settings.backups.transfer.step-link')}</li>
            <li>{$_('pages.settings.backups.transfer.step-push')}</li>
            <li>{$_('pages.settings.backups.transfer.step-confirm')}</li>
          </ol>

          {#if workload}
            <div class="border rounded p-2 small">
              <div class="fw-semibold">{workload.label || workload.name || workload.id}</div>
              {#if workload.maxBytes}
                <div class="text-body-secondary">
                  {$_('pages.settings.backups.transfer.max-size', {
                    values: { size: formatBytes(workload.maxBytes) },
                  })}
                </div>
              {/if}
            </div>
          {/if}

          <div class="alert alert-info small mb-0">
            {$_('pages.settings.backups.transfer.plain-note')}
          </div>

          {#if openTransfer}
            <div class="alert alert-warning small mb-0">
              {$_('pages.settings.backups.transfer.awaiting')}
            </div>
          {/if}

          {#if startError}
            <div class="alert alert-danger small mb-0">
              {$_(startError.key, { values: startError.values })}
            </div>
          {/if}

          <div>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!transferLinked || running || starting}
              onclick={() => void startTransfer()}>
              {#if starting}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {:else}
                <i class="fa-solid fa-paper-plane me-1" aria-hidden="true"></i>
              {/if}
              {$_('pages.settings.backups.transfer.start')}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script module>
  import ApiUtil from '$lib/api.util.js';

  /**
   * @param {string} path
   * @param {import('@sveltejs/kit').LoadEvent} [event]
   */
  async function read(path, event) {
    return ApiUtil.get({ path, request: event }).catch(() => null);
  }

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load(event) {
    await event.parent();

    const remote = await read('/api/panel/pano-backups/remote', event);
    const transferList = remote?.links?.TRANSFER
      ? await read('/api/panel/pano-backups/remote/transfers', event)
      : null;

    return { remote, transferList };
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { formatBytes } from '$lib/string.util.js';
  import {
    describeError,
    isJobRunning,
    isTransferOpen,
    transferColour,
  } from '$lib/pano-backup.util.js';

  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import HostLinkCard from '$lib/components/settings/pano-backup/HostLinkCard.svelte';
  import PanoBackupJobCard from '$lib/components/settings/pano-backup/PanoBackupJobCard.svelte';

  let { data } = $props();

  /** A pending transfer is re-read this often, so the owner's confirmation shows up here. */
  const OPEN_POLL_MS = 10_000;

  let remote = $derived(
    /** @type {any} */ (data?.remote && !data.remote.error ? data.remote : { links: {} }),
  );
  let transferList = $derived(/** @type {any} */ (data?.transferList ?? null));
  let job = $derived(/** @type {any} */ (data?.remote?.job ?? null));

  let refreshing = $state(false);
  let starting = $state(false);
  /** @type {string | null} */
  let cancelling = $state(null);
  /** @type {ReturnType<typeof describeError>} */
  let startError = $state(null);

  const transferLinked = $derived(!!remote?.links?.TRANSFER);
  const running = $derived(isJobRunning(job));
  const listError = $derived(transferList?.error ? describeError(transferList) : null);
  const transfers = $derived(
    /** @type {any[]} */ (
      transferList && !transferList.error && Array.isArray(transferList.transfers)
        ? transferList.transfers
        : []
    ),
  );
  const workload = $derived(transferList && !transferList.error ? transferList.workload : null);
  const openTransfer = $derived(transfers.find((transfer) => isTransferOpen(transfer.status)));

  $effect(() => {
    if (!openTransfer || running) {
      return;
    }

    const timer = setInterval(() => void refresh(), OPEN_POLL_MS);

    return () => clearInterval(timer);
  });

  async function refresh() {
    refreshing = true;

    try {
      const next = await read('/api/panel/pano-backups/remote');

      if (next && !next.error) {
        remote = next;
        job = next.job ?? job;
        transferList = next.links?.TRANSFER
          ? await read('/api/panel/pano-backups/remote/transfers')
          : null;
      }
    } finally {
      refreshing = false;
    }
  }

  async function startTransfer() {
    starting = true;
    startError = null;

    try {
      const body = await ApiUtil.post({ path: '/api/panel/pano-backups/remote/transfers' }).catch(
        () => ({ error: 'NETWORK_ERROR' }),
      );

      if (body?.error) {
        startError = describeError(body);

        return;
      }

      job = body?.job ?? job;
    } finally {
      starting = false;
    }
  }

  /** @param {any} transfer */
  async function cancel(transfer) {
    cancelling = transfer.id;

    try {
      const body = await ApiUtil.delete({
        path: `/api/panel/pano-backups/remote/transfers/${encodeURIComponent(transfer.id)}`,
      }).catch(() => ({ error: 'NETWORK_ERROR' }));

      if (body?.error) {
        startError = describeError(body);
      }

      await refresh();
    } finally {
      cancelling = null;
    }
  }
</script>
