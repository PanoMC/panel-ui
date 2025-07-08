<tr class:table-primary="{category.selected}">
  <th scope="row" class="align-middle">
    <a
      title="{$_('buttons.delete')}"
      class="btn btn-sm btn-link link-danger"
      href="javascript:void(0);"
      on:click="{onDeleteClick}">
      <i class="fas fa-trash"></i>
    </a>
  </th>
  <td class="text-nowrap align-middle">
    <a href="javascript:void(0);" title="{$_('buttons.edit')}" on:click="{onEditClick}">
      {category.title}
    </a>
  </td>
  <td class="text-nowrap align-middle">{category.description}</td>
</tr>

<script>
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  export let category;
  export let index;

  const dispatch = createEventDispatcher();

  function onEditClick() {
    dispatch("editClick", { index });
  }

  function onDeleteClick() {
    dispatch("deleteClick", { index });
  }
</script>
