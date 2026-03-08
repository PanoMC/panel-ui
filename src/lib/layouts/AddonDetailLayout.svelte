<ConfirmRemoveAddonModal />
<ConfirmRemoveAddonWillCauseMoreUnloadModal />
<AddonStartupErrorModal />

<div class="container vstack gap-3">
  {#if refreshRequired}
    <RefreshRequiredAlert />
  {/if}

  <PageActions>
    <div slot="left" class="hstack gap-3">
      <a href="{base}/addons" class="btn btn-link" role="button" aria-label={$_('buttons.addons')}>
        <i class="fas fa-arrow-left"></i>
      </a>
      {#if slots.left}
        {@render slots.left()}
      {:else}
        <PageNav>
          <PageNavItem href="/addons/detail/{data.addon.id}"
            >{$_('pages.addon-detail.overview')}</PageNavItem>
          <PageNavItem href="/addons/detail/{data.addon.id}/settings"
            >{$_('buttons.settings')}</PageNavItem>
        </PageNav>
      {/if}
    </div>

    <div slot="right" class="hstack gap-2">
      {#if slots.right}
        {@render slots.right()}
      {:else}
        <div class="hstack gap-2">
          {#if data.addon.verifyStatus !== 'UNKNOWN'}
            <a
              use:tooltip={[$_('buttons.show-in-store'), { placement: 'bottom' }]}
              aria-label={$_('buttons.show-in-store')}
              href={`${PANO_WEBSITE_URL}/addons/${data.addon.id}`}
              target="_blank"
              class="btn btn-link">
              <i class="fas fa-store"></i>
            </a>
          {/if}
          {#if data.addon.updateVersion}
            <button
              type="button"
              class="btn btn-link position-relative"
              use:tooltip={[
                $_('pages.addons.update-available') + ' (v' + data.addon.updateVersion + ')',
                { placement: 'bottom' },
              ]}
              aria-label={$_('pages.addons.update-available')}
              onclick={() => goto(`${base}/settings/updates`)}>
              <i class="fas fa-sync"></i>
              <span
                class="position-absolute top-0 start-100 translate-middle mt-2 badge rounded-pill bg-secondary p-1">
                <span class="visually-hidden">{$_('pages.addons.update-available')}</span>
              </span>
            </button>
          {/if}
          <button
            class="btn btn-link"
            type="button"
            onclick={onRemoveClick}
            use:tooltip={[$_('buttons.remove'), { placement: 'bottom' }]}
            aria-label={$_('buttons.remove')}
            class:disabled={removing}>
            <i class="fas fa-trash"></i>
          </button>
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              checked={data.addon.status === 'STARTED'}
              disabled={data.addon.loading}
              onclick={(e) => {
                e.preventDefault();
                onTogglePluginStateClick();
              }} />
          </div>
        </div>
      {/if}
    </div>
  </PageActions>

  <div class="card">
    <div class="card-body">
      <div class="row g-3">
        <div
          class="col-auto d-flex justify-content-center align-items-start rounded-start rounded-top">
          <img
            src="/api/panel/plugins/{data.addon.id}/logo"
            class="img-fluid rounded"
            alt={data.addon.name}
            height="86"
            width="86" />
        </div>

        <div class="col">
          <h5
            class="card-title d-inline-flex align-items-center gap-2 mb-2"
            class:text-danger={data.addon.status === 'FAILED'}>
            {data.addon.name}
            <VerifiedStatus status={data.addon.verifyStatus} />
            {#if data.addon.status === 'FAILED'}
              <button
                type="button"
                aria-label={$_('buttons.error-log')}
                class="btn btn-link link-danger ps-2"
                onclick={() => showAddonStartupErrorModal(data.addon.error)}>
                <i class="fa-solid fa-circle-exclamation"></i>
              </button>
            {/if}
          </h5>

          <div class="small mb-2 hstack gap-2">
            <span use:tooltip={['ID']} class="user-select-all font-monospace">{data.addon.id}</span>
            <span class="vr"></span>
            <span
              use:tooltip={[$_('pages.addon-detail.version')]}
              class="user-select-all font-monospace">
              {data.addon.version}
            </span>
            <span class="vr"></span>
            <span
              use:tooltip={[$_('pages.addon-detail.pano-version')]}
              class="user-select-all font-monospace">
              {data.addon.panoVersion}
            </span>
            <span class="vr"></span>
            <span
              class="badge {data.addon.status === 'STARTED'
                ? 'text-bg-success'
                : 'text-bg-secondary'}">
              {$_('components.addon-status-badge.' + data.addon.status, {
                default: data.addon.status,
              })}
            </span>
          </div>

          {#if data.addon.description}
            {data.addon.description}
          {/if}
        </div>
      </div>
    </div>
  </div>

  {@render children()}
</div>

<script module>
  import ApiUtilModule from '$lib/api.util.js';
  import { error } from '@sveltejs/kit';
  import { executeLifecycle, executeHookLoad } from '$lib/PluginAPI.js';
  import { setContext } from 'svelte';

  const key = 'layout-slots';

  export function initSlots() {
    const slots = $state({ right: null, left: null });
    setContext(key, slots);
    return slots;
  }

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const addonId = event.params.addonId;

    const body = await ApiUtilModule.get({
      path: `/api/panel/plugins/${addonId}`,
      request: event,
    });

    if (body.error === 'NOT_FOUND') {
      throw error(404, body.error);
    }

    // Pre-resolve hooks and their data to ensure they render simultaneously with the page
    const [globalHookProps, specificHookProps] = await Promise.all([
      executeHookLoad('panel:plugin-detail:content', event),
      executeHookLoad(`panel:plugin-detail:content:${addonId}`, event),
    ]);

    await executeLifecycle('panel:addon-detail:load', { addon: body.data }, event);

    return {
      addon: body.data,
      hookProps: {
        'panel:plugin-detail:content': globalHookProps,
        [`panel:plugin-detail:content:${addonId}`]: specificHookProps,
      },
    };
  }
</script>

<script>
  import { getContext, onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { goto, invalidateAll } from '$app/navigation';
  import { base } from '$app/paths';

  import { formatBytes } from '$lib/string.util';
  import { PANO_WEBSITE_URL } from '$lib/variables';

  import VerifiedStatus from '$lib/components/VerifiedStatus.svelte';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import {
    show as showConfirmDisableAddonModal,
    setCallback as setCallbackConfirmDisableAddonModal,
  } from '$lib/components/modals/ConfirmDisableAddonWillCauseMoreDisableModal.svelte';
  import {
    show as showConfirmEnablingAddonModal,
    setCallback as setCallbackConfirmEnablingAddonModal,
  } from '$lib/components/modals/ConfirmEnablingAddonWillCauseMoreEnableModal.svelte';
  import ConfirmRemoveAddonModal, {
    show as showConfirmRemoveAddonModal,
  } from '$lib/components/modals/ConfirmRemoveAddonModal.svelte';
  import ConfirmRemoveAddonWillCauseMoreUnloadModal, {
    show as showConfirmRemoveAddonCauseMoreModal,
    setCallback as setCallbackConfirmRemoveAddonCauseMoreModal,
  } from '$lib/components/modals/ConfirmRemoveAddonWillCauseMoreUnloadModal.svelte';
  import AddonStartupErrorModal, {
    show as showAddonStartupErrorModal,
  } from '$lib/components/modals/AddonStartupErrorModal.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
  import RefreshRequiredAlert from '$lib/components/RefreshRequiredAlert.svelte';

  let { data, children } = $props();
  const slots = initSlots();

  let removing = $state(false);
  let refreshRequired = $state(false);

  const pageTitle = getContext('pageTitle');

  $effect(() => {
    pageTitle.set(data.addon.name);
  });

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
    if (data.addon.removeDependents.length > 0) {
      showConfirmRemoveAddonCauseMoreModal(data.addon);
      return;
    }

    showConfirmRemoveAddonModal(data.addon.id, () => {
      removeAddon();
    });
  }

  function removeAddon(callback = () => {}) {
    removing = true;

    ApiUtilModule.delete({
      path: `/api/panel/plugins/${data.addon.id}`,
      handler: async (body, reject) => {
        if (body.result !== 'ok') {
          location.reload();

          return;
        }

        await goto(base + '/addons?refreshRequired=true');

        await showToast('components.toasts.remove-addon-success');

        callback();
      },
    });
  }

  function onTogglePluginStateClick() {
    if (data.addon.status === 'STARTED' && data.addon.dependents.length > 0) {
      showConfirmDisableAddonModal(data.addon);
      return;
    }

    if (data.addon.status !== 'STARTED' && data.addon.notStartedDependencies.length > 0) {
      showConfirmEnablingAddonModal(data.addon);
      return;
    }

    togglePluginState(data.addon.status !== 'STARTED');
  }

  function togglePluginState(status, callback = () => {}) {
    data.addon.loading = true;

    ApiUtilModule.put({
      path: `/api/panel/plugins/${data.addon.id}`,
      body: { status },
      handler: async (body, reject) => {
        if (body.result !== 'ok') {
          reject(body.error);

          return;
        }

        if (body.status === 'CREATED') {
          await showToast('components.toasts.settings-save-error', {
            addon: data.addon.id,
          });
        }

        if (body.status === 'FAILED') {
          await showToast('components.toasts.failed-to-enable-addon-error', {
            addon: data.addon.id,
          });
        }

        await invalidateAll();

        refreshRequired = true;
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
</script>
