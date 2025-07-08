<!-- Add Plugin Modal -->
<div
  class="modal modal-xl fade"
  bind:this="{$modalElement}"
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
          <h5 class="modal-title" id="exampleModalLabel">Add plugin</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
            on:click="{hide}"></button>
        </div>
        <div class="modal-body">test</div>
        <div class="modal-footer">Footer</div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

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
