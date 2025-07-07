<tr class:table-primary="{locale.selected}">
  <th scope="row" class="align-middle">
    {#if locale.definedBy !== "SYSTEM"}
    <a
      title="{$_('buttons.delete')}"
      class="btn btn-sm btn-link link-danger"
      href="javascript:void(0);"
      on:click="{onDeleteClick}">
      <i class="fas fa-trash"></i>
    </a>
    {/if}
  </th>
  <td class="align-middle text-nowrap">
    {#if locale.definedBy !== "SYSTEM"}
    <a href="javascript:void(0);" title="{$_('buttons.edit')}" on:click="{onEditClick}">
      {locale.name}
    </a>
    {:else}
      {locale.name}
    {/if}
  </td>
  <td class="align-middle text-nowrap">{locale.code}</td>
  <td class="align-middle text-nowrap">{locale.dateFnsCode}</td>
  <td class="align-middle text-nowrap">{locale.derivatives}</td>
  <td class="align-middle text-nowrap">{$_('pages.languages.defined-by-options.' + locale.definedBy)}</td>
</tr>

<script>
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  export let locale;
  export let index;

  const dispatch = createEventDispatcher();

  function onEditClick() {
    dispatch("editClick", { index });
  }

  function onDeleteClick() {
    dispatch("deleteClick", { index });
  }
</script>
