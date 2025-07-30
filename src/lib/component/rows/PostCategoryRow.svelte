<tr class:table-primary={category.selected}>
  <th scope="row" class="align-middle text-center">
    <a
      title={$_("buttons.delete")}
      class="btn btn-sm btn-link link-danger"
      href="javascript:void(0);"
      on:click={onDeleteClick}>
      <i class="fas fa-trash"></i>
    </a>
  </th>
  <td class="align-middle text-nowrap">
    <a
      href="javascript:void(0);"
      title={$_("buttons.edit")}
      on:click={onEditClick}>
      {category.title}
    </a>
  </td>
  <td class="align-middle text-nowrap">{category.description}</td>
  <td class="align-middle">
    <a
      href="{UI_URL === '/' ? '' : UI_URL}/blog/category/{category.url}"
      target="_blank"
      title={$_("buttons.view")}>
      /category/{category.url}
    </a>
  </td>
  <td class="d-none">
    <input
      value="#{category.color}"
      class="form-control form-control-sm bg-transparent"
      disabled
      type="color" />
  </td>
</tr>

<script>
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";
  import { UI_URL } from "../../../pano-ui/js/variables.js";

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
