<!-- Categories Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none">
    <button
      class="btn btn-secondary"
      type="button"
      on:click={onCreateCategoryClick}
      slot="right">
      <i class="fas fa-plus"></i>
      <span class="d-lg-inline d-none ms-2"
        >{$_("pages.post-categories.create-category-button")}
      </span>
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
    <div class="card-header">
      {$_("pages.post-categories.card-title", {
        values: { count: data.categoryCount },
      })}
    </div>
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
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.post-categories.category")}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_("pages.post-categories.description")}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_("pages.post-categories.url")}</th>
              <th scope="col" class="d-none align-middle text-nowrap"
                >{$_("pages.post-categories.color")}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.categories as category, index (category)}
              <PostCategoryRow
                category={category}
                index={index}
                on:editClick={(event) =>
                  onShowEditCategoryButtonClick(event.detail.index)}
                on:deleteClick={(event) =>
                  onShowDeletePostCategoryModalClick(event.detail.index)} />
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.page}
        totalPage={data.totalPage}
        on:firstPageClick={() => onPageClick(1)}
        on:lastPageClick={() => onPageClick(data.totalPage)}
        on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
    </div>
  </div>
</article>

<!-- Post Category Delete Confirmation Modal -->
<ConfirmDeletePostCategoryModal />

<!-- Add / Edit Post Category Modal -->
<AddEditPostCategoryModal />

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util";
  import { error } from "@sveltejs/kit";

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const page = searchParams.get("page") || 1;
    const queryParams = buildQueryParams({ page });

    const body = await ApiUtil.get({
      path: `/api/panel/post/categories` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === "NOT_EXISTS" || body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = parseInt(page);

    return body;
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

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page === 1 ? null : data.page,
    });

    await goto(queryParams, { invalidateAll: true });
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
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
    if (routeFirstPage) {
      data.page = 1;
    }

    refreshData();
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
    refreshData();
  });

  onConfirmDeletePostCategoryModalHide((category) => {
    if (data.categories.indexOf(category) !== -1)
      data.categories[data.categories.indexOf(category)].selected = false;
  });
</script>
