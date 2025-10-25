<div class="w-100 vh-100 d-flex align-items-center blocks">
  <div class="m-auto p-3" style="max-width: 330px;">
    <div class="vstack gap-3">
      {#if !data.accountConnected}
        <div class="alert alert-danger mb-0">
          <strong>
            {$_("components.store-loading.account-not-connected")}
          </strong>
          {$_("components.store-loading.not-connected-description")}
        </div>

        <button
          class="btn btn-secondary"
          on:click={onConnectClick}
          disabled={connecting}>
          {connecting ? $_("buttons.connecting") : $_("buttons.connect")}
        </button>
      {:else if data.installingView}
        <div class="row" hidden={modalShown}>
          <div
            class="d-inline-flex rounded justify-content-start align-items-start ps-2 pt-2"
            style="height: 350px;">
            <div class="col-auto min-h-100 d-flex align-items-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden"
                  >{$_("components.store-loading.loading")}</span>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="d-flex align-items-center gap-3 border rounded p-3">
          <div
            class="d-inline-flex rounded justify-content-start align-items-start bg-primary ps-2 pt-2"
            style="width: 64px; height: 64px;">
            <img
              style="transform: rotate(-0.05turn);"
              src={base + "/assets/img/logo.svg"}
              width="auto"
              height="60"
              alt="Pano"
              title="Pano" />
          </div>

          <div
            class="spinner-border text-primary"
            role="status"
            style="width: 1.5rem; height: 1.5rem;">
            <span class="visually-hidden"
              >{$_("components.store-loading.loading")}</span>
          </div>

          <div>
            <strong>{$_("components.store-loading.store-loading")}</strong
            ><br />
            <small class="text-muted"
              >{$_("components.store-loading.please-wait")}</small>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<ConfirmInstallResourceModal />

<script context="module">
  import { redirect } from "@sveltejs/kit";

  import { base } from "$app/paths";

  export const PageTypes = Object.freeze({
    ADDON: "ADDON",
    THEME: "THEME",
  });

  const DEFAULT_ACCOUNT_NOT_CONNECTED_VIEW = false;
  const DEFAULT_INSTALLING_VIEW = false;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const back = searchParams.has("back");
    const install = searchParams.get("install");
    const fromInstall = searchParams.get("fromInstall");

    const previousPage =
      base + `/` + (pageType === PageTypes.ADDON ? "addons" : "view");

    if (back) {
      throw redirect(302, previousPage);
    }

    const failedLogin = searchParams.has("failedLogin");

    if (failedLogin) {
      throw redirect(302, previousPage + "?failedLogin");
    }

    return {
      pageType,
      accountConnected: !DEFAULT_ACCOUNT_NOT_CONNECTED_VIEW,
      installingView: DEFAULT_INSTALLING_VIEW,
      install,
      fromInstall,
    };
  }
</script>

<script>
  import { getContext, tick } from "svelte";
  import { _ } from "svelte-i18n";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { browser } from "$app/environment";

  import { PANO_WEBSITE_URL } from "$lib/variables.js";
  import ApiUtil from "$lib/api.util.js";
  import { currentLanguage } from "$lib/language.util.js";

  import ConfirmInstallResourceModal, {
    setCallback as setConfirmInstallResourceCallback,
    show as showConfirmInstallResourceModal,
    onHide as onConfirmInstallResourceModalHide,
  } from "$lib/component/modals/ConfirmInstallResourceModal.svelte";
  import { show as showInstallingResourceModal } from "$lib/component/modals/InstallingResourceModal.svelte";

  export let data;

  const showSplash = getContext("showSplash");

  let versionInfo;
  let modalShown;
  let connecting;

  async function waitSplash() {
    while ($showSplash) {
      await tick();
    }
  }

  async function waitWindow() {
    while (!window) {
      await tick();
    }
  }

  async function getStoreTokenResponse() {
    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/platform/store/authorize/token`,
    });

    if (getStoreTokenResponse.error === "PANO_NOT_CONNECTED") {
      data.accountConnected = false;

      return null;
    }

    if (getStoreTokenResponse.error === "PANO_CONNECT_FAILED") {
      await goto("?failedLogin");

      return null;
    }

    if (getStoreTokenResponse.error) {
      data.error = getStoreTokenResponse.error;

      return null;
    }

    return getStoreTokenResponse.data;
  }

  async function getVersionInfo() {
    data.installingView = true;

    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/install/store/${data.install}/info`,
    });

    if (getStoreTokenResponse.error === "PANO_NOT_CONNECTED") {
      data.accountConnected = false;

      return;
    }

    if (
      getStoreTokenResponse.error === "NOT_FOUND" ||
      getStoreTokenResponse.error === "BAD_REQUEST"
    ) {
      await goto("/error-404");

      return;
    }

    if (getStoreTokenResponse.error) {
      data.error = getStoreTokenResponse.error;

      return;
    }

    data.installingView = true;

    versionInfo = getStoreTokenResponse.data;

    modalShown = true;

    showConfirmInstallResourceModal(versionInfo);
  }

  async function goToStore(getStoreTokenResponse) {
    const { token, state } = getStoreTokenResponse;

    // Encode dynamic parts to ensure the URL is safe
    const storeAuthToken = encodeURIComponent(token);
    const encodedRedirectUrl = encodeURIComponent(
      page.url.origin + page.url.pathname,
    );
    const encodedState = encodeURIComponent(state);

    // Redirect to the constructed URL
    window.location = `${PANO_WEBSITE_URL}/auth?storeAuthorizeToken=${storeAuthToken}&panoCallback=${encodedRedirectUrl}&state=${encodedState}&type=${data.pageType}&hl=${$currentLanguage.code}`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  onConfirmInstallResourceModalHide(() => {
    goto(base + `/` + (data.pageType === PageTypes.ADDON ? "addons" : "view"));
  });

  setConfirmInstallResourceCallback(async () => {
    modalShown = false;

    await sleep(500);

    modalShown = true;

    await showInstallingResourceModal(
      data.pageType === PageTypes.ADDON ? "PLUGIN" : "THEME",
      null,
      data.install,
      async () => {
        const storeTokenResponse = await getStoreTokenResponse();

        if (storeTokenResponse === null) {
          return;
        }

        await goToStore(storeTokenResponse);
      },
    );
  });

  (async () => {
    if (!browser) {
      return;
    }

    await waitSplash();
    await waitWindow();

    await sleep(500);

    if (data.install && !data.installingView) {
      await getVersionInfo();

      return;
    }

    if (data.accountConnected && !data.installingView) {
      const storeTokenResponse = await getStoreTokenResponse();

      if (storeTokenResponse === null) {
        return;
      }

      await goToStore(storeTokenResponse);
    }
  })();

  function onConnectClick() {
    connecting = true;

    ApiUtil.post({
      path: "/api/panel/platform/code",
      handler: async (body, reject) => {
        if (body.error) {
          location.reload();
          return;
        }

        const { publicKey, state } = body;

        // Encode dynamic parts to ensure the URL is safe
        const encodedPublicKey = encodeURIComponent(publicKey);
        const encodedRedirectUrl = encodeURIComponent(
          page.url.origin + base + "/settings/platform",
        );
        const encodedState = encodeURIComponent(state);

        // Redirect to the constructed URL
        window.location = `${PANO_WEBSITE_URL}/auth?loginPanoPlatform=${encodedPublicKey}&redirectUrl=${encodedRedirectUrl}&state=${encodedState}&hl=${$currentLanguage.code}`;
      },
    });
  }
</script>
