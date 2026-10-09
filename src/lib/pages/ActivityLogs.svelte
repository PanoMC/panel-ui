<div class="container vstack gap-3">
  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.activity-logs.card-title', { values: { count: visibleLogCount } })}
      </div>
      <!-- The search is the card's own subject, so it sits centred in the header rather than
           pushed to the far edge. `CardHeader` only deals the row into even thirds when all three
           slots are filled, hence the empty right one. -->
      <div slot="middle" style="width: 250px;">
        <SearchInput
          autofocus
          initialValue={search}
          searching={isSearching}
          debounceMs={300}
          ariaLabelKey="buttons.find"
          placeholderKey="buttons.find"
          on:change={onSearchInput} />
      </div>
      <div slot="right" aria-hidden="true"></div>
    </CardHeader>
    {#if logs.length === 0}
      <NoContent />
    {:else}
      <div class="list-group list-group-flush">
        {#each logs as log (log.id)}
          <ActivityLogRow {log} on:click={onShowViewActivityLogModalClick} />
        {/each}
      </div>
    {/if}
    <!-- Scrolling near the end loads the next page; the spinner is only there while it does. -->
    {#if hasMore}
      <div class="card-footer d-flex justify-content-center py-3" bind:this={sentinel}>
        {#if loadMoreLoading}
          <span
            class="spinner-border spinner-border-sm text-primary"
            role="status"
            aria-hidden="true"></span>
        {/if}
      </div>
    {/if}
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

    // The list always starts at the newest entries; older pages are appended while scrolling.
    const search = searchParams.get('search')?.trim() || '';
    const locale = searchParams.get('locale')?.trim() || '';

    const queryParams = buildLoadQueryParams({
      search: search || undefined,
      locale: locale || undefined,
    });

    const body = await ApiUtil.get({
      path: `/panel/logs/activity` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error?.code === 'PAGE_NOT_FOUND') {
        throw error(404, body.error?.code);
      }

      throw error(500, body.error?.code);
    }

    return {
      logs: body.items,
      page: body.page,
      search,
      locale,
    };
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { goto } from '$app/navigation';

  import { buildQueryParams } from '$lib/api.util.js';
  import { currentLanguage } from '$lib/language.util.js';
  import { hasNextPage, pageNumber } from '$lib/components/pagination.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
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
  let visibleLogCount = data.page.totalItems;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.activity-logs.title');

  $: visibleLogCount = data.page.totalItems;

  /** Everything shown so far: the loaded first page plus the pages appended while scrolling. */
  let logs = data.logs;
  /** The page object of the last page loaded. */
  let loaded = data.page;
  let loadMoreLoading = false;
  /** Bumped by every fresh first page, so a late answer for the previous list is dropped. */
  let listGeneration = 0;

  /** @type {HTMLDivElement | undefined} */
  let sentinel;
  /** @type {IntersectionObserver | undefined} */
  let observer;

  // A new first page (first visit, a search) starts the list over.
  $: resetList(data);

  $: hasMore = hasNextPage(loaded);

  // (Re)watch the footer whenever it is (re)rendered; it only exists while there is more.
  $: if (observer) {
    observer.disconnect();

    if (sentinel) {
      observer.observe(sentinel);
    }
  }

  function resetList(fresh) {
    listGeneration++;
    logs = fresh.logs;
    loaded = fresh.page;
    loadMoreLoading = false;
  }

  function onSearchInput(event) {
    search = event.detail.value;
    refreshData();
  }

  async function refreshData() {
    isSearching = true;

    const queryParams = buildQueryParams({
      search: search || undefined,
      locale: search ? $currentLanguage?.code || undefined : undefined,
    });

    await goto(queryParams || '?', { invalidateAll: true, keepFocus: true });

    isSearching = false;
  }

  /** The next page, appended; entries already shown are not shown twice. */
  function loadMore() {
    if (loadMoreLoading || !hasNextPage(loaded)) {
      return;
    }

    const generation = listGeneration;
    const nextPage = pageNumber(loaded) + 1;

    loadMoreLoading = true;

    ApiUtil.get({
      path:
        `/panel/logs/activity` +
        buildQueryParams({
          page: nextPage,
          search: data.search || undefined,
          locale: data.locale || undefined,
        }),
      handler: (body, reject) => {
        if (generation !== listGeneration) {
          return;
        }

        loadMoreLoading = false;

        if (body.error) {
          // The list shrank under us (logs were cleared): what is shown is all there is.
          if (body.error?.code === 'PAGE_NOT_FOUND') {
            loaded = { ...loaded, totalItems: logs.length };

            return;
          }

          reject();

          return;
        }

        const shown = new Set(logs.map((log) => log.id));

        logs = [...logs, ...(body.items || []).filter((log) => !shown.has(log.id))];
        loaded = body.page ?? { ...loaded, number: nextPage };
      },
    });
  }

  function onShowViewActivityLogModalClick(event) {
    const log = event.detail.log;

    log.selected = true;
    logs = [...logs];

    showViewActivityLogModal(log);
  }

  onViewActivityLogModalHide((log) => {
    const _log = logs.find((_log) => _log.id === log.id);

    if (!_log) {
      return;
    }

    _log.selected = false;
    logs = [...logs];
  });

  onMount(() => {
    // A margin, so the next page is asked for before the reader actually hits the end.
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '200px 0px' },
    );

    if (sentinel) {
      observer.observe(sentinel);
    }
  });

  onDestroy(() => {
    observer?.disconnect();
  });
</script>
