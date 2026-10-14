<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">{$_($titleValue, { values: $titleValues })}</h5>
        {#if $descriptionValue}
          <div class="text-body-secondary">
            {$_($descriptionValue, { values: $titleValues })}
          </div>
        {/if}
        {#if $itemsValue.length > 0}
          <ul class="text-start mt-3 mb-0">
            {#each $itemsValue as item, index (index)}
              <li>{item}</li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="modal-footer flex-nowrap">
        <button class="btn btn-link text-decoration-none col-6 m-0" type="button" on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn col-6 m-0"
          class:btn-primary={$variantValue === 'primary'}
          class:btn-danger={$variantValue !== 'primary'}
          type="button"
          on:click={onYesClick}>
          {$_($confirmLabelValue)}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  import { showStacked } from '$lib/modal-stack.util.js';

  const modalElement = writable();
  const titleValue = writable('');
  const titleValues = writable({});
  const descriptionValue = writable('');
  const confirmLabelValue = writable('buttons.confirm');
  const variantValue = writable('danger');
  /** @type {import('svelte/store').Writable<string[]>} */
  const itemsValue = writable([]);
  let callback = () => {};
  let modal;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  /**
   * Opens the shared confirmation dialog.
   *
   * [newTitle] is either the title's lang key, or an object that also carries the rest of the
   * dialog: `{ title, description, confirmLabel, variant, items }`. `description` and
   * `confirmLabel` are lang keys (the label defaults to `buttons.confirm`), `variant` is
   * `'primary'` for a constructive action and `'danger'` (the default) for a destructive one,
   * `items` an optional short list of what the action touches (plain texts, shown under the
   * description).
   *
   * Interpolation values are optional and may be passed either before or after the callback; the
   * title and the description share them.
   *
   * @param {string | { title: string, description?: string, confirmLabel?: string, variant?: 'primary' | 'danger', items?: string[] }} newTitle
   * @param {(() => void) | Record<string, unknown>} [newCallbackOrValues]
   * @param {(() => void) | Record<string, unknown>} [newValuesOrCallback]
   */
  export async function show(newTitle, newCallbackOrValues, newValuesOrCallback) {
    const isCallbackFirst = typeof newCallbackOrValues === 'function';
    const newCallback = isCallbackFirst ? newCallbackOrValues : newValuesOrCallback;
    const newValues = isCallbackFirst ? newValuesOrCallback : newCallbackOrValues;
    const options = newTitle && typeof newTitle === 'object' ? newTitle : { title: newTitle };

    titleValue.set(options.title || '');
    descriptionValue.set(options.description || '');
    confirmLabelValue.set(options.confirmLabel || 'buttons.confirm');
    variantValue.set(options.variant === 'primary' ? 'primary' : 'danger');
    itemsValue.set(Array.isArray(options.items) ? options.items.map(String) : []);
    titleValues.set(newValues || {});
    callback = newCallback || (() => {});

    const element = get(modalElement);

    // The modal is mounted once in AppLayout; degrade to a no-op instead of throwing if that
    // mount is ever missing, so a caller never loses its own error handling to this.
    if (!element) {
      console.error('ConfirmActionModal is not mounted.');

      return;
    }

    modal = new window.bootstrap.Modal(element, {
      backdrop: 'static',
      keyboard: false,
    });

    // Above another open modal (a dialog that asks from inside a modal) when there is one.
    showStacked(modal, element);
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  function onYesClick() {
    callback();
    hide();
  }
</script>
