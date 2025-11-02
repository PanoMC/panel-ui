<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/translations"
        >{$_("pages.translations.title")}</CardMenuItem>
      <CardMenuItem href="/translations/languages">
        {$_("buttons.languages")}</CardMenuItem>
    </CardMenu>

    <div slot="right" class="hstack gap-2">
      {#if refreshing || saving}
        <div>
          <span
            class="spinner-border spinner-border-sm text-primary"
            role="status"></span>
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
              >{$_("buttons." + pageType.toLowerCase().replace("_", "-"))}</option>
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
        class="btn btn-secondary"
        disabled={saveDisabled}
        on:click={saveChanges}>{$_("buttons.save")}</button>
    </div>
  </PageActions>

  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_("pages.translations.title")} ({data.filter !== FilterTypes.ALL
          ? data.meta.filterCount
          : data.meta.totalCount})
      </div>
      <!-- Search -->
      <div slot="middle">
        <div class="input-group">
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder={$_("buttons.find")}
            aria-label={$_("buttons.find")}
            aria-describedby="find-addon"
            bind:value={searchQuery} />
        </div>
      </div>
      <!-- Filters -->
      <CardFilters slot="right">
        <CardFiltersItem
          href="/translations{getQueryParams(
            data.type,
            data.locale,
            FilterTypes.ALL,
          )}"
          active={data.filter === FilterTypes.ALL}
          >{$_("buttons.all")}</CardFiltersItem>
        <CardFiltersItem
          href="/translations{getQueryParams(
            data.type,
            data.locale,
            FilterTypes.ORIGINAL,
          )}"
          active={data.filter === FilterTypes.ORIGINAL}
          >{$_("buttons.original")}</CardFiltersItem>
        <CardFiltersItem
          href="/translations{getQueryParams(
            data.type,
            data.locale,
            FilterTypes.CUSTOM,
          )}"
          active={data.filter === FilterTypes.CUSTOM}
          >{$_("buttons.modified")}</CardFiltersItem>
        <CardFiltersItem
          href="/translations{getQueryParams(
            data.type,
            data.locale,
            FilterTypes.NOT_EXISTS,
          )}"
          active={data.filter === FilterTypes.NOT_EXISTS}
          >{$_("buttons.not-exists")}</CardFiltersItem>
      </CardFilters>
    </CardHeader>
    <div class="card-body vstack gap-3">
      <div class="accordion">
        {#if data.type === PageTypes.PLUGIN}
          {#each Object.keys(filteredTranslations) as pluginId, index (pluginId)}
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
              <div
                id="collapsePlugin{pluginId}"
                class="accordion-collapse collapse show">
                <div class="accordion-body">
                  {#if filteredTranslations[pluginId].filter((translation) => translation.notExists).length > 0}
                    <UnnecessaryTranslationsAlert
                      translations={filteredTranslations[pluginId].filter(
                        (translation) => translation.notExists,
                      )}
                      pluginId={pluginId}
                      on:customInputChange={handleCustomInputChange}
                      on:deleteClick={handleOnDeleteClick}
                      open={data.filter === FilterTypes.NOT_EXISTS} />
                  {/if}

                  {#if filteredTranslations[pluginId].filter((translation) => !translation.notExists).length > 0}
                    {#each filteredTranslations[pluginId].filter((translation) => !translation.notExists) as translation, index (translation)}
                      <TranslationRow
                        translation={translation}
                        pluginId={pluginId}
                        on:customInputChange={handleCustomInputChange}
                        on:deleteClick={handleOnDeleteClick} />
                    {/each}
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
                {$_("buttons." + data.type.toLowerCase().replace("_", "-"))} ({filteredTranslations.length})
              </button>
            </h2>
            <div
              id="collapse{data.type}Translations"
              class="accordion-collapse collapse show">
              <div class="accordion-body">
                {#if filteredTranslations.filter((translation) => translation.notExists).length > 0}
                  <UnnecessaryTranslationsAlert
                    translations={filteredTranslations.filter(
                      (translation) => translation.notExists,
                    )}
                    on:customInputChange={handleCustomInputChange}
                    on:deleteClick={handleOnDeleteClick}
                    open={data.filter === FilterTypes.NOT_EXISTS} />
                {/if}
                {#if filteredTranslations.filter((translation) => !translation.notExists).length > 0}
                  {#each filteredTranslations.filter((translation) => !translation.notExists) as translation, index (translation)}
                    <TranslationRow
                      translation={translation}
                      on:customInputChange={handleCustomInputChange}
                      on:deleteClick={handleOnDeleteClick} />
                  {/each}
                {:else if filteredTranslations.filter((translation) => translation.notExists).length === 0}
                  <NoContent />
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get } from "svelte/store";
  import { error } from "@sveltejs/kit";
  // import { error } from "@sveltejs/kit";
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { currentLanguage } from "$lib/language.util.js";

  export const PageTypes = Object.freeze({
    PANEL: "PANEL",
    THEME: "THEME",
    PLUGIN: "PLUGIN",
    PLATFORM: "PLATFORM",
    MC_PLUGIN: "MC_PLUGIN",
  });
  export const DefaultPageType = PageTypes.PANEL;

  export const FilterTypes = Object.freeze({
    ALL: "ALL",
    ORIGINAL: "ORIGINAL",
    CUSTOM: "CUSTOM",
    NOT_EXISTS: "NOT_EXISTS",
  });
  export const DefaultFilter = FilterTypes.ALL;

  function groupTranslationsByPluginId(translations, filter, filterResult) {
    return (filter === DefaultFilter ? translations : filterResult).reduce(
      (acc, item) => {
        const match = item.key.match(/^plugins\.([^.]+)/);
        if (match) {
          const pluginId = match[1];
          if (!acc[pluginId]) {
            acc[pluginId] = [];
          }
          acc[pluginId].push(item);
        }
        return acc;
      },
      {},
    );
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

    const type = searchParams.get("type") || DefaultPageType;
    const locale = searchParams.get("locale") || get(currentLanguage).code;
    const filter = searchParams.get("filter") || DefaultFilter;

    if (!Object.values(PageTypes).includes(type)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    if (!Object.values(FilterTypes).includes(filter)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    const localesBody = await ApiUtil.get({
      path: `/api/panel/locales`,
      request: event,
    });

    const locales = localesBody.data;

    if (!locales.some((item) => item.code === locale)) {
      throw error(404, "PAGE_NOT_FOUND");
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
      translations = groupTranslationsByPluginId(
        translations,
        filter,
        meta.filterResult,
      );
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
  import { _ } from "svelte-i18n";
  import { getContext, onDestroy, onMount } from "svelte";

  import { beforeNavigate, goto } from "$app/navigation";
  import { base } from "$app/paths";

  import { loadLanguage } from "$lib/language.util.js";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import CardFilters from "$lib/component/CardFilters.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import TranslationRow from "$lib/component/rows/TranslationRow.svelte";
  import UnnecessaryTranslationsAlert from "$lib/component/UnnecessaryTranslationsAlert.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import { browser } from "$app/environment";

  export let data;
  let refreshing;
  let saving;
  let searchQuery = "";
  let filteredTranslations;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.translations.title");

  function filterTranslations(translations, query) {
    if (!query || query.trim() === "") {
      return translations;
    }

    const searchTerm = query.toLowerCase();

    if (data.type === PageTypes.PLUGIN) {
      // For PLUGIN type, translations is an object grouped by pluginId
      const filtered = {};

      Object.keys(translations).forEach((pluginId) => {
        const pluginTranslations = translations[pluginId].filter(
          (translation) => {
            const matchesKey = translation.key
              .toLowerCase()
              .includes(searchTerm);
            const matchesOriginal = translation.original
              ?.toLowerCase()
              .includes(searchTerm);
            const matchesCustom = translation.custom
              ?.toLowerCase()
              .includes(searchTerm);
            const matchesPluginId = pluginId.toLowerCase().includes(searchTerm);

            return (
              matchesKey || matchesOriginal || matchesCustom || matchesPluginId
            );
          },
        );

        if (pluginTranslations.length > 0) {
          filtered[pluginId] = pluginTranslations;
        }
      });

      return filtered;
    } else {
      // For other types, translations is an array
      return translations.filter((translation) => {
        const matchesKey = translation.key.toLowerCase().includes(searchTerm);
        const matchesOriginal = translation.original
          ?.toLowerCase()
          .includes(searchTerm);
        const matchesCustom = translation.custom
          ?.toLowerCase()
          .includes(searchTerm);

        return matchesKey || matchesOriginal || matchesCustom;
      });
    }
  }

  // Reactive statement to automatically filter when data or search query changes
  $: filteredTranslations = filterTranslations(data.translations, searchQuery);

  $: saveDisabled =
    JSON.stringify(data.translationInputs) ===
      JSON.stringify(data.originalTranslations) || saving;

  async function refreshData(type, invalidateAll) {
    refreshing = true;
    const queryParams = buildQueryParams({
      locale: data.locale === $currentLanguage.code ? null : data.locale,
      type,
      filter: data.filter === DefaultFilter ? null : data.filter,
    });

    await goto(queryParams, { invalidateAll });

    searchQuery = "";
    refreshing = false;
  }

  function getQueryParams(type, locale, filter) {
    return buildQueryParams({
      locale: locale === $currentLanguage.code ? null : locale,
      type: type === PageTypes.PANEL ? null : type,
      filter:
        type === data.type ? (filter === DefaultFilter ? null : filter) : null,
    });
  }

  function handleCustomInputChange(event) {
    const { key, value } = event.detail;

    const item = data.translationInputs.find((obj) => obj.key === key);
    item.custom = value === "" ? null : value;

    data.translationInputs = data.translationInputs;
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

        await showToast("components.toasts.translations-save-success");

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
        data.translations = data.meta.filterResult.filter(
          (item) => item.key !== key,
        );
      } else {
        data.translations = data.translations.filter(
          (item) => item.key !== key,
        );
      }
    }
  }

  const leaveHandler = (e) => {
    if (!saveDisabled) {
      e.preventDefault();
      e.returnValue = ""; // Necessary for some browsers
    }
  };

  onMount(() => {
    if (browser) {
      window?.addEventListener("beforeunload", leaveHandler);
    }
  });

  onDestroy(() => {
    if (browser) {
      window?.removeEventListener("beforeunload", leaveHandler);
    }
  });

  beforeNavigate((nav) => {
    if (
      browser &&
      !saveDisabled &&
      !confirm($_("pages.translations.unsaved-changes-alert-text"))
    ) {
      nav.cancel();
    }
  });
</script>
