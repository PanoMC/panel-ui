<!-- Confirm Restart Pano Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={sendRestartPano}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-refresh fa-3x d-block m-auto text-warning"></i>
          </div>
          {$_('components.modals.confirm-restart-pano.title')}

          <input
            class="form-control mt-3"
            placeholder="{$_('components.modals.confirm-restart-pano.account-password')}"
            type="password"
            bind:value="{$password}"
            bind:this={$passwordInput}
            class:border-danger="{$passwordError}" />
        </div>

        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link col-6 m-0"
            type="button"
            on:click="{hide}"
            disabled="{$loading}">
            {$_("buttons.cancel")}
          </button>
          <button
            class="btn btn-warning col-6 m-0"
            type="button"
            disabled="{confirmButtonDisabled || $loading}"
            on:click="{sendRestartPano}">
            {$_("buttons.yes")}
            {#if $loading}
              <i class="fas fa-sync fa-spin ms-2"></i>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from "svelte/store";

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const loading = writable(false);
  const passwordError = writable(false);
  const password = writable("");
  const passwordInput = writable();

  export function show() {
    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });

    loading.set(false);
    passwordError.set(false);
    password.set("");

    modal.show();

    setTimeout(() => {
      get(passwordInput).focus();
    }, 500);
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
  import { _ } from "svelte-i18n";
  import { getContext } from "svelte";

  import ApiUtil from "$lib/api.util";

  const platformRestarting = getContext("platformRestarting");

  $: confirmButtonDisabled = $password.length === 0;

  async function isPanoHealthy() {
    try {
      const getHealthResponse = await ApiUtil.get({ path: "/api/health" });

      return getHealthResponse.result === "ok";
    } catch (_) {
      return false;
    }
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  function sendRestartPano() {
    $loading = true;
    $passwordError = false;
    $platformRestarting = true;

    ApiUtil.post({
      path: "/api/panel/settings/restart-pano",
      body: { password: $password },
      handler: (body) => {
        if (body.error === "NO_PERMISSION") {
          $passwordError = true;
          $loading = false;
          $platformRestarting = false;
          return;
        }

        setTimeout(async () => {
          while (!(await isPanoHealthy())) {
            await delay(1000);
          }

          location.reload();
        }, 1000)
      },
    });
  }
</script>
