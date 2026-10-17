<!-- Pano backups on one page: local backups, Pano Backup (panomc.com) and the transfer to Pano Host; settings, passphrase and transfer open in modals. -->
<div class="container vstack gap-3">
  <PageActions rightClasses="ms-lg-auto">
    <div slot="right" class="hstack gap-2 flex-wrap justify-content-center">
      <button
        type="button"
        class="btn btn-link"
        disabled={running}
        title={$_('pages.settings.backups.restore-from-file')}
        aria-label={$_('pages.settings.backups.restore-from-file')}
        onclick={() => restoreModal?.open({ source: 'file' })}>
        <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-link"
        title={$_('buttons.settings')}
        aria-label={$_('buttons.settings')}
        onclick={() => settingsModal?.open()}>
        <i class="fa-solid fa-gear" aria-hidden="true"></i>
      </button>
      <button type="button" class="btn btn-secondary" disabled={running} onclick={openCreate}>
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
        <span class="d-lg-inline d-none ms-2">{$_('pages.settings.backups.create-short')}</span>
      </button>
    </div>
  </PageActions>

  <!-- A running restore is shown by the panel-wide lock dialog (`RestoreProgressModal`), not here. -->
  <PanoBackupJobCard
    job={restoring ? null : job}
    onupdate={(next) => (job = next)}
    onfinish={(finished) => void onJobFinished(finished)} />

  <!-- Local backups -->
  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.settings.backups.local-count', { values: { count: filteredLocal.length } })}
      </div>
      <CardFilters slot="right" clazz="btn-group col-sm-auto col text-capitalize">
        <CardFiltersItem button active={localTag === 'ALL'} onclick={() => setLocalTag('ALL')}>
          {$_('buttons.all')}
        </CardFiltersItem>
        {#each LOCAL_TAGS as tag}
          <CardFiltersItem button active={localTag === tag} onclick={() => setLocalTag(tag)}>
            {$_(`pages.settings.backups.tag-${tag.toLowerCase()}`)}
          </CardFiltersItem>
        {/each}
      </CardFilters>
    </CardHeader>
    {#if filteredLocal.length === 0}
      <NoContent />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th scope="col"></th>
              <th>{$_('pages.settings.backups.column-created')}</th>
              <th>{$_('pages.settings.backups.column-type')}</th>
              <th>{$_('pages.settings.backups.column-trigger')}</th>
              <th>{$_('pages.settings.backups.column-size')}</th>
              <th class="d-none d-md-table-cell">{$_('pages.settings.backups.column-version')}</th>
            </tr>
          </thead>
          <tbody>
            {#each pagedLocal as backup (backup.id)}
              <tr class:table-active={selectedId === backup.id}>
                <th scope="row" class="align-middle text-center">
                  <div class="dropdown position-static">
                    <button
                      type="button"
                      class="btn btn-link"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label={$_('pages.settings.backups.column-actions')}>
                      <span class="fas fa-ellipsis-v"></span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-start text-capitalize">
                      <a
                        class="dropdown-item text-capitalize"
                        href="/api/v1/panel/pano-backups/{encodeURIComponent(backup.id)}/download"
                        download="pano-backup-{backup.id}.panoarc">
                        <i class="fa-solid fa-download me-2" aria-hidden="true"></i>
                        {$_('buttons.download')}
                      </a>
                      <button
                        type="button"
                        class="dropdown-item text-capitalize"
                        disabled={running}
                        onclick={() => askRestoreLocal(backup)}>
                        <i class="fa-solid fa-clock-rotate-left me-2" aria-hidden="true"></i>
                        {$_('pages.settings.backups.restore.submit')}
                      </button>
                      <button
                        type="button"
                        class="dropdown-item text-danger text-capitalize"
                        onclick={() => askDelete('local', backup)}>
                        <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                        {$_('buttons.delete')}
                      </button>
                    </div>
                  </div>
                </th>
                <td>
                  <DateComponent time={backup.createdAt} relativeFormat />
                  {#if backup.createdBy}
                    <div class="small text-body-secondary">{backup.createdBy}</div>
                  {/if}
                </td>
                <td>
                  <span class="badge text-capitalize text-bg-{tagColour(backup.tag)}">
                    {$_(`pages.settings.backups.tag-${String(backup.tag).toLowerCase()}`)}
                  </span>
                  {#if backup.encrypted}
                    <i
                      class="fa-solid fa-lock ms-1 text-body-secondary"
                      title={$_('pages.settings.backups.encrypted')}
                      aria-label={$_('pages.settings.backups.encrypted')}></i>
                  {/if}
                </td>
                <td class="text-nowrap">
                  {$_(
                    backup.tag === 'MANUAL'
                      ? 'pages.settings.backups.tag-manual'
                      : backup.tag === 'SCHEDULED'
                        ? 'pages.settings.backups.tag-scheduled'
                        : 'pages.settings.backups.trigger-automatic',
                  )}
                </td>
                <td>{formatBytes(backup.sizeBytes || 0)}</td>
                <td class="d-none d-md-table-cell small">{backup.panoVersion || '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="card-footer">
        <Pagination
          page={pageOf(localPage, filteredLocal.length, LOCAL_PAGE_SIZE)}
          on:firstPageClick={() => (localPage = 1)}
          on:lastPageClick={() => (localPage = localLastPage)}
          on:pageLinkClick={(event) => (localPage = event.detail.page)} />
      </div>
    {/if}
  </div>

  <!-- Pano Backup: the account, its plan and storage, then this Pano's backups -->
  <div class="card">
    <CardHeader showRight={connected && !hostUnavailable}>
      <div slot="left">
        {$_('pages.settings.backups.remote-count', {
          values: { count: Number(remoteList?.page?.totalItems) || 0 },
        })}
      </div>
      <!-- Nothing to act on while panomc.com cannot be reached. -->
      <div slot="right" class="d-flex align-items-center gap-2">
        {#if backupMode === 'FULL'}
          <button
            type="button"
            class="btn btn-sm btn-link"
            title={$_('pages.settings.backups.passphrase-title')}
            aria-label={$_('pages.settings.backups.passphrase-title')}
            onclick={() => passphraseModal?.open()}>
            <i
              class="fa-solid {remote.passphraseSet ? 'fa-lock' : 'fa-lock-open'}"
              aria-hidden="true"></i>
          </button>
        {/if}
        <button
          type="button"
          class="btn btn-sm btn-link"
          disabled={running}
          title={$_('pages.settings.backups.transfer.title')}
          aria-label={$_('pages.settings.backups.transfer.title')}
          onclick={() => transferModal?.open()}>
          <i class="fa-solid fa-right-left" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-secondary text-capitalize"
          disabled={running || busyAction === 'upload'}
          onclick={() => uploadModal?.show()}>
          <i class="fa-solid fa-cloud-arrow-up me-1" aria-hidden="true"></i>
          {$_('pages.settings.backups.upload-now')}
        </button>
      </div>
    </CardHeader>

    <PanoBackupAccountSummary {remote} />

    <!-- When panomc.com cannot be reached the summary above already says so; the list would only
         repeat it. -->
    {#if connected && !hostUnavailable}
      <div class="border-top"></div>
      {#if remoteError}
        <div class="card-body">
          <div class="alert alert-danger mb-0 d-flex align-items-start">
            <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>{$_(remoteError.key, { values: remoteError.values })}</div>
          </div>
        </div>
      {:else if remoteLoading}
        <div class="card-body d-flex justify-content-center py-5">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else if remoteRows.length === 0}
        <NoContent />
      {:else}
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th scope="col"></th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.settings.backups.column-created')}
                </th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.settings.backups.column-type')}
                </th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.settings.backups.column-trigger')}
                </th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.settings.backups.column-size')}
                </th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.settings.backups.column-stored')}
                </th>
                {#if showRemoteStatus}
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.settings.backups.column-status')}
                  </th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each remoteRows as backup (backup.id)}
                <tr>
                  <th scope="row" class="align-middle text-center">
                    {#if canDownloadRow(backup) || canRestoreRow(backup) || canDeleteRow(backup)}
                      <div class="dropdown position-static">
                        <button
                          type="button"
                          class="btn btn-link"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title={$_('pages.settings.backups.column-actions')}
                          aria-label={$_('pages.settings.backups.column-actions')}>
                          <span class="fas fa-ellipsis-v"></span>
                        </button>
                        <div class="dropdown-menu dropdown-menu-start">
                          {#if canDownloadRow(backup)}
                            <button
                              type="button"
                              class="dropdown-item text-capitalize"
                              disabled={running}
                              onclick={() => void downloadSnapshot(backup)}>
                              <i class="fa-solid fa-download me-2" aria-hidden="true"></i>
                              {$_('buttons.download')}
                            </button>
                          {/if}
                          {#if canRestoreRow(backup)}
                            <button
                              type="button"
                              class="dropdown-item text-capitalize"
                              disabled={running}
                              onclick={() => askRestoreRemote(backup)}>
                              <i class="fa-solid fa-clock-rotate-left me-2" aria-hidden="true"></i>
                              {$_('pages.settings.backups.restore.submit')}
                            </button>
                          {/if}
                          {#if canDeleteRow(backup)}
                            <button
                              type="button"
                              class="dropdown-item link-danger text-capitalize"
                              onclick={() =>
                                askDelete(
                                  backup.type === 'snapshot' ? 'snapshot' : 'remote',
                                  backup,
                                )}>
                              <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                              {$_('buttons.delete')}
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/if}
                  </th>
                  <td class="align-middle">
                    <DateComponent time={backup.createdAt} relativeFormat />
                  </td>
                  <td class="align-middle">
                    <span
                      class="badge text-capitalize text-bg-{backup.type === 'snapshot'
                        ? 'info'
                        : 'secondary'}">
                      {backup.type === 'snapshot'
                        ? $_('pages.settings.backups.type-snapshot')
                        : backup.kind === 'mc-server'
                          ? $_('pages.settings.backups.kind-mc-server')
                          : $_('pages.settings.backups.type-full')}
                    </span>
                    {#if backup.subject}
                      <div class="small text-body-secondary">{backup.subject}</div>
                    {/if}
                  </td>
                  <td class="align-middle text-nowrap">
                    {#if backup.trigger === 'SCHEDULED' || backup.trigger === 'MANUAL'}
                      {$_(`pages.settings.backups.tag-${backup.trigger.toLowerCase()}`)}
                    {:else}
                      <span class="text-body-secondary">—</span>
                    {/if}
                  </td>
                  <td class="align-middle">
                    {#if backup.type !== 'snapshot'}
                      {formatBytes(backup.sizeBytes || 0)}
                    {:else if backup.status === 'DONE'}
                      <div>{formatSnapshotBytes(backup.downloadBytes)}</div>
                      {#if backup.logicalBytes}
                        <div class="small text-body-secondary">
                          {$_('pages.settings.backups.snapshot.unpacked', {
                            values: { size: formatSnapshotBytes(backup.logicalBytes) },
                          })}
                        </div>
                      {/if}
                    {/if}
                  </td>
                  <td class="align-middle">
                    {#if backup.type !== 'snapshot'}
                      {formatBytes(backup.sizeBytes || 0)}
                    {:else if backup.status === 'DONE'}
                      {formatSnapshotBytes(backup.storedBytes ?? backup.uniqueBytes)}
                    {/if}
                  </td>
                  {#if showRemoteStatus}
                    <td class="align-middle">
                      {#if backup.status !== 'DONE'}
                        <span
                          class="badge text-capitalize text-bg-{backup.status === 'FAILED'
                            ? 'danger'
                            : 'secondary'}">
                          {$_(
                            `pages.settings.backups.remote-status-${String(backup.status).toLowerCase()}`,
                          )}
                        </span>
                      {/if}
                      {#if snapshotProblem(backup)}
                        {@const problem = snapshotProblem(backup)}
                        <div class="small text-danger">
                          {$_(problem.key, { values: problem.values })}
                          {#if problem.storageFull}
                            <a href={planUrl}>{$_('pages.settings.backups.account.manage-plan')}</a>
                          {/if}
                        </div>
                      {/if}
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if Number(remoteList?.page?.totalItems) > 0}
          <div class="card-footer">
            <Pagination
              page={remoteList.page}
              on:firstPageClick={() => void goToRemotePage(1)}
              on:lastPageClick={() => void goToRemotePage(pageCount(remoteList.page))}
              on:pageLinkClick={(event) => void goToRemotePage(event.detail.page)} />
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</div>

<PanoBackupSettingsModal
  bind:this={settingsModal}
  {local}
  {remote}
  onsaved={() => void refresh()} />

<PanoBackupPassphraseModal
  bind:this={passphraseModal}
  passphraseSet={remote.passphraseSet}
  onsaved={() => (remote = { ...remote, passphraseSet: true })} />

<PanoTransferModal
  bind:this={transferModal}
  {remote}
  disabled={running}
  onstarted={(next) => {
    if (next) job = next;
    void refresh();
  }} />

<!-- Create a local backup, optionally passphrase-encrypted. -->
<BsModal
  bind:this={createModal}
  onshown={() => document.querySelector('.modal.show input[type=password]')?.focus()}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void createBackup();
    }}>
    <div class="modal-body text-center vstack gap-3">
      <div>
        <div class="pb-3">
          <i class="fas fa-box-archive fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="text-capitalize">{$_('pages.settings.backups.create')}</div>
      </div>
      <div>{$_('pages.settings.backups.create-description')}</div>
      <div class="form-check form-switch text-start">
        <input
          id="pano-backup-encrypt"
          class="form-check-input"
          type="checkbox"
          role="switch"
          bind:checked={createEncrypt} />
        <label class="form-check-label text-capitalize" for="pano-backup-encrypt">
          {$_('pages.settings.backups.encrypt')}
        </label>
      </div>
      {#if createEncrypt}
        <PassphraseFields bind:passphrase={createPassphrase} bind:valid={createPassphraseValid} />
      {:else}
        <div>{$_('pages.settings.backups.plain-hint')}</div>
      {/if}
      {#if createError}
        <div class="alert alert-danger mb-0 d-flex align-items-start">
          <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
          <div>{$_(createError.key, { values: createError.values })}</div>
        </div>
      {/if}
    </div>
    <div class="modal-footer text-capitalize">
      <button
        type="submit"
        class="btn btn-secondary w-100"
        disabled={busyAction === 'create' || (createEncrypt && !createPassphraseValid)}>
        {#if busyAction === 'create'}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('buttons.create')}
      </button>
    </div>
  </form>
</BsModal>

<!-- Confirms a manual backup to Pano Backup: says whether it goes up encrypted or plain. -->
<BsModal bind:this={uploadModal}>
  <div class="modal-body text-center">
    <div class="pb-3">
      <i class="fa-solid fa-cloud-arrow-up fa-3x d-block m-auto"></i>
    </div>
    <h5 class="mb-2">{$_('pages.settings.backups.upload-confirm.title')}</h5>
    <div class="text-body-secondary">
      {$_('pages.settings.backups.upload-confirm.description')}
      {#if backupMode === 'SNAPSHOT'}
        {$_('pages.settings.backups.snapshot.upload-note')}
      {:else}
        {remote.passphraseSet
          ? $_('pages.settings.backups.upload-confirm.encrypted')
          : $_('pages.settings.backups.upload-confirm.plain')}
      {/if}
    </div>
  </div>
  <div class="modal-footer flex-nowrap">
    <button
      type="button"
      class="btn btn-link text-decoration-none col-6 m-0"
      data-bs-dismiss="modal">
      {$_('buttons.cancel')}
    </button>
    <button
      type="button"
      class="btn btn-primary col-6 m-0"
      disabled={running || busyAction === 'upload'}
      onclick={() => void uploadToPanoBackup()}>
      {#if busyAction === 'upload'}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('pages.settings.backups.upload-confirm.confirm')}
    </button>
  </div>
</BsModal>

<BsModal bind:this={deleteModal} onhidden={() => (selectedId = null)}>
  <div class="modal-body text-center">
    <div class="pb-3">
      <i class="fa-solid fa-trash fa-3x d-block m-auto"></i>
    </div>
    <h5 class="mb-2">{$_('pages.settings.backups.delete-title')}</h5>
    <div class="text-body-secondary">
      {deleteTarget?.kind === 'snapshot'
        ? $_('pages.settings.backups.delete-snapshot-description')
        : deleteTarget?.kind === 'remote'
          ? $_('pages.settings.backups.delete-remote-description')
          : $_('pages.settings.backups.delete-local-description')}
    </div>
  </div>
  <div class="modal-footer flex-nowrap">
    <button
      type="button"
      class="btn btn-link text-decoration-none col-6 m-0"
      data-bs-dismiss="modal">
      {$_('buttons.cancel')}
    </button>
    <button
      type="button"
      class="btn btn-danger text-capitalize col-6 m-0"
      disabled={busyAction === 'delete'}
      onclick={() => void confirmDelete()}>
      {#if busyAction === 'delete'}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('buttons.delete')}
    </button>
  </div>
</BsModal>

<RestorePanoBackupModal bind:this={restoreModal} onsubmit={submitRestore} />

<script module>
  import { redirect } from '@sveltejs/kit';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { connectionState } from '$lib/pano-backup.util.js';

  /**
   * @param {string} path
   * @param {import('@sveltejs/kit').LoadEvent} event
   */
  async function read(path, event) {
    return ApiUtil.get({ path, request: event }).catch(() => null);
  }

  /** Rows of the Pano Backup list per page; the server cuts the pages. */
  const REMOTE_PAGE_SIZE = 10;

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load(event) {
    const { user } = await event.parent();

    if (!hasPermission(Permissions.MANAGE_PANO_BACKUPS, user)) {
      throw redirect(302, base);
    }

    const [local, remote] = await Promise.all([
      read('/panel/pano-backups', event),
      // Back from picking a plan on the website: the cached plan is stale, ask panomc.com again.
      read(
        event.url.searchParams.has('planUpdated')
          ? '/panel/pano-backups/remote?fresh=true'
          : '/panel/pano-backups/remote',
        event,
      ),
    ]);

    const remoteList =
      connectionState(remote) !== 'not-connected'
        ? await read(`/panel/pano-backups/remote/list?pageSize=${REMOTE_PAGE_SIZE}`, event)
        : null;

    return { local, remote, remoteList };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '@panomc/sdk/core/js/appStores.js';
  import { _ } from 'svelte-i18n';

  import { formatBytes } from '$lib/string.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';
  import {
    backupPlanUrl,
    canDeleteSnapshot,
    canDownloadSnapshot,
    canRestoreRemote,
    canRestoreSnapshot,
    formatSnapshotBytes,
    isJobRunning,
    normaliseMode,
    snapshotDownloadUrl,
    snapshotProblem,
    tagColour,
    waitForRestart,
  } from '$lib/pano-backup.util.js';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { pageCount, pageNumber, pageOf } from '$lib/components/pagination.util.js';
  import PageActions from '$lib/components/PageActions.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import BsModal from '$lib/components/settings/pano-backup/BsModal.svelte';
  import PanoBackupJobCard from '$lib/components/settings/pano-backup/PanoBackupJobCard.svelte';
  import PanoBackupAccountSummary from '$lib/components/settings/pano-backup/PanoBackupAccountSummary.svelte';
  import PassphraseFields from '$lib/components/settings/pano-backup/PassphraseFields.svelte';
  import RestorePanoBackupModal from '$lib/components/settings/pano-backup/RestorePanoBackupModal.svelte';
  import { isRunningRestore, restoreJob } from '$lib/pano-restore.store.js';
  import PanoBackupSettingsModal from '$lib/components/settings/pano-backup/PanoBackupSettingsModal.svelte';
  import PanoBackupPassphraseModal from '$lib/components/settings/pano-backup/PanoBackupPassphraseModal.svelte';
  import PanoTransferModal from '$lib/components/settings/pano-backup/PanoTransferModal.svelte';

  let { data } = $props();

  getContext('pageTitle').set('pages.settings.backups.title');

  // The website sends the owner back with `?planUpdated` (a plan was picked) or `?back`, like the
  // store does with `?install=`; the flag is shown once and dropped from the address.
  onMount(() => {
    const params = $page.url.searchParams;

    if (!params.has('planUpdated') && !params.has('back')) {
      return;
    }

    if (params.has('planUpdated')) {
      void showSuccess('pages.settings.backups.account.plan-updated');
    }

    void goto(`${base}/backups`, { replace: true, reset: false });
  });

  const EMPTY_LOCAL = { backups: [], usedBytes: 0, job: null, restartRequired: false };

  // Page state comes from `load` and is overwritten in place by `refresh()` / job updates.
  let local = $derived(normaliseLocal(data?.local));
  let remote = $derived(normaliseRemote(data?.remote));
  let remoteList = $derived(/** @type {any} */ (data?.remoteList ?? null));
  let job = $derived(/** @type {any} */ (data?.remote?.job ?? data?.local?.job ?? null));

  const LOCAL_TAGS = ['MANUAL', 'SCHEDULED', 'PRE_RESTORE'];
  const LOCAL_PAGE_SIZE = 10;

  let localTag = $state('ALL');
  let localPage = $state(1);

  const filteredLocal = $derived(
    localTag === 'ALL' ? local.backups : local.backups.filter((backup) => backup.tag === localTag),
  );
  const localLastPage = $derived(Math.max(1, Math.ceil(filteredLocal.length / LOCAL_PAGE_SIZE)));
  const pagedLocal = $derived(
    filteredLocal.slice((localPage - 1) * LOCAL_PAGE_SIZE, localPage * LOCAL_PAGE_SIZE),
  );
  // The row the open delete confirmation is about, like the selected row on Posts.
  let selectedId = $state(null);

  $effect(() => {
    if (localPage > localLastPage) {
      localPage = localLastPage;
    }
  });

  /** @param {string} tag */
  function setLocalTag(tag) {
    localTag = tag;
    localPage = 1;
  }

  /** @type {'create' | 'upload' | 'delete' | null} */
  let busyAction = $state(null);

  /** @type {BsModal | undefined} */
  let createModal = $state();
  /** @type {BsModal | undefined} */
  let deleteModal = $state();
  /** @type {BsModal | undefined} */
  let uploadModal = $state();
  /** @type {RestorePanoBackupModal | undefined} */
  let restoreModal = $state();
  /** @type {PanoBackupSettingsModal | undefined} */
  let settingsModal = $state();
  /** @type {PanoBackupPassphraseModal | undefined} */
  let passphraseModal = $state();
  /** @type {PanoTransferModal | undefined} */
  let transferModal = $state();

  let createEncrypt = $state(true);
  let createPassphrase = $state('');
  let createPassphraseValid = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let createError = $state(null);

  /** @type {{ kind: 'local' | 'remote' | 'snapshot', backup: any } | null} */
  let deleteTarget = $state(null);
  let remoteLoading = $state(false);
  /** @type {{ kind: 'local' | 'remote' | 'snapshot', backup: any } | null} */
  let restoreTarget = $state(null);

  const running = $derived(isJobRunning(job));
  const restoring = $derived(isRunningRestore(job));

  // Hands a running restore to the lock dialog, which follows it to the restart and the reload.
  $effect(() => {
    if (restoring) {
      restoreJob.set(job);
    }
  });
  const connected = $derived(connectionState(remote) !== 'not-connected');
  const hostUnavailable = $derived(connectionState(remote) === 'unavailable');
  const backupMode = $derived(normaliseMode(remote?.settings?.mode));
  const planUrl = $derived(backupPlanUrl(PANO_WEBSITE_URL, `${$page.url.origin}${base}/backups`));
  const remoteRows = $derived(
    /** @type {any[]} */ (
      !remoteList?.error && Array.isArray(remoteList?.items) ? remoteList.items : []
    ),
  );
  const showRemoteStatus = $derived(remoteRows.some((row) => row.status !== 'DONE'));
  const remoteError = $derived(remoteList?.error ? describeError(remoteList) : null);
  /** @param {any} row a remote list row (archive or snapshot). */
  function canDownloadRow(row) {
    return row.type === 'snapshot' && canDownloadSnapshot(row);
  }

  /** @param {any} row a remote list row (archive or snapshot). */
  function canRestoreRow(row) {
    return row.type === 'snapshot' ? canRestoreSnapshot(row) : canRestoreRemote(row);
  }

  /** @param {any} row a remote list row (archive or snapshot). */
  function canDeleteRow(row) {
    return row.type === 'snapshot'
      ? canDeleteSnapshot(row)
      : row.own === true && row.status === 'DONE';
  }

  /** @param {any} body */
  function normaliseLocal(body) {
    return body && !body.error ? { ...EMPTY_LOCAL, ...body } : EMPTY_LOCAL;
  }

  /** @param {any} body */
  function normaliseRemote(body) {
    return body && !body.error ? body : { connected: false, passphraseSet: false };
  }

  /** @param {{ local?: any, remote?: any, remoteList?: any }} source */
  function apply(source) {
    local = normaliseLocal(source.local);
    remote = normaliseRemote(source.remote);
    remoteList = source.remoteList ?? null;
    job = source.remote?.job ?? source.local?.job ?? job;
  }

  /**
   * The Pano Backup list, one page, cut by the server. A page that is gone (the last row of the last page
   * was deleted) falls back to the first.
   *
   * @param {number} number
   * @returns {Promise<any>}
   */
  async function readRemotePage(number) {
    const path = (/** @type {number} */ at) =>
      `/panel/pano-backups/remote/list?page=${at}&pageSize=${REMOTE_PAGE_SIZE}`;
    const body = await ApiUtil.get({ path: path(number) }).catch(() => null);

    return body?.error?.code === 'PAGE_NOT_FOUND' && number > 1
      ? ApiUtil.get({ path: path(1) }).catch(() => null)
      : body;
  }

  /** @param {number} number */
  async function goToRemotePage(number) {
    remoteLoading = true;

    const next = await readRemotePage(number);

    if (next && !next.error) {
      remoteList = next;
    }

    remoteLoading = false;
  }

  async function refresh() {
    const [nextLocal, nextRemote] = await Promise.all([
      ApiUtil.get({ path: '/panel/pano-backups' }).catch(() => null),
      ApiUtil.get({ path: '/panel/pano-backups/remote?fresh=true' }).catch(() => null),
    ]);
    const nextList =
      connectionState(nextRemote) !== 'not-connected'
        ? await readRemotePage(pageNumber(remoteList?.page))
        : null;

    apply({
      local: nextLocal,
      remote: nextRemote,
      remoteList: nextList,
    });
  }

  /** @param {any} finished */
  async function onJobFinished(finished) {
    if (finished.type === 'RESTORE' && finished.status === 'DONE') {
      // Everything changed underneath the panel (and the session may be gone): start over, but
      // only once the restarting Pano answers again, or the reload lands on a dead port.
      await waitForRestart({
        probe: () =>
          ApiUtil.get({ path: '/panel/basicData' }).then(
            (body) => !!body && typeof body === 'object',
          ),
      });

      window.location.reload();

      return;
    }

    if (finished.type === 'DOWNLOAD' && finished.status === 'DONE') {
      fetchArchive(finished.id);
    }

    await refresh();
  }

  /** Hands the browser the archive a finished download job built. */
  function fetchArchive(/** @type {string} */ jobId) {
    const link = document.createElement('a');

    link.href = snapshotDownloadUrl(jobId);
    link.download = '';
    document.body.append(link);
    link.click();
    link.remove();
  }

  /**
   * Starts a job route and puts its job on screen.
   *
   * @param {Promise<any>} request
   * @returns {Promise<ReturnType<typeof describeError>>}
   */
  async function startJob(request) {
    const body = await request.catch(() => ({ error: { code: 'NETWORK_ERROR' } }));

    if (!body || body.error) {
      return describeError(body || { error: { code: 'NETWORK_ERROR' } });
    }

    if (body.job) {
      job = body.job;
    }

    return null;
  }

  function openCreate() {
    createEncrypt = true;
    createPassphrase = '';
    createError = null;
    createModal?.show();
  }

  async function createBackup() {
    busyAction = 'create';

    try {
      createError = await startJob(
        ApiUtil.post({
          path: '/panel/pano-backups',
          body: createEncrypt ? { passphrase: createPassphrase } : {},
        }),
      );

      if (!createError) {
        createPassphrase = '';
        createModal?.hide();
      }
    } finally {
      busyAction = null;
    }
  }

  async function uploadToPanoBackup() {
    busyAction = 'upload';

    try {
      const error = await startJob(
        ApiUtil.post({
          path:
            backupMode === 'SNAPSHOT'
              ? '/panel/pano-backups/remote/snapshots'
              : '/panel/pano-backups/remote/backups',
        }),
      );

      if (error) {
        void showError(error.key, error.values);
      } else {
        uploadModal?.hide();
      }
    } finally {
      busyAction = null;
    }
  }

  /** @param {any} backup */
  function askRestoreLocal(backup) {
    restoreTarget = { kind: 'local', backup };
    restoreModal?.open({
      source: 'local',
      label: new Date(backup.createdAt).toLocaleString(),
      encrypted: !!backup.encrypted,
    });
  }

  /**
   * @param {any} backup
   */
  function askRestoreRemote(backup) {
    const snapshot = backup.type === 'snapshot';

    restoreTarget = { kind: snapshot ? 'snapshot' : 'remote', backup };
    restoreModal?.open({
      source: snapshot ? 'snapshot' : 'remote',
      label: new Date(backup.createdAt).toLocaleString(),
      encrypted: !snapshot,
    });
  }

  /**
   * @param {{ currentPassword: string, passphrase: string, file: File | null }} input
   */
  async function submitRestore(input) {
    if (input.file) {
      const form = new FormData();

      form.append('currentPassword', input.currentPassword);
      form.append('passphrase', input.passphrase);
      form.append('file', input.file);

      return startJob(ApiUtil.post({ path: '/panel/pano-backups/restore', body: form }));
    }

    const target = restoreTarget;

    if (!target) {
      return null;
    }

    const id = encodeURIComponent(target.backup.id);
    const path =
      target.kind === 'snapshot'
        ? `/panel/pano-backups/remote/snapshots/${id}/restore`
        : target.kind === 'remote'
          ? `/panel/pano-backups/remote/backups/${id}/restore`
          : `/panel/pano-backups/${id}/restore`;

    return startJob(
      ApiUtil.post({
        path,
        body: {
          currentPassword: input.currentPassword,
          ...(input.passphrase ? { passphrase: input.passphrase } : {}),
        },
      }),
    );
  }

  /**
   * @param {'local' | 'remote' | 'snapshot'} kind
   * @param {any} backup
   */
  function askDelete(kind, backup) {
    deleteTarget = { kind, backup };
    selectedId = kind === 'local' ? backup.id : null;
    deleteModal?.show();
  }

  async function confirmDelete() {
    const target = deleteTarget;

    if (!target) {
      return;
    }

    busyAction = 'delete';

    try {
      const id = encodeURIComponent(target.backup.id);
      const body = await ApiUtil.delete({
        path:
          target.kind === 'snapshot'
            ? `/panel/pano-backups/remote/snapshots/${id}`
            : target.kind === 'remote'
              ? `/panel/pano-backups/remote/backups/${id}`
              : `/panel/pano-backups/${id}`,
      }).catch(() => ({ error: { code: 'NETWORK_ERROR' } }));

      if (body?.error) {
        const error = describeError(body);

        if (error) {
          void showError(error.key, error.values);
        }

        return;
      }

      deleteModal?.hide();
      void showSuccess('pages.settings.backups.deleted');
      await refresh();
    } finally {
      busyAction = null;
    }
  }

  /** @param {any} snapshot */
  async function downloadSnapshot(snapshot) {
    const error = await startJob(
      ApiUtil.post({
        path: `/panel/pano-backups/remote/snapshots/${encodeURIComponent(snapshot.id)}/download`,
      }),
    );

    if (error) {
      void showError(error.key, error.values);
    }
  }
</script>
