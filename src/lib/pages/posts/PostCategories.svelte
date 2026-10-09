{#snippet right()}
  <button class="btn btn-secondary" type="button" onclick={onCreateCategoryClick}>
    <i class="fas fa-plus"></i>
    <span class="d-lg-inline d-none ms-2"
      >{$_('pages.post-categories.create-category-button')}
    </span>
  </button>
{/snippet}

<!-- Post Categories -->
<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.post-categories.card-title', {
        values: { count: data.page.totalItems },
      })}
    </div>
    <!-- The search is the card's own subject, so it sits centred in the header rather than
         pushed to the far edge. `CardHeader` only deals the row into even thirds when all three
         slots are filled, hence the empty right one. -->
    <div slot="middle" style="width: 250px;">
      <SearchInput
        autofocus
        initialValue={search}
        searching={isSearching}
        debounceMs={500}
        on:change={onSearchInput} />
    </div>
    <div slot="right" aria-hidden="true"></div>
  </CardHeader>
  <!-- No Content -->
  {#if data.page.totalItems === 0}
    <NoContent />
  {/if}

  <!-- Tickets Table -->
  {#if data.page.totalItems > 0}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col"></th>
            <Hook
              name="panel:post-categories:table:header:start"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th class="align-middle text-nowrap" scope="col"
              >{$_('pages.post-categories.category')}</th>
            <Hook
              name="panel:post-categories:table:header:after-category"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap"
              >{$_('pages.post-categories.description')}</th>
            <Hook
              name="panel:post-categories:table:header:after-description"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="align-middle text-nowrap">{$_('pages.post-categories.url')}</th>
            <Hook
              name="panel:post-categories:table:header:after-url"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
            <th scope="col" class="d-none align-middle text-nowrap"
              >{$_('pages.post-categories.color')}</th>
            <Hook
              name="panel:post-categories:table:header:end"
              tag="th"
              class="align-middle text-nowrap"
              scope="col" />
          </tr>
        </thead>
        <tbody>
          {#each data.items as category, index (category)}
            <PostCategoryRow
              {category}
              {index}
              on:editClick={(event) => onShowEditCategoryButtonClick(event.detail.index)}
              on:deleteClick={(event) => onShowDeletePostCategoryModalClick(event.detail.index)} />
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.page}
        on:firstPageClick={() => onPageClick(1)}
        on:lastPageClick={() => onPageClick(pageCount(data.page))}
        on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
    </div>
  {/if}
</div>

<!-- Post Category Delete Confirmation Modal -->
<ConfirmDeletePostCategoryModal />

<!-- Add / Edit Post Category Modal -->
<AddEditPostCategoryModal />

<script module>
  import ApiUtil, { buildQueryParams } from '$lib/api.util';
  import { error } from '@sveltejs/kit';

  const PageSize = 10;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search');

    const queryParams = buildQueryParams({
      page,
      pageSize: PageSize,
      search,
    });

    const body = await ApiUtil.get({
      path: `/panel/post/categories` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error?.code === 'NOT_EXISTS' || body.error?.code === 'PAGE_NOT_FOUND') {
        throw error(404, body.error?.code);
      }

      throw error(500, body.error?.code);
    }

    body.search = search;

    return body;
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import Pagination from '$lib/components/Pagination.svelte';
  import { pageCount } from '$lib/components/pagination.util.js';

  import AddEditPostCategoryModal, {
    show as showAddEditPostCategoryModal,
    setCallback as setCallbackForAddEditPostCategoryModal,
    onHide as onAddEditPostCategoryModalHide,
  } from '$lib/components/modals/AddEditPostCategoryModal.svelte';
  import ConfirmDeletePostCategoryModal, {
    setCallback as setDeletePostCategoryModalCallback,
    show as showDeletePostCategoryModal,
    onHide as onConfirmDeletePostCategoryModalHide,
  } from '$lib/components/modals/ConfirmDeletePostCategoryModal.svelte';

  import NoContent from '$lib/components/NoContent.svelte';
  import PostCategoryRow from '$lib/components/rows/PostCategoryRow.svelte';
  import Hook from '$lib/components/Hook.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';

  const { data = $bindable() } = $props();

  const pageTitle = getContext('pageTitle');
  const slots = getContext('layout-slots');
  Object.assign(slots, { right });

  pageTitle.set('pages.post-categories.title');

  let search = $state(data.search || '');
  let isSearching = $state(false);

  function onSearchInput(event) {
    search = event.detail.value;

    refreshData(1);
  }

  async function refreshData(pageNumber = data.page.number) {
    isSearching = true;
    const queryParams = buildQueryParams({
      page: pageNumber === 1 ? null : pageNumber,
      search: search || undefined,
    });

    await goto(queryParams, { invalidateAll: true, keepFocus: true });
    isSearching = false;
  }

  async function onPageClick(page) {
    await refreshData(page);
  }

  function onCreateCategoryClick() {
    showAddEditPostCategoryModal('create');
  }

  function onShowEditCategoryButtonClick(index) {
    data.items[index].selected = true;

    showAddEditPostCategoryModal('edit', data.items[index]);
  }

  function onShowDeletePostCategoryModalClick(index) {
    data.items[index].selected = true;

    showDeletePostCategoryModal(data.items[index]);
  }

  setCallbackForAddEditPostCategoryModal((routeFirstPage) => {
    refreshData(routeFirstPage ? 1 : undefined);
  });

  onAddEditPostCategoryModalHide((category) => {
    for (let loopCategory of data.items) {
      if (parseInt(loopCategory.id) === parseInt(category.id)) {
        data.items[data.items.indexOf(loopCategory)].selected = false;

        break;
      }
    }
  });

  setDeletePostCategoryModalCallback(() => {
    refreshData();
  });

  onConfirmDeletePostCategoryModalHide((category) => {
    if (data.items.indexOf(category) !== -1)
      data.items[data.items.indexOf(category)].selected = false;
  });
</script>
