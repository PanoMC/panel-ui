<!-- Upload into the folder the file manager is showing: the add-on installer's drop zone, with
     the destination named above it so nobody uploads into the wrong folder. -->
<div role="dialog" class="modal fade" bind:this={$modalElement} tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title text-capitalize">
          {$_('components.modals.server-file-upload.title')}
          <span class="font-monospace text-body-secondary fw-normal">/{$directory}</span>
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} on:click={hide}
        ></button>
      </div>
      <div class="modal-body vstack gap-3">
        <!-- A drop is read here, before the zone gets it: the zone only knows the flat file list,
             in which a dropped folder is one entry that cannot be uploaded. -->
        <div style="height: 250px;" on:drop|capture={onZoneDrop}>
          <DragAndDropZone
            multiple
            style="cursor: pointer;"
            icon="fas fa-upload fa-2x"
            title={$_('components.modals.server-file-upload.drag-here')}
            subtitle={$_('components.modals.server-file-upload.hint')}
            on:drop={(event) => pick(event.detail)} />
        </div>
        <!-- The file chooser of a browser picks files or a folder, never both: the folder has
             its own button. -->
        <div class="text-center">
          <button type="button" class="btn btn-link btn-sm" on:click={() => folderInput?.click()}>
            <i class="fa-solid fa-folder-open me-1" aria-hidden="true"></i>
            {$_('components.modals.server-file-upload.choose-folder')}
          </button>
          <input
            type="file"
            class="d-none"
            webkitdirectory
            multiple
            bind:this={folderInput}
            on:change={onFolderPicked} />
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
  import { filesFromDataTransfer, filesFromFolderInput } from '$lib/files.util.js';

  /** @type {HTMLInputElement | undefined} */
  let folderInput;

  /**
   * @param {DragEvent} event
   */
  async function onZoneDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    pick(await filesFromDataTransfer(event.dataTransfer));
  }

  /**
   * @param {Event} event
   */
  function onFolderPicked(event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);

    pick(filesFromFolderInput(input.files));
    input.value = '';
  }

  /**
   * @param {File | Array<File | { file: File, dir: string }>} picked
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
