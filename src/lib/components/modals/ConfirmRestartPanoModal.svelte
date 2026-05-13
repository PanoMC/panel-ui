<!-- Confirm Restart Pano Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={sendRestartPano}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-refresh fa-3x d-block m-auto text-warning"></i>
          </div>
          {$_('components.modals.confirm-restart-pano.title')}

          {#if showBackgroundOption}
            <div class="alert alert-warning small text-start mt-3 mb-0">
              <i class="fas fa-triangle-exclamation me-2"></i>
              {$_('components.modals.confirm-restart-pano.terminal-mode-warning')}
            </div>
            <div class="form-check form-switch text-start mt-2">
              <input
                id="restartInBackgroundSwitch"
                class="form-check-input"
                type="checkbox"
                bind:checked={$background}
                disabled={$loading} />
              <label class="form-check-label" for="restartInBackgroundSwitch">
                {$_('components.modals.confirm-restart-pano.restart-in-background')}
              </label>
            </div>
          {/if}

          <input
            class="form-control mt-3"
            placeholder={$_('components.modals.confirm-restart-pano.account-password')}
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
            type="button"
            disabled={confirmButtonDisabled || $loading}
            on:click={sendRestartPano}>
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

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const loading = writable(false);
  const passwordError = writable(false);
  const password = writable('');
  const passwordInput = writable();
  const background = writable(false);

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
  import { getContext } from 'svelte';

  import ApiUtil from '$lib/api.util';

  export let runMode = undefined;

  const platformRestarting = getContext('platformRestarting');

  // Offer the "restart in background" toggle whenever the platform isn't already detached.
  // -bg only controls terminal attachment, so even in GUI mode the launching terminal/SSH
  // session can still kill the process when closed — the toggle stays useful.
  $: showBackgroundOption = runMode != null && !runMode.background;
  $: if (showBackgroundOption) $background = true;
  else $background = false;

  // When the toggle is visible we require the user to keep it on. Turning it off means
  // staying terminal-attached, which is the risky path we just warned them about — block
  // the confirm button so they have to opt in to background mode (or cancel).
  $: confirmButtonDisabled =
    $password.length === 0 || (showBackgroundOption && !$background);

  async function isPanoHealthy() {
    try {
      const getHealthResponse = await ApiUtil.get({ path: '/api/health' });

      return getHealthResponse.result === 'ok';
    } catch (_) {
      return false;
    }
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  function sendRestartPano() {
    $loading = true;
    $passwordError = false;
    $platformRestarting = true;

    ApiUtil.post({
      path: '/api/panel/settings/restart-pano',
      body: { password: $password, background: $background },
      handler: (body) => {
        if (body.error === 'NO_PERMISSION') {
          $passwordError = true;
          $loading = false;
          $platformRestarting = false;
          return;
        }

        setTimeout(async () => {
          while (!(await isPanoHealthy())) {
            await delay(1000);
          }

          location.reload();
        }, 1000);
      },
    });
  }
</script>
