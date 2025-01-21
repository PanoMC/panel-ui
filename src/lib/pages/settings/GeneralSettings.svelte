
{#if !data.panoAccount && data.platformConnectFailed}
  <!-- Error Alert -->
  <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
    <button
      type="button"
      class="btn-close"
      data-bs-dismiss="alert"
      aria-label="Close"></button
    >Connecting your Pano account has been failed! Try again.
  </div>
{/if}

<!-- General Settings Sub Page -->
<div class="card">
  <div class="card-body animate__animated animate__fadeIn">
    <h5 class="card-title">Hesap</h5>
    {#if data.panoAccount}
      <div class="row mb-3">
        <label class="col-md-4" for="platformId"> Platform ID: </label>
        <div class="col" id="platformId">{data.panoAccount.platformId}</div>
      </div>

      <div class="row mb-3">
        <label class="col-md-4" for="panoAccountUsername"> Yönetici: </label>
        <div class="col" id="panoAccountUsername">
          <a href="{PANO_WEBSITE_URL + '/users/' + data.panoAccount.username}" title="{$_('components.player-row.view')}" target="_blank">
            <img
              src="https://minotar.net/avatar/{data.panoAccount.username}"
              width="20"
              height="20"
              class="rounded-circle animate__animated animate__zoomIn me-2"
              alt="Butlu" />{data.panoAccount.username}</a>
        </div>
      </div>
    {/if}

    <div class="row mb-3">
      <label class="col-md-4" for="connectPanoAccount">Pano Hesabı: </label>
      <div class="col" id="connectPanoAccount">
        {#if data.panoAccount}
          <span class="text-muted">{maskEmail(data.panoAccount.email)}</span>
          <button type="button" class="btn btn-sm btn-outline-danger lh-base mx-4" on:click={onDisconnectClick} disabled="{disconnecting}">Kaldır</button>
        {:else}
          <button type="button" class="btn btn-sm btn-outline-primary lh-base" on:click="{onConnectClick}" disabled="{connecting}">
            <img
              src="{base}/assets/img/logo.svg"
              width="20"
              height="20"
              class="me-2 bg-dark p-1 rounded"
              alt="Pano"/>

            {connecting ? "Bağlanıyor..." : "Bağla"}

            {#if connecting}
              <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
            {/if}
          </button>
          {/if}
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-body animate__animated animate__fadeIn">
    <h5 class="card-title">
      {$_("pages.settings.platform.preferences")}
    </h5>
    <div class="row mb-3">
      <label class="col-md-4" for="platformDevMode"> Geliştirici Modu: </label>
      <div class="col">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="platformDevMode" />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-4 col-form-label" for="platformLanguage">
        {$_("pages.settings.platform.display-language")}
      </label>
      <div class="col-md-4">
        <select
          class="form-control"
          id="platformLanguage"
          bind:value="{data.locale}">
          {#each Object.keys(Languages) as language, index (language)}
            <option value="{Languages[language].locale}"
              >{Languages[language].name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-4 col-form-label" for="updatePeriod">
        {$_("pages.settings.platform.check-auto-updates")}
      </label>
      <div class="col-md-4">
        <select
          class="form-control"
          bind:value="{data.updatePeriod}"
          id="updatePeriod">
          <option value="{UpdatePeriod.NEVER}"
            >{$_(
              "pages.settings.platform.inputs.check-auto-updates.never",
            )}</option>
          <option value="{UpdatePeriod.ONCE_PER_DAY}"
            >{$_(
              "pages.settings.platform.inputs.check-auto-updates.once-in-a-day",
            )}</option>
          <option value="{UpdatePeriod.ONCE_PER_WEEK}"
            >{$_(
              "pages.settings.platform.inputs.check-auto-updates.once-in-a-week",
            )}
          </option>
          <option value="{UpdatePeriod.ONCE_PER_MONTH}"
            >{$_(
              "pages.settings.platform.inputs.check-auto-updates.once-in-a-month",
            )}</option>
        </select>
      </div>
    </div>

    <button
      class="btn btn-secondary"
      class:disabled="{saveButtonLoading || isSaveButtonDisabled}"
      aria-disabled="{saveButtonLoading || isSaveButtonDisabled}"
      on:click="{save}"
      >{$_("pages.settings.platform.save-button")}
    </button>
  </div>
</div>

<div class="card">
  <div class="card-body">
    <h5 class="card-title">
      {$_("pages.settings.platform.smtp-settings")}
    </h5>
    <div class="row mb-3">
      <label class="col-md-4 col-form-label" for="mailUsernameAdress">
        {$_("pages.settings.platform.mail-username-address")}
      </label>
      <div class="col-md-4">
        <input
          id="mailUsernameAdress"
          class="form-control"
          type="email"
          name="mailUsernameAdress" />
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { base } from "$app/paths";
  import ApiUtil from "$lib/api.util.js";

  export const UpdatePeriod = Object.freeze({
    NEVER: "never",
    ONCE_PER_DAY: "oncePerDay",
    ONCE_PER_WEEK: "oncePerWeek",
    ONCE_PER_MONTH: "oncePerMonth",
  });

  async function loadData({ request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: "/api/panel/settings?type=general",
        request,
      }).then((body) => {
        if (body.result === "ok") {
          body.oldSettings = body;

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
  export async function load(event) {
    const { parent, url: {searchParams} } = event;
    const parentData = await parent();

    let data = {
      updatePeriod: UpdatePeriod.ONCE_PER_DAY,
      locale: "",
      oldSettings: {
        updatePeriod: UpdatePeriod.ONCE_PER_DAY,
        locale: "",
      },
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ request: event }).then((body) => {
      data = { ...data, ...body };
    });

    const failed = searchParams.get("failed");
    const encodedData = searchParams.get("encodedData");
    const state = searchParams.get("state");

    return { ...data, platformConnectFailed: failed, encodedData, state };
  }
</script>

<script>
  import { getContext, onMount } from "svelte";
  import { _ } from "svelte-i18n";

  import { page } from "$app/stores";
  import { goto, invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";

  import { showNetworkErrorOnCatch } from "$lib/Store";
  import { PANO_WEBSITE_URL } from "$lib/variables.js";
  import { buildQueryParams } from "$lib/api.util.js";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import {
    changeLanguage,
    getLanguageByLocale,
    Languages,
  } from "$lib/language.util";

  import SettingsSaveSuccessToast from "$lib/component/toasts/SettingsSaveSuccessToast.svelte";
  import PanoAccountConnectSuccessToast from "$lib/component/toasts/PanoAccountConnectSuccessToast.svelte";
  import PanoAccountDisconnectSuccessToast from "$lib/component/toasts/PanoAccountDisconnectSuccessToast.svelte";
  import PanoAccountDisconnectFailToast from "$lib/component/toasts/PanoAccountDisconnectFailToast.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.settings.platform.title");

  export let data;

  let saveButtonLoading = false;
  let connecting = !data.panoAccount && data.state && data.encodedData;
  let disconnecting;

  $: isSaveButtonDisabled =
    data.oldSettings.updatePeriod === data.updatePeriod &&
    data.oldSettings.locale === data.locale;

  if (browser) {
    if (!data.panoAccount && data.state && data.encodedData) {
      showNetworkErrorOnCatch((resolve, reject) => {
        ApiUtil.post({
          path: "/api/panel/platform/connect",
          body: {
            encodedData: data.encodedData,
            state: data.state
          }
        }).then(async (body) => {
          resolve();

          if (body.error) {
            if (body.error === "ALREADY_CONNECTED_TO_PANO") {
              await goto($page.url.pathname, { invalidateAll: true })
              connecting = false;
              return
            }

            const queryParameters = buildQueryParams({ failed: true })
            await goto($page.url.pathname + queryParameters, { invalidateAll: true })
            connecting = false;

            return
          }

          await goto($page.url.pathname, { invalidateAll: true })
          await showToast(PanoAccountConnectSuccessToast);

          connecting = false;

        }).catch((_) => reject())
      });
    }
  }

  function save() {
    saveButtonLoading = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      const formData = new FormData();

      formData.append("updatePeriod", data.updatePeriod);
      formData.append("locale", data.locale);

      ApiUtil.put({
        path: "/api/panel/settings",
        body: formData,
      })
        .then((body) => {
          if (body.result === "ok") {
            saveButtonLoading = false;

            data.oldSettings = Object.keys(data)
              .filter((key) => key !== "oldSettings")
              .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
              }, {});

            changeLanguage(getLanguageByLocale(data.locale));

            showToast(SettingsSaveSuccessToast);

            resolve();
          } else reject();
        })
        .catch(() => {
          reject();
        });
    });
  }

  function onConnectClick() {
    connecting = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.post({
        path: "/api/panel/platform/code",
      }).then((body) => {
        resolve();

        if (body.error) {
          location.reload();
          return
        }

        const { publicKey, state } = body

        // Encode dynamic parts to ensure the URL is safe
        const encodedPublicKey = encodeURIComponent(publicKey);
        const encodedRedirectUrl = encodeURIComponent($page.url.origin + $page.url.pathname);
        const encodedState = encodeURIComponent(state);

        // Redirect to the constructed URL
        window.location = `${PANO_WEBSITE_URL}/auth?loginPanoPlatform=${encodedPublicKey}&redirectUrl=${encodedRedirectUrl}&state=${encodedState}`;
      }).catch((_) => reject())
    });
  }

  function onDisconnectClick() {
    disconnecting = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.post({
        path: "/api/panel/platform/disconnect",
      }).then(async (body) => {
        resolve();

        if (body.error) {
          await showToast(PanoAccountDisconnectFailToast);

          disconnecting = false;
          return
        }

        await showToast(PanoAccountDisconnectSuccessToast);

        data.panoAccount = null;

        disconnecting = false;
      }).catch((_) => reject())
    });
  }

  function maskEmail(email) {
    const [localPart, domain] = email.split("@");

    const maskedLocal = localPart.length <= 3
      ? `${localPart[0]}**`
      : `${localPart.substring(0, 2)}${"*".repeat(localPart.length - 2)}`;

    const domainParts = domain.split(".");
    const maskedDomain = `${domainParts[0][0]}${"*".repeat(domainParts[0].length - 1)}.${domainParts.slice(1).join(".")}`;

    return `${maskedLocal}@${maskedDomain}`;
  }
</script>
