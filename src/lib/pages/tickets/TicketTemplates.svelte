<!-- Ticket Templates Page: ready replies, with variables, for answering tickets and for auto-replies. -->
<article class="container vstack gap-3">
  <PageActions>
    <PageNav slot="left">
      <PageNavItem href="/tickets">{$_('pages.ticket-categories.tickets')}</PageNavItem>
      <PageNavItem href="/tickets/categories">{$_('buttons.categories')}</PageNavItem>
      <PageNavItem href="/tickets/templates">{$_('pages.ticket-templates.nav')}</PageNavItem>
    </PageNav>

    <button class="btn btn-secondary" type="button" onclick={onCreateClick} slot="right">
      <i class="fas fa-plus"></i>
      <span class="d-lg-inline d-none ms-2">{$_('pages.ticket-templates.create-button')}</span>
    </button>
  </PageActions>

  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.ticket-templates.card-title', { values: { count: data.page.totalItems } })}
      </div>
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

    {#if data.page.totalItems === 0}
      <NoContent />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col"></th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.ticket-templates.table.title')}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.ticket-templates.table.content')}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.ticket-templates.table.last-update')}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as template (template.id)}
              <tr
                class="row-action"
                class:table-active={selectedId === template.id}
                use:rowLink={() => onEditClick(template)}>
                <th scope="row" class="align-middle text-center">
                  <div class="dropdown position-static">
                    <button
                      type="button"
                      class="btn btn-link"
                      data-bs-toggle="dropdown"
                      title={$_('pages.ticket-templates.actions')}
                      aria-label={$_('pages.ticket-templates.actions')}>
                      <span class="fas fa-ellipsis-v"></span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-start">
                      <button
                        type="button"
                        class="dropdown-item"
                        onclick={() => onEditClick(template)}>
                        <i class="fas fa-pen me-2"></i>
                        {$_('buttons.edit')}
                      </button>
                      <button
                        type="button"
                        class="dropdown-item link-danger"
                        onclick={() => onDeleteClick(template)}>
                        <i class="fas fa-trash me-2"></i>
                        {$_('buttons.delete')}
                      </button>
                    </div>
                  </div>
                </th>
                <td class="align-middle" style="max-width: 220px;">
                  <button
                    type="button"
                    class="btn btn-link p-0 text-start text-decoration-none text-truncate mw-100"
                    title={template.title}
                    onclick={() => onEditClick(template)}>
                    {template.title}
                  </button>
                </td>
                <td class="align-middle" style="max-width: 360px;">
                  <div class="text-truncate text-body-secondary" title={plainText(template.body)}>
                    {plainText(template.body)}
                  </div>
                </td>
                <td class="align-middle text-nowrap">
                  <Date time={template.updatedAt} />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="card-footer">
        <Pagination
          page={data.page}
          on:firstPageClick={() => refreshData(1)}
          on:lastPageClick={() => refreshData(pageCount(data.page))}
          on:pageLinkClick={(event) => refreshData(event.detail.page)} />
      </div>
    {/if}
  </div>
</article>

<AddEditTicketTemplateModal />

<script module>
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

    const body = await ApiUtil.get({
      path: '/panel/ticket/templates' + buildQueryParams({ page, pageSize: PageSize, search }),
      request: event,
    });

    if (body.error) {
      if (body.error?.code === 'PAGE_NOT_FOUND') {
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

  import { goto, invalidateAll } from '$app/navigation';

  import { rowLink } from '$lib/rowLink.util.js';

  import AddEditTicketTemplateModal, {
    show as showAddEditTicketTemplateModal,
    setCallback as setAddEditTicketTemplateModalCallback,
  } from '$lib/components/modals/AddEditTicketTemplateModal.svelte';
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError as showErrorToast } from '$lib/components/ToastContainer.svelte';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import Date from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { pageCount } from '$lib/components/pagination.util.js';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  const { data } = $props();

  let selectedId = $state(-1);

  let search = data.search || '';
  let isSearching = $state(false);

  function onSearchInput(event) {
    search = event.detail.value;

    refreshData(1);
  }

  async function refreshData(pageNumber = data.page.number) {
    isSearching = true;

    await goto(
      buildQueryParams({
        page: pageNumber === 1 ? null : pageNumber,
        search: search || undefined,
      }),
      { refreshAll: true, reset: false },
    );

    isSearching = false;
  }

  getContext('pageTitle').set('pages.ticket-templates.title');

  /** The template's text without its markup, for the one-line preview. */
  function plainText(html) {
    return (html ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function onCreateClick() {
    showAddEditTicketTemplateModal('create', data.variables);
  }

  function onEditClick(template) {
    selectedId = template.id;

    showAddEditTicketTemplateModal('edit', data.variables, template);
  }

  function onDeleteClick(template) {
    selectedId = template.id;

    showConfirmActionModal(
      {
        title: 'pages.ticket-templates.delete.title',
        description: 'pages.ticket-templates.delete.description',
        confirmLabel: 'buttons.delete',
      },
      async () => {
        const body = await ApiUtil.delete({ path: `/panel/ticket/templates/${template.id}` }).catch(
          () => null,
        );

        if (!body || body.error) {
          await showErrorToast('pages.frontend.errors.UNKNOWN');

          return;
        }

        // The last one on a later page: that page is gone, the one before it is shown.
        if (data.items.length === 1 && data.page.number > 1) {
          await refreshData(data.page.number - 1);

          return;
        }

        await invalidateAll();
      },
      { title: template.title },
    );
  }

  setAddEditTicketTemplateModalCallback(() => {
    selectedId = -1;

    invalidateAll();
  });
</script>
