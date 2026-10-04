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

  <PanoBackupJobCard
    {job}
    onupdate={(next) => (job = next)}
    restartRequired={local.restartRequired}
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
                        href="/api/panel/pano-backups/{encodeURIComponent(backup.id)}/download"
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
                  <span class="badge text-bg-{tagColour(backup.tag)}">
                    {$_(`pages.settings.backups.tag-${String(backup.tag).toLowerCase()}`)}
                  </span>
                  {#if backup.encrypted}
                    <i
                      class="fa-solid fa-lock ms-1 text-body-secondary"
                      title={$_('pages.settings.backups.encrypted')}
                      aria-label={$_('pages.settings.backups.encrypted')}></i>
                  {/if}
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
          page={localPage}
          totalPage={localTotalPage}
          on:firstPageClick={() => (localPage = 1)}
          on:lastPageClick={() => (localPage = localTotalPage)}
          on:pageLinkClick={(event) => (localPage = event.detail.page)} />
      </div>
    {/if}
  </div>

  <!-- Pano Backup: the account, its plan and storage, then every Pano of the account, this one first -->
  <div class="card">
    <CardHeader showRight={connected && !hostUnavailable}>
      <div slot="left">{$_('pages.settings.backups.remote-title')}</div>
      <!-- Nothing to act on while panomc.com cannot be reached. -->
      <div slot="right">
        <div class="hstack gap-2">
          <button
            type="button"
            class="btn btn-link btn-sm"
            title={$_('pages.settings.backups.passphrase-title')}
            onclick={() => passphraseModal?.open()}>
            <i
              class="fa-solid {remote.passphraseSet ? 'fa-lock' : 'fa-lock-open'} me-lg-1"
              aria-hidden="true"></i>
            <span class="d-none d-lg-inline">{$_('pages.settings.backups.passphrase-title')}</span>
          </button>
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            disabled={running || busyAction === 'upload'}
            onclick={() => uploadModal?.show()}>
            <i class="fa-solid fa-cloud-arrow-up me-lg-1" aria-hidden="true"></i>
            <span class="d-none d-lg-inline">{$_('pages.settings.backups.upload-now')}</span>
          </button>
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            disabled={running || !!openTransfer}
            onclick={() => transferModal?.open()}>
            <i class="fa-solid fa-right-left me-lg-1" aria-hidden="true"></i>
            <span class="d-none d-lg-inline">{$_('pages.settings.backups.transfer.title')}</span>
          </button>
        </div>
      </div>
    </CardHeader>

    <PanoBackupAccountSummary {remote} />

    <!-- A transfer to Pano Host waiting for the owner's confirmation on panomc.com. -->
    {#if connected && openTransfer}
      <div class="card-body pt-0">
        <div class="alert alert-warning mb-0 d-flex flex-wrap align-items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span>
            {$_('pages.settings.backups.transfer.awaiting', {
              values: { website: websiteDisplayHost() },
            })}
            {#if openTransfer.status === 'AWAITING_CONFIRMATION' && openTransfer.expiresAt}
              · {$_('pages.settings.backups.transfer.confirm-until')}
              <DateComponent time={openTransfer.expiresAt} relativeFormat />
            {/if}
          </span>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger ms-auto"
            disabled={cancelling === openTransfer.id}
            onclick={() => void cancelTransfer(openTransfer)}>
            {$_('buttons.cancel')}
          </button>
        </div>
      </div>
    {/if}

    <!-- When panomc.com cannot be reached the summary above already says so; the list would only
         repeat it. -->
    {#if connected && !hostUnavailable}
      <div class="border-top"></div>
      {#if remoteError}
        <div class="card-body">
          <div class="alert alert-danger d-flex align-items-center gap-2 mb-0">
            <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>
            <div>{$_(remoteError.key, { values: remoteError.values })}</div>
          </div>
        </div>
      {:else if !groupsHaveBackups}
        <NoContent />
      {:else}
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th scope="col"></th>
                <th>{$_('pages.settings.backups.column-created')}</th>
                <th>{$_('pages.settings.backups.column-source')}</th>
                <th>{$_('pages.settings.backups.column-size')}</th>
              </tr>
            </thead>
            {#each groups as group (group.instanceId)}
              <tbody>
                <tr class="table-group-divider">
                  <th colspan="4" class="bg-body-tertiary">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <i class="fa-solid fa-server text-body-secondary" aria-hidden="true"></i>
                      <span>{group.instanceName}</span>
                      {#if group.current}
                        <span class="badge text-bg-primary">
                          {$_('pages.settings.backups.this-pano')}
                        </span>
                      {:else if group.connected === false}
                        <span class="badge text-bg-secondary">
                          {$_('pages.settings.backups.pano-disconnected')}
                        </span>
                      {/if}
                      <span class="small fw-normal text-body-secondary ms-auto">
                        {$_('pages.settings.backups.pano-used', {
                          values: {
                            size: formatBytes(group.usedBytes),
                            count: group.backups.length,
                          },
                        })}
                      </span>
                    </div>
                  </th>
                </tr>
                {#if group.backups.length === 0}
                  <tr>
                    <td colspan="4" class="small text-body-secondary fst-italic">
                      {$_('pages.settings.backups.no-remote-this-pano')}
                    </td>
                  </tr>
                {/if}
                {#each group.backups as backup (backup.id)}
                  <tr>
                    <th scope="row" class="align-middle text-center">
                      {#if canRestoreRemote(backup) || backup.own}
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
                            {#if canRestoreRemote(backup)}
                              <button
                                type="button"
                                class="dropdown-item text-capitalize"
                                disabled={running}
                                onclick={() => askRestoreRemote(backup, group)}>
                                <i class="fa-solid fa-clock-rotate-left me-2" aria-hidden="true"
                                ></i>
                                {$_('pages.settings.backups.restore.submit')}
                              </button>
                            {/if}
                            {#if backup.own && backup.status === 'DONE'}
                              <button
                                type="button"
                                class="dropdown-item text-danger text-capitalize"
                                onclick={() => askDelete('remote', backup)}>
                                <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                                {$_('buttons.delete')}
                              </button>
                            {/if}
                          </div>
                        </div>
                      {/if}
                    </th>
                    <td>
                      <DateComponent time={backup.createdAt} relativeFormat />
                      {#if backup.status !== 'DONE'}
                        <span class="badge text-bg-secondary ms-1">
                          {$_(
                            `pages.settings.backups.remote-status-${String(backup.status).toLowerCase()}`,
                          )}
                        </span>
                      {/if}
                    </td>
                    <td>
                      <span
                        class="badge text-bg-{backup.kind === 'mc-server' ? 'info' : 'primary'}">
                        {backup.kind === 'mc-server'
                          ? $_('pages.settings.backups.kind-mc-server')
                          : $_('pages.settings.backups.kind-pano')}
                      </span>
                      {#if backup.subject}
                        <div class="small text-body-secondary">{backup.subject}</div>
                      {/if}
                    </td>
                    <td>{formatBytes(backup.sizeBytes || 0)}</td>
                  </tr>
                {/each}
              </tbody>
            {/each}
          </table>
        </div>
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
        <div class="alert alert-danger d-flex align-items-center gap-2 mb-0">
          <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>
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
      <i class="fa-solid fa-cloud-arrow-up fa-3x d-block m-auto text-gray"></i>
    </div>
    <div class="text-capitalize mb-2">{$_('pages.settings.backups.upload-confirm.title')}</div>
    <div>
      {$_('pages.settings.backups.upload-confirm.description')}
      {remote.passphraseSet
        ? $_('pages.settings.backups.upload-confirm.encrypted')
        : $_('pages.settings.backups.upload-confirm.plain')}
    </div>
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
      class="btn btn-primary col-6 m-0"
      disabled={running || busyAction === 'upload'}
      onclick={() => void uploadToPanoBackup()}>
      {#if busyAction === 'upload'}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('pages.settings.backups.upload-now')}
    </button>
  </div>
</BsModal>

<BsModal bind:this={deleteModal} onhidden={() => (selectedId = null)}>
  <div class="modal-body text-center">
    <div class="pb-3">
      <i class="fa-solid fa-trash fa-3x d-block m-auto text-gray"></i>
    </div>
    <div class="text-capitalize mb-2">{$_('pages.settings.backups.delete-title')}</div>
    <div>
      {deleteTarget?.kind === 'remote'
        ? $_('pages.settings.backups.delete-remote-description')
        : $_('pages.settings.backups.delete-local-description')}
    </div>
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

  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { canRestoreRemote, connectionState } from '$lib/pano-backup.util.js';

  /**
   * @param {string} path
   * @param {import('@sveltejs/kit').LoadEvent} event
   */
  async function read(path, event) {
    return ApiUtil.get({ path, request: event }).catch(() => null);
  }

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load(event) {
    const { user } = await event.parent();

    if (!hasPermission(Permissions.MANAGE_PANO_BACKUPS, user)) {
      throw redirect(302, base);
    }

    const [local, remote] = await Promise.all([
      read('/api/panel/pano-backups', event),
      // Back from picking a plan on the website: the cached plan is stale, ask panomc.com again.
      read(
        event.url.searchParams.has('planUpdated')
          ? '/api/panel/pano-backups/remote?fresh=true'
          : '/api/panel/pano-backups/remote',
        event,
      ),
    ]);

    const [remoteList, transferList] =
      connectionState(remote) !== 'not-connected'
        ? await Promise.all([
            read('/api/panel/pano-backups/remote/backups', event),
            read('/api/panel/pano-backups/remote/transfers', event),
          ])
        : [null, null];

    return { local, remote, remoteList, transferList };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import { formatBytes } from '$lib/string.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';
  import {
    groupRemoteBackups,
    isJobRunning,
    isTransferOpen,
    tagColour,
  } from '$lib/pano-backup.util.js';

  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import BsModal from '$lib/components/settings/pano-backup/BsModal.svelte';
  import PanoBackupJobCard from '$lib/components/settings/pano-backup/PanoBackupJobCard.svelte';
  import PanoBackupAccountSummary from '$lib/components/settings/pano-backup/PanoBackupAccountSummary.svelte';
  import PassphraseFields from '$lib/components/settings/pano-backup/PassphraseFields.svelte';
  import RestorePanoBackupModal from '$lib/components/settings/pano-backup/RestorePanoBackupModal.svelte';
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

    void goto(`${base}/backups`, { replaceState: true, noScroll: true, keepFocus: true });
  });

  const EMPTY_LOCAL = { backups: [], usedBytes: 0, job: null, restartRequired: false };

  // Page state comes from `load` and is overwritten in place by `refresh()` / job updates.
  let local = $derived(normaliseLocal(data?.local));
  let remote = $derived(normaliseRemote(data?.remote));
  let remoteList = $derived(/** @type {any} */ (data?.remoteList ?? null));
  let transferList = $derived(/** @type {any} */ (data?.transferList ?? null));
  let job = $derived(/** @type {any} */ (data?.remote?.job ?? data?.local?.job ?? null));

  const LOCAL_TAGS = ['MANUAL', 'SCHEDULED', 'PRE_RESTORE'];
  const LOCAL_PAGE_SIZE = 10;

  let localTag = $state('ALL');
  let localPage = $state(1);

  const filteredLocal = $derived(
    localTag === 'ALL' ? local.backups : local.backups.filter((backup) => backup.tag === localTag),
  );
  const localTotalPage = $derived(Math.max(1, Math.ceil(filteredLocal.length / LOCAL_PAGE_SIZE)));
  const pagedLocal = $derived(
    filteredLocal.slice((localPage - 1) * LOCAL_PAGE_SIZE, localPage * LOCAL_PAGE_SIZE),
  );
  // The row the open delete confirmation is about, like the selected row on Posts.
  let selectedId = $state(null);

  $effect(() => {
    if (localPage > localTotalPage) {
      localPage = localTotalPage;
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

  /** @type {string | null} */
  let cancelling = $state(null);

  /** A pending transfer is re-read this often, so the owner's confirmation shows up here. */
  const OPEN_TRANSFER_POLL_MS = 10_000;

  let createEncrypt = $state(true);
  let createPassphrase = $state('');
  let createPassphraseValid = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let createError = $state(null);

  /** @type {{ kind: 'local' | 'remote', backup: any } | null} */
  let deleteTarget = $state(null);
  /** @type {{ kind: 'local' | 'remote', backup: any } | null} */
  let restoreTarget = $state(null);

  const running = $derived(isJobRunning(job));
  const connected = $derived(connectionState(remote) !== 'not-connected');
  const hostUnavailable = $derived(connectionState(remote) === 'unavailable');
  const groups = $derived(groupRemoteBackups(remoteList?.error ? null : remoteList));
  const groupsHaveBackups = $derived(groups.some((group) => group.backups.length > 0));
  const remoteError = $derived(remoteList?.error ? describeError(remoteList) : null);
  const transfers = $derived(
    /** @type {any[]} */ (
      transferList && !transferList.error && Array.isArray(transferList.transfers)
        ? transferList.transfers
        : []
    ),
  );
  const openTransfer = $derived(transfers.find((transfer) => isTransferOpen(transfer.status)));

  $effect(() => {
    if (!openTransfer || running) {
      return;
    }

    const timer = setInterval(() => void refresh(), OPEN_TRANSFER_POLL_MS);

    return () => clearInterval(timer);
  });

  /** @param {any} body */
  function normaliseLocal(body) {
    return body && !body.error ? { ...EMPTY_LOCAL, ...body } : EMPTY_LOCAL;
  }

  /** @param {any} body */
  function normaliseRemote(body) {
    return body && !body.error ? body : { connected: false, passphraseSet: false };
  }

  /** @param {{ local?: any, remote?: any, remoteList?: any, transferList?: any }} source */
  function apply(source) {
    local = normaliseLocal(source.local);
    remote = normaliseRemote(source.remote);
    remoteList = source.remoteList ?? null;
    transferList = source.transferList ?? null;
    job = source.remote?.job ?? source.local?.job ?? job;
  }

  async function refresh() {
    const [nextLocal, nextRemote] = await Promise.all([
      ApiUtil.get({ path: '/api/panel/pano-backups' }).catch(() => null),
      ApiUtil.get({ path: '/api/panel/pano-backups/remote?fresh=true' }).catch(() => null),
    ]);
    const [nextList, nextTransfers] =
      connectionState(nextRemote) !== 'not-connected'
        ? await Promise.all([
            ApiUtil.get({ path: '/api/panel/pano-backups/remote/backups' }).catch(() => null),
            ApiUtil.get({ path: '/api/panel/pano-backups/remote/transfers' }).catch(() => null),
          ])
        : [null, null];

    apply({
      local: nextLocal,
      remote: nextRemote,
      remoteList: nextList,
      transferList: nextTransfers,
    });
  }

  /** @param {any} finished */
  async function onJobFinished(finished) {
    if (finished.type === 'RESTORE' && finished.status === 'DONE') {
      // Everything changed underneath the panel (and the session may be gone): start over.
      setTimeout(() => window.location.reload(), 3000);

      return;
    }

    await refresh();
  }

  /**
   * Starts a job route and puts its job on screen.
   *
   * @param {Promise<any>} request
   * @returns {Promise<ReturnType<typeof describeError>>}
   */
  async function startJob(request) {
    const body = await request.catch(() => ({ error: 'NETWORK_ERROR' }));

    if (!body || body.error) {
      return describeError(body || { error: 'NETWORK_ERROR' });
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
          path: '/api/panel/pano-backups',
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
        ApiUtil.post({ path: '/api/panel/pano-backups/remote/backups' }),
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
   * @param {{ instanceName: string }} group
   */
  function askRestoreRemote(backup, group) {
    restoreTarget = { kind: 'remote', backup };
    restoreModal?.open({
      source: 'remote',
      label: `${group.instanceName || backup.instanceName || ''} · ${new Date(backup.createdAt).toLocaleString()}`,
      encrypted: true,
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

      return startJob(ApiUtil.post({ path: '/api/panel/pano-backups/restore', body: form }));
    }

    const target = restoreTarget;

    if (!target) {
      return null;
    }

    const id = encodeURIComponent(target.backup.id);
    const path =
      target.kind === 'remote'
        ? `/api/panel/pano-backups/remote/backups/${id}/restore`
        : `/api/panel/pano-backups/${id}/restore`;

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
   * @param {'local' | 'remote'} kind
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
          target.kind === 'remote'
            ? `/api/panel/pano-backups/remote/backups/${id}`
            : `/api/panel/pano-backups/${id}`,
      }).catch(() => ({ error: 'NETWORK_ERROR' }));

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

  /** @param {any} transfer */
  async function cancelTransfer(transfer) {
    cancelling = transfer.id;

    try {
      const body = await ApiUtil.delete({
        path: `/api/panel/pano-backups/remote/transfers/${encodeURIComponent(transfer.id)}`,
      }).catch(() => ({ error: 'NETWORK_ERROR' }));

      if (body?.error) {
        const error = describeError(body);

        if (error) {
          void showError(error.key, error.values);
        }
      }

      await refresh();
    } finally {
      cancelling = null;
    }
  }
</script>
