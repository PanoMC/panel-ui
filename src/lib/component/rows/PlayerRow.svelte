<tr class:table-primary={player.selected}>
  <th scope="row" class="align-middle text-center">
    <div class="dropdown position-static">
      <button
        type="button"
        class="btn btn-link btn-sm"
        aria-expanded="false"
        aria-haspopup="true"
        data-bs-toggle="dropdown"
        href="javascript:void(0);"
        title={$_("components.player-row.actions")}>
        <span class="fas fa-ellipsis-v"></span>
      </button>
      <div
        class="dropdown-menu dropdown-menu-start animate__animated animate__fadeIn">
        {#if hasPermission(Permissions.MANAGE_PERMISSION_GROUPS)}
          <a
            class="dropdown-item"
            href="javascript:void(0);"
            on:click={showAuthorizePlayerModal}
            class:disabled={$user.username === player.username ||
              (player.permissionGroup === "admin" && !$user.admin)}>
            <i class="fas fa-user-circle me-2"></i>
            {$_("components.player-row.authorize")}
          </a>
        {/if}
        <a
          class="dropdown-item"
          href="javascript:void(0);"
          on:click={showEditPlayerModal}
          class:disabled={player.permissionGroup === "admin" && !$user.admin}>
          <i class="fa-solid fa-pencil-alt me-2"></i>
          {$_("buttons.edit")}
        </a>
        <a
          class="dropdown-item"
          href="javascript:void(0);"
          on:click={() =>
            player.isBanned ? showUnbanPlayerModal() : showBanPlayerModal()}
          class:link-danger={$user.username !== player.username &&
            ((player.permissionGroup === "admin" && $user.admin) ||
              player.permissionGroup !== "admin")}
          class:disabled={$user.username === player.username ||
            (player.permissionGroup === "admin" && !$user.admin)}>
          <i class="fas fa-gavel me-2"></i>
          {#if player.isBanned}
            {$_("components.player-row.remove-ban")}
          {:else}
            {$_("components.player-row.ban")}
          {/if}
        </a>
      </div>
    </div>
  </th>
  <td class="align-middle text-nowrap">
    <a
      title={$_("buttons.view")}
      href="{base}/players/detail/{player.username}">
      <img
        alt={player.username}
        class="rounded-circle animate__animated animate__zoomIn me-2"
        height="32"
        src="https://minotar.net/avatar/{player.username}"
        width="32" />
      {player.username}
    </a>
  </td>
  <td class="align-middle text-nowrap text-capitalize">
    <PlayerPermissionBadge permissionGroup={player.permissionGroup} />
  </td>
  <td class="align-middle text-nowrap">
    <PlayerStatusBadge
      banned={player.isBanned}
      lastActivityTime={player.lastActivityTime}
      inGame={player.inGame}
      checkTime={checkTime} />
  </td>
  <td class="align-middle text-nowrap"><Date time={player.lastLoginDate} /></td>
  <td class="align-middle text-nowrap">
    <Date time={player.registerDate} />
  </td>
</tr>

<script>
  import { createEventDispatcher, getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import Date from "$lib/component/Date.svelte";
  import PlayerStatusBadge from "$lib/component/badges/PlayerStatusBadge.svelte";
  import PlayerPermissionBadge from "$lib/component/badges/PlayerPermissionBadge.svelte";
  import { hasPermission, Permissions } from "$lib/auth.util.js";

  const user = getContext("user");

  export let player;
  export let checkTime;

  const dispatch = createEventDispatcher();

  function showAuthorizePlayerModal() {
    dispatch("showAuthorizePlayerModalClick", { player });
  }

  function showEditPlayerModal() {
    dispatch("showEditPlayerModalClick", { player });
  }

  function showBanPlayerModal() {
    dispatch("showBanPlayerModalClick", { player });
  }

  function showUnbanPlayerModal() {
    dispatch("showUnbanPlayerModalClick", { player });
  }
</script>
