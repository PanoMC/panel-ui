<!-- Posts Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a
      href="{base}/posts/create-post"
      class="btn btn-secondary ms-auto"
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
      <CardMenuItem disabled>Etiketler</CardMenuItem>
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
          <table class="table table-hover mb-0">
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
          on:firstPageClick="{() => reloadData(1)}"
          on:lastPageClick="{() => reloadData(data.totalPage)}"
          on:pageLinkClick="{(event) => reloadData(event.detail.page)}" />
      </div>
      <!-- Pagination End -->
    </div>
  </div>
</article>

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { showNetworkErrorOnCatch } from "$lib/Store.js";
  import { error } from "@sveltejs/kit";

  export const PageTypes = Object.freeze({
    PUBLISHED: "PUBLISHED",
    DRAFT: "DRAFT",
    TRASH: "TRASH",
  });

  export const DefaultPageType = PageTypes.PUBLISHED;

  async function loadData({ page, pageType, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/posts?page=${page}&pageType=${pageType.toUpperCase()}`,
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
      postCount: 0,
      posts: [],
      totalPage: 1,
      page: 1,
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
    setCallback as setDeletePostModalCallback,
    show as showDeletePostModal,
    onHide as onDeletePostModalHide,
  } from "$lib/component/modals/ConfirmDeletePostModal.svelte";
  import PostRow from "$lib/component/rows/PostRow.svelte";

  import {
    show as showToast,
    limitTitle,
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

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.put({
        path: `/api/panel/posts/${id}/status`,
        body: {
          to: "DRAFT",
        },
      })
        .then((body) => {
          if (body.result === "ok") {
            buttonsLoading = false;

            reloadData();

            showToast(PostMovedToDraftToast, {
              title: data.posts.find((post) => post.id === id).title,
            });

            resolve();
          } else refreshBrowserPage();
        })
        .catch(() => {
          reject();
        });
    });
  }

  function onPublishClick(id) {
    buttonsLoading = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.put({
        path: `/api/panel/posts/${id}/status`,
        body: {
          to: "PUBLISHED",
        },
      })
        .then((body) => {
          if (body.result === "ok") {
            buttonsLoading = false;

            goto(base + "/posts");

            showToast(PostPublishedToast, {
              postId: id,
              title: data.posts.find((post) => post.id === id).title,
            });

            resolve();
          } else refreshBrowserPage();
        })
        .catch(() => {
          reject();
        });
    });
  }

  function reloadData(page = data.page, pageType = data.pageType) {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({ page, pageType })
        .then((loadedData) => {
          resolve();

          if (page !== data.page) {
            goto(base + "/posts/" + data.pageType + "/" + page);
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

  function onDeletePostClick(post) {
    data.posts[data.posts.indexOf(post)].selected = true;

    showDeletePostModal(post);
  }

  setDeletePostModalCallback((post) => {
    if (data.posts.indexOf(post) !== -1)
      data.posts[data.posts.indexOf(post)].selected = false;

    reloadData();
  });

  onDeletePostModalHide((post) => {
    if (data.posts.indexOf(post) !== -1)
      data.posts[data.posts.indexOf(post)].selected = false;
  });
</script>
