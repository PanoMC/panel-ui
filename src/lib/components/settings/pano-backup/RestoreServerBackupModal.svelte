<!-- SM-PB — restores a managed server from a copy in Pano Backup: the server it was taken from by default, any other
     managed server when that one is gone. The copy is brought into the server's backups first, then the server is
     restored from it the way its Backups page does (account password, a stopped server). -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.servers.backups.pano-backup.restore-title')}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <form onsubmit={submit}>
        <div class="modal-body vstack gap-3">
          {#if loadingServers}
            <div class="d-flex justify-content-center py-3">
              <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
            </div>
          {:else if !servers.length}
            <div class="text-body-secondary">
              {$_('pages.servers.backups.pano-backup.no-managed-servers')}
            </div>
          {:else}
            <div>
              <label class="form-label mb-1" for="restoreServerBackupTarget">
                {$_('pages.servers.backups.pano-backup.import-target')}
              </label>
              <select class="form-select" id="restoreServerBackupTarget" bind:value={serverId}>
                {#each servers as server (server.id)}
                  <option value={server.id}>
                    {server.name}{server.uuid === backup?.subject
                      ? ` · ${$_('pages.servers.backups.pano-backup.import-origin')}`
                      : ''}
                  </option>
                {/each}
              </select>
            </div>

            <div class="text-body-secondary small">
              {$_('pages.servers.backups.pano-backup.restore-description')}
            </div>

            {#if selected && !canStart(selected)}
              <div class="alert alert-warning mb-0 d-flex align-items-start" role="alert">
                <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
                <div>{$_('pages.servers.backups.restore-needs-stop')}</div>
              </div>
            {/if}

            {#if backup?.manifest?.encrypted && !passphraseSet}
              <input
                class="form-control"
                type="password"
                autocomplete="off"
                placeholder={$_('pages.servers.backups.pano-backup.passphrase-placeholder')}
                bind:value={passphrase} />
            {/if}

            <input
              class="form-control"
              type="password"
              autocomplete="current-password"
              placeholder={$_('pages.servers.backups.password-placeholder')}
              class:border-danger={passwordError}
              bind:value={currentPassword} />
          {/if}
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-danger w-100"
            type="submit"
            disabled={submitting ||
              serverId == null ||
              !servers.length ||
              !currentPassword ||
              (selected && !canStart(selected)) ||
              (backup?.manifest?.encrypted && !passphraseSet && !passphrase)}>
            {#if submitting}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('pages.servers.backups.restore')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { canStart, fetchServersList } from '$lib/servers.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /** @type {{ passphraseSet?: boolean, onstarted?: (job: object) => void }} */
  let { passphraseSet = false, onstarted } = $props();

  let modalElement = $state();
  let modal;

  let backup = $state(/** @type {any} */ (null));
  /** Managed servers: only a node keeps backups that can be restored from Pano Backup. */
  let servers = $state(/** @type {any[]} */ ([]));
  let serverId = $state(/** @type {number | null} */ (null));
  let passphrase = $state('');
  let currentPassword = $state('');
  let passwordError = $state(false);
  let loadingServers = $state(false);
  let submitting = $state(false);

  const selected = $derived(servers.find((server) => server.id === serverId) ?? null);

  /** @param {any} row an `mc-server` row of the Pano Backup list: an archive, or a server snapshot (`type: snapshot`). */
  export async function open(row) {
    backup = row;
    passphrase = '';
    currentPassword = '';
    passwordError = false;
    servers = [];
    serverId = null;
    loadingServers = true;
    modal?.show();

    const list = (await fetchServersList()).filter((server) => server?.nodeId != null);

    servers = list;
    serverId = (list.find((server) => server.uuid === row?.subject) ?? list[0])?.id ?? null;
    loadingServers = false;
  }

  /** @param {SubmitEvent} event */
  async function submit(event) {
    event.preventDefault();

    if (submitting || serverId == null || !backup) {
      return;
    }

    submitting = true;
    passwordError = false;

    const body = await ApiUtil.post({
      path: `/panel/servers/${serverId}/backups/pano-backup/import`,
      body: {
        remoteId: backup.id,
        type: backup.type === 'snapshot' ? 'snapshot' : 'archive',
        restore: true,
        currentPassword,
        ...(passphrase ? { passphrase } : {}),
      },
      handler: (response) => response,
    }).catch(() => null);

    submitting = false;

    if (!body || body.error) {
      const code = body?.error?.code ?? body?.error;

      passwordError = code === 'CURRENT_PASSWORD_NOT_CORRECT';

      const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

      void showError(error.key, error.values);

      return;
    }

    currentPassword = '';
    modal?.hide();
    void showSuccess('pages.servers.backups.pano-backup.restore-started');
    onstarted?.(body.job);
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement)
      : null;

    return () => modal?.hide();
  });
</script>
