<AddPluginModal />
<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a class="btn btn-link" role="button" href="/addons/categories" slot="left">
      <i class="fas fa-puzzle-piece me-2"></i>
      Eklenti Kategorileri
    </a>
    <a
      href="javascript:void(0);"
      class="btn btn-secondary ml-auto"
      role="button"
      slot="right"
      on:click="{showAddPluginModal}">
      <i class="fas fa-plus me-2"></i>
      Eklenti Yükle
    </a>
  </PageActions>

  <!-- All Addons -->
  <div class="card">
    <div class="card-body vstack gap-3">
      <CardHeader>
        <h5 class="card-title" slot="left">
          {data.plugins.length}
          {data.pageType === PageTypes.ACTIVE
            ? "Aktif"
            : data.pageType === PageTypes.DISABLED
              ? "Devre Dışı"
              : "Yüklü"} Eklenti
        </h5>
        <!-- Filters -->
        <CardFilters slot="right">
          <CardFiltersItem
            href="/addons/all"
            active="{data.pageType === PageTypes.ALL}">Tümü</CardFiltersItem>
          <CardFiltersItem
            href="/addons/active"
            active="{data.pageType === PageTypes.ACTIVE}"
            >Aktif</CardFiltersItem>
          <CardFiltersItem
            href="/addons/disabled"
            active="{data.pageType === PageTypes.DISABLED}"
            >Devre Dışı</CardFiltersItem>
        </CardFilters>
      </CardHeader>

      <div class="row row-cols-xl-2 row-cols-1 g-3">
        {#if data.plugins.length === 0}
          <NoContent />
        {/if}
        {#each data.plugins as plugin, index (plugin)}
          <div
            class="col {plugin.status === 'FAILED' &&
              'animate__animated animate__shakeX animate__slower'}">
            <!-- Installed Addon Card -->
            <div
              class="card border {plugin.status === 'FAILED' &&
                'border-danger border-3'}">
              <div class="card-body">
                <div class="row d-flex flex-nowrap">
                  <div class="col-auto d-md-flex d-none">
                    <a href="{base}/addons/detail/{plugin.id}">
                      <img
                        height="82"
                        width="82"
                        src="{API_URL}/panel/plugins/{plugin.id}/logo"
                        class="bg-light animate__animated animate__zoomIn"
                        alt="{plugin.id}" />
                    </a>
                  </div>
                  <div class="col">
                    <div class="row">
                      <div class="col">
                        <a href="{base}/addons/detail/{plugin.id}">
                          <h5 class="card-title">{plugin.id}</h5>
                        </a>
                      </div>
                      <div class="col-auto">
                        <div class="form-check form-switch">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="addonStatusSwitch"
                            checked="{plugin.status === 'STARTED'}"
                            disabled="{plugin.loading}"
                            on:click="{(e) => {
                              e.preventDefault();
                              onTogglePluginStateClick(plugin);
                            }}" />
                        </div>
                      </div>
                      {#if plugin.status === "FAILED"}
                        <div class="col-auto ps-0">
                          <a
                            href="#"
                            tabindex="0"
                            class="link-danger"
                            data-bs-toggle="popover"
                            data-bs-trigger="focus"
                            data-bs-custom-class="font-monospace"
                            data-bs-title="Error Log"
                            data-bs-content="{plugin.error}">
                            <i class="fa-solid fa-circle-exclamation fa-1x"></i>
                          </a>
                        </div>
                      {/if}
                    </div>
                    <small class="text-muted">
                      <a href="/" target="_blank">{plugin.author}</a>
                      <div class="vr mx-2"></div>
                      <span class="font-monospace">{plugin.version}</span>
                      {#if plugin.verifyStatus !== "UNKNOWN"}
                        <div class="vr mx-2"></div>
                        <a
                          href="https://panomc.com/addons/detail/{plugin.id}"
                          target="_blank"
                          title="Mağaza Adresi"
                          class="card-link">
                          <i class="fa-solid fa-store"></i>
                        </a>
                      {/if}
                      {#if plugin.sourceUrl}
                        <div class="vr mx-2"></div>
                        <a
                          href="{plugin.sourceUrl}"
                          target="_blank"
                          title="Kaynak Adresi"
                          class="card-link">
                          <i class="fa-solid fa-link"></i>
                        </a>
                      {/if}
                      {#if plugin.license}
                        <div class="vr mx-2"></div>
                        <span class="font-monospace">{plugin.license}</span>
                      {/if}
                      {#if plugin.verifyStatus !== "UNKNOWN"}
                        <div class="vr mx-2"></div>
                      {/if}
                      {#if plugin.verifyStatus === "VERIFIED"}
                        <span
                          class="text-success"
                          use:tooltip="{[
                            'Verified by Pano',
                            { placement: 'bottom' },
                          ]}">
                          <i class="fa-regular fa-circle-check me-1"></i>
                        </span>
                      {:else if plugin.verifyStatus === "NOT_VERIFIED"}
                        <span
                          class="text-warning"
                          use:tooltip="{[
                            'Not verified by Pano, use at your own risk!',
                            { placement: 'bottom' },
                          ]}">
                          <i class="fa-solid fa-circle-exclamation me-1"></i>
                        </span>
                      {/if}
                    </small>
                    <p class="pt-2">
                      {@html plugin.description}
                    </p>
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
  import ApiUtil from "$lib/api.util.js";

  export const PageTypes = Object.freeze({
    ALL: "ALL",
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
  });

  export const DefaultPageType = PageTypes.ALL;

  async function loadData({ request, pageType }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/plugins?status=${pageType.toUpperCase()}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          resolve(body);
        } else {
          reject(body);
        }
      });
    });
  }
  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType = DefaultPageType) {
    const { parent } = event;
    const parentData = await parent();

    pageType = pageType.toUpperCase();

    let data = {
      plugins: [],
      pageType,
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ request: event, pageType }).then((body) => {
      data = { ...data, ...body };
    });

    return data;
  }
</script>

<script>
  import { getContext } from "svelte";

  import { base } from "$app/paths";

  import { API_URL } from "$lib/variables";
  import tooltip from "$lib/tooltip.util";
  import { showNetworkErrorOnCatch } from "$lib/Store.js";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardFilters from "$lib/component/CardFilters.svelte";
  import AddPluginModal, {
    show as showAddPluginModal,
  } from "$lib/component/modals/AddPluginModal.svelte";
  import {
    show as showConfirmDisableAddonModal,
    setCallback as setCallbackConfirmDisableAddonModal,
  } from "$lib/component/modals/ConfirmDisableAddonWillCauseMoreDisableModal.svelte";
  import {
    show as showConfirmEnablingAddonModal,
    setCallback as setCallbackConfirmEnablingAddonModal,
  } from "$lib/component/modals/ConfirmEnablingAddonWillCauseMoreEnableModal.svelte";
  import EnablingAddonFailedByDependencyErrorToast from "$lib/component/toasts/EnablingAddonFailedByDependencyErrorToast.svelte";
  import FailedToEnableAddonToast from "$lib/component/toasts/FailedToEnableAddonToast.svelte";
  import NoContent from "$lib/component/NoContent.svelte";

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
    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.put({
        path: `/api/panel/plugins/${plugin.id}`,
        body: { status },
      })
        .then(async (body) => {
          if (body.result !== "ok") {
            reject(body.error);
            return;
          }

          const newPluginsData = await loadData({ pageType: data.pageType });

          data.plugins.forEach((plugin) => {
            const newPluginData = newPluginsData.plugins.find(
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

          newPluginsData.plugins.forEach((newPluginData) => {
            const pluginData = data.plugins.find(
              (plugin) => newPluginData.id === plugin.id,
            );

            if (pluginData == null) {
              data.plugins.push(newPluginData);
            }
          });

          data.plugins = data.plugins;

          if (body.status === "CREATED") {
            showToast(EnablingAddonFailedByDependencyErrorToast, {
              addon: plugin.id,
            });
          }

          if (body.status === "FAILED") {
            showToast(FailedToEnableAddonToast, {
              addon: plugin.id,
            });
          }

          callback();
          resolve();
        })
        .catch((e) => reject(e));
    });
  }
</script>
