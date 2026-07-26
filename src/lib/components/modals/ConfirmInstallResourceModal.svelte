<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-body text-center">
        <!-- Main Icon -->
        <div class="pb-3">
          {#if $versionInfoObj?.action === 'DOWNGRADE'}
            <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-gray"></i>
          {:else if $versionInfoObj?.action === 'UPDATE'}
            <i class="fa-solid fa-sync fa-3x d-block m-auto text-gray"></i>
          {:else if $versionInfoObj?.action === 'REINSTALL'}
            <i class="fa-solid fa-rotate-right fa-3x d-block m-auto text-gray"></i>
          {:else}
            <i class="fa-solid fa-download fa-3x d-block m-auto text-gray"></i>
          {/if}
        </div>

        <!-- Title -->
        <h5 class="mb-3">
          {#if $versionInfoObj?.action === 'INSTALL'}
            {$_('components.store-loading.install-title', {
              values: {
                name: $versionInfoObj.version.resourceTitle,
                version: $versionInfoObj.version.tag,
              },
            })}
          {:else if $versionInfoObj?.action === 'UPDATE'}
            {$_('components.store-loading.update-title', {
              values: {
                name: $versionInfoObj.version.resourceTitle,
                version: $versionInfoObj.version.tag,
              },
            })}
          {:else if $versionInfoObj?.action === 'DOWNGRADE'}
            {$_('components.store-loading.downgrade-title', {
              values: {
                name: $versionInfoObj.version.resourceTitle,
                version: $versionInfoObj.version.tag,
              },
            })}
          {:else}
            {$_('components.store-loading.reinstall-title', {
              values: {
                name: $versionInfoObj.version.resourceTitle,
                version: $versionInfoObj.version.tag,
              },
            })}
          {/if}
        </h5>
        <!-- Unverified Warning -->
        {#if $versionInfoObj && !$versionInfoObj.version.verified}
          <div
            class="alert alert-warning text-start d-flex gap-2 align-items-center mb-3"
            role="alert">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>
            <div>
              <strong>{$_('components.store-loading.unverified-resource-warning-title')}</strong>
              <br />
              <small
                >{$_('components.store-loading.unverified-resource-warning-description')}</small>
            </div>
          </div>
        {/if}

        <!-- Resource Card -->
        {#if $versionInfoObj}
          <div class="card">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-auto">
                  <div
                    class="d-flex align-items-center justify-content-center rounded border overflow-hidden position-relative"
                    style="width: 64px; height: 64px;">
                    {#if $type === 'ADDON'}
                      <img
                        src="{PANO_WEBSITE_API_URL}/resources/{$versionInfoObj.version
                          .resourceId}/icon?preview=true"
                        alt="Icon"
                        width="64"
                        height="64"
                        class="object-fit-contain w-100 h-100 p-1"
                        loading="lazy"
                        on:error={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }} />
                      <i class="fa-solid fa-puzzle-piece text-primary fs-4" style="display: none;"
                      ></i>
                    {:else if $versionInfoObj.version.screenshots?.length > 0}
                      <img
                        src="{PANO_WEBSITE_API_URL}/resources/{$versionInfoObj.version
                          .resourceId}/screenshots/{$versionInfoObj.version
                          .screenshots[0]}?preview=true"
                        alt="Screenshot"
                        width="64"
                        height="64"
                        class="object-fit-cover w-100 h-100"
                        loading="lazy" />
                    {:else}
                      <i class="fa-solid fa-palette text-primary fs-4"></i>
                    {/if}
                  </div>

                  <!-- Actions, kept under the icon -->
                  <div class="d-flex align-items-center justify-content-center gap-1 mt-1">
                    <button
                      class="btn btn-sm btn-link"
                      title={$_('pages.settings.updates.changelog')}
                      aria-label={$_('pages.settings.updates.changelog')}
                      on:click={() => showChangelogModal($versionInfoObj.version.changelog)}>
                      <i class="fa-regular fa-file-lines fa-lg"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-link"
                      title={$_('pages.settings.updates.copy-hash')}
                      aria-label={$_('pages.settings.updates.copy-hash')}
                      on:click={() => copyHash($versionInfoObj.version.hash)}>
                      <i class="fa-solid fa-hashtag fa-lg"></i>
                    </button>
                  </div>
                </div>
                <div class="col text-start">
                  <!-- Title & Verified & Version -->
                  <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <div class="d-flex align-items-center gap-2">
                      <h5 class="mb-0 text-truncate">
                        {$versionInfoObj.version.resourceTitle}
                      </h5>
                      {#if $versionInfoObj.version.verified}
                        <i
                          class="fa-solid fa-circle-check text-success small"
                          aria-label={$_('pages.settings.updates.verified')}></i>
                      {/if}
                      {#if $versionInfoObj.version.freemium}
                        <FreemiumBadge />
                      {/if}
                    </div>

                    <!-- Resource ID -->
                    <div class="small font-monospace">
                      {$versionInfoObj.version.resourceId}
                    </div>
                  </div>

                  <!-- Meta Info & Actions (same line, so they stay aligned) -->
                  <div class="small d-flex align-items-center gap-3 mt-3">
                    <span aria-label={$_('components.store-loading.author')}
                      ><i class="fas fa-user me-1"></i> {$versionInfoObj.version.author}</span>
                    {#if $versionInfoObj.version.size > 0}
                      <span aria-label={$_('components.store-loading.size')}
                        ><i class="fas fa-database me-1"></i>
                        {formatBytes($versionInfoObj.version.size)}</span>
                    {/if}

                    {#if $versionInfoObj.action === 'UPDATE' || $versionInfoObj.action === 'DOWNGRADE'}
                      <span class="badge text-bg-secondary ms-auto">
                        {$versionInfoObj.installed?.version || '?'}
                        <i class="fas fa-arrow-right fa-xs mx-1"></i>
                        {$versionInfoObj.version.tag}
                      </span>
                    {:else}
                      <span class="badge text-bg-secondary ms-auto"
                        >{$versionInfoObj.version.tag}</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
            <!-- Downgrade Warning inside Card Footer or Body? Let's put it below card or inside body if critical -->
          </div>

          {#if $versionInfoObj.action === 'DOWNGRADE'}
            <div class="alert alert-warning mt-3 text-start d-flex gap-2 align-items-start mb-0">
              <div class="flex-shrink-0 mt-1">
                <i class="fa-solid fa-triangle-exclamation me-2"></i>
              </div>
              <div class="small">
                <strong>{$_('components.store-loading.downgrade-warning-title')}</strong>
                <br />
                {$_('components.store-loading.downgrade-warning-description')}
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <div class="modal-footer flex-nowrap">
        <button class="btn btn-link col-6 m-0" type="button" on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-secondary col-6 m-0"
          type="button"
          class:btn-warning={$versionInfoObj?.action === 'DOWNGRADE'}
          on:click={onConfirmClick}>
          {#if $versionInfoObj?.action === 'INSTALL'}
            <i class="fa-solid fa-download me-2"></i> {$_('buttons.install')}
          {:else if $versionInfoObj?.action === 'UPDATE'}
            <i class="fa-solid fa-sync me-2"></i> {$_('buttons.update')}
          {:else if $versionInfoObj?.action === 'DOWNGRADE'}
            <i class="fa-solid fa-arrow-down me-2"></i> {$_('buttons.downgrade')}
          {:else}
            <i class="fa-solid fa-rotate-right me-2"></i> {$_('buttons.reinstall')}
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<ChangelogModal />

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const versionInfoObj = writable({ version: { resourceId: '' } });
  const type = writable('ADDON');

  let callback = (versionInfo) => {};
  let hideCallback = (versionInfo) => {};
  let modal;

  export function show(versionInfo, resourceType) {
    versionInfoObj.set(versionInfo);
    type.set(resourceType);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    modal.hide();
    hideCallback(get(versionInfoObj));
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import ChangelogModal, { show as showChangelogModal } from './ChangelogModal.svelte';
  import FreemiumBadge from '$lib/components/FreemiumBadge.svelte';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import { PANO_WEBSITE_API_URL } from '$lib/variables.js';
  import { formatBytes } from '$lib/string.util';
  import tooltip from '$lib/tooltip.util';

  async function copyHash(hash) {
    try {
      copy('sha256:' + hash);
      await showToast('components.toasts.hash-copied');
    } catch (err) {
      console.error('Failed to copy hash:', err);
      await showToast('components.toasts.hash-copy-failed');
    }
  }

  function onConfirmClick() {
    executeCallback();
  }

  function executeCallback() {
    modal.hide();
    // Assuming callback expects just the versionInfo or nothing specific, original code passed versionInfo
    callback($versionInfoObj);
  }
</script>
