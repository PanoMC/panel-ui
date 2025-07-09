<div
  aria-hidden="true"
  class="modal fade"
  bind:this="{$modalElement}"
  role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.view-activity-log.title')}</h5>
        <button
          type="button"
          class="btn-close"
          aria-label="{$_('buttons.close')}"
          onclick="{hide}"></button>
      </div>
      <div class="modal-body">
        <label for="activityLogJson" class="form-label">{$_('components.modals.view-activity-log.json')}</label>
        <textarea
        id="activityLogJson"
          name="activityLogJson"
          class="form-control"
          value={JSON.stringify($activityLog.details, null, 2)}
          rows="10"
          readonly></textarea>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from "svelte/store";

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;
  const activityLog = writable({});

  export function show(_activityLog) {
    activityLog.set({ ..._activityLog });

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });

    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback(get(activityLog));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from "svelte-i18n";
</script>
