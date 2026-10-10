<!-- Confirm Update Platform Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-download fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">{$_('components.modals.confirm-update-platform.title')}</h5>
        <div class="text-body-secondary">
          {$_('components.modals.confirm-update-platform.description')}
        </div>

        {#if $planFailed}
          <!-- The update plan could not be read, so nothing is known about the addons and themes. -->
          <div
            class="alert alert-warning text-start mt-3 mb-0 d-flex align-items-start"
            data-plan-failed-note>
            <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>{$_('components.modals.confirm-update-platform.plan-failed')}</div>
          </div>
        {/if}

        {#if showBackgroundOption}
          <div class="alert alert-warning text-start mt-3 mb-0 d-flex align-items-start">
            <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>{$_('components.modals.confirm-update-platform.terminal-mode-warning')}</div>
          </div>
          <div class="form-check form-switch text-start mt-2">
            <input
              id="updateInBackgroundSwitch"
              class="form-check-input"
              type="checkbox"
              bind:checked={$background}
              disabled={loading} />
            <label class="form-check-label" for="updateInBackgroundSwitch">
              {$_('components.modals.confirm-update-platform.restart-in-background')}
            </label>
          </div>
        {/if}
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
          class:disabled={confirmDisabled}
          disabled={confirmDisabled}
          on:click={onYesClick}>
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.update')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();

  let hideCallback = () => {};
  let modal;
  const continueProcessObj = writable();
  const background = writable(false);
  const planFailed = writable(false);

  /**
   * @param {(background: boolean) => any} continueProcess
   * @param {{ planFailed?: boolean }} [options] `planFailed`: the update plan could not be read, say so.
   */
  export function show(continueProcess, options = {}) {
    continueProcessObj.set(continueProcess);
    planFailed.set(options.planFailed === true);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
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

  export let runMode = undefined;

  let loading = false;

  // Container mode (Pano Host, Docker): the launcher owns the process, no terminal to detach from.
  $: showBackgroundOption = runMode != null && !runMode.background && !runMode.container;
  $: if (showBackgroundOption) $background = true;
  else $background = false;

  // When the toggle is visible we require the user to keep it on. Turning it off means
  // staying terminal-attached during/after the update, which is the risky path we just
  // warned them about — block the confirm button so they have to opt in (or cancel).
  $: confirmDisabled = loading || (showBackgroundOption && !$background);

  async function onYesClick() {
    loading = true;

    await $continueProcessObj($background);

    hide();
    loading = false;
  }
</script>
