{#snippet right()}
  <button class="btn btn-secondary" type="button" on:click={onCreateCategoryClick}>
    <i class="fas fa-plus"></i>
    <span class="d-lg-inline d-none ms-2">{$_('pages.post-categories.create-category-button')}
    </span>
  </button>
{/snippet}

<!-- Post Categories -->
<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.post-categories.card-title', {
        values: { count: data.categoryCount },
      })}
    </div>
    <div slot="middle" style="width: 250px;">
      <SearchInput
        initialValue={search}
        searching={isSearching}
        debounceMs={500}
        on:change={onSearchInput} />
    </div>
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
              <Hook name="panel:post-categories:table:header:start" tag="th" class="align-middle text-nowrap" scope="col" />
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.post-categories.category')}</th>
              <Hook name="panel:post-categories:table:header:after-category" tag="th" class="align-middle text-nowrap" scope="col" />
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.post-categories.description')}</th>
              <Hook name="panel:post-categories:table:header:after-description" tag="th" class="align-middle text-nowrap" scope="col" />
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.post-categories.url')}</th>
              <Hook name="panel:post-categories:table:header:after-url" tag="th" class="align-middle text-nowrap" scope="col" />
              <th scope="col" class="d-none align-middle text-nowrap"
                >{$_('pages.post-categories.color')}</th>
              <Hook name="panel:post-categories:table:header:end" tag="th" class="align-middle text-nowrap" scope="col" />
            </tr>
          </thead>
          <tbody>
            {#each data.categories as category, index (category)}
              <PostCategoryRow
                {category}
                {index}
                on:editClick={(event) => onShowEditCategoryButtonClick(event.detail.index)}
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

<!-- Post Category Delete Confirmation Modal -->
<ConfirmDeletePostCategoryModal />

<!-- Add / Edit Post Category Modal -->
<AddEditPostCategoryModal />

<script module>
  import ApiUtil, { buildQueryParams } from '$lib/api.util';
  import { error } from '@sveltejs/kit';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const page = searchParams.get('page') || 1;
    const search = searchParams.get('search');
    
    const queryParams = buildQueryParams({
       page,
       search
    });

    const body = await ApiUtil.get({
      path: `/api/panel/post/categories` + queryParams,
      request: event,
    });

    if (body.error) {
           if (body.error === 'NOT_EXISTS' || body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = parseInt(page);
    body.search = search;

    return body;
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import Pagination from '$lib/component/Pagination.svelte';

  import AddEditPostCategoryModal, {
    show as showAddEditPostCategoryModal,
    setCallback as setCallbackForAddEditPostCategoryModal,
    onHide as onAddEditPostCategoryModalHide,
  } from '$lib/component/modals/AddEditPostCategoryModal.svelte';
  import ConfirmDeletePostCategoryModal, {
    setCallback as setDeletePostCategoryModalCallback,
    show as showDeletePostCategoryModal,
    onHide as onConfirmDeletePostCategoryModalHide,
  } from '$lib/component/modals/ConfirmDeletePostCategoryModal.svelte';

  import NoContent from '$lib/component/NoContent.svelte';
  import PostCategoryRow from '$lib/component/rows/PostCategoryRow.svelte';
  import Hook from '$lib/component/Hook.svelte';
  import SearchInput from '$lib/component/SearchInput.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';

  const { data = $bindable() } = $props();

  const pageTitle = getContext('pageTitle');
  const slots = getContext("layout-slots");
  Object.assign(slots, { right });

  pageTitle.set('pages.post-categories.title');



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
      page: data.page === 1 ? null : data.page,
      search: search || undefined
    });

    await goto(queryParams, { invalidateAll: true });
    isSearching = false;
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function onCreateCategoryClick() {
    showAddEditPostCategoryModal('create');
  }

  function onShowEditCategoryButtonClick(index) {
    data.categories[index].selected = true;

    showAddEditPostCategoryModal('edit', data.categories[index]);
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
