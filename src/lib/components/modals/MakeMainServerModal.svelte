<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">
          {$_('components.modals.make-main-server.title', { values: { serverName: $server.name } })}
        </h5>
        <div class="text-body-secondary">
          {$_('components.modals.make-main-server.description')}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link text-decoration-none col-6 m-0"
          type="button"
          class:disabled={$loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-primary col-6 m-0"
          type="button"
          class:disabled={$loading}
          on:click={acceptServer}>
          {#if $loading}<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"
            ></span
            >{/if}
          {$_('buttons.set-as-main')}
        </button>
      </div>
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

  export function show(newServer) {
    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    loading.set(false);
    server.set(newServer);

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
  import { invalidateAll } from '$app/navigation';

  import ApiUtil from '$lib/api.util';

  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';
  import { _ } from 'svelte-i18n';

  function acceptServer() {
    $loading = true;

    ApiUtil.post({
      path: `/panel/servers/${$server.id}/main`,
      handler: async (body, reject) => {
        if (!body.error) {
          callback($server);
          await invalidateAll();
          hide();
          await showSuccessToast('components.toasts.server-made-main', { name: $server.name });

          return;
        } else if (body.error) {
          location.reload();

          return;
        }

        reject();
      },
    });
  }
</script>
