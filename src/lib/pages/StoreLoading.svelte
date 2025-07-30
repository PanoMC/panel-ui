
<div class="w-100 vh-100 d-flex align-items-center blocks">
  <div class="m-auto p-3" style="max-width: 330px;">
    <div class="vstack gap-3">
      {#if !data.accountConnected}
        Account not connected!
      {:else if data.confirmView && !DEFAULT_INSTALLING_VIEW}
        <div class="row" hidden="{modalShown}">
          <div
            class="d-inline-flex rounded justify-content-start align-items-start ps-2 pt-2"
            style="height: 350px;">
            <div class="col-auto min-h-100 d-flex align-items-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      {:else if data.installingView}
        <div class="row">
          <div class="card shadow-sm p-3 mb-4" style="max-width: 360px;">
            <h6 class="mb-3">Installing {versionInfo.version.type}...</h6>
            <ul class="list-group list-group-flush">
              {#each processes as process, index (process)}
                <li class="list-group-item d-flex align-items-center {getProcessClasses(installingStep, installError, index + 1)}">
                  <i class="{getIconClasses(installingStep, installError, index + 1)} me-2" ></i> {process}
                </li>
              {/each}
            </ul>
          </div>
          {#if installError}
            <div class="d-flex justify-content-between w-full">
              <button on:click="{() => goto(`${base}/${(data.pageType === PageTypes.ADDON ? 'addons' : 'view')}`)}" class="btn btn-sm btn-outline-secondary">
                <i class="fas fa-arrow-left me-1"></i> Geri
              </button>
              <button on:click="{() => goto(`${base}/${(data.pageType === PageTypes.ADDON ? 'addons' : 'view')}/store`, {invalidateAll:true})}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-store me-1"></i> Mağaza
              </button>
            </div>
          {/if}

          {#if installingStep === 6}
            <button on:click="{() => goto(`${base}/${(data.pageType === PageTypes.ADDON ? 'addons' : 'view')}`, {invalidateAll:true})}" class="btn btn-sm btn-outline-secondary">
              <i class="fas fa-arrow-left me-1"></i> Geri Dön
            </button>
          {/if}

          {#if installError}
            <div class="alert alert-danger mt-3 mb-0 py-2 px-3" role="alert" style="font-size: 0.9rem;">
              Hata oluştu: {installError}
            </div>
          {/if}
        </div>
      {:else}
        <div
        class="d-inline-flex rounded justify-content-start align-items-start bg-primary ps-2 pt-2"
        style="width: 64px; height: 64px;">
        <img
          style="transform: rotate(-0.05turn);"
          src={base + '/assets/img/logo.svg'}
          width="auto"
          height="60"
          alt="Pano"
          title="Pano" />
        </div>

        <div class="row">
          <div class="col-auto min-h-100 d-flex align-items-center">
            <div class="spinner-border text-primary spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div class="col">
            <p class="text-muted mb-0">
              Store loading for {data.pageType}
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<ConfirmInstallResourceModal/>

<script context="module">
  import { redirect } from "@sveltejs/kit";

  import { base } from "$app/paths";

  export const PageTypes = Object.freeze({
    ADDON: "ADDON",
    THEME: "THEME"
  });

  const DEFAULT_ACCOUNT_NOT_CONNECTED_VIEW = false;
  const DEFAULT_CONFIRM_VIEW = false;
  const DEFAULT_INSTALLING_VIEW = false;
  const DEFAULT_INSTALL_FINISHED_VIEW = false;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType) {
    const { parent, url: { searchParams }, } = event;
    await parent();

    const back = searchParams.has("back")
    const install = searchParams.get("install");

    const previousPage = base + `/` + (pageType === PageTypes.ADDON ? 'addons' : 'view')

    if (back) {
      throw redirect(302, previousPage);
    }

    const failedLogin = searchParams.has("failedLogin")

    if (failedLogin) {
      throw redirect(302, previousPage + "?failedLogin");
    }

    return {
      pageType,
      accountConnected: !DEFAULT_ACCOUNT_NOT_CONNECTED_VIEW,
      confirmView: DEFAULT_CONFIRM_VIEW || install,
      installingView: DEFAULT_INSTALLING_VIEW,
      install
    };
  }
</script>

<script>
  import { getContext, tick } from "svelte";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { browser } from "$app/environment";

  import { PANO_WEBSITE_URL } from "$lib/variables.js";
  import ApiUtil from "$lib/api.util.js";
  import ConfirmInstallResourceModal, {
    setCallback as setConfirmInstallResourceCallback,
    show as showConfirmInstallResourceModal,
    onHide as onConfirmInstallResourceModalHide,
  } from "$lib/component/modals/ConfirmInstallResourceModal.svelte";

  export let data;

  const showSplash = getContext("showSplash")

  const installingClasses = 'fas fa-spinner fa-spin'
  const awaitingClasses = 'far fa-clock'
  const successClasses = 'fas fa-check'
  const errorClasses = 'fas fa-times'

  const processes = [
    "Getting version info...",
    "Downloading file...",
    "Preparing...",
    "Installing...",
    "Done!"
  ]

  let installingStep = DEFAULT_INSTALL_FINISHED_VIEW ? 6 : 1;
  let installError;
  let versionInfo;
  let modalShown;

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

  function getProcessClasses(installingStep, installError, step) {
    return installingStep === step ? (installError ? 'text-danger' : 'text-primary') : installingStep > step ? 'text-success' : "text-muted"
  }

  function getIconClasses(installingStep, installError, step) {
    return installingStep === step ? (installError ? errorClasses : installingClasses) : installingStep > step ? successClasses : awaitingClasses
  }

  async function getStoreTokenResponse() {
    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/platform/store/authorize/token`
    });

    if (getStoreTokenResponse.error === "PANO_NOT_CONNECTED") {
      data.accountConnected = false;

      return null;
    }

    if (getStoreTokenResponse.error) {
      data.error = getStoreTokenResponse.error

      return null;
    }

    return getStoreTokenResponse.data
  }

  async function getVersionInfo() {
    data.confirmView = true;

    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/install/store/${data.install}/info`
    });

    if (getStoreTokenResponse.error === "PANO_NOT_CONNECTED") {
      data.accountConnected = false;

      return;
    }

    if (getStoreTokenResponse.error === "NOT_FOUND" || getStoreTokenResponse.error === "BAD_REQUEST") {
      await goto("/error-404")

      return;
    }

    if (getStoreTokenResponse.error) {
      data.error = getStoreTokenResponse.error

      return;
    }

    data.installingView = true;

    versionInfo = getStoreTokenResponse.data

    modalShown = true

    showConfirmInstallResourceModal(versionInfo)
  }

  function handleSSEMessage(message) {
    if (message.result === "ok") {
      installingStep++;

      if (installingStep === 5) {
        installingStep = 6;
      }
    } else {
      installError = message.error
      console.error(message.error, message.message)
    }
  }

  async function installResourceFromStore() {
    data.confirmView = false;
    data.installingView = true;

    const eventSource = new EventSource(`/api/panel/install/store/${data.install}/stream`);

    eventSource.onmessage = (event) => {
      handleSSEMessage(JSON.parse(event.data))
    };

    eventSource.onerror = () => {
      eventSource.close()
    };
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
    window.location = `${PANO_WEBSITE_URL}/auth?storeAuthorizeToken=${storeAuthToken}&panoCallback=${encodedRedirectUrl}&state=${encodedState}&type=${data.pageType}`;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onConfirmInstallResourceModalHide(() => {
    goto(base + `/` + (data.pageType === PageTypes.ADDON ? 'addons' : 'view'))
  });

  setConfirmInstallResourceCallback(async () => {
    if (DEFAULT_INSTALL_FINISHED_VIEW) {
      return;
    }
    modalShown = false;

    await sleep(500)


    await installResourceFromStore()
  });

  (async () => {
    if (!browser) {
      return
    }

    await waitSplash()
    await waitWindow()

    await sleep(500)

    if (data.install && !data.installingView) {
      await getVersionInfo()

      return
    }

    if (data.accountConnected && !data.installingView && !data.confirmView) {
      const storeTokenResponse = await getStoreTokenResponse()

      if (storeTokenResponse === null) {
        return
      }

      await goToStore(storeTokenResponse)
    }
  })();
</script>