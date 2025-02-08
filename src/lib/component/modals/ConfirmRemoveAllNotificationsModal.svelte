<div
  aria-hidden="true"
  class="modal fade"
  id="{dialogID}"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_('components.modals.confirm-remove-all-notifications.title')}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled="{loading}"
          aria-disabled="{loading}"
          on:click="{hide}">
          {$_('components.modals.confirm-remove-all-notifications.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled="{loading}"
          aria-disabled="{loading}"
          on:click="{onYesClick}">{$_('components.modals.confirm-remove-all-notifications.yes')}</button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  const dialogID = "confirmDeleteAllNotifications";

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show() {
    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback();

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import ApiUtil from "$lib/api.util";
  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import NotificationsDeletedPermanentlyToast from "$lib/component/toasts/NotificationsDeletedPermanentlyToast.svelte";
  import { _ } from "svelte-i18n";

  let loading;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    ApiUtil.delete({
      path: "/api/panel/notifications",
      handler: (body, reject) => {
        if (body.error) {
          refreshBrowserPage();
          return;
        }

        loading = false;

        hide();

        showToast(NotificationsDeletedPermanentlyToast);

        callback();
      }
    })
  }
</script>
