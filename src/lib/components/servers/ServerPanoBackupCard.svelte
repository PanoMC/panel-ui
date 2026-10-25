<!-- SM-PB — one server's side of Pano Backup: whether its backups go to the connected account, how long they stay
     there, and the copies it holds, each of which can be brought back into this server's own backups. -->
<div class="card">
  <CardHeader>
    <span slot="left">
      {loading || !connected
        ? $_('pages.servers.backups.pano-backup.title')
        : $_('pages.servers.backups.pano-backup.count', { values: { count: backups.length } })}
    </span>

    <span slot="right" class="d-flex align-items-center gap-2">
      {#if connected}
        <span class="badge text-bg-{settings.enabled ? 'success' : 'secondary'}">
          {settings.enabled
            ? $_(`pages.servers.backups.pano-backup.mode-${settings.mode.toLowerCase()}`)
            : $_('pages.servers.backups.pano-backup.off')}
        </span>
        {#if canManage}
          <button
            type="button"
            class="btn btn-sm btn-link p-0"
            aria-label={$_('pages.servers.backups.pano-backup.settings-title')}
            onclick={openSettings}
            use:tooltip={[
              $_('pages.servers.backups.pano-backup.settings-title'),
              { placement: 'bottom' },
            ]}>
            <i class="fa-solid fa-gear" aria-hidden="true"></i>
          </button>
        {/if}
      {/if}
    </span>
  </CardHeader>

  {#if job}
    <div class="card-body pb-0">
      <PanoBackupJobCard {job} onupdate={(next) => (job = next)} onfinish={onJobFinished} />
    </div>
  {/if}

  {#if loading}
    <div class="card-body d-flex justify-content-center py-5">
      <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
    </div>
  {:else if loadFailed}
    <div class="card-body text-center vstack gap-3 py-5">
      <div class="text-body-secondary">{$_('pages.servers.backups.pano-backup.load-failed')}</div>
      <div>
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick={() => void load()}>
          {$_('buttons.refresh')}
        </button>
      </div>
    </div>
  {:else if !connected}
    <div class="card-body text-center vstack gap-3 py-5">
      <div>
        <i class="fa-solid fa-cloud fa-3x text-body-secondary" aria-hidden="true"></i>
      </div>
      <div class="text-body-secondary">
        {$_('pages.servers.backups.pano-backup.not-connected')}
      </div>
      <div>
        <a class="btn btn-sm btn-primary" href="{base}{CONNECT_PATH}">
          {$_('pages.servers.backups.pano-backup.connect')}
        </a>
      </div>
    </div>
  {:else if !backups.length}
    <div class="card-body">
      <NoContent
        icon="fa-solid fa-cloud fa-3x"
        text={settings.enabled
          ? $_('pages.servers.backups.pano-backup.empty-on')
          : $_('pages.servers.backups.pano-backup.empty-off')} />
    </div>
  {:else}
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th scope="col" class="text-nowrap"></th>
            <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-name')}</th>
            <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-created')}</th>
            <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-size')}</th>
            <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-status')}</th>
          </tr>
        </thead>
        <tbody>
          {#each pagedBackups as backup (backup.id)}
            <tr>
              <th scope="row" class="text-center">
                <div class="dropdown position-static">
                  <button
                    type="button"
                    class="btn btn-link"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label={$_('pages.servers.backups.column-actions')}
                    disabled={!canManage}>
                    {#if busyId === backup.id}
                      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    {:else}
                      <i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>
                    {/if}
                  </button>
                  <div class="dropdown-menu dropdown-menu-start">
                    <button
                      type="button"
                      class="dropdown-item text-capitalize"
                      disabled={backup.status !== 'DONE' || jobRunning}
                      onclick={() => askImport(backup)}>
                      <i class="fa-solid fa-cloud-arrow-down me-2" aria-hidden="true"></i>
                      {$_('pages.servers.backups.pano-backup.import')}
                    </button>
                    <button
                      type="button"
                      class="dropdown-item link-danger text-capitalize"
                      onclick={() => askDelete(backup)}>
                      <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                      {$_('buttons.delete')}
                    </button>
                  </div>
                </div>
              </th>
              <td class="text-break">
                {nameOf(backup) || $_('pages.servers.backups.pano-backup.unnamed')}
                <span class="badge text-bg-{isSnapshot(backup) ? 'info' : 'secondary'} ms-1">
                  {$_(
                    `pages.servers.backups.pano-backup.type-${isSnapshot(backup) ? 'snapshot' : 'archive'}`,
                  )}
                </span>
                {#if backup.manifest?.encrypted}
                  <i
                    class="fa-solid fa-lock text-body-secondary ms-1"
                    aria-label={$_('pages.servers.backups.pano-backup.encrypted')}
                    use:tooltip={[$_('pages.servers.backups.pano-backup.encrypted')]}></i>
                {/if}
              </td>
              <td class="text-nowrap">
                <DateComponent time={backup.createdAt} relativeFormat />
              </td>
              <td class="text-nowrap">{formatBytes(sizeOf(backup))}</td>
              <td>
                <span class="badge text-bg-{backup.status === 'DONE' ? 'success' : 'secondary'}">
                  {$_(
                    `pages.servers.backups.pano-backup.status-${String(backup.status).toLowerCase()}`,
                    { default: backup.status },
                  )}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card-footer">
      <Pagination
        page={pageOf(currentPage, backups.length, PAGE_SIZE)}
        on:firstPageClick={() => (currentPage = 1)}
        on:lastPageClick={() => (currentPage = lastPage)}
        on:pageLinkClick={(event) => (currentPage = event.detail.page)} />
    </div>
  {/if}
</div>

<!-- Whether and how this server's backups go to Pano Backup. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={settingsModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.servers.backups.pano-backup.settings-title')}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <form onsubmit={saveSettings}>
        <div class="modal-body vstack gap-3">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="serverPanoBackupEnabled"
              bind:checked={form.enabled} />
            <label class="form-check-label" for="serverPanoBackupEnabled">
              {$_('pages.servers.backups.pano-backup.enabled')}
            </label>
          </div>

          <div>
            <label class="form-label mb-1" for="serverPanoBackupMode">
              {$_('pages.servers.backups.pano-backup.mode')}
            </label>
            <select
              class="form-select"
              id="serverPanoBackupMode"
              disabled={!form.enabled}
              bind:value={form.mode}>
              <option value="FULL">{$_('pages.servers.backups.pano-backup.mode-full')}</option>
              <option value="SNAPSHOT">
                {$_('pages.servers.backups.pano-backup.mode-snapshot')}
              </option>
            </select>
            <div class="form-text">
              {$_(`pages.servers.backups.pano-backup.mode-${form.mode.toLowerCase()}-hint`)}
            </div>
          </div>

          <div>
            <label class="form-label mb-1" for="serverPanoBackupRetention">
              {$_('pages.servers.backups.pano-backup.retention')}
            </label>
            <div class="input-group">
              <select
                class="form-select"
                id="serverPanoBackupRetention"
                disabled={!form.enabled}
                bind:value={form.retention}>
                <option value="NONE">
                  {$_('pages.servers.backups.pano-backup.retention-none')}
                </option>
                <option value="COUNT">
                  {$_('pages.servers.backups.pano-backup.retention-count')}
                </option>
                <option value="DAYS">
                  {$_('pages.servers.backups.pano-backup.retention-days')}
                </option>
              </select>
              {#if form.retention === 'COUNT'}
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  max={MAX_KEEP_LAST}
                  aria-label={$_('pages.servers.backups.pano-backup.retention-count')}
                  disabled={!form.enabled}
                  bind:value={form.keepLast} />
                <span class="input-group-text">
                  {$_('pages.servers.backups.pano-backup.unit-backups')}
                </span>
              {:else if form.retention === 'DAYS'}
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  max={MAX_KEEP_DAYS}
                  aria-label={$_('pages.servers.backups.pano-backup.retention-days')}
                  disabled={!form.enabled}
                  bind:value={form.keepDays} />
                <span class="input-group-text">
                  {$_('pages.servers.backups.pano-backup.unit-days')}
                </span>
              {/if}
            </div>
            <div class="form-text">
              {$_('pages.servers.backups.pano-backup.retention-hint')}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={saving || !formValid}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- An encrypted copy and no passphrase saved on this Pano: the one it was made with is asked for. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={passphraseModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.servers.backups.pano-backup.import-title')}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <form onsubmit={submitPassphrase}>
        <div class="modal-body">
          <input
            class="form-control"
            type="password"
            autocomplete="off"
            placeholder={$_('pages.servers.backups.pano-backup.passphrase-placeholder')}
            bind:value={passphrase} />
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={!passphrase}>
            {$_('pages.servers.backups.pano-backup.import')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
  import { onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { formatBytes } from '$lib/string.util.js';
  import { CONNECT_PATH, isJobRunning } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { pageOf } from '$lib/components/pagination.util.js';
  import PanoBackupJobCard from '$lib/components/settings/pano-backup/PanoBackupJobCard.svelte';
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /** @type {{ serverId: number | null, canManage?: boolean }} */
  let { serverId, canManage = false } = $props();

  const PAGE_SIZE = 10;
  const MAX_KEEP_LAST = 500;
  const MAX_KEEP_DAYS = 3650;

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: false,
    mode: 'FULL',
    retention: 'COUNT',
    keepLast: 7,
    keepDays: 30,
  });

  let loading = $state(true);
  let loadFailed = $state(false);
  let connected = $state(false);
  let passphraseSet = $state(false);
  let settings = $state({ ...DEFAULT_SETTINGS });
  /** @type {Array<any>} */
  let backups = $state([]);
  let currentPage = $state(1);

  /** The import job this card started, followed until it ends. */
  let job = $state(/** @type {any} */ (null));
  let busyId = $state(null);

  let form = $state({ ...DEFAULT_SETTINGS });
  let saving = $state(false);
  let settingsModalElement = $state();
  let settingsModal;

  let passphrase = $state('');
  let passphraseTarget = $state(/** @type {any} */ (null));
  let passphraseModalElement = $state();
  let passphraseModal;

  const lastPage = $derived(Math.max(1, Math.ceil(backups.length / PAGE_SIZE)));
  const pagedBackups = $derived(
    backups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  );
  const jobRunning = $derived(isJobRunning(job));
  const formValid = $derived(
    form.retention === 'COUNT'
      ? Number(form.keepLast) >= 1 && Number(form.keepLast) <= MAX_KEEP_LAST
      : form.retention === 'DAYS'
        ? Number(form.keepDays) >= 1 && Number(form.keepDays) <= MAX_KEEP_DAYS
        : true,
  );

  $effect(() => {
    if (currentPage > lastPage) {
      currentPage = lastPage;
    }
  });

  // Read again whenever the route moves to another server.
  $effect(() => {
    const id = serverId;

    untrack(() => {
      if (id != null) {
        void load();
      }
    });
  });

  async function load() {
    if (serverId == null) {
      return;
    }

    const id = serverId;
    const body = await ApiUtil.get({
      path: `/panel/servers/${id}/backups/pano-backup`,
      handler: (response) => response,
    }).catch(() => null);

    if (id !== serverId) {
      return;
    }

    loading = false;

    if (!body || body.error) {
      loadFailed = true;

      return;
    }

    loadFailed = false;
    connected = body.connected === true;
    passphraseSet = body.passphraseSet === true;
    settings = { ...DEFAULT_SETTINGS, ...(body.settings || {}) };
    backups = Array.isArray(body.backups) ? body.backups : [];
  }

  function openSettings() {
    form = { ...settings };
    settingsModal?.show();
  }

  /** @param {SubmitEvent} event */
  async function saveSettings(event) {
    event.preventDefault();

    if (saving || !formValid || serverId == null) {
      return;
    }

    saving = true;

    const body = await ApiUtil.put({
      path: `/panel/servers/${serverId}/backups/pano-backup`,
      body: {
        enabled: form.enabled,
        mode: form.mode,
        retention: form.retention,
        keepLast: Number(form.keepLast),
        keepDays: Number(form.keepDays),
      },
      handler: (response) => response,
    }).catch(() => null);

    saving = false;

    if (!body || body.error) {
      const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

      void showError(error.key, error.values);

      return;
    }

    settings = { ...DEFAULT_SETTINGS, ...(body.settings || {}) };
    settingsModal?.hide();

    void showSuccess('pages.servers.backups.pano-backup.saved');
  }

  /** @param {any} backup a row of this server's copies: an archive or a snapshot (`type`). */
  function isSnapshot(backup) {
    return backup?.type === 'snapshot';
  }

  /** @param {any} backup */
  function nameOf(backup) {
    return isSnapshot(backup) ? backup.name : backup.manifest?.backupName;
  }

  /** What a copy takes to download: an archive's size, a snapshot's rebuilt zip. */
  function sizeOf(backup) {
    return Number(isSnapshot(backup) ? backup.downloadBytes : backup.sizeBytes) || 0;
  }

  /** @param {any} backup */
  function askImport(backup) {
    if (!isSnapshot(backup) && backup.manifest?.encrypted && !passphraseSet) {
      passphrase = '';
      passphraseTarget = backup;
      passphraseModal?.show();

      return;
    }

    void startImport(backup, null);
  }

  /** @param {SubmitEvent} event */
  function submitPassphrase(event) {
    event.preventDefault();

    const target = passphraseTarget;

    passphraseModal?.hide();

    if (target) {
      void startImport(target, passphrase);
    }

    passphrase = '';
  }

  /**
   * @param {any} backup
   * @param {string | null} typed the passphrase asked for, or null for the one saved on this Pano.
   */
  async function startImport(backup, typed) {
    if (serverId == null || busyId) {
      return;
    }

    busyId = backup.id;

    const body = await ApiUtil.post({
      path: `/panel/servers/${serverId}/backups/pano-backup/import`,
      body: {
        remoteId: backup.id,
        type: isSnapshot(backup) ? 'snapshot' : 'archive',
        ...(typed ? { passphrase: typed } : {}),
      },
      handler: (response) => response,
    }).catch(() => null);

    busyId = null;

    if (!body || body.error) {
      const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

      void showError(error.key, error.values);

      return;
    }

    job = body.job;
  }

  /** @param {any} ended */
  function onJobFinished(ended) {
    job = ended?.status === 'DONE' ? null : ended;
  }

  /** @param {any} backup */
  function askDelete(backup) {
    showConfirmActionModal(
      {
        title: 'pages.servers.backups.pano-backup.delete-title',
        description: 'pages.servers.backups.pano-backup.delete-description',
        confirmLabel: 'buttons.delete',
      },
      async () => {
        const body = await ApiUtil.delete({
          path: `/panel/pano-backups/remote/${isSnapshot(backup) ? 'snapshots' : 'backups'}/${encodeURIComponent(backup.id)}`,
          handler: (response) => response,
        }).catch(() => null);

        if (!body || body.error) {
          const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

          void showError(error.key, error.values);

          return;
        }

        await load();
      },
    );
  }

  onMount(() => {
    settingsModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(settingsModalElement)
      : null;
    passphraseModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(passphraseModalElement)
      : null;

    return () => {
      settingsModal?.hide();
      passphraseModal?.hide();
    };
  });
</script>
