{#if source === 'theme'}
  <span
    class="badge text-bg-info"
    title={$_('pages.translations.source-theme-title')}
    data-source-tag="theme">
    <i class="fa-solid fa-palette me-1" aria-hidden="true"></i>{$_(
      'pages.translations.source-theme',
    )}
  </span>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  /**
   * The tag on a plugin translation whose original comes from the active theme's
   * `lang-overrides/plugins/<ns>/<locale>.json` (`source: "theme"`). A plugin's own text has no tag.
   * @type {{ source?: string | null }}
   */
  let { source = null } = $props();
</script>
