<!-- What the platform update that was found would do to the installed plugins and themes, shown
     before the update button is enabled (doc 04 section 7, gate 2). The page owns the plan
     controller and passes its state; this component only draws it. -->
<div class="mb-3" data-update-plan data-plan-status={state.status}>
  {#if state.status === 'loading'}
    <div class="d-flex align-items-center gap-2 small" role="status" data-plan-loading>
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {$_('pages.settings.updates.plan.loading')}
    </div>
  {:else if state.status === 'failed'}
    <div class="alert alert-danger d-flex align-items-start mb-0" role="alert" data-plan-failed>
      <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
      <div class="flex-grow-1 min-w-0">
        <h5 class="alert-heading mb-2">{$_('pages.settings.updates.plan.failed.title')}</h5>
        <div class="mb-2">{$_('pages.settings.updates.plan.failed.description')}</div>
        <div class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            id="planAcknowledge"
            checked={state.acknowledged}
            onchange={(event) => onacknowledge(event.currentTarget.checked)} />
          <label class="form-check-label" for="planAcknowledge">
            {$_('pages.settings.updates.plan.failed.acknowledge')}
          </label>
        </div>
        <button type="button" class="btn alert-btn" data-plan-retry onclick={() => onretry()}>
          {$_('buttons.retry')}
        </button>
      </div>
    </div>
  {:else if state.status === 'ready' && plan?.target}
    <div
      class="alert {attention ? 'alert-warning' : 'alert-success'} d-flex align-items-start mb-0"
      role="alert"
      data-plan-ready>
      <i
        class="fa-solid {attention ? 'fa-triangle-exclamation' : 'fa-circle-check'} me-3 mt-1"
        aria-hidden="true"></i>
      <div class="flex-grow-1 min-w-0">
        <h5 class="alert-heading mb-2">
          {attention
            ? $_('pages.settings.updates.plan.attention.title')
            : $_('pages.settings.updates.plan.safe.title')}
        </h5>

        <div class="mb-2">
          {#if plan.known}
            {$_('pages.settings.updates.plan.target', {
              values: {
                version: plan.target.version,
                min: plan.target.minApiLevel ?? 1,
                current: plan.target.apiLevel,
              },
            })}
          {:else}
            <span data-plan-unknown>
              {$_('pages.settings.updates.plan.unknown', {
                values: { version: plan.target.version },
              })}
            </span>
          {/if}
        </div>

        {#if disabled.length > 0}
          <div data-plan-disable>
            <b
              >{$_('pages.settings.updates.plan.disable.title', {
                values: { count: disabled.length },
              })}</b>
            <div>{$_('pages.settings.updates.plan.disable.description')}</div>
            <ul class="mb-2">
              {#each disabled as row (row.type + ':' + row.id)}
                <li>
                  <span class="font-monospace">{row.id}</span>
                  <span class="badge text-bg-secondary">
                    {$_(`components.compatibility-card.type.${row.type}`)}
                  </span>
                  <span class="font-monospace">{row.installedVersion}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if updated.length > 0}
          <div data-plan-update>
            <b
              >{$_('pages.settings.updates.plan.update.title', {
                values: { count: updated.length },
              })}</b>
            <div>{$_('pages.settings.updates.plan.update.description')}</div>
            <ul class="mb-2">
              {#each updated as row (row.type + ':' + row.id)}
                <li>
                  <span class="font-monospace">{row.id}</span>
                  <span class="badge text-bg-secondary">
                    {$_(`components.compatibility-card.type.${row.type}`)}
                  </span>
                  <span class="font-monospace">{row.installedVersion}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if plan.agents.length > 0}
          <div data-plan-agents>
            <b
              >{$_('pages.settings.updates.plan.agents.title', {
                values: { count: plan.agents.length },
              })}</b>
            <div>{$_('components.compatibility-card.agents.description')}</div>
            <AgentJarList agents={plan.agents} />
            <div class="mb-2">{$_('components.compatibility-card.agents.steps')}</div>
          </div>
        {/if}

        {#if plan.storeReachable === false}
          <div class="mb-2" data-plan-store-down>
            {$_('pages.settings.updates.plan.store-down')}
          </div>
        {/if}

        {#if counts.COMPATIBLE > 0}
          <div data-plan-compatible>
            {$_('pages.settings.updates.plan.compatible', { values: { count: counts.COMPATIBLE } })}
          </div>
        {/if}

        {#if plan.storeReachable === false}
          <button
            type="button"
            class="btn alert-btn mt-2"
            data-plan-retry
            onclick={() => onretry()}>
            {$_('buttons.retry')}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import AgentJarList from './AgentJarList.svelte';
  import { PlanVerdicts, planCounts, planNeedsAttention, planRows } from './compat.util.js';

  /**
   * @type {{ state: { status: 'loading' | 'ready' | 'unavailable' | 'failed', plan: any,
   *   acknowledged: boolean }, onretry?: () => void, onacknowledge?: (value: boolean) => void }}
   */
  let { state, onretry = () => {}, onacknowledge = () => {} } = $props();

  const plan = $derived(state.plan);
  const counts = $derived(planCounts(plan));
  const disabled = $derived(planRows(plan, PlanVerdicts.DISABLE));
  const updated = $derived(planRows(plan, PlanVerdicts.UPDATE));
  const attention = $derived(planNeedsAttention(plan) || plan?.known === false);
</script>
