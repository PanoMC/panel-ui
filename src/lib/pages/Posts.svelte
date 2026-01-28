{#snippet right()}
  {#if !data.categoryUrl}
    <a href="{base}/posts/create-post" class="btn btn-secondary" role="button">
      <i class="fas fa-plus"></i>
      <span class="d-lg-inline d-none ms-2"> {$_('pages.posts.create-post-button')}</span>
    </a>
  {/if}
{/snippet}

<!-- All Posts -->
<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.posts.table-title', {
        values: {
          postCount: data.postCount,
          pageType:
            data.pageType === PageTypes.PUBLISHED
              ? $_('pages.posts.published') + ' '
              : data.pageType === PageTypes.DRAFT
                ? $_('pages.posts.draft') + ' '
                : data.pageType === PageTypes.BANNED
                  ? $_('pages.posts.banned') + ' '
                  : '',
        },
      })}
    </div>

    <!-- Filters -->
    <div slot="middle" style="width: 250px;">
      <SearchInput
        initialValue={search}
        searching={isSearching}
        debounceMs={500}
        on:change={onSearchInput} />
    </div>

    <!-- Filters -->
    <CardFilters slot="right">
      {#if !data.categoryUrl}
        <CardFiltersItem href="/posts" active={data.pageType === PageTypes.PUBLISHED}>
          {$_('pages.posts.published')}
        </CardFiltersItem>
        <CardFiltersItem href="/posts?pageType=DRAFT" active={data.pageType === PageTypes.DRAFT}>
          {$_('pages.posts.draft')}
        </CardFiltersItem>
        <CardFiltersItem href="/posts?pageType=TRASH" active={data.pageType === PageTypes.TRASH}>
          {$_('pages.posts.trash')}
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
            <Hook
              name="panel:posts:table:header:start"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap">{$_('pages.posts.table.image')}</th>
            <th class="align-middle text-nowrap" scope="col">{$_('pages.posts.table.title')}</th>
            <Hook
              name="panel:posts:table:header:after-title"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap" class:table-active={data.categoryUrl}
              >{$_('pages.posts.table.category')}</th>
            <Hook
              name="panel:posts:table:header:after-category"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap">{$_('pages.posts.table.views')}</th>
            <Hook
              name="panel:posts:table:header:after-views"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap">{$_('pages.posts.table.author')}</th>
            <Hook
              name="panel:posts:table:header:after-author"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap"
              >{$_('pages.posts.table.last-update')}</th>
            <Hook
              name="panel:posts:table:header:end"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
          </tr>
        </thead>
        <tbody>
          {#each data.posts as post, index (post)}
            <PostRow
              {post}
              pageType={data.pageType}
              {buttonsLoading}
              on:moveToDraft={(event) => onMoveToDraftClick(event.detail.id)}
              on:publish={(event) => onPublishClick(event.detail.id)}
              on:deletePost={(event) => onDeletePostClick(event.detail.post)} />
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.page}
        totalPage={data.totalPage}
        on:firstPageClick={() => onPageClick(1)}
        on:lastPageClick={() => onPageClick(data.totalPage)}
        on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
    </div>
  {/if}
</div>

<script module>
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { error, redirect } from '@sveltejs/kit';
  import { executeHookLoad, executeLifecycle } from '$lib/PluginAPI.js';

  export const PageTypes = Object.freeze({
    PUBLISHED: 'PUBLISHED',
    DRAFT: 'DRAFT',
    TRASH: 'TRASH',
  });

  export const DefaultPageType = PageTypes.PUBLISHED;

  export const originalPostMenuItems = [
    {
      href: '/posts',
      text: 'pages.post-categories.posts',
    },
    {
      href: '/posts/categories',
      text: 'pages.posts.post-categories-button',
      startsWith: true,
    },
  ];

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    let page = searchParams.get('page') || 1;
    const categoryUrl = searchParams.get('categoryUrl');
    const pageType = searchParams.get('pageType') || DefaultPageType;
    const search = searchParams.get('search');

    if (!Object.values(PageTypes).includes(pageType)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    const queryParams = buildQueryParams({
      page,
      pageType,
      categoryUrl,
      search,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/posts` + queryParams,
      request: event,
    }).catch((err) => {
      throw error(500, err);
    });

    if (body.error === 'PAGE_NOT_FOUND') {
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
    body.search = search;

    await executeLifecycle('panel:posts:load', body, event);

    body.hookProps = {};
    body.hookProps['panel:posts:table-header:after-views'] = await executeHookLoad(
      'panel:posts:table-header:after-views',
      event,
    );
    body.hookProps['panel:posts:table-row:after-views'] = await executeHookLoad(
      'panel:posts:table-row:after-views',
      event,
    );

    return body;
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto, invalidate } from '$app/navigation';
  import { base } from '$app/paths';

  import Pagination from '$lib/component/Pagination.svelte';

  import {
    setCallback as setDeletePostModalCallback,
    show as showDeletePostModal,
    onHide as onDeletePostModalHide,
  } from '$lib/component/modals/ConfirmDeletePostModal.svelte';
  import Hook from '$lib/component/Hook.svelte';

  import {
    show as showDraftPostModal,
    onHide as onDraftPostModalHide,
  } from '$lib/component/modals/ConfirmDraftPostModal.svelte';

  import {
    show as showPublishPostModal,
    onHide as onPublishPostModalHide,
  } from '$lib/component/modals/ConfirmPublishPostModal.svelte';
  import PostRow from '$lib/component/rows/PostRow.svelte';

  import { show as showToast, limitTitle } from '$lib/component/ToastContainer.svelte';
  import NoContent from '$lib/component/NoContent.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import CardFilters from '$lib/component/CardFilters.svelte';
  import CardFiltersItem from '$lib/component/CardFiltersItem.svelte';
  import SearchInput from '$lib/component/SearchInput.svelte';

  const { data = $bindable() } = $props();

  const pageTitle = getContext('pageTitle');
  const slots = getContext('layout-slots');
  Object.assign(slots, { right });

  $effect(() => {
    pageTitle.set(
      data.categoryUrl
        ? $_('pages.posts.category-posts-title', {
            values: {
              category:
                (data.category?.title || '-') === '-'
                  ? $_('pages.posts.no-category')
                  : data.category?.title || '-',
            },
          })
        : $_('pages.posts.title', {
            values: {
              pageType:
                data.pageType === PageTypes.PUBLISHED
                  ? $_('pages.posts.published') + ' '
                  : data.pageType === PageTypes.DRAFT
                    ? $_('pages.posts.draft') + ' '
                    : data.pageType === PageTypes.TRASH
                      ? $_('pages.posts.trash') + ' '
                      : '',
            },
          }),
    );
  });

  let buttonsLoading = $state(false);

  function refreshBrowserPage() {
    location.reload();
  }

  function onMoveToDraftClick(id) {
    data.posts.find((post) => post.id === id).selected = true;
    data.posts = data.posts;

    showDraftPostModal(() => {
      buttonsLoading = true;

      ApiUtil.put({
        path: `/api/panel/posts/${id}/status`,
        body: {
          to: 'DRAFT',
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

          await showToast('components.toasts.post-moved-to-draft', {
            title,
          });
        },
      });
    });
  }

  function onPublishClick(id) {
    data.posts.find((post) => post.id === id).selected = true;
    data.posts = data.posts;

    showPublishPostModal(() => {
      buttonsLoading = true;

      ApiUtil.put({
        path: `/api/panel/posts/${id}/status`,
        body: {
          to: 'PUBLISHED',
        },
        handler: async (body) => {
          if (body.error) {
            refreshBrowserPage();

            return;
          }

          buttonsLoading = false;

          await goto(base + '/posts');

          const foundTitle = data.posts.find((post) => post.id === id).title;
          const title = `<a href="${base}/posts/detail/${id}">${limitTitle(foundTitle)}</a>`;

          await showToast('components.toasts.post-published', {
            postId: id,
            title,
          });

          await invalidate((_) => true);
        },
      });
    });
  }

  let search = data.search || '';
  let isSearching = false;

  function onSearchInput(event) {
    search = event.detail.value;

    data.page = 1;
    refreshData();
  }

  async function refreshData() {
    isSearching = true;
    const queryParams = buildQueryParams({
      page: data.page,
      categoryUrl: data.categoryUrl,
      pageType: data.pageType,
      search: search || undefined,
    });

    await goto(queryParams, { invalidateAll: true, keepFocus: true });
    isSearching = false;
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
    if (!data.posts) return;
    data.posts.forEach((post) => (post.selected = false));
    data.posts = data.posts;
  }

  setDeletePostModalCallback(() => {
    removeSelection();

    invalidate((_) => true);
  });

  onDraftPostModalHide(() => {
    removeSelection();
  });

  onPublishPostModalHide(() => {
    removeSelection();
  });

  onDeletePostModalHide(() => {
    removeSelection();
  });
</script>
