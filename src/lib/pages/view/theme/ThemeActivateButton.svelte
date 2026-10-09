{#if locked}
  <button
    class="btn btn-secondary"
    type="button"
    disabled
    title={lockedReason(theme, $_, 'THEME')}
    aria-label={lockedReason(theme, $_, 'THEME')}
    data-locked>
    {$_('buttons.activate')}
  </button>
{:else}
  <button class="btn btn-secondary" type="button" onclick={onActivate} disabled={activating}>
    {$_('buttons.activate')}{#if activating}<i class="fas fa-spinner fa-spin ms-2"></i>{/if}
  </button>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { isRefused, lockedReason } from '../../addons/compat/compat.util.js';

  /**
   * The Activate button of a theme. A theme the API level gate refused can never be activated, so
   * the button is disabled with the reason as its title; Update, Remove and uploading a new
   * version stay where they are.
   * @type {{ verdict?: string | null, apiLevel?: number | null }}
   */
  export let theme;

  export let activating = false;

  export let onActivate = () => {};

  $: locked = isRefused(theme?.verdict);
</script>
