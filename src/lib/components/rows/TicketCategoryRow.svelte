<tr class:table-active={category.selected}>
  <th scope="row" class="align-middle text-center">
    <button
      type="button"
      use:tooltip={[$_('buttons.delete')]}
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
        use:tooltip={[$_('buttons.edit')]}
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
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

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
