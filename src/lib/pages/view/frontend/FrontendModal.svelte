<!-- The Front-end settings (mode, site connection keys, other websites, link targets), opened from the Themes page. -->
<div class="modal fade" bind:this={element} role="dialog" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.frontend.title')}</h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>
      <div class="modal-body" data-frontend-modal-body>
        {#if loading}
          <div class="text-center py-5">
            <span class="spinner-border" aria-hidden="true"></span>
          </div>
        {:else if data}
          {#key epoch}
            <FrontendContent {data} {api} {onmodesaved} onretry={load} />
          {/key}
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { beforeNavigate } from '$app/navigation';

  import ApiUtil from '$lib/api.util';

  import FrontendContent from './FrontendContent.svelte';
  import { createFrontendApi, loadFrontendData } from './frontend.api.js';

  /**
   * The modal around {@link FrontendContent}. It reads the five answers when it opens, so the Themes
   * page does not wait for them and the dialog always starts from what is stored. `onmodesaved` gets
   * the saved mode, so the page can tell whether visitors still see the active theme.
   * @type {{ api?: any, onmodesaved?: (mode: string) => void }}
   */
  let { api = createFrontendApi(ApiUtil), onmodesaved = undefined } = $props();

  let element = $state();
  let loading = $state(false);
  /** @type {any} */
  let data = $state(null);
  let epoch = $state(0);
  let modal;

  async function load() {
    loading = true;

    try {
      data = await loadFrontendData(api);
      epoch += 1;
    } finally {
      loading = false;
    }
  }

  export async function show() {
    if (!element || !window.bootstrap?.Modal || element.classList.contains('show')) return;

    data = null;
    loading = true;

    modal = window.bootstrap.Modal.getOrCreateInstance(element, {
      backdrop: 'static',
      keyboard: false,
    });
    element.addEventListener('hidden.bs.modal', clear, { once: true });
    modal.show();

    await tick();
    await load();
  }

  export function hide() {
    modal?.hide();
  }

  // What was read does not outlive the dialog: a key that was just created is shown once.
  function clear() {
    data = null;
  }

  // A link inside the dialog (the theme's own settings) leaves the page; the dialog goes with it.
  beforeNavigate(() => hide());
</script>
