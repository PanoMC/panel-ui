<InstallResourceModal />
<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none" leftClasses="d-lg-flex d-none">
    <div slot="right" class="hstack gap-2">
      <button
        type="button"
        class="btn btn-secondary ml-auto"
        on:click={() => showInstallResourceModal("PLUGIN")}>
        <i class="fas fa-plus me-2"></i>
        Eklenti Yükle
      </button>
    </div>
  </PageActions>
  <!-- All Addons -->
  <div class="card">
    <CardHeader>
      <div slot="left">
        {data.plugins.length}
        {data.pageType === PageTypes.ACTIVE
          ? "Aktif"
          : data.pageType === PageTypes.DISABLED
            ? "Devre Dışı"
            : "Yüklü"} Eklenti
      </div>
      <!-- Filters -->
      <CardFilters slot="right">
        <CardFiltersItem href="/addons" active={data.pageType === PageTypes.ALL}
          >Tümü</CardFiltersItem>
        <CardFiltersItem
          href="/addons?status=ACTIVE"
          active={data.pageType === PageTypes.ACTIVE}>Aktif</CardFiltersItem>
        <CardFiltersItem
          href="/addons?status=DISABLED"
          active={data.pageType === PageTypes.DISABLED}
          >Devre Dışı</CardFiltersItem>
      </CardFilters>
    </CardHeader>
    <div class="card-body">
        {#if data.plugins.length === 0}
          <NoContent />
        {/if}
      <div class="row row-cols-xl-2 row-cols-1 g-4">
        {#each data.plugins as plugin}
          <div class="col">
            <div class="card h-100 rounded-4 shadow-sm position-relative
        {plugin.status === 'FAILED' && 'border-danger border-2'}">

              <!-- STATUS ACTIONS -->
              <div class="position-absolute top-0 end-0 m-3 d-flex gap-2">
                {#if plugin.status === 'FAILED'}
                  <a href="#"
                     class="text-danger"
                     tabindex="0"
                     data-bs-toggle="popover"
                     data-bs-trigger="focus"
                     data-bs-title="Error Log"
                     data-bs-content={plugin.error}>
                    <i class="fa-solid fa-circle-exclamation"></i>
                  </a>
                {/if}

                {#if plugin.loading}
                  <i class="fa-solid fa-spinner fa-spin me-2"></i>
                {:else}
                  <div class="form-check form-switch m-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={plugin.status === 'STARTED'}
                      on:click={(e) => {
                  e.preventDefault();
                  onTogglePluginStateClick(plugin);
                }} />
                  </div>
                {/if}
              </div>

              <div class="card-body d-flex flex-column gap-3">
                <div class="d-flex gap-3">
                  <a href="{base}/addons/detail/{plugin.id}">
                    <img
                      src="/api/panel/plugins/{plugin.id}/logo"
                      class="rounded-3 bg-light p-2"
                      width="72"
                      height="72"
                      alt={plugin.name} />
                  </a>
                  <div class="flex-grow-1">
                    <a href="{base}/addons/detail/{plugin.id}" class="text-decoration-none">
                      <h5 class="card-title mb-1 text-truncate">
                        {plugin.name}
                        <VerifiedStatus status="{plugin.verifyStatus}" />
                      </h5>
                    </a>
                    <small class="text-muted">{plugin.developer}</small>
                  </div>
                </div>

                <div class="small flex-grow-1">{@html plugin.description}</div>

                <div class="d-flex flex-wrap gap-3 small text-muted">
                  <span class="font-monospace">{plugin.version}</span>
                  {#if plugin.license}<span>{plugin.license}</span>{/if}
                  {#if plugin.verifyStatus !== 'UNKNOWN'}
                    <a href="{PANO_WEBSITE_URL}/{plugin.id}" target="_blank"><i class="fa-solid fa-store"></i></a>
                  {/if}
                  {#if plugin.sourceUrl}
                    <a href={plugin.sourceUrl} target="_blank"><i class="fa-solid fa-link"></i></a>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

    </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  export const PageTypes = Object.freeze({
    ALL: "ALL",
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
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

    const status = searchParams.get("status") || DefaultPageType;

    if (!Object.values(PageTypes).includes(status)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    const queryParams = buildQueryParams({ status });
    const body = await ApiUtil.get({
      path: `/api/panel/plugins` + queryParams,
      request: event,
    });

    if (body.error) {
      throw error(500, body);
    }

    return { plugins: body.data, pageType: status };
  }
</script>

<script>
  import { getContext } from "svelte";

  import { base } from "$app/paths";

  import { PANO_WEBSITE_URL } from "$lib/variables";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardFilters from "$lib/component/CardFilters.svelte";
  import InstallResourceModal, {
    show as showInstallResourceModal,
  } from "$lib/component/modals/InstallResourceModal.svelte";
  import {
    show as showConfirmDisableAddonModal,
    setCallback as setCallbackConfirmDisableAddonModal,
  } from "$lib/component/modals/ConfirmDisableAddonWillCauseMoreDisableModal.svelte";
  import {
    show as showConfirmEnablingAddonModal,
    setCallback as setCallbackConfirmEnablingAddonModal,
  } from "$lib/component/modals/ConfirmEnablingAddonWillCauseMoreEnableModal.svelte";

  import NoContent from "$lib/component/NoContent.svelte";
  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Eklentiler");

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
    if (plugin.status === "STARTED" && plugin.dependents.length > 0) {
      showConfirmDisableAddonModal(plugin);
      return;
    }

    if (
      plugin.status !== "STARTED" &&
      plugin.notStartedDependencies.length > 0
    ) {
      showConfirmEnablingAddonModal(plugin);
      return;
    }

    togglePluginState(plugin, plugin.status !== "STARTED");
  }

  function togglePluginState(plugin, status, callback = () => {}) {
    plugin.loading = true;

    ApiUtil.put({
      path: `/api/panel/plugins/${plugin.id}`,
      body: { status },
      handler: async (body, reject) => {
        if (body.error) {
          reject(body.error);

          return;
        }

        const queryParams = buildQueryParams({ status: data.pageType });
        const newPluginsData = await ApiUtil.get({
          path: `/api/panel/plugins` + queryParams,
        });

        data.plugins.forEach((plugin) => {
          const newPluginData = newPluginsData.data.find(
            (newPluginData) => newPluginData.id === plugin.id,
          );

          if (newPluginData == null) {
            data.plugins = data.plugins.filter(
              (filterPlugin) => filterPlugin.id !== plugin.id,
            );
          } else {
            Object.keys(newPluginData).forEach((key) => {
              plugin[key] = newPluginData[key];
            });
          }
        });

        newPluginsData.data.forEach((newPluginData) => {
          const pluginData = data.plugins.find(
            (plugin) => newPluginData.id === plugin.id,
          );

          if (pluginData == null) {
            data.plugins.push(newPluginData);
          }
        });

        data.plugins = data.plugins;

        if (body.status === "CREATED") {
          await showToast("components.toasts.settings-save-error", {
            addon: plugin.id,
          });
        }

        if (body.status === "FAILED") {
          await showToast("components.toasts.failed-to-enable-addon-error", {
            addon: plugin.id,
          });
        }

        plugin.loading = false;
        data.plugins = data.plugins

        callback();
      },
    });
  }
</script>
