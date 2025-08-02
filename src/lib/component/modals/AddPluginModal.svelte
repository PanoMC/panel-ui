<!-- Add Plugin Modal -->
<div
  role="dialog"
  class="modal modal-lg fade"
  bind:this={$modalElement}
  tabindex="-1"
  aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      {#if $loading}
        <div class="modal-body">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      {:else}
        <div class="modal-header border-0">
          <h5 class="modal-title" id="exampleModalLabel">Add Plugin</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
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
                accept=".jar"
                class="d-none"
                bind:this={fileInput}
                on:change={handleFileChange} />
              <i class="fas fa-upload fa-2x mb-2"></i>
              <p class="mb-0">Dosyayı buraya sürükleyin<br />veya tıklayın</p>
            </button>

            <a
              href="{base}/addons/store"
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
      {/if}
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

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show() {
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
  let dropZoneActive = false;
  let fileInput;

  function handleDrop(event) {
    event.preventDefault();
    dropZoneActive = false;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      // Yükleme işlemi burada başlatılabilir
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
    // Dosya işlemi burada yapılabilir
  }
</script>
