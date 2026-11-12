<!-- Add / Edit Ticket Category Modal -->
<!-- The title is the first thing one types here, so the caret waits in it as soon as the dialog is
     up: `shown` rather than `show`, because a hidden field cannot take focus. -->
<div
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1"
  on:shown.bs.modal={focusTitle}>
  <!-- Wide and scrolling: the fields editor below can grow long. -->
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$mode === 'edit'
            ? $_('components.modals.add-edit-ticket-category.edit-category')
            : $_('components.modals.add-edit-ticket-category.create-category')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <!-- The form sits between modal-content and modal-body, so it passes the flex column on for the
           body to scroll. -->
      <form class="d-flex flex-column overflow-hidden" on:submit|preventDefault={onSubmit}>
        <div class="modal-body">
          <!-- The typed texts are the default (the platform's language); the globe next to each holds
               their translations. -->
          <div class="input-group input-group-lg mb-3">
            <input
              class="form-control"
              placeholder={$_(
                'components.modals.add-edit-ticket-category.inputs.title.placeholder',
              )}
              id="category"
              type="text"
              maxlength="32"
              bind:value={$category.title}
              class:border-danger={$errors.title} />
            <TranslationsButton
              bind:i18n={$category.i18n}
              prop="title"
              defaultText={$category.title}
              maxlength={32}
              errors={$errors}
              errorKey={(code) => `i18n.${code}.title`} />
          </div>
          <div class="input-group">
            <textarea
              class="form-control"
              class:border-danger={$errors.description}
              placeholder={$_(
                'components.modals.add-edit-ticket-category.inputs.description.placeholder',
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
          <!-- Off: the category and its tickets stay, no new ticket can be opened in it. -->
          <div class="form-check form-switch mt-3">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="ticketCategoryEnabled"
              autocomplete="off"
              checked={$category.enabled !== false}
              on:change={(event) => ($category.enabled = event.currentTarget.checked)} />
            <label class="form-check-label" for="ticketCategoryEnabled">
              {$_('components.modals.add-edit-ticket-category.inputs.enabled')}
            </label>
          </div>
          <!-- The ready reply sent by itself as the first answer of a new ticket in this category; none
               chosen, the default auto-reply of the ticket settings is sent. -->
          <label class="form-label mt-3 mb-1" for="ticketCategoryAutoReply">
            {$_('components.modals.add-edit-ticket-category.inputs.auto-reply')}
          </label>
          <select
            class="form-select"
            id="ticketCategoryAutoReply"
            class:border-danger={$errors.autoReplyTemplateId}
            value={$category.autoReplyTemplateId ?? -1}
            on:change={(event) =>
              ($category.autoReplyTemplateId = Number(event.currentTarget.value))}>
            <option value={-1}
              >{$_('components.modals.add-edit-ticket-category.inputs.no-auto-reply')}</option>
            {#each $templates as template (template.id)}
              <option value={template.id}>{template.title}</option>
            {/each}
          </select>
          <!-- What a player fills in under the ticket's title when opening a ticket in this category. -->
          <hr />
          <TicketCategoryFieldsEditor bind:fields={$category.fields} bind:errors={$errors} />
        </div>
        <div class="modal-footer">
          <button
            class="btn w-100"
            type="submit"
            class:btn-secondary={$mode === 'create'}
            class:btn-primary={$mode === 'edit'}
            class:disabled={loading || buttonDisabled}>
            {$mode === 'edit' ? $_('buttons.save') : $_('buttons.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  import ApiUtil from '$lib/api.util';
  import { loadAllTicketTemplates } from '$lib/ticketTemplates.util.js';
  import { newField, normalizeDefinitions, validateDefinitions } from '$lib/ticketFields.util.js';
  import { fieldI18nForSave, pruneI18n, toEditableField } from '$lib/contentI18n.util.js';

  const modalElement = writable();
  const mode = writable('create');
  const category = writable({});
  const errors = writable({});
  /** The ready replies a category may send as its auto-reply. */
  const templates = writable([]);

  let callback = (routeFirstPage) => {};
  let hideCallback = (category) => {};
  let modal;

  export function show(
    newMode,
    newCategory = { id: -1, title: '', description: '', enabled: true, autoReplyTemplateId: -1 },
  ) {
    void loadAllTicketTemplates().then((items) => templates.set(items));

    mode.set(newMode);

    if (newCategory.description === null) newCategory.description = '';

    // The fields are edited in place, so the editor gets its own copy, not the list row's.
    // Option translations move onto their options while editing, so renaming a value keeps them.
    category.set({
      ...newCategory,
      i18n: structuredClone(newCategory.i18n ?? {}),
      fields: (newCategory.fields ?? []).map((field) =>
        toEditableField({
          ...newField(field.key),
          ...structuredClone(field),
          options: structuredClone(field.options ?? []),
        }),
      ),
    });
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
  import TicketCategoryFieldsEditor from '$lib/components/tickets/TicketCategoryFieldsEditor.svelte';
  import TranslationsButton from '$lib/components/TranslationsButton.svelte';

  let loading = false;
  $: buttonDisabled = !$category.title;

  /** Puts the caret in the title field once Bootstrap reports the dialog as shown. */
  function focusTitle() {
    get(modalElement)?.querySelector('#category')?.focus();
  }

  function onSubmit() {
    const edited = get(category).fields ?? [];
    const fields = normalizeDefinitions(edited);
    const fieldErrors = validateDefinitions(fields);

    // The server checks the same; marking the inputs here spares a round trip.
    if (Object.keys(fieldErrors).length > 0) {
      errors.set(fieldErrors);

      return;
    }

    // The saved set replaces every translation of the category: blank ones are left out.
    const body = {
      ...get(category),
      i18n: pruneI18n(get(category).i18n, ['title', 'description']),
      fields: fields.map((field, index) => ({
        ...field,
        i18n: fieldI18nForSave(edited[index], field),
      })),
    };

    loading = true;

    const bodyHandler = (body, reject) => {
      if (!body.error) {
        loading = false;

        hide();

        callback(true);

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
        path: `/panel/ticket/categories/${get(category).id}`,
        body,
        handler: bodyHandler,
      });

      return;
    }

    ApiUtil.post({
      path: '/panel/ticket/category',
      body,
      handler: bodyHandler,
    });
  }
</script>
