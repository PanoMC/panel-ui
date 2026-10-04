<style>
  .system-avatar {
    width: 24px;
    height: 24px;
    padding: 3px;
  }
</style>

<!-- One activity-log entry (§2.4.12), shared by the Overview's Recent activity and the server
     settings' Activity page so the two always read the same. -->
{#snippet entryContent()}
  <span class="d-flex flex-wrap align-items-center gap-2">
    <span class="badge text-bg-{meta.colour} fw-normal text-capitalize">
      {activityTypeLabel(entry.type, $_)}
    </span>
    <span class="fw-semibold d-inline-flex align-items-center gap-2 min-w-0">
      {#if system}
        <!-- Pano itself: a crash, a schedule run, a restart the node did on its own. -->
        <span
          class="system-avatar bg-primary rounded-circle d-inline-flex flex-shrink-0"
          use:tooltip={[$_('pages.servers.activity.system-hint')]}>
          <img src="{base}/assets/img/logo.svg" alt="" class="w-100 h-100 object-fit-contain" />
        </span>
      {:else if entry.username}
        <!-- The same avatar the users pages show, at their secondary 24 px. -->
        <img
          src="/api/profile/picture/{entry.username}?{$avatarVersion}"
          alt={entry.username}
          width="24"
          height="24"
          class="rounded-circle flex-shrink-0" />
      {/if}
      <span class="text-truncate">
        {system
          ? $_('pages.servers.activity.system')
          : entry.username || $_('pages.servers.activity.unknown-user')}
      </span>
    </span>
    <small class="opacity-75 ms-auto">
      {#if entry.createdAt != null}
        <DateComponent time={entry.createdAt} relativeFormat />
      {/if}
    </small>
  </span>
  {#if entry.details}
    <!-- Untrusted text (a command someone typed, a path they opened): rendered as text, never
         as HTML (§2.7). -->
    <small class="opacity-75 text-break font-monospace mt-1 d-block">
      {entry.details}
    </small>
  {/if}
{/snippet}

{#if onSelect}
  <button
    type="button"
    class="list-group-item list-group-item-action focus-ring"
    class:bg-warning-subtle={fresh && !selected}
    class:bg-secondary-subtle={selected}
    title={$_('buttons.view')}
    aria-label={$_('buttons.view')}
    aria-haspopup="dialog"
    onclick={() => onSelect(entry)}>
    {@render entryContent()}
  </button>
{:else}
  <div class="list-group-item" class:bg-warning-subtle={fresh} class:bg-secondary-subtle={selected}>
    {@render entryContent()}
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import DateComponent from '$lib/components/Date.svelte';
  import { avatarVersion } from '$lib/Store';
  import {
    activityTypeLabel,
    activityTypeMeta,
    isSystemActivity,
  } from '$lib/serverActivity.util.js';
  import tooltip from '$lib/tooltip.util';

  /**
   * @type {{
   *   entry: { id: string, type: string, userId?: string, username?: string, createdAt?: number | string | null, details?: string },
   *   fresh?: boolean,
   *   selected?: boolean,
   *   onSelect?: (entry: { id: string, type: string, userId: string, username: string, createdAt: number|string|null, details: string }) => void
   * }}
   */
  let { entry, fresh = false, selected = false, onSelect = null } = $props();

  const meta = $derived(activityTypeMeta(entry.type));
  const system = $derived(isSystemActivity(entry));
</script>
