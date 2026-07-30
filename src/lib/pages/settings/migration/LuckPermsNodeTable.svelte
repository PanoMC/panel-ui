<style>
  /*
    Bootstrap's .table-success / .table-warning / .table-info hardcode a light tint and black text
    and have no dark override, so they break under the dark and copper themes. Drive Bootstrap's own
    table variables from the theme-aware subtle/emphasis colours instead.
  */
  tr.lp-row-new {
    --bs-table-bg: var(--bs-success-bg-subtle);
    --bs-table-color: var(--bs-success-text-emphasis);
    --bs-table-border-color: var(--bs-success-border-subtle);
  }

  tr.lp-row-overwrite {
    --bs-table-bg: var(--bs-warning-bg-subtle);
    --bs-table-color: var(--bs-warning-text-emphasis);
    --bs-table-border-color: var(--bs-warning-border-subtle);
  }

  /*
    Bootstrap has no orange theme colour with subtle/emphasis variants, so this is a translucent
    tint of --bs-orange. Being translucent it composites over whatever the body background is, which
    keeps it correct in light, dark and copper without hardcoding two palettes. The text colour is
    left alone so it stays the theme's own.
  */
  tr.lp-row-edited {
    --bs-table-bg: rgba(253, 126, 20, 0.18);
    --bs-table-border-color: rgba(253, 126, 20, 0.4);
  }

  tr.lp-row-deleted {
    --bs-table-bg: var(--bs-danger-bg-subtle);
    --bs-table-color: var(--bs-danger-text-emphasis);
    --bs-table-border-color: var(--bs-danger-border-subtle);
  }

  .lp-badge-edited {
    background-color: var(--bs-orange);
    color: #000;
  }
</style>

<!--
  Merged permission-node table used by the LuckPerms migration review step.

  It shows, in one place, the nodes Pano already holds and the nodes the import is bringing in, so
  the admin can see what was there, what is arriving and what is about to be replaced — and edit any
  of it before anything is written. Long node lists are paged so a holder with thousands of nodes
  does not lock up the browser.
-->
<table class="table table-sm mb-0 small align-middle">
  <thead>
    <tr class="opacity-75">
      <th>{$_('pages.migration.luckperms.header-permission')}</th>
      <th style="width: 70px;">{$_('pages.migration.luckperms.header-value')}</th>
      <th style="width: 110px;">{$_('pages.migration.luckperms.header-server')}</th>
      <th style="width: 110px;">{$_('pages.migration.luckperms.header-world')}</th>
      <th style="width: 140px;">{$_('pages.migration.luckperms.header-context')}</th>
      <th style="width: 130px;">{$_('pages.migration.luckperms.header-effect')}</th>
      <th style="width: 40px;"></th>
    </tr>
  </thead>
  <tbody>
    {#each pagedNodes as node (node._id)}
      {@const effect = nodeEffect(node)}
      <tr
        class:lp-row-new={effect === 'new'}
        class:lp-row-overwrite={effect === 'overwrite'}
        class:lp-row-edited={effect === 'added' || effect === 'edited'}
        class:lp-row-deleted={effect === 'deleted'}>
        <td>
          <input
            class="form-control form-control-sm font-monospace"
            class:is-invalid={!node.permission?.trim()}
            placeholder={$_('pages.migration.luckperms.node-permission-placeholder')}
            value={node.permission}
            on:input={(e) => patch(node, { permission: e.currentTarget.value })} />
          {#if node._before && node._before.permission !== node.permission}
            <div class="opacity-75 mt-1">
              <i class="fas fa-arrow-right-arrow-left me-1"></i>
              <code>{node._before.permission}</code>
            </div>
          {/if}
        </td>
        <td>
          <div class="form-check form-switch mb-0">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              aria-label={$_('pages.migration.luckperms.header-value')}
              checked={node.value}
              on:change={(e) => patch(node, { value: e.currentTarget.checked })} />
          </div>
          {#if node._before && node._before.value !== node.value}
            <div class="opacity-75 mt-1">
              {node._before.value ? $_('buttons.yes') : $_('buttons.no')}
              <i class="fas fa-arrow-right ms-1"></i>
            </div>
          {/if}
        </td>
        <td>
          <input
            class="form-control form-control-sm"
            aria-label={$_('pages.migration.luckperms.header-server')}
            value={node.server}
            on:input={(e) => patch(node, { server: e.currentTarget.value })} />
        </td>
        <td>
          <input
            class="form-control form-control-sm"
            aria-label={$_('pages.migration.luckperms.header-world')}
            value={node.world}
            on:input={(e) => patch(node, { world: e.currentTarget.value })} />
        </td>
        <td>
          <input
            class="form-control form-control-sm font-monospace"
            class:is-invalid={!isValidContext(node.contexts)}
            aria-label={$_('pages.migration.luckperms.header-context')}
            placeholder="&#123;&#125;"
            value={node.contexts}
            on:input={(e) => patch(node, { contexts: e.currentTarget.value })} />
        </td>
        <td>
          <span
            class={`badge ${effectBadgeClass(effect)}`}
            title={effect === 'implied' ? $_('pages.migration.luckperms.node-implied-hint') : ''}>
            {$_(`pages.migration.luckperms.node-${effect}`)}
          </span>
          {#if node._fromPrimaryGroup}
            <span class="d-block small opacity-75 mt-1">
              {$_('pages.migration.luckperms.node-from-primary-group')}
            </span>
          {/if}
        </td>
        <td class="text-end">
          <button
            class="btn btn-link text-danger p-0 border-0"
            on:click={() => dispatch('remove', { node })}
            title={$_('buttons.remove')}
            aria-label={$_('buttons.remove')}>
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    {/each}

    {#if nodes.length === 0}
      <tr>
        <td colspan="7" class="text-center opacity-75 py-3">
          {$_('pages.migration.luckperms.no-nodes')}
        </td>
      </tr>
    {/if}
  </tbody>
</table>

<div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
  <button class="btn btn-link text-decoration-none px-0" on:click={() => dispatch('add')}>
    <i class="fas fa-plus me-1"></i>{$_('pages.migration.luckperms.add-node')}
  </button>

  <div class="d-flex align-items-center gap-2">
    {#if nodes.length > pageSizeOptions[0]}
      <select
        class="form-select form-select-sm w-auto"
        bind:value={nodesPerPage}
        on:change={() => (page = 1)}
        aria-label={$_('pages.migration.luckperms.per-page')}>
        {#each pageSizeOptions as size}
          <option value={size}
            >{$_('pages.migration.luckperms.per-page-option', { values: { count: size } })}</option>
        {/each}
      </select>
    {/if}

    {#if totalPages > 1}
      <button
        class="btn btn-sm btn-outline-secondary"
        disabled={page <= 1}
        on:click={() => (page = Math.max(1, page - 1))}
        aria-label={$_('buttons.previous')}>
        <i class="fas fa-chevron-left"></i>
      </button>
      <small class="opacity-75">{page} / {totalPages}</small>
      <button
        class="btn btn-sm btn-outline-secondary"
        disabled={page >= totalPages}
        on:click={() => (page = Math.min(totalPages, page + 1))}
        aria-label={$_('buttons.next')}>
        <i class="fas fa-chevron-right"></i>
      </button>
    {/if}
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher } from 'svelte';

  /** @type {any[]} */
  export let nodes = [];
  /** @type {'merge' | 'replace'} */
  export let mergeStrategy = 'merge';

  const dispatch = createEventDispatcher();

  let nodesPerPage = 10;
  let page = 1;

  $: totalPages = Math.max(1, Math.ceil(nodes.length / nodesPerPage));
  // Removing the last row of the last page must not strand the user on an empty page.
  $: if (page > totalPages) page = totalPages;
  $: pagedNodes = nodes.slice((page - 1) * nodesPerPage, page * nodesPerPage);

  function patch(node, changes) {
    dispatch('change', { node, changes });
  }

  function isValidContext(contexts) {
    if (!contexts || !contexts.trim()) return true;

    try {
      const parsed = JSON.parse(contexts);
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  // What this row looked like before the admin touched it: the incoming LuckPerms values when the
  // import brings this node, otherwise whatever Pano already had.
  function baseline(node) {
    return node._incomingSnapshot ?? node._before;
  }

  function isEdited(node) {
    const before = baseline(node);
    if (!before) return false;

    return (
      before.permission !== node.permission ||
      before.value !== node.value ||
      before.server !== node.server ||
      before.world !== node.world ||
      String(before.contexts) !== String(node.contexts)
    );
  }

  function nodeEffect(node) {
    if (node._origin === 'added') return 'added';
    if (isEdited(node)) return 'edited';

    // Replacing wipes the permission tables first, so anything Pano holds that the import is not
    // bringing back is about to be deleted. Say so rather than calling it "unchanged".
    if (mergeStrategy === 'replace' && node._panoNodeId != null && !node._incoming) {
      return 'deleted';
    }

    // Pano gives everyone the default group already, so an active group.default is shown for
    // context but is not written — saying "new" here would be a lie.
    if (node._implied && node.value) return 'implied';

    // Present in Pano and not part of the import — it simply stays as it is.
    if (!node._incoming) return 'unchanged';

    return node._before ? 'overwrite' : 'new';
  }

  function effectBadgeClass(effect) {
    switch (effect) {
      case 'new':
        return 'text-bg-success';
      case 'overwrite':
        return 'text-bg-warning';
      case 'deleted':
        return 'text-bg-danger';
      case 'added':
      case 'edited':
        return 'lp-badge-edited';
      default:
        return 'text-bg-secondary';
    }
  }

  const pageSizeOptions = [10, 20, 50, 100, 1000];
</script>
