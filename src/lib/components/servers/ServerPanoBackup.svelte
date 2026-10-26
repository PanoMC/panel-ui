<!-- SM-PB — one server's side of Pano Backup, without a card of its own: the Backups table shows the copies (a cloud
     on the rows that are there, the rows only Pano Backup still has), this holds what it reads and the dialogs behind
     them — the passphrase of an encrypted copy. Its settings are in the backups settings dialog. -->
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

<script module>
  /**
   * @typedef {{ connected: boolean, passphraseSet: boolean, settings: any, backups: any[], loaded: boolean }} PanoBackupOverview
   */

  /** What the page shows before the first answer, and when it cannot be read. */
  export function emptyOverview() {
    return {
      connected: false,
      passphraseSet: false,
      settings: { ...DEFAULT_SETTINGS },
      backups: [],
      loaded: false,
    };
  }

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: false,
    mode: 'FULL',
    retention: 'COUNT',
    keepLast: 7,
    keepDays: 30,
  });
</script>

<script>
  import { onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  import ApiUtil from '$lib/api.util.js';
  import { CONNECT_PATH, isSnapshotCopy } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /**
   * @type {{
   *   serverId: number | null,
   *   overview?: PanoBackupOverview,
   *   job?: any,
   *   busyId?: string | null,
   * }}
   */
  let {
    serverId,
    overview = $bindable(emptyOverview()),
    job = $bindable(null),
    busyId = $bindable(null),
  } = $props();

  let passphrase = $state('');
  let passphraseTarget = $state(/** @type {any} */ (null));
  let passphraseModalElement = $state();
  let passphraseModal;

  // Read again whenever the route moves to another server.
  $effect(() => {
    const id = serverId;

    untrack(() => {
      if (id != null) {
        overview = emptyOverview();
        void reload();
      }
    });
  });

  /** Reads the server's Pano Backup side again; a failure leaves the table with the server's own backups only. */
  export async function reload() {
    if (serverId == null) {
      return;
    }

    const id = serverId;
    const body = await ApiUtil.get({
      path: `/panel/servers/${id}/backups/pano-backup`,
      handler: (response) => response,
    }).catch(() => null);

    if (id !== serverId || !body || body.error) {
      return;
    }

    overview = {
      connected: body.connected === true,
      passphraseSet: body.passphraseSet === true,
      settings: { ...DEFAULT_SETTINGS, ...(body.settings || {}) },
      backups: Array.isArray(body.backups) ? body.backups : [],
      loaded: true,
    };
  }

  /**
   * Saves [next] as this server's Pano Backup settings (the backups settings dialog does it with its own rules).
   *
   * @param {any} next
   * @returns {Promise<boolean>} whether they were saved; a failure is said in a toast.
   */
  export async function saveSettings(next) {
    if (serverId == null) {
      return false;
    }

    const body = await ApiUtil.put({
      path: `/panel/servers/${serverId}/backups/pano-backup`,
      body: {
        enabled: next.enabled,
        mode: next.mode,
        retention: next.retention,
        keepLast: Number(next.keepLast),
        keepDays: Number(next.keepDays),
      },
      handler: (response) => response,
    }).catch(() => null);

    if (!body || body.error) {
      const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

      void showError(error.key, error.values);

      return false;
    }

    overview = { ...overview, settings: { ...DEFAULT_SETTINGS, ...(body.settings || {}) } };

    return true;
  }

  /**
   * Brings a copy back into this server's own backups.
   *
   * @param {any} copy
   * @param {string} rowId the table row the spinner belongs to.
   */
  export function askImport(copy, rowId) {
    if (!isSnapshotCopy(copy) && copy.manifest?.encrypted && !overview.passphraseSet) {
      passphrase = '';
      passphraseTarget = { copy, rowId };
      passphraseModal?.show();

      return;
    }

    void startImport(copy, rowId, null);
  }

  /** @param {SubmitEvent} event */
  function submitPassphrase(event) {
    event.preventDefault();

    const target = passphraseTarget;

    passphraseModal?.hide();

    if (target) {
      void startImport(target.copy, target.rowId, passphrase);
    }

    passphrase = '';
  }

  /**
   * @param {any} copy
   * @param {string} rowId
   * @param {string | null} typed the passphrase asked for, or null for the one saved on this Pano.
   */
  async function startImport(copy, rowId, typed) {
    if (serverId == null || busyId) {
      return;
    }

    busyId = rowId;

    const body = await ApiUtil.post({
      path: `/panel/servers/${serverId}/backups/pano-backup/import`,
      body: {
        remoteId: copy.id,
        type: isSnapshotCopy(copy) ? 'snapshot' : 'archive',
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

  /** @param {any} copy */
  export function askDelete(copy) {
    showConfirmActionModal(
      {
        title: 'pages.servers.backups.pano-backup.delete-title',
        description: 'pages.servers.backups.pano-backup.delete-description',
        confirmLabel: 'buttons.delete',
      },
      () => deleteCopy(copy),
    );
  }

  /**
   * Deletes [copy] from Pano Backup without asking (the caller asked already) and says how it went.
   *
   * @param {any} copy
   * @returns {Promise<boolean>}
   */
  export async function deleteCopy(copy) {
    const body = await ApiUtil.delete({
      path: `/panel/pano-backups/remote/${isSnapshotCopy(copy) ? 'snapshots' : 'backups'}/${encodeURIComponent(copy.id)}`,
      handler: (response) => response,
    }).catch(() => null);

    if (!body || body.error) {
      const error = describeError(body || { error: { code: 'NETWORK_ERROR' } });

      void showError(error.key, error.values);

      return false;
    }

    void showSuccess('pages.servers.backups.pano-backup.deleted');
    await reload();

    return true;
  }

  onMount(() => {
    passphraseModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(passphraseModalElement)
      : null;

    return () => {
      passphraseModal?.hide();
    };
  });
</script>
