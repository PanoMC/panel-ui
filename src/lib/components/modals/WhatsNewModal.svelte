<style>
  .feature-icon-small {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* The website home hero's cover: the about-page image under a radial fade into the page colour,
     itself masked out towards the bottom. */
  .whats-new-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 100%, var(--bs-body-bg) 0%, transparent 500%),
      var(--cover-image) center/cover no-repeat;
    -webkit-mask-image: linear-gradient(to bottom, #000 50%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 50%, transparent 100%);
  }

  .whats-new-header > :not(button) {
    position: relative;
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered" role="dialog">
    <div class="modal-content overflow-hidden">
      <div
        class="modal-header whats-new-header d-block text-center border-bottom-0 py-5 position-relative overflow-hidden"
        style="--cover-image: url('{base}/assets/img/about-page.png')">
        <button
          type="button"
          class="btn-close position-absolute top-0 end-0 m-3"
          aria-label="Close"
          on:click={handleClose}></button>
        <img
          src="{base}/assets/img/pano-logo-heorizontal.png"
          alt="Pano"
          class="my-3"
          style="height: 2rem;" />
      </div>
      <div class="modal-body px-lg-5 pt-0 pb-5">
        <h2 class="lead display-5 text-center mb-5">{$_('components.whats-new.features.beta')}</h2>
        <div class="row g-4 mb-4 text-start">
          <!-- M9 — a SERVERS install has no website, so the CMS is not advertised to it. -->
          {#if $usageMode !== UsageModes.SERVERS}
            <div class="col-md-6">
              <div class="d-flex align-items-start">
                <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                  <i class="fas fa-pen"></i>
                </div>
                <div>
                  <h5 class="fw-normal mb-1">{$_('components.whats-new.features.cms')}</h5>
                  <p class=" mb-0">
                    {$_('components.whats-new.features.cms-description')}
                  </p>
                </div>
              </div>
            </div>
          {/if}
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                <i class="fas fa-cube"></i>
              </div>
              <div>
                <h5 class="fw-normal mb-1">{$_('components.whats-new.features.management')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.management-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                <i class="fas fa-gamepad"></i>
              </div>
              <div>
                <h5 class="fw-normal mb-1">{$_('components.whats-new.features.integration')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.integration-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div>
                <h5 class="fw-normal mb-1">{$_('components.whats-new.features.e2ee')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.e2ee-description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {#if $showDonotShowAgain}
        <div class="modal-footer bg-body-tertiary d-flex justify-content-center align-items-center">
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
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { base } from '@panomc/sdk/core/js/basePath.js';
  import ApiUtil from '$lib/api.util.js';
  import { UsageModes } from '$lib/navigation.util.js';

  const usageMode = getContext('usageMode');

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
        path: '/panel/dismissWhatsNew',
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
