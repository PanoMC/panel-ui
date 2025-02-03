{#if !data.panoAccount && data.platformConnectFailed}
  <!-- Error Alert -->
  <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
    <button
      type="button"
      class="btn-close"
      data-bs-dismiss="alert"
      aria-label="{$_('buttons.close')}"></button>
    {$_("pages.settings.platform.connect-failed-alert")}
  </div>
{/if}

<!-- Platform Settings Sub Page -->
<div class="card">
  <div class="card-body animate__animated animate__fadeIn">
    <h5 class="card-title">{$_("pages.settings.platform.account")}</h5>
    {#if data.panoAccount}
      <div class="row mb-3">
        <label class="col-md-6" for="platformId"
          >{$_("pages.settings.platform.platform-id")}</label>
        <div class="col" id="platformId">{data.panoAccount.platformId}</div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6" for="panoAccountUsername"
          >{$_("pages.settings.platform.user")}</label>
        <div class="col" id="panoAccountUsername">
          <a
            href="{PANO_WEBSITE_URL + '/users/' + data.panoAccount.username}"
            title="{$_('components.player-row.view')}"
            target="_blank">
            <img
              src="https://minotar.net/avatar/{data.panoAccount.username}"
              width="20"
              height="20"
              class="rounded-circle animate__animated animate__zoomIn me-2"
              alt="{data.panoAccount.username}" />{data.panoAccount
              .username}</a>
        </div>
      </div>
    {/if}

    <div class="row">
      <label class="col-md-6" for="connectPanoAccount"
        >{$_("pages.settings.platform.online-account")}
        <br />
        <small class="text-muted">
          {$_("pages.settings.platform.online-account-description")}
        </small>
      </label>
      <div class="col" id="connectPanoAccount">
        {#if data.panoAccount}
          <span class="text-muted">{maskEmail(data.panoAccount.email)}</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger ms-2"
            on:click="{onDisconnectClick}"
            disabled="{disconnecting}">{$_("buttons.remove")}</button>
        {:else}
          <button
            type="button"
            class="btn btn-sm btn-outline-primary lh-base"
            on:click="{onConnectClick}"
            disabled="{connecting}">
            <img
              src="{base}/assets/img/logo.svg"
              width="20"
              height="20"
              class="me-2 bg-dark p-1 rounded"
              alt="Pano" />

            {connecting ? $_("buttons.connecting") : $_("buttons.connect")}

            {#if connecting}
              <span
                class="spinner-border spinner-border-sm text-primary"
                role="status"></span>
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
      <label class="col-md-6" for="platformDevMode"> Geliştirici Modu </label>
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
      <label class="col-md-6 col-form-label" for="platformLanguage">
        {$_("pages.settings.platform.display-language")}
      </label>
      <div class="col-md-6">
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
      <label class="col-md-6 col-form-label" for="updatePeriod">
        {$_("pages.settings.platform.check-auto-updates")}
      </label>
      <div class="col-md-6">
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
      class:disabled="{savePreferencesLoading || preferencesSaveDisabled}"
      aria-disabled="{savePreferencesLoading || preferencesSaveDisabled}"
      on:click="{onSavePreferencesClick}"
      >{$_("pages.settings.platform.save-button")}
    </button>
  </div>
</div>

{#if mailError}
  <!-- Error Alert -->
  <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
    <button
      type="button"
      class="btn-close"
      data-bs-dismiss="alert"
      aria-label="Close"></button>
    {$_("pages.settings.platform.smtp.email-validation-error", {
      values: { mailError },
    })}
  </div>
{/if}

<div class="card">
  <div class="card-header">
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" id="smtpToggle" checked="{$siteInfo.emailEnabled}" on:change={onToggleSmtp} />
      <label class="form-check-label" for="smtpToggle">Toggle SMTP</label>
    </div>
  </div>
  <div class="card-body" class:opacity-50={smtpDisabled}>
    <h5 class="card-title">
      {$_("pages.settings.platform.smtp-settings")}
    </h5>

    <p class="text-muted">
      {$_("pages.settings.platform.smtp.description")}
    </p>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="mailUsername"
        >{$_("pages.settings.platform.smtp.username")}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="mailUsername"
          type="text"
          placeholder="no-reply"
          bind:value="{data.email.username}"
          disabled="{smtpDisabled}"/>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="mailUserPassword"
        >{$_("pages.settings.platform.smtp.password")}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="mailUserPassword"
          placeholder="****************"
          bind:value="{data.email.password}"
          type="password"
          disabled="{smtpDisabled}" />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="useSSLCheck">
        {$_("pages.settings.platform.smtp.ssl")}
      </label>
      <div class="col-md-6">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            name="useSSLCheck"
            id="useSSLCheck"
            aria-checked="{data.email.ssl}"
            bind:checked="{data.email.ssl}"
            disabled="{smtpDisabled}" />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="port"
        >{$_("pages.settings.platform.smtp.tls-setting")}</label>
      <div class="col-md-6">
        <select
          class="form-select"
          id="port"
          bind:value="{data.email.starttls}"
          disabled="{smtpDisabled}">
          <option value="REQUIRED">REQUIRED</option>
          <option value="OPTIONAL">OPTIONAL</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="senderAddress"
        >{$_("pages.settings.platform.smtp.sender-address")}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="senderAddress"
          type="text"
          placeholder="no-reply@forexample.com"
          bind:value="{data.email.sender}"
          disabled="{smtpDisabled}" />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="hostAddress"
        >{$_("pages.settings.platform.smtp.hostname")}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="hostAddress"
          type="text"
          placeholder="smtp.forexample.com"
          bind:value="{data.email.hostname}"
          disabled="{smtpDisabled}" />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="port"
        >{$_("pages.settings.platform.smtp.port")}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="port"
          placeholder="465"
          type="number"
          bind:value="{data.email.port}"
          disabled="{smtpDisabled}" />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="port"
        >{$_("pages.settings.platform.smtp.auth-methods")}</label>
      <div class="col-md-6">
        <select class="form-select" bind:value="{data.email.authMethods}"
                disabled="{smtpDisabled}">
          <option value="PLAIN">PLAIN</option>
          <option value=""></option>
        </select>
      </div>
    </div>

    <button
      class="btn btn-secondary"
      on:click="{onSaveSmtpClick}"
      disabled="{saveEmailLoading || !mailValidated || smtpDisabled}"
      >{$_(!$siteInfo.emailEnabled ? "buttons.enable" : "pages.settings.platform.save-button")}
    </button>
    {#if !mailValidated && !emailSaveDisabled}
      <button
        class="btn btn-outline-primary"
        on:click="{onValidateEmailClick}"
        disabled="{saveEmailLoading || smtpDisabled}"
        >{$_('buttons.validate')}
        {#if saveEmailLoading}
          <span
            class="spinner-border spinner-border-sm text-primary"
            role="status"></span>
        {/if}
      </button>
    {/if}
  </div>
</div>

<ConfirmRemovePanoAccountModal />

<script context="module">
  import { base } from "$app/paths";
  import ApiUtil from "$lib/api.util.js";

  export const UpdatePeriod = Object.freeze({
    NEVER: "NEVER",
    ONCE_PER_DAY: "ONCE_PER_DAY",
    ONCE_PER_WEEK: "ONCE_PER_WEEK",
    ONCE_PER_MONTH: "ONCE_PER_MONTH",
  });

  async function loadData({ request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: "/api/panel/settings?type=GENERAL",
        request,
      }).then((body) => {
        if (body.result === "ok") {
          body.oldSettings = structuredClone(body);

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
    const {
      parent,
      url: { searchParams },
    } = event;
    const parentData = await parent();

    let data = {
      updatePeriod: "",
      locale: "",
      oldSettings: {},
      email: {},
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
  import { getContext } from "svelte";
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
  import EmailConfigValidateSuccessToast from "$lib/component/toasts/EmailConfigValidateSuccessToast.svelte";
  import ConfirmRemovePanoAccountModal, {
    show as showConfirmRemovePanoAccountModal,
  } from "$lib/component/modals/ConfirmRemovePanoAccountModal.svelte";

  const pageTitle = getContext("pageTitle");
  const siteInfo = getContext("siteInfo");

  pageTitle.set("pages.settings.platform.title");

  export let data;

  let savePreferencesLoading;
  let saveEmailLoading;
  let connecting = !data.panoAccount && data.state && data.encodedData;
  let disconnecting;
  let mailValidated;
  let mailError;

  $: preferencesSaveDisabled =
    data.oldSettings.updatePeriod === data.updatePeriod &&
    data.oldSettings.locale === data.locale;

  $: emailSaveDisabled =
    JSON.stringify(data.oldSettings.email) === JSON.stringify(data.email) ||
    !data.email.password;

  let smtpDisabled;

  $: {
    smtpDisabled = !$siteInfo.emailEnabled
  }

  if (browser) {
    if (!data.panoAccount && data.state && data.encodedData) {
      showNetworkErrorOnCatch((resolve, reject) => {
        ApiUtil.post({
          path: "/api/panel/platform/connect",
          body: {
            encodedData: data.encodedData,
            state: data.state,
          },
        })
          .then(async (body) => {
            resolve();

            if (body.error) {
              if (body.error === "ALREADY_CONNECTED_TO_PANO") {
                await goto($page.url.pathname, { invalidateAll: true });
                connecting = false;
                return;
              }

              const queryParameters = buildQueryParams({ failed: true });
              await goto($page.url.pathname + queryParameters, {
                invalidateAll: true,
              });
              connecting = false;

              return;
            }

            await goto($page.url.pathname, { invalidateAll: true });
            await showToast(PanoAccountConnectSuccessToast);

            connecting = false;
          })
          .catch((_) => reject());
      });
    }
  }

  function onConnectClick() {
    connecting = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.post({
        path: "/api/panel/platform/code",
      })
        .then((body) => {
          resolve();

          if (body.error) {
            location.reload();
            return;
          }

          const { publicKey, state } = body;

          // Encode dynamic parts to ensure the URL is safe
          const encodedPublicKey = encodeURIComponent(publicKey);
          const encodedRedirectUrl = encodeURIComponent(
            $page.url.origin + $page.url.pathname,
          );
          const encodedState = encodeURIComponent(state);

          // Redirect to the constructed URL
          window.location = `${PANO_WEBSITE_URL}/auth?loginPanoPlatform=${encodedPublicKey}&redirectUrl=${encodedRedirectUrl}&state=${encodedState}`;
        })
        .catch((_) => reject());
    });
  }

  function onDisconnectClick() {
    showConfirmRemovePanoAccountModal(() => {
      disconnecting = true;

      showNetworkErrorOnCatch((resolve, reject) => {
        ApiUtil.post({
          path: "/api/panel/platform/disconnect",
        })
          .then(async (body) => {
            resolve();

            if (body.error) {
              await showToast(PanoAccountDisconnectFailToast);

              disconnecting = false;
              return;
            }

            await showToast(PanoAccountDisconnectSuccessToast);

            data.panoAccount = null;

            disconnecting = false;
          })
          .catch((_) => reject());
      });
    });
  }

  function onSavePreferencesClick() {
    savePreferencesLoading = true;

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
            savePreferencesLoading = false;

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

  function onValidateEmailClick() {
    saveEmailLoading = true;
    mailError = null;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.post({
        path: "/api/panel/settings/verify/mail",
        body: data.email,
      })
        .then((body) => {
          saveEmailLoading = false;

          if (body.error) {
            mailError = body.mailError;

            return;
          }

          mailValidated = true;

          showToast(EmailConfigValidateSuccessToast);

          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  }

  function onSaveSmtpClick() {
    saveEmailLoading = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      const formData = new FormData();

      const { hostname,
        port,
        ssl,
        starttls,
        username,
        password,
        sender,
        authMethods } = data.email
      formData.append("email", JSON.stringify({
        hostname,
        port,
        ssl,
        starttls,
        username,
        password,
        sender,
        authMethods
      }))

      ApiUtil.put({
        path: "/api/panel/settings",
        body: formData,
      })
        .then(async (body) => {
          if (body.error) {
            reject();

            return;
          }

          saveEmailLoading = false;
          mailValidated = false;

          data.oldSettings.email = Object.keys(data.email).reduce(
            (obj, key) => {
              obj[key] = data.email[key];
              return obj;
            },
            {},
          );

          await invalidateAll()

          await showToast(SettingsSaveSuccessToast);

          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  }

  function maskEmail(email) {
    const [localPart, domain] = email.split("@");

    const maskedLocal =
      localPart.length <= 3
        ? `${localPart[0]}**`
        : `${localPart.substring(0, 2)}${"*".repeat(localPart.length - 2)}`;

    const domainParts = domain.split(".");
    const maskedDomain = `${domainParts[0][0]}${"*".repeat(domainParts[0].length - 1)}.${domainParts.slice(1).join(".")}`;

    return `${maskedLocal}@${maskedDomain}`;
  }

  function onToggleSmtp(event) {
    smtpDisabled = !event.target.checked
  }
</script>
