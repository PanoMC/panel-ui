<style>
  .sha-value {
    max-width: 12ch;
  }

  .retention-input {
    max-width: 7rem;
  }

  .retention-label {
    min-width: 13rem;
  }

  .retention-cap {
    max-width: 9rem;
  }
</style>

<!-- SM-33 — the backups of one server (§2.4.4, §2.4.17). Creating and restoring are tasks on
     whichever side Pano picked, so the page follows their `taskProgress` frames and re-reads the
     list on the `backups` nudge. -->
<div class="container vstack gap-3">
  <ServerCapabilityNotice
    server={$server}
    feature="backups.create"
    section="components.server-navigation-menu.backups" />

  <!-- §2.4.35 — while nothing can take a backup the notice above is the whole page: the list
       comes from the same side, so its "could not be loaded" state would only repeat it. -->
  {#if available}
    <div class="card">
      <CardHeader>
        <span slot="left" class="d-flex align-items-center gap-2">
          {$_('pages.servers.backups.title')}
          <span class="badge rounded-pill text-bg-secondary">
            {$_('pages.servers.backups.count', { values: { count: backups.length } })}
          </span>
        </span>
      </CardHeader>

      <div class="card-body vstack gap-3">
        <div class="small text-body-secondary">{$_('pages.servers.backups.description')}</div>

        {#if canManage}
          <div>
            <button
              type="button"
              class="btn btn-primary"
              disabled={creating || !!runningTask}
              onclick={openCreate}>
              {#if creating || runningTask?.kind === 'BACKUP'}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {:else}
                <i class="fa-solid fa-box-archive me-1" aria-hidden="true"></i>
              {/if}
              {$_('pages.servers.backups.create')}
            </button>
          </div>
        {/if}

        {#if activeTask}
          <div>
            <div class="d-flex justify-content-between small text-body-secondary">
              <span>
                {$_(
                  activeTask.kind === 'RESTORE'
                    ? 'pages.servers.backups.task-restore'
                    : 'pages.servers.backups.task-backup',
                )}
                {#if activeTask.message}
                  <span class="text-break">&middot; {activeTask.message}</span>
                {/if}
              </span>
              <span class="font-monospace">{taskPercent}%</span>
            </div>
            <div
              class="progress mt-1"
              style="height: 6px;"
              role="progressbar"
              aria-label={$_('pages.servers.backups.task-backup')}
              aria-valuenow={taskPercent}
              aria-valuemin="1"
              aria-valuemax="100">
              <div
                class="progress-bar progress-bar-striped"
                class:progress-bar-animated={activeTask.status !== 'FAILED'}
                class:bg-danger={activeTask.status === 'FAILED'}
                style="width: {taskPercent}%;">
              </div>
            </div>
          </div>
        {/if}

        {#if canManage && retentionSupported}
          <!-- One rule per kind: full zips are counted, snapshots are counted and may also be capped
             by what the repository takes on disk. A pinned backup is never removed by either. -->
          <div class="vstack gap-2">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <label class="form-label m-0 retention-label" for="backupRetention">
                <i class="fa-solid fa-file-zipper me-1" aria-hidden="true"></i>
                {$_('pages.servers.backups.retention-full-label')}
              </label>
              <input
                id="backupRetention"
                type="number"
                class="form-control form-control-sm retention-input"
                min="1"
                max="100"
                bind:value={keepLast} />
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2">
              <label class="form-label m-0 retention-label" for="snapshotRetention">
                <i class="fa-solid fa-layer-group me-1" aria-hidden="true"></i>
                {$_('pages.servers.backups.retention-snapshot-label')}
              </label>
              <input
                id="snapshotRetention"
                type="number"
                class="form-control form-control-sm retention-input"
                min="1"
                max="500"
                bind:value={snapshotKeepLast} />
              <label class="form-label m-0 ms-md-2" for="snapshotCap">
                {$_('pages.servers.backups.retention-cap-label')}
              </label>
              <div class="input-group input-group-sm retention-cap">
                <input
                  id="snapshotCap"
                  type="number"
                  class="form-control"
                  min="0"
                  step="0.5"
                  placeholder={$_('pages.servers.backups.retention-cap-none')}
                  bind:value={snapshotCapGb} />
                <span class="input-group-text">GB</span>
              </div>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                disabled={savingRetention}
                onclick={() => void saveRetention()}>
                {#if savingRetention}
                  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {/if}
                {$_('buttons.save')}
              </button>
              <span class="form-text m-0">{$_('pages.servers.backups.retention-hint')}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="card">
      {#if loading}
        <div class="card-body d-flex justify-content-center py-5">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else if listError}
        <div class="card-body text-center vstack gap-3 py-5">
          <div>
            <i class="fa-solid fa-box-archive fa-3x text-body-secondary" aria-hidden="true"></i>
          </div>
          <div class="text-body-secondary">{$_(listError)}</div>
          <div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              onclick={() => void loadBackups()}>
              {$_('buttons.refresh')}
            </button>
          </div>
        </div>
      {:else if !backups.length}
        <div class="card-body">
          <NoContent
            icon="fa-solid fa-box-archive fa-3x"
            text={$_('pages.servers.backups.empty')} />
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-name')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-size')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.backups.column-created')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.backups.column-creator')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.backups.column-status')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.backups.column-checksum')}</th>
                <th scope="col" class="text-end text-nowrap"
                  >{$_('pages.servers.backups.column-actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each backups as backup (backup.id)}
                <tr>
                  <th scope="row" class="fw-semibold text-break">
                    <span class="d-flex flex-wrap align-items-center gap-1">
                      {#if backup.pinned}
                        <i
                          class="fa-solid fa-thumbtack text-warning me-1"
                          role="img"
                          aria-label={$_('pages.servers.backups.pinned')}
                          use:tooltip={[
                            $_('pages.servers.backups.pinned-hint'),
                            { placement: 'top' },
                          ]}></i>
                      {/if}
                      {backup.name}
                      <span
                        class="badge fw-normal {backup.mode === 'SNAPSHOT'
                          ? 'text-bg-info'
                          : 'text-bg-secondary'}">
                        <i
                          class="fa-solid {backup.mode === 'SNAPSHOT'
                            ? 'fa-layer-group'
                            : 'fa-file-zipper'} me-1"
                          aria-hidden="true"></i>
                        {$_(`components.backup-options.mode-${backup.mode.toLowerCase()}`)}
                      </span>
                      {#if backup.scope !== 'ALL'}
                        <span
                          class="badge text-bg-dark fw-normal"
                          use:tooltip={[
                            backup.scope === 'CUSTOM' ? backup.include.join(', ') : '',
                            { placement: 'top' },
                          ]}>
                          {$_(`components.backup-options.scope-${backup.scope.toLowerCase()}`)}
                        </span>
                      {/if}
                    </span>
                  </th>
                  <td class="text-nowrap font-monospace small">
                    {formatBytes(backup.sizeBytes, 1)}
                    {#if backup.mode === 'SNAPSHOT' && backup.storedBytes != null}
                      <span
                        class="d-block text-body-secondary"
                        use:tooltip={[
                          $_('pages.servers.backups.stored-hint'),
                          { placement: 'top' },
                        ]}>
                        +{formatBytes(backup.storedBytes, 1)}
                      </span>
                    {/if}
                  </td>
                  <td class="text-nowrap small">
                    {#if backup.createdAt}
                      <DateComponent time={backup.createdAt} relativeFormat />
                    {:else}
                      —
                    {/if}
                  </td>
                  <td class="small text-body-secondary text-break">
                    {backup.createdBy || $_('pages.servers.backups.creator-unknown')}
                  </td>
                  <td>
                    <span class="badge rounded-pill text-bg-{statusColour(backup.status)}">
                      {statusLabel(backup.status)}
                    </span>
                  </td>
                  <td>
                    {#if backup.sha256}
                      <button
                        type="button"
                        class="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1"
                        onclick={() => copyChecksum(backup)}
                        use:tooltip={[
                          copiedId === backup.id
                            ? $_('components.modals.connect-server.copied')
                            : $_('pages.servers.backups.copy-checksum'),
                          { placement: 'top', hideOnClick: false },
                        ]}>
                        <code class="sha-value text-truncate d-inline-block">{backup.sha256}</code>
                        <i class="fa-regular fa-copy small" aria-hidden="true"></i>
                      </button>
                    {:else}
                      <span class="text-body-secondary">—</span>
                    {/if}
                  </td>
                  <td class="text-end">
                    <span class="dropdown position-static">
                      <button
                        type="button"
                        class="btn btn-link btn-sm"
                        aria-expanded="false"
                        aria-haspopup="true"
                        data-bs-toggle="dropdown"
                        disabled={busyId === backup.id}
                        aria-label={$_('pages.servers.backups.column-actions')}>
                        {#if busyId === backup.id}
                          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        {:else}
                          <span class="fas fa-ellipsis-v"></span>
                        {/if}
                      </button>
                      <div class="dropdown-menu dropdown-menu-end">
                        <button
                          type="button"
                          class="dropdown-item"
                          onclick={() => download(backup)}>
                          <i class="fa-solid fa-download me-2" aria-hidden="true"></i>
                          {$_('buttons.download')}
                        </button>

                        {#if canUploadToPanoBackup && backup.mode !== 'SNAPSHOT' && String(backup.status || '').toUpperCase() === 'READY'}
                          <button
                            type="button"
                            class="dropdown-item"
                            onclick={() => void uploadToPanoBackup(backup)}>
                            <i class="fa-solid fa-cloud-arrow-up me-2" aria-hidden="true"></i>
                            {$_('pages.servers.backups.pano-backup-upload')}
                          </button>
                        {/if}

                        {#if canManage}
                          <button
                            type="button"
                            class="dropdown-item"
                            onclick={() => void togglePin(backup)}>
                            <i class="fa-solid fa-thumbtack me-2" aria-hidden="true"></i>
                            {backup.pinned
                              ? $_('pages.servers.backups.unpin')
                              : $_('pages.servers.backups.pin')}
                          </button>
                          <button
                            type="button"
                            class="dropdown-item"
                            disabled={!!restoreBlockedReason || !!runningTask}
                            onclick={() => askRestore(backup)}>
                            <i class="fa-solid fa-clock-rotate-left me-2" aria-hidden="true"></i>
                            {$_('pages.servers.backups.restore')}
                          </button>

                          <div class="dropdown-divider"></div>
                          <button
                            type="button"
                            class="dropdown-item text-danger"
                            onclick={() => askDelete(backup)}>
                            <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                            {$_('buttons.delete')}
                          </button>
                        {/if}
                      </div>
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if restoreBlockedReason}
          <div class="card-footer small text-body-secondary">
            <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
            {$_(restoreBlockedReason, { values: { section: $_(SECTION_KEY) } })}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={createModalElement}>
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <form
        onsubmit={(event) => {
          event.preventDefault();
          void createBackup();
        }}>
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa-solid fa-box-archive me-2" aria-hidden="true"></i>
            {$_('pages.servers.backups.create')}
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label={$_('buttons.close')}></button>
        </div>
        <div class="modal-body vstack gap-3">
          <div>
            <label class="form-label" for="backupName">
              {$_('pages.servers.backups.name-label')}
            </label>
            <input
              id="backupName"
              type="text"
              class="form-control"
              maxlength="64"
              placeholder={$_('pages.servers.backups.name-placeholder')}
              bind:value={createName} />
            <div class="form-text">{$_('pages.servers.backups.name-hint')}</div>
          </div>

          <BackupOptions
            bind:value={createOptions}
            worlds={worldsPreview}
            idPrefix="create-backup" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-link m-0" data-bs-dismiss="modal">
            {$_('buttons.cancel')}
          </button>
          <button
            type="submit"
            class="btn btn-primary m-0"
            disabled={creating || !!runningTask || !backupOptionsValid(createOptions)}>
            {#if creating}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('pages.servers.backups.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Restoring overwrites the server directory, so it asks for the account password (§2.7). -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={restoreModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <form
        onsubmit={(event) => {
          event.preventDefault();
          void confirmRestore();
        }}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-danger"></i>
          </div>
          <h5 class="mb-2">{$_('pages.servers.backups.restore-title')}</h5>
          <div class="text-body-secondary">
            {$_('pages.servers.backups.restore-description', {
              values: { name: targetBackup?.name || '' },
            })}
          </div>
          <div class="text-body-secondary small mt-2">
            {$_('pages.servers.backups.restore-worlds-replaced')}
          </div>
          {#if restoreOnNextStart}
            <div class="text-body-secondary mt-2">
              {$_('pages.servers.backups.restore-next-start')}
            </div>
          {/if}
          <!-- Only while the dialog is open: the reason can arrive while it is (the server was
               started meanwhile), and a closed dialog must not hold a second copy of the
               page's notice. -->
          {#if restoreOpen && restoreBlockedReason}
            <div class="alert alert-warning mt-3 mb-0 small" role="alert">
              {$_(restoreBlockedReason, { values: { section: $_(SECTION_KEY) } })}
            </div>
          {/if}
          <input
            class="form-control mt-3"
            type="password"
            autocomplete="current-password"
            placeholder={$_('pages.servers.backups.password-placeholder')}
            bind:value={currentPassword}
            bind:this={restorePasswordInput}
            class:border-danger={passwordError} />
        </div>
        <div class="modal-footer flex-nowrap">
          <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
            {$_('buttons.cancel')}
          </button>
          <button
            type="submit"
            class="btn btn-danger col-6 m-0"
            disabled={!currentPassword.length || !!busyId || !!restoreBlockedReason}>
            {#if busyId}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('pages.servers.backups.restore')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={deleteModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <form
        onsubmit={(event) => {
          event.preventDefault();
          void confirmDelete();
        }}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-danger"></i>
          </div>
          <h5 class="mb-2">{$_('pages.servers.backups.delete-title')}</h5>
          <div class="text-body-secondary">
            {$_('pages.servers.backups.delete-description', {
              values: { name: targetBackup?.name || '' },
            })}
          </div>
          <input
            class="form-control mt-3"
            type="password"
            autocomplete="current-password"
            placeholder={$_('pages.servers.backups.password-placeholder')}
            bind:value={currentPassword}
            bind:this={deletePasswordInput}
            class:border-danger={passwordError} />
        </div>
        <div class="modal-footer flex-nowrap">
          <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
            {$_('buttons.cancel')}
          </button>
          <button
            type="submit"
            class="btn btn-danger col-6 m-0"
            disabled={!currentPassword.length || !!busyId}>
            {#if busyId}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('buttons.delete')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<a class="d-none" bind:this={downloadAnchor} href={base} tabindex="-1" aria-hidden="true">
  {$_('buttons.download')}
</a>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { featureSource, fetchServerBackups, hasFeature } from '$lib/servers.util.js';

  /** Backup statuses the panel has a label for; anything else is shown as the raw code. */
  const KNOWN_STATUSES = Object.freeze([
    'PENDING',
    'RUNNING',
    'READY',
    'FAILED',
    'RESTORING',
    // §2.4.17 — a restore the plugin will apply the next time the server boots.
    'PENDING_RESTART',
    'DELETING',
  ]);

  /** Bootstrap contextual colour per status. */
  const STATUS_COLOURS = Object.freeze({
    PENDING: 'info',
    RUNNING: 'info',
    READY: 'success',
    FAILED: 'danger',
    RESTORING: 'warning',
    PENDING_RESTART: 'warning',
    DELETING: 'secondary',
  });

  /**
   * Backups need somebody that can zip the server directory — the node, or a protocol-2 plugin
   * from the inside (§2.4.17). A server that can never have either (or an admin without
   * `MANAGE_SERVER_BACKUPS`) goes back to the overview.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { server, user } = await parent();

    const listed =
      hasFeature(server, 'backups.create') || featureSource(server, 'backups.create') === null;

    if (!listed || !hasPermission(Permissions.MANAGE_SERVER_BACKUPS, user)) {
      throw redirect(302, `${base}/servers/${params.id}`);
    }

    // The list comes with the page. A node that cannot be reached, or a build without the
    // endpoint, is a status the page renders — never a reason not to open it.
    return {
      serverId: Number(params.id),
      serverBackups: await fetchServerBackups(params.id, event),
    };
  }
</script>

<script>
  /**
   * SM-33 — create, download, restore and delete the backups of a managed server.
   *
   * Creating and restoring are node tasks: the REST call only answers with `{ backupId,
   * taskId }` and the work is reported through `taskProgress` frames, so the page shows the
   * progress inline and re-reads the list when the task is done — or when the hub sends the
   * `backups` nudge, which also covers a backup someone else started.
   */
  import { getContext, onDestroy, onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { browser } from '$app/environment';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { formatBytes } from '$lib/string.util.js';
  import {
    featureUnavailableReason,
    featureValue,
    getProcessState,
    isEndpointUnavailable,
    ProcessStates,
    showServerActionError,
    showServerLoadError,
  } from '$lib/servers.util.js';
  import { onServerBackupsChanged, onTaskProgress } from '$lib/panelRealtime.js';
  import { describeError } from '$lib/pano-backup.util.js';

  import BackupOptions, {
    backupOptionsPayload,
    backupOptionsValid,
    defaultBackupOptions,
  } from '$lib/components/servers/BackupOptions.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { data } = $props();

  const server = getContext('server');

  /** The section's own name, for the sentences that take a `{section}`. */
  const SECTION_KEY = 'components.server-navigation-menu.backups';

  const hasPermissionToManage = hasPermission(Permissions.MANAGE_SERVER_BACKUPS);
  /** A FULL backup can also be sent to Pano Backup (panomc.com), E2E-encrypted. */
  const canUploadToPanoBackup =
    hasPermissionToManage && hasPermission(Permissions.MANAGE_PANO_BACKUPS);

  /** @type {Array<object>} */
  let backups = $state([]);
  /** Only ever true for a *re*-read: the first list comes in with the page (`load`). */
  let loading = $state(false);
  let listError = $state('');
  let createName = $state('');
  let creating = $state(false);
  /** The id of the backup whose request is in flight, so only its own row spins. */
  let busyId = $state(null);
  let targetBackup = $state(null);
  let currentPassword = $state('');
  let passwordError = $state(false);
  let copiedId = $state(null);
  /** The latest BACKUP/RESTORE `taskProgress` frame for this server. */
  let activeTask = $state(null);
  let keepLast = $state(10);
  let snapshotKeepLast = $state(24);
  /** The snapshot repository's disk cap in GB; empty is "no cap". */
  let snapshotCapGb = $state(/** @type {number | null} */ (null));
  let createOptions = $state(defaultBackupOptions());
  /** What the WORLDS scope would take, asked for when the dialog opens; null until known. */
  let worldsPreview = $state(/** @type {string[] | null} */ (null));
  let createModalElement = $state();
  let createModal;
  /** Cleared when the retention endpoint answers 404 — it is optional in the contract. */
  let retentionSupported = $state(true);
  let savingRetention = $state(false);

  let restoreModalElement = $state();
  /** Whether the restore dialog is on screen, between `askRestore` and its `hidden` event. */
  let restoreOpen = $state(false);
  let deleteModalElement = $state();
  let restorePasswordInput = $state();
  let deletePasswordInput = $state();
  let downloadAnchor = $state();

  let restoreModal;
  let deleteModal;
  let hydratedId = null;
  let listSeq = 0;
  let copiedTimeout;

  const serverId = $derived($server?.id ?? null);
  const taskPercent = $derived(
    Math.max(0, Math.min(100, Math.round(Number(activeTask?.percent) || 0))),
  );
  const runningTask = $derived(activeTask?.status === 'RUNNING' ? activeTask : null);
  /** Whether anything can take (and so list) a backup right now — the page's own feature. */
  const available = $derived(hasFeature($server, 'backups.create'));
  const canManage = $derived(hasPermissionToManage && available);
  /**
   * §2.4.17 — the node restores into a stopped server directory (`live`), while the plugin
   * leaves a marker and applies it on the next boot (`next-start`), which needs no stop at all.
   * A backend with no `features` is the node rule this page has always used.
   */
  const restoreSource = $derived(featureSource($server, 'backups.restore'));
  const restoreMode = $derived(featureValue($server, 'backups.restoreMode'));
  const restoreOnNextStart = $derived(restoreMode === 'next-start');
  const restoreBlockedReason = $derived(
    restoreSource === null
      ? featureUnavailableReason($server, 'backups.restore')
      : restoreOnNextStart || getProcessState($server) === ProcessStates.STOPPED
        ? ''
        : 'pages.servers.backups.restore-needs-stop',
  );

  // Called once here so the very first render — SSR included — already is the finished list,
  // and again from the effect below when the route moves to another server.
  untrack(() => hydrate(Number(data?.serverId ?? serverId)));

  $effect(() => {
    // Only these two say "this is another server now"; everything the hydrate itself touches is
    // deliberately left untracked.
    const id = Number(data?.serverId ?? serverId);

    untrack(() => hydrate(id));
  });

  /** `null` until the effect below has seen the first answer, so opening the page never re-reads. */
  let wasAvailable = null;

  // The list read while nothing could serve it was refused; once something can again (the node
  // reconnected, the plugin is back), it is read afresh instead of showing that refusal.
  $effect(() => {
    const now = available;

    untrack(() => {
      if (now && wasAvailable === false) {
        void loadBackups();
      }

      wasAvailable = now;
    });
  });

  /**
   * @param {unknown} status
   * @returns {string} the label of a backup status — translated when the panel knows it.
   */
  function statusLabel(status) {
    const code = String(status || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '');

    if (!code) {
      return '—';
    }

    return KNOWN_STATUSES.includes(code)
      ? $_(`pages.servers.backups.status-${code.toLowerCase()}`)
      : code;
  }

  /**
   * @param {unknown} status
   * @returns {string}
   */
  function statusColour(status) {
    return STATUS_COLOURS[String(status || '').toUpperCase()] || 'secondary';
  }

  /**
   * Puts one {@link fetchServerBackups} answer on screen.
   *
   * @param {Awaited<ReturnType<typeof fetchServerBackups>>} result
   */
  function applyBackups(result) {
    if (result.status === 'unavailable') {
      listError = 'pages.servers.errors.unavailable';
      backups = [];
      retentionSupported = false;

      return;
    }

    // `network` means the request never completed — ApiUtil already raised the offline splash.
    if (result.status !== 'ok') {
      listError = 'pages.servers.backups.list-failed';
      backups = [];

      return;
    }

    listError = '';
    backups = result.backups;

    if (result.keepLast != null) {
      keepLast = result.keepLast;
    }

    if (result.snapshotKeepLast != null) {
      snapshotKeepLast = result.snapshotKeepLast;
    }

    snapshotCapGb =
      Number(result.snapshotMaxBytes) > 0
        ? Math.round((Number(result.snapshotMaxBytes) / 1024 ** 3) * 10) / 10
        : null;
  }

  /**
   * The list `load` fetched, applied once per server.
   *
   * @param {number} id the server the current `data` belongs to.
   */
  function hydrate(id) {
    if (!Number.isFinite(id) || hydratedId === id) {
      return;
    }

    hydratedId = id;
    // Whatever re-read is still in flight belongs to the server that was open a moment ago.
    listSeq += 1;
    loading = false;

    const result = data?.serverBackups;

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadBackups();
      }

      return;
    }

    applyBackups(result);

    // The list itself says "this failed"; the toast is what names *why* — unless it is a
    // state (node offline, feature unavailable...), which the notice explains (§2.4.35).
    if (browser && result.status === 'error') {
      showServerLoadError(result.error, id);
    }
  }

  /** Re-reads the list after a task or a `backups` nudge; the spinner is for these only. */
  async function loadBackups() {
    if (serverId == null) {
      return;
    }

    const sequence = ++listSeq;

    loading = true;
    listError = '';

    const result = await fetchServerBackups(serverId);

    if (sequence !== listSeq) {
      return;
    }

    loading = false;
    applyBackups(result);

    if (result.status === 'error') {
      showServerLoadError(result.error, serverId);
    }
  }

  function openCreate() {
    if (!canManage) {
      return;
    }

    createModal?.show();

    if (worldsPreview == null) {
      void loadWorldsPreview();
    }
  }

  /**
   * What "Worlds only" would take here. Optional: a backend or source that cannot answer leaves
   * the hint out rather than claiming there are no worlds.
   */
  async function loadWorldsPreview() {
    const body = await ApiUtil.get({
      path: `/api/panel/servers/${serverId}/backups/worlds`,
      handler: (response) => response,
    });

    if (body && !body.error && Array.isArray(body.worlds)) {
      worldsPreview = body.worlds.map((world) => String(world));
    }
  }

  /**
   * @param {object} backup
   */
  async function togglePin(backup) {
    if (!canManage || busyId || serverId == null) {
      return;
    }

    busyId = backup.id;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/backups/${encodeURIComponent(backup.id)}/pin`,
        body: { pinned: !backup.pinned },
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'backups.create' });

        return;
      }

      backups = backups.map((entry) =>
        entry.id === backup.id ? { ...entry, pinned: !backup.pinned } : entry,
      );
    } finally {
      busyId = null;
    }
  }

  async function createBackup() {
    if (!canManage || creating || serverId == null || !backupOptionsValid(createOptions)) {
      return;
    }

    creating = true;

    try {
      const name = createName.trim();
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/backups`,
        body: { ...(name ? { name } : {}), ...backupOptionsPayload(createOptions) },
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'backups.create' });

        return;
      }

      createName = '';
      createModal?.hide();
      // The node reports the real work through `taskProgress`; this is only the first frame
      // so the bar appears before the node has said anything.
      activeTask = {
        taskId: body.taskId == null ? '' : String(body.taskId),
        kind: 'BACKUP',
        status: 'RUNNING',
        percent: 0,
        message: '',
      };

      void showSuccess('pages.servers.backups.create-started');
      await loadBackups();
    } finally {
      creating = false;
    }
  }

  /**
   * @param {object} backup
   */
  function download(backup) {
    if (!downloadAnchor || serverId == null) {
      return;
    }

    downloadAnchor.href = `/api/panel/servers/${serverId}/backups/${encodeURIComponent(backup.id)}/download`;
    downloadAnchor.download = `${backup.name || backup.id}.zip`;
    downloadAnchor.click();
  }

  /**
   * Sends one FULL backup to Pano Backup; the platform runs it as a Pano backup job (progress on
   * the Backups settings page).
   *
   * @param {object} backup
   */
  async function uploadToPanoBackup(backup) {
    if (!canUploadToPanoBackup || serverId == null || busyId) {
      return;
    }

    busyId = backup.id;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/backups/${encodeURIComponent(backup.id)}/pano-backup`,
        handler: (response) => response,
      });

      if (!body || body.error) {
        const error = describeError(body || { error: 'NETWORK_ERROR' });

        void showError(error.key, error.values);

        return;
      }

      void showSuccess('pages.servers.backups.pano-backup-started');
    } finally {
      busyId = null;
    }
  }

  /**
   * @param {object} backup
   */
  function copyChecksum(backup) {
    copy(backup.sha256);
    copiedId = backup.id;

    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copiedId = null), 2000);
  }

  /**
   * @param {object} backup
   */
  function askRestore(backup) {
    if (!canManage || restoreBlockedReason) {
      return;
    }

    targetBackup = backup;
    currentPassword = '';
    passwordError = false;
    restoreOpen = true;
    restoreModal?.show();
  }

  /**
   * @param {object} backup
   */
  function askDelete(backup) {
    if (!canManage) {
      return;
    }

    targetBackup = backup;
    currentPassword = '';
    passwordError = false;
    deleteModal?.show();
  }

  /**
   * Both destructive actions take the same shape: a password-carrying POST on one backup.
   *
   * @param {string} action `restore` or `delete`.
   * @returns {Promise<object | null>} the response body when it worked.
   */
  async function postOnBackup(action) {
    if (!canManage || !targetBackup || serverId == null || busyId) {
      return null;
    }

    busyId = targetBackup.id;
    passwordError = false;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/backups/${encodeURIComponent(targetBackup.id)}/${action}`,
        body: { currentPassword },
        handler: (response) => response,
      });

      if (!body) {
        return null;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return null;
      }

      if (body.error) {
        passwordError =
          body.error === 'WRONG_PASSWORD' || body.error === 'CURRENT_PASSWORD_NOT_CORRECT';

        showServerActionError(body.error, body, {
          server: $server,
          feature: action === 'restore' ? 'backups.restore' : 'backups.create',
        });

        return null;
      }

      return body;
    } finally {
      busyId = null;
      currentPassword = '';
    }
  }

  async function confirmRestore() {
    const body = await postOnBackup('restore');

    if (!body) {
      return;
    }

    activeTask = {
      taskId: body.taskId == null ? '' : String(body.taskId),
      kind: 'RESTORE',
      status: 'RUNNING',
      percent: 0,
      message: '',
    };

    restoreModal?.hide();
    void showSuccess('pages.servers.backups.restore-started');
    await loadBackups();
  }

  async function confirmDelete() {
    const body = await postOnBackup('delete');

    if (!body) {
      return;
    }

    deleteModal?.hide();
    void showSuccess('pages.servers.backups.deleted', { name: targetBackup?.name || '' });
    await loadBackups();
  }

  /**
   * Retention is optional in the contract, so a build without it answers 404 (which comes
   * back as the proxy's HTML page): the control is then hidden instead of erroring.
   */
  async function saveRetention() {
    if (!canManage || savingRetention || serverId == null) {
      return;
    }

    savingRetention = true;

    try {
      const body = await ApiUtil.put({
        path: `/api/panel/servers/${serverId}/backups/settings`,
        body: {
          keepLast: Math.max(1, Number(keepLast) || 1),
          snapshotKeepLast: Math.max(1, Number(snapshotKeepLast) || 1),
          // GB in the field, bytes on the wire; empty or 0 lifts the cap.
          snapshotMaxBytes:
            Number(snapshotCapGb) > 0 ? Math.round(Number(snapshotCapGb) * 1024 ** 3) : 0,
        },
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        retentionSupported = false;
        void showError('pages.servers.backups.retention-unavailable');

        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'backups.create' });

        return;
      }

      void showSuccess('pages.servers.backups.retention-saved');
    } finally {
      savingRetention = false;
    }
  }

  function focusRestorePassword() {
    restorePasswordInput?.focus();
  }

  function onRestoreHidden() {
    restoreOpen = false;
  }

  function focusDeletePassword() {
    deletePasswordInput?.focus();
  }

  onMount(() => {
    restoreModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(restoreModalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;
    createModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(createModalElement)
      : null;
    deleteModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(deleteModalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    restoreModalElement?.addEventListener('shown.bs.modal', focusRestorePassword);
    restoreModalElement?.addEventListener('hidden.bs.modal', onRestoreHidden);
    deleteModalElement?.addEventListener('shown.bs.modal', focusDeletePassword);

    const offTask = onTaskProgress((frame) => {
      if (serverId == null || Number(frame.serverId) !== Number(serverId)) {
        return;
      }

      if (frame.kind !== 'BACKUP' && frame.kind !== 'RESTORE') {
        return;
      }

      activeTask = frame;

      if (frame.status === 'DONE' || frame.status === 'PENDING_RESTART') {
        void showSuccess(
          frame.status === 'PENDING_RESTART'
            ? 'pages.servers.backups.restore-next-start'
            : frame.kind === 'RESTORE'
              ? 'pages.servers.backups.restore-done'
              : 'pages.servers.backups.create-done',
        );
        activeTask = null;
        void loadBackups();

        return;
      }

      if (frame.status === 'FAILED') {
        void showError('pages.servers.backups.task-failed', { error: frame.error || '' });
      }
    });

    const offBackups = onServerBackupsChanged((frame) => {
      if (serverId == null || Number(frame.serverId) !== Number(serverId)) {
        return;
      }

      void loadBackups();
    });

    return () => {
      restoreModalElement?.removeEventListener('shown.bs.modal', focusRestorePassword);
      restoreModalElement?.removeEventListener('hidden.bs.modal', onRestoreHidden);
      deleteModalElement?.removeEventListener('shown.bs.modal', focusDeletePassword);
      offTask();
      offBackups();
    };
  });

  onDestroy(() => {
    listSeq += 1;
    clearTimeout(copiedTimeout);
    restoreModal?.hide();
    deleteModal?.hide();
    restoreModal = null;
    deleteModal = null;
  });
</script>
