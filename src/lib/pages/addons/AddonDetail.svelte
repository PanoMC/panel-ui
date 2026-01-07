<ConfirmRemoveAddonModal />
<ConfirmRemoveAddonWillCauseMoreUnloadModal />

<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <a slot="left" href="{base}/addons" class="btn btn-link" role="button">
      <i class="fas fa-arrow-left"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.addons')}</span>
    </a>

    <div slot="right" class="hstack gap-2">
      {#if addon.verifyStatus !== 'UNKNOWN'}
        <a
          title={$_('buttons.show-in-store')}
          aria-label={$_('buttons.show-in-store')}
          href={`${PANO_WEBSITE_URL}/addons/${addon.id}`}
          target="_blank"
          class="btn btn-link">
          <i class="fas fa-store"></i>
        </a>
      {/if}
      <button
        class="btn btn-link"
        type="button"
        on:click={onRemoveClick}
        title={$_('buttons.remove')}
        aria-label={$_('buttons.remove')}
        class:disabled={removing}>
        <i class="fas fa-trash"></i>
      </button>
      <div class="form-check form-switch m-0">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          checked={addon.status === 'STARTED'}
          disabled={addon.loading}
          on:click={(e) => {
            e.preventDefault();
            onTogglePluginStateClick();
          }} />
      </div>
    </div>
  </PageActions>

  <!-- Addon Details -->
  <div class="card">
    <div class="card-header">
      <div class="row g-3">
        <div
          class="col-auto d-flex justify-content-center align-items-start rounded-start rounded-top">
          <img
            src="/api/panel/plugins/{addon.id}/logo"
            class="img-fluid rounded"
            alt={addon.name}
            height="86"
            width="86" />
        </div>

        <div class="col">
          <h5 class="card-title" class:text-danger={addon.status === 'FAILED'}>
            {addon.name}
            <VerifiedStatus status={addon.verifyStatus} />
            {#if addon.status === 'FAILED'}
              <button
                type="button"
                aria-label={$_('buttons.error-log')}
                class="btn btn-link text-danger ps-2"
                data-bs-toggle="popover"
                data-bs-trigger="focus"
                data-bs-title={$_('buttons.error-log')}
                data-bs-content={addon.error}>
                <i class="fa-solid fa-circle-exclamation"></i>
              </button>
            {/if}
          </h5>

          {addon.description}

          <ul class="list-group mt-3">
            <li class="list-group-item">
              <strong>ID:</strong>
              <span class="user-select-all font-monospace text-break">{addon.id}</span>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.version')}:</strong>
              <span class="user-select-all font-monospace text-break">{addon.version}</span>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.pano-version')}:</strong>
              <span class="user-select-all font-monospace text-break">{addon.panoVersion}</span>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.developer')}:</strong>
              <span class="text-break">{addon.developer}</span>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.license')}:</strong>
              <span class="text-break">{addon.license || $_('pages.addon-detail.unknown')}</span>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.source')}:</strong>
              <a href={addon.sourceUrl} target="_blank" class="text-break"
                >{addon.sourceUrl || $_('pages.addon-detail.unknown')}</a>
            </li>
          </ul>

          <button
            class="btn btn-link p-0 mt-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#addonDetailsCollapse"
            aria-expanded="false"
            aria-controls="addonDetailsCollapse"
            title={$_('buttons.toggle-details')}
            aria-label={$_('buttons.toggle-details')}>
            <i class="fas fa-chevron-right me-1"></i>
            {$_('buttons.show-more-details')}
          </button>

          <div class="collapse mt-3" id="addonDetailsCollapse">
            <ul class="list-group">
              <li class="list-group-item">
                <strong>{$_('pages.addon-detail.dependencies')}:</strong>
                <span class="text-break"
                  >{@html isBlank(addon.dependencies)
                    ? '-'
                    : addon.dependencies.map((dependency) => getDependencyText(dependency))}</span>
              </li>
              <li class="list-group-item">
                <strong>{$_('pages.addon-detail.requires')}:</strong>
                <span class="text-break">{isBlank(addon.requires) ? '-' : addon.requires}</span>
              </li>
              <li class="list-group-item">
                <strong>Hash:</strong>
                <code class="overflow-auto text-break user-select-all">sha256:{addon.hash}</code>
              </li>
              <li class="list-group-item">
                <strong>{$_('pages.addon-detail.size')}:</strong>
                <span class="text-break">{formatBytes(addon.size)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="card-body">PLUGIN_CONTENT</div>
  </div>
</div>

<script context="module">
  import ApiUtil from '$lib/api.util.js';
  import { error } from '@sveltejs/kit';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const addonId = event.params.addonId;

    const body = await ApiUtil.get({
      path: `/api/panel/plugins/${addonId}`,
      request: event,
    });

    if (body.error === 'NOT_FOUND') {
      throw error(404, body.error);
    }

    return { addon: body.data };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto, invalidate } from '$app/navigation';
  import { base } from '$app/paths';

  import { formatBytes } from '$lib/string.util';
  import { PANO_WEBSITE_URL } from '$lib/variables';

  import VerifiedStatus from '$lib/component/VerifiedStatus.svelte';

  import { show as showToast } from '$lib/component/ToastContainer.svelte';

  import {
    show as showConfirmDisableAddonModal,
    setCallback as setCallbackConfirmDisableAddonModal,
  } from '$lib/component/modals/ConfirmDisableAddonWillCauseMoreDisableModal.svelte';
  import {
    show as showConfirmEnablingAddonModal,
    setCallback as setCallbackConfirmEnablingAddonModal,
  } from '$lib/component/modals/ConfirmEnablingAddonWillCauseMoreEnableModal.svelte';
  import ConfirmRemoveAddonModal, {
    show as showConfirmRemoveAddonModal,
  } from '$lib/component/modals/ConfirmRemoveAddonModal.svelte';
  import ConfirmRemoveAddonWillCauseMoreUnloadModal, {
    show as showConfirmRemoveAddonCauseMoreModal,
    setCallback as setCallbackConfirmRemoveAddonCauseMoreModal,
  } from '$lib/component/modals/ConfirmRemoveAddonWillCauseMoreUnloadModal.svelte';
  import PageActions from '$lib/component/PageActions.svelte';

  export let data;
  let addon, removing;

  $: {
    addon = data.addon;
  }

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.addon-detail.title');

  function isBlank(value) {
    return value === null || value === undefined || value.toString().trim() === '';
  }

  setCallbackConfirmDisableAddonModal((_, hideModal) => {
    togglePluginState(false, () => {
      hideModal();
    });
  });

  setCallbackConfirmEnablingAddonModal((_, hideModal) => {
    togglePluginState(true, () => {
      hideModal();
    });
  });

  setCallbackConfirmRemoveAddonCauseMoreModal((_, hideModal) => {
    removeAddon(() => {
      hideModal();
    });
  });

  function onRemoveClick() {
    if (addon.removeDependents.length > 0) {
      showConfirmRemoveAddonCauseMoreModal(addon);
      return;
    }

    showConfirmRemoveAddonModal(addon.id, () => {
      removeAddon();
    });
  }

  function removeAddon(callback = () => {}) {
    addon.removing = true;

    ApiUtil.delete({
      path: `/api/panel/plugins/${addon.id}`,
      handler: async (body, reject) => {
        if (body.result !== 'ok') {
          location.reload();

          return;
        }

        await goto(base + '/addons');

        await showToast('components.toasts.remove-addon-success');

        callback();
      },
    });
  }

  function onTogglePluginStateClick() {
    if (addon.status === 'STARTED' && addon.dependents.length > 0) {
      showConfirmDisableAddonModal(addon);
      return;
    }

    if (addon.status !== 'STARTED' && addon.notStartedDependencies.length > 0) {
      showConfirmEnablingAddonModal(addon);
      return;
    }

    togglePluginState(addon.status !== 'STARTED');
  }

  function togglePluginState(status, callback = () => {}) {
    addon.loading = true;

    ApiUtil.put({
      path: `/api/panel/plugins/${addon.id}`,
      body: { status },
      handler: async (body, reject) => {
        if (body.result !== 'ok') {
          reject(body.error);

          return;
        }

        if (body.status === 'CREATED') {
          await showToast('components.toasts.settings-save-error', {
            addon: addon.id,
          });
        }

        if (body.status === 'FAILED') {
          await showToast('components.toasts.failed-to-enable-addon-error', {
            addon: addon.id,
          });
        }

        await invalidate((_) => true);

        callback();
      },
    });
  }

  function getDependencyText(dependency) {
    let text = dependency.pluginId;

    if (dependency.pluginVersionSupport !== '*') {
      text += `@<span class="font-monospace">${dependency.pluginVersionSupport}</span>`;
    }

    if (dependency.optional) {
      text = `[${text}]`;
    }

    return text;
  }

  // Handle collapse icon rotation
  import { onMount } from 'svelte';

  onMount(() => {
    const collapseElement = document.getElementById('addonDetailsCollapse');
    const toggleButton = document.querySelector('[data-bs-target="#addonDetailsCollapse"]');
    const icon = toggleButton.querySelector('i');

    collapseElement.addEventListener('show.bs.collapse', () => {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-down');
    });

    collapseElement.addEventListener('hide.bs.collapse', () => {
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-right');
    });
  });
</script>
