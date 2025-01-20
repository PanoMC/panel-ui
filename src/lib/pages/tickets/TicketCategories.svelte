<!-- Ticket Categories Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a class="btn btn-link" role="button" href="{base}/tickets" slot="left">
      <i class="fas fa-arrow-left me-2"></i>
      {$_("pages.ticket-categories.tickets")}
    </a>
    <button
      class="btn btn-secondary"
      type="button"
      on:click="{onCreateCategoryClick}"
      slot="right">
      <i class="fas fa-plus me-2"></i>{$_(
        "pages.ticket-categories.create-category-button",
      )}
    </button>
  </PageActions>

  <!-- Ticket Categories -->

  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">
          {$_("pages.ticket-categories.card-title", {
            values: { count: data.categoryCount },
          })}
        </h5>
      </CardHeader>

      <!-- No Category -->
      {#if data.categoryCount === 0}
        <NoContent />
      {/if}

      <!-- Tickets Table -->
      {#if data.categoryCount > 0}
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th scope="col"></th>
                <th class="align-middle" scope="col"
                  >{$_("pages.ticket-categories.category")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.ticket-categories.description")}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.categories as category, index (category)}
                <TicketCategoryRow
                  category="{category}"
                  index="{index}"
                  on:editClick="{(event) =>
                    onShowEditCategoryButtonClick(event.detail.index)}"
                  on:deleteClick="{(event) =>
                    onShowDeleteTicketCategoryModalClick(
                      event.detail.index,
                    )}" />
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

<!-- Add / Edit Ticket Category Modal -->
<AddEditTicketCategoryModal />

<!-- Confirm Delete Ticket Category Modal -->
<ConfirmDeleteTicketCategoryModal />

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { showNetworkErrorOnCatch } from "$lib/Store.js";
  import { error } from "@sveltejs/kit";

  async function loadData({ page, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/ticket/categories?page=${page}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          const data = body;

          data.page = parseInt(page);

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
  export async function load(event) {
    const { parent } = event;
    const parentData = await parent();

    let data = {
      categoryCount: 0,
      categories: [],
      totalPage: 1,
      page: 1,
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ page: event.params.page || 1, request: event })
      .then((body) => {
        data = { ...data, ...body };
      })
      .catch((body) => {
        if (body.error) {
          if (body.error === "NOT_EXISTS" || body.error === "PAGE_NOT_FOUND") {
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

  import AddEditTicketCategoryModal, {
    show as showTicketCategoriesAddEditModal,
    setCallback as setCallbackForTicketCategoriesAddEditModal,
    onHide as onAddEditTicketCategoryModalHide,
  } from "$lib/component/modals/AddEditTicketCategoryModal.svelte";
  import ConfirmDeleteTicketCategoryModal, {
    setCallback as setDeleteTicketCategoryModalCallback,
    show as showDeleteTicketCategoryModal,
    onHide as onConfirmDeleteTicketCategoryModalHide,
  } from "$lib/component/modals/ConfirmDeleteTicketCategoryModal.svelte";

  import NoContent from "$lib/component/NoContent.svelte";
  import TicketCategoryRow from "$lib/component/rows/TicketCategoryRow.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.ticket-categories.title");

  function reloadData(page = data.page) {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({ page })
        .then((loadedData) => {
          if (page !== data.page) {
            goto(base + "/tickets/categories/" + page);
          } else {
            data = loadedData;
          }

          resolve();
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

  function onCreateCategoryClick() {
    showTicketCategoriesAddEditModal("create");
  }

  function onShowEditCategoryButtonClick(index) {
    data.categories[index].selected = true;

    showTicketCategoriesAddEditModal("edit", data.categories[index]);
  }

  function onShowDeleteTicketCategoryModalClick(index) {
    data.categories[index].selected = true;

    showDeleteTicketCategoryModal(data.categories[index]);
  }

  setCallbackForTicketCategoriesAddEditModal((routeFirstPage) => {
    reloadData(routeFirstPage ? 1 : data.page);
  });

  onAddEditTicketCategoryModalHide((category) => {
    if (data.categories.indexOf(category) !== -1)
      data.categories[data.categories.indexOf(category)].selected = false;
  });

  setDeleteTicketCategoryModalCallback(() => {
    reloadData(data.page);
  });

  onConfirmDeleteTicketCategoryModalHide((category) => {
    if (data.categories.indexOf(category) !== -1)
      data.categories[data.categories.indexOf(category)].selected = false;
  });
</script>
