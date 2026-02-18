<!-- Confirm Send Verification Email Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="pb-3">
          {$_('components.modals.confirm-send-verification-email.description')}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
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
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {/if}
          {$_('buttons.yes')}
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
    modal?.hide();
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
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import { _ } from 'svelte-i18n';

  let loading = false;

  function onSubmit() {
    loading = true;

    ApiUtil.post({
      path: `/api/panel/players/${$player.username}/verificationMail`,
      handler: async (body, reject) => {
        loading = false;

        if (body.result === 'ok') {
          hide();
          await showToast('components.toasts.verification-email-sent-successful', {
            username: $player.username,
          });
          callback($player);
          return;
        }

        await showToast('components.toasts.verification-email-sent-error', {
          username: $player.username,
          errorCode: $_('errors.' + body.error),
        });
        
        hide();
      },
    });
  }
</script>
