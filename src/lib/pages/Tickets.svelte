<!-- Tickets Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/tickets"
        >{$_("pages.ticket-categories.tickets")}</CardMenuItem>
      <CardMenuItem href="/tickets/categories"
        >{$_("pages.tickets.ticket-categories-button")}</CardMenuItem>
    </CardMenu>
    <div
      class:d-none="{firstLoad}"
      class="animate__animated animate__faster {getListOfChecked($checkedList)
        .length > 0
        ? 'animate__slideInUp'
        : 'animate__slideOutDown'}
    faster"
      slot="right">
      <a
        class="btn btn-link link-danger"
        class:disabled="{getListOfChecked($checkedList).length === 0}"
        role="button"
        href="javascript:void(0);"
        on:click="{onShowDeleteTicketsModalClick}">
        <i class="fas fa-trash"></i>
      </a>
      <a
        class="btn btn-danger"
        class:disabled="{getListOfChecked($checkedList).length === 0}"
        role="button"
        href="javascript:void(0);"
        on:click="{onShowCloseTicketsModalClick}">
        <i class="fas fa-times me-2"></i>
        {$_("pages.tickets.close-ticket-button")}
      </a>
    </div>
  </PageActions>

  <!-- All Tickets -->
  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">
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
        </h5>

        <!-- Filters -->
        <CardFilters slot="right">
          <CardFiltersItem
            href="/tickets/all"
            active="{data.pageType === PageTypes.ALL}">
            {$_("pages.tickets.all")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/tickets/waitingReply"
            active="{data.pageType === PageTypes.WAITING_REPLY}">
            {$_("pages.tickets.waiting-reply")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/tickets/closed"
            active="{data.pageType === PageTypes.CLOSED}">
            {$_("pages.tickets.closed")}
          </CardFiltersItem>
        </CardFilters>
      </CardHeader>

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
                <th class="align-middle" scope="col"
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
        on:firstPageClick="{() => reloadData(1)}"
        on:lastPageClick="{() => reloadData(data.totalPage)}"
        on:pageLinkClick="{(event) => reloadData(event.detail.page)}" />
    </div>
  </div>
</article>

<script context="module">
  import { writable, get } from "svelte/store";

  import ApiUtil from "$lib/api.util";
  import { showNetworkErrorOnCatch } from "$lib/Store";
  import { error } from "@sveltejs/kit";

  let checkedList = writable([]);

  export const PageTypes = Object.freeze({
    ALL: "ALL",
    WAITING_REPLY: "WAITING_REPLY",
    CLOSED: "CLOSED",
  });

  export const DefaultPageType = PageTypes.ALL;

  async function loadData({ page, pageType, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/tickets?pageType=${pageType.toUpperCase()}&page=${parseInt(page)}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          const data = body;

          data.page = parseInt(page);
          data.pageType = pageType;

          resolve(data);
        } else {
          reject(body);
        }
      });
    });
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType = DefaultPageType) {
    const { parent } = event;
    const parentData = await parent();

    pageType = pageType.toUpperCase();

    let data = {
      ticketCount: 0,
      tickets: [],
      totalPage: 1,
      page: 1,
      pageType,
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ page: event.params.page || 1, pageType, request: event })
      .then((body) => {
        data = { ...data, ...body };
      })
      .catch((body) => {
        if (body.error) {
          if (body.error === "PAGE_NOT_FOUND") {
            throw error(404, body.error);
          }

          throw error(500, body.error);
        }
      });

    return data;
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
      $_("pages.tickets.title", {
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

  function reloadData(page = data.page, pageType = data.pageType) {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({ page, pageType })
        .then((loadedData) => {
          resolve();

          if (page !== data.page) {
            goto(base + "/tickets/" + data.pageType + "/" + page);
          } else {
            data = loadedData;
          }
        })
        .catch((body) => {
          if (body.error === "PAGE_NOT_FOUND") {
            resolve();

            reloadData(page - 1);
          } else {
            reject();
          }
        });
    });
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

    reloadData();
  });

  onConfirmDeleteTicketModalHide((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      data.tickets[
        data.tickets.indexOf(
          data.tickets.find(
            (ticketInTickets) => ticketInTickets.id === parseInt(id),
          ),
        )
      ].selected = false;
    });
  });

  setCloseTicketModalCallback((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      $checkedList[id] = false;
    });

    reloadData();
  });

  onConfirmCloseTicketModalHide((selectedTickets) => {
    Object.values(selectedTickets).forEach((id) => {
      data.tickets[
        data.tickets.indexOf(
          data.tickets.find(
            (ticketInTickets) => ticketInTickets.id === parseInt(id),
          ),
        )
      ].selected = false;
    });
  });
</script>
