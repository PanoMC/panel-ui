<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-lg" role="dialog">
    <div class="modal-content border-0 shadow-lg">
      <div class="modal-header bg-dark text-white border-bottom-0 rounded-top">
        <h5 class="modal-title font-monospace small">
          <i class="fa-solid fa-terminal me-2 text-primary"></i>
          {$_('buttons.error-log')}
        </h5>
        <button
          type="button"
          class="btn-close btn-close-white"
          aria-label={$_('buttons.close')}
          on:click={hide}></button>
      </div>
      <div class="modal-body bg-dark text-white p-0 overflow-hidden">
        <div class="bg-black p-3 font-monospace overflow-auto custom-scrollbar" style="max-height: 500px; white-space: pre-wrap; font-size: 0.875rem; color: #dcdccc; border: 1px solid #333;">
          {$errorContent}
        </div>
      </div>
      <div class="modal-footer bg-dark border-top-0 rounded-bottom justify-content-between p-2">
        <div class="hstack gap-2">
          <button type="button" class="btn btn-sm btn-outline-primary" on:click={copyToClipboard}>
            {#if isCopied}
              <i class="fa-solid fa-check me-1"></i>
              {$_('components.modals.connect-server.copied') || 'Copied'}
            {:else}
              <i class="fa-solid fa-copy me-1"></i>
              {$_('buttons.copy')}
            {/if}
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" on:click={hide}>
          {$_('buttons.close')}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();

  let modal;
  const errorContent = writable('');

  export function show(content) {
    errorContent.set(content);

    modal = new window.bootstrap.Modal(get(modalElement));

    modal.show();
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  let isCopied = false;
  let copyClickID = 0;

  async function copyToClipboard() {
    const content = get(errorContent);
    copy(content);

    copyClickID++;
    const id = copyClickID;
    isCopied = true;

    setTimeout(() => {
      if (copyClickID === id) {
        isCopied = false;
      }
    }, 2000);
  }
</script>
