<tr class="row-action" class:table-active={locale.selected} use:rowLink={onEditClick}>
  <th scope="row" class="align-middle text-center">
    {#if locale.definedBy !== 'SYSTEM'}
      <button
        type="button"
        aria-label={$_('buttons.delete')}
        title={$_('buttons.delete')}
        class="btn btn-link"
        on:click={onDeleteClick}>
        <i class="fas fa-trash"></i>
      </button>
    {/if}
  </th>
  <td class="align-middle" style="max-width: 250px;">
    <!-- A language Pano ships opens the same dialog: there only whether it is on can change. -->
    <div class="d-flex align-items-center gap-2">
      <button
        class="btn btn-link p-0 text-start text-decoration-none text-truncate"
        type="button"
        on:click={onEditClick}
        title={locale.name}>
        {locale.name}
      </button>
      {#if locale.enabled === false}
        <span class="badge text-bg-secondary flex-shrink-0">{$_('buttons.disabled')}</span>
      {/if}
    </div>
  </td>
  <td class="align-middle text-nowrap" style="max-width: 150px;">
    <div class="text-truncate" title={locale.code}>
      {locale.code}
    </div>
  </td>
  <td class="align-middle text-nowrap" style="max-width: 150px;">
    <div class="text-truncate" title={locale.dateFnsCode}>
      {locale.dateFnsCode}
    </div>
  </td>
  <td class="align-middle text-nowrap" style="max-width: 150px;">
    <div class="text-truncate" title={locale.derivatives}>
      {locale.derivatives}
    </div>
  </td>
  <td class="align-middle" style="max-width: 200px;">
    <div class="text-truncate" title={$_('pages.languages.defined-by-options.' + locale.definedBy)}>
      {$_('pages.languages.defined-by-options.' + locale.definedBy)}
    </div>
  </td>
</tr>

<script>
  import { rowLink } from '$lib/rowLink.util.js';

  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let locale;
  export let index;

  const dispatch = createEventDispatcher();

  function onEditClick() {
    dispatch('editClick', { index });
  }

  function onDeleteClick() {
    dispatch('deleteClick', { index });
  }
</script>
