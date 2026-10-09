{#if isOutdated(report)}
  <span
    class="badge text-bg-warning"
    title={$_('pages.theme-compat.badge-title', { values: { count: fallbackCount } })}
    data-compat-badge>
    <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>{$_(
      'pages.theme-compat.badge',
      { values: { count: fallbackCount } },
    )}
  </span>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { fallbackIssues, isOutdated } from './compat.util.js';

  /**
   * The badge on the active theme's card while some of its views show a plugin's default look.
   * @type {{ report?: any }}
   */
  let { report = null } = $props();

  const fallbackCount = $derived(fallbackIssues(report).length);
</script>
