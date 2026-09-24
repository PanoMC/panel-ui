<style>
  /* The card fills what is left of the viewport (sized in the script) and the log scrolls inside
     it, so the page itself never grows. */
  .activity-card {
    min-height: 320px;
  }

  .activity-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }
</style>

<div class="card activity-card" bind:this={cardElement} style:height={cardHeight}>
  <CardHeader>
    <span slot="left">{$_('pages.servers.activity.title')}</span>
    <span slot="right" class="d-flex flex-wrap align-items-center justify-content-end gap-2">
      <div style="min-width: 12rem;">
        <SearchInput
          inputId="serverActivitySearch"
          placeholderKey="pages.servers.activity.search-placeholder"
          initialValue={searchText}
          onchange={(value) => (searchText = value)} />
      </div>
      <label class="visually-hidden" for="serverActivityUser">
        {$_('pages.servers.activity.filter-user-label')}
      </label>
      <select
        id="serverActivityUser"
        class="form-select form-select-sm w-auto"
        bind:value={userFilter}>
        <option value="">{$_('pages.servers.activity.filter-user-all')}</option>
        {#if hasSystemEntries}
          <option value={SYSTEM_ACTIVITY_USER}>{$_('pages.servers.activity.system')}</option>
        {/if}
        {#each userOptions as option (option)}
          <option value={option}>{option}</option>
        {/each}
      </select>
      <label class="visually-hidden" for="serverActivityType">
        {$_('pages.servers.activity.filter-label')}
      </label>
      <select
        id="serverActivityType"
        class="form-select form-select-sm w-auto"
        bind:value={typeFilter}>
        <option value="">{$_('pages.servers.activity.filter-all')}</option>
        {#each typeOptions as option (option)}
          <option value={option}>{activityTypeLabel(option, $_)}</option>
        {/each}
      </select>
    </span>
  </CardHeader>

  <div class="activity-scroll" bind:this={scrollElement} on:scroll={onListScroll}>
    {#if loading}
      <div class="list-group list-group-flush" aria-busy="true">
        {#each Array(6) as _, index (index)}
          <div class="list-group-item">
            <div class="d-flex gap-2 placeholder-glow">
              <span class="placeholder col-2"></span>
              <span class="placeholder col-3"></span>
              <span class="placeholder col-2 ms-auto"></span>
            </div>
            <div class="small mt-1 placeholder-glow">
              <span class="placeholder col-7"></span>
            </div>
          </div>
        {/each}
      </div>
    {:else if status === 'unavailable'}
      <div class="card-body">
        <div class="alert alert-info mb-0" role="alert">
          <i class="fa-solid fa-circle-info me-2" aria-hidden="true"></i>
          {$_('pages.servers.activity.unavailable')}
        </div>
      </div>
    {:else if status === 'error'}
      <div class="card-body">
        <div class="alert alert-warning mb-0" role="alert">
          <i class="fa-solid fa-triangle-exclamation me-2" aria-hidden="true"></i>
          {$_('pages.servers.activity.load-failed')}
        </div>
      </div>
    {:else}
      {#if visibleEntries.length === 0 && !loadingMore}
        <div class="card-body">
          <NoContent
            icon="fa-solid fa-clock-rotate-left fa-3x"
            text={entries.length === 0
              ? $_('pages.servers.activity.empty')
              : $_('pages.servers.activity.empty-filtered')} />
        </div>
      {/if}

      {#if visibleEntries.length > 0}
        <div class="list-group list-group-flush">
          {#each visibleEntries as entry (entry.id)}
            <ServerActivityEntry {entry} />
          {/each}
        </div>
      {/if}

      {#if loadingMore}
        <!-- The next page on its way: rows shaped like an entry. -->
        <div class="list-group list-group-flush" aria-busy="true">
          {#each Array(2) as _, index (index)}
            <div class="list-group-item">
              <div class="d-flex gap-2 placeholder-glow">
                <span class="placeholder col-2"></span>
                <span class="placeholder col-3"></span>
                <span class="placeholder col-2 ms-auto"></span>
              </div>
            </div>
          {/each}
        </div>
      {:else if !hasMore && entries.length > 0}
        <div class="small text-body-secondary text-center py-3">
          {$_('pages.servers.activity.end-of-history')}
        </div>
      {/if}
    {/if}
  </div>
</div>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchServerActivity, SERVER_ACTIVITY_PAGE_SIZE } from '$lib/serverActivity.util.js';

  /**
   * The log is read with `ManageServersPermission`, server-scoped (§2.4.12) — the same grant
   * that opened the servers workspace, so this only catches a hand-typed URL.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { user } = await parent();

    if (!hasPermission(Permissions.MANAGE_SERVERS, user)) {
      throw redirect(302, `${base}/servers/${params.id}`);
    }

    // The first page of the log comes with the page. A build from before §2.4.12 answers
    // `unavailable`, which the card shows as "no log" instead of failing the navigation.
    return {
      serverId: Number(params.id),
      serverActivity: await fetchServerActivity({
        serverId: params.id,
        limit: SERVER_ACTIVITY_PAGE_SIZE,
        request: event,
      }),
    };
  }
</script>

<script>
  /**
   * SM-46/§2.4.12 — who did what to this server. The endpoint pages backwards through the log
   * with a `before` cursor rather than page numbers, because entries keep arriving at the top
   * while the list is open and numbered pages would shift under the reader.
   */
  import { getContext, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import ServerActivityEntry from '$lib/components/servers/ServerActivityEntry.svelte';
  import {
    activityTypeLabel,
    isSystemActivity,
    SYSTEM_ACTIVITY_USER,
  } from '$lib/serverActivity.util.js';

  export let data;

  const server = getContext('server');

  /** @type {Array<{ id: string, type: string, username: string, createdAt: number|string|null, details: string }>} */
  let entries = [];
  let status = 'ok';
  /** Only ever true for a page this component had to fetch itself; the first one comes with it. */
  let loading = false;
  let loadingMore = false;
  let hasMore = false;
  let typeFilter = '';
  let userFilter = '';
  let searchText = '';
  /** @type {HTMLDivElement | undefined} */
  let cardElement;
  /** @type {HTMLDivElement | undefined} */
  let scrollElement;
  /** The card's height: what is left of the viewport below its top. */
  let cardHeight = undefined;
  let loadedId = null;

  $: serverId = $server?.id ?? null;

  // The page `load` fetched, on screen before the first paint — on the server as well as in
  // the browser — and re-applied when the route moves to another server. It has to come BEFORE
  // everything that reads what it sets: `hydrate` writes `entries` from inside a function, which
  // the legacy reactivity cannot see as a dependency, so a filter declared first had already run
  // for this tick on the empty list and kept showing nothing until "Load more" changed
  // `entries` again.
  $: hydrate(data, serverId);

  // The type filter narrows what is already loaded: the endpoint pages by time, not by type, so
  // offering a type that is not in the list would look broken the moment a page came back empty.
  $: typeOptions = [...new Set(entries.map((entry) => entry.type).filter(Boolean))].sort();
  $: hasSystemEntries = entries.some((entry) => isSystemActivity(entry));
  $: userOptions = [...new Set(entries.map((entry) => entry.username).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
  // The endpoint pages by time only (`before` / `limit`), so the filters narrow what is loaded —
  // and [fillViewport] keeps loading older pages while the result does not fill the box, so a
  // filter never shows an empty box while older matches exist.
  $: visibleEntries = entries.filter((entry) =>
    matchesFilters(entry, typeFilter, userFilter, searchText, $_),
  );
  $: if (browser) {
    void visibleEntries;
    void tick().then(fillViewport);
  }

  /**
   * @param {object | undefined} pageData
   * @param {number | string | null} currentId
   */
  function hydrate(pageData, currentId) {
    const id = pageData?.serverId ?? currentId;

    if (id == null || loadedId === id) {
      return;
    }

    loadedId = id;

    const result = pageData?.serverActivity;

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadActivity(id);
      }

      return;
    }

    applyActivity(result);
  }

  /**
   * @param {Awaited<ReturnType<typeof fetchServerActivity>>} result
   */
  function applyActivity(result) {
    status = result.status;
    entries = result.entries;
    hasMore = result.hasMore;
    loading = false;
  }

  /**
   * @param {number|string} id
   */
  async function loadActivity(id) {
    entries = [];
    hasMore = false;
    status = 'ok';
    loading = true;

    const result = await fetchServerActivity({ serverId: id, limit: SERVER_ACTIVITY_PAGE_SIZE });

    // Another server won the race while this request was in flight.
    if (loadedId !== id) {
      return;
    }

    applyActivity(result);
  }

  /**
   * @param {{ type: string, username: string, details: string }} entry
   * @param {string} type
   * @param {string} user
   * @param {string} text
   * @param {(key: string) => string} t
   */
  function matchesFilters(entry, type, user, text, t) {
    if (type && entry.type !== type) {
      return false;
    }

    if (user === SYSTEM_ACTIVITY_USER) {
      if (!isSystemActivity(entry)) {
        return false;
      }
    } else if (user && entry.username !== user) {
      return false;
    }

    const needle = String(text || '')
      .trim()
      .toLowerCase();

    if (!needle) {
      return true;
    }

    const actor = isSystemActivity(entry) ? t('pages.servers.activity.system') : entry.username;

    return [activityTypeLabel(entry.type, t), actor, entry.details]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  }

  /** Infinite scroll: the next page once the reader is within 200 px of the bottom. */
  function onListScroll() {
    if (!scrollElement) {
      return;
    }

    const remaining =
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;

    if (remaining < 200) {
      void loadMore();
    }
  }

  /**
   * Keeps loading older pages while what is shown does not fill the scroll box — a narrow
   * filter over the loaded pages would otherwise leave an empty box with matches further back.
   */
  function fillViewport() {
    if (!scrollElement || loading || loadingMore || !hasMore || status !== 'ok') {
      return;
    }

    if (scrollElement.scrollHeight <= scrollElement.clientHeight + 200) {
      void loadMore();
    }
  }

  /** Sizes the card to what is left of the viewport below its top edge. */
  function measureCard() {
    if (!cardElement) {
      return;
    }

    const top = cardElement.getBoundingClientRect().top + window.scrollY;
    const available = Math.floor(window.innerHeight - top - 16);

    cardHeight = `${Math.max(320, available)}px`;
  }

  onMount(() => {
    measureCard();

    const onResize = () => measureCard();

    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  });

  async function loadMore() {
    const id = serverId;
    const cursor = entries.length > 0 ? entries[entries.length - 1].id : '';

    if (id == null || loadingMore || !hasMore || !cursor) {
      return;
    }

    loadingMore = true;

    try {
      const result = await fetchServerActivity({
        serverId: id,
        limit: SERVER_ACTIVITY_PAGE_SIZE,
        before: cursor,
      });

      if (loadedId !== id || result.status !== 'ok') {
        // A failed "load more" leaves what is already on screen alone; the button simply goes.
        hasMore = false;

        return;
      }

      // The cursor is exclusive, but a backend that treats it as inclusive would otherwise
      // duplicate the boundary row.
      const known = new Set(entries.map((entry) => entry.id));
      const fresh = result.entries.filter((entry) => !known.has(entry.id));

      entries = [...entries, ...fresh];
      hasMore = result.hasMore && fresh.length > 0;
    } finally {
      loadingMore = false;
    }

    // Still not enough to scroll (or a filter hid most of it): keep going.
    await tick();
    fillViewport();
  }
</script>
