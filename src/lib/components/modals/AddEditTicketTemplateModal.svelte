<!-- Add / Edit Ticket Template Modal -->
<div class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$mode === 'edit'
            ? $_('components.modals.add-edit-ticket-template.edit-template')
            : $_('components.modals.add-edit-ticket-template.create-template')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          onclick={hide}></button>
      </div>
      <form onsubmit={onSubmit}>
        <div class="modal-body">
          <input
            class="form-control form-control-lg mb-3"
            class:border-danger={$errors.title}
            placeholder={$_('components.modals.add-edit-ticket-template.inputs.title.placeholder')}
            id="ticketTemplateTitle"
            type="text"
            maxlength="64"
            bind:value={$template.title} />

          <div class:border-danger={$errors.body} class:border={$errors.body} class="rounded">
            {#key $editorKey}
              <Editor bind:this={editor} bind:content={body} bind:isEmpty />
            {/key}
          </div>

          <!-- What a template may use: a click puts the variable where the caret is. The buttons do
               not take the focus, so the caret stays in the editor. -->
          <div class="d-flex flex-wrap align-items-center gap-1 mt-2">
            <span class="form-text me-1 mt-0">
              {$_('components.modals.add-edit-ticket-template.variables')}
            </span>
            {#each $variables as variable (variable)}
              <button
                type="button"
                class="badge text-bg-primary border-0"
                title={$_(`components.modals.add-edit-ticket-template.variable-hints.${variable}`)}
                onmousedown={(event) => event.preventDefault()}
                onclick={() => editor?.insertContent(`{{${variable}}}`)}>
                {`{{${variable}}}`}
              </button>
            {/each}
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn w-100"
            type="submit"
            class:btn-secondary={$mode === 'create'}
            class:btn-primary={$mode === 'edit'}
            disabled={loading || !$template.title?.trim() || isEmpty}>
            {$mode === 'edit' ? $_('buttons.save') : $_('buttons.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script module>
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const mode = writable('create');
  const template = writable({ id: -1, title: '', body: '' });
  const variables = writable([]);
  const errors = writable({});
  /** A new key builds a new editor, so it opens on the template's text rather than the last one. */
  const editorKey = writable(0);

  let callback = () => {};
  let modal;

  /**
   * @param {'create' | 'edit'} newMode
   * @param {string[]} newVariables the variables a template may use, as the list endpoint names them
   * @param {{ id: number, title: string, body: string }} [newTemplate]
   */
  export function show(newMode, newVariables, newTemplate = { id: -1, title: '', body: '' }) {
    mode.set(newMode);
    variables.set(newVariables ?? []);
    template.set({ ...newTemplate });
    errors.set({});
    editorKey.update((key) => key + 1);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  /** Runs after a save, so the list can refresh. */
  export function setCallback(newCallback) {
    callback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';
  import Editor from '$lib/components/Editor.svelte';

  let loading = $state(false);

  /**
   * The text in the editor. Kept here rather than bound into the store: a store round trip lags behind
   * typing, and the editor would put the older text back over what was typed meanwhile.
   */
  let body = $state('');

  // Before the new editor is built (`pre`), so it opens on the template being shown.
  $effect.pre(() => {
    $editorKey;

    body = get(template).body ?? '';
  });

  let isEmpty = $state(true);
  /** @type {any} */
  let editor = $state();

  /** Puts the caret in the title field once Bootstrap reports the dialog as shown. */
  function focusTitle() {
    get(modalElement)?.querySelector('#ticketTemplateTitle')?.focus();
  }

  // `shown`, not `show`: a hidden field cannot take focus.
  $effect(() => {
    const element = $modalElement;

    element?.addEventListener('shown.bs.modal', focusTitle);

    return () => element?.removeEventListener('shown.bs.modal', focusTitle);
  });

  async function onSubmit(event) {
    event.preventDefault();

    loading = true;

    const current = get(template);
    const request = {
      body: { title: current.title, body },
      handler: (response) => response,
    };

    const response = await (
      get(mode) === 'edit'
        ? ApiUtil.put({ path: `/panel/ticket/templates/${current.id}`, ...request })
        : ApiUtil.post({ path: '/panel/ticket/templates', ...request })
    ).catch(() => null);

    loading = false;

    if (response?.error?.fields) {
      errors.set(response.error.fields);

      return;
    }

    if (!response || response.error) {
      errors.set({ title: true });

      return;
    }

    hide();

    callback();
  }
</script>
