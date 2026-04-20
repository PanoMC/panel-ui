<div class="container vstack gap-3">
  <div class="card">
    <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
      <span>
        {$_('pages.activity-logs.card-title', { values: { count: visibleLogCount } })}
      </span>
      <div style="width: min(100%, 280px);">
        <SearchInput
          initialValue={search}
          searching={isSearching}
          debounceMs={300}
          ariaLabelKey="buttons.find"
          placeholderKey="buttons.find"
          on:change={onSearchInput} />
      </div>
    </div>
    {#if data.logs.length === 0}
      <NoContent />
    {:else}
      <div class="list-group list-group-flush">
        {#each data.logs as log, index (log)}
          <ActivityLogRow {log} on:click={onShowViewActivityLogModalClick} />
        {/each}
      </div>
    {/if}
    <div class="card-footer">
      <Pagination
        page={data.meta.page}
        totalPage={data.meta.totalPage}
        on:firstPageClick={() => onPageClick(1)}
        on:lastPageClick={() => onPageClick(data.meta.totalPage)}
        on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
    </div>
  </div>
</div>

<ViewActivityLogModal />

<script context="module">
  import ApiUtil, { buildQueryParams as buildLoadQueryParams } from '$lib/api.util.js';
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

    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search')?.trim() || '';
    const locale = searchParams.get('locale')?.trim() || '';

    const queryParams = buildLoadQueryParams({
      page,
      search: search || undefined,
      locale: locale || undefined,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/logs/activity` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    return {
      logs: body.data,
      meta: { ...body.meta, page },
      search,
    };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { goto } from '$app/navigation';

  import { buildQueryParams } from '$lib/api.util.js';
  import { currentLanguage } from '$lib/language.util.js';

  import Pagination from '$lib/components/Pagination.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import ActivityLogRow from '$lib/components/rows/ActivityLogRow.svelte';
  import ViewActivityLogModal, {
    show as showViewActivityLogModal,
    onHide as onViewActivityLogModalHide,
  } from '$lib/components/modals/ViewActivityLogModal.svelte';

  export let data;

  let search = data.search || '';
  let isSearching = false;
  let visibleLogCount = data.meta.filteredCount || data.meta.totalCount;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.activity-logs.title');

  $: visibleLogCount = data.meta.filteredCount || data.meta.totalCount;

  function onSearchInput(event) {
    search = event.detail.value;
    data.meta.page = 1;
    refreshData();
  }

  async function refreshData() {
    isSearching = true;

    const queryParams = buildQueryParams({
      page: data.meta.page,
      search: search || undefined,
      locale: search ? $currentLanguage?.code || undefined : undefined,
    });

    await goto(queryParams, { invalidateAll: true, keepFocus: true });

    isSearching = false;
  }

  async function onPageClick(page) {
    data.meta.page = page;
    await refreshData();
  }

  function onShowViewActivityLogModalClick(event) {
    const log = event.detail.log;

    log.selected = true;
    data.logs = [...data.logs];

    showViewActivityLogModal(log);
  }

  onViewActivityLogModalHide((log) => {
    const _log = data.logs.find((_log) => _log.id === log.id);

    if (!_log) {
      return;
    }

    _log.selected = false;
    data.logs = [...data.logs];
  });
</script>
