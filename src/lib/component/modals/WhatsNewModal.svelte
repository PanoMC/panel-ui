<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered" role="dialog">
    <div class="modal-content overflow-hidden">
      <div class="modal-header border-bottom-0 pb-0">
         <button type="button" class="btn-close" aria-label="Close" on:click={handleClose}></button>
      </div>
      <div class="modal-body px-lg-5 pb-5">
        <div class="text-center mb-4">
          <div class="display-5 fw-bold text-primary mb-2">{$_('components.whats-new.title')}</div>
          <p class="lead text-muted">{$_('components.whats-new.description')}</p>
        </div>

        <div class="row g-4 mb-4 text-start">
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small bg-primary bg-gradient text-white rounded-3 p-2 me-3">
                <i class="fas fa-rocket"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-1">{$_('components.whats-new.features.beta')}</h5>
                <p class="small text-muted mb-0">{$_('components.whats-new.features.beta-description')}</p>
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
                <p class="small text-muted mb-0">{$_('components.whats-new.features.integration-description')}</p>
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
                <p class="small text-muted mb-0">{$_('components.whats-new.features.management-description')}</p>
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
                <p class="small text-muted mb-0">{$_('components.whats-new.features.e2ee-description')}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small bg-primary bg-gradient text-white rounded-3 p-2 me-3">
                <i class="fas fa-file-alt"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-1">{$_('components.whats-new.features.cms')}</h5>
                <p class="small text-muted mb-0">{$_('components.whats-new.features.cms-description')}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center">
            <a href="{PANO_WEBSITE_URL}/docs" target="_blank" class="btn btn-outline-primary px-4">
                <i class="fas fa-book me-2"></i> {$_('buttons.see-docs')}
            </a>
        </div>
      </div>
      <div class="modal-footer bg-body-tertiary border-top d-flex justify-content-between align-items-center py-3 px-4">
        {#if $showDonotShowAgain}
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" id="dontShowAgain" bind:checked={dontShowAgain}>
            <label class="form-check-label small" for="dontShowAgain">
              {$_('components.whats-new.dont-show-again')}
            </label>
          </div>
        {/if}
        <button class="btn btn-primary px-4" type="button" on:click={handleClose}>
          {$_('buttons.close')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  let modal;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const showDonotShowAgain = writable(true);

  export async function show(requestedShowDonotShowAgain = true) {
    showDonotShowAgain.set(requestedShowDonotShowAgain);
    while (!window.bootstrap) {
      await delay(50);
    }

    if (!modal) {
        modal = new window.bootstrap.Modal(get(modalElement), {
            backdrop: 'static',
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
  import { _ } from 'svelte-i18n';
  import ApiUtil from '$lib/api.util.js';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  let dontShowAgain = false;

  async function handleClose() {
    if ($showDonotShowAgain && dontShowAgain) {
      await ApiUtil.post({
        path: '/api/panel/dismissWhatsNew'
      });
    }
    hide();
  }
</script>

<style>
    .feature-icon-small {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
</style>
