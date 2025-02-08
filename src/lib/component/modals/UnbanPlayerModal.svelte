<!-- Unban Player Modal -->
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
        {$_('components.modals.unban-player.title')}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{hide}">
          {$_('components.modals.unban-player.camcel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{onSubmit}">
          {$_('components.modals.unban-player.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from "svelte/store";

  const dialogID = "unbanPlayerModal";
  const player = writable({});

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show(newPlayer) {
    player.set(newPlayer);

    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    hideCallback(get(player));

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
  import ApiUtil from "$lib/api.util.js";
  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import PlayerUnbanToast from "$lib/component/toasts/PlayerUnbanToast.svelte";
  import { _ } from "svelte-i18n";

  let loading;
  // let sendNotification = false;

  function onSubmit() {
    loading = true;

    ApiUtil.post({
      path: `/api/panel/players/${$player.username}/unban`,
      handler: (body, reject) => {
        if (body.error) {
          reject(body.error);
          return;
        }

        hide();

        showToast(PlayerUnbanToast, {
          username: $player.username,
          error: body.error,
        });

        callback($player);

        loading = false;
      }
    })
  }
</script>
