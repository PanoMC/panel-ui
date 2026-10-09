<!-- Set the admin override of one link target: one field, one button. -->
<div class="modal fade" bind:this={element} role="dialog" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('pages.frontend.urls.override.title', { values: { target } })}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>
      <form onsubmit={submit}>
        <div class="modal-body">
          <input
            class="form-control form-control-lg"
            class:is-invalid={$error}
            type="text"
            inputmode="url"
            autocomplete="off"
            maxlength="2000"
            data-override-input
            placeholder={$_('pages.frontend.urls.override.placeholder')}
            bind:value={location} />
          {#if $error}
            <div class="invalid-feedback d-block" data-override-error={$error.code}>
              {$_($error.key, { values: $error.values })}
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={$saving !== null}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  /**
   * @type {{ controller: ReturnType<typeof import('./urls.controller.js').createUrlsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { saving, error } = controller;

  let element = $state();
  let target = $state('');
  let location = $state('');
  let modal;

  /**
   * @param {{ id: string, override: string | null }} row
   */
  export function show(row) {
    target = row.id;
    location = row.override ?? '';
    controller.clearError();

    modal = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  async function submit(event) {
    event.preventDefault();

    if (await controller.setOverride(target, location)) hide();
  }
</script>
