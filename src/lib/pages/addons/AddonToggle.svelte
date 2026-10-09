<div
  class="form-check form-switch"
  title={locked ? lockedReason(plugin, $_) : undefined}
  data-locked={locked ? '' : undefined}>
  <input
    class="form-check-input"
    type="checkbox"
    role="switch"
    checked={plugin.status === 'STARTED'}
    aria-label={locked ? lockedReason(plugin, $_) : undefined}
    disabled={locked || disabled}
    onclick={(e) => {
      e.preventDefault();

      if (!locked) {
        onToggle();
      }
    }} />
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { isLocked, lockedReason } from './compat/compat.util.js';

  /**
   * The switch of an addon on its card and on its detail page. An addon the API level gate refused
   * (or one held back by a refused required plugin) can never be switched on, so its switch is disabled with the reason as the title instead of
   * being a button that then answers with an error.
   * @type {{ status?: string, verdict?: string | null, apiLevel?: number | null, heldBy?: any }}
   */
  export let plugin;

  /** Disabled for another reason (a running request, a licence that blocks the start). */
  export let disabled = false;

  /** Called when the admin flips an enabled-able switch. */
  export let onToggle = () => {};

  $: locked = isLocked(plugin) && plugin?.status !== 'STARTED';
</script>
