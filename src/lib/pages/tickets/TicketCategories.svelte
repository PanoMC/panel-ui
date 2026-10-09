<!-- Ticket Categories Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <!-- Submenu -->
    <PageNav slot="left">
      <PageNavItem href="/tickets">{$_('pages.ticket-categories.tickets')}</PageNavItem>
      <PageNavItem href="/tickets/categories">{$_('buttons.categories')}</PageNavItem>
    </PageNav>

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
    <!-- No Category -->
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
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.ticket-categories.category')}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.ticket-categories.description')}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as category, index (category)}
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
</article>

<!-- Add / Edit Ticket Category Modal -->
<AddEditTicketCategoryModal />

<!-- Confirm Delete Ticket Category Modal -->
<ConfirmDeleteTicketCategoryModal />

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
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
      path: `/panel/ticket/categories` + queryParams,
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

  import AddEditTicketCategoryModal, {
    show as showTicketCategoriesAddEditModal,
    setCallback as setCallbackForTicketCategoriesAddEditModal,
    onHide as onAddEditTicketCategoryModalHide,
  } from '$lib/components/modals/AddEditTicketCategoryModal.svelte';
  import ConfirmDeleteTicketCategoryModal, {
    setCallback as setDeleteTicketCategoryModalCallback,
    show as showDeleteTicketCategoryModal,
    onHide as onConfirmDeleteTicketCategoryModalHide,
  } from '$lib/components/modals/ConfirmDeleteTicketCategoryModal.svelte';

  import NoContent from '$lib/components/NoContent.svelte';
  import TicketCategoryRow from '$lib/components/rows/TicketCategoryRow.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  import SearchInput from '$lib/components/SearchInput.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.ticket-categories.title');

  let search = data.search || '';
  let isSearching = false;

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
    showTicketCategoriesAddEditModal('create');
  }

  function onShowEditCategoryButtonClick(index) {
    data.items[index].selected = true;

    showTicketCategoriesAddEditModal('edit', data.items[index]);
  }

  function onShowDeleteTicketCategoryModalClick(index) {
    data.items[index].selected = true;

    showDeleteTicketCategoryModal(data.items[index]);
  }

  setCallbackForTicketCategoriesAddEditModal((routeFirstPage) => {
    refreshData(routeFirstPage ? 1 : undefined);
  });

  onAddEditTicketCategoryModalHide((category) => {
    if (data.items.indexOf(category) !== -1)
      data.items[data.items.indexOf(category)].selected = false;
  });

  setDeleteTicketCategoryModalCallback(() => {
    refreshData();
  });

  onConfirmDeleteTicketCategoryModalHide((category) => {
    if (data.items.indexOf(category) !== -1)
      data.items[data.items.indexOf(category)].selected = false;
  });
</script>
