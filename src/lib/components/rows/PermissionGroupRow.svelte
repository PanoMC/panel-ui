<tr
  class="row-action"
  class:table-active={permissionGroup.selected}
  use:rowLink={`${base}/players/permissions/detail/${permissionGroup.id}`}>
  <th scope="row" class="align-middle text-center">
    {#if permissionGroup.name !== 'admin'}
      <button
        type="button"
        aria-label={$_('buttons.delete')}
        class="btn btn-link"
        on:click={onDeleteClick}
        title={$_('buttons.delete')}>
        <i class="fas fa-trash"></i>
      </button>
    {/if}
  </th>
  <td class="align-middle" style="max-width: 200px;">
    <div class="text-truncate">
      <a
        title={permissionGroup.name}
        class="text-decoration-none d-block text-truncate"
        href="{base}/players/permissions/detail/{permissionGroup.id}">
        {permissionGroup.name}
      </a>
    </div>
  </td>
  <td class="align-middle text-nowrap"
    >{#if permissionGroup.name === 'tayyip' || permissionGroup.name === 'admin'}
      <i class="fas fa-infinity"></i>
    {:else}{permissionGroup.permissionCount}{/if}</td>
  <td class="align-middle text-nowrap">{permissionGroup.userCount}</td>
</tr>

<script>
  import { rowLink } from '$lib/rowLink.util.js';

  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  export let permissionGroup;

  const dispatch = createEventDispatcher();

  function onDeleteClick() {
    dispatch('deleteClick', { permissionGroup });
  }
</script>
