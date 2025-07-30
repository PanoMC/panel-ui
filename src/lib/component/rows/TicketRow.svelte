<tr class:table-primary={ticket.selected}>
  <th scope="row" class="align-middle">
    <div class="form-check d-flex justify-content-center align-items-center">
      <input
        title={$_("components.ticket-row.select")}
        class="form-check-input"
        id="postCheck{ticket.id}"
        type="checkbox"
        bind:checked={$checkedList[ticket.id]} />
    </div>
  </th>
  <td class="align-middle text-nowrap">
    <a href="{base}/tickets/detail/{ticket.id}" title={$_("buttons.view")}>
      #{ticket.id}
      {ticket.title}
    </a>
  </td>
  <td class="align-middle text-nowrap">
    <a
      title={$_("components.ticket-row.filter")}
      href="{base}/tickets?categoryUrl={ticket.category.url}">
      {ticket.category.title === "-"
        ? $_("components.ticket-row.no-category")
        : ticket.category.title}
    </a>
  </td>
  <td class="align-middle text-nowrap">
    <a
      href="{base}/players/detail/{ticket.writer.username}"
      title={$_("buttons.view")}>
      <img
        src="https://minotar.net/avatar/{ticket.writer.username}/32"
        alt={$_("components.ticket-row.player-name")}
        class="rounded-circle animate__animated animate__zoomIn me-2"
        height="32"
        width="32" />
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
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import Date from "$lib/component/Date.svelte";
  import TicketStatusBadge from "$lib/component/badges/TicketStatusBadge.svelte";

  export let ticket;
  export let checkedList;

  const dispatch = createEventDispatcher();

  function onShowCloseTicketModalClick() {
    dispatch("showCloseTicketModalClick", { id: ticket.id });
  }

  function onShowDeleteTicketModalClick() {
    dispatch("showDeleteTicketModalClick", { id: ticket.id });
  }
</script>
