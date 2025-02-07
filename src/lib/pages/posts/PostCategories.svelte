<!-- Categories Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <button
      class="btn btn-secondary"
      type="button"
      on:click="{onCreateCategoryClick}"
      slot="right">
      <i class="fas fa-plus me-2"></i>{$_(
        "pages.post-categories.create-category-button",
      )}
    </button>
    <CardMenu slot="middle">
      <CardMenuItem href="/posts"
        >{$_("pages.post-categories.posts")}</CardMenuItem>
      <CardMenuItem href="/posts/categories" startsWith
        >{$_("pages.posts.post-categories-button")}</CardMenuItem>
    </CardMenu>
  </PageActions>

  <!-- Post Categories -->
  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">
          {$_("pages.post-categories.card-title", {
            values: { count: data.categoryCount },
          })}
        </h5>
      </CardHeader>

      <!-- No Content -->
      {#if data.categoryCount === 0}
        <NoContent />
      {/if}

      <!-- Tickets Table -->
      {#if data.categoryCount > 0}
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col"></th>
                <th class="align-middle" scope="col"
                  >{$_("pages.post-categories.category")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.post-categories.description")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.post-categories.url")}</th>
                <th scope="col" class="d-none align-middle"
                  >{$_("pages.post-categories.color")}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.categories as category, index (category)}
                <PostCategoryRow
                  category="{category}"
                  index="{index}"
                  on:editClick="{(event) =>
                    onShowEditCategoryButtonClick(event.detail.index)}"
                  on:deleteClick="{(event) =>
                    onShowDeletePostCategoryModalClick(event.detail.index)}" />
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

<!-- Post Category Delete Confirmation Modal -->
<ConfirmDeletePostCategoryModal />

<!-- Add / Edit Post Category Modal -->
<AddEditPostCategoryModal />

<script context="module">
  import ApiUtil from "$lib/api.util";
  import { showNetworkErrorOnCatch } from "$lib/Store";
  import { error } from "@sveltejs/kit";

  async function loadData({ page, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/post/categories?page=${page}`,
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

  import AddEditPostCategoryModal, {
    show as showAddEditPostCategoryModal,
    setCallback as setCallbackForAddEditPostCategoryModal,
    onHide as onAddEditPostCategoryModalHide,
  } from "$lib/component/modals/AddEditPostCategoryModal.svelte";
  import ConfirmDeletePostCategoryModal, {
    setCallback as setDeletePostCategoryModalCallback,
    show as showDeletePostCategoryModal,
    onHide as onConfirmDeletePostCategoryModalHide,
  } from "$lib/component/modals/ConfirmDeletePostCategoryModal.svelte";

  import NoContent from "$lib/component/NoContent.svelte";
  import PostCategoryRow from "$lib/component/rows/PostCategoryRow.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.post-categories.title");

  function reloadData(page = data.page) {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({ page })
        .then((loadedData) => {
          if (page !== data.page) {
            goto(base + "/posts/categories/" + page);
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
    showAddEditPostCategoryModal("create");
  }

  function onShowEditCategoryButtonClick(index) {
    data.categories[index].selected = true;

    showAddEditPostCategoryModal("edit", data.categories[index]);
  }

  function onShowDeletePostCategoryModalClick(index) {
    data.categories[index].selected = true;

    showDeletePostCategoryModal(data.categories[index]);
  }

  setCallbackForAddEditPostCategoryModal((routeFirstPage) => {
    reloadData(routeFirstPage ? 1 : data.page);
  });

  onAddEditPostCategoryModalHide((category) => {
    for (let loopCategory of data.categories) {
      if (parseInt(loopCategory.id) === parseInt(category.id)) {
        data.categories[data.categories.indexOf(loopCategory)].selected = false;

        break;
      }
    }
  });

  setDeletePostCategoryModalCallback(() => {
    reloadData(data.page);
  });

  onConfirmDeletePostCategoryModalHide((category) => {
    if (data.categories.indexOf(category) !== -1)
      data.categories[data.categories.indexOf(category)].selected = false;
  });
</script>
