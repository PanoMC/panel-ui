<!-- Confirm Save Critical Settings Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={onConfirm}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-triangle-exclamation fa-3x d-block m-auto"></i>
          </div>
          <h5 class="mb-2">{$_('components.modals.confirm-save-critical-settings.title')}</h5>
          <div class="text-body-secondary">
            {$_('components.modals.confirm-save-critical-settings.description')}
          </div>

          <input
            class="form-control mt-3"
            placeholder={$_('components.modals.confirm-save-critical-settings.account-password')}
            type="password"
            bind:value={$password}
            bind:this={$passwordInput}
            class:border-danger={$passwordError} />
        </div>

        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link text-decoration-none col-6 m-0"
            type="button"
            on:click={hide}
            disabled={$loading}>
            {$_('buttons.cancel')}
          </button>
          <button
            class="btn btn-primary col-6 m-0"
            type="submit"
            disabled={confirmButtonDisabled || $loading}>
            {#if $loading}<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"
              ></span
              >{/if}
            {$_('buttons.save')}
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
  let modal;

  const loading = writable(false);
  const passwordError = writable(false);
  const password = writable('');
  const passwordInput = writable();

  export function show(newCallback) {
    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    callback = newCallback;
    loading.set(false);
    passwordError.set(false);
    password.set('');

    modal.show();

    setTimeout(() => {
      const input = get(passwordInput);
      if (input) input.focus();
    }, 500);
  }

  export function hide() {
    modal.hide();
  }

  export function setError(isError) {
    passwordError.set(isError);
    loading.set(false);
  }

  export function setLoading(isLoading) {
    loading.set(isLoading);
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  $: confirmButtonDisabled = $password.length === 0;

  function onConfirm() {
    loading.set(true);
    passwordError.set(false);
    callback(get(password));
  }
</script>
