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
        {$_('components.modals.make-main-server.title', {values: {serverName: $server.name}})}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link link-danger col-6 m-0"
          type="button"
          class:disabled="{$loading}"
          on:click="{hide}">
          {$_('components.modals.make-main-server.no')}
        </button>
        <button
          class="btn btn-primary col-6 m-0"
          type="button"
          class:disabled="{$loading}"
          on:click="{acceptServer}">
          {$_('components.modals.make-main-server.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable } from "svelte/store";

  const dialogID = "makeMainServerModal";

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const server = writable({});
  const loading = writable(false);

  export function show(newServer) {
    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
      keyboard: false,
    });

    loading.set(false);
    server.set(newServer);

    modal.show();
  }

  export function hide() {
    hideCallback();

    modal.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { invalidateAll } from "$app/navigation";

  import ApiUtil from "$lib/api.util";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import { _ } from "svelte-i18n";

  function acceptServer() {
    $loading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/main`,
      handler: async (body, reject) => {
        if (body.result === "ok") {
          callback($server);
          await invalidateAll();
          hide();
          await showToast('components.toasts.server-made-main', {name: $server.name});

          return;
        } else if (body.result === "error") {
          location.reload();

          return
        }

        reject();
      }
    })
  }
</script>
