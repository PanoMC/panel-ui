<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a href="{base}/translations/languages" class="btn btn-link" role="button" slot="left">
      <i class="fa-solid fa-earth-americas me-2"></i>
      {$_('buttons.manage-languages')}
    </a>
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/translations{getQueryParams(PageTypes.PANEL, data.locale, data.filter)}" active="{data.type === PageTypes.PANEL}">{$_('buttons.platform')}</CardMenuItem>
      <CardMenuItem href="/translations{getQueryParams(PageTypes.THEME, data.locale, data.filter)}" active="{data.type === PageTypes.THEME}">{$_('buttons.theme')}</CardMenuItem>
      <CardMenuItem href="/translations{getQueryParams(PageTypes.PLUGIN, data.locale, data.filter)}" active="{data.type === PageTypes.PLUGIN}">{$_('buttons.addons')}</CardMenuItem>
    </CardMenu>

    <div slot="right" class="hstack gap-2">
      {#if refreshing || saving}
        <div>
        <span
          class="spinner-border spinner-border-sm text-primary"
          role="status"></span>
        </div>
      {/if}
      <select class="form-select" name="selectLanguage" id="selectLanguage"
        bind:value="{data.locale}"
        on:change={refreshData}
        >
        {#each data.locales as locale, index (locale)}
          <option selected value="{locale.code}">{locale.name}</option>
        {/each}
      </select>
      <button type="button" class="btn btn-secondary" disabled="{saveDisabled}" on:click={saveChanges}>{$_('buttons.save')}</button>
    </div>
  </PageActions>

  <div class="card">
    <div class="card-header">
      <CardHeader>
        <h5 class="card-title" slot="left">{$_('pages.translations.title')} ({data.filter !== FilterTypes.ALL ? data.meta.filterCount : data.meta.totalCount})</h5>
        <!-- Filters -->
        <CardFilters slot="right">
          <CardFiltersItem href="/translations{getQueryParams(data.type, data.locale, FilterTypes.ALL)}" active="{data.filter === FilterTypes.ALL}">{$_('buttons.all')}</CardFiltersItem>
          <CardFiltersItem href="/translations{getQueryParams(data.type, data.locale, FilterTypes.ORIGINAL)}" active="{data.filter === FilterTypes.ORIGINAL}">{$_('buttons.original')}</CardFiltersItem>
          <CardFiltersItem href="/translations{getQueryParams(data.type, data.locale, FilterTypes.CUSTOM)}" active="{data.filter === FilterTypes.CUSTOM}">{$_('buttons.modified')}</CardFiltersItem>
          <CardFiltersItem href="/translations{getQueryParams(data.type, data.locale, FilterTypes.NOT_EXISTS)}" active="{data.filter === FilterTypes.NOT_EXISTS}">{$_('buttons.not-exists')}</CardFiltersItem>
        </CardFilters>
      </CardHeader>
    </div>
    <div class="card-body vstack gap-3">
      <div class="accordion">
        {#if data.type === PageTypes.PLUGIN}
          {#each Object.keys(data.translations) as pluginId, index (pluginId)}
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button
                  class="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapsePlugin{pluginId}">
                  {pluginId} ({data.translations[pluginId].length})
                </button>
              </h2>
              <div
                id="collapsePlugin{pluginId}"
                class="accordion-collapse collapse show">
                <div class="accordion-body">
                  {#if data.translations[pluginId].filter(translation => translation.notExists).length > 0}
                    <UnnecessaryTranslationsAlert translations="{data.translations[pluginId].filter(translation => translation.notExists)}" pluginId="{pluginId}" on:customInputChange={handleCustomInputChange} on:deleteClick={handleOnDeleteClick} open="{data.filter === FilterTypes.NOT_EXISTS}"/>
                  {/if}

                  {#if data.translations[pluginId].filter(translation => !translation.notExists).length > 0}
                    <div class="row-cols-3 g-2 d-flex flex-nowrap">
                      <label for="KeyTranslation">Key</label>
                      <label for="OriginalTranslation">Original</label>
                      <label for="CustomTranslation">Custom</label>
                    </div>
                    {#each data.translations[pluginId].filter(translation => !translation.notExists) as translation, index (translation)}
                      <TranslationRow translation="{translation}" pluginId="{pluginId}" on:customInputChange={handleCustomInputChange} on:deleteClick={handleOnDeleteClick}/>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <NoContent/>
          {/each}
        {:else}
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapse{data.type}Translations">
                {$_('buttons.' + data.type.toLowerCase())} ({data.translations.length})
              </button>
            </h2>
            <div
              id="collapse{data.type}Translations"
              class="accordion-collapse collapse show">
              <div class="accordion-body">
                {#if data.translations.filter(translation => translation.notExists).length > 0}
                  <UnnecessaryTranslationsAlert translations="{data.translations.filter(translation => translation.notExists)}" on:customInputChange={handleCustomInputChange} on:deleteClick={handleOnDeleteClick} open="{data.filter === FilterTypes.NOT_EXISTS}"/>
                {/if}
                {#if data.translations.filter(translation => !translation.notExists).length > 0}
                  <div class="row-cols-3 g-2 d-flex flex-nowrap">
                    <label for="KeyTranslation">Key</label>
                    <label for="OriginalTranslation">Original</label>
                    <label for="CustomTranslation">Custom</label>
                  </div>
                  {#each data.translations.filter(translation => !translation.notExists) as translation, index (translation)}
                    <TranslationRow translation="{translation}" on:customInputChange={handleCustomInputChange} on:deleteClick={handleOnDeleteClick}/>
                  {/each}
                {:else if data.translations.filter(translation => translation.notExists).length === 0}
                  <NoContent/>
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
    })

    const locales = localesBody.data

    if (!locales.some(item => item.code === locale)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    const localeId = locales.find(item => item.code === locale).id

    const queryParams = buildQueryParams({
      filter: filter === FilterTypes.ALL ? null : filter,
    });

    const translationsBody = await ApiUtil.get({
      path: `/api/panel/locales/${localeId}/types/${type}/translations${queryParams}`,
      request: event,
    })

    let translations = translationsBody.data
    const originalTranslations = translations.map(t => ({ ...t }));
    const translationInputs = translations.map(t => ({ ...t }));
    const meta = translationsBody.meta

    if (type === PageTypes.PLUGIN) {
      translations = groupTranslationsByPluginId(translations, filter, meta.filterResult)
    } else {
      if (filter !== DefaultFilter) {
        translations = meta.filterResult
      }
    }

    return { locale, localeId, locales, type, filter, translations, translationInputs, originalTranslations, meta };
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

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.translations.title")

  $: saveDisabled = JSON.stringify(data.translationInputs) === JSON.stringify(data.originalTranslations) || saving;

  async function refreshData(invalidateAll) {
    refreshing = true;
    const queryParams = buildQueryParams({
      locale: data.locale === $currentLanguage.code ? null : data.locale,
      type: data.type,
      filter: data.filter === DefaultFilter ? null : data.filter
    });

    await goto(queryParams, {invalidateAll});

    refreshing = false;
  }

  function getQueryParams(type, locale, filter) {
    return buildQueryParams({
      locale: locale === $currentLanguage.code ? null : locale,
      type: type === PageTypes.PANEL ? null : type,
      filter: filter === DefaultFilter ? null : filter
    })
  }

  function handleCustomInputChange(event) {
    const { key, value } = event.detail;

    const item = data.translationInputs.find(obj => obj.key === key);
    item.custom = value === '' ? null : value;

    data.translationInputs = data.translationInputs;
  }

  function saveChanges() {
    saving = true;
    const translations = Object.fromEntries(data.translationInputs.filter(t => t.custom !== null).map(item => [item.key, item.custom]))

    ApiUtil.put({
      path: `/api/panel/locales/${data.localeId}/types/${data.type}/translations`,
      body: { translations },
      handler: async (body, _) => {
        if (body.error) {
          location.reload();

          return
        }

        await loadLanguage($currentLanguage)

        await refreshData(true);

        data.originalTranslations = data.translationInputs.map(t => ({ ...t }));

        await showToast('components.toasts.translations-save-success');

        saving = false;

      }
    })
  }

  function handleOnDeleteClick(event) {
    const { key } = event.detail;

    const index = data.translationInputs.findIndex(item => item.key === key);

    if (index !== -1) {
      data.translationInputs.splice(index, 1);
    }

    if (data.type === PageTypes.PLUGIN) {
      data.translations = groupTranslationsByPluginId(data.originalTranslations.filter(item => item.key !== key), data.filter, data.meta.filterResult.filter(item => item.key !== key),)
    } else {
      if (data.filter !== DefaultFilter) {
        data.translations = data.meta.filterResult.filter(item => item.key !== key)
      } else {
        data.translations = data.translations.filter(item => item.key !== key)
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
  });

  onDestroy(() => {
    if (browser) {
    window?.removeEventListener('beforeunload', leaveHandler);
    }
  });

  beforeNavigate((nav) => {
    if (browser && !saveDisabled && !confirm($_("pages.translations.unsaved-changes-alert-text"))) {
      nav.cancel();
    }
  });
</script>
