{#if held && !refused}
  <span class="badge text-bg-warning" title={heldReason(plugin, $_)} data-held-by={held.pluginId}>
    <i class="fa-solid fa-link-slash me-1" aria-hidden="true"></i>{$_(
      'components.compatibility-card.held-short',
      { values: { name: held.name } },
    )}
  </span>
{:else if refused}
  <span
    class="text-danger"
    title={$_('components.compatibility-card.row-refused', { values: { level: plugin.apiLevel } })}
    data-api-level>
    {$_('components.compatibility-card.incompatible')}
  </span>
{:else if shown}
  <span data-api-level>
    {$_('components.compatibility-card.level-short', { values: { level: plugin.apiLevel } })}
  </span>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { heldReason, isRefused, normalizeHeldBy } from './compat/compat.util.js';

  /**
   * The API level an addon declares and the verdict of the gate.
   * Shows nothing when the backend sent neither (an older platform).
   * @type {{ apiLevel?: number | null, verdict?: string | null, heldBy?: any }}
   */
  export let plugin;

  $: refused = isRefused(plugin?.verdict);
  $: held = normalizeHeldBy(plugin?.heldBy);
  $: shown = refused || Number.isFinite(plugin?.apiLevel);
</script>
