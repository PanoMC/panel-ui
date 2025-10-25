<tr class:table-active={permissionGroup.selected}>
  <th scope="row" class="align-middle text-center">
    {#if permissionGroup.name !== "admin"}
      <button
        type="button"
        aria-label={$_("buttons.delete")}
        class="btn btn-sm btn-link"
        on:click={onDeleteClick}
        title={$_("buttons.delete")}>
        <i class="fas fa-minus"></i>
      </button>
    {/if}
  </th>
  <td class="align-middle text-nowrap">
    <a
      title={$_("buttons.edit")}
      href="{base}/players/perm-groups/detail/{permissionGroup.id}"
      >{permissionGroup.name}</a>
  </td>
  <td class="align-middle text-nowrap"
    >{#if permissionGroup.name === "tayyip" || permissionGroup.name === "admin"}
      <i class="fas fa-infinity"></i>
    {:else}{permissionGroup.permissionCount}{/if}</td>
  <td class="align-middle text-nowrap">{permissionGroup.userCount}</td>
</tr>

<script>
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  export let permissionGroup;

  const dispatch = createEventDispatcher();

  function onDeleteClick() {
    dispatch("deleteClick", { permissionGroup });
  }
</script>
