{#if held && !refused}
  <span class="badge text-bg-warning" title={heldReason(plugin, $_)} data-held-by={held.pluginId}>
    <i class="fa-solid fa-link-slash me-1" aria-hidden="true"></i>{$_(
      'components.compatibility-card.held-short',
      { values: { name: held.name } },
    )}
  </span>
{:else if shown}
  <span
    class="badge {refused ? 'text-bg-danger' : 'text-bg-secondary'}"
    title={refused
      ? $_('components.compatibility-card.row-refused', { values: { level: plugin.apiLevel } })
      : $_('components.compatibility-card.row-level', { values: { level: plugin.apiLevel } })}
    data-api-level>
    {#if refused}
      <i class="fa-solid fa-ban me-1" aria-hidden="true"></i>{$_(verdictKey(plugin.verdict))}
    {:else}
      {$_('components.compatibility-card.level-short', { values: { level: plugin.apiLevel } })}
    {/if}
  </span>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { heldReason, isRefused, normalizeHeldBy, verdictKey } from './compat/compat.util.js';

  /**
   * The API level an addon declares and the verdict of the gate.
   * Shows nothing when the backend sent neither (an older platform).
   * @type {{ apiLevel?: number | null, verdict?: string | null, heldBy?: any }}
   */
  export let plugin;

  /**
   * Cards and list rows pass true: only the verdict of a refused addon shows there,
   * the level itself belongs to the detail page.
   * @type {boolean}
   */
  export let refusedOnly = false;

  $: refused = isRefused(plugin?.verdict);
  $: held = normalizeHeldBy(plugin?.heldBy);
  $: shown = refused || (!refusedOnly && Number.isFinite(plugin?.apiLevel));
</script>
