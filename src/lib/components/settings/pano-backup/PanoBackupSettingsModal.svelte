<!-- Backup schedules: local backups on this server, and (when connected) Pano Backup; MC server uploads are coming soon. -->
<BsModal bind:this={modal} size="modal-lg">
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}>
    <div class="modal-header">
      <h5 class="modal-title">{$_('pages.settings.backups.settings-title')}</h5>
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="modal"
        aria-label={$_('buttons.close')}></button>
    </div>
    <div class="modal-body vstack gap-4">
      <div class="vstack gap-2">
        <div class="fw-semibold">{$_('pages.settings.backups.local-schedule-title')}</div>
        <div class="small text-body-secondary">
          {$_('pages.settings.backups.local-schedule-description')}
        </div>
        <div class="row g-2">
          <div class="col-sm-5">
            <label class="form-label small" for="pano-local-schedule">
              {$_('pages.settings.backups.schedule')}
            </label>
            <select id="pano-local-schedule" class="form-select" bind:value={localSchedule}>
              {#each LOCAL_SCHEDULES as option (option)}
                <option value={option}>
                  {$_(`pages.settings.backups.schedule-${option.toLowerCase()}`)}
                </option>
              {/each}
            </select>
          </div>
          <div class="col-6 col-sm-4">
            <label class="form-label small" for="pano-local-hour">
              {$_('pages.settings.backups.hour')}
            </label>
            <select
              id="pano-local-hour"
              class="form-select"
              bind:value={localHour}
              disabled={localSchedule === 'OFF'}>
              {#each HOURS as hour (hour)}
                <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
              {/each}
            </select>
          </div>
          <div class="col-6 col-sm-3">
            <label class="form-label small" for="pano-local-keep">
              {$_('pages.settings.backups.keep')}
            </label>
            <input
              id="pano-local-keep"
              class="form-control"
              type="number"
              min="1"
              max="50"
              bind:value={localKeep} />
          </div>
        </div>
      </div>

      {#if connected}
        <div class="vstack gap-2">
          <div class="fw-semibold">{$_('pages.settings.backups.remote-schedule-title')}</div>
          <div class="row g-2">
            <div class="col-sm-7">
              <label class="form-label small" for="pano-remote-schedule">
                {$_('pages.settings.backups.schedule')}
              </label>
              <select id="pano-remote-schedule" class="form-select" bind:value={remoteSchedule}>
                {#each REMOTE_SCHEDULES as option (option)}
                  <option value={option}>
                    {$_(`pages.settings.backups.schedule-${option.toLowerCase()}`)}
                  </option>
                {/each}
              </select>
            </div>
            <div class="col-sm-5">
              <label class="form-label small" for="pano-remote-hour">
                {$_('pages.settings.backups.hour')}
              </label>
              <select
                id="pano-remote-hour"
                class="form-select"
                bind:value={remoteHour}
                disabled={remoteSchedule === 'OFF'}>
                {#each HOURS as hour (hour)}
                  <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
                {/each}
              </select>
            </div>
          </div>
          {#if !remote?.plan && !remote?.hostError}
            <div class="form-text mt-0">{$_('pages.settings.backups.schedule-needs-plan')}</div>
          {/if}
          {#if remote?.lastUploadAt}
            <div class="small text-body-secondary">
              {$_('pages.settings.backups.last-upload')}
              <DateComponent time={remote.lastUploadAt} relativeFormat />
            </div>
          {/if}
        </div>

        <div class="vstack gap-2">
          <!-- Coming soon: nothing to pick yet (the platform does not upload MC server backups). -->
          <div class="fw-semibold d-flex align-items-center gap-2">
            {$_('pages.settings.backups.mc-servers-title')}
            <span class="badge text-bg-secondary text-uppercase">
              {$_('pages.servers.backups.coming-soon')}
            </span>
          </div>
          <div class="small text-body-secondary">
            {$_('pages.settings.backups.mc-servers-description')}
          </div>
        </div>
      {/if}

      {#if error}
        <div class="alert alert-danger small mb-0">
          {$_(error.key, { values: error.values })}
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
        disabled={saving || !(localKeep >= 1 && localKeep <= 50)}>
        {#if saving}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('buttons.save')}
      </button>
    </div>
  </form>
</BsModal>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { LOCAL_SCHEDULES, REMOTE_SCHEDULES, connectionState } from '$lib/pano-backup.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import DateComponent from '$lib/components/Date.svelte';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';
  import BsModal from './BsModal.svelte';

  /**
   * `local` / `remote` = `GET /api/panel/pano-backups` and `…/remote`; `onsaved` lets the page
   * re-read them so the next open starts from what was saved.
   *
   * @type {{ local: any, remote: any, onsaved?: () => void }}
   */
  let { local, remote, onsaved } = $props();

  const HOURS = Array.from({ length: 24 }, (_value, index) => index);

  /** @type {BsModal | undefined} */
  let modal = $state();

  let localSchedule = $state('OFF');
  let localHour = $state(3);
  let localKeep = $state(7);
  let remoteSchedule = $state('OFF');
  let remoteHour = $state(3);
  /** Kept as saved and sent back unchanged while MC server uploads are coming soon. */
  /** @type {number[]} */
  let mcServerIds = $state([]);

  let saving = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let error = $state(null);

  const connected = $derived(connectionState(remote) !== 'not-connected');

  /** Opens the modal with the saved settings. */
  export function open() {
    localSchedule = String(local?.settings?.schedule || 'OFF');
    localHour = Number(local?.settings?.hour ?? 3);
    localKeep = Number(local?.settings?.keep ?? 7);
    remoteSchedule = REMOTE_SCHEDULES.includes(remote?.settings?.schedule)
      ? String(remote.settings.schedule)
      : 'OFF';
    remoteHour = Number(remote?.settings?.hour ?? 3);
    mcServerIds = (remote?.settings?.mcServerIds || []).map(Number);
    error = null;

    modal?.show();
  }

  /**
   * @param {string} path
   * @param {object} body
   * @returns {Promise<ReturnType<typeof describeError>>}
   */
  async function put(path, body) {
    const response = await ApiUtil.put({ path, body }).catch(() => ({ error: 'NETWORK_ERROR' }));

    return response?.error ? describeError(response) : null;
  }

  async function save() {
    saving = true;

    try {
      error = await put('/api/panel/pano-backups/settings', {
        schedule: localSchedule,
        hour: Number(localHour),
        keep: Number(localKeep),
      });

      if (!error && connected) {
        error = await put('/api/panel/pano-backups/remote/settings', {
          schedule: remoteSchedule,
          hour: Number(remoteHour),
          mcServerIds,
        });
      }

      if (!error) {
        modal?.hide();
        void showSuccess('pages.settings.backups.settings-saved');
        onsaved?.();
      }
    } finally {
      saving = false;
    }
  }
</script>
