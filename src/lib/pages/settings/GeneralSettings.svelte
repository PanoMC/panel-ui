<!-- Error Alert -->
<div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
  <button
    type="button"
    class="btn-close"
    data-bs-dismiss="alert"
    aria-label="Close"></button
  >Alert Content
</div>

<!-- General Settings Sub Page -->
<div class="card">
  <div class="card-body animate__animated animate__fadeIn">
    <h5 class="card-title">Hesap</h5>
    <div class="row mb-3">
      <label class="col-md-4" for="platformDevMode"> Hesap Türü: </label>
      <div class="col">YerelÇevrimiçi</div>
    </div>

    <div class="row mb-3">
      <label class="col-md-4" for="platformDevMode"> Yönetici: </label>
      <div class="col">
        <a href="#" title="{$_('components.player-row.view')}">
          <img
            src="https://minotar.net/avatar/Butlu"
            width="20"
            height="20"
            class="rounded-circle animate__animated animate__zoomIn me-2"
            alt="Butlu" />Butlu</a>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-4" for="platformDevMode"> Pano Hesabı: </label>
      <div class="col">
        <button type="button" class="btn btn-sm btn-outline-primary lh-base">
          <img
            src="{base}/assets/img/logo.svg"
            width="20"
            height="20"
            class="me-2 bg-dark p-1 rounded" />
          Bağla</button>
        <span class="text-muted">se***@ou***.com</span>
        <button type="button" class="btn btn-link link-danger">Kaldır</button>
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
    const { parent } = event;
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

    return data;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { showNetworkErrorOnCatch } from "$lib/Store";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import {
    changeLanguage,
    getLanguageByLocale,
    Languages,
  } from "$lib/language.util";
  import SettingsSaveSuccessToast from "$lib/component/toasts/SettingsSaveSuccessToast.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.settings.platform.title");

  export let data;

  let saveButtonLoading = false;
  $: isSaveButtonDisabled =
    data.oldSettings.updatePeriod === data.updatePeriod &&
    data.oldSettings.locale === data.locale;

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
</script>
