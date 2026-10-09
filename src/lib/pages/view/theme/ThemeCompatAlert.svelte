{#if isOutdated(report)}
  <div class="alert alert-warning d-flex align-items-start mb-0" role="alert" data-compat-alert>
    <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
    <div class="flex-grow-1 min-w-0">
      <h5 class="alert-heading mb-2">{$_('pages.theme-compat.alert.title')}</h5>
      <div>
        {$_('pages.theme-compat.alert.description', {
          values: { count: fallbackCount, theme: report.theme?.id ?? '' },
        })}
      </div>
      <a class="btn alert-btn mt-2" href={target}>{$_('pages.theme-compat.alert.view')}</a>
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import { fallbackIssues, isOutdated } from './compat.util.js';

  /**
   * The dashboard alert while the active theme is OUTDATED: some of its copies of plugin views no
   * longer match the plugin, so the plugin's default look shows.
   * @type {{ report?: any }}
   */
  let { report = null } = $props();

  const fallbackCount = $derived(fallbackIssues(report).length);
  const target = $derived(
    report?.theme?.id
      ? `${base}/view/detail/${encodeURIComponent(report.theme.id)}`
      : `${base}/view`,
  );
</script>
