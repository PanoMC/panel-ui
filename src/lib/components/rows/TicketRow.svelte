<tr class:table-active={ticket.selected}>
  <th scope="row" class="align-middle">
    <div class="form-check d-flex justify-content-center align-items-center">
      <input
        use:tooltip={[$_('components.ticket-row.select')]}
        class="form-check-input"
        id="postCheck{ticket.id}"
        type="checkbox"
        bind:checked={$checkedList[ticket.id]} />
    </div>
  </th>
  <td class="align-middle text-nowrap">
    <code>#{ticket.id}</code>
  </td>
  <td class="align-middle" style="max-width: 250px;">
    <div class="text-truncate">
      <a
        href="{base}/tickets/detail/{ticket.id}"
        class="rounded focus-ring text-decoration-none d-block text-truncate"
        title={ticket.title}
        use:tooltip={[$_('buttons.view')]}
        >
        {ticket.title}
      </a>
    </div>
  </td>
  <td class="align-middle text-nowrap">
    <CategoryBadge
      category={ticket.category}
      pageType="tickets"
      filterTitle={$_('components.ticket-row.filter')}
      noCategoryText={$_('components.ticket-row.no-category')} />
  </td>
  <td class="align-middle" style="max-width: 200px;">
    <div class="text-truncate d-flex align-items-center">
      <a
        href="{base}/players/detail/{ticket.writer.username}"
        use:tooltip={[$_('buttons.view')]}
        class="rounded focus-ring text-decoration-none text-truncate d-flex align-items-center">
        <img
          src="/api/profile/picture/{ticket.writer.username}?{$avatarVersion}"
          alt={$_('components.ticket-row.player-name')}
          class="rounded-circle animate__animated animate__zoomIn me-2 flex-shrink-0"
          height="32"
          width="32" />
        <span class="text-truncate">{ticket.writer.username}</span>
      </a>
    </div>
  </td>
  <td class="align-middle text-nowrap">
    <TicketStatusBadge status={ticket.status} />
  </td>
  <td class="align-middle text-nowrap">
    <Date time={ticket.lastUpdate} />
  </td>
</tr>

<script>
  import tooltip from '$lib/tooltip.util';
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { avatarVersion } from '$lib/Store';

  import { base } from '$app/paths';

  import Date from '$lib/components/Date.svelte';
  import CategoryBadge from '$lib/components/badges/CategoryBadge.svelte';
  import TicketStatusBadge from '$lib/components/badges/TicketStatusBadge.svelte';

  export let ticket;
  export let checkedList;

  const dispatch = createEventDispatcher();

  function onShowCloseTicketModalClick() {
    dispatch('showCloseTicketModalClick', { id: ticket.id });
  }

  function onShowDeleteTicketModalClick() {
    dispatch('showDeleteTicketModalClick', { id: ticket.id });
  }
</script>
