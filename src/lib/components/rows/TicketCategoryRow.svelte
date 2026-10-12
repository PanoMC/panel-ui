<tr class="row-action" class:table-active={category.selected} use:rowLink={onEditClick}>
  <th scope="row" class="align-middle text-center">
    <button
      type="button"
      title={$_('buttons.delete')}
      aria-label={$_('buttons.delete')}
      class="btn btn-link"
      on:click={onDeleteClick}>
      <i class="fas fa-trash"></i>
    </button>
  </th>
  <td class="align-middle" style="max-width: 200px;">
    <div class="text-truncate">
      <button
        type="button"
        class="btn btn-link p-0 text-start text-decoration-none w-100 text-truncate"
        title={category.title}
        on:click={onEditClick}>
        {category.title}
      </button>
    </div>
  </td>
  <td class="align-middle" style="max-width: 300px;">
    <div class="text-truncate" title={category.description}>
      {category.description}
    </div>
  </td>
</tr>

<script>
  import { rowLink } from '$lib/rowLink.util.js';

  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let category;
  export let index;

  const dispatch = createEventDispatcher();

  function onEditClick() {
    dispatch('editClick', { index });
  }

  function onDeleteClick() {
    dispatch('deleteClick', { index });
  }
</script>
