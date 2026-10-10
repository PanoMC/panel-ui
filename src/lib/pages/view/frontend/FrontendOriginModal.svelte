<!-- Add an allowed origin: one field, one button. A refused origin is explained under the field. -->
<div hidden data-modal-host>
  <div
    class="modal fade"
    use:portal
    bind:this={element}
    role="dialog"
    tabindex="-1"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{$_('pages.frontend.origins.add.title')}</h5>
          <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
          ></button>
        </div>
        <form onsubmit={submit}>
          <div class="modal-body">
            <input
              class="form-control form-control-lg"
              class:is-invalid={$addError}
              type="text"
              inputmode="url"
              autocomplete="off"
              maxlength="253"
              data-origin-input
              placeholder={$_('pages.frontend.origins.add.placeholder')}
              bind:value={origin} />
            {#if $addError}
              <div class="invalid-feedback d-block" data-origin-error={$addError.code}>
                {$_($addError.key, { values: $addError.values })}
              </div>
            {/if}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary w-100" type="submit" disabled={$adding}>
              {$_('buttons.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { portal, showStacked } from '$lib/modal-stack.util.js';

  /**
   * @type {{ controller: ReturnType<typeof import('./origins.controller.js').createOriginsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { adding, addError } = controller;

  let element = $state();
  let origin = $state('');
  let modal;

  export function show() {
    origin = '';
    controller.clearError();

    modal = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
    showStacked(modal, element);
  }

  export function hide() {
    modal?.hide();
  }

  async function submit(event) {
    event.preventDefault();

    if (await controller.add(origin)) hide();
  }
</script>
