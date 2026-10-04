<!-- Backup schedules: local backups on this server, and (when connected) Pano Backup; MC server uploads are coming soon. -->
<BsModal bind:this={modal} size="modal-lg">
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}>
    <div class="modal-body text-center vstack gap-4">
      <div>
        <div class="pb-3">
          <i class="fas fa-gear fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="text-capitalize">{$_('pages.settings.backups.settings-title')}</div>
      </div>

      <div class="vstack gap-3 text-start">
        <div class="text-capitalize">{$_('pages.settings.backups.local-schedule-title')}</div>
        <div>{$_('pages.settings.backups.local-schedule-description')}</div>
        <div class="row g-2">
          <div class="col-sm-5">
            <div class="form-floating">
              <select id="pano-local-schedule" class="form-select" bind:value={localSchedule}>
                {#each LOCAL_SCHEDULES as option (option)}
                  <option value={option}>
                    {$_(`pages.settings.backups.schedule-${option.toLowerCase()}`)}
                  </option>
                {/each}
              </select>
              <label class="text-capitalize" for="pano-local-schedule">
                {$_('pages.settings.backups.schedule')}
              </label>
            </div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="form-floating">
              <select
                id="pano-local-hour"
                class="form-select"
                bind:value={localHour}
                disabled={localSchedule === 'OFF'}>
                {#each HOURS as hour (hour)}
                  <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
                {/each}
              </select>
              <label class="text-capitalize" for="pano-local-hour">
                {$_('pages.settings.backups.hour')}
              </label>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="form-floating">
              <input
                id="pano-local-keep"
                class="form-control"
                type="number"
                placeholder=" "
                min="1"
                max="50"
                bind:value={localKeep} />
              <label class="text-capitalize" for="pano-local-keep">
                {$_('pages.settings.backups.keep')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {#if connected}
        <div class="vstack gap-3 text-start">
          <div class="text-capitalize">{$_('pages.settings.backups.remote-schedule-title')}</div>
          <div class="row g-2">
            <div class="col-sm-7">
              <div class="form-floating">
                <select id="pano-remote-schedule" class="form-select" bind:value={remoteSchedule}>
                  {#each REMOTE_SCHEDULES as option (option)}
                    <option value={option}>
                      {$_(`pages.settings.backups.schedule-${option.toLowerCase()}`)}
                    </option>
                  {/each}
                </select>
                <label class="text-capitalize" for="pano-remote-schedule">
                  {$_('pages.settings.backups.schedule')}
                </label>
              </div>
            </div>
            <div class="col-sm-5">
              <div class="form-floating">
                <select
                  id="pano-remote-hour"
                  class="form-select"
                  bind:value={remoteHour}
                  disabled={remoteSchedule === 'OFF'}>
                  {#each HOURS as hour (hour)}
                    <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
                  {/each}
                </select>
                <label class="text-capitalize" for="pano-remote-hour">
                  {$_('pages.settings.backups.hour')}
                </label>
              </div>
            </div>
          </div>
          {#if !remote?.plan && !remote?.hostError}
            <div>{$_('pages.settings.backups.schedule-needs-plan')}</div>
          {/if}
          {#if remote?.lastUploadAt}
            <div>
              {$_('pages.settings.backups.last-upload')}
              <DateComponent time={remote.lastUploadAt} relativeFormat />
            </div>
          {/if}
        </div>

        <div class="vstack gap-3 text-start">
          <!-- Coming soon: nothing to pick yet (the platform does not upload MC server backups). -->
          <div class="d-flex align-items-center gap-2 text-capitalize">
            {$_('pages.settings.backups.mc-servers-title')}
            <span class="badge text-bg-secondary text-uppercase">
              {$_('pages.servers.backups.coming-soon')}
            </span>
          </div>
          <div>{$_('pages.settings.backups.mc-servers-description')}</div>
        </div>
      {/if}

      {#if error}
        <div class="alert alert-danger d-flex align-items-center gap-2 mb-0 text-start">
          <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <div>{$_(error.key, { values: error.values })}</div>
        </div>
      {/if}
    </div>
    <div class="modal-footer flex-nowrap text-capitalize">
      <button
        type="button"
        class="btn btn-link text-decoration-none col-6 m-0"
        data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button
        type="submit"
        class="btn btn-primary col-6 m-0"
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
