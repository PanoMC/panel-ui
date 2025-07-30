<!-- Add Plugin Modal -->
<div
  class="modal modal-lg fade"
  bind:this={$modalElement}
  tabindex="-1"
  aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      {#if $loading}
        <div class="modal-body">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      {:else}
        <div class="modal-header">
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
            <div
              class="list-group-item d-flex flex-column align-items-center justify-content-center w-50"
              style="height: 250px;">
              <input
                class="form-control"
                id="formFileLg"
                accept=".jar"
                type="file" />
            </div>
            <a
              href="{base}/addons/store"
              class="list-group-item list-group-item-action d-flex flex-column align-items-center justify-content-center w-50"
              style="height: 250px;">
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
  const permissionGroups = writable([]);
  const defaultErrors = {};
  const errors = writable(defaultErrors);
  const submitLoading = writable(false);

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show() {
    errors.set(defaultErrors);
    submitLoading.set(false);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
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
