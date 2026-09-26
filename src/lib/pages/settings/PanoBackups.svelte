<!-- Pano backups: local backups and Pano Backup (panomc.com) — create, download, delete, restore. -->
<div class="vstack gap-3">
  <PageActions>
    <div slot="left" class="small text-body-secondary">
      {$_('pages.settings.backups.local-used', {
        values: { size: formatBytes(local.usedBytes || 0), count: local.backups.length },
      })}
    </div>
    <div slot="right" class="hstack gap-2 flex-wrap justify-content-center">
      <button
        type="button"
        class="btn btn-secondary"
        disabled={running}
        onclick={() => restoreModal?.open({ source: 'file' })}>
        <i class="fa-solid fa-file-arrow-up me-lg-2" aria-hidden="true"></i>
        <span class="d-none d-lg-inline">{$_('pages.settings.backups.restore-from-file')}</span>
      </button>
      {#if backupLinked}
        <button
          type="button"
          class="btn btn-secondary"
          disabled={running || busyAction === 'upload' || !remote.passphraseSet}
          onclick={() => void uploadToPanoBackup()}>
          <i class="fa-solid fa-cloud-arrow-up me-lg-2" aria-hidden="true"></i>
          <span class="d-none d-lg-inline">{$_('pages.settings.backups.upload-now')}</span>
        </button>
      {/if}
      <button type="button" class="btn btn-primary" disabled={running} onclick={openCreate}>
        <i class="fa-solid fa-plus me-lg-2" aria-hidden="true"></i>
        <span class="d-none d-lg-inline">{$_('pages.settings.backups.create')}</span>
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
    <div class="card-header d-flex align-items-center">
      <span>{$_('pages.settings.backups.local-title')}</span>
      <button
        type="button"
        class="btn btn-link btn-sm ms-auto"
        aria-label={$_('buttons.refresh')}
        onclick={() => void refresh()}>
        <i class="fa-solid fa-arrows-rotate" class:fa-spin={refreshing}></i>
      </button>
    </div>
    {#if local.backups.length === 0}
      <NoContent
        icon="fa-solid fa-box-archive fa-3x"
        text={$_('pages.settings.backups.no-local')} />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>{$_('pages.settings.backups.column-created')}</th>
              <th>{$_('pages.settings.backups.column-type')}</th>
              <th>{$_('pages.settings.backups.column-size')}</th>
              <th class="d-none d-md-table-cell">{$_('pages.settings.backups.column-version')}</th>
              <th class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            {#each local.backups as backup (backup.id)}
              <tr>
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
                <td class="text-end">
                  <span class="dropdown">
                    <button
                      type="button"
                      class="btn btn-link btn-sm"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label={$_('pages.settings.backups.column-actions')}>
                      <span class="fas fa-ellipsis-v"></span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end">
                      <a
                        class="dropdown-item"
                        href="/api/panel/pano-backups/{encodeURIComponent(backup.id)}/download"
                        download="pano-backup-{backup.id}.panoarc">
                        <i class="fa-solid fa-download me-2" aria-hidden="true"></i>
                        {$_('buttons.download')}
                      </a>
                      <button
                        type="button"
                        class="dropdown-item"
                        disabled={running}
                        onclick={() => askRestoreLocal(backup)}>
                        <i class="fa-solid fa-clock-rotate-left me-2" aria-hidden="true"></i>
                        {$_('pages.settings.backups.restore.submit')}
                      </button>
                      <div class="dropdown-divider"></div>
                      <button
                        type="button"
                        class="dropdown-item text-danger"
                        onclick={() => askDelete('local', backup)}>
                        <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                        {$_('buttons.delete')}
                      </button>
                    </div>
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Pano Backup -->
  <div class="card">
    <div class="card-header d-flex align-items-center gap-2">
      <span>{$_('pages.settings.backups.remote-title')}</span>
      {#if remoteList?.tier}
        <span class="badge text-bg-primary">{remoteList.tier.name}</span>
      {/if}
      {#if usage}
        <span class="small text-body-secondary ms-auto">
          {formatBytes(usage.usedBytes || 0)}
          {#if usage.quotaBytes}/ {formatBytes(usage.quotaBytes)}{/if}
        </span>
      {/if}
    </div>
    {#if !backupLinked}
      <div class="card-body text-center vstack gap-2 align-items-center">
        <i class="fa-solid fa-cloud fa-3x opacity-50"></i>
        <p class="mb-0">{$_('pages.settings.backups.remote-not-linked')}</p>
        <a class="btn btn-primary btn-sm" href="{base}/settings/backups/pano-backup">
          {$_('pages.settings.backups.go-settings')}
        </a>
      </div>
    {:else if remoteError}
      <div class="card-body">
        <div class="alert alert-danger small mb-0">
          {$_(remoteError.key, { values: remoteError.values })}
        </div>
      </div>
    {:else}
      {#if !remote.passphraseSet}
        <div class="card-body pb-0">
          <div class="alert alert-warning small mb-0">
            {$_('pages.settings.backups.passphrase-missing')}
            <a href="{base}/settings/backups/pano-backup">
              {$_('pages.settings.backups.go-settings')}
            </a>
          </div>
        </div>
      {/if}
      {#if remoteBackups.length === 0}
        <NoContent icon="fa-solid fa-cloud fa-3x" text={$_('pages.settings.backups.no-remote')} />
      {:else}
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>{$_('pages.settings.backups.column-created')}</th>
                <th>{$_('pages.settings.backups.column-source')}</th>
                <th>{$_('pages.settings.backups.column-size')}</th>
                <th class="d-none d-md-table-cell"
                  >{$_('pages.settings.backups.column-expires')}</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {#each remoteBackups as backup (backup.id)}
                <tr>
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
                    <span class="badge text-bg-{backup.kind === 'mc-server' ? 'info' : 'primary'}">
                      {backup.kind === 'mc-server'
                        ? $_('pages.settings.backups.kind-mc-server')
                        : $_('pages.settings.backups.kind-pano')}
                    </span>
                    <div class="small text-body-secondary">
                      {backup.instanceName || '—'}{#if backup.subject}
                        · {backup.subject}{/if}
                      {#if backup.own}
                        · {$_('pages.settings.backups.this-pano')}
                      {/if}
                    </div>
                  </td>
                  <td>{formatBytes(backup.sizeBytes || 0)}</td>
                  <td class="d-none d-md-table-cell small">
                    {#if backup.expiresAt}
                      <DateComponent time={backup.expiresAt} relativeFormat />
                    {:else}
                      —
                    {/if}
                  </td>
                  <td class="text-end">
                    {#if canRestoreRemote(backup) || backup.own}
                      <span class="dropdown">
                        <button
                          type="button"
                          class="btn btn-link btn-sm"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          aria-label={$_('pages.settings.backups.column-actions')}>
                          <span class="fas fa-ellipsis-v"></span>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end">
                          {#if canRestoreRemote(backup)}
                            <button
                              type="button"
                              class="dropdown-item"
                              disabled={running}
                              onclick={() => askRestoreRemote(backup)}>
                              <i class="fa-solid fa-clock-rotate-left me-2" aria-hidden="true"></i>
                              {$_('pages.settings.backups.restore.submit')}
                            </button>
                          {/if}
                          {#if backup.own}
                            <div class="dropdown-divider"></div>
                            <button
                              type="button"
                              class="dropdown-item text-danger"
                              onclick={() => askDelete('remote', backup)}>
                              <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                              {$_('buttons.delete')}
                            </button>
                          {/if}
                        </div>
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Create a local backup, optionally passphrase-encrypted. -->
<BsModal bind:this={createModal}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void createBackup();
    }}>
    <div class="modal-header">
      <h5 class="modal-title">{$_('pages.settings.backups.create')}</h5>
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="modal"
        aria-label={$_('buttons.close')}></button>
    </div>
    <div class="modal-body vstack gap-3">
      <div class="small text-body-secondary">{$_('pages.settings.backups.create-description')}</div>
      <div class="form-check form-switch">
        <input
          id="pano-backup-encrypt"
          class="form-check-input"
          type="checkbox"
          role="switch"
          bind:checked={createEncrypt} />
        <label class="form-check-label" for="pano-backup-encrypt">
          {$_('pages.settings.backups.encrypt')}
        </label>
      </div>
      {#if createEncrypt}
        <PassphraseFields bind:passphrase={createPassphrase} bind:valid={createPassphraseValid} />
      {:else}
        <div class="form-text">{$_('pages.settings.backups.plain-hint')}</div>
      {/if}
      {#if createError}
        <div class="alert alert-danger small mb-0">
          {$_(createError.key, { values: createError.values })}
        </div>
      {/if}
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-link" data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={busyAction === 'create' || (createEncrypt && !createPassphraseValid)}>
        {#if busyAction === 'create'}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('buttons.create')}
      </button>
    </div>
  </form>
</BsModal>

<BsModal bind:this={deleteModal}>
  <div class="modal-body text-center">
    <i class="fa-solid fa-trash fa-3x d-block m-auto text-danger pb-3"></i>
    <h5 class="mb-2">{$_('pages.settings.backups.delete-title')}</h5>
    <div class="text-body-secondary small">
      {deleteTarget?.kind === 'remote'
        ? $_('pages.settings.backups.delete-remote-description')
        : $_('pages.settings.backups.delete-local-description')}
    </div>
  </div>
  <div class="modal-footer flex-nowrap">
    <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
      {$_('buttons.cancel')}
    </button>
    <button
      type="button"
      class="btn btn-danger col-6 m-0"
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
  import ApiUtil from '$lib/api.util.js';

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
    await event.parent();

    const [local, remote] = await Promise.all([
      read('/api/panel/pano-backups', event),
      read('/api/panel/pano-backups/remote', event),
    ]);

    const remoteList = remote?.links?.BACKUP
      ? await read('/api/panel/pano-backups/remote/backups', event)
      : null;

    return { local, remote, remoteList };
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import { formatBytes } from '$lib/string.util.js';
  import { describeError, isJobRunning, tagColour } from '$lib/pano-backup.util.js';

  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import BsModal from '$lib/components/settings/pano-backup/BsModal.svelte';
  import PanoBackupJobCard from '$lib/components/settings/pano-backup/PanoBackupJobCard.svelte';
  import PassphraseFields from '$lib/components/settings/pano-backup/PassphraseFields.svelte';
  import RestorePanoBackupModal from '$lib/components/settings/pano-backup/RestorePanoBackupModal.svelte';

  let { data } = $props();

  const EMPTY_LOCAL = { backups: [], usedBytes: 0, job: null, restartRequired: false };

  // Page state comes from `load` and is overwritten in place by `refresh()` / job updates.
  let local = $derived(normaliseLocal(data?.local));
  let remote = $derived(normaliseRemote(data?.remote));
  let remoteList = $derived(/** @type {any} */ (data?.remoteList ?? null));
  let job = $derived(/** @type {any} */ (data?.remote?.job ?? data?.local?.job ?? null));

  let refreshing = $state(false);
  /** @type {'create' | 'upload' | 'delete' | null} */
  let busyAction = $state(null);

  /** @type {BsModal | undefined} */
  let createModal = $state();
  /** @type {BsModal | undefined} */
  let deleteModal = $state();
  /** @type {RestorePanoBackupModal | undefined} */
  let restoreModal = $state();

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
  const backupLinked = $derived(!!remote?.links?.BACKUP);
  const remoteBackups = $derived(Array.isArray(remoteList?.backups) ? remoteList.backups : []);
  const usage = $derived(remoteList?.usage || null);
  const remoteError = $derived(remoteList?.error ? describeError(remoteList) : null);

  /** @param {any} body */
  function normaliseLocal(body) {
    return body && !body.error ? { ...EMPTY_LOCAL, ...body } : EMPTY_LOCAL;
  }

  /** @param {any} body */
  function normaliseRemote(body) {
    return body && !body.error ? body : { links: {}, passphraseSet: false };
  }

  /** @param {{ local?: any, remote?: any, remoteList?: any }} source */
  function apply(source) {
    local = normaliseLocal(source.local);
    remote = normaliseRemote(source.remote);
    remoteList = source.remoteList ?? null;
    job = source.remote?.job ?? source.local?.job ?? job;
  }

  async function refresh() {
    refreshing = true;

    try {
      const [nextLocal, nextRemote] = await Promise.all([
        ApiUtil.get({ path: '/api/panel/pano-backups' }).catch(() => null),
        ApiUtil.get({ path: '/api/panel/pano-backups/remote' }).catch(() => null),
      ]);
      const nextList = nextRemote?.links?.BACKUP
        ? await ApiUtil.get({ path: '/api/panel/pano-backups/remote/backups' }).catch(() => null)
        : null;

      apply({ local: nextLocal, remote: nextRemote, remoteList: nextList });
    } finally {
      refreshing = false;
    }
  }

  /** @param {any} finished */
  async function onJobFinished(finished) {
    if (finished.status === 'DONE') {
      void showSuccess(`pages.settings.backups.job.done-${String(finished.type).toLowerCase()}`);
    }

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
      }
    } finally {
      busyAction = null;
    }
  }

  /** @param {any} backup */
  function canRestoreRemote(backup) {
    return backup.status === 'DONE' && backup.kind !== 'mc-server';
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

  /** @param {any} backup */
  function askRestoreRemote(backup) {
    restoreTarget = { kind: 'remote', backup };
    restoreModal?.open({
      source: 'remote',
      label: `${backup.instanceName || ''} · ${new Date(backup.createdAt).toLocaleString()}`,
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
</script>
