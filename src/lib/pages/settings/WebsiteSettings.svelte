<style>
  .label-restart-info {
    font-size: 0.55rem;
    position: absolute;
    top: -0.1rem;
    right: -0.8rem;
    opacity: 0.5;
    transition: opacity 0.2s;
    cursor: help;
  }

  .label-restart-info:hover {
    opacity: 1;
    color: var(--bs-warning) !important;
  }
</style>

<!-- Site Settings Sub Page -->
<div class="card">
  <div class="card-header">
    {$_('pages.settings.site-settings.preferences')}
  </div>
  <div class="card-body">
    {#if restartRequired}
      <div class="alert alert-warning d-flex align-items-center justify-content-between mb-4">
        <div>
          <i class="fas fa-triangle-exclamation me-2"></i>
          {$_('pages.settings.site-settings.ssl.restart-required-alert')}
        </div>
        <button class="btn btn-warning btn-sm ms-3" on:click={showConfirmRestartPanoModal}>
          {$_('pages.settings.site-settings.ssl.restart-now')}
        </button>
      </div>
    {/if}

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="siteTitle"
        >{$_('pages.settings.site-settings.inputs.website-name.label')}</label>
      <div class="col-md-6">
        <input
          bind:value={data.websiteName}
          aria-describedby="siteTitle"
          class="form-control"
          placeholder={$_('pages.settings.site-settings.inputs.website-name.placeholder')}
          id="siteTitle"
          type="text" />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="siteDesc">
        {$_('pages.settings.site-settings.inputs.website-description.label')}
      </label>
      <div class="col-md-6">
        <textarea
          bind:value={data.websiteDescription}
          aria-describedby="siteDesc"
          class="form-control"
          id="siteDesc"
          rows="2"></textarea>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="websiteUrl">
        <span class="d-inline-block position-relative">
          {$_('pages.settings.site-settings.inputs.website-url.label')}
          <i
            class="fas fa-circle-info label-restart-info text-secondary"
            use:tooltip={[$_('pages.settings.site-settings.inputs.requires-restart')]}></i>
        </span>
      </label>
      <div class="col-md-6">
        <input
          bind:value={data.websiteUrl}
          aria-describedby="websiteUrl"
          class="form-control"
          class:is-invalid={data.sslMode === 'LETS_ENCRYPT' && !isDomainValidForLE}
          placeholder={$_('pages.settings.site-settings.inputs.website-url.placeholder')}
          id="websiteUrl"
          type="text" />
        {#if isHostMismatch}
          <div class="alert alert-warning d-flex align-items-start mt-2 mb-0">
            <i class="fas fa-triangle-exclamation me-2 mt-1"></i>
            <div>{$_('pages.settings.site-settings.inputs.website-url.host-mismatch')}</div>
          </div>
        {/if}
        {#if isPortMismatch}
          <div class="alert alert-warning d-flex align-items-start mt-2 mb-0">
            <i class="fas fa-triangle-exclamation me-2 mt-1"></i>
            <div>
              {$_('pages.settings.site-settings.inputs.website-url.port-mismatch', {
                values: { port: portFromUrl, current: window.location.port || '80/443' },
              })}
            </div>
          </div>
        {/if}
        {#if hasExplicitPort}
          <div class="alert alert-warning d-flex align-items-start mt-2 mb-0">
            <i class="fas fa-triangle-exclamation me-2 mt-1"></i>
            <div>
              {$_('pages.settings.site-settings.inputs.website-url.explicit-port', {
                values: { port: portFromUrl },
              })}
            </div>
          </div>
        {/if}
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="registerAgreementEditBtn">
        {$_('pages.settings.site-settings.inputs.register-agreement.label')}
      </label>
      <div class="col-md-6 d-flex align-items-center">
        {#if normalizeRegisterAgreement(data.registerAgreement)}
          <button
            type="button"
            id="registerAgreementEditBtn"
            class="btn btn-link p-0 text-decoration-none"
            on:click={openRegisterAgreementModal}>
            <i class="fas fa-pencil me-1"></i>
            {$_('buttons.edit')}
          </button>
        {:else}
          <button
            type="button"
            id="registerAgreementEditBtn"
            class="btn btn-link p-0 text-decoration-none text-body-secondary"
            on:click={openRegisterAgreementModal}>
            <i class="fas fa-pencil me-1"></i>
            Belirlenmedi
          </button>
        {/if}
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="ipAddress">
        {$_('pages.settings.site-settings.inputs.game-server-ip-address.label')}
      </label>
      <div class="col-md-6">
        <input
          id="ipAddress"
          class="form-control"
          placeholder="play.server.com"
          type="text"
          name="ipAddress"
          bind:value={data.serverIpAddress} />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="serverGameVersion">
        {$_('pages.settings.site-settings.inputs.game-server-version.label')}
      </label>
      <div class="col-md-6">
        <input
          id="serverGameVersion"
          class="form-control"
          placeholder="1.8.x"
          type="text"
          name="serverGameVersion"
          bind:value={data.serverGameVersion} />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="supportEmailAddress">
        {$_('pages.settings.site-settings.inputs.support-email-address.label')}
      </label>
      <div class="col-md-6">
        <input
          id="supportEmailAddress"
          class="form-control"
          placeholder="support@{data.websiteName}.com"
          type="email"
          name="supportEmailAddress"
          bind:value={data.supportEmail} />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="siteKeywords">
        {$_('pages.settings.site-settings.inputs.keywords.label')}
      </label>
      <div class="col-md-6">
        <form on:submit|preventDefault={addKeyWord}>
          <input
            id="siteKeywords"
            class="form-control mb-2"
            class:border-danger={keywordInputError}
            placeholder={$_('pages.settings.site-settings.inputs.keywords.placeholder')}
            type="text"
            name="keyword"
            bind:value={keyword} />
        </form>
        <div class="mb-3">
          {#each data.keywords as keyword, index (keyword)}
            <button
              type="button"
              class="btn btn-link btn-sm"
              title={$_('buttons.remove')}
              on:click={() => removeKeyWord(index)}>
              {keyword}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Favicon section -->
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="siteFavicon">
        {$_('pages.settings.site-settings.inputs.favicon.label')}
      </label>
      <div class="col-md-6">
        <div class="position-relative d-inline-block" style="width: 64px; height: 64px;">
          <DragAndDropZone
            bind:this={faviconZone}
            class="p-0"
            accept={[
              'image/png',
              'image/jpeg',
              'image/gif',
              'image/x-icon',
              'image/vnd.microsoft.icon',
            ]}
            maxFileSize={1 * 1024 * 1024}
            on:drop={(e) => onFaviconDrop(e.detail)}
            on:error={(e) => handleFileError(e, 'favicon')}>
            <img
              alt={$_('pages.settings.site-settings.inputs.favicon.select')}
              src={favicon}
              class="w-100 h-100"
              style="object-fit: contain;" />
          </DragAndDropZone>
          <button
            type="button"
            class="btn btn-sm btn-secondary position-absolute top-0 start-100 translate-middle"
            on:click={() => faviconZone.click()}
            title={$_('buttons.change')}
            aria-label={$_('buttons.change')}>
            <i class="fas fa-pen"></i>
          </button>
        </div>
        <small class=" d-block mt-2">
          {$_('pages.settings.site-settings.inputs.favicon.helper')}
        </small>
      </div>
    </div>

    <!-- Website logo section -->
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="siteLogo">
        {$_('pages.settings.site-settings.inputs.website-logo.label')}
      </label>
      <div class="col-md-6">
        <div class="position-relative w-100" style="max-width: 300px;">
          <div class="ratio ratio-16x9">
            <DragAndDropZone
              bind:this={logoZone}
              class="p-0 position-absolute start-0 top-0"
              accept={['image/png', 'image/jpeg', 'image/gif']}
              maxFileSize={2 * 1024 * 1024}
              on:drop={(e) => onWebsiteLogoDrop(e.detail)}
              on:error={(e) => handleFileError(e, 'logo')}>
              <img
                src={websiteLogo}
                class="object-fit-contain w-100 h-100"
                alt={$_('pages.settings.site-settings.inputs.website-logo.server-icon')} />
            </DragAndDropZone>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary position-absolute top-0 start-100 translate-middle"
            on:click={() => logoZone.click()}
            title={$_('buttons.change')}
            aria-label={$_('buttons.change')}>
            <i class="fas fa-pencil"></i>
          </button>
        </div>
        <small class=" d-block mt-2">
          {$_('pages.settings.site-settings.inputs.website-logo.helper')}
        </small>
      </div>
    </div>

    <!-- SSL and Port Settings -->
    <hr />
    <h5 class="mb-3">{$_('pages.settings.site-settings.ssl.title')}</h5>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="httpPort">
        <span class="d-inline-block position-relative">
          {$_('pages.settings.site-settings.inputs.http-port.label')}
          <i
            class="fas fa-circle-info label-restart-info text-secondary"
            use:tooltip={[$_('pages.settings.site-settings.inputs.requires-restart')]}></i>
        </span>
      </label>
      <div class="col-md-6">
        <input
          id="httpPort"
          class="form-control"
          class:is-invalid={data.sslMode === 'LETS_ENCRYPT' && !isPortValidForLE}
          type="number"
          bind:value={data.httpPort} />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="httpsPort">
        <span class="d-inline-block position-relative">
          {$_('pages.settings.site-settings.inputs.https-port.label')}
          <i
            class="fas fa-circle-info label-restart-info text-secondary"
            use:tooltip={[$_('pages.settings.site-settings.inputs.requires-restart')]}></i>
        </span>
      </label>
      <div class="col-md-6">
        <input
          id="httpsPort"
          class="form-control"
          class:is-invalid={data.sslMode === 'LETS_ENCRYPT' && !isHttpsPortValidForLE}
          type="number"
          disabled={data.sslMode === 'DISABLED'}
          bind:value={data.httpsPort} />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="redirectHttps">
        {$_('pages.settings.site-settings.inputs.redirect-https.label')}
      </label>
      <div class="col-md-6 d-flex align-items-center">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="redirectHttps"
            disabled={data.sslMode === 'DISABLED'}
            bind:checked={data.redirectHttps} />
        </div>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="sslMode">
        <span class="d-inline-block position-relative">
          {$_('pages.settings.site-settings.inputs.ssl-mode.label')}
          <i
            class="fas fa-circle-info label-restart-info text-secondary"
            use:tooltip={[$_('pages.settings.site-settings.inputs.requires-restart')]}></i>
        </span>
      </label>
      <div class="col-md-6">
        <select id="sslMode" class="form-select" bind:value={data.sslMode}>
          <option value="DISABLED">{$_('pages.settings.site-settings.ssl.modes.disabled')}</option>
          <option value="LETS_ENCRYPT"
            >{$_('pages.settings.site-settings.ssl.modes.lets-encrypt')}</option>
          <option value="MANUAL">{$_('pages.settings.site-settings.ssl.modes.manual')}</option>
        </select>

        {#if isLetsEncryptInvalid}
          <div class="alert alert-danger mt-2 mb-0">
            <i class="fas fa-circle-exclamation me-2"></i>
            {$_('pages.settings.site-settings.ssl.lets-encrypt-invalid-config')}
          </div>
        {/if}
      </div>
    </div>

    {#if data.sslMode === 'MANUAL'}
      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="sslCert">
          <span class="d-inline-block position-relative">
            {$_('pages.settings.site-settings.inputs.ssl-cert.label')}
            <i
              class="fas fa-circle-info label-restart-info text-secondary"
              use:tooltip={[$_('pages.settings.site-settings.inputs.requires-restart')]}></i>
          </span>
        </label>
        <div class="col-md-6">
          <div class="position-relative">
            <textarea
              disabled={data.sslCert === '****************'}
              bind:value={data.sslCert}
              class="form-control font-monospace"
              class:is-invalid={data.sslMode === 'MANUAL' && !data.sslCert}
              id="sslCert"
              rows="5"
              placeholder="-----BEGIN CERTIFICATE-----"></textarea>
            {#if data.sslCert === '****************'}
              <button
                class="btn btn-sm btn-secondary position-absolute top-50 start-50 translate-middle"
                on:click|preventDefault={() => revealSsl('sslCert')}>
                <i class="fas fa-eye me-1"></i>
                {$_('buttons.reveal')}
              </button>
            {/if}
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="sslKey">
          <span class="d-inline-block position-relative">
            {$_('pages.settings.site-settings.inputs.ssl-key.label')}
            <i
              class="fas fa-circle-info label-restart-info text-secondary"
              use:tooltip={[$_('pages.settings.site-settings.inputs.requires-restart')]}></i>
          </span>
        </label>
        <div class="col-md-6">
          <div class="position-relative">
            <textarea
              disabled={data.sslKey === '****************'}
              bind:value={data.sslKey}
              class="form-control font-monospace"
              class:is-invalid={data.sslMode === 'MANUAL' && !data.sslKey}
              id="sslKey"
              rows="5"
              placeholder="-----BEGIN PRIVATE KEY-----"></textarea>
            {#if data.sslKey === '****************'}
              <button
                class="btn btn-sm btn-secondary position-absolute top-50 start-50 translate-middle"
                on:click|preventDefault={() => revealSsl('sslKey')}>
                <i class="fas fa-eye me-1"></i>
                {$_('buttons.reveal')}
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <button
      class="btn btn-secondary"
      class:disabled={saveButtonLoading || isSaveButtonDisabled}
      aria-disabled={saveButtonLoading || isSaveButtonDisabled}
      on:click={onSaveClick}>
      {$_('buttons.save')}
    </button>
  </div>
</div>

<ConfirmRestartPanoModal runMode={data.runMode} />
<ConfirmSaveCriticalSettingsModal />
<EditRegisterAgreementModal />

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const queryParams = buildQueryParams({
      type: 'WEBSITE',
    });

    const body = await ApiUtil.get({
      path: '/api/panel/settings' + queryParams,
      request: event,
    });

    body.oldSettings = { ...body };
    body.oldSettings.keywords = [...body.keywords];

    return body;
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';

  import EditRegisterAgreementModal, {
    show as showEditRegisterAgreementModal,
  } from '$lib/components/modals/EditRegisterAgreementModal.svelte';
  import { normalizeRegisterAgreement } from '$lib/register-agreement.util.js';

  import { websiteLogoSrc } from '$lib/Store.js';

  import {
    showSuccess as showSuccessToast,
    showError as showErrorToast,
  } from '$lib/components/ToastContainer.svelte';

  import ConfirmRestartPanoModal, {
    show as showConfirmRestartPanoModal,
  } from '$lib/components/modals/ConfirmRestartPanoModal.svelte';

  import ConfirmSaveCriticalSettingsModal, {
    show as showConfirmSaveCriticalSettingsModal,
    setError as setSaveCriticalSettingsError,
    setLoading as setSaveCriticalSettingsLoading,
    hide as hideSaveCriticalSettingsModal,
  } from '$lib/components/modals/ConfirmSaveCriticalSettingsModal.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');
  const website = getContext('website');

  pageTitle.set('pages.settings.site-settings.title');

  let faviconFiles = null;
  let websiteLogoFiles = null;

  let selectedFaviconFiles = [];
  let selectedWebsiteLogoFiles = [];

  let faviconZone;
  let logoZone;

  let restartRequired = false;

  onMount(() => {
    restartRequired = data.restartRequired;
  });

  let keyword;
  let saveButtonLoading = false;

  function openRegisterAgreementModal() {
    showEditRegisterAgreementModal(data.registerAgreement, (html) => {
      data.registerAgreement = normalizeRegisterAgreement(html);
    });
  }

  $: isSaveButtonDisabled =
    (data.oldSettings.websiteName === data.websiteName &&
      data.oldSettings.websiteDescription === data.websiteDescription &&
      data.oldSettings.websiteUrl === data.websiteUrl &&
      normalizeRegisterAgreement(data.oldSettings.registerAgreement) ===
        normalizeRegisterAgreement(data.registerAgreement) &&
      data.oldSettings.supportEmail === data.supportEmail &&
      data.oldSettings.serverIpAddress === data.serverIpAddress &&
      data.oldSettings.serverGameVersion === data.serverGameVersion &&
      JSON.stringify(data.oldSettings.keywords) === JSON.stringify(data.keywords) &&
      data.oldSettings.httpPort === data.httpPort &&
      data.oldSettings.httpsPort === data.httpsPort &&
      data.oldSettings.sslMode === data.sslMode &&
      data.oldSettings.sslCert === data.sslCert &&
      data.oldSettings.sslKey === data.sslKey &&
      data.oldSettings.redirectHttps === data.redirectHttps &&
      selectedFaviconFiles.length === 0 &&
      selectedWebsiteLogoFiles.length === 0) ||
    isLetsEncryptInvalid ||
    isManualInvalid;

  let keywordInputError = false;

  let favicon = '/api/favicon?_=' + Date.now();
  let websiteLogo = '/api/websiteLogo?_=' + Date.now();

  $: domainFromUrl = (() => {
    try {
      if (!data.websiteUrl) return '';
      const url = data.websiteUrl.startsWith('http')
        ? data.websiteUrl
        : 'http://' + data.websiteUrl;
      const parsed = new URL(url);
      return parsed.hostname;
    } catch (e) {
      // Fallback for incomplete URLs
      return data.websiteUrl
        .replace('http://', '')
        .replace('https://', '')
        .split('/')[0]
        .split(':')[0];
    }
  })();

  $: portFromUrl = (() => {
    try {
      if (!data.websiteUrl) return '';
      // https fallback matches the backend's normalization of scheme-less URLs, so the
      // default-port detection agrees with what actually gets stored.
      const url = data.websiteUrl.includes('://')
        ? data.websiteUrl
        : 'https://' + data.websiteUrl;
      const parsed = new URL(url);
      return parsed.port;
    } catch (e) {
      // Fallback for incomplete URLs
      return '';
    }
  })();

  $: isDomainValidForLE =
    domainFromUrl &&
    domainFromUrl !== 'localhost' &&
    domainFromUrl !== '127.0.0.1' &&
    domainFromUrl.includes('.');
  $: isPortValidForLE = data.httpPort === 80;
  $: isHttpsPortValidForLE = data.httpsPort === 443;
  $: isCurrentDomainMatched =
    typeof window !== 'undefined' && domainFromUrl === window.location.hostname;

  $: isHostMismatch =
    typeof window !== 'undefined' &&
    !!data.websiteUrl &&
    !!domainFromUrl &&
    domainFromUrl.toLowerCase() !== window.location.hostname.toLowerCase();

  $: hasExplicitPort = portFromUrl !== '';
  $: isPortMismatch =
    typeof window !== 'undefined' && hasExplicitPort && portFromUrl !== window.location.port;

  $: isLetsEncryptInvalid =
    data.sslMode === 'LETS_ENCRYPT' &&
    (!isDomainValidForLE || !isPortValidForLE || !isHttpsPortValidForLE || !isCurrentDomainMatched);

  $: isManualInvalid = data.sslMode === 'MANUAL' && (!data.sslCert || !data.sslKey);

  function handleFileError(event, type = 'favicon') {
    const { error } = event.detail;
    if (error === 'INVALID_SIZE') {
      showErrorToast(
        type === 'favicon'
          ? 'components.toasts.favicon-exceeds-size'
          : 'components.toasts.website-logo-exceeds-size',
      );
    } else if (error === 'INVALID_TYPE') {
      showErrorToast(
        type === 'favicon'
          ? 'components.toasts.favicon-wrong-content-type'
          : 'components.toasts.website-logo-wrong-content-type',
      );
    }
  }

  async function onFaviconDrop(file) {
    if (!file) return;

    // Component handles validation
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      favicon = e.target.result;
    };

    faviconFiles = [file]; // We need to mock FileList or just use array
    selectedFaviconFiles = [file];
  }

  async function onWebsiteLogoDrop(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      websiteLogo = e.target.result;
    };

    websiteLogoFiles = [file];
    selectedWebsiteLogoFiles = [file];
  }

  function save(password = null) {
    saveButtonLoading = true;

    const formData = new FormData();

    formData.append('websiteName', data.websiteName);
    formData.append('websiteDescription', data.websiteDescription);
    formData.append('websiteUrl', data.websiteUrl);
    formData.append('registerAgreement', normalizeRegisterAgreement(data.registerAgreement));
    formData.append('supportEmail', data.supportEmail);
    formData.append('serverIpAddress', data.serverIpAddress);
    formData.append('serverGameVersion', data.serverGameVersion);
    formData.append('keywords', data.keywords);
    formData.append('httpPort', data.httpPort);
    formData.append('httpsPort', data.httpsPort);
    formData.append('sslMode', data.sslMode);
    formData.append('redirectHttps', data.redirectHttps);
    if (data.sslCert) formData.append('sslCert', data.sslCert);
    if (data.sslKey) formData.append('sslKey', data.sslKey);
    if (password) formData.append('password', password);

    if (faviconFiles && faviconFiles[0]) {
      formData.append('favicon', faviconFiles[0]);
    }

    if (websiteLogoFiles && websiteLogoFiles[0]) {
      formData.append('websiteLogo', websiteLogoFiles[0]);
    }

    const needsRestart =
      data.oldSettings.websiteUrl !== data.websiteUrl ||
      data.oldSettings.httpPort !== data.httpPort ||
      data.oldSettings.httpsPort !== data.httpsPort ||
      data.oldSettings.sslMode !== data.sslMode ||
      data.oldSettings.sslCert !== data.sslCert ||
      data.oldSettings.sslKey !== data.sslKey ||
      data.oldSettings.redirectHttps !== data.redirectHttps;

    ApiUtil.put({
      path: '/api/panel/settings',
      body: formData,
      handler: async (body, reject) => {
        saveButtonLoading = false;
        setSaveCriticalSettingsLoading(false);

        if (body.error === 'NO_PERMISSION' && password) {
          setSaveCriticalSettingsError(true);
          return;
        }

        if (body.error) {
          if (password) hideSaveCriticalSettingsModal();
          reject();
          return;
        }

        if (password) hideSaveCriticalSettingsModal();

        website.update((website) => {
          return {
            ...website,
            name: data.websiteName,
            description: data.websiteDescription,
          };
        });

        data.oldSettings = Object.keys(data)
          .filter((key) => key !== 'oldSettings' && key !== 'keywords')
          .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
          }, {});

        data.oldSettings.keywords = [...data.keywords];

        await showSuccessToast('components.toasts.settings-save-success');

        if (needsRestart) {
          restartRequired = true;
        }

        // Update Store if logo changed
        if (selectedWebsiteLogoFiles && selectedWebsiteLogoFiles.length > 0) {
          const reader = new FileReader();
          reader.readAsDataURL(selectedWebsiteLogoFiles[0]);
          reader.onload = (e) => {
            websiteLogoSrc.set(e.target.result);
          };
        }

        selectedFaviconFiles = [];
        selectedWebsiteLogoFiles = [];
      },
    });
  }

  function revealSsl(field) {
    showConfirmSaveCriticalSettingsModal((password) => {
      setSaveCriticalSettingsLoading(true);

      ApiUtil.post({
        path: '/api/panel/settings/reveal-ssl',
        body: { password },
        handler: (body, reject) => {
          setSaveCriticalSettingsLoading(false);

          if (body.error === 'NO_PERMISSION') {
            setSaveCriticalSettingsError(true);
            return;
          }

          if (body.error) {
            hideSaveCriticalSettingsModal();
            reject();
            return;
          }

          hideSaveCriticalSettingsModal();

          if (field === 'sslCert') {
            data.sslCert = body.sslCert;
          } else if (field === 'sslKey') {
            data.sslKey = body.sslKey;
          }
        },
      });
    });
  }

  function onSaveClick() {
    const needsRestart =
      data.oldSettings.websiteUrl !== data.websiteUrl ||
      data.oldSettings.httpPort !== data.httpPort ||
      data.oldSettings.httpsPort !== data.httpsPort ||
      data.oldSettings.sslMode !== data.sslMode ||
      data.oldSettings.sslCert !== data.sslCert ||
      data.oldSettings.sslKey !== data.sslKey ||
      data.oldSettings.redirectHttps !== data.redirectHttps;

    if (needsRestart) {
      showConfirmSaveCriticalSettingsModal((password) => {
        save(password);
      });
    } else {
      save();
    }
  }

  function addKeyWord() {
    if (!keyword) {
      return;
    }

    if (keyword.trim().length === 0) {
      return;
    }

    if (data.keywords.indexOf(keyword) !== -1) {
      keywordInputError = true;

      return;
    }

    keywordInputError = false;

    const keywords = keyword.split(/,\s*/);

    keywords.forEach((keyword) => {
      data.keywords.push(keyword.trim());
    });

    data.keywords = data.keywords;

    keyword = '';
  }

  function removeKeyWord(index) {
    data.keywords = data.keywords.remove(index);
  }

  Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array) return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length) return false;

    for (let i = 0, l = this.length; i < l; i++) {
      // Check if we have nested arrays
      if (this[i] instanceof Array && array[i] instanceof Array) {
        // recurse into the nested arrays
        if (!this[i].equals(array[i])) return false;
      } else if (this[i] != array[i]) {
        // Warning - two different object instances will never be equal: {x:20} != {x:20}
        return false;
      }
    }
    return true;
  };
  // Hide method from for-in loops
  Object.defineProperty(Array.prototype, 'equals', { enumerable: false });
</script>
