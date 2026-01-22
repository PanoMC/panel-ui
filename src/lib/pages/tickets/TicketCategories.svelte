<!-- Ticket Categories Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/tickets">{$_('pages.ticket-categories.tickets')}</CardMenuItem>
      <CardMenuItem href="/tickets/categories">{$_('buttons.categories')}</CardMenuItem>
    </CardMenu>

    <button class="btn btn-secondary" type="button" on:click={onCreateCategoryClick} slot="right">
      <i class="fas fa-plus"></i>
      <span class="d-lg-inline d-none ms-2"
        >{$_('pages.ticket-categories.create-category-button')}</span>
    </button>
  </PageActions>

  <!-- Ticket Categories -->

  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.ticket-categories.card-title', {
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
    <!-- No Category -->
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
                >{$_('pages.ticket-categories.category')}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.ticket-categories.description')}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.categories as category, index (category)}
              <TicketCategoryRow
                {category}
                {index}
                on:editClick={(event) => onShowEditCategoryButtonClick(event.detail.index)}
                on:deleteClick={(event) =>
                  onShowDeleteTicketCategoryModalClick(event.detail.index)} />
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

<!-- Add / Edit Ticket Category Modal -->
<AddEditTicketCategoryModal />

<!-- Confirm Delete Ticket Category Modal -->
<ConfirmDeleteTicketCategoryModal />

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
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
      search,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/ticket/categories` + queryParams,
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

  import AddEditTicketCategoryModal, {
    show as showTicketCategoriesAddEditModal,
    setCallback as setCallbackForTicketCategoriesAddEditModal,
    onHide as onAddEditTicketCategoryModalHide,
  } from '$lib/component/modals/AddEditTicketCategoryModal.svelte';
  import ConfirmDeleteTicketCategoryModal, {
    setCallback as setDeleteTicketCategoryModalCallback,
    show as showDeleteTicketCategoryModal,
    onHide as onConfirmDeleteTicketCategoryModalHide,
  } from '$lib/component/modals/ConfirmDeleteTicketCategoryModal.svelte';

  import NoContent from '$lib/component/NoContent.svelte';
  import TicketCategoryRow from '$lib/component/rows/TicketCategoryRow.svelte';
  import PageActions from '$lib/component/PageActions.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import CardMenu from '$lib/component/CardMenu.svelte';
  import CardMenuItem from '$lib/component/CardMenuItem.svelte';

  import SearchInput from '$lib/component/SearchInput.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.ticket-categories.title');

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
      search: search || undefined,
    });

    await goto(queryParams, { invalidateAll: true, keepFocus: true });
    isSearching = false;
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function onCreateCategoryClick() {
    showTicketCategoriesAddEditModal('create');
  }

  function onShowEditCategoryButtonClick(index) {
    data.categories[index].selected = true;

    showTicketCategoriesAddEditModal('edit', data.categories[index]);
  }

  function onShowDeleteTicketCategoryModalClick(index) {
    data.categories[index].selected = true;

    showDeleteTicketCategoryModal(data.categories[index]);
  }

  setCallbackForTicketCategoriesAddEditModal((routeFirstPage) => {
    if (routeFirstPage) {
      data.page = 1;
    }

    refreshData();
  });

  onAddEditTicketCategoryModalHide((category) => {
    if (data.categories.indexOf(category) !== -1)
      data.categories[data.categories.indexOf(category)].selected = false;
  });

  setDeleteTicketCategoryModalCallback(() => {
    refreshData();
  });

  onConfirmDeleteTicketCategoryModalHide((category) => {
    if (data.categories.indexOf(category) !== -1)
      data.categories[data.categories.indexOf(category)].selected = false;
  });
</script>
