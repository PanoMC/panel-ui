<tr class:table-primary={category.selected}>
  <th scope="row" class="align-middle text-center">
    <button
      type="button"
      title={$_("buttons.delete")}
      aria-label={$_("buttons.delete")}
      class="btn btn-sm btn-link"
      on:click={onDeleteClick}>
      <i class="fas fa-minus"></i>
    </button>
  </th>
  <td class="text-nowrap align-middle">
    <button type="button" class="btn btn-sm btn-link" title={$_("buttons.edit")} on:click={onEditClick}>
      {category.title}
    </button>
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
