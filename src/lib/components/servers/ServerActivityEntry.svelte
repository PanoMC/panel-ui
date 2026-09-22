<style>
  .activity-entry {
    transition: background-color 1.5s ease-out;
  }

  /* An entry that arrived live fades in from a highlight (the Overview's Recent activity). */
  .activity-entry.is-fresh {
    background-color: var(--bs-warning-bg-subtle);
    transition: none;
  }
</style>

<!-- One activity-log entry (§2.4.12), shared by the Overview's Recent activity and the server
     settings' Activity page so the two always read the same. -->
<div class="list-group-item activity-entry" class:is-fresh={fresh}>
  <div class="d-flex flex-wrap align-items-center gap-2">
    <span class="badge text-bg-{meta.colour} fw-normal">
      <i class="{meta.icon} me-1" aria-hidden="true"></i>
      {activityTypeLabel(entry.type, $_)}
    </span>
    <span class="fw-semibold d-inline-flex align-items-center gap-2 min-w-0">
      {#if entry.username}
        <!-- The same avatar the users pages show, at their secondary 24 px. -->
        <img
          src="/api/profile/picture/{entry.username}?{$avatarVersion}"
          alt={entry.username}
          width="24"
          height="24"
          class="rounded-circle flex-shrink-0" />
      {/if}
      <span class="text-truncate">
        {entry.username || $_('pages.servers.activity.unknown-user')}
      </span>
    </span>
    <span class="small text-body-secondary ms-auto">
      {#if entry.createdAt != null}
        <DateComponent time={entry.createdAt} relativeFormat />
      {/if}
    </span>
  </div>
  {#if entry.details}
    <!-- Untrusted text (a command someone typed, a path they opened): rendered as text, never
         as HTML (§2.7). -->
    <div class="small text-body-secondary text-break font-monospace mt-1">
      {entry.details}
    </div>
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import DateComponent from '$lib/components/Date.svelte';
  import { avatarVersion } from '$lib/Store';
  import { activityTypeLabel, activityTypeMeta } from '$lib/serverActivity.util.js';

  /**
   * @type {{
   *   entry: { id: string, type: string, username?: string, createdAt?: number | string | null, details?: string },
   *   fresh?: boolean,
   * }}
   */
  let { entry, fresh = false } = $props();

  const meta = $derived(activityTypeMeta(entry.type));
</script>
