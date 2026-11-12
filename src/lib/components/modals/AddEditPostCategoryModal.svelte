<!-- Add / Edit Category Modal -->
<!-- The title is the first thing one types here, so the caret waits in it as soon as the dialog is
     up: `shown` rather than `show`, because a hidden field cannot take focus. -->
<div
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1"
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
          <!-- The typed texts are the default (the platform's language); the globe next to each holds
               their translations. The address stays the same in every language. -->
          <div class="input-group input-group-lg mb-3">
            <input
              class:border-danger={$errors.title}
              class="form-control"
              placeholder={$_('components.modals.add-edit-post-category.inputs.title.placeholder')}
              id="category"
              type="text"
              bind:value={$category.title}
              on:input={() => setURL()} />
            <TranslationsButton
              bind:i18n={$category.i18n}
              prop="title"
              defaultText={$category.title}
              errors={$errors}
              errorKey={(code) => `i18n.${code}.title`} />
          </div>
          <div class="input-group mb-3">
            <textarea
              class:border-danger={$errors.description}
              class="form-control"
              placeholder={$_(
                'components.modals.add-edit-post-category.inputs.description.placeholder',
              )}
              id="categoryDescription"
              type="text"
              rows="5"
              bind:value={$category.description}></textarea>
            <TranslationsButton
              bind:i18n={$category.i18n}
              prop="description"
              defaultText={$category.description}
              multiline
              maxlength={2000}
              errors={$errors}
              errorKey={(code) => `i18n.${code}.description`} />
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
          <small class:text-danger={$errors.url}>
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
  import TranslationsButton from '$lib/components/TranslationsButton.svelte';

  let loading = false;
  $: buttonDisabled = !$category.title;

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
