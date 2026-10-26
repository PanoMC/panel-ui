<!-- SM-PB — whether and how this server's backups go to Pano Backup: a section of the backups settings dialog. -->
{#if !connected}
  <div class="text-center vstack gap-2">
    <div>
      <i class="fa-solid fa-cloud fa-2x pano-backup-cloud" aria-hidden="true"></i>
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
  <div class="vstack gap-3">
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
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  import {
    CONNECT_PATH,
    PANO_BACKUP_MAX_KEEP_DAYS as MAX_KEEP_DAYS,
    PANO_BACKUP_MAX_KEEP_LAST as MAX_KEEP_LAST,
  } from '$lib/pano-backup.util.js';

  /** @type {{ form: any, connected?: boolean }} */
  let { form = $bindable(), connected = false } = $props();
</script>
