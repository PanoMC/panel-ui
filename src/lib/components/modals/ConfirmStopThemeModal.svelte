<!-- Confirm Delete Theme Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={onYesClick}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
          </div>
          {$_('components.modals.confirm-stop-theme.title')}

          <input
            class="form-control mt-3"
            placeholder={$_('components.modals.confirm-stop-theme.account-password')}
            type="password"
            bind:value={$password}
            bind:this={$passwordInput}
            class:border-danger={$passwordError} />
        </div>
        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link col-6 m-0"
            type="button"
            disabled={$loading}
            on:click={hide}>
            {$_('buttons.cancel')}
          </button>
          <button
            class="btn btn-danger col-6 m-0"
            type="submit"
            disabled={confirmButtonDisabled || $loading}
            on:click={onYesClick}>
            {$_('buttons.yes')}
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
  import { get, writable } from 'svelte/store';

  const modalElement = writable();

  let hideCallback = () => {};
  let modal;
  const continueProcessObj = writable();

  export const loading = writable(false);
  export const passwordError = writable(false);
  export const password = writable('');
  export const passwordInput = writable();

  export function show(continueProcess) {
    continueProcessObj.set(continueProcess);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    loading.set(false);
    passwordError.set(false);
    password.set('');

    modal.show();

    setTimeout(() => {
      get(passwordInput)?.focus();
    }, 500);
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
  import { _ } from 'svelte-i18n';

  $: confirmButtonDisabled = $password.length === 0;

  async function onYesClick() {
    $loading = true;
    $passwordError = false;

    if (await $continueProcessObj($password)) {
      hide();
    }

    $loading = false;
  }
</script>
