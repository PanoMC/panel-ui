<!-- Categories Page -->
<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses={null}>
    <!-- Submenu -->
    <PageNav slot="left">
      <PageNavItem href="/translations">{$_('pages.translations.title')}</PageNavItem>
      <PageNavItem href="/translations/languages">
        {$_('buttons.languages')}</PageNavItem>
    </PageNav>

    <button class="btn btn-secondary" type="button" slot="right" on:click={onCreateLanguageClick}>
      <i class="fas fa-plus"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.create-language')}</span>
    </button>
  </PageActions>

  <div class="card">
    <div class="card-header">
      {$_('pages.languages.card-title', {
        values: { count: data.meta.totalCount },
      })}
    </div>
    <!-- No Content -->
    {#if data.meta.totalCount === 0}
      <NoContent />
    {/if}

    <!-- Locales Table -->
    {#if data.meta.totalCount > 0}
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col"></th>
              <th class="align-middle text-nowrap" scope="col">{$_('pages.languages.name')}</th>
              <th scope="col" class="align-middle text-nowrap">{$_('pages.languages.code')}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.languages.date-fns-code')}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.languages.derivatives')}</th>
              <th scope="col" class="align-middle text-nowrap"
                >{$_('pages.languages.defined-by')}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.locales as locale, index (locale)}
              <LocaleRow
                {locale}
                {index}
                on:editClick={(event) => onShowEditLanguageButtonClick(event.detail.index)}
                on:deleteClick={(event) => onShowDeleteLanguageModalClick(event.detail.index)} />
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.meta.page}
        totalPage={data.meta.totalPage}
        on:firstPageClick={() => onPageClick(1)}
        on:lastPageClick={() => onPageClick(data.meta.totalPage)}
        on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
    </div>
  </div>
</article>

<ConfirmDeleteLanguageModal />

<AddEditLanguageModal />

<script context="module">
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
    const queryParams = buildQueryParams({ page });

    const body = await ApiUtil.get({
      path: `/api/panel/locales` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    const locales = body.data;
    const meta = body.meta;

    return { locales, meta: { ...meta, page: parseInt(page) } };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';

  import Pagination from '$lib/component/Pagination.svelte';

  import AddEditLanguageModal, {
    show as showAddEditLanguageModal,
    setCallback as setCallbackForAddEditLanguageModal,
    onHide as onAddEditLanguageModalHide,
  } from '$lib/component/modals/AddEditLanguageModal.svelte';
  import ConfirmDeleteLanguageModal, {
    setCallback as setDeleteLanguageModalCallback,
    show as showDeleteLanguageModal,
    onHide as onConfirmDeleteLanguageModalHide,
  } from '$lib/component/modals/ConfirmDeleteLanguageModal.svelte';

  import NoContent from '$lib/component/NoContent.svelte';
  import PageActions from '$lib/component/PageActions.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import LocaleRow from '$lib/component/rows/LocaleRow.svelte';
  import PageNav from '$lib/component/PageNav.svelte';
  import PageNavItem from '$lib/component/PageNavItem.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.languages.title');

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.meta.page,
    });

    await goto(queryParams, { invalidateAll: true });
  }

  async function onPageClick(page) {
    data.meta.page = page;

    await refreshData();
  }

  function onCreateLanguageClick() {
    showAddEditLanguageModal('create');
  }

  function onShowEditLanguageButtonClick(index) {
    data.locales[index].selected = true;

    showAddEditLanguageModal('edit', data.locales[index]);
  }

  setCallbackForAddEditLanguageModal((routeFirstPage) => {
    if (routeFirstPage) {
      data.page = 1;
    }

    refreshData();
  });

  onAddEditLanguageModalHide((locale) => {
    for (let loopLocale of data.locales) {
      if (parseInt(loopLocale.id) === parseInt(locale.id)) {
        data.locales[data.locales.indexOf(loopLocale)].selected = false;

        break;
      }
    }
  });

  function onShowDeleteLanguageModalClick(index) {
    data.locales[index].selected = true;

    showDeleteLanguageModal(data.locales[index]);
  }

  setDeleteLanguageModalCallback(() => {
    refreshData();
  });

  onConfirmDeleteLanguageModalHide((locale) => {
    if (data.locales.indexOf(locale) !== -1)
      data.locales[data.locales.indexOf(locale)].selected = false;
  });
</script>
