<!-- Confirm Save Critical Settings Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={onConfirm}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-triangle-exclamation fa-3x d-block m-auto text-warning"></i>
          </div>
          {$_('components.modals.confirm-save-critical-settings.title')}

          <input
            class="form-control mt-3"
            placeholder={$_('components.modals.confirm-save-critical-settings.account-password')}
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
            class="btn btn-warning col-6 m-0"
            type="submit"
            disabled={confirmButtonDisabled || $loading}>
            {$_('buttons.save')}
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
