<!-- "New layout": a name and the layout it starts as a copy of. `oncreated` gets the new layout. -->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.mail-templates.layouts.create.title')}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <form onsubmit={onSubmit}>
        <div class="modal-body">
          <input
            class="form-control form-control-lg mb-3"
            class:is-invalid={!!nameError}
            type="text"
            maxlength={NAME_MAX_LENGTH}
            placeholder={$_('pages.mail-templates.layouts.create.name')}
            aria-label={$_('pages.mail-templates.layouts.create.name')}
            bind:this={nameInput}
            bind:value={name} />
          {#if nameError}
            <div class="invalid-feedback d-block mt-n2 mb-3">
              {$_(`pages.mail-templates.layouts.errors.${nameError}`)}
            </div>
          {/if}
          <label class="form-label" for="new-mail-layout-copy-from">
            {$_('pages.mail-templates.layouts.create.copy-from')}
          </label>
          <select id="new-mail-layout-copy-from" class="form-select" bind:value={copyFrom}>
            {#each layouts as layout (layout.id)}
              <option value={layout.id}>{layout.name || layout.id}</option>
            {/each}
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={loading || !name.trim()}>
            {#if loading}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {/if}
            {$_('buttons.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';
  import { showError } from '$lib/components/ToastContainer.svelte';

  import { createMailTemplatesApi, fieldErrorsOf, MAIN_LAYOUT } from './mail-templates.api.js';

  /** The longest name a custom layout may have (the backend's limit). */
  const NAME_MAX_LENGTH = 100;

  let { layouts = [], oncreated, api = createMailTemplatesApi(ApiUtil) } = $props();

  /** @type {HTMLElement | undefined} */
  let modalElement = $state();
  /** @type {HTMLInputElement | undefined} */
  let nameInput = $state();
  let name = $state('');
  let copyFrom = $state(MAIN_LAYOUT);
  /** @type {'' | 'REQUIRED' | 'TOO_LONG'} */
  let nameError = $state('');
  let loading = $state(false);
  let modal;

  export function show() {
    name = '';
    copyFrom = layouts.some((layout) => layout.id === MAIN_LAYOUT)
      ? MAIN_LAYOUT
      : (layouts[0]?.id ?? MAIN_LAYOUT);
    nameError = '';
    loading = false;

    modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    modalElement?.addEventListener('shown.bs.modal', () => nameInput?.focus(), { once: true });
    modal.show();
  }

  /** @param {SubmitEvent} event */
  async function onSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      nameError = 'REQUIRED';

      return;
    }

    loading = true;

    const result = await api.createLayout({ name: name.trim(), copyFrom });

    loading = false;

    if (!result.ok) {
      const code = fieldErrorsOf(result.error).name?.code;

      if (code === 'REQUIRED' || code === 'TOO_LONG') {
        nameError = code;

        return;
      }

      showError('pages.mail-templates.toasts.failed');

      return;
    }

    modal?.hide();
    oncreated?.(result.body);
  }
</script>
