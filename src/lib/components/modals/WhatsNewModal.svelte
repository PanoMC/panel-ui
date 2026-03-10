<style>
  .feature-icon-small {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Override blocks paths due to /panel base path */
  .blocks {
    background-image:
      url('/panel/assets/img/red.svg'), url('/panel/assets/img/yellow.svg'),
      url('/panel/assets/img/green.svg') !important;
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered" role="dialog">
    <div class="modal-content overflow-hidden">
      <div
        class="modal-header text-bg-primary d-block text-center border-bottom-0 py-5 position-relative blocks">
        <button
          type="button"
          class="btn-close btn-close-white position-absolute top-0 end-0 m-3"
          aria-label="Close"
          on:click={handleClose}></button>
        <img
          src="{base}/assets/img/pano-logo-heorizontal.png"
          alt="Pano"
          class="my-3"
          style="height: 3rem;" />
        <p class="lead mb-0 px-lg-5">{$_('components.whats-new.description')}</p>
      </div>
      <div class="modal-body px-lg-5 py-5">
        <div class="row g-4 mb-4 text-start">
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small bg-primary bg-gradient text-white rounded-3 p-2 me-3">
                <i class="fas fa-file-alt"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-1">{$_('components.whats-new.features.cms')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.cms-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small bg-primary bg-gradient text-white rounded-3 p-2 me-3">
                <i class="fas fa-server"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-1">{$_('components.whats-new.features.management')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.management-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small bg-primary bg-gradient text-white rounded-3 p-2 me-3">
                <i class="fas fa-gamepad"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-1">{$_('components.whats-new.features.integration')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.integration-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small bg-primary bg-gradient text-white rounded-3 p-2 me-3">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-1">{$_('components.whats-new.features.e2ee')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.e2ee-description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {#if $showDonotShowAgain}
        <div class="modal-footer d-flex justify-content-center align-items-center">
          <div class="form-check form-switch mb-0">
            <input
              class="form-check-input"
              type="checkbox"
              id="dontShowAgain"
              autocomplete="off"
              bind:checked={$dontShowAgain} />
            <label class="form-check-label small" for="dontShowAgain">
              {$_('components.whats-new.dont-show-again')}
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';
  export const dontShowAgain = writable(false);

  export const WHATS_NEW_VERSION = '1';

  const modalElement = writable();
  let modal;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const showDonotShowAgain = writable(true);

  export async function show(requestedShowDonotShowAgain = true) {
    showDonotShowAgain.set(requestedShowDonotShowAgain);
    dontShowAgain.set(false);

    if (!modal) {
      modal = new window.bootstrap.Modal(get(modalElement), {
        backdrop: true,
        keyboard: true,
      });
    }

    modal.show();
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';
  import ApiUtil from '$lib/api.util.js';


  onMount(() => {
    const element = get(modalElement);
    if (element) {
      element.addEventListener('hidden.bs.modal', handleDismissal);
    }

    return () => {
      if (element) {
        element.removeEventListener('hidden.bs.modal', handleDismissal);
      }
    };
  });

  async function handleDismissal() {
    if (get(showDonotShowAgain) && get(dontShowAgain)) {
      await ApiUtil.post({
        path: '/api/panel/dismissWhatsNew',
        body: {
          version: WHATS_NEW_VERSION,
        },
      });
    }
  }

  function handleClose() {
    hide();
  }
</script>
