<!-- Tickets Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <div slot="left">
      {#if data.categoryUrl}
        <a class="btn btn-link" role="button" href="{base}/tickets">
          <i class="fas fa-arrow-left me-2"></i>
          {$_("buttons.tickets")}
        </a>
      {/if}
    </div>
    <!-- Submenu -->
    <CardMenu slot="middle">
      {#if !data.categoryUrl}
        <CardMenuItem href="/tickets"
          >{$_("pages.ticket-categories.tickets")}</CardMenuItem>
        <CardMenuItem href="/tickets/categories"
          >{$_("buttons.categories")}</CardMenuItem>
      {/if}
    </CardMenu>
    <div
      class:d-none="{firstLoad}"
      class="animate__animated animate__faster {getListOfChecked($checkedList)
        .length > 0
        ? 'animate__slideInUp'
        : 'animate__slideOutDown'}
    faster"
      slot="right">
      <button
        class="btn btn-link link-danger"
        class:disabled="{getListOfChecked($checkedList).length === 0}"
        type="button"
        on:click="{onShowDeleteTicketsModalClick}">
        <i class="fas fa-trash"></i>
      </button>
      <button
        class="btn btn-danger"
        class:disabled="{getListOfChecked($checkedList).length === 0}"
        type="button"
        on:click="{onShowCloseTicketsModalClick}">
        <i class="fas fa-times me-2"></i>
        {$_("buttons.close")}
      </button>
    </div>
  </PageActions>

  <!-- All Tickets -->
  <div class="card">
    <div class="card-header">
      <CardHeader>
        <div slot="left">
          {$_("pages.tickets.table-title", {
            values: {
              ticketCount: data.ticketCount,
              pageType:
                data.pageType === PageTypes.WAITING_REPLY
                  ? $_("pages.tickets.waiting-reply")
                  : data.pageType === PageTypes.CLOSED
                    ? $_("pages.tickets.closed")
                    : "",
            },
          }) +
            (getListOfChecked($checkedList).length > 0
              ? ", " +
                $_("pages.tickets.amount-selected", {
                  values: { amount: getListOfChecked($checkedList).length },
                })
              : "")}
        </div>

        <!-- Filters -->
        <CardFilters slot="right">
          {#if !data.categoryUrl}
            <CardFiltersItem
              href="/tickets"
              active="{data.pageType === PageTypes.ALL}">
              {$_("pages.tickets.all")}
            </CardFiltersItem>
            <CardFiltersItem
              href="/tickets?pageType=WAITING_REPLY"
              active="{data.pageType === PageTypes.WAITING_REPLY}">
              {$_("pages.tickets.waiting-reply")}
            </CardFiltersItem>
            <CardFiltersItem
              href="/tickets?pageType=CLOSED"
              active="{data.pageType === PageTypes.CLOSED}">
              {$_("pages.tickets.closed")}
            </CardFiltersItem>
          {/if}
        </CardFilters>
      </CardHeader>
    </div>
    <div class="card-body">
      <!-- No Tickets -->
      {#if data.ticketCount === 0}
        <NoContent />
      {:else}
        <!-- Tickets Table -->
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="align-middle" scope="col">
                  <div class="form-check">
                    <input
                      title="{$_('pages.tickets.select-all')}"
                      class="form-check-input"
                      on:click="{onSelectAllClick}"
                      checked="{isAllTicketsSelected(
                        data.tickets,
                        $checkedList,
                      )}"
                      id="selectAll"
                      type="checkbox" />
                  </div>
                </th>
                <th class="align-middle" scope="col"
                  >{$_("pages.tickets.table.title")}</th>
                <th
                  class="align-middle"
                  scope="col"
                  class:table-primary="{data.categoryUrl}"
                  >{$_("pages.tickets.table.category")}</th>
                <th class="align-middle" scope="col"
                  >{$_("pages.tickets.table.player")}</th>
                <th class="align-middle" scope="col"
                  >{$_("pages.tickets.table.status")}</th>
                <th class="align-middle" scope="col"
                  >{$_("pages.tickets.table.last-reply")}</th>
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

  export const PageTypes = Object.freeze({
    ALL: "ALL",
    WAITING_REPLY: "WAITING_REPLY",
    CLOSED: "CLOSED",
  });

  export const DefaultPageType = PageTypes.ALL;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const page = parseInt(searchParams.get("page")) || 1;
    const categoryUrl = searchParams.get("categoryUrl");
    const pageType = searchParams.get("pageType") || DefaultPageType;

    if (!Object.values(PageTypes).includes(pageType)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    const queryParams = buildQueryParams({
      page,
      pageType,
      categoryUrl,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/tickets` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = page;
    body.pageType = pageType;
    body.categoryUrl = categoryUrl;

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
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardFilters from "$lib/component/CardFilters.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  $: {
    pageTitle.set(
      data.categoryUrl
        ? $_("pages.tickets.category-tickets-title", {
            values: {
              category:
                (data.category?.title || "-") === "-"
                  ? $_("pages.tickets.no-category")
                  : data.category?.title || "-",
            },
          })
        : $_("pages.tickets.title", {
            values: {
              pageType:
                data.pageType === PageTypes.WAITING_REPLY
                  ? $_("pages.tickets.waiting-reply") + " "
                  : data.pageType === PageTypes.CLOSED
                    ? $_("pages.tickets.closed") + " "
                    : "",
            },
          }),
    );
  }

  let firstLoad = true;

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page,
      categoryUrl: data.categoryUrl,
      pageType: data.pageType,
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
              (ticketInTickets) => ticketInTickets.id === parseInt(id),
            ),
          )
        ].selected = true),
    );

    showDeleteTicketModal(getListOfChecked(get(checkedList)));
  }

  function onShowDeleteTicketModalClick(id) {
    data.tickets[
      data.tickets.indexOf(
        data.tickets.find((ticketInTickets) => ticketInTickets.id === id),
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
              (ticketInTickets) => ticketInTickets.id === parseInt(id),
            ),
          )
        ].selected = true),
    );

    showCloseTicketModal(getListOfChecked(get(checkedList)));
  }

  function onShowCloseTicketModalClick(id) {
    data.tickets[
      data.tickets.indexOf(
        data.tickets.find((ticketInTickets) => ticketInTickets.id === id),
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
    if (!data.tickets || data.tickets.length === 0) {
      return;
    }

    Object.values(selectedTickets).forEach((id) => {
      const index = data.tickets.indexOf(
        data.tickets.find(
          (ticketInTickets) => ticketInTickets.id === parseInt(id),
        ),
      );

      if (index === -1) {
        return;
      }

      data.tickets[index].selected = false;
    });
  });

  setCloseTicketModalCallback((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      $checkedList[id] = false;
    });

    refreshData();
  });

  onConfirmCloseTicketModalHide((selectedTickets) => {
    if (!data.tickets || data.tickets.length === 0) {
      return;
    }

    Object.values(selectedTickets).forEach((id) => {
      const index = data.tickets.indexOf(
        data.tickets.find(
          (ticketInTickets) => ticketInTickets.id === parseInt(id),
        ),
      );

      if (index === -1) {
        return;
      }

      data.tickets[index].selected = false;
    });
  });
</script>
