<!-- Unban Player Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  id="{dialogID}"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      {#if $loading}
        <div class="modal-body">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      {:else}
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-plug fa-3x d-block m-auto text-gray"></i>
          </div>
          {$_('components.modals.server-request.title', {values: {serverName: $server.name}})}
          <div class="card bg-light mt-3 text-start">
            <div class="row g-0">
              <div
                class="col-md-4 d-flex align-items-center justify-content-center">
                <img
                  src="{$server.favicon
                    ? $server.favicon
                    : 'https://icons.iconarchive.com/icons/chrisl21/minecraft/64/Crafting-Table-icon.png'}"
                  class="img-fluid"
                  alt="{$server.name}" />
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h6 class="card-title">{$server.host}:{$server.port}</h6>
                  <p class="card-text text-muted">
                    {$server.playerCount}/{$server.maxPlayerCount}
                  </p>
                  <small class="badge text-black rounded-pill"
                    >{$server.type}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link link-danger col-6 m-0"
            type="button"
            class:disabled="{$submitLoading}"
            on:click="{rejectServer}">
            {$_('components.modals.server-request.reject')}
          </button>
          <button
            class="btn btn-secondary col-6 m-0"
            type="button"
            class:disabled="{$submitLoading}"
            on:click="{acceptServer}">
            {$_('components.modals.server-request.connect')}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { writable } from "svelte/store";

  import ExpiredServerConnectRequestToast from "$lib/component/toasts/ExpiredServerConnectRequestToast.svelte";
  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  const dialogID = "serverRequestModal";

  let callback = () => {};
  let hideCallback = () => {};
  let modal;
  const defaultServer = {
    id: -1,
    name: "",
    playerCount: 0,
    maxPlayerCount: 0,
    type: "",
    version: "",
    favicon: "",
    permissionGranted: false,
    status: "OFFLINE",
  };
  const server = writable(defaultServer);
  const loading = writable(true);
  const submitLoading = writable(false);

  export function show(serverId) {
    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
      keyboard: false,
    });

    loading.set(true);
    submitLoading.set(false);
    server.set(defaultServer);

    modal.show();

    initData(serverId);
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

  function showExpiredToast() {
    setTimeout(() => {
      hide();
    }, 500);

    showToast(ExpiredServerConnectRequestToast);
  }

  function initData(serverId) {
    ApiUtil.get({
      path: `/api/panel/servers/${serverId}`,
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === "NOT_EXISTS") {
            showExpiredToast();

            return;
          }

          reject();

          return;
        }

        if (body.server.permissionGranted) {
          showExpiredToast();

          return;
        }

        server.set(body.server);
        loading.set(false);
      }
    })
  }
</script>

<script>
  import AcceptedServerConnectRequestToast from "$lib/component/toasts/AcceptedServerConnectRequestToast.svelte";
  import RejectedServerConnectRequestToast from "$lib/component/toasts/RejectedServerConnectRequestToast.svelte";

  import { invalidateAll } from "$app/navigation";
  import { _ } from "svelte-i18n";

  function acceptServer() {
    $submitLoading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/accept`,
      handler: async (body, reject) => {
        $submitLoading = false;

        if (body.result === "ok") {
          callback($server);
          await invalidateAll();
          hide();
          await showToast(AcceptedServerConnectRequestToast);

          return;
        } else if (body.result === "error") {
          hide();
          await showToast(ExpiredServerConnectRequestToast);

          return;
        }

        reject();
      }
    })
  }

  function rejectServer() {
    $submitLoading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/reject`,
      handler: (body, reject) => {
        $submitLoading = false;

        if (body.result === "ok") {
          callback($server);
          hide();
          showToast(RejectedServerConnectRequestToast);

          return;
        } else if (body.result === "error") {
          hide();
          showToast(ExpiredServerConnectRequestToast);

          return;
        }

        reject();
      }
    })
  }
</script>
