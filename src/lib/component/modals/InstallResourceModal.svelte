<!-- Add Resource Modal -->
<div
  role="dialog"
  class="modal modal-lg fade"
  bind:this={$modalElement}
  aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header border-0">
        <h5 class="modal-title">Install {$type === "PLUGIN" ? "Addon" : "Theme"}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="{$_('buttons.close')}"
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <div class="list-group list-group-horizontal">
          <button
            type="button"
            class="btn list-group-item border list-group-item-action drop-zone d-flex flex-column align-items-center justify-content-center w-50 text-center shadow-none rounded-end-0"
            class:drag-over={dropZoneActive}
            style="height: 250px; cursor: pointer;"
            on:click={openFileDialog}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}>
            <input
              type="file"
              accept="{$type === 'THEME' ? '.zip,application/zip' : '.jar,application/java-archive'}"
              class="d-none"
              bind:this={fileInput}
              on:change={handleFileChange} />
            <i class="fas fa-upload fa-2x mb-2"></i>
            <p class="mb-0">Dosyayı buraya sürükleyin<br />veya tıklayın</p>
          </button>

          <a
            href="{base}/{$type === 'PLUGIN' ? 'addons' : 'view'}/store"
            class="list-group-item list-group-item-action d-flex flex-column align-items-center justify-content-center w-50"
            style="height: 250px;"
            on:click={hide}>
            <img
              src="{base}/assets/img/logo.svg"
              width="48"
              height="48"
              class="bg-dark rounded-circle mb-2"
              alt="Pano" />
            <span>Pano Mağaza'dan Yükle</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";
  import { base } from "$app/paths";

  const modalElement = writable();
  const loading = writable(false);
  const defaultErrors = {};
  const errors = writable(defaultErrors);
  const submitLoading = writable(false);
  const type = writable("PLUGIN")

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show(newType) {
    type.set(newType)
    errors.set(defaultErrors);
    submitLoading.set(false);

    modal = new window.bootstrap.Modal(get(modalElement));
    modal.show();
  }

  export function hide() {
    if (!get(loading)) {
      hideCallback();

      modal.hide();
    }
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from "svelte-i18n";
  import { show as showInstallingModal } from "$lib/component/modals/InstallingResourceModal.svelte"

  let dropZoneActive = false;
  let fileInput;

  function handleDrop(event) {
    event.preventDefault();
    dropZoneActive = false;

    const files = event.dataTransfer.files;

    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    dropZoneActive = true;
  }

  function handleDragLeave() {
    dropZoneActive = false;
  }

  function openFileDialog() {
    fileInput.click();
  }

  function handleFileChange(event) {
    const files = event.target.files;

    handleFileUpload(files[0])
  }

  function handleFileUpload(file) {
    hide();

    showInstallingModal($type, file)
  }
</script>
