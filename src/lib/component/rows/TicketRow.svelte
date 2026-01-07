<tr class:table-active={ticket.selected}>
  <th scope="row" class="align-middle">
    <div class="form-check d-flex justify-content-center align-items-center">
      <input
        title={$_('components.ticket-row.select')}
        class="form-check-input"
        id="postCheck{ticket.id}"
        type="checkbox"
        bind:checked={$checkedList[ticket.id]} />
    </div>
  </th>
  <td class="align-middle text-nowrap">
    <code>#{ticket.id}</code>
  </td>
  <td class="align-middle text-nowrap">
    <a
      href="{base}/tickets/detail/{ticket.id}"
      class="rounded focus-ring"
      title={$_('buttons.view')}>
      {ticket.title}
    </a>
  </td>
  <td class="align-middle text-nowrap">
    <CategoryBadge
      category={ticket.category}
      pageType="tickets"
      filterTitle={$_('components.ticket-row.filter')}
      noCategoryText={$_('components.ticket-row.no-category')} />
  </td>
  <td class="align-middle text-nowrap">
    <a
      href="{base}/players/detail/{ticket.writer.username}"
      title={$_('buttons.view')}
      class="d-inline-block rounded-circle focus-ring">
      <img
        src="https://minotar.net/avatar/{ticket.writer.username}/32"
        alt={$_('components.ticket-row.player-name')}
        class="rounded-circle animate__animated animate__zoomIn"
        height="32"
        width="32" />
    </a>
    <a
      href="{base}/players/detail/{ticket.writer.username}"
      title={$_('buttons.view')}
      class="rounded focus-ring ms-2">
      {ticket.writer.username}
    </a>
  </td>
  <td class="align-middle text-nowrap">
    <TicketStatusBadge status={ticket.status} />
  </td>
  <td class="align-middle text-nowrap">
    <Date time={ticket.lastUpdate} />
  </td>
</tr>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import Date from '$lib/component/Date.svelte';
  import CategoryBadge from '$lib/component/badges/CategoryBadge.svelte';
  import TicketStatusBadge from '$lib/component/badges/TicketStatusBadge.svelte';

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
