<style>
  .connect-account-board {
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
  }

  :global([data-bs-theme='light']) .connect-account-board {
    --welcome-gradient: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.95) 20%,
      rgba(255, 255, 255, 0.5) 100%
    );
  }

  :global([data-bs-theme='dark']) .connect-account-board,
  :global([data-bs-theme='copper']) .connect-account-board {
    --welcome-gradient: linear-gradient(
      90deg,
      rgba(20, 22, 25, 0.95) 20%,
      rgba(20, 22, 25, 0.5) 100%
    );
  }

  @media (max-width: 991.98px) {
    .connect-account-board {
      --welcome-gradient: linear-gradient(
        180deg,
        rgba(var(--bs-body-bg-rgb), 0.95) 40%,
        rgba(var(--bs-body-bg-rgb), 0.8) 100%
      ) !important;
    }
  }

  .connect-account-board .alert-link {
    text-decoration: none;
  }

  .connect-account-board.interactive {
    cursor: pointer;
  }
</style>

{#if !data.panoAccount && data.platformConnectFailed}
  <!-- Error Alert -->
  <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label={$_('buttons.close')}
    ></button>
    {$_('pages.settings.platform.connect-failed-alert')}
  </div>
{/if}

<PageActions leftClasses="d-lg-flex d-none" middleClasses="d-none d-lg-flex">
  <div class="hstack gap-2" slot="right">
    <button
      class="btn btn-link link-danger"
      title={$_('buttons.stop')}
      aria-label={$_('buttons.stop')}
      data-bs-target={$_('buttons.stop')}
      on:click={onStopPanoClick}>
      <i class="fas fa-stop"></i>
    </button>
    <button class="btn btn-secondary" on:click={onRestartPanoClick}>
      <i class="fa-regular fa-arrows-rotate"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.restart')}</span>
    </button>
  </div>
</PageActions>

{#if showAlert}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="alert alert-secondary connect-account-board border mb-0 focus-ring"
    class:interactive={!data.panoAccount && !connecting}
    role="alert"
    on:click={!data.panoAccount && !connecting ? onConnectClick : null}
    style="background-image: var(--welcome-gradient), url('{base}/assets/img/connect-pano-bg.png');">
    <div class="row align-items-center">
      <div class="col-lg-9">
        <h5 class="alert-heading mb-2">
          <i class="fa-solid fa-user-circle me-2"></i>
          {data.panoAccount
            ? data.panoAccount.username
            : $_('pages.settings.platform.online-account')}
        </h5>
        <p
          class="mb-0"
          class:text-success-emphasis={data.panoAccount}
          class:text-body={!data.panoAccount}>
          {data.panoAccount
            ? $_('pages.settings.platform.connected-account-description')
            : $_('pages.settings.platform.connect-online-account-alert')}
        </p>
      </div>
      <div class="col-lg-3 text-lg-end mt-3 mt-lg-0">
        {#if data.panoAccount}
          <div class="hstack gap-2 justify-content-lg-end">
            <span class="badge text-bg-gray">{maskEmail(data.panoAccount.email)}</span>
            <button
              type="button"
              class="btn-close"
              title={$_('buttons.remove')}
              aria-label={$_('buttons.remove')}
              on:click={onDisconnectClick}
              disabled={disconnecting}></button>
          </div>
        {:else}
          <div class="alert-link rounded border-0 bg-transparent p-0">
            {connecting ? $_('buttons.connecting') : $_('buttons.connect')}

            {#if connecting}
              <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
            {:else}
              <i class="fa-solid fa-arrow-right ms-1"></i>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<div class="card">
  <div class="card-header">
    {$_('pages.settings.platform.preferences')}
  </div>
  <div class="card-body">
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

        {#if $siteInfo.userLocaleCode && $siteInfo.userLocaleCode !== $siteInfo.platformLocale}
          <div class="alert alert-info mt-2 mb-0 py-2 px-3" role="alert">
            <i class="fa-solid fa-circle-info me-1"></i>
            <small>{$_('pages.settings.platform.user-locale-mismatch-warning')}</small>
          </div>
        {/if}
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
      disabled={savePreferencesLoading || preferencesSaveDisabled}
      on:click={onSavePreferencesClick}
      >{$_('buttons.save')}
    </button>
  </div>
</div>

<div class="card">
  <div class="card-header">
    {$_('pages.settings.platform.authentication')}
  </div>
  <div class="card-body">
    <div class="row">
      <label class="col-md-6" for="requireEmailVerification">
        {$_('pages.settings.platform.auth.require-email-verification')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.auth.require-email-verification-sub')}
        </small>
      </label>
      <div class="col d-flex align-items-center">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="requireEmailVerification"
            autocomplete="off"
            disabled={smtpDisabled}
            bind:checked={data.requireEmailVerification} />
        </div>
      </div>
    </div>

    {#if smtpDisabled}
      <div class="alert alert-warning mt-3" role="alert">
        <div class="d-flex align-items-center">
          <i class="fa-solid fa-triangle-exclamation me-3"></i>
          <div>
            {@html $_('pages.settings.platform.auth.email-disabled-warning')}
          </div>
        </div>
      </div>
    {:else if !data.requireEmailVerification}
      <div class="alert alert-warning mt-3" role="alert">
        <div class="d-flex align-items-center">
          <i class="fa-solid fa-triangle-exclamation me-3"></i>
          <div>
            {$_('pages.settings.platform.auth.require-email-verification-warning')}
          </div>
        </div>
      </div>
    {/if}

    <hr />

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="passwordHashAlgorithm">
        {$_('pages.settings.platform.auth.password-hash-algorithm')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.auth.password-hash-algorithm-sub')}
        </small>
      </label>
      <div class="col-md-6">
        <select
          class="form-control"
          id="passwordHashAlgorithm"
          bind:value={data.passwordHashAlgorithm}>
          <option value="ARGON2ID"
            >Argon2id ({$_('pages.settings.platform.auth.recommended')})</option>
          <option value="BCRYPT">BCrypt</option>
          <option value="SHA256">SHA-256</option>
          <option value="MD5">MD5</option>
        </select>
      </div>
    </div>

    {#if data.passwordHashAlgorithm === 'MD5'}
      <div class="alert alert-danger mt-2">
        <div class="hstack gap-3">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div>
            {$_('pages.settings.platform.auth.password-hash-algorithm-warning')}
          </div>
        </div>
      </div>
    {/if}

    <div class="mt-3">
      <button
        class="btn btn-secondary"
        disabled={saveAuthLoading || authSaveDisabled}
        on:click={onSaveAuthClick}
        >{$_('buttons.save')}
      </button>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-header d-flex align-items-center justify-content-between gap-3">
    <!-- form-switch without form-check, laid out as a centred flex row: Bootstrap's default
         floats the switch onto the label's first line, which reads as misaligned once the label
         carries a description under it. ps-0/ms-0/mt-0 undo the offsets that layout relies on. -->
    <div class="form-switch ps-0 d-flex align-items-center gap-2">
      <input
        class="form-check-input mt-0 ms-0 flex-shrink-0"
        type="checkbox"
        role="switch"
        id="maintenanceToggle"
        autocomplete="off"
        title={$_('pages.settings.platform.maintenance.enabled')}
        bind:checked={data.maintenance.enabled}
        on:change={onToggleMaintenance}
        disabled={toggleMaintenanceLoading} />
      <label class="form-check-label mb-0" for="maintenanceToggle">
        {$_('pages.settings.platform.maintenance.title')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.maintenance.enabled-sub')}
        </small>
      </label>
    </div>

    {#if toggleMaintenanceLoading}
      <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
    {/if}
  </div>
  <div class="card-body" class:opacity-50={maintenanceDisabled}>
    {#if !maintenanceDisabled}
      <div class="alert alert-danger border mb-3" role="alert">
        <div class="d-flex align-items-center">
          <i class="fa-solid fa-triangle-exclamation me-3"></i>
          <div>
            {$_('pages.settings.platform.maintenance.active-warning')}
          </div>
        </div>
      </div>
    {/if}

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="maintenanceShowLoginButton">
        {$_('pages.settings.platform.maintenance.show-login-button')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.maintenance.show-login-button-sub')}
        </small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="maintenanceShowLoginButton"
            autocomplete="off"
            bind:checked={data.maintenance.showLoginButton}
            disabled={maintenanceDisabled} />
        </div>
      </div>
    </div>

    <!-- A secret address only makes sense as the alternative to a visible button, so the field
         belongs to the button being off. With the button on, the login is simply at /login. -->
    <div class="row mb-3">
      <label class="col-md-6 col-form-label position-relative" for="maintenanceCustomLoginUrl">
        <span
          class="position-absolute start-0 top-0 bottom-0 border-start border-2"
          class:border-secondary={!customLoginUrlDisabled}
          class:border-gray={customLoginUrlDisabled}
          style="width: 2px;"></span>
        <span class="ps-3 d-block">
          {$_('pages.settings.platform.maintenance.custom-login-url')}
          <small class="d-block text-muted">
            {$_('pages.settings.platform.maintenance.custom-login-url-sub')}
          </small>
        </span>
      </label>
      <div class="col-md-6">
        <input
          class="form-control font-monospace"
          class:border-danger={!!customLoginUrlError}
          id="maintenanceCustomLoginUrl"
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="/login"
          bind:value={data.maintenance.customLoginUrl}
          disabled={customLoginUrlDisabled} />

        {#if customLoginUrlError}
          <div class="small text-danger mt-1">{$_(customLoginUrlError)}</div>
        {/if}
      </div>
    </div>

    <hr />

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="maintenancePermissionNode">
        {$_('pages.settings.platform.maintenance.permission-node')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.maintenance.permission-node-sub')}
        </small>
      </label>
      <div class="col-md-6">
        <!-- Empty means the default panel-access node, which the placeholder spells out; a
             separate mode selector would only say the same thing twice. -->
        <PermissionNodeInput
          id="maintenancePermissionNode"
          bind:value={data.maintenance.bypassPermissionNode}
          disabled={maintenanceDisabled}
          invalid={!!bypassPermissionNodeError}
          maxlength={128}
          placeholder={data.defaultBypassPermissionNode || ''} />

        {#if bypassPermissionNodeError}
          <div class="small text-danger mt-1">{$_(bypassPermissionNodeError)}</div>
        {/if}
      </div>
    </div>

    <hr />

    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="maintenanceShowSiteLogo">
        {$_('pages.settings.platform.maintenance.show-site-logo')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.maintenance.show-site-logo-sub')}
        </small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="maintenanceShowSiteLogo"
            autocomplete="off"
            bind:checked={data.maintenance.showSiteLogo}
            disabled={maintenanceDisabled} />
        </div>
      </div>
    </div>

    <div class="hstack gap-3 flex-wrap mb-3">
      <!-- Deliberately live while maintenance is off: writing the page you will show is exactly
           the thing you want to do before you take the site down, and the modal previews it. -->
      <button
        type="button"
        class="btn btn-link p-0 text-decoration-none"
        on:click={onEditMaintenancePageClick}>
        <i class="fas fa-pencil me-1"></i>
        {$_('pages.settings.platform.maintenance.edit-page')}
      </button>
      <!-- Exiting first drops the bypass cookie, so the maintenance page is what actually renders. -->
      <a
        class="btn btn-link p-0 text-decoration-none"
        href="/api/maintenance/exit"
        target="_blank"
        rel="noopener noreferrer"
        class:disabled={maintenanceDisabled}
        aria-disabled={maintenanceDisabled}>
        <i class="fas fa-external-link me-1"></i>
        {$_('pages.settings.platform.maintenance.preview-page')}
      </a>
    </div>

    <button
      class="btn btn-secondary"
      disabled={saveMaintenanceLoading || maintenanceSaveDisabled}
      on:click={onSaveMaintenanceClick}
      >{$_('buttons.save')}
      {#if saveMaintenanceLoading}
        <span class="spinner-border spinner-border-sm text-primary ms-2" role="status"></span>
      {/if}
    </button>
  </div>

  <!-- Bans outlive maintenance mode, so this stays usable while the card body is greyed out. -->
  <div class="card-footer">
    <button
      type="button"
      class="btn btn-link text-decoration-none p-0 text-start w-100 d-flex align-items-center justify-content-between gap-2"
      on:click={onOpenBannedIpsClick}>
      <span>
        <i class="fa-solid fa-ban me-2 opacity-75"></i>
        {$_('pages.settings.platform.maintenance.banned-ips.title')}
        {#if bannedIpCount > 0}
          <span class="badge text-bg-danger ms-2">{bannedIpCount}</span>
        {/if}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.maintenance.banned-ips.sub')}
        </small>
      </span>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
</div>

{#if mailError}
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
    {#if smtpDisabled}
      <div class="alert alert-warning border mb-3" role="alert">
        <div class="d-flex align-items-center">
          <i class="fa-solid fa-triangle-exclamation me-3"></i>
          <div>
            {@html $_('pages.settings.platform.smtp.smtp-disabled-alert')}
          </div>
        </div>
      </div>
    {/if}

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
      <label class="col-md-6 col-form-label" for="authMethods"
        >{$_('pages.settings.platform.smtp.auth-methods')}</label>
      <div class="col-md-6">
        <select
          class="form-select"
          id="authMethods"
          bind:value={data.email.authMethods}
          disabled={smtpDisabled}>
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

<EditMaintenancePageModal />
<MaintenanceBannedIpsModal />
<ConfirmSaveCriticalSettingsModal />
<ConfirmRemovePanoAccountModal />
<ConfirmDisableEmailModal />
<ConfirmStopPanoModal />
<ConfirmRestartPanoModal runMode={data.runMode} />

<script context="module">
  import { base } from '$app/paths';
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';

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

    const [generalSettings, authSettings, maintenanceSettings] = await Promise.all([
      ApiUtil.get({
        path: '/api/panel/settings' + buildQueryParams({ type: 'GENERAL' }),
        request: event,
      }),
      ApiUtil.get({
        path: '/api/panel/settings' + buildQueryParams({ type: 'AUTH' }),
        request: event,
      }),
      ApiUtil.get({
        path: '/api/panel/settings' + buildQueryParams({ type: 'MAINTENANCE' }),
        request: event,
      }),
    ]);

    const body = { ...generalSettings, ...authSettings, ...maintenanceSettings };

    body.oldSettings = structuredClone(body);

    const failed = searchParams.get('failed');
    const encodedData = searchParams.get('encodedData');
    const state = searchParams.get('state');

    return { ...body, platformConnectFailed: failed, encodedData, state };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import { currentLanguage } from '$lib/language.util.js';

  import {
    showSuccess as showSuccessToast,
    showError as showErrorToast,
  } from '$lib/components/ToastContainer.svelte';
  import { changeLanguage, getLanguageByLocale, Languages } from '$lib/language.util';

  import ConfirmRemovePanoAccountModal, {
    show as showConfirmRemovePanoAccountModal,
  } from '$lib/components/modals/ConfirmRemovePanoAccountModal.svelte';

  import ConfirmDisableEmailModal, {
    show as showConfirmDisableEmailModal,
  } from '$lib/components/modals/ConfirmDisableEmailModal.svelte';
  import ConfirmStopPanoModal, {
    show as showConfirmStopPanoModal,
  } from '$lib/components/modals/ConfirmStopPanoModal.svelte';
  import ConfirmRestartPanoModal, {
    show as showConfirmRestartPanoModal,
  } from '$lib/components/modals/ConfirmRestartPanoModal.svelte';
  import EditMaintenancePageModal, {
    show as showEditMaintenancePageModal,
  } from '$lib/components/modals/EditMaintenancePageModal.svelte';
  import MaintenanceBannedIpsModal, {
    show as showMaintenanceBannedIpsModal,
  } from '$lib/components/modals/MaintenanceBannedIpsModal.svelte';
  import ConfirmSaveCriticalSettingsModal, {
    show as showConfirmSaveCriticalSettingsModal,
    setError as setSaveCriticalSettingsError,
    setLoading as setSaveCriticalSettingsLoading,
    hide as hideSaveCriticalSettingsModal,
  } from '$lib/components/modals/ConfirmSaveCriticalSettingsModal.svelte';
  // Mounted once globally in AppLayout, so only the opener is imported here.
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import PermissionNodeInput from '$lib/components/PermissionNodeInput.svelte';

  import {
    normalizeLoginUrl,
    normalizeMaintenanceHtml,
    validateBypassPermissionNode,
    validateCustomLoginUrl,
  } from '$lib/maintenance.util.js';

  const pageTitle = getContext('pageTitle');
  const siteInfo = getContext('siteInfo');

  pageTitle.set('pages.settings.platform.title');

  export let data;

  let smtpDisabled;

  $: {
    smtpDisabled = !$siteInfo.emailEnabled;
  }

  let showAlert = false;

  onMount(() => {
    if (browser) {
      if (data.panoAccount) {
        showAlert = true;
      } else if (!localStorage.getItem('connect_online_account_alert_seen')) {
        showAlert = true;
      }
    }
  });

  // Backwards-compatible default (stable) in case older servers don't send this field.
  data.releaseChannel = data.releaseChannel || 'RELEASE';
  if (data?.oldSettings) {
    data.oldSettings.releaseChannel = data.oldSettings.releaseChannel || data.releaseChannel;
  }

  // The wire contract is frozen; older servers that don't send it still get a complete object.
  const DEFAULT_MAINTENANCE = Object.freeze({
    enabled: false,
    bypassPermissionNode: '',
    showLoginButton: true,
    customLoginUrl: '',
    showSiteLogo: true,
    title: '',
    messageHtml: '',
    customCss: '',
  });

  data.maintenance = { ...DEFAULT_MAINTENANCE, ...(data.maintenance || {}) };
  if (data?.oldSettings) {
    data.oldSettings.maintenance = {
      ...DEFAULT_MAINTENANCE,
      ...(data.oldSettings.maintenance || {}),
    };
  }

  let savePreferencesLoading;
  let saveAuthLoading;
  let saveEmailLoading;
  let connecting = !data.panoAccount && data.state && data.encodedData;
  let disconnecting;
  let mailValidated;
  let mailError;
  let toggleSmtpLoading;
  let saveMaintenanceLoading;
  let toggleMaintenanceLoading;

  // Null until the modal reports a fresher figure; the loaded settings own the badge until then.
  let bannedIpsCount = null;

  $: preferencesSaveDisabled =
    data.oldSettings.updatePeriod === data.updatePeriod &&
    data.oldSettings.releaseChannel === data.releaseChannel &&
    data.oldSettings.locale === data.locale &&
    data.oldSettings.allowUserLocaleSelection === data.allowUserLocaleSelection &&
    data.oldSettings.developmentMode === data.developmentMode;

  $: authSaveDisabled =
    data.oldSettings.requireEmailVerification === data.requireEmailVerification &&
    data.oldSettings.passwordHashAlgorithm === data.passwordHashAlgorithm;

  $: emailSaveDisabled =
    JSON.stringify(data.oldSettings.email) === JSON.stringify(data.email) || !data.email.password;

  // invalidateAll() swaps `data` for a fresh payload, so re-apply the defaults on every load.
  $: if (!data.maintenance) {
    data.maintenance = { ...DEFAULT_MAINTENANCE };
  }

  $: if (data.oldSettings && !data.oldSettings.maintenance) {
    data.oldSettings.maintenance = { ...DEFAULT_MAINTENANCE };
  }

  $: maintenanceDisabled = !data.maintenance.enabled;

  $: customLoginUrlDisabled = maintenanceDisabled || data.maintenance.showLoginButton;

  $: customLoginUrlError = data.maintenance.showLoginButton
    ? null
    : validateCustomLoginUrl(data.maintenance.customLoginUrl);

  // Blank is the documented way to ask for the default panel-access node, so it is never an error.
  $: bypassPermissionNodeError = validateBypassPermissionNode(
    data.maintenance.bypassPermissionNode,
    false,
  );

  $: maintenanceSaveDisabled =
    JSON.stringify(data.oldSettings.maintenance) === JSON.stringify(data.maintenance) ||
    !!customLoginUrlError ||
    !!bypassPermissionNodeError;

  $: bannedIpCount = bannedIpsCount ?? data.maintenanceBannedIpCount ?? 0;

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
          await showSuccessToast('components.toasts.pano-account-connect-success');

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
              await showErrorToast('components.toasts.pano-account-disconnect-fail-cant-connect');
            } else {
              await showErrorToast('components.toasts.pano-account-disconnect-fail');
            }

            disconnecting = false;
            return;
          }

          await showSuccessToast('components.toasts.pano-account-disconnect-success');

          data.panoAccount = null;

          await invalidateAll();

          disconnecting = false;
        },
      });
    });
  }

  async function onSavePreferencesClick() {
    if ($siteInfo?.isDemo) {
      data.oldSettings = Object.keys(data)
        .filter((key) => key !== 'oldSettings')
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      if (!$siteInfo.userLocaleCode) {
        await changeLanguage(getLanguageByLocale(data.locale));
      }

      siteInfo.update((info) => ({
        ...info,
        developmentMode: data.developmentMode,
        locale: data.locale,
        allowUserLocaleSelection: data.allowUserLocaleSelection,
      }));

      await showSuccessToast('components.toasts.settings-save-success');
      return;
    }

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

        await showSuccessToast('components.toasts.settings-save-success');
      },
    });
  }

  function onSaveAuthClick() {
    saveAuthLoading = true;

    const formData = new FormData();
    formData.append('requireEmailVerification', data.requireEmailVerification);
    formData.append('passwordHashAlgorithm', data.passwordHashAlgorithm);

    ApiUtil.put({
      path: '/api/panel/settings',
      body: formData,
      handler: async (body, reject) => {
        if (body.error) {
          reject();
          return;
        }

        saveAuthLoading = false;

        data.oldSettings.requireEmailVerification = data.requireEmailVerification;
        data.oldSettings.passwordHashAlgorithm = data.passwordHashAlgorithm;

        await invalidateAll();

        await showSuccessToast('components.toasts.settings-save-success');
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

        await showSuccessToast('components.toasts.email-config-validate-success');
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
          await showSuccessToast('components.toasts.settings-save-success');
        } else {
          await showSuccessToast('components.toasts.smtp-enabled-success');
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
              await showSuccessToast('components.toasts.smtp-disabled-success');
            } else {
              await showSuccessToast('components.toasts.smtp-enabled-success');
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

  // The page editor writes the template files itself; nothing of it comes back through the card.
  function onEditMaintenancePageClick() {
    showEditMaintenancePageModal({ showSiteLogo: data.maintenance.showSiteLogo });
  }

  function onOpenBannedIpsClick() {
    showMaintenanceBannedIpsModal(bannedIpCount, (count) => {
      bannedIpsCount = count;
      data.maintenanceBannedIpCount = count;
    });
  }

  /** Serialises an already resolved settings object; the caller decides where it comes from. */
  function buildMaintenanceFormData(maintenance, password) {
    const formData = new FormData();

    if (password != null) {
      formData.append('password', password);
    }

    formData.append(
      'maintenance',
      JSON.stringify({
        enabled: !!maintenance.enabled,
        bypassPermissionNode: String(maintenance.bypassPermissionNode || '').trim(),
        showLoginButton: !!maintenance.showLoginButton,
        customLoginUrl: normalizeLoginUrl(maintenance.customLoginUrl),
        showSiteLogo: !!maintenance.showSiteLogo,
        title: String(maintenance.title || '').trim(),
        messageHtml: normalizeMaintenanceHtml(maintenance.messageHtml),
        customCss: String(maintenance.customCss || ''),
      }),
    );

    return formData;
  }

  /** What the card currently shows. */
  function currentMaintenanceSettings() {
    return { ...data.maintenance };
  }

  /** The last settings the server confirmed, detached from the live card. */
  function maintenanceSnapshot() {
    // structuredClone because onSavePreferencesClick() rebuilds `oldSettings` with a shallow
    // copy, which can leave `oldSettings.maintenance` pointing at the very object the card edits.
    return structuredClone({
      ...DEFAULT_MAINTENANCE,
      ...(data.oldSettings?.maintenance || {}),
    });
  }

  /** i18n key of the first saved maintenance value the platform would refuse, if any. */
  function maintenanceSnapshotError() {
    const snapshot = maintenanceSnapshot();

    return (
      validateCustomLoginUrl(snapshot.customLoginUrl) ||
      validateBypassPermissionNode(snapshot.bypassPermissionNode)
    );
  }

  // The master switch is a one-field write: everything else comes from the last saved state, so
  // unsaved edits in the card are never committed (and never rejected) behind the operator's back.
  function maintenanceToggleSettings(enabled) {
    const snapshot = maintenanceSnapshot();

    // Only a hand-edited config.conf can leave a value here that the platform refuses on save.
    // Sending it would fail the whole request, and this is the switch that brings the website
    // back up, so it is dropped instead — both fields are inert while maintenance is off, and
    // turning maintenance on is stopped earlier (onToggleMaintenance).
    if (validateCustomLoginUrl(snapshot.customLoginUrl)) {
      snapshot.customLoginUrl = '';
    }

    if (validateBypassPermissionNode(snapshot.bypassPermissionNode)) {
      snapshot.bypassPermissionNode = '';
    }

    return { ...snapshot, enabled };
  }

  function onSaveMaintenanceClick() {
    if (maintenanceSaveDisabled) {
      return;
    }

    saveMaintenanceLoading = true;

    ApiUtil.put({
      path: '/api/panel/settings',
      body: buildMaintenanceFormData(currentMaintenanceSettings()),
      handler: async (body, reject) => {
        if (body.error) {
          saveMaintenanceLoading = false;

          // A value this card sent was refused: that is not a connection problem, and the
          // network splash would hide the very form the operator has to correct.
          if (body.error === 'BAD_REQUEST') {
            await showErrorToast('errors.BAD_REQUEST');

            return;
          }

          reject();

          return;
        }

        saveMaintenanceLoading = false;

        data.oldSettings.maintenance = structuredClone(data.maintenance);

        await invalidateAll();

        await showSuccessToast('components.toasts.maintenance-save-success');
      },
    });
  }

  function onToggleMaintenance(event) {
    const enabled = event.target.checked;

    // Both directions are re-authenticated, so the switch goes back to the saved state until the
    // password is accepted — a cancelled modal must not leave it showing something the server
    // never stored.
    data.maintenance.enabled = !enabled;

    if (enabled) {
      // The switch writes the saved settings, so a saved value the platform refuses has to be
      // repaired on the card first. Turning maintenance off is never blocked this way.
      const savedError = maintenanceSnapshotError();

      if (savedError) {
        showErrorToast(savedError);

        return;
      }
    }

    showConfirmSaveCriticalSettingsModal((password) => commitMaintenanceToggle(enabled, password));
  }

  function commitMaintenanceToggle(enabled, password) {
    toggleMaintenanceLoading = true;
    setSaveCriticalSettingsLoading(true);

    ApiUtil.put({
      path: '/api/panel/settings',
      body: buildMaintenanceFormData(maintenanceToggleSettings(enabled), password),
      handler: async (body, reject) => {
        if (body.error) {
          data.maintenance.enabled = !enabled;
          toggleMaintenanceLoading = false;

          // Wrong password: keep the modal open with the field marked so it can be retyped.
          if (body.error === 'NO_PERMISSION') {
            setSaveCriticalSettingsError(true);

            return;
          }

          hideSaveCriticalSettingsModal();

          // See onSaveMaintenanceClick: a refused value is reported as such, not as a lost
          // connection with a Retry button that can only be refused again.
          if (body.error === 'BAD_REQUEST') {
            await showErrorToast('errors.BAD_REQUEST');

            return;
          }

          reject();

          return;
        }

        hideSaveCriticalSettingsModal();

        data.maintenance.enabled = enabled;

        // Only `enabled` was written: restamping the whole snapshot here would mark unsaved
        // edits as saved and disable the Save button. invalidateAll() resyncs the rest.
        data.oldSettings.maintenance = { ...maintenanceSnapshot(), enabled };

        await invalidateAll();

        await showSuccessToast('components.toasts.maintenance-save-success');

        toggleMaintenanceLoading = false;
      },
    });
  }

  function onStopPanoClick() {
    showConfirmStopPanoModal();
  }

  function onRestartPanoClick() {
    showConfirmRestartPanoModal();
  }

  function onCloseAlertClick() {
    showAlert = false;
    localStorage.setItem('connect_online_account_alert_seen', 'true');
  }
</script>
