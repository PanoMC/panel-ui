<!-- Confirm Ban Player Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  bind:this="{$modalElement}"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="pb-3">
        {$_('components.modals.confirm-ban-player.title')}
        </div>
        <div class="form-check d-inline-block text-center">
          <input
            class="form-check-input"
            type="checkbox"
            value=""
            bind:checked="{$sendNotification}"
            id="notifyBanEmail" />
          <label class="form-check-label" for="notifyBanEmail">
            {$_('components.modals.confirm-ban-player.notify-with-email')}
          </label>
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{hide}">
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{onSubmit}">
          {$_('buttons.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from "svelte/store";

  const modalElement = writable();
  const player = writable({});

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const sendNotification = writable(true);

  export function show(newPlayer) {
    player.set(newPlayer);
    sendNotification.set(true)

    modal = new window.bootstrap.Modal(get(modalElement), {
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

  import { _ } from "svelte-i18n";

  let loading;

  function onSubmit() {
    loading = true;

    ApiUtil.post({
      path: `/api/panel/players/${$player.username}/ban`,
      body: {
        sendNotification: $sendNotification,
      },
      handler: (body, reject) => {
        if (body.error) {
          reject(body.error);
          return;
        }

        hide();

        showToast('components.toasts.player-ban.the-player', {
          username: $player.username,
          event: body.error ? $_('components.toasts.player-ban.could-not-ban', {values: body.error}): $_('components.toasts.player-ban.banned')
        });

        if (body.result === "ok") {
          callback($player);
        }

        loading = false;
      }
    })
  }
</script>
