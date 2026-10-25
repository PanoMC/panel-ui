<!-- SM-PB — brings a server backup out of Pano Backup into a managed server's own backups: the server it was taken
     from by default, any other managed server when that one is gone. Nothing on the server is overwritten. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={modalElement}>
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
              <label class="form-label mb-1" for="importServerBackupTarget">
                {$_('pages.servers.backups.pano-backup.import-target')}
              </label>
              <select class="form-select" id="importServerBackupTarget" bind:value={serverId}>
                {#each servers as server (server.id)}
                  <option value={server.id}>
                    {server.name}{server.uuid === backup?.subject
                      ? ` · ${$_('pages.servers.backups.pano-backup.import-origin')}`
                      : ''}
                  </option>
                {/each}
              </select>
            </div>
            {#if backup?.manifest?.encrypted}
              <input
                class="form-control"
                type="password"
                autocomplete="off"
                placeholder={$_('pages.servers.backups.pano-backup.passphrase-optional')}
                bind:value={passphrase} />
            {/if}
          {/if}
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary w-100"
            type="submit"
            disabled={submitting || serverId == null || !servers.length}>
            {$_('pages.servers.backups.pano-backup.import')}
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
  import { fetchServersList } from '$lib/servers.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import { showError } from '$lib/components/ToastContainer.svelte';

  /** @type {{ onstarted?: (job: object) => void }} */
  let { onstarted } = $props();

  let modalElement = $state();
  let modal;

  let backup = $state(/** @type {any} */ (null));
  /** Managed servers: only a node keeps backups that can be brought in. */
  let servers = $state(/** @type {any[]} */ ([]));
  let serverId = $state(/** @type {number | null} */ (null));
  let passphrase = $state('');
  let loadingServers = $state(false);
  let submitting = $state(false);

  /** @param {any} row an `mc-server` row of the Pano Backup list: an archive, or a server snapshot (`type: snapshot`). */
  export async function open(row) {
    backup = row;
    passphrase = '';
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

    const body = await ApiUtil.post({
      path: `/panel/servers/${serverId}/backups/pano-backup/import`,
      body: {
        remoteId: backup.id,
        type: backup.type === 'snapshot' ? 'snapshot' : 'archive',
        ...(passphrase ? { passphrase } : {}),
      },
      handler: (response) => response,
    }).catch(() => null);

    submitting = false;

    if (!body || body.error) {
      const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

      void showError(error.key, error.values);

      return;
    }

    modal?.hide();
    onstarted?.(body.job);
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement)
      : null;

    return () => modal?.hide();
  });
</script>
