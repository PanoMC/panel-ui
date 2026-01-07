<!-- Confirm Stop Pano Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={sendStopPano}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-stop-circle fa-3x d-block m-auto text-danger"></i>
          </div>
          {$_('components.modals.confirm-stop-pano.title')}

          <input
            class="form-control mt-3"
            placeholder={$_('components.modals.confirm-stop-pano.account-password')}
            type="password"
            bind:value={$password}
            bind:this={$passwordInput}
            class:border-danger={$passwordError} />
        </div>

        <div class="modal-footer flex-nowrap">
          <button class="btn btn-link col-6 m-0" type="button" on:click={hide} disabled={$loading}>
            {$_('buttons.cancel')}
          </button>
          <button
            class="btn btn-danger col-6 m-0"
            type="button"
            disabled={confirmButtonDisabled || $loading}
            on:click={sendStopPano}>
            {$_('buttons.yes')}
            {#if $loading}
              <i class="fa-solid fa-spinner fa-spin"></i>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const loading = writable(false);
  const passwordError = writable(false);
  const password = writable('');
  const passwordInput = writable();

  export function show() {
    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    loading.set(false);
    passwordError.set(false);
    password.set('');

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
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';

  $: confirmButtonDisabled = $password.length === 0;

  function sendStopPano() {
    $loading = true;
    $passwordError = false;

    ApiUtil.post({
      path: '/api/panel/settings/stop-pano',
      body: { password: $password },
      handler: (body, reject) => {
        if (body.error === 'NO_PERMISSION') {
          $passwordError = true;
          $loading = false;
          return;
        }

        location.reload();
      },
    });
  }
</script>
