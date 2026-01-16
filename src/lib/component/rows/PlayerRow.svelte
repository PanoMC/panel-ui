<tr class:table-active={player.selected}>
  <th scope="row" class="align-middle text-center">
    <div class="dropdown position-static">
      <button
        type="button"
        class="btn btn-sm btn-link"
        aria-expanded="false"
        aria-haspopup="true"
        data-bs-toggle="dropdown"
        title={$_('components.player-row.actions')}
        aria-label={$_('components.player-row.actions')}>
        <span class="fas fa-ellipsis-v"></span>
      </button>
      <div class="dropdown-menu dropdown-menu-start animate__animated animate__fadeIn">
        {#if hasPermission(Permissions.MANAGE_PERMISSION_GROUPS)}
          <a
            href="{base}/permissions"
            class="dropdown-item"
            class:disabled={$user.username === player.username ||
              (player.permissionGroup === 'admin' && !$user.admin)}>
            <i class="fas fa-user-circle me-2"></i>
            {$_('components.player-row.authorize')}
          </a>
        {/if}
        <button
          type="button"
          class="dropdown-item"
          on:click={showEditPlayerModal}
          class:disabled={player.permissionGroup === 'admin' && !$user.admin}>
          <i class="fa-solid fa-pencil-alt me-2"></i>
          {$_('buttons.edit')}
        </button>
        <button
          type="button"
          class="dropdown-item"
          on:click={() => (player.isBanned ? showUnbanPlayerModal() : showBanPlayerModal())}
          class:disabled={$user.username === player.username ||
            (player.permissionGroup === 'admin' && !$user.admin)}>
          <i class="fas fa-gavel me-2"></i>
          {#if player.isBanned}
            {$_('components.player-row.remove-ban')}
          {:else}
            {$_('components.player-row.ban')}
          {/if}
        </button>
      </div>
    </div>
  </th>
  <Hook name="panel:players:table:row:start" {player} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    <a
      class="d-inline-block focus-ring rounded-circle"
      title={$_('buttons.view')}
      href="{base}/players/detail/{player.username}">
      <img
        src="https://minotar.net/avatar/{player.username}"
        alt={player.username}
        width="32"
        height="32"
        class="rounded-circle animate__animated animate__zoomIn" />
    </a>
    <a
      class="rounded focus-ring ms-2"
      class:text-danger={player.isBanned}
      class:text-decoration-line-through={player.isBanned}
      title={$_('buttons.view')}
      href="{base}/players/detail/{player.username}">
      {player.username}
    </a>
  </td>
  <Hook name="panel:players:table:row:after-name" {player} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap text-capitalize">
    <PlayerPermissionBadge permissionGroup={player.permissionGroup} />
  </td>
  <Hook name="panel:players:table:row:after-perm-group" {player} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    <PlayerStatusBadge
      banned={player.isBanned}
      lastActivityTime={player.lastActivityTime}
      inGame={player.inGame}
      {checkTime} />
  </td>
  <Hook name="panel:players:table:row:after-status" {player} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap"><Date time={player.lastLoginDate} /></td>
  <Hook name="panel:players:table:row:after-last-login" {player} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    <Date time={player.registerDate} />
  </td>
  <Hook name="panel:players:table:row:end" {player} tag="td" class="align-middle text-nowrap" />
</tr>

<script>
  import { createEventDispatcher, getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import Date from '$lib/component/Date.svelte';
  import PlayerStatusBadge from '$lib/component/badges/PlayerStatusBadge.svelte';
  import PlayerPermissionBadge from '$lib/component/badges/PlayerPermissionBadge.svelte';
  import Hook from '$lib/component/Hook.svelte';
  import { hasPermission, Permissions } from '$lib/auth.util.js';

  const user = getContext('user');

  export let player;
  export let checkTime;

  const dispatch = createEventDispatcher();

  function showEditPlayerModal() {
    dispatch('showEditPlayerModalClick', { player });
  }

  function showBanPlayerModal() {
    dispatch('showBanPlayerModalClick', { player });
  }

  function showUnbanPlayerModal() {
    dispatch('showUnbanPlayerModalClick', { player });
  }
</script>
