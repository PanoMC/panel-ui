<!-- Add / Edit Category Modal -->
<!-- The title is the first thing one types here, so the caret waits in it as soon as the dialog is
     up: `shown` rather than `show`, because a hidden field cannot take focus. -->
<div
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1"
  on:show.bs.modal={onShow}
  on:shown.bs.modal={focusTitle}>
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$mode === 'create'
            ? $_('components.modals.add-edit-post-category.create-category')
            : $_('components.modals.add-edit-post-category.edit-category')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form on:submit|preventDefault={onSubmit}>
        <div class="modal-body">
          <div class="nav nav-tabs mb-3" role="tablist">
            {#each localeTabs as item, index (item.code ?? 'default')}
              {@const invalid = localeHasError(item.code)}
              <button
                type="button"
                class="nav-link d-flex align-items-center gap-2"
                class:active={activeLocale === item.code}
                role="tab"
                id="category-locale-tab-{index}"
                aria-controls="category-locale-panel"
                aria-selected={activeLocale === item.code}
                aria-label="{item.name}{invalid
                  ? ', ' + $_('components.translations-button.errors.INVALID')
                  : ''}"
                on:keydown={(event) => onLocaleTabKeydown(event, index)}
                on:click={() => (activeLocale = item.code)}>
                {item.code === null
                  ? $_('pages.post-editor.language.default-tab', {
                      values: { language: item.name },
                    })
                  : item.name}
                {#if invalid}
                  <i
                    class="fa-solid fa-triangle-exclamation text-danger"
                    aria-hidden="true"
                    title={$_('components.translations-button.errors.INVALID')}></i>
                {/if}
              </button>
            {/each}
          </div>
          {#if localesLoading}
            <div class="small text-body-secondary mb-3">
              <i class="fas fa-circle-notch fa-spin me-1" aria-hidden="true"></i>
              {$_('components.translations-button.loading')}
            </div>
          {/if}
          <div
            id="category-locale-panel"
            role="tabpanel"
            aria-labelledby="category-locale-tab-{localeTabs.findIndex(
              (item) => item.code === activeLocale,
            )}">
            {#if activeLocale === null}
              <!-- The platform language is the source text used when a translation is blank. -->
              <div class="mb-3">
                <input
                  class="form-control form-control-lg"
                  class:is-invalid={$errors.title}
                  placeholder={$_(
                    'components.modals.add-edit-post-category.inputs.title.placeholder',
                  )}
                  id="category"
                  type="text"
                  bind:value={$category.title}
                  on:input={() => setURL()} />
                {#if $errors.title}
                  <div class="invalid-feedback d-block">
                    {$_('components.translations-button.errors.' + $errors.title, {
                      default: $errors.title,
                    })}
                  </div>
                {/if}
              </div>
              <div class="mb-3">
                <textarea
                  class="form-control"
                  class:is-invalid={$errors.description}
                  placeholder={$_(
                    'components.modals.add-edit-post-category.inputs.description.placeholder',
                  )}
                  id="categoryDescription"
                  rows="5"
                  bind:value={$category.description}></textarea>
                {#if $errors.description}
                  <div class="invalid-feedback d-block">
                    {$_('components.translations-button.errors.' + $errors.description, {
                      default: $errors.description,
                    })}
                  </div>
                {/if}
              </div>
            {:else}
              {@const titleError = $errors[`i18n.${activeLocale}.title`]}
              {@const descriptionError = $errors[`i18n.${activeLocale}.description`]}
              <input
                id="categoryTranslationTitle"
                class="form-control form-control-lg mb-3"
                class:is-invalid={titleError}
                placeholder={$category.title ||
                  $_('components.modals.add-edit-post-category.inputs.title.placeholder')}
                type="text"
                value={$category.i18n?.[activeLocale]?.title ?? ''}
                on:input={(event) =>
                  setTranslation(activeLocale, 'title', event.currentTarget.value)} />
              {#if titleError}
                <div class="invalid-feedback d-block mb-3">
                  {$_('components.translations-button.errors.' + titleError, {
                    default: titleError,
                  })}
                </div>
              {/if}
              <textarea
                id="categoryTranslationDescription"
                class="form-control"
                class:is-invalid={descriptionError}
                placeholder={$category.description ||
                  $_('components.modals.add-edit-post-category.inputs.description.placeholder')}
                rows="5"
                maxlength="2000"
                value={$category.i18n?.[activeLocale]?.description ?? ''}
                on:input={(event) =>
                  setTranslation(activeLocale, 'description', event.currentTarget.value)}
              ></textarea>
              {#if descriptionError}
                <div class="invalid-feedback d-block">
                  {$_('components.translations-button.errors.' + descriptionError, {
                    default: descriptionError,
                  })}
                </div>
              {/if}
            {/if}
          </div>
          <div class="mb-3 input-group">
            <span class="input-group-text">/category/</span>
            <input
              class="form-control"
              placeholder={$_('components.modals.add-edit-post-category.inputs.url.placeholder')}
              id="categoryURL"
              type="text"
              class:is-invalid={$errors.url}
              bind:value={$category.url} />
          </div>
          <small class:text-body-secondary={!$errors.url} class:text-danger={$errors.url}>
            {$_('components.modals.add-edit-post-category.inputs.url.helper')}
          </small>
        </div>
        <div class="modal-footer">
          <button
            class="btn w-100"
            type="submit"
            class:btn-secondary={$mode === 'create'}
            class:btn-primary={$mode === 'edit'}
            class:disabled={loading || buttonDisabled}>
            <span>
              {#if $mode === 'edit'}
                {$_('buttons.save')}
              {:else}
                {$_('buttons.create')}
              {/if}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const mode = writable('create');
  const category = writable({});
  const errors = writable({});

  let callback = (routeFirstPage, category) => {};
  let hideCallback = (category) => {};
  let modal;

  export function show(
    newMode,
    newCategory = {
      id: -1,
      title: '',
      description: '',
      url: '',
      color: '#1976d2',
    },
  ) {
    mode.set(newMode);

    if (newCategory.color && !newCategory.color.includes('#'))
      newCategory.color = '#' + newCategory.color;

    category.set({ ...newCategory, i18n: structuredClone(newCategory.i18n ?? {}) });
    errors.set({});

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    if (get(mode) === 'edit') hideCallback(get(category));

    modal.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import ApiUtil from '$lib/api.util';
  import { pruneI18n } from '$lib/contentI18n.util.js';
  import { loadContentLocales } from '$lib/components/TranslationsButton.svelte';
  import { getContext } from 'svelte';
  import { Languages } from '$lib/language.util.js';

  let loading = false;
  let localesLoading = false;
  let locales = [];
  let activeLocale = null;
  let localesPromise = null;
  const siteInfo = getContext('siteInfo');
  $: otherLocales = locales.filter((item) => item.code !== $siteInfo?.platformLocale);
  $: localeTabs = [
    {
      code: null,
      name: displayLanguageName(
        locales.find((item) => item.code === $siteInfo?.platformLocale)?.name ??
          $Languages?.[$siteInfo?.platformLocale]?.name ??
          $siteInfo?.platformLocale ??
          '',
      ),
    },
    ...otherLocales.map((item) => ({ ...item, name: displayLanguageName(item.name) })),
  ];
  $: buttonDisabled = !$category.title;

  function onShow() {
    if (localesPromise) {
      activeLocale = null;

      return;
    }

    localesLoading = true;
    localesPromise = loadContentLocales().then((items) => {
      locales = items;
      activeLocale = null;
      localesLoading = false;
    });
  }

  function onLocaleTabKeydown(event, index) {
    let nextIndex = index;
    const tabs = localeTabs;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')?.[nextIndex]?.focus();
    activeLocale = tabs[nextIndex].code;
  }

  function localeHasError(code) {
    if (code === null) return !!$errors.title || !!$errors.description;

    return !!$errors[`i18n.${code}.title`] || !!$errors[`i18n.${code}.description`];
  }

  function displayLanguageName(name) {
    return name.replace(/\s*\((?:[a-z]{2,3}-)?[A-Z]{2}\)$/, '');
  }

  function setTranslation(code, prop, value) {
    category.update((current) => ({
      ...current,
      i18n: {
        ...current.i18n,
        [code]: {
          ...current.i18n?.[code],
          [prop]: value,
        },
      },
    }));
  }

  /** Puts the caret in the title field once Bootstrap reports the dialog as shown. */
  function focusTitle() {
    get(modalElement)?.querySelector('#category')?.focus();
  }

  function onSubmit() {
    // The saved set replaces every translation of the category: blank ones are left out.
    const body = {
      ...get(category),
      i18n: pruneI18n(get(category).i18n, ['title', 'description']),
    };

    loading = true;

    const bodyHandler = (body, reject) => {
      if (!body.error) {
        loading = false;

        hide();

        const newCategory = get(category);

        newCategory.id = body.id;

        callback(true, newCategory);

        return;
      } else if (body.error?.fields) {
        loading = false;

        errors.set(body.error.fields);

        return;
      }

      reject();
    };

    if (get(mode) === 'edit') {
      ApiUtil.put({
        path: `/panel/post/categories/${get(category).id}`,
        body,
        handler: bodyHandler,
      });

      return;
    }

    ApiUtil.post({
      path: '/panel/post/categories',
      body,
      handler: bodyHandler,
    });
  }

  function setURL() {
    category.update((category) => {
      category.url = category.title
        .replace(/\s+/g, '-')
        .replace(/[^0-9A-Za-z-]+/g, '')
        .toLowerCase()
        .substring(0, 32);

      return category;
    });
  }
</script>
