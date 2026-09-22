<!-- Confirm Ban Player Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="pb-3">
          {$_('components.modals.confirm-ban-player.title')}
        </div>

        {#if $server}
          <!-- From a server's roster: say how far this ban reaches before it is issued. -->
          <div class="alert small text-start {$server.panoUser ? 'alert-info' : 'alert-warning'}">
            {$server.panoUser
              ? $_('components.modals.confirm-ban-player.scope-pano', {
                  values: { username: $player.username },
                })
              : $_('components.modals.confirm-ban-player.scope-server', {
                  values: { username: $player.username },
                })}
          </div>
        {/if}

        <!-- Ban Message -->
        <div class="form-group text-start mb-3">
          <label for="banMessage" class="form-label"
            >{$_('components.modals.confirm-ban-player.ban-message')}</label>
          <textarea
            class="form-control"
            id="banMessage"
            rows="3"
            maxlength="255"
            placeholder={$_('components.modals.confirm-ban-player.ban-message-placeholder')}
            bind:value={$banMessage}>
          </textarea>
          <small class="float-end">{$banMessage.length}/255</small>
        </div>

        <!-- Ban Duration: a server's own ban list has no end date, so only a Pano ban has one. -->
        {#if !$server || $server.panoUser}
          <div class="form-group text-start mb-3">
            <h6 class="mb-2">{$_('components.modals.confirm-ban-player.ban-duration')}</h6>

            <!-- Button Group for Ban Duration -->
            <div class="btn-group w-100" role="group" aria-label="Ban duration options">
              <!-- Permanent Ban -->
              <input
                type="radio"
                class="btn-check"
                value="permanent"
                bind:group={$banDuration}
                id="banPermanent"
                autocomplete="off" />
              <label class="btn btn-outline-primary" for="banPermanent">
                {$_('components.modals.confirm-ban-player.permanent-ban')}
              </label>

              <!-- Predefined Duration -->
              <input
                type="radio"
                class="btn-check"
                value="custom"
                bind:group={$banDuration}
                id="banCustom"
                autocomplete="off" />
              <label class="btn btn-outline-primary" for="banCustom">
                {$_('components.modals.confirm-ban-player.custom-duration')}
              </label>

              <!-- Custom Date/Time -->
              <input
                type="radio"
                class="btn-check"
                value="datetime"
                bind:group={$banDuration}
                id="banDateTime"
                autocomplete="off" />
              <label class="btn btn-outline-primary" for="banDateTime">
                {$_('components.modals.confirm-ban-player.custom-datetime')}
              </label>
            </div>

            <!-- Custom Duration Selector -->
            {#if $banDuration === 'custom'}
              <div class="mt-2">
                <select class="form-select" bind:value={$customDuration}>
                  <option value=""
                    >{$_('components.modals.confirm-ban-player.select-duration')}</option>
                  <option value="15m"
                    >{$_('components.modals.confirm-ban-player.15-minutes')}</option>
                  <option value="30m"
                    >{$_('components.modals.confirm-ban-player.30-minutes')}</option>
                  <option value="1h">{$_('components.modals.confirm-ban-player.1-hour')}</option>
                  <option value="3h">{$_('components.modals.confirm-ban-player.3-hours')}</option>
                  <option value="6h">{$_('components.modals.confirm-ban-player.6-hours')}</option>
                  <option value="12h">{$_('components.modals.confirm-ban-player.12-hours')}</option>
                  <option value="1d">{$_('components.modals.confirm-ban-player.1-day')}</option>
                  <option value="3d">{$_('components.modals.confirm-ban-player.3-days')}</option>
                  <option value="7d">{$_('components.modals.confirm-ban-player.1-week')}</option>
                  <option value="30d">{$_('components.modals.confirm-ban-player.1-month')}</option>
                  <option value="180d"
                    >{$_('components.modals.confirm-ban-player.6-months')}</option>
                  <option value="365d">{$_('components.modals.confirm-ban-player.1-year')}</option>
                </select>
              </div>
            {/if}

            <!-- Custom Date/Time Input -->
            {#if $banDuration === 'datetime'}
              <div class="mt-2">
                <input
                  type="datetime-local"
                  class="form-control"
                  bind:value={$customDateTime}
                  min={new Date().toISOString().slice(0, 16)}
                  step="60" />
              </div>
            {/if}
          </div>
        {/if}

        {#if !$server || $server.panoUser}
          <div class="form-check d-inline-block text-center">
            <input
              class="form-check-input"
              type="checkbox"
              value=""
              bind:checked={$sendNotification}
              id="notifyBanEmail" />
            <label class="form-check-label" for="notifyBanEmail">
              {$_('components.modals.confirm-ban-player.notify-with-email')}
            </label>
          </div>
        {/if}
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
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={onSubmit}>
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
  /**
   * Set when the ban comes from a server's roster rather than the players page:
   * `{ id, panoUser, onDone }`. It goes through that server's player action, which bans the Pano
   * account when there is one and falls back to the server's own ban list when there is not.
   *
   * @type {import('svelte/store').Writable<{ id: number, panoUser: boolean, onDone?: (scope: string) => void } | null>}
   */
  const server = writable(null);

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const sendNotification = writable(true);
  const banMessage = writable('');
  const banDuration = writable('permanent');
  const customDuration = writable('');
  const customDateTime = writable('');

  /**
   * @param {object} newPlayer
   * @param {{ id: number, panoUser: boolean, onDone?: (scope: string) => void } | null} [fromServer]
   */
  export function show(newPlayer, fromServer = null) {
    player.set(newPlayer);
    server.set(fromServer);
    sendNotification.set(true);
    banMessage.set('');
    banDuration.set('permanent');
    customDuration.set('');
    customDateTime.set('');

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    if (!get(server)) {
      hideCallback(get(player));
    }

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
  import { showServerActionError } from '$lib/servers.util.js';

  import { _ } from 'svelte-i18n';

  let loading;

  function calculateDuration() {
    if ($banDuration === 'permanent') {
      return null;
    }

    if ($banDuration === 'custom') {
      const now = new Date();
      let durationMs = 0;

      switch ($customDuration) {
        case '15m':
          durationMs = 15 * 60 * 1000;
          break; // 15 mins
        case '30m':
          durationMs = 30 * 60 * 1000;
          break; // 30 mins
        case '1h':
          durationMs = 1 * 60 * 60 * 1000;
          break;
        case '3h':
          durationMs = 3 * 60 * 60 * 1000;
          break;
        case '6h':
          durationMs = 6 * 60 * 60 * 1000;
          break;
        case '12h':
          durationMs = 12 * 60 * 60 * 1000;
          break;
        case '1d':
          durationMs = 24 * 60 * 60 * 1000;
          break;
        case '3d':
          durationMs = 3 * 24 * 60 * 60 * 1000;
          break;
        case '7d':
          durationMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          durationMs = 30 * 24 * 60 * 60 * 1000;
          break;
        case '180d':
          durationMs = 180 * 24 * 60 * 60 * 1000;
          break; // 6 month
        case '365d':
          durationMs = 365 * 24 * 60 * 60 * 1000;
          break; // 1 year
        default:
          return null;
      }

      return now.getTime() + durationMs; // Java System.currentTimeMillis() format
    }

    if ($banDuration === 'datetime' && $customDateTime) {
      const dateTime = new Date($customDateTime);
      return dateTime.getTime(); // Java System.currentTimeMillis() format
    }

    return null;
  }

  function onSubmit() {
    if ($server) {
      submitFromServer($server);
      return;
    }

    loading = true;

    const duration = calculateDuration();
    const body = {
      sendNotification: $sendNotification,
      banMessage: $banMessage,
    };

    if (duration !== null) {
      body.duration = duration;
    }

    ApiUtil.post({
      path: `/api/panel/players/${$player.username}/ban`,
      body,
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === 'ALREADY_BANNED' || body.error === 'NOT_EXISTS') {
            location.reload();
            return;
          }

          reject(body.error);
          return;
        }

        hide();

        showSuccessToast('components.toasts.player-ban.the-player', {
          username: $player.username,
          event: body.error
            ? $_('components.toasts.player-ban.could-not-ban', {
                values: $_('errors.' + body.error),
              })
            : $_('components.toasts.player-ban.banned'),
        });

        if (body.result === 'ok') {
          callback($player);
        }

        loading = false;
      },
    });
  }

  /**
   * @param {{ id: number, panoUser: boolean, onDone?: (scope: string) => void }} fromServer
   */
  async function submitFromServer(fromServer) {
    loading = true;

    const body = { action: 'BAN' };
    const reason = $banMessage.trim();

    if (reason) {
      body.text = reason;
    }

    if (fromServer.panoUser) {
      const duration = calculateDuration();

      body.sendNotification = $sendNotification;

      if (duration !== null) {
        body.duration = duration;
      }
    }

    try {
      const response = await ApiUtil.post({
        path: `/api/panel/servers/${fromServer.id}/players/${encodeURIComponent($player.uuid || $player.username)}/action`,
        body,
        handler: (response) => response,
      });

      if (!response) {
        return;
      }

      if (response.error) {
        showServerActionError(response.error);
        return;
      }

      hide();

      showSuccessToast('components.toasts.player-ban.the-player', {
        username: $player.username,
        event: $_('components.toasts.player-ban.banned'),
      });

      fromServer.onDone?.(response.scope);
    } finally {
      loading = false;
    }
  }
</script>
