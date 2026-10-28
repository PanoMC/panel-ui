<!--
  The top of the Pano Backup card: the connect prompt when this Pano has no panomc.com account,
  else the account, the plan with the button to pick or change it on the website, and how much of
  the account's storage is used. `remote` = `GET /api/v1/panel/pano-backups/remote`.
-->
{#if connection === 'not-connected'}
  <div class="card">
    <div class="card-body">
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
            <a class="btn btn-light" href="{base}{CONNECT_PATH}">
              {$_('buttons.connect-pano-account')}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else if connection === 'unavailable'}
  <div class="card">
    <div class="card-body">
      <div class="alert alert-warning mb-0 d-flex align-items-start">
        <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>
          <h5 class="alert-heading mb-2">{$_('pages.settings.backups.remote-title')}</h5>
          <div>
            {$_('pages.settings.backups.account.unavailable', {
              values: { website: websiteDisplayHost() },
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Only while panomc.com answers: when it cannot be reached nothing about the account is shown. -->
  <PlanCard
    name={plan ? plan.tier?.name || '—' : $_('pages.settings.backups.account.free-plan')}
    badge={plan?.subscription?.cancelAtPeriodEnd
      ? { text: $_('pages.settings.backups.account.canceling'), variant: 'warning' }
      : null}
    usages={[usageEntry]}>
    {#snippet action()}
      <ManagePlanButton />
    {/snippet}
  </PlanCard>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  import { formatBytes } from '$lib/string.util.js';

  import ManagePlanButton from './ManagePlanButton.svelte';
  import PlanCard from './PlanCard.svelte';
  import { CONNECT_PATH, accountUsage, connectionState } from '$lib/pano-backup.util.js';

  /** @type {{ remote: Record<string, any> | null }} */
  let { remote } = $props();

  const connection = $derived(connectionState(remote));
  const revoked = $derived(
    remote?.hostError?.code === 'CONNECT_REQUIRED' && remote?.hostError?.reason === 'INVALID_TOKEN',
  );
  const plan = $derived(remote?.plan ?? null);
  const usage = $derived(accountUsage(remote?.usage));
  /** Storage of the whole account: used (incl. running uploads) of the plan's quota. */
  const usageEntry = $derived.by(() => {
    const used = formatBytes((usage?.used || 0) + (usage?.reserved || 0));

    return {
      id: 'storage',
      label: usage?.quota
        ? $_('pages.settings.backups.account.usage-of', {
            values: { used, quota: formatBytes(usage.quota) },
          })
        : $_('pages.settings.backups.account.used', { values: { size: used } }),
      percent: usage?.percent,
      ariaLabel: $_('pages.settings.backups.usage'),
      note: $_('pages.settings.backups.account.shared-hint'),
    };
  });
</script>
