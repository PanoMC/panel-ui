<tr class:table-active={locale.selected}>
  <th scope="row" class="align-middle">
    {#if locale.definedBy !== 'SYSTEM'}
      <button
        type="button"
        aria-label={$_('buttons.delete')}
        title={$_('buttons.delete')}
        class="btn btn-sm btn-link"
        on:click={onDeleteClick}>
        <i class="fas fa-trash"></i>
      </button>
    {/if}
  </th>
  <td class="align-middle" style="max-width: 250px;">
    <div class="text-truncate">
      {#if locale.definedBy !== 'SYSTEM'}
        <button
          class="btn btn-sm btn-link p-0 text-start text-decoration-none w-100 text-truncate"
          type="button"
          on:click={onEditClick}
          title={locale.name}>
          {locale.name}
        </button>
      {:else}
        <span title={locale.name}>{locale.name}</span>
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
