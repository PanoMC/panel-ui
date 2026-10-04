<!--
  The top of the Pano Backup card: the connect prompt when this Pano has no panomc.com account,
  else the account, the plan with the button to pick or change it on the website, and how much of
  the account's storage is used. `remote` = `GET /api/panel/pano-backups/remote`.
-->
<div class="card-body vstack gap-3">
  {#if connection === 'not-connected'}
    <div class="d-flex align-items-start gap-3">
      <!-- The Pano Host mark, as on panomc.com/host: the Pano letter on the info colour. -->
      <div
        class="d-inline-flex rounded justify-content-center align-items-center bg-info flex-shrink-0"
        style="width: 48px; height: 48px;">
        <img src="{base}/assets/img/logo.svg" width="28" height="28" alt="Pano Host" />
      </div>
      <div class="vstack gap-2 min-w-0">
        <div>
          {revoked
            ? $_('pages.settings.backups.account.revoked', {
                values: { website: websiteDisplayHost() },
              })
            : $_('pages.settings.backups.account.not-connected', {
                values: { website: websiteDisplayHost() },
              })}
        </div>
        <div>
          <a class="btn btn-primary" href="{base}{CONNECT_PATH}">
            {$_('buttons.connect-pano-account')}
          </a>
        </div>
      </div>
    </div>
  {:else if connection === 'unavailable'}
    <div class="alert alert-warning d-flex align-items-center gap-2 mb-0">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
      <div>
        {$_('pages.settings.backups.account.unavailable', {
          values: { website: websiteDisplayHost() },
        })}
      </div>
    </div>
  {:else}
    <!-- Only while panomc.com answers: when it cannot be reached nothing about the account is shown. -->
    <div class="d-flex flex-wrap align-items-center gap-2 small">
      <i class="fa-solid fa-user text-body-secondary" aria-hidden="true"></i>
      <span class="fw-semibold">{remote?.account?.username || '—'}</span>
    </div>

    <div class="d-flex flex-wrap align-items-center gap-2">
      <div class="vstack min-w-0">
        <span class="small text-body-secondary">{$_('pages.settings.backups.account.plan')}</span>
        {#if plan}
          <div class="d-flex align-items-center gap-2">
            <span class="h5 mb-0">{plan.tier?.name || '—'}</span>
            {#if plan.subscription?.cancelAtPeriodEnd}
              <span class="badge text-bg-warning">
                {$_('pages.settings.backups.account.canceling')}
              </span>
            {/if}
          </div>
        {:else}
          <span class="small"
            >{$_('pages.settings.backups.account.no-plan', {
              values: { website: websiteDisplayHost() },
            })}</span>
        {/if}
      </div>
      <a class="btn btn-primary btn-sm ms-auto" href={planUrl}>
        <!-- The Pano Host mark: the plan is managed on Pano Host (same tab, it comes back here). -->
        <span
          class="d-inline-flex rounded justify-content-center align-items-center bg-info me-1 align-text-bottom"
          style="width: 18px; height: 18px;">
          <img src="{base}/assets/img/logo.svg" width="11" height="11" alt="" />
        </span>
        {$_('pages.settings.backups.account.manage-plan')}
      </a>
    </div>

    <!-- Storage of the whole account, as one horizontal bar: used (incl. running uploads) of the plan's quota. -->
    <div>
      <div class="d-flex small mb-1 gap-2">
        <span>
          {#if usage?.quota}
            {$_('pages.settings.backups.account.usage-of', {
              values: {
                used: formatBytes((usage?.used || 0) + (usage?.reserved || 0)),
                quota: formatBytes(usage.quota),
              },
            })}
          {:else}
            {$_('pages.settings.backups.account.used', {
              values: { size: formatBytes((usage?.used || 0) + (usage?.reserved || 0)) },
            })}
          {/if}
        </span>
        {#if usage?.percent != null}
          <span class="ms-auto text-body-secondary">{usage.percent}%</span>
        {/if}
      </div>
      <div
        class="progress"
        style="height: 10px;"
        role="progressbar"
        aria-label={$_('pages.settings.backups.usage')}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={usage?.percent ?? 0}>
        <div
          class="progress-bar bg-{usageColour(usage?.percent)}"
          style="width: {usage?.percent ?? 0}%">
        </div>
      </div>
      <div class="form-text">{$_('pages.settings.backups.account.shared-hint')}</div>
    </div>
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import { base } from '$app/paths';
  import { page } from '$app/stores';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  import { formatBytes } from '$lib/string.util.js';
  import {
    CONNECT_PATH,
    accountUsage,
    backupPlanUrl,
    connectionState,
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
  const planUrl = $derived(backupPlanUrl(PANO_WEBSITE_URL, `${$page.url.origin}${base}/backups`));
</script>
