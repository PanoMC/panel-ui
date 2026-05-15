<InstallResourceModal />
<AddonStartupErrorModal />
<ConfirmActionModal />
<div class="container vstack gap-3">
  {#if data.failedLogin}
    <FailedLoginPanoStoreAlert />
  {/if}
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none" leftClasses="d-lg-flex d-none">
    <div slot="right" class="hstack gap-2">
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-link"
          aria-label={$_('buttons.enable-all-addons')}
          title={$_('buttons.enable-all-addons')}
          on:click={enableAllAddons}
          disabled={data.plugins.every((p) => p.status === 'STARTED')}>
          <i class="fa-solid fa-play"></i>
        </button>
        <button
          type="button"
          class="btn btn-link link-danger"
          aria-label={$_('buttons.disable-all-addons')}
          title={$_('buttons.disable-all-addons')}
          on:click={disableAllAddons}
          disabled={data.plugins.every((p) => p.status !== 'STARTED')}>
          <i class="fa-solid fa-stop"></i>
        </button>
      </div>

      <button
        type="button"
        class="btn btn-secondary"
        on:click={() => showInstallResourceModal('PLUGIN')}>
        <i class="fas fa-plus"></i>
        <span class="d-lg-inline d-none ms-2">{$_('buttons.install-addon')}</span>
      </button>
    </div>
  </PageActions>
  <!-- All Addons -->
  <div class="card">
    <CardHeader>
      <div slot="left">
        {data.pageType === PageTypes.LICENSE_ISSUES
          ? $_('pages.addons.card-title.license-issues', {
              values: { amount: data.plugins.length },
            })
          : data.pageType === PageTypes.ACTIVE
            ? $_('pages.addons.card-title.active', {
                values: { amount: data.plugins.length },
              })
            : data.pageType === PageTypes.DISABLED
              ? $_('pages.addons.card-title.inactive', {
                  values: { amount: data.plugins.length },
                })
              : $_('pages.addons.card-title.installed', {
                  values: { amount: data.plugins.length },
                })}
      </div>
      <div slot="middle" style="width: 250px;">
        <SearchInput
          initialValue={search}
          searching={isSearching}
          debounceMs={500}
          on:change={onSearchInput} />
      </div>
      <!-- Filters -->
      <CardFilters slot="right">
        <CardFiltersItem href="/addons" active={data.pageType === PageTypes.ALL}
          >{$_('buttons.all')}</CardFiltersItem>
        <CardFiltersItem href="/addons?status=ACTIVE" active={data.pageType === PageTypes.ACTIVE}
          >{$_('buttons.active')}</CardFiltersItem>
        <CardFiltersItem
          href="/addons?status=DISABLED"
          active={data.pageType === PageTypes.DISABLED}>{$_('buttons.disabled')}</CardFiltersItem>
        <CardFiltersItem
          href="/addons?status=LICENSE_ISSUES"
          active={data.pageType === PageTypes.LICENSE_ISSUES}
          >{$_('buttons.license-issues')}</CardFiltersItem>
      </CardFilters>
    </CardHeader>
    <div class="card-body">
      {#if data.plugins.length === 0}
        <NoContent />
      {/if}
      <div class="row row-cols-xl-2 row-cols-1 g-3">
        {#each data.plugins as plugin}
          <div class="col">
            <div class="card h-100 position-relative {cardBorderClass(plugin)}">
              <!-- STATUS ACTIONS -->
              <div class="position-absolute top-0 end-0 m-2 d-flex align-items-center gap-2">
                {#if plugin.status === 'FAILED' && !isAddonLicenseStartupBlocked(plugin)}
                  <button
                    type="button"
                    aria-label={$_('buttons.error-log')}
                    class="btn btn-link link-danger"
                    on:click={() => showAddonStartupErrorModal(plugin.error)}>
                    <i class="fa-solid fa-circle-exclamation"></i>
                  </button>
                {/if}
                {#if isAddonLicenseStartupBlocked(plugin) && plugin.purchaseUrl}
                  <a
                    href={plugin.purchaseUrl}
                    target="_blank"
                    rel="noopener"
                    class="btn btn-sm btn-warning"
                    title={buyAddonOnMarketLabel}
                    aria-label={buyAddonOnMarketLabel}>
                    <i class="fa-solid fa-store"></i>
                  </a>
                {/if}

                {#if plugin.loading}
                  <i class="fa-solid fa-spinner fa-spin me-2"></i>
                {:else}
                  {#if plugin.updateVersion}
                    <button
                      type="button"
                      class="btn btn-link"
                      title={$_('pages.addons.update-available') + ' (v' + plugin.updateVersion + ')'}
                      aria-label={$_('pages.addons.update-available')}
                      on:click={(e) => {
                        e.preventDefault();
                        goto(`${base}/settings/updates`);
                      }}>
                      <i class="fas fa-sync"></i>
                    </button>
                  {/if}
                  <AddonSettingsButton {plugin} />
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={plugin.status === 'STARTED'}
                      disabled={plugin.loading ||
                        (plugin.status !== 'STARTED' &&
                          isPremiumAddonEnableBlockedByLicense(plugin))}
                      on:click={(e) => {
                        e.preventDefault();
                        onTogglePluginStateClick(plugin);
                      }} />
                  </div>
                {/if}
              </div>

              <div class="card-body">
                <a
                  href="{base}/addons/detail/{plugin.id}"
                  class="text-decoration-none rounded focus-ring mb-2">
                  <img
                    src="/api/panel/plugins/{plugin.id}/logo"
                    class="rounded mb-2"
                    width="64"
                    height="64"
                    alt={plugin.name} />
                </a>
                <a
                  href="{base}/addons/detail/{plugin.id}"
                  class="text-decoration-none focus-ring rounded d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <h5 class="text-truncate mb-0">
                    {plugin.name}
                  </h5>

                  <VerifiedStatus status={plugin.verifyStatus} />
                  {#if plugin.premium}
                    <LicenseStatusBadge status={plugin.licenseStatus} />
                  {/if}
                </a>

                <small class="d-block mb-2"> {@html plugin.description}</small>

                <small class="font-monospace user-select-all">
                  {plugin.version}
                </small>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { ADDON_LICENSE_ISSUE_STATUSES } from '$lib/addon-license-issue.util.js';
  import { error } from '@sveltejs/kit';

  export const PageTypes = Object.freeze({
    ALL: 'ALL',
    ACTIVE: 'ACTIVE',
    DISABLED: 'DISABLED',
    LICENSE_ISSUES: 'LICENSE_ISSUES',
  });

  export const DefaultPageType = PageTypes.ALL;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const status = searchParams.get('status') || DefaultPageType;
    const search = searchParams.get('search');
    const failedLogin = searchParams.has('failedLogin');

    if (!Object.values(PageTypes).includes(status)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    // The host doesn't filter by LICENSE_ISSUES server-side, so we ask for ALL and
    // narrow client-side. Plugin counts are typically tiny, so this is fine.
    const serverStatus = status === PageTypes.LICENSE_ISSUES ? PageTypes.ALL : status;
    const queryParams = buildQueryParams({ status: serverStatus, search });
    const body = await ApiUtil.get({
      path: `/api/panel/plugins` + queryParams,
      request: event,
    });

    if (body.error) {
      throw error(500, body);
    }

    let plugins = body.data;
    if (status === PageTypes.LICENSE_ISSUES) {
      plugins = plugins.filter((p) => p.premium && ADDON_LICENSE_ISSUE_STATUSES.has(p.licenseStatus));
    }

    return { plugins, pageType: status, failedLogin };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import PageActions from '$lib/components/PageActions.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import InstallResourceModal, {
    show as showInstallResourceModal,
  } from '$lib/components/modals/InstallResourceModal.svelte';
  import AddonStartupErrorModal, {
    show as showAddonStartupErrorModal,
  } from '$lib/components/modals/AddonStartupErrorModal.svelte';
  import {
    show as showConfirmDisableAddonModal,
    setCallback as setCallbackConfirmDisableAddonModal,
  } from '$lib/components/modals/ConfirmDisableAddonWillCauseMoreDisableModal.svelte';
  import {
    show as showConfirmEnablingAddonModal,
    setCallback as setCallbackConfirmEnablingAddonModal,
  } from '$lib/components/modals/ConfirmEnablingAddonWillCauseMoreEnableModal.svelte';
  import ConfirmActionModal, {
    show as showConfirmActionModal,
  } from '$lib/components/modals/ConfirmActionModal.svelte';

  import NoContent from '$lib/components/NoContent.svelte';
  import VerifiedStatus from '$lib/components/VerifiedStatus.svelte';
  import LicenseStatusBadge from '$lib/components/LicenseStatusBadge.svelte';
  import FailedLoginPanoStoreAlert from '$lib/components/FailedLoginPanoStoreAlert.svelte';
  import { isAddonLicenseStartupBlocked, isPremiumAddonEnableBlockedByLicense } from '$lib/addon-license-issue.util.js';

  import SearchInput from '$lib/components/SearchInput.svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { panoApiClient } from '$lib/PluginAPI.js';
  import AddonSettingsButton from '$lib/pages/addons/AddonSettingsButton.svelte';

  export let data;
  let search = '';
  let isSearching = false;

  $: buyAddonOnMarketLabel = $_('buttons.buy-addon-on-market', {
    values: { website: websiteDisplayHost() },
  });

  /**
   * Strong borders only for real failures / integrity issues.
   * Missing or unverified commercial license is conveyed via the key badge + store link, not card chrome.
   */
  function cardBorderClass(plugin) {
    const failedNonLicense =
      plugin.status === 'FAILED' && !isAddonLicenseStartupBlocked(plugin);
    if (!plugin.premium) {
      return failedNonLicense ? 'border-danger border-2' : '';
    }

    switch (plugin.licenseStatus) {
      case 'VERSION_MISMATCH':
      case 'AUDIENCE_MISMATCH':
      case 'PLATFORM_MISMATCH':
        return 'border-danger border-2';
      case 'NO_PURCHASE':
      case 'MISSING':
      case 'JAR_TAMPERED':
      case 'SIGNATURE_INVALID':
      case 'EXPIRED':
      case 'NOT_CONNECTED':
      case 'NEEDS_REFRESH':
      case 'NETWORK_ERROR':
        return failedNonLicense ? 'border-danger border-2' : '';
      default:
        return failedNonLicense ? 'border-danger border-2' : '';
    }
  }

  function onSearchInput(event) {
    search = event.detail.value;
    refreshData();
  }

  async function refreshData() {
    isSearching = true;
    const queryParams = buildQueryParams({
      status: data.pageType,
      search: search || undefined,
    });

    await goto(`${base}/addons${queryParams}`, { invalidateAll: true, keepFocus: true });
    isSearching = false;
  }

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.addons.title');

  setCallbackConfirmDisableAddonModal((plugin, hideModal) => {
    togglePluginState(plugin, false, () => {
      hideModal();
    });
  });

  setCallbackConfirmEnablingAddonModal((plugin, hideModal) => {
    togglePluginState(plugin, true, () => {
      hideModal();
    });
  });

  function onTogglePluginStateClick(plugin) {
    const turningOn = plugin.status !== 'STARTED';
    if (turningOn && isPremiumAddonEnableBlockedByLicense(plugin)) {
      showToast('components.toasts.addon-license-startup-blocked', {
        addon: plugin.id,
      });
      return;
    }

    if (plugin.status === 'STARTED' && plugin.dependents.length > 0) {
      showConfirmDisableAddonModal(plugin);
      return;
    }

    if (plugin.status !== 'STARTED' && plugin.notStartedDependencies.length > 0) {
      showConfirmEnablingAddonModal(plugin);
      return;
    }

    togglePluginState(plugin, plugin.status !== 'STARTED');
  }

  function togglePluginState(plugin, status, callback = () => {}) {
    if (status && isPremiumAddonEnableBlockedByLicense(plugin)) {
      showToast('components.toasts.addon-license-startup-blocked', {
        addon: plugin.id,
      });
      callback();
      return;
    }

    plugin.loading = true;
    data.plugins = data.plugins;

    ApiUtil.put({
      path: `/api/panel/plugins/${plugin.id}`,
      body: { status },
      handler: async (body, reject) => {
        try {
          if (body.result !== 'ok') {
            reject(body.error);

            return;
          }

          await invalidateAll();

          if (body.status === 'CREATED') {
            await showToast('components.toasts.settings-save-error', {
              addon: plugin.id,
            });
          }

          if (body.status === 'FAILED') {
            await showToast(
              body.startupBlockedByLicense
                ? 'components.toasts.addon-license-startup-blocked'
                : 'components.toasts.failed-to-enable-addon-error',
              {
                addon: plugin.id,
              },
            );
          }

          callback();
        } finally {
          plugin.loading = false;
          data.plugins = data.plugins;
        }
      },
    });
  }

  async function disableAllAddons() {
    const activePlugins = data.plugins.filter((p) => p.status === 'STARTED');
    if (activePlugins.length === 0) return;

    showConfirmActionModal('pages.addons.disable-all-confirm', async () => {
      for (const plugin of activePlugins) {
        plugin.loading = true;
      }
      data.plugins = data.plugins;

      await Promise.all(
        activePlugins.map(
          (plugin) =>
            new Promise((resolve) => {
              ApiUtil.put({
                path: `/api/panel/plugins/${plugin.id}`,
                body: { status: false },
                handler: (body) => resolve(body),
              });
            }),
        ),
      );

      await refreshData();
    });
  }

  async function enableAllAddons() {
    const inactivePlugins = data.plugins.filter(
      (p) => p.status !== 'STARTED' && !isPremiumAddonEnableBlockedByLicense(p),
    );
    if (inactivePlugins.length === 0) return;

    showConfirmActionModal('pages.addons.enable-all-confirm', async () => {
      for (const plugin of inactivePlugins) {
        plugin.loading = true;
      }
      data.plugins = data.plugins;

      await Promise.all(
        inactivePlugins.map(
          (plugin) =>
            new Promise((resolve) => {
              ApiUtil.put({
                path: `/api/panel/plugins/${plugin.id}`,
                body: { status: true },
                handler: (body) => resolve(body),
              });
            }),
        ),
      );

      await refreshData();
    });
  }
</script>
