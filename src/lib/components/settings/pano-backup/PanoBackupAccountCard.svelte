<!--
  The panomc.com account this Pano's Pano Backup runs on (its platform connection): the connect
  prompt when not connected, else the plan, the account-wide used/free space of every Pano and the
  link to manage the plan on the website. `remote` = `GET /api/panel/pano-backups/remote`.
-->
<div class="card">
  <div class="card-header d-flex align-items-center gap-2">
    <span>{$_('pages.settings.backups.account.title')}</span>
    {#if connection === 'connected' || connection === 'unavailable'}
      <span class="badge text-bg-success ms-auto">
        {$_('pages.settings.backups.account.connected')}
      </span>
    {/if}
  </div>
  <div class="card-body vstack gap-3">
    {#if connection === 'not-connected'}
      <div class="d-flex align-items-start gap-3">
        <div
          class="d-inline-flex rounded justify-content-center align-items-center bg-primary-subtle text-primary flex-shrink-0"
          style="width: 48px; height: 48px;">
          <i class="fa-solid fa-cloud fa-lg" aria-hidden="true"></i>
        </div>
        <div class="vstack gap-2 min-w-0">
          <div class="small text-body-secondary">
            {revoked
              ? $_('pages.settings.backups.account.revoked')
              : $_('pages.settings.backups.account.not-connected')}
          </div>
          <div>
            <a class="btn btn-primary btn-sm" href="{base}{CONNECT_PATH}">
              <i class="fa-solid fa-link me-1" aria-hidden="true"></i>
              {$_('buttons.connect-pano-account')}
            </a>
          </div>
        </div>
      </div>
    {:else}
      <div class="d-flex flex-wrap align-items-center gap-2 small">
        <i class="fa-solid fa-user text-body-secondary" aria-hidden="true"></i>
        <span class="fw-semibold">{remote?.account?.username || '—'}</span>
        <a class="ms-auto" href="{base}{CONNECT_PATH}">
          {$_('pages.settings.backups.account.connection-settings')}
        </a>
      </div>

      {#if connection === 'unavailable'}
        <div class="alert alert-warning small mb-0">
          {$_('pages.settings.backups.account.unavailable')}
        </div>
      {:else if plan}
        <div class="d-flex align-items-center gap-2">
          <h5 class="mb-0">{plan.tier?.name || '—'}</h5>
          {#if plan.subscription?.cancelAtPeriodEnd}
            <span class="badge text-bg-warning">
              {$_('pages.settings.backups.account.canceling')}
            </span>
          {/if}
        </div>
      {:else}
        <div class="small">{$_('pages.settings.backups.account.no-plan')}</div>
      {/if}

      {#if usage && connection === 'connected'}
        <div>
          <div class="d-flex small mb-1 gap-2">
            <span>
              {$_('pages.settings.backups.account.used', {
                values: { size: formatBytes(usage.used + usage.reserved) },
              })}
            </span>
            {#if usage.free != null}
              <span class="ms-auto text-body-secondary">
                {$_('pages.settings.backups.account.free', {
                  values: { size: formatBytes(usage.free), quota: formatBytes(usage.quota || 0) },
                })}
              </span>
            {/if}
          </div>
          {#if usage.percent != null}
            <div
              class="progress"
              role="progressbar"
              aria-label={$_('pages.settings.backups.usage')}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={usage.percent}>
              <div
                class="progress-bar bg-{usageColour(usage.percent)}"
                style="width: {usage.percent}%">
              </div>
            </div>
          {/if}
          <div class="form-text">{$_('pages.settings.backups.account.shared-hint')}</div>
        </div>
      {/if}

      <div>
        <a
          class="btn btn-sm {plan ? 'btn-outline-primary' : 'btn-primary'}"
          href={manageUrl}
          target="_blank"
          rel="noopener noreferrer">
          <i class="fa-solid fa-arrow-up-right-from-square me-1" aria-hidden="true"></i>
          {plan
            ? $_('pages.settings.backups.account.manage-plan')
            : $_('pages.settings.backups.account.get-plan')}
        </a>
      </div>
    {/if}
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import { formatBytes } from '$lib/string.util.js';
  import {
    CONNECT_PATH,
    accountUsage,
    connectionState,
    manageBackupsUrl,
    usageColour,
  } from '$lib/pano-backup.util.js';

  /** @type {{ remote: Record<string, any> | null }} */
  let { remote } = $props();

  const connection = $derived(connectionState(remote));
  const revoked = $derived(
    remote?.hostError?.code === 'CONNECT_REQUIRED' && remote?.hostError?.reason === 'INVALID_TOKEN',
  );
  const plan = $derived(remote?.plan ?? null);
  const usage = $derived(accountUsage(remote?.usage));
  const manageUrl = $derived(manageBackupsUrl(remote?.apiUrl));
</script>
