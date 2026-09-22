<!-- Upload into the folder the file manager is showing: the add-on installer's drop zone, with
     the destination named above it so nobody uploads into the wrong folder. -->
<div role="dialog" class="modal fade" bind:this={$modalElement} tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="fa-solid fa-upload me-2" aria-hidden="true"></i>
          {$_('components.modals.server-file-upload.title')}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} on:click={hide}
        ></button>
      </div>
      <div class="modal-body vstack gap-3">
        <div class="small text-body-secondary">
          {$_('components.modals.server-file-upload.destination')}
          <span class="font-monospace text-body">/{$directory}</span>
        </div>

        <div style="height: 250px;">
          <DragAndDropZone
            multiple
            style="cursor: pointer;"
            icon="fas fa-upload fa-2x"
            title={$_('components.modals.server-file-upload.drag-here')}
            subtitle={$_('components.modals.server-file-upload.hint')}
            on:drop={(event) => pick(event.detail)} />
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const directory = writable('');

  /** @type {(files: File[]) => void} */
  let onFiles = () => {};
  let modal;

  /**
   * @param {string} path the folder the files will land in, shown in the dialog.
   * @param {(files: File[]) => void} callback receives what was picked or dropped.
   */
  export function show(path, callback) {
    directory.set(path || '');
    onFiles = callback;

    modal = window.bootstrap.Modal.getOrCreateInstance(get(modalElement));
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';

  /**
   * @param {File | File[]} picked
   */
  function pick(picked) {
    const files = Array.isArray(picked) ? picked : [picked];

    if (!files.length) {
      return;
    }

    // The progress list on the page takes it from here, as it does for a drop on the listing.
    hide();
    onFiles(files);
  }
</script>
