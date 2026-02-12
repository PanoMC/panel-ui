<!-- Confirm Remove Server Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={sendDeleteServer}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
          </div>
          {$_('components.modals.remove-server.title')}

          <input
            class="form-control zmt-3"
            placeholder={$_('components.modals.remove-server.account-password')}
            type="password"
            bind:value={$currentPassword}
            bind:this={$passwordInput}
            class:border-danger={$passwordError} />
        </div>

        <div class="modal-footer flex-nowrap">
          <button class="btn btn-link col-6 m-0" type="button" on:click={hide}
            >{$_('buttons.cancel')}</button>
          <button
            class="btn btn-danger col-6 m-0"
            type="button"
            disabled={confirmButtonDisabled}
            class:disabled={confirmButtonDisabled}
            on:click={sendDeleteServer}>{$_('buttons.yes')}</button>
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

  const server = writable({});
  const loading = writable(false);
  const passwordError = writable(false);
  const currentPassword = writable('');
  const passwordInput = writable();

  export function show(newServer) {
    modal = new window.bootstrap.Modal(get(modalElement));

    loading.set(false);
    server.set(newServer);
    passwordError.set(false);
    currentPassword.set('');

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

  import { invalidateAll } from '$app/navigation';

  import ApiUtil from '$lib/api.util';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  $: confirmButtonDisabled = $currentPassword.length === 0;

  function sendDeleteServer() {
    $loading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/delete`,
      body: { currentPassword: $currentPassword },
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === 'CURRENT_PASSWORD_NOT_CORRECT') {
            $passwordError = true;
            return;
          }

          location.reload();
          return;
        }

        callback($server);
        hide();
        invalidateAll();
        location.reload();
        showToast('components.toasts.server-deleted-success', { name: $server.name });
      },
    });
  }
</script>
