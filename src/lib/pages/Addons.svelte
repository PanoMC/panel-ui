<InstallResourceModal />
<div class="container vstack gap-3">
  {#if data.failedLogin}
    <FailedLoginPanoStoreAlert />
  {/if}
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none" leftClasses="d-lg-flex d-none">
    <div slot="right" class="hstack gap-2">
      <button
        type="button"
        class="btn btn-secondary"
        on:click={() => showInstallResourceModal("PLUGIN")}>
        <i class="fas fa-plus"></i>
        <span class="d-lg-inline d-none ms-2"
          >{$_("buttons.install-addon")}</span>
      </button>
    </div>
  </PageActions>
  <!-- All Addons -->
  <div class="card">
    <CardHeader>
      <div slot="left">
        {data.pageType === PageTypes.ACTIVE
          ? $_("pages.addons.card-title.active", {
              values: { amount: data.plugins.length },
            })
          : data.pageType === PageTypes.DISABLED
            ? $_("pages.addons.card-title.inactive", {
                values: { amount: data.plugins.length },
              })
            : $_("pages.addons.card-title.installed", {
                values: { amount: data.plugins.length },
              })}
      </div>
      <!-- Filters -->
      <CardFilters slot="right">
        <CardFiltersItem href="/addons" active={data.pageType === PageTypes.ALL}
          >{$_("buttons.all")}</CardFiltersItem>
        <CardFiltersItem
          href="/addons?status=ACTIVE"
          active={data.pageType === PageTypes.ACTIVE}
          >{$_("buttons.active")}</CardFiltersItem>
        <CardFiltersItem
          href="/addons?status=DISABLED"
          active={data.pageType === PageTypes.DISABLED}
          >{$_("buttons.disabled")}</CardFiltersItem>
      </CardFilters>
    </CardHeader>
    <div class="card-body">
      {#if data.plugins.length === 0}
        <NoContent />
      {/if}
      <div class="row row-cols-xl-2 row-cols-1 g-3">
        {#each data.plugins as plugin}
          <div class="col">
            <div
              class="card h-100 position-relative
        {plugin.status === 'FAILED' && 'border-danger border-2'}">
              <!-- STATUS ACTIONS -->
              <div class="position-absolute top-0 end-0 m-3 d-flex gap-2">
                {#if plugin.status === "FAILED"}
                  <button
                    type="button"
                    aria-label={$_("buttons.error-log")}
                    class="btn btn-link text-danger p-0 me-2"
                    data-bs-toggle="popover"
                    data-bs-trigger="focus"
                    data-bs-title={$_("buttons.error-log")}
                    data-bs-content={plugin.error}>
                    <i class="fa-solid fa-circle-exclamation"></i>
                  </button>
                {/if}

                {#if plugin.loading}
                  <i class="fa-solid fa-spinner fa-spin me-2"></i>
                {:else}
                  <div class="form-check form-switch m-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={plugin.status === "STARTED"}
                      on:click={(e) => {
                        e.preventDefault();
                        onTogglePluginStateClick(plugin);
                      }} />
                  </div>
                {/if}
              </div>

              <div class="card-body d-flex flex-column">
                <div class="row g-3">
                  <div class="col-auto vstack gap-2">
                    <a
                      href="{base}/addons/detail/{plugin.id}"
                      class="text-decoration-none">
                      <img
                        src="/api/panel/plugins/{plugin.id}/logo"
                        class="rounded"
                        width="64"
                        height="64"
                        alt={plugin.name} />
                    </a>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <a
                        href="{base}/addons/detail/{plugin.id}"
                        class="text-decoration-none">
                        <h5 class="text-truncate word-break mb-0">
                          {plugin.name}
                        </h5>
                      </a>
                      <VerifiedStatus status={plugin.verifyStatus} />
                      <div>
                        by <span class="fw-bolder">{plugin.developer}</span>
                      </div>
                    </div>

                    <small class="d-block mb-3">
                      {@html plugin.description}</small>

                    <div
                      class="small hstack gap-2"
                      title={$_("pages.addons.version")}>
                      <i class="fa fa-code-branch"></i>
                      <div class="font-monospace user-select-all">
                        {plugin.version}
                      </div>
                    </div>
                  </div>
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
    const failedLogin = searchParams.has("failedLogin");

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

    return { plugins: body.data, pageType: status, failedLogin };
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

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
  import FailedLoginPanoStoreAlert from "$lib/component/FailedLoginPanoStoreAlert.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.addons.title");

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
    data.plugins = data.plugins;

    ApiUtil.put({
      path: `/api/panel/plugins/${plugin.id}`,
      body: { status },
      handler: async (body, reject) => {
        if (body.result !== "ok") {
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
        data.plugins = data.plugins;

        callback();
      },
    });
  }
</script>
