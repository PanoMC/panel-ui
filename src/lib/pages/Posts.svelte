<!-- Posts Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a
      href="{base}/posts/create-post"
      class="btn btn-secondary"
      role="button"
      slot="right">
      <i class="fas fa-plus me-2"></i>
      {$_("pages.posts.create-post-button")}
    </a>

    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/posts" startsWith
        >{$_("pages.post-categories.posts")}</CardMenuItem>
      <CardMenuItem href="/posts/categories" startsWith
        >{$_("pages.posts.post-categories-button")}</CardMenuItem>
    </CardMenu>
  </PageActions>

  <!-- All Posts -->

  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">
          {$_("pages.posts.table-title", {
            values: {
              postCount: data.postCount,
              pageType:
                data.pageType === PageTypes.PUBLISHED
                  ? $_("pages.posts.published") + " "
                  : data.pageType === PageTypes.DRAFT
                    ? $_("pages.posts.draft") + " "
                    : data.pageType === PageTypes.BANNED
                      ? $_("pages.posts.banned") + " "
                      : "",
            },
          })}
        </h5>

        <!-- Filters -->
        <CardFilters slot="right">
          <CardFiltersItem
            href="/posts/published"
            active="{data.pageType === PageTypes.PUBLISHED}">
            {$_("pages.posts.published")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/posts/draft"
            active="{data.pageType === PageTypes.DRAFT}">
            {$_("pages.posts.draft")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/posts/trash"
            active="{data.pageType === PageTypes.TRASH}">
            {$_("pages.posts.trash")}
          </CardFiltersItem>
        </CardFilters>
      </CardHeader>

      <!-- No Posts -->
      {#if data.postCount === 0}
        <NoContent />
      {:else}
        <!-- Posts Table -->
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col"></th>
                <th class="align-middle" scope="col"
                  >{$_("pages.posts.table.title")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.posts.table.category")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.posts.table.views")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.posts.table.author")}</th>
                <th scope="col" class="align-middle"
                  >{$_("pages.posts.table.last-update")}</th>
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
      <div class="d-flex justify-content-sm-start justify-content-center">
        <Pagination
          page="{data.page}"
          totalPage="{data.totalPage}"
          on:firstPageClick="{() => onPageClick(1)}"
          on:lastPageClick="{() => onPageClick(data.totalPage)}"
          on:pageLinkClick="{(event) => onPageClick(event.detail.page)}" />
      </div>
      <!-- Pagination End -->
    </div>
  </div>
</article>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  export const PageTypes = Object.freeze({
    PUBLISHED: "PUBLISHED",
    DRAFT: "DRAFT",
    TRASH: "TRASH",
  });

  export const DefaultPageType = PageTypes.PUBLISHED;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType = DefaultPageType) {
    const { parent, url: { searchParams } } = event;
    await parent();

    const page = searchParams.get("page") || 1;
    pageType = pageType.toUpperCase();

    const queryParams = buildQueryParams({
      page,
      pageType
    })

    const body = await ApiUtil.get({
      path: `/api/panel/posts` + queryParams,
      request: event,
    }).catch((err) => {
      throw error(500, err);
    });

    if (body.error === "PAGE_NOT_FOUND") {
      throw error(404, body.error);
    }

    if (body.error) {
      throw error(500, body.error);
    }

    body.page = parseInt(page);
    body.pageType = pageType;

    return body;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { goto, invalidate } from "$app/navigation";
  import { base } from "$app/paths";

  import Pagination from "$lib/component/Pagination.svelte";

  import {
    setCallback as setDeletePostModalCallback,
    show as showDeletePostModal,
    onHide as onDeletePostModalHide,
  } from "$lib/component/modals/ConfirmDeletePostModal.svelte";
  import PostRow from "$lib/component/rows/PostRow.svelte";

  import {
    show as showToast
  } from "$lib/component/ToastContainer.svelte";
  import PostMovedToDraftToast from "$lib/component/toasts/PostMovedToDraftToast.svelte";
  import PostPublishedToast from "$lib/component/toasts/PostPublishedToast.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import CardFilters from "$lib/component/CardFilters.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  $: {
    pageTitle.set(
      $_("pages.posts.title", {
        values: {
          pageType:
            data.pageType === PageTypes.PUBLISHED
              ? $_("pages.posts.published") + " "
              : data.pageType === PageTypes.DRAFT
                ? $_("pages.posts.draft") + " "
                : data.pageType === PageTypes.TRASH
                  ? $_("pages.posts.trash") + " "
                  : "",
        },
      }),
    );
  }

  let buttonsLoading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onMoveToDraft(id) {
    buttonsLoading = true;

    ApiUtil.put({
      path: `/api/panel/posts/${id}/status`,
      body: {
        to: "DRAFT",
      },
      handler: async (body, reject) => {
        if (body.error) {
          refreshBrowserPage();
          return;
        }

        buttonsLoading = false;

        await refreshData();

        await showToast(PostMovedToDraftToast, {
          title: data.posts.find((post) => post.id === id).title,
        });
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

        await showToast(PostPublishedToast, {
          postId: id,
          title: data.posts.find((post) => post.id === id).title,
        });
      }
    })
  }

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page
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
    if (data.posts.indexOf(post) !== -1) {
      data.posts[data.posts.indexOf(post)].selected = false;
    }

    invalidate((_) => true);
  });

  onDeletePostModalHide((post) => {
    if (data.posts.indexOf(post) === -1) {
      return
    }

    data.posts[data.posts.indexOf(post)].selected = false;
  });
</script>
