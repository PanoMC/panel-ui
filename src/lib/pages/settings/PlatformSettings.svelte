{#if !data.panoAccount && data.platformConnectFailed}
  <!-- Error Alert -->
  <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label={$_('buttons.close')}
    ></button>
    {$_('pages.settings.platform.connect-failed-alert')}
  </div>
{/if}

<PageActions leftClasses="d-none" middleClasses="d-none" rightClasses="col-lg-12">
  <div class="hstack gap-2 ms-lg-auto" slot="right">
    <button class="btn btn-link" title="{$_('buttons.stop')}" data-bs-target="{$_('buttons.stop')}" on:click={onStopPanoClick}>
      <i class="fas fa-stop"></i>
      
    </button>
    <button class="btn btn-secondary" on:click={onRestartPanoClick}>
      <i class="fa-regular fa-arrows-rotate"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.restart')}</span>
    </button>
  </div>
</PageActions>

<!-- Platform Settings Sub Page -->
<div class="card">
  <div class="card-header">
    {$_('pages.settings.platform.account')}
  </div>
  <div class="card-body animate__animated animate__fadeIn">
    {#if data.panoAccount}
      <div class="row mb-3">
        <label class="col-md-6" for="platformId">{$_('pages.settings.platform.platform-id')}</label>
        <span class="col user-select-all font-monospace" id="platformId"
          >{data.panoAccount.platformId}</span>
      </div>

      <div class="row mb-3">
        <label class="col-md-6" for="panoAccountUsername"
          >{$_('pages.settings.platform.user')}</label>
        <div class="col" id="panoAccountUsername">
          <a
            href={PANO_WEBSITE_URL + '/users/' + data.panoAccount.username}
            title={$_('buttons.view')}
            target="_blank">
            @{data.panoAccount.username}
            <i class="fa-solid fa-arrow-up-right-from-square ms-2"></i>
          </a>
        </div>
      </div>
    {/if}

    <div class="row">
      <label class="col-md-6" for="connectPanoAccount"
        >{$_('pages.settings.platform.online-account')}
        <small class="d-block">
          {$_('pages.settings.platform.online-account-description')}
        </small>
      </label>
      <div class="col d-flex align-items-center" id="connectPanoAccount">
        {#if data.panoAccount}
          <div class="hstack gap-2">
            <span class="badge text-bg-primary">{maskEmail(data.panoAccount.email)}</span>
            <button
              type="button"
              class="btn-close"
              title={$_('buttons.remove')}
              aria-label={$_('buttons.remove')}
              on:click={onDisconnectClick}
              disabled={disconnecting}></button>
          </div>
        {:else}
          <button
            type="button"
            class="btn btn-sm btn-secondary lh-base"
            on:click={onConnectClick}
            disabled={connecting}>
            <img
              src="{base}/assets/img/logo.svg"
              width="20"
              height="20"
              class="me-2 bg-dark p-1 rounded"
              alt="Pano" />

            {connecting ? $_('buttons.connecting') : $_('buttons.connect')}

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
  <div class="card-header">
    {$_('pages.settings.platform.preferences')}
  </div>
  <div class="card-body animate__animated animate__fadeIn">
    <div class="row mb-3">
      <label class="col-md-6" for="platformDevMode"
        >{$_('pages.settings.platform.developer-mode')}</label>
      <div class="col d-flex align-items-center">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="platformDevMode"
            autocomplete="off"
            bind:checked={data.developmentMode} />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="platformLanguage">
        {$_('pages.settings.platform.display-language')}
      </label>
      <div class="col-md-6">
        <select class="form-control" id="platformLanguage" bind:value={data.locale}>
          {#each Object.keys($Languages) as language, index (language)}
            <option value={$Languages[language].code}>{$Languages[language].name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6" for="allowUserLocaleSelection">
        {$_('pages.settings.platform.allow-user-locale-selection')}
        <small class="d-block">
          {$_('pages.settings.platform.allow-user-locale-selection-description')}
        </small>
      </label>
      <div class="col d-flex align-items-center">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="allowUserLocaleSelection"
            autocomplete="off"
            bind:checked={data.allowUserLocaleSelection} />
        </div>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="updatePeriod">
        {$_('pages.settings.platform.check-auto-updates')}
      </label>
      <div class="col-md-6">
        <select class="form-control" bind:value={data.updatePeriod} id="updatePeriod">
          <option value={UpdatePeriod.NEVER}
            >{$_('pages.settings.platform.inputs.check-auto-updates.never')}</option>
          <option value={UpdatePeriod.ONCE_PER_DAY}
            >{$_('pages.settings.platform.inputs.check-auto-updates.once-in-a-day')}</option>
          <option value={UpdatePeriod.ONCE_PER_WEEK}
            >{$_('pages.settings.platform.inputs.check-auto-updates.once-in-a-week')}
          </option>
          <option value={UpdatePeriod.ONCE_PER_MONTH}
            >{$_('pages.settings.platform.inputs.check-auto-updates.once-in-a-month')}</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="releaseChannel">
        {$_('pages.settings.platform.release-channel')}
      </label>
      <div class="col-md-6">
        <select class="form-control" bind:value={data.releaseChannel} id="releaseChannel">
          <option value="ALPHA"
            >{$_('pages.settings.platform.inputs.release-channel.alpha')}</option>
          <option value="BETA">{$_('pages.settings.platform.inputs.release-channel.beta')}</option>
          <option value="RELEASE"
            >{$_('pages.settings.platform.inputs.release-channel.stable')}</option>
        </select>

        {#if data.releaseChannel && data.releaseChannel !== 'RELEASE'}
          <div class="alert alert-warning mt-2" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>
            {@html $_('pages.settings.platform.release-channel-warning')}
            {#if data.releaseChannel === 'BETA'}
              <br />
              {@html $_('pages.settings.platform.release-channel-warning-beta')}
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <button
      class="btn btn-secondary"
      class:disabled={savePreferencesLoading || preferencesSaveDisabled}
      aria-disabled={savePreferencesLoading || preferencesSaveDisabled}
      on:click={onSavePreferencesClick}
      >{$_('buttons.save')}
    </button>
  </div>
</div>

{#if mailError}
  <!-- Error Alert -->
  <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    {$_('pages.settings.platform.smtp.email-validation-error', {
      values: { mailError },
    })}
  </div>
{/if}

<div class="card">
  <div class="card-header">
    <div class="form-check form-switch">
      <input
        class="form-check-input"
        type="checkbox"
        id="smtpToggle"
        bind:checked={$siteInfo.emailEnabled}
        on:change={onToggleSmtp}
        disabled={toggleSmtpLoading} />
      <label class="form-check-label" for="smtpToggle"
        >{$_('pages.settings.platform.smtp-settings')}</label>
    </div>
  </div>
  <div class="card-body" class:opacity-50={smtpDisabled}>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="mailUsername"
        >{$_('pages.settings.platform.smtp.username')}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="mailUsername"
          type="text"
          placeholder="no-reply"
          bind:value={data.email.username}
          disabled={smtpDisabled} />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="mailUserPassword"
        >{$_('pages.settings.platform.smtp.password')}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="mailUserPassword"
          placeholder="****************"
          bind:value={data.email.password}
          type="password"
          disabled={smtpDisabled} />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="useSSLCheck">
        {$_('pages.settings.platform.smtp.ssl')}
      </label>
      <div class="col-md-6">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            name="useSSLCheck"
            id="useSSLCheck"
            aria-checked={data.email.ssl}
            bind:checked={data.email.ssl}
            disabled={smtpDisabled} />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="port"
        >{$_('pages.settings.platform.smtp.tls-setting')}</label>
      <div class="col-md-6">
        <select
          class="form-select"
          id="port"
          bind:value={data.email.starttls}
          disabled={smtpDisabled}>
          <option value="REQUIRED">REQUIRED</option>
          <option value="OPTIONAL">OPTIONAL</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="senderAddress"
        >{$_('pages.settings.platform.smtp.sender-address')}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="senderAddress"
          type="text"
          placeholder="no-reply@forexample.com"
          bind:value={data.email.sender}
          disabled={smtpDisabled} />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="hostAddress"
        >{$_('pages.settings.platform.smtp.hostname')}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="hostAddress"
          type="text"
          placeholder="smtp.forexample.com"
          bind:value={data.email.hostname}
          disabled={smtpDisabled} />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="port"
        >{$_('pages.settings.platform.smtp.port')}</label>
      <div class="col-md-6">
        <input
          class="form-control"
          id="port"
          placeholder="465"
          type="number"
          bind:value={data.email.port}
          disabled={smtpDisabled} />
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="port"
        >{$_('pages.settings.platform.smtp.auth-methods')}</label>
      <div class="col-md-6">
        <select class="form-select" bind:value={data.email.authMethods} disabled={smtpDisabled}>
          <option value="PLAIN">PLAIN</option>
          <option value=""></option>
        </select>
      </div>
    </div>

    <button
      class="btn btn-secondary"
      on:click={onSaveSmtpClick}
      disabled={saveEmailLoading || !mailValidated || smtpDisabled}
      >{$_(!$siteInfo.emailEnabled ? 'buttons.enable' : 'buttons.save')}
    </button>
    {#if !mailValidated && !emailSaveDisabled}
      <button
        class="btn btn-outline-primary"
        on:click={onValidateEmailClick}
        disabled={saveEmailLoading || smtpDisabled}
        >{$_('buttons.validate')}
        {#if saveEmailLoading}
          <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
        {/if}
      </button>
    {/if}
  </div>
</div>

<ConfirmRemovePanoAccountModal />
<ConfirmDisableEmailModal />
<ConfirmStopPanoModal />
<ConfirmRestartPanoModal />

<script context="module">
  import { base } from '$app/paths';
  import ApiUtil from '$lib/api.util.js';

  export const UpdatePeriod = Object.freeze({
    NEVER: 'NEVER',
    ONCE_PER_DAY: 'ONCE_PER_DAY',
    ONCE_PER_WEEK: 'ONCE_PER_WEEK',
    ONCE_PER_MONTH: 'ONCE_PER_MONTH',
  });

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const queryParams = buildQueryParams({
      type: 'GENERAL',
    });

    const body = await ApiUtil.get({
      path: '/api/panel/settings' + queryParams,
      request: event,
    });

    body.oldSettings = structuredClone(body);

    const failed = searchParams.get('failed');
    const encodedData = searchParams.get('encodedData');
    const state = searchParams.get('state');

    return { ...body, platformConnectFailed: failed, encodedData, state };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import { buildQueryParams } from '$lib/api.util.js';
  import { currentLanguage } from '$lib/language.util.js';

  import { show as showToast } from '$lib/component/ToastContainer.svelte';
  import { changeLanguage, getLanguageByLocale, Languages } from '$lib/language.util';

  import ConfirmRemovePanoAccountModal, {
    show as showConfirmRemovePanoAccountModal,
  } from '$lib/component/modals/ConfirmRemovePanoAccountModal.svelte';

  import ConfirmDisableEmailModal, {
    show as showConfirmDisableEmailModal,
  } from '$lib/component/modals/ConfirmDisableEmailModal.svelte';
  import ConfirmStopPanoModal, {
    show as showConfirmStopPanoModal,
  } from '$lib/component/modals/ConfirmStopPanoModal.svelte';
  import ConfirmRestartPanoModal, {
    show as showConfirmRestartPanoModal,
  } from '$lib/component/modals/ConfirmRestartPanoModal.svelte';
  import PageActions from '$lib/component/PageActions.svelte';

  const pageTitle = getContext('pageTitle');
  const siteInfo = getContext('siteInfo');

  pageTitle.set('pages.settings.platform.title');

  export let data;

  // Backwards-compatible default (stable) in case older servers don't send this field.
  data.releaseChannel = data.releaseChannel || 'RELEASE';
  if (data?.oldSettings) {
    data.oldSettings.releaseChannel = data.oldSettings.releaseChannel || data.releaseChannel;
  }

  let savePreferencesLoading;
  let saveEmailLoading;
  let connecting = !data.panoAccount && data.state && data.encodedData;
  let disconnecting;
  let mailValidated;
  let mailError;
  let toggleSmtpLoading;

  $: preferencesSaveDisabled =
    data.oldSettings.updatePeriod === data.updatePeriod &&
    data.oldSettings.releaseChannel === data.releaseChannel &&
    data.oldSettings.locale === data.locale &&
    data.oldSettings.allowUserLocaleSelection === data.allowUserLocaleSelection &&
    data.oldSettings.developmentMode === data.developmentMode;

  $: emailSaveDisabled =
    JSON.stringify(data.oldSettings.email) === JSON.stringify(data.email) || !data.email.password;

  let smtpDisabled;

  $: {
    smtpDisabled = !$siteInfo.emailEnabled;
  }

  if (browser) {
    if (!data.panoAccount && data.state && data.encodedData) {
      ApiUtil.post({
        path: '/api/panel/platform/connect',
        body: {
          encodedData: data.encodedData,
          state: data.state,
        },
        handler: async (body, reject) => {
          if (body.error) {
            if (body.error === 'ALREADY_CONNECTED_TO_PANO') {
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
          await showToast('components.toasts.pano-account-connect-success');

          connecting = false;
        },
      });
    }
  }

  function onConnectClick() {
    connecting = true;

    ApiUtil.post({
      path: '/api/panel/platform/code',
      handler: async (body, reject) => {
        if (body.error) {
          location.reload();
          return;
        }

        const { publicKey, state } = body;

        // Encode dynamic parts to ensure the URL is safe
        const encodedPublicKey = encodeURIComponent(publicKey);
        const encodedRedirectUrl = encodeURIComponent($page.url.origin + $page.url.pathname);
        const encodedState = encodeURIComponent(state);

        // Redirect to the constructed URL
        window.location = `${PANO_WEBSITE_URL}/auth?loginPanoPlatform=${encodedPublicKey}&redirectUrl=${encodedRedirectUrl}&state=${encodedState}&hl=${$currentLanguage.code}`;
      },
    });
  }

  function onDisconnectClick() {
    showConfirmRemovePanoAccountModal(() => {
      disconnecting = true;

      ApiUtil.post({
        path: '/api/panel/platform/disconnect',
        handler: async (body, reject) => {
          if (body.error) {
            if (body.error === 'PANO_CONNECT_FAILED') {
              await showToast('components.toasts.pano-account-disconnect-fail-cant-connect');
            } else {
              await showToast('components.toasts.pano-account-disconnect-fail');
            }

            disconnecting = false;
            return;
          }

          await showToast('components.toasts.pano-account-disconnect-success');

          data.panoAccount = null;

          disconnecting = false;
        },
      });
    });
  }

  function onSavePreferencesClick() {
    savePreferencesLoading = true;

    const formData = new FormData();

    formData.append('updatePeriod', data.updatePeriod);
    formData.append('releaseChannel', data.releaseChannel);
    formData.append('locale', data.locale);
    formData.append('allowUserLocaleSelection', data.allowUserLocaleSelection);
    formData.append('developmentMode', data.developmentMode);

    ApiUtil.put({
      path: '/api/panel/settings',
      body: formData,
      handler: async (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        savePreferencesLoading = false;

        data.oldSettings = Object.keys(data)
          .filter((key) => key !== 'oldSettings')
          .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
          }, {});

        if (!$siteInfo.userLocaleCode) {
          await changeLanguage(getLanguageByLocale(data.locale));
        }

        await invalidateAll();

        siteInfo.update((info) => ({
          ...info,
          developmentMode: data.developmentMode,
          locale: data.locale,
          allowUserLocaleSelection: data.allowUserLocaleSelection,
        }));

        await showToast('components.toasts.settings-save-success');
      },
    });
  }

  function onValidateEmailClick() {
    saveEmailLoading = true;
    mailError = null;

    ApiUtil.post({
      path: '/api/panel/settings/verify/mail',
      body: data.email,
      handler: async (body, reject) => {
        saveEmailLoading = false;

        if (body.error) {
          mailError = body.mailError;

          return;
        }

        mailValidated = true;

        await showToast('components.toasts.email-config-validate-success');
      },
    });
  }

  function onSaveSmtpClick() {
    saveEmailLoading = true;

    const formData = new FormData();

    const { hostname, port, ssl, starttls, username, password, sender, authMethods } = data.email;

    formData.append(
      'email',
      JSON.stringify({
        enabled: true,
        hostname: hostname || '',
        port: port || 3306,
        ssl: ssl || false,
        starttls: starttls || 'DISABLED',
        username: username || '',
        password: password || '',
        sender: sender || '',
        authMethods: authMethods || '',
      }),
    );

    ApiUtil.put({
      path: '/api/panel/settings',
      body: formData,
      handler: async (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        saveEmailLoading = false;
        mailValidated = false;

        data.oldSettings.email = Object.keys(data.email).reduce((obj, key) => {
          obj[key] = data.email[key];
          return obj;
        }, {});

        const enabled = $siteInfo.emailEnabled;

        await invalidateAll();

        if (enabled) {
          await showToast('components.toasts.settings-save-success');
        } else {
          await showToast('components.toasts.smtp-enabled-success');
        }
      },
    });
  }

  function maskEmail(email) {
    const [localPart, domain] = email.split('@');

    const maskedLocal =
      localPart.length <= 3
        ? `${localPart[0]}**`
        : `${localPart.substring(0, 2)}${'*'.repeat(localPart.length - 2)}`;

    const domainParts = domain.split('.');
    const maskedDomain = `${domainParts[0][0]}${'*'.repeat(domainParts[0].length - 1)}.${domainParts.slice(1).join('.')}`;

    return `${maskedLocal}@${maskedDomain}`;
  }

  function onToggleSmtp(event) {
    if (!event.target.checked) {
      $siteInfo.emailEnabled = true;
      showConfirmDisableEmailModal(() => {
        toggleSmtpLoading = true;

        mailValidated = false;
        saveEmailLoading = true;

        const formData = new FormData();
        formData.append(
          'email',
          JSON.stringify({
            enabled: false,
            hostname: '',
            port: 0,
            ssl: false,
            starttls: 'DISABLED',
            username: '',
            password: '',
            sender: '',
            authMethods: '',
          }),
        );

        ApiUtil.put({
          path: '/api/panel/settings',
          body: formData,
          handler: async (body, reject) => {
            if (body.error) {
              reject();

              return;
            }

            saveEmailLoading = false;

            await invalidateAll();

            if (smtpDisabled) {
              await showToast('components.toasts.smtp-disabled-success');
            } else {
              await showToast('components.toasts.smtp-enabled-success');
            }

            toggleSmtpLoading = false;
            smtpDisabled = !event.target.checked;
          },
        });
      });

      return;
    }

    toggleSmtpLoading = false;
  }

  function onStopPanoClick() {
    showConfirmStopPanoModal();
  }

  function onRestartPanoClick() {
    showConfirmRestartPanoModal();
  }
</script>
