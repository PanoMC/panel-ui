<!-- Confirm Downgrade Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  bind:this={$modalElement}
  role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3 text-warning">
          <i class="fas fa-exclamation-triangle fa-3x d-block m-auto"></i>
        </div>
        <h5 class="fw-bold">
          {$_("components.modals.confirm-downgrade.title")}
        </h5>
        <p class="text-muted">
          {$_("components.modals.confirm-downgrade.description")}
        </p>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          on:click={hide}>
          {$_("buttons.cancel")}
        </button>
        <button
          class="btn btn-warning col-6 m-0"
          type="button"
          on:click={onYesClick}>
          {$_("buttons.yes")}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from "svelte/store";

  const modalElement = writable();

  let continueProcessObj = writable();
  let modal;

  export function show(continueProcess) {
    continueProcessObj.set(continueProcess);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    modal.hide();
  }
</script>

<script>
  import { _ } from "svelte-i18n";

  async function onYesClick() {
    await $continueProcessObj();
    hide();
  }
</script>
