<!-- Tickets Page -->
<article class="container">
  <!-- Action Menu -->
  <PageActions>
    <a class="btn btn-link" role="button" href="{base}/tickets" slot="left">
      <i class="fas fa-arrow-left me-2"></i>
      {$_('pages.category-tickets.tickets')}
    </a>
    <div
      class:d-none="{firstLoad}"
      class="animate__animated animate__faster {getListOfChecked($checkedList)
          .length > 0
          ? 'animate__slideInUp'
          : 'animate__slideOutDown'}
      faster" slot="right">
      <a
        class="btn btn-link link-danger"
        class:disabled="{getListOfChecked($checkedList).length === 0}"
        role="button"
        href="javascript:void(0);"
        on:click="{onShowDeleteTicketsModalClick}">
        <i class="fas fa-trash me-2"></i>
        {$_('pages.category-tickets.delete')}
      </a>
      <a
        class="btn btn-danger"
        class:disabled="{getListOfChecked($checkedList).length === 0}"
        role="button"
        href="javascript:void(0);"
        on:click="{onShowCloseTicketsModalClick}">
        <i class="fas fa-times me-2"></i>
        {$_('pages.category-tickets.close-ticket')}
      </a>
    </div>

  </PageActions>

  <!-- All Tickets -->
  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title mb-md-0" slot="left">
          {$_('pages.category-tickets.table-title', {values: {ticketCount: data.ticketCount
            }}) + (getListOfChecked($checkedList).length > 0
            ? ", " + $_('pages.category-tickets.amount-selected', {values: {amount: getListOfChecked($checkedList).length}})
            : "")}
        </h5>
      </CardHeader>

      <!-- No Tickets -->
      {#if data.ticketCount === 0}
        <NoContent />
      {:else}
        <!-- Tickets Table -->
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="text-nowrap align-middle" scope="col">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      on:click="{onSelectAllClick}"
                      checked="{isAllTicketsSelected(
                        data.tickets,
                        $checkedList
                      )}"
                      id="selectAll"
                      type="checkbox" />
                  </div>
                </th>
                <th class="align-middle" scope="col">{$_('pages.category-tickets.table.title')}</th>
                <th class="align-middle" scope="col">{$_('pages.category-tickets.table.status')}</th>
                <th class="align-middle table-primary" scope="col">{$_('pages.category-tickets.table.category')}</th>
                <th class="align-middle" scope="col">{$_('pages.category-tickets.table.player')}</th>
                <th class="align-middle" scope="col">{$_('pages.category-tickets.table.last-reply')}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.tickets as ticket, index (ticket)}
                <TicketRow
                  ticket="{ticket}"
                  checkedList="{checkedList}"
                  on:showCloseTicketModalClick="{(event) =>
                    onShowCloseTicketModalClick(event.detail.id)}"
                  on:showDeleteTicketModalClick="{(event) =>
                    onShowDeleteTicketModalClick(event.detail.id)}" />
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
      <!-- Pagination -->
      <Pagination
        page="{data.page}"
        totalPage="{data.totalPage}"
        on:firstPageClick="{() => onPageClick(1)}"
        on:lastPageClick="{() => onPageClick(data.totalPage)}"
        on:pageLinkClick="{(event) => onPageClick(event.detail.page)}" />
    </div>
  </div>
</article>

<script context="module">
  import { writable, get } from "svelte/store";

  import ApiUtil, { buildQueryParams } from "$lib/api.util";
  import { error } from "@sveltejs/kit";

  let checkedList = writable([]);

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, url: { searchParams } } = event;
    await parent();

    const page = searchParams.get("page") || 1;
    const url = event.params.url;

    const queryParams = buildQueryParams({
      page,
      url,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/tickets` + queryParams,
      request: event,
    })

    if (body.error) {
      if (body.error === "NOT_EXISTS" || body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = parseInt(page);
    body.url = url;

    return body;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  import Pagination from "$lib/component/Pagination.svelte";

  import {
    setCallback as setCloseTicketModalCallback,
    show as showCloseTicketModal,
    onHide as onConfirmCloseTicketModalHide,
  } from "$lib/component/modals/ConfirmCloseTicketModal.svelte";
  import {
    setCallback as setDeleteTicketModalCallback,
    show as showDeleteTicketModal,
    onHide as onConfirmDeleteTicketModalHide,
  } from "$lib/component/modals/ConfirmDeleteTicketModal.svelte";

  import TicketRow from "$lib/component/rows/TicketRow.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  let firstLoad = true;

  $: {
    pageTitle.set($_('pages.category-tickets.title', {values: {category: (data.category?.title || "-") === "-" ? $_('pages.category-tickets.no-category') : (data.category?.title || "-")}}));
  }

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page,
    });

    await goto(queryParams);
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function getListOfChecked(list) {
    const result = Object.keys(list).filter((key) => list[key]);

    if (result.length > 0) firstLoad = false;

    return result;
  }

  function onSelectAllClick() {
    const isAllSelected = isAllTicketsSelected(data.tickets, $checkedList);

    data.tickets.forEach((ticket) => {
      $checkedList[ticket.id] = !isAllSelected;
    });
  }

  function isAllTicketsSelected(ticketsList, selectedList) {
    let isAllSelected = true;

    ticketsList.forEach((ticket) => {
      if (!selectedList[ticket.id]) isAllSelected = false;
    });

    return isAllSelected;
  }

  function clearSelections() {
    Object.keys($checkedList)
      .filter((key) => $checkedList[key])
      .forEach((key) => {
        $checkedList[key] = false;
      });
  }

  function onShowDeleteTicketsModalClick() {
    getListOfChecked(get(checkedList)).forEach(
      (id) =>
        (data.tickets[
          data.tickets.indexOf(
            data.tickets.find(
              (ticketInTickets) => ticketInTickets.id === parseInt(id)
            )
          )
        ].selected = true)
    );

    showDeleteTicketModal(getListOfChecked(get(checkedList)));
  }

  function onShowDeleteTicketModalClick(id) {
    data.tickets[
      data.tickets.indexOf(
        data.tickets.find((ticketInTickets) => ticketInTickets.id === id)
      )
    ].selected = true;

    showDeleteTicketModal([id]);
  }

  function onShowCloseTicketsModalClick() {
    getListOfChecked(get(checkedList)).forEach(
      (id) =>
        (data.tickets[
          data.tickets.indexOf(
            data.tickets.find(
              (ticketInTickets) => ticketInTickets.id === parseInt(id)
            )
          )
        ].selected = true)
    );

    showCloseTicketModal(getListOfChecked(get(checkedList)));
  }

  function onShowCloseTicketModalClick(id) {
    data.tickets[
      data.tickets.indexOf(
        data.tickets.find((ticketInTickets) => ticketInTickets.id === id)
      )
    ].selected = true;

    showCloseTicketModal([id]);
  }

  setDeleteTicketModalCallback((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      $checkedList[id] = false;
    });

    refreshData();
  });

  onConfirmDeleteTicketModalHide((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      data.tickets[
        data.tickets.indexOf(
          data.tickets.find(
            (ticketInTickets) => ticketInTickets.id === parseInt(id)
          )
        )
      ].selected = false;
    });
  });

  setCloseTicketModalCallback((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      $checkedList[id] = false;
    });

    refreshData();
  });

  onConfirmCloseTicketModalHide((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      data.tickets[
        data.tickets.indexOf(
          data.tickets.find(
            (ticketInTickets) => ticketInTickets.id === parseInt(id)
          )
        )
      ].selected = false;
    });
  });
</script>
