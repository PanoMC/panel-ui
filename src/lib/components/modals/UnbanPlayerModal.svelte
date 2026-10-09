<!-- Unban Player Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">{$_('components.modals.unban-player.title')}</h5>
        <div class="text-body-secondary">
          {$_('components.modals.unban-player.description')}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link text-decoration-none col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-primary col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={onSubmit}>
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.unban')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const player = writable({});

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show(newPlayer) {
    player.set(newPlayer);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
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
  import ApiUtil from '$lib/api.util.js';
  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';

  import { _ } from 'svelte-i18n';

  let loading;
  // let sendNotification = false;

  function onSubmit() {
    loading = true;

    ApiUtil.post({
      path: `/panel/players/${$player.username}/unban`,
      handler: (body, reject) => {
        if (body.error) {
          if (body.error?.code === 'NOT_BANNED' || body.error?.code === 'NOT_EXISTS') {
            location.reload();
            return;
          }

          reject(body.error?.code);
          return;
        }

        hide();

        showSuccessToast('components.toasts.player-unban.the-player', {
          username: $player.username,
          event: body.error
            ? $_('components.toasts.player-unban.could-not-remove-ban', {
                values: $_('errors.' + body.error?.code),
              })
            : $_('components.toasts.player-unban.removed-ban'),
        });

        callback($player);

        loading = false;
      },
    });
  }
</script>
