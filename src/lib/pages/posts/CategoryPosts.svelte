<!-- Posts Page -->
<article class="container">
  <!-- Action Menu -->
  <PageActions>
    <a class="btn btn-link" role="button" href="{base}/posts" slot="left">
      <i class="fas fa-arrow-left ms-2"></i>
      {$_('pages.category-posts.posts')}
    </a>
    <a
      class="btn btn-secondary"
      role="button"
      href="{base}/posts/create-post" slot="right">
      <i class="fas fa-plus"></i>
      <span class="d-xl-inline d-none ms-2">{$_('pages.category-posts.create-post')}</span>
    </a>
  </PageActions>

  <!-- All Posts -->

  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title mb-md-0" slot="left">
          {$_('pages.category-posts.table-title', {values: {count: data.postCount}})}
        </h5>
      </CardHeader>

      <!-- No Posts -->
      {#if data.postCount === 0}
        <NoContent />
      {:else}
        <!-- Posts Table -->
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th scope="col"></th>
                <th class="align-middle" scope="col">{$_('pages.category-posts.table.title')}</th>
                <th scope="col" class="table-primary align-middle">{$_('pages.category-posts.table.category')}</th>
                <th scope="col" class="align-middle">{$_('pages.category-posts.table.author')}</th>
                <th scope="col" class="align-middle">{$_('pages.category-posts.table.views')}</th>
                <th scope="col" class="align-middle">{$_('pages.category-posts.table.date')}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.posts as post, index (post)}
                <PostRow
                  post="{post}"
                  pageType="{data.pageType}"
                  buttonsLoading="{buttonsLoading}"
                  on:moveToDraft="{(event) => onMoveToDraft(event.detail.id)}"
                  on:publish="{(event) => onPublishClick(event.detail.id)}"
                  on:deletePost="{(event) =>
                    onDeletePostClick(event.detail.post)}" />
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
      <!-- Pagination End -->
    </div>
  </div>
</article>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util";
  import { error } from "@sveltejs/kit";

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, url: {searchParams} } = event;
    await parent();

    const page = searchParams.get("page") || 1;
    const url = event.params.url;

    const queryParams = buildQueryParams({
      page,
      url
    });
    const body = await ApiUtil.get({
      path: `/api/panel/posts` + queryParams,
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
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { page } from "$app/stores";

  import Pagination from "$lib/component/Pagination.svelte";

  import {
    setCallback as setDeletePostModalCallback,
    show as showDeletePostModal,
    onHide as onDeletePostModalHide,
  } from "$lib/component/modals/ConfirmDeletePostModal.svelte";
  import PostRow from "$lib/component/rows/PostRow.svelte";

  import NoContent from "$lib/component/NoContent.svelte";
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set($_('pages.category-posts.title', {values: {category: (data.category?.title || "-") === "-" ? $_('pages.category-posts.no-category') : (data.category?.title || "-")}}));

  let buttonsLoading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onMoveToDraft(id) {
    buttonsLoading = true;

    ApiUtil.put({
      path: `/api/panel/posts/${id}/status`,
      body: {
        to: "draft",
      },
      handler: (body, reject) => {
        if (body.error) {
          refreshBrowserPage()
          return;
        }

        buttonsLoading = false;

        refreshData();
      }
    })
  }

  function onPublishClick(id) {
    buttonsLoading = true;

    ApiUtil.put({
      path: `/api/panel/posts/${id}/status`,
      body: {
        to: "PUBLISHED",
      },
      handler: async (body, reject) => {
        if (body.error) {
          refreshBrowserPage();

          return;
        }

        buttonsLoading = false;

        await goto(base + "/posts");
      }
    })
      .then((body) => {
      })
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

  function onDeletePostClick(post) {
    data.posts[data.posts.indexOf(post)].selected = true;

    showDeletePostModal(post);
  }

  setDeletePostModalCallback((post) => {
    if (data.posts.indexOf(post) !== -1)
      data.posts[data.posts.indexOf(post)].selected = false;

    refreshData();
  });

  onDeletePostModalHide((post) => {
    if (data.posts.indexOf(post) !== -1)
      data.posts[data.posts.indexOf(post)].selected = false;
  });
</script>
