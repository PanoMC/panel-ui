<!-- Add / Edit Ticket Category Modal -->
<div class="modal fade" bind:this="{$modalElement}" role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$mode === "edit" ? $_('components.modals.add-edit-ticket-category.edit-category') : $_('components.modals.add-edit-ticket-category.create-category')}
        </h5>
        <button
          title="{$_('buttons.close')}"
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click="{hide}"></button>
      </div>
      <form on:submit|preventDefault="{onSubmit}">
        <div class="modal-body">
          <input
            class="form-control form-control-lg mb-3"
            placeholder="{$_('components.modals.add-edit-ticket-category.inputs.title.placeholder')}"
            id="category"
            type="text"
            bind:value="{$category.title}"
            class:border-danger="{$errors.title}" />
          <textarea
            class="form-control"
            class:border-danger="{$errors.description}"
            placeholder="{$_('components.modals.add-edit-ticket-category.inputs.description.placeholder')}"
            id="categoryDescription"
            type="text"
            rows="5"
            bind:value="{$category.description}"></textarea>
        </div>
        <div class="modal-footer">
          <button
            class="btn w-100"
            type="submit"
            class:btn-secondary="{$mode === 'create'}"
            class:btn-primary="{$mode === 'edit'}"
            class:disabled="{loading || buttonDisabled}">
            {$mode === "edit" ? $_('buttons.save') : $_('buttons.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const modalElement = writable();
  const mode = writable("create");
  const category = writable({});
  const errors = writable([]);

  let callback = (routeFirstPage) => {};
  let hideCallback = (category) => {};
  let modal;

  export function show(
    newMode,
    newCategory = { id: -1, title: "", description: "" }
  ) {
    mode.set(newMode);

    if (newCategory.description === null) newCategory.description = "";

    category.set({ ...newCategory });
    errors.set([]);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    if (get(mode) === "edit") hideCallback(get(category));

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
  import { _ } from "svelte-i18n";

  import ApiUtil from "$lib/api.util";

  let loading = false;
  $: buttonDisabled = !$category.title;

  function onSubmit() {
    loading = true;

    const bodyHandler = (body, reject) => {
      if (body.result === "ok") {
        loading = false;

        hide();

        callback(true);

        return
      } else if (body.result === "errors") {
        loading = false;

        errors.set(body.errors);

        return
      }

      reject();
    };

    if (get(mode) === "edit") {
      ApiUtil.put({
        path: `/api/panel/ticket/categories/${get(category).id}`,
        body: get(category),
        handler: bodyHandler
      })

      return;
    }

    ApiUtil.post({
      path: "/api/panel/ticket/category",
      body: get(category),
      handler: bodyHandler
    })
  }
</script>
