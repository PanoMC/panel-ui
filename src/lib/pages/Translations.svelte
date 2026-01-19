<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/translations">{$_('pages.translations.title')}</CardMenuItem>
      <CardMenuItem href="/translations/languages">
        {$_('buttons.languages')}</CardMenuItem>
    </CardMenu>

    <div slot="right" class="hstack gap-2">
      {#if refreshing || saving}
        <div>
          <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
        </div>
      {/if}
      <div class="input-group">
        <select
          class="form-select"
          name="selectType"
          id="selectType"
          value={data.type}
          on:change={(e) => refreshData(e.target.value)}>
          {#each Object.keys(PageTypes) as pageType, index (pageType)}
            <option selected value={pageType}
              >{$_('buttons.' + pageType.toLowerCase().replace('_', '-'))}</option>
          {/each}
        </select>
        <select
          class="form-select"
          name="selectLanguage"
          id="selectLanguage"
          bind:value={data.locale}
          on:change={() => refreshData(data.type)}>
          {#each data.locales as locale, index (locale)}
            <option selected value={locale.code}>{locale.name}</option>
          {/each}
        </select>
      </div>
      <button
        type="button"
        title={$_('buttons.save')}
        aria-label={$_('buttons.save')}
        class="btn btn-secondary"
        disabled={saveDisabled}
        on:click={saveChanges}>
        <i class="fa fa-save"></i>
      </button>
    </div>
  </PageActions>

  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.translations.title')} ({data.filter !== FilterTypes.ALL
          ? data.meta.filterCount
          : data.meta.totalCount})
      </div>
      <!-- Search -->
      <div slot="middle">
        <SearchInput {searching} on:change={(e) => (searchQuery = e.detail.value)} />
      </div>
      <!-- Filters -->
      <CardFilters slot="right">
        <CardFiltersItem
          href="/translations{getQueryParams(data.type, data.locale, FilterTypes.ALL)}"
          active={data.filter === FilterTypes.ALL}>{$_('buttons.all')}</CardFiltersItem>
        <CardFiltersItem
          href="/translations{getQueryParams(data.type, data.locale, FilterTypes.ORIGINAL)}"
          active={data.filter === FilterTypes.ORIGINAL}>{$_('buttons.original')}</CardFiltersItem>
        <CardFiltersItem
          href="/translations{getQueryParams(data.type, data.locale, FilterTypes.CUSTOM)}"
          active={data.filter === FilterTypes.CUSTOM}>{$_('buttons.modified')}</CardFiltersItem>
        <CardFiltersItem
          href="/translations{getQueryParams(data.type, data.locale, FilterTypes.NOT_EXISTS)}"
          active={data.filter === FilterTypes.NOT_EXISTS}
          >{$_('buttons.not-exists')}</CardFiltersItem>
      </CardFilters>
    </CardHeader>
    <div class="vstack gap-3">
      <div class="accordion accordion-flush mb-2">
        {#if data.type === PageTypes.PLUGIN}
          {#each Object.keys(filteredTranslations).slice(0, pluginLimit) as pluginId, index (pluginId)}
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button
                  class="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapsePlugin{pluginId}">
                  {pluginId} ({filteredTranslations[pluginId].length})
                </button>
              </h2>
              <div id="collapsePlugin{pluginId}" class="accordion-collapse collapse show">
                <div class="accordion-body">
                  {#if !ready}
                    {#each Array(8) as _}
                      <TranslationSkeleton />
                    {/each}
                  {:else}
                    {#if (splitByPlugin[pluginId]?.notExists || []).length > 0}
                      <UnnecessaryTranslationsAlert
                        translations={splitByPlugin[pluginId].notExists}
                        {pluginId}
                        on:customInputChange={handleCustomInputChange}
                        on:deleteClick={handleOnDeleteClick}
                        open={data.filter === FilterTypes.NOT_EXISTS} />
                    {/if}

                    {#if (splitByPlugin[pluginId]?.existing || []).length > 0}
                      {#each splitByPlugin[pluginId].existing.slice(0, renderingLimit) as translation, index (translation)}
                        <TranslationRow
                          {translation}
                          {pluginId}
                          on:customInputChange={handleCustomInputChange}
                          on:deleteClick={handleOnDeleteClick} />
                      {/each}
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <NoContent />
          {/each}
        {:else}
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapse{data.type}Translations">
                {$_('buttons.' + data.type.toLowerCase().replace('_', '-'))} ({filteredTranslations.length})
              </button>
            </h2>
            <div id="collapse{data.type}Translations" class="accordion-collapse collapse show">
              <div class="accordion-body">
                {#if !ready}
                  {#each Array(12) as _}
                    <TranslationSkeleton />
                  {/each}
                {:else}
                  {#if splitFlat.notExists.length > 0}
                    <UnnecessaryTranslationsAlert
                      translations={splitFlat.notExists}
                      on:customInputChange={handleCustomInputChange}
                      on:deleteClick={handleOnDeleteClick}
                      open={data.filter === FilterTypes.NOT_EXISTS} />
                  {/if}
                  {#if splitFlat.existing.length > 0}
                    {#each splitFlat.existing.slice(0, renderingLimit) as translation, index (translation)}
                      <TranslationRow
                        {translation}
                        on:customInputChange={handleCustomInputChange}
                        on:deleteClick={handleOnDeleteClick} />
                    {/each}
                  {:else if splitFlat.notExists.length === 0}
                    <NoContent />
                  {/if}
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
      {#if ready && hasMore}
        <div use:observer class="py-2 text-center small">
          <i class="fas fa-circle-notch fa-spin me-2"></i>
          {$_('components.store-loading.loading')}
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { get } from 'svelte/store';
  import { error } from '@sveltejs/kit';
  // import { error } from "@sveltejs/kit";
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { currentLanguage } from '$lib/language.util.js';

  export const PageTypes = Object.freeze({
    PANEL: 'PANEL',
    THEME: 'THEME',
    PLUGIN: 'PLUGIN',
    PLATFORM: 'PLATFORM',
    MC_PLUGIN: 'MC_PLUGIN',
  });
  export const DefaultPageType = PageTypes.PANEL;

  export const FilterTypes = Object.freeze({
    ALL: 'ALL',
    ORIGINAL: 'ORIGINAL',
    CUSTOM: 'CUSTOM',
    NOT_EXISTS: 'NOT_EXISTS',
  });
  export const DefaultFilter = FilterTypes.ALL;

  function groupTranslationsByPluginId(translations, filter, filterResult) {
    return (filter === DefaultFilter ? translations : filterResult).reduce((acc, item) => {
      const match = item.key.match(/^plugins\.([^.]+)/);
      if (match) {
        const pluginId = match[1];
        if (!acc[pluginId]) {
          acc[pluginId] = [];
        }
        acc[pluginId].push(item);
      }
      return acc;
    }, {});
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const type = searchParams.get('type') || DefaultPageType;
    const locale = searchParams.get('locale') || get(currentLanguage).code;
    const filter = searchParams.get('filter') || DefaultFilter;

    if (!Object.values(PageTypes).includes(type)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    if (!Object.values(FilterTypes).includes(filter)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    const localesBody = await ApiUtil.get({
      path: `/api/panel/locales`,
      request: event,
    });

    const locales = localesBody.data;

    if (!locales.some((item) => item.code === locale)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    const localeId = locales.find((item) => item.code === locale).id;

    const queryParams = buildQueryParams({
      filter: filter === FilterTypes.ALL ? null : filter,
    });

    const translationsBody = await ApiUtil.get({
      path: `/api/panel/locales/${localeId}/types/${type}/translations${queryParams}`,
      request: event,
    });

    let translations = translationsBody.data;
    const originalTranslations = translations.map((t) => ({ ...t }));
    const translationInputs = translations.map((t) => ({ ...t }));
    const meta = translationsBody.meta;

    if (type === PageTypes.PLUGIN) {
      translations = groupTranslationsByPluginId(translations, filter, meta.filterResult);
    } else {
      if (filter !== DefaultFilter) {
        translations = meta.filterResult;
      }
    }

    return {
      locale,
      localeId,
      locales,
      type,
      filter,
      translations,
      translationInputs,
      originalTranslations,
      meta,
    };
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import { getContext, onDestroy, onMount, tick } from 'svelte';

  import { beforeNavigate, goto } from '$app/navigation';
  import { base } from '$app/paths';

  import { loadLanguage } from '$lib/language.util.js';

  import { show as showToast } from '$lib/component/ToastContainer.svelte';

  import CardFilters from '$lib/component/CardFilters.svelte';
  import CardFiltersItem from '$lib/component/CardFiltersItem.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import CardMenu from '$lib/component/CardMenu.svelte';
  import CardMenuItem from '$lib/component/CardMenuItem.svelte';
  import PageActions from '$lib/component/PageActions.svelte';
  import TranslationRow from '$lib/component/rows/TranslationRow.svelte';
  import TranslationSkeleton from '$lib/component/rows/TranslationSkeleton.svelte';
  import UnnecessaryTranslationsAlert from '$lib/component/UnnecessaryTranslationsAlert.svelte';
  import SearchInput from '$lib/component/SearchInput.svelte';
  import NoContent from '$lib/component/NoContent.svelte';
  import { browser } from '$app/environment';
  import { navigating } from '$app/stores';

  export let data;
  let refreshing;
  let saving;
  let searchQuery = '';
  let filteredTranslations = [];
  let searching = false;
  let ready = false;
  let renderingLimit = 40;
  let pluginLimit = 15;

  let searchWorker;
  let lastRequestId = 0;
  let keyToTranslation = new Map();
  let allGroupedByPlugin = {};
  let datasetToken = '';
  let splitByPlugin = {};
  let splitFlat = { notExists: [], existing: [] };

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.translations.title');

  function extractPluginId(key) {
    const m = String(key || '').match(/^plugins\.([^.]+)/);
    return m ? m[1] : null;
  }

  function rebuildIndexes() {
    keyToTranslation = new Map((data.translationInputs || []).map((t) => [t.key, t]));

    if (data.type === PageTypes.PLUGIN) {
      const grouped = {};
      for (const t of data.translationInputs || []) {
        const pid = extractPluginId(t.key);
        if (!pid) continue;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(t);
      }
      allGroupedByPlugin = grouped;
      filteredTranslations = grouped;
    } else {
      allGroupedByPlugin = {};
      filteredTranslations = data.translationInputs || [];
    }
  }

  function splitList(list) {
    const notExists = [];
    const existing = [];
    for (const t of list || []) {
      if (t?.notExists) notExists.push(t);
      else existing.push(t);
    }
    return { notExists, existing };
  }

  function ensureWorker() {
    if (!browser) return;
    if (searchWorker) return;
    searchWorker = new Worker(new URL('../workers/translationsSearch.worker.js', import.meta.url), {
      type: 'module',
    });
    searchWorker.onmessage = (e) => {
      const msg = e?.data || {};
      if (msg.type !== 'result') return;
      if (msg.requestId !== lastRequestId) return;

      searching = false;

      if (data.type === PageTypes.PLUGIN) {
        const keysByPlugin = msg.result || {};
        const out = {};
        for (const [pid, keys] of Object.entries(keysByPlugin)) {
          const arr = (keys || []).map((k) => keyToTranslation.get(k)).filter(Boolean);
          if (arr.length) out[pid] = arr;
        }
        filteredTranslations = out;
      } else {
        const keys = Array.isArray(msg.result) ? msg.result : [];
        filteredTranslations = keys.map((k) => keyToTranslation.get(k)).filter(Boolean);
      }
    };
  }

  function initWorkerData() {
    ensureWorker();
    if (!searchWorker) return;
    searchWorker.postMessage({
      type: 'init',
      pageType: data.type,
      locale: data.locale,
      translations: data.translationInputs || [],
    });
  }

  function runSearchInBackground(query) {
    // For empty query, use local precomputed lists (instant).
    const q = String(query || '').trim();
    if (!q) {
      // Showing all rows can still be heavy to render; briefly show the same indicator.
      searching = true;
      tick().then(() => {
        filteredTranslations =
          data.type === PageTypes.PLUGIN ? allGroupedByPlugin : data.translationInputs || [];
        // allow the spinner paint before large DOM update
        setTimeout(() => (searching = false), 0);
      });
      return;
    }

    ensureWorker();
    if (!searchWorker) return;
    searching = true;
    lastRequestId += 1;
    searchWorker.postMessage({
      type: 'search',
      requestId: lastRequestId,
      query: q,
    });
  }

  // (Re)build indexes ONLY when dataset changes (type/locale/filter), not on every custom input change.
  $: {
    const nextToken = `${data?.localeId ?? ''}|${data?.type ?? ''}|${data?.filter ?? ''}|${data?.meta?.totalCount ?? ''}`;
    if (nextToken && nextToken !== datasetToken) {
      ready = false;
      datasetToken = nextToken;
      renderingLimit = 40;
      pluginLimit = 15;

      rebuildIndexes();
      initWorkerData();
      runSearchInBackground(searchQuery);

      // Defer rendering
      tick().then(() => {
        setTimeout(() => {
          ready = true;
        }, 100);
      });
    }
  }

  $: hasMore =
    data.type === PageTypes.PLUGIN
      ? pluginLimit < Object.keys(filteredTranslations).length ||
        Object.values(filteredTranslations)
          .slice(0, pluginLimit)
          .some((list) => list.length > renderingLimit)
      : renderingLimit < filteredTranslations.length;

  function handleIntersect(entries) {
    if (entries[0].isIntersecting && ready && hasMore) {
      renderingLimit += 40;
      pluginLimit += 15;
    }
  }

  function observer(node) {
    const ob = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    ob.observe(node);
    return {
      destroy() {
        ob.disconnect();
      },
    };
  }

  // Run search in background on query changes (non-blocking)
  $: if (datasetToken) runSearchInBackground(searchQuery);

  // Pre-split lists once when filteredTranslations changes (avoid `.filter(...)` in template on every render)
  $: {
    if (data.type === PageTypes.PLUGIN) {
      const out = {};
      for (const [pid, list] of Object.entries(filteredTranslations || {})) {
        out[pid] = splitList(list);
      }
      splitByPlugin = out;
      splitFlat = { notExists: [], existing: [] };
    } else {
      splitByPlugin = {};
      splitFlat = splitList(filteredTranslations || []);
    }
  }

  $: saveDisabled =
    JSON.stringify(data.translationInputs) === JSON.stringify(data.originalTranslations) || saving;

  async function refreshData(type, invalidateAll) {
    refreshing = true;
    const queryParams = buildQueryParams({
      locale: data.locale === $currentLanguage.code ? null : data.locale,
      type,
      filter: data.filter === DefaultFilter ? null : data.filter,
    });

    await goto(queryParams, { invalidateAll });

    searchQuery = '';
    refreshing = false;
  }

  function getQueryParams(type, locale, filter) {
    return buildQueryParams({
      locale: locale === $currentLanguage.code ? null : locale,
      type: type === PageTypes.PANEL ? null : type,
      filter: type === data.type ? (filter === DefaultFilter ? null : filter) : null,
    });
  }

  function handleCustomInputChange(event) {
    const { key, value } = event.detail;

    const item = data.translationInputs.find((obj) => obj.key === key);
    item.custom = value === '' ? null : value;

    data.translationInputs = data.translationInputs;

    // Keep background search index in sync with edits (cheap single-record update)
    if (searchWorker) {
      searchWorker.postMessage({
        type: 'updateCustom',
        key,
        custom: item.custom,
      });
    }
  }

  function saveChanges() {
    saving = true;
    const translations = Object.fromEntries(
      data.translationInputs
        .filter((t) => t.custom !== null)
        .map((item) => [item.key, item.custom]),
    );

    ApiUtil.put({
      path: `/api/panel/locales/${data.localeId}/types/${data.type}/translations`,
      body: { translations },
      handler: async (body, _) => {
        if (body.error) {
          location.reload();

          return;
        }

        await loadLanguage($currentLanguage);

        await refreshData(data.type, true);

        data.originalTranslations = data.translationInputs.map((t) => ({
          ...t,
        }));

        await showToast('components.toasts.translations-save-success');

        saving = false;
      },
    });
  }

  function handleOnDeleteClick(event) {
    const { key } = event.detail;

    const index = data.translationInputs.findIndex((item) => item.key === key);

    if (index !== -1) {
      data.translationInputs.splice(index, 1);
    }

    if (data.type === PageTypes.PLUGIN) {
      data.translations = groupTranslationsByPluginId(
        data.originalTranslations.filter((item) => item.key !== key),
        data.filter,
        data.meta.filterResult.filter((item) => item.key !== key),
      );
    } else {
      if (data.filter !== DefaultFilter) {
        data.translations = data.meta.filterResult.filter((item) => item.key !== key);
      } else {
        data.translations = data.translations.filter((item) => item.key !== key);
      }
    }
  }

  const leaveHandler = (e) => {
    if (!saveDisabled) {
      e.preventDefault();
      e.returnValue = ''; // Necessary for some browsers
    }
  };

  onMount(() => {
    if (browser) {
      window?.addEventListener('beforeunload', leaveHandler);
    }

    onDestroy(() => {
      try {
        searchWorker?.terminate?.();
      } catch (e) {
        // ignore
      }
    });
  });

  onDestroy(() => {
    if (browser) {
      window?.removeEventListener('beforeunload', leaveHandler);
    }
  });

  beforeNavigate((nav) => {
    if (browser && !saveDisabled && !confirm($_('pages.translations.unsaved-changes-alert-text'))) {
      nav.cancel();
    }
  });
</script>
