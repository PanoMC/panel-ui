<!-- What the platform update that was found would do to the installed plugins and themes, as an
     icon beside the update button (doc 04 section 7, gate 2): a spinner while the plan is read,
     nothing when the update fits, an amber exclamation with the details on hover when something
     needs the admin, a red one with a retry when the plan could not be read. The page owns the
     plan controller and passes its state; this component only draws it. -->
<span
  class="d-inline-flex align-items-center gap-1"
  data-update-plan
  data-plan-status={state.status}>
  {#if state.status === 'loading'}
    <span
      class="text-body-secondary"
      role="status"
      aria-label={$_('pages.settings.updates.plan.loading')}
      data-plan-loading
      use:tooltip={[$_('pages.settings.updates.plan.loading')]}>
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    </span>
  {:else if state.status === 'failed'}
    <span
      class="text-danger"
      role="img"
      aria-label={failedText}
      data-plan-failed
      use:tooltip={[failedText]}>
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
    </span>
    <button
      type="button"
      class="btn btn-sm btn-link p-0"
      aria-label={$_('buttons.retry')}
      data-plan-retry
      use:tooltip={[$_('buttons.retry')]}
      onclick={() => onretry()}>
      <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
    </button>
  {:else if problem}
    <span
      class="text-warning"
      role="img"
      aria-label={problem}
      data-plan-attention
      use:tooltip={[problem]}>
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
    </span>
    {#if state.plan?.storeReachable === false}
      <button
        type="button"
        class="btn btn-sm btn-link p-0"
        aria-label={$_('buttons.retry')}
        data-plan-retry
        use:tooltip={[$_('buttons.retry')]}
        onclick={() => onretry()}>
        <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
      </button>
    {/if}
  {/if}
</span>

<script>
  import { _ } from 'svelte-i18n';

  import tooltip from '$lib/tooltip.util';

  import { planProblem } from './compat.util.js';

  /**
   * @type {{ state: { status: 'loading' | 'ready' | 'unavailable' | 'failed', plan: any },
   *   onretry?: () => void }}
   */
  let { state, onretry = () => {} } = $props();

  const problem = $derived(planProblem(state, $_));
  const failedText = $derived(
    `${$_('pages.settings.updates.plan.failed.title')}. ${$_('pages.settings.updates.plan.failed.description')}`,
  );
</script>
