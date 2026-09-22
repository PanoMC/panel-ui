<!-- Server Player Action Modal — asks for the kick reason / the private message text -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$action === 'KICK'
            ? $_('components.modals.server-player-action.kick-title', {
                values: { username: $player?.username ?? '' },
              })
            : $_('components.modals.server-player-action.message-title', {
                values: { username: $player?.username ?? '' },
              })}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>
      <div class="modal-body">
        <label class="form-label" for="serverPlayerActionText">
          {$action === 'KICK'
            ? $_('components.modals.server-player-action.kick-label')
            : $_('components.modals.server-player-action.message-label')}
        </label>
        <input
          type="text"
          class="form-control"
          id="serverPlayerActionText"
          maxlength="256"
          placeholder={$action === 'KICK'
            ? $_('components.modals.server-player-action.kick-placeholder')
            : $_('components.modals.server-player-action.message-placeholder')}
          bind:value={$text} />
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" onclick={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn col-6 m-0"
          class:btn-danger={$action === 'KICK'}
          class:btn-primary={$action !== 'KICK'}
          disabled={$busy || ($action === 'MESSAGE' && !$text.trim())}
          onclick={confirm}>
          {#if $busy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$action === 'KICK'
            ? $_('pages.servers.players.action-kick')
            : $_('pages.servers.players.action-message')}
        </button>
      </div>
    </div>
  </div>
</div>

<script module>
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const player = writable(null);
  const action = writable('KICK');
  const text = writable('');
  const busy = writable(false);

  /** @type {(text: string) => Promise<boolean>} */
  let callback = async () => false;
  let modal;

  /**
   * @param {{ uuid: string, username: string }} newPlayer
   * @param {string} newAction one of `KICK` / `MESSAGE`
   * @param {(text: string) => Promise<boolean>} newCallback resolves to whether it was accepted.
   */
  export function show(newPlayer, newAction, newCallback) {
    player.set(newPlayer);
    action.set(newAction);
    text.set('');
    busy.set(false);
    callback = newCallback || (async () => false);

    const element = get(modalElement);

    // The modal is mounted by the page that opens it; degrade to a no-op instead of throwing if
    // that mount is ever missing, so a caller never loses its own error handling to this.
    if (!element) {
      console.error('ServerPlayerActionModal is not mounted.');

      return;
    }

    modal = window.bootstrap.Modal.getOrCreateInstance(element, {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }
</script>

<script>
  import { onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';

  // Mounted by the page that opens it, so it leaves with that page: the instance and its
  // backdrop must not outlive the element they were attached to.
  onDestroy(() => {
    if (modal) {
      modal.hide();
      modal.dispose();
      modal = undefined;
    }
  });

  async function confirm() {
    if (!get(player) || get(busy)) {
      return;
    }

    busy.set(true);

    const sent = await callback(get(text).trim());

    busy.set(false);

    if (sent) {
      hide();
    }
  }
</script>
