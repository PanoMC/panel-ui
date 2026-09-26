<!-- Pano Backup settings: panomc.com link, passphrase, schedules, tier/usage, MC server backups. -->
<div class="row g-3">
  <div class="col-lg-7 vstack gap-3">
    <HostLinkCard
      purpose="BACKUP"
      link={remote.links?.BACKUP ?? null}
      pending={remote.pending?.BACKUP ?? null}
      onchange={() => void refresh()} />

    <!-- Passphrase -->
    <div class="card">
      <div class="card-header d-flex align-items-center">
        <span>{$_('pages.settings.backups.passphrase-title')}</span>
        <span class="badge ms-auto text-bg-{remote.passphraseSet ? 'success' : 'warning'}">
          {remote.passphraseSet
            ? $_('pages.settings.backups.passphrase-set')
            : $_('pages.settings.backups.passphrase-not-set')}
        </span>
      </div>
      <form
        class="card-body vstack gap-3"
        onsubmit={(event) => {
          event.preventDefault();
          void savePassphrase();
        }}>
        <div class="small text-body-secondary">
          {$_('pages.settings.backups.passphrase-description')}
        </div>
        {#if remote.passphraseSet}
          <div class="small text-body-secondary">
            {$_('pages.settings.backups.passphrase-change-hint')}
          </div>
        {/if}
        {#key passphraseFormKey}
          <PassphraseFields bind:passphrase bind:valid={passphraseValid} />
        {/key}
        <div>
          <label class="form-label small" for="pano-passphrase-password">
            {$_('pages.settings.backups.current-password')}
          </label>
          <input
            id="pano-passphrase-password"
            class="form-control"
            type="password"
            autocomplete="current-password"
            bind:value={passphrasePassword} />
        </div>
        {#if passphraseError}
          <div class="alert alert-danger small mb-0">
            {$_(passphraseError.key, { values: passphraseError.values })}
          </div>
        {/if}
        <div>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={!passphraseValid || !passphrasePassword || saving === 'passphrase'}>
            {#if saving === 'passphrase'}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>

    <!-- Pano Backup schedule + MC servers -->
    <div class="card">
      <div class="card-header">{$_('pages.settings.backups.remote-schedule-title')}</div>
      <form
        class="card-body vstack gap-3"
        onsubmit={(event) => {
          event.preventDefault();
          void saveRemoteSettings();
        }}>
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
              disabled={remoteSchedule === 'OFF' || remoteSchedule === 'TIER'}>
              {#each HOURS as hour (hour)}
                <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
              {/each}
            </select>
          </div>
        </div>
        {#if tier?.minIntervalMinutes}
          <div class="form-text mt-0">
            {$_('pages.settings.backups.tier-interval-hint', {
              values: { minutes: tier.minIntervalMinutes },
            })}
          </div>
        {/if}
        {#if remote.lastUploadAt}
          <div class="small text-body-secondary">
            {$_('pages.settings.backups.last-upload')}
            <DateComponent time={remote.lastUploadAt} relativeFormat />
          </div>
        {/if}

        <div>
          <div class="fw-semibold small mb-1">{$_('pages.settings.backups.mc-servers-title')}</div>
          <div class="small text-body-secondary mb-2">
            {$_('pages.settings.backups.mc-servers-description')}
          </div>
          {#if servers.length === 0}
            <div class="small text-body-secondary fst-italic">
              {$_('pages.settings.backups.mc-servers-none')}
            </div>
          {:else}
            <div class="vstack gap-1">
              {#each servers as server (server.id)}
                <div class="form-check form-switch">
                  <input
                    id="pano-mc-{server.id}"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={mcServerIds.includes(Number(server.id))}
                    onchange={() => (mcServerIds = toggleId(mcServerIds, server.id))} />
                  <label class="form-check-label" for="pano-mc-{server.id}">{server.name}</label>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        {#if remoteError}
          <div class="alert alert-danger small mb-0">
            {$_(remoteError.key, { values: remoteError.values })}
          </div>
        {/if}
        <div>
          <button type="submit" class="btn btn-primary" disabled={saving === 'remote'}>
            {#if saving === 'remote'}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div class="col-lg-5 vstack gap-3">
    <!-- Tier / usage -->
    <div class="card">
      <div class="card-header">{$_('pages.settings.backups.tier-title')}</div>
      <div class="card-body vstack gap-2">
        {#if !backupLinked}
          <div class="small text-body-secondary">
            {$_('pages.settings.backups.tier-not-linked')}
          </div>
        {:else if listError}
          <div class="alert alert-danger small mb-0">
            {$_(listError.key, { values: listError.values })}
          </div>
        {:else if tier}
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0">{tier.name}</h5>
          </div>
          <ul class="list-unstyled small mb-0 vstack gap-1">
            {#if tier.storageGb}
              <li>
                <i class="fa-solid fa-hard-drive me-2 text-body-secondary" aria-hidden="true"></i>
                {$_('pages.settings.backups.tier-storage', { values: { gb: tier.storageGb } })}
              </li>
            {/if}
            {#if tier.retentionDays}
              <li>
                <i class="fa-solid fa-calendar-days me-2 text-body-secondary" aria-hidden="true"
                ></i>
                {$_('pages.settings.backups.tier-retention', {
                  values: { days: tier.retentionDays },
                })}
              </li>
            {/if}
            {#if tier.minIntervalMinutes}
              <li>
                <i class="fa-solid fa-clock me-2 text-body-secondary" aria-hidden="true"></i>
                {$_('pages.settings.backups.tier-interval', {
                  values: { minutes: tier.minIntervalMinutes },
                })}
              </li>
            {/if}
          </ul>
        {:else}
          <div class="small">{$_('pages.settings.backups.tier-none')}</div>
          <div>
            <a
              class="btn btn-primary btn-sm"
              href="https://panomc.com"
              target="_blank"
              rel="noopener noreferrer">
              {$_('pages.settings.backups.tier-subscribe')}
            </a>
          </div>
        {/if}

        {#if usage}
          <div class="mt-2">
            <div class="d-flex small mb-1">
              <span>{$_('pages.settings.backups.usage')}</span>
              <span class="ms-auto">
                {formatBytes(usage.usedBytes || 0)}
                {#if usage.quotaBytes}/ {formatBytes(usage.quotaBytes)}{/if}
              </span>
            </div>
            {#if usedPercent !== null}
              <div
                class="progress"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={usedPercent}>
                <div
                  class="progress-bar"
                  class:bg-danger={usedPercent >= 90}
                  class:bg-warning={usedPercent >= 75 && usedPercent < 90}
                  style="width: {usedPercent}%">
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Local schedule -->
    <div class="card">
      <div class="card-header">{$_('pages.settings.backups.local-schedule-title')}</div>
      <form
        class="card-body vstack gap-3"
        onsubmit={(event) => {
          event.preventDefault();
          void saveLocalSettings();
        }}>
        <div class="small text-body-secondary">
          {$_('pages.settings.backups.local-schedule-description')}
        </div>
        <div class="row g-2">
          <div class="col-6">
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
          <div class="col-6">
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
          <div class="col-6">
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
        {#if localError}
          <div class="alert alert-danger small mb-0">
            {$_(localError.key, { values: localError.values })}
          </div>
        {/if}
        <div>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={saving === 'local' || !(localKeep >= 1 && localKeep <= 50)}>
            {#if saving === 'local'}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script module>
  import ApiUtil from '$lib/api.util.js';
  import { getServerDisplayName, isManaged } from '$lib/servers.util.js';

  /**
   * @param {string} path
   * @param {import('@sveltejs/kit').LoadEvent} [event]
   */
  async function read(path, event) {
    return ApiUtil.get({ path, request: event }).catch(() => null);
  }

  /**
   * @param {any} body `GET /api/panel/servers`
   * @returns {{ id: number, name: string }[]} the managed servers (their FULL backups can go to Pano Backup).
   */
  function managedServers(body) {
    if (!body || body.error) {
      return [];
    }

    const list = Array.isArray(body.servers)
      ? body.servers
      : [...(body.pinned || []), ...(body.otherServers || [])];

    return list
      .filter((server) => isManaged(server))
      .map((server) => ({
        id: Number(server.id),
        name: getServerDisplayName(server) || String(server.id),
      }));
  }

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load(event) {
    await event.parent();

    const [local, remote, servers] = await Promise.all([
      read('/api/panel/pano-backups', event),
      read('/api/panel/pano-backups/remote', event),
      read('/api/panel/servers', event),
    ]);

    const remoteList = remote?.links?.BACKUP
      ? await read('/api/panel/pano-backups/remote/backups', event)
      : null;

    return { local, remote, remoteList, servers: managedServers(servers) };
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { formatBytes } from '$lib/string.util.js';
  import {
    LOCAL_SCHEDULES,
    REMOTE_SCHEDULES,
    describeError,
    toggleId,
    usagePercent,
  } from '$lib/pano-backup.util.js';

  import DateComponent from '$lib/components/Date.svelte';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';
  import HostLinkCard from '$lib/components/settings/pano-backup/HostLinkCard.svelte';
  import PassphraseFields from '$lib/components/settings/pano-backup/PassphraseFields.svelte';

  let { data } = $props();

  const HOURS = Array.from({ length: 24 }, (_value, index) => index);

  let remote = $derived(
    /** @type {any} */ (
      data?.remote && !data.remote.error ? data.remote : { links: {}, passphraseSet: false }
    ),
  );
  let remoteList = $derived(/** @type {any} */ (data?.remoteList ?? null));
  const servers = $derived(/** @type {{ id: number, name: string }[]} */ (data?.servers || []));

  // Form fields start from the loaded settings.
  let localSchedule = $derived(String(data?.local?.settings?.schedule || 'OFF'));
  let localHour = $derived(Number(data?.local?.settings?.hour ?? 3));
  let localKeep = $derived(Number(data?.local?.settings?.keep ?? 7));
  let remoteSchedule = $derived(String(data?.remote?.settings?.schedule || 'OFF'));
  let remoteHour = $derived(Number(data?.remote?.settings?.hour ?? 3));
  let mcServerIds = $derived(
    /** @type {number[]} */ ((data?.remote?.settings?.mcServerIds || []).map(Number)),
  );

  let passphrase = $state('');
  let passphraseValid = $state(false);
  let passphrasePassword = $state('');
  let passphraseFormKey = $state(0);

  /** @type {'passphrase' | 'remote' | 'local' | null} */
  let saving = $state(null);
  /** @type {ReturnType<typeof describeError>} */
  let passphraseError = $state(null);
  /** @type {ReturnType<typeof describeError>} */
  let remoteError = $state(null);
  /** @type {ReturnType<typeof describeError>} */
  let localError = $state(null);

  const backupLinked = $derived(!!remote?.links?.BACKUP);
  const tier = $derived(remoteList && !remoteList.error ? remoteList.tier || null : null);
  const usage = $derived(remoteList && !remoteList.error ? remoteList.usage || null : null);
  const usedPercent = $derived(usagePercent(usage));
  const listError = $derived(remoteList?.error ? describeError(remoteList) : null);

  async function refresh() {
    const next = await read('/api/panel/pano-backups/remote');

    if (next && !next.error) {
      remote = next;
      remoteList = next.links?.BACKUP ? await read('/api/panel/pano-backups/remote/backups') : null;
    }
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

  async function savePassphrase() {
    saving = 'passphrase';

    try {
      passphraseError = await put('/api/panel/pano-backups/remote/passphrase', {
        currentPassword: passphrasePassword,
        passphrase,
      });

      if (!passphraseError) {
        passphrase = '';
        passphrasePassword = '';
        passphraseFormKey++;
        remote = { ...remote, passphraseSet: true };
        void showSuccess('pages.settings.backups.passphrase-saved');
      }
    } finally {
      saving = null;
    }
  }

  async function saveRemoteSettings() {
    saving = 'remote';

    try {
      remoteError = await put('/api/panel/pano-backups/remote/settings', {
        schedule: remoteSchedule,
        hour: Number(remoteHour),
        mcServerIds,
      });

      if (!remoteError) {
        void showSuccess('pages.settings.backups.settings-saved');
      }
    } finally {
      saving = null;
    }
  }

  async function saveLocalSettings() {
    saving = 'local';

    try {
      localError = await put('/api/panel/pano-backups/settings', {
        schedule: localSchedule,
        hour: Number(localHour),
        keep: Number(localKeep),
      });

      if (!localError) {
        void showSuccess('pages.settings.backups.settings-saved');
      }
    } finally {
      saving = null;
    }
  }
</script>
