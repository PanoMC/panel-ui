<FrontendOriginsModal bind:this={editor} {controller} />

<div class="list-group-item" data-other-sites>
  <div class="d-flex align-items-start gap-3">
    <div class="form-check form-switch flex-grow-1 mb-0">
      <input
        class="form-check-input"
        type="checkbox"
        role="switch"
        id="frontendOtherSites"
        checked={$enabled}
        disabled={$disabling}
        data-other-sites-switch
        onchange={toggle} />
      <label class="form-check-label fw-semibold" for="frontendOtherSites">
        {$_('pages.frontend.origins.switch')}
      </label>
      <div class="text-body-secondary">{$_('pages.frontend.origins.helper')}</div>
      {#if $items.length > 0}
        <div class="mt-1" data-sites-count>
          {$_('pages.frontend.origins.count', { values: { count: $items.length } })}
        </div>
      {/if}
    </div>
    {#if $items.length > 0}
      <button
        type="button"
        class="btn btn-secondary"
        title={$_('buttons.edit')}
        aria-label={$_('buttons.edit')}
        data-edit-sites
        onclick={() => editor?.show()}>
        <i class="fa-solid fa-pen me-1" aria-hidden="true"></i>
        {$_('buttons.edit')}
      </button>
    {/if}
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import FrontendOriginsModal from './FrontendOriginsModal.svelte';

  /**
   * The "Allow other websites to access this Pano" switch. On means the saved list has a site; turning
   * it on opens the list editor, turning it off asks first and saves an empty list.
   * @type {{ controller: ReturnType<typeof import('./origins.controller.js').createOriginsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { enabled, items, disabling } = controller;

  let editor = $state();

  function toggle(event) {
    const input = event.currentTarget;

    if (input.checked) {
      controller.enable();
      editor?.show();
    } else {
      // Stays on until the admin confirms.
      input.checked = true;
      controller.requestDisable();
    }
  }
</script>
