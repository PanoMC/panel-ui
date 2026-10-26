<!-- SM-PB — one server's side of Pano Backup, without a card of its own: the Backups table shows the copies (a cloud
     on the rows that are there, the rows only Pano Backup still has), this holds what it reads and the dialogs behind
     them — whether and how the server's backups go there, the passphrase of an encrypted copy. -->
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
      {#if !overview.connected}
        <div class="modal-body text-center vstack gap-3 py-4">
          <div>
            <i class="fa-solid fa-cloud fa-3x pano-backup-cloud" aria-hidden="true"></i>
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
      {:else}
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
      {/if}
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

  const MAX_KEEP_LAST = 500;
  const MAX_KEEP_DAYS = 3650;

  let form = $state({ ...DEFAULT_SETTINGS });
  let saving = $state(false);
  let settingsModalElement = $state();
  let settingsModal;

  let passphrase = $state('');
  let passphraseTarget = $state(/** @type {any} */ (null));
  let passphraseModalElement = $state();
  let passphraseModal;

  const formValid = $derived(
    form.retention === 'COUNT'
      ? Number(form.keepLast) >= 1 && Number(form.keepLast) <= MAX_KEEP_LAST
      : form.retention === 'DAYS'
        ? Number(form.keepDays) >= 1 && Number(form.keepDays) <= MAX_KEEP_DAYS
        : true,
  );

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

  export function openSettings() {
    form = { ...overview.settings };
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

    overview = { ...overview, settings: { ...DEFAULT_SETTINGS, ...(body.settings || {}) } };
    settingsModal?.hide();

    void showSuccess('pages.servers.backups.pano-backup.saved');
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
