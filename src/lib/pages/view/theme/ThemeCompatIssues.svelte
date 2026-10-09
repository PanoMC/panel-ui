{#if report && report.issues.length > 0}
  <div class="alert alert-warning d-flex align-items-start mb-0" role="alert" data-compat-issues>
    <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
    <div class="flex-grow-1 min-w-0">
      <h5 class="alert-heading mb-2">{$_('pages.theme-compat.title')}</h5>
      <div>{$_('pages.theme-compat.description')}</div>
      <ul class="mb-0 mt-2">
        {#each report.issues as issue, index (index)}
          {@const line = describeIssue(issue)}
          <li data-issue={issue.type}>{$_(line.key, { values: line.values })}</li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { describeIssue } from './compat.util.js';

  /**
   * The list of issues on the theme page, one sentence each (doc 01 section 7). Nothing is shown
   * without an issue; an update of a plugin is never blocked by any of them.
   * @type {{ report?: { issues: any[] } | null }}
   */
  let { report = null } = $props();
</script>
