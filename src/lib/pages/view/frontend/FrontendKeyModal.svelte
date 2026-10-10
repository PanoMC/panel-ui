<!-- Create a front-end key. After it is created the same dialog shows the key and the `.env` lines once. -->
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
          <h5 class="modal-title">
            {created
              ? $_('pages.frontend.keys.reveal.title')
              : $_('pages.frontend.keys.create.title')}
          </h5>
          <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
          ></button>
        </div>
        {#if created}
          <div class="modal-body">
            <FrontendKeyReveal {created} {notify} />
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary w-100" type="button" onclick={hide}>
              {$_('pages.frontend.keys.reveal.done')}
            </button>
          </div>
        {:else}
          <form onsubmit={submit}>
            <div class="modal-body">
              <input
                class="form-control form-control-lg"
                class:is-invalid={$createErrors.name}
                type="text"
                maxlength="64"
                autocomplete="off"
                placeholder={$_('pages.frontend.keys.create.placeholder')}
                bind:value={name} />
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary w-100" type="submit" disabled={$creating}>
                {$_('buttons.create')}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { portal, showStacked } from '$lib/modal-stack.util.js';

  import FrontendKeyReveal from './FrontendKeyReveal.svelte';

  /**
   * @type {{ controller: ReturnType<typeof import('./keys.controller.js').createKeysController>, notify?: any }}
   */
  let { controller, notify = undefined } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const creating = controller.creating;
  // svelte-ignore state_referenced_locally
  const createErrors = controller.createErrors;

  let element = $state();
  let name = $state('');
  /** @type {{ key: string, env: string[] } | null} */
  let created = $state(null);
  let modal;

  export function show() {
    name = '';
    created = null;
    controller.createErrors.set({});

    modal = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
    showStacked(modal, element);
  }

  export function hide() {
    modal?.hide();
    // The key must not outlive the dialog: it is shown once.
    created = null;
  }

  async function submit(event) {
    event.preventDefault();

    created = await controller.create(name);
  }
</script>
