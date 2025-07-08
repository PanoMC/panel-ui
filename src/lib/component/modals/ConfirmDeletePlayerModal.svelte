<!-- Confirm Delete Player Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  id="{dialogID}"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"
            ></i>
          </div>
          {$_('components.modals.confirm-delete-player.title')}

          <input
            class="form-control d-inline-block text-center mt-3"
            placeholder="{$_('components.modals.confirm-delete-player.inputs.password.placeholder')}"
            type="password"
            bind:value="{$currentPassword}"
            class:border-danger="{$passwordError}" />
        </div>

        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link col-6 m-0"
            type="button"
            on:click="{hide}"
            class:disabled="{$loading}">{$_('buttons.cancel')}</button>
          <button
            class="btn btn-danger col-6 m-0"
            type="button"
            on:click="{deletePlayer}"
            class:disabled="{yesButtonDisabled}">{$_('buttons.yes')}</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable } from "svelte/store";

  const dialogID = "deletePlayerModal";

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const player = writable({});
  const loading = writable(false);
  const passwordError = writable(false);
  const currentPassword = writable("");

  export function show(newPlayer) {
    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
      keyboard: false,
    });

    loading.set(false);
    player.set(newPlayer);
    passwordError.set(false);
    currentPassword.set("");

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
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  import ApiUtil from "$lib/api.util";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import { _ } from "svelte-i18n";

  $: yesButtonDisabled = $loading || !$currentPassword;

  function deletePlayer() {
    $loading = true;

    ApiUtil.post({
      path: `/api/panel/players/${$player.username}/delete`,
      body: { currentPassword: $currentPassword },
      handler: async (body, reject) => {
        if (body.result === "ok") {
          callback($player);
          await goto(base + "/players");
          hide();
          await showToast('player-deleted-success', { username: $player.username });
          return
        } else if (body.error) {
          if (body.error === "CURRENT_PASSWORD_NOT_CORRECT") {
            $passwordError = true;
            $loading = false;
          } else {
            location.reload();
          }

          return;
        }

        reject();
      }
    })
  }
</script>
