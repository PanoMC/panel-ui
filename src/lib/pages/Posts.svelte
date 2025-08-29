<!-- Posts Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <CardMenu slot="middle">
      {#if !data.categoryUrl}
        <CardMenuItem href="/posts" startsWith
          >{$_("pages.post-categories.posts")}</CardMenuItem>
        <CardMenuItem href="/posts/categories" startsWith
          >{$_("pages.posts.post-categories-button")}</CardMenuItem>
      {/if}
    </CardMenu>

    <div slot="right">
      {#if !data.categoryUrl}
        <a
          href="{base}/posts/create-post"
          class="btn btn-secondary"
          role="button">
          <i class="fas fa-plus me-2"></i>
          {$_("pages.posts.create-post-button")}
        </a>
      {/if}
    </div>
  </PageActions>

  <!-- All Posts -->

  <div class="card">
    <CardHeader>
      <div slot="left">
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
      </div>

      <!-- Filters -->
      <CardFilters slot="right">
        {#if !data.categoryUrl}
          <CardFiltersItem
            href="/posts"
            active={data.pageType === PageTypes.PUBLISHED}>
            {$_("pages.posts.published")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/posts?pageType=DRAFT"
            active={data.pageType === PageTypes.DRAFT}>
            {$_("pages.posts.draft")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/posts?pageType=TRASH"
            active={data.pageType === PageTypes.TRASH}>
            {$_("pages.posts.trash")}
          </CardFiltersItem>
        {/if}
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
              <th
                scope="col"
                class="align-middle"
                class:table-primary={data.categoryUrl}
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
                post={post}
                pageType={data.pageType}
                buttonsLoading={buttonsLoading}
                on:moveToDraft={(event) => onMoveToDraftClick(event.detail.id)}
                on:publish={(event) => onPublishClick(event.detail.id)}
                on:deletePost={(event) =>
                  onDeletePostClick(event.detail.post)} />
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

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { error, redirect } from "@sveltejs/kit";

  export const PageTypes = Object.freeze({
    PUBLISHED: "PUBLISHED",
    DRAFT: "DRAFT",
    TRASH: "TRASH",
  });

  export const DefaultPageType = PageTypes.PUBLISHED;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    let page = searchParams.get("page") || 1;
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
      path: `/api/panel/posts` + queryParams,
      request: event,
    }).catch((err) => {
      throw error(500, err);
    });

    if (body.error === "PAGE_NOT_FOUND") {
      page = 1;

      const queryParams = buildQueryParams({
        page,
        categoryUrl,
        pageType,
      });

      throw redirect(302, queryParams);
    }

    if (body.error) {
      throw error(500, body.error);
    }

    body.page = parseInt(page);
    body.pageType = pageType;
    body.categoryUrl = categoryUrl;

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

  import {
    show as showDraftPostModal,
    onHide as onDraftPostModalHide,
  } from "$lib/component/modals/ConfirmDraftPostModal.svelte";

  import {
    show as showPublishPostModal,
    onHide as onPublishPostModalHide,
  } from "$lib/component/modals/ConfirmPublishPostModal.svelte";
  import PostRow from "$lib/component/rows/PostRow.svelte";

  import {
    show as showToast,
    limitTitle,
  } from "$lib/component/ToastContainer.svelte";
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
      data.categoryUrl
        ? $_("pages.posts.category-posts-title", {
            values: {
              category:
                (data.category?.title || "-") === "-"
                  ? $_("pages.posts.no-category")
                  : data.category?.title || "-",
            },
          })
        : $_("pages.posts.title", {
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

  function onMoveToDraftClick(id) {
    data.posts.find((post) => post.id === id).selected = true;
    data.posts = data.posts

    showDraftPostModal(() => {
      buttonsLoading = true;

      ApiUtil.put({
        path: `/api/panel/posts/${id}/status`,
        body: {
          to: "DRAFT",
        },
        handler: async (body) => {
          if (body.error) {
            refreshBrowserPage();
            return;
          }

          buttonsLoading = false;

          const foundTitle = data.posts.find((post) => post.id === id).title;
          const title = `<a href="${base}/posts?pageType=DRAFT">${limitTitle(foundTitle)}</a>`;

          await invalidate((_) => true);

          await showToast("components.toasts.post-moved-to-draft", {
            title,
          });
        },
      });
    })
  }

  function onPublishClick(id) {
    data.posts.find((post) => post.id === id).selected = true;
    data.posts = data.posts

    showPublishPostModal(() => {
      buttonsLoading = true;

      ApiUtil.put({
        path: `/api/panel/posts/${id}/status`,
        body: {
          to: "PUBLISHED",
        },
        handler: async (body) => {
          if (body.error) {
            refreshBrowserPage();

            return;
          }

          buttonsLoading = false;

          await goto(base + "/posts");

          const foundTitle = data.posts.find((post) => post.id === id).title;
          const title = `<a href="${base}/posts/detail/${id}">${limitTitle(foundTitle)}</a>`;

          await showToast("components.toasts.post-published", {
            postId: id,
            title,
          });

          await invalidate((_) => true);
        },
      });
    })
  }

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

  function onDeletePostClick(post) {
    data.posts[data.posts.indexOf(post)].selected = true;

    showDeletePostModal(post);
  }

  function removeSelection() {
    if (!data.posts) return
    data.posts.forEach(post => post.selected = false)
    data.posts = data.posts
  }

  setDeletePostModalCallback(() => {
    removeSelection()

    invalidate((_) => true);
  });

  onDraftPostModalHide(() => {
    removeSelection()
  })

  onPublishPostModalHide(() => {
    removeSelection()
  })

  onDeletePostModalHide(() => {
    removeSelection()
  });
</script>
