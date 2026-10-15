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
  <div
    class="alert alert-danger alert-dismissible fade show d-flex align-items-start mb-0"
    role="alert">
    <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
    <div>{$_('pages.settings.platform.connect-failed-alert')}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label={$_('buttons.close')}
    ></button>
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
        <div class="d-flex align-items-start">
          <i class="fa-solid fa-circle-user me-3 mt-1" aria-hidden="true"></i>
          <div>
            <b>
              {data.panoAccount
                ? data.panoAccount.username
                : $_('pages.settings.platform.online-account')}
            </b>
            <div>
              {data.panoAccount
                ? $_('pages.settings.platform.connected-account-description')
                : $_('pages.settings.platform.connect-online-account-alert')}
            </div>
          </div>
        </div>
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
      <span class="col-md-6 col-form-label" id="usageModeLabel">
        {$_('pages.settings.platform.usage-mode.label')}
      </span>
      <div class="col-md-6">
        <div
          class="list-group list-group-horizontal-md"
          role="radiogroup"
          aria-labelledby="usageModeLabel">
          {#each usageModeOptions as option (option.value)}
            <button
              type="button"
              role="radio"
              aria-checked={data.usageMode === option.value}
              class="list-group-item list-group-item-action flex-fill text-start"
              class:active={data.usageMode === option.value}
              on:click={() => (data.usageMode = option.value)}>
              <span class="d-block fw-semibold">
                <i class="{option.icon} me-2"></i>{$_(option.titleKey)}
              </span>
              <small class="d-block">{$_(option.descriptionKey)}</small>
            </button>
          {/each}
        </div>
      </div>
    </div>

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
    <!-- Belongs to Development Mode: shown right under it, with the same child marker as the
         maintenance card's custom login address. -->
    {#if data.developmentMode && data.frontendSupported}
      <div class="row mb-3">
        <label class="col-md-6 col-form-label position-relative" for="platformThemeDevServer">
          <span
            class="position-absolute start-0 top-0 bottom-0 border-start border-2 border-secondary"
            style="width: 2px;"></span>
          <span class="ps-3 d-block">
            {$_('pages.settings.platform.theme-dev-server')}
            <small class="d-block text-muted">
              {$_('pages.settings.platform.theme-dev-server-hint')}
              {#if data.frontendMode !== 'THEME'}
                {$_('pages.settings.platform.theme-dev-server-inactive')}
              {/if}
            </small>
          </span>
        </label>
        <div class="col-md-6">
          <input
            class="form-control font-monospace"
            class:is-invalid={devUrlError}
            id="platformThemeDevServer"
            type="url"
            autocomplete="off"
            placeholder="http://localhost:3000"
            bind:value={data.devUrl} />
        </div>
      </div>
    {/if}
    {#if showNodeAutoUpdate && nodeAutoUpdate !== null}
      <!-- The daemon updates itself without stopping the servers it runs, so this is on by
           default; the Pano plugin needs a restart and is never automatic. Saved on its own, the
           moment it is switched. -->
      <div class="row mb-3">
        <label class="col-md-6" for="platformNodeAutoUpdate">
          {$_('pages.settings.updates.servers.auto-update')}
          <small class="d-block">
            {$_('pages.settings.updates.servers.auto-update-hint')}
          </small>
        </label>
        <div class="col d-flex align-items-center">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="platformNodeAutoUpdate"
              autocomplete="off"
              checked={nodeAutoUpdate}
              disabled={savingNodeAutoUpdate}
              on:change={(event) => saveNodeAutoUpdate(event.currentTarget.checked)} />
          </div>
        </div>
      </div>
    {/if}
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
          <div class="alert alert-info mt-2 mb-0 d-flex align-items-start" role="alert">
            <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
            <div>{$_('pages.settings.platform.user-locale-mismatch-warning')}</div>
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
          <div class="alert alert-warning mt-2 d-flex align-items-start" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>
              {@html $_('pages.settings.platform.release-channel-warning')}
              {#if data.releaseChannel === 'BETA'}
                <br />
                {@html $_('pages.settings.platform.release-channel-warning-beta')}
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="row mb-3">
      <label class="col-md-6" for="telemetryEnabled">
        {telemetryLabelParts[0]}<button
          class="btn btn-link align-baseline p-0"
          type="button"
          on:click|preventDefault|stopPropagation={onUsageDataClick}
          >{$_('pages.settings.platform.telemetry.label-link')}</button
        >{telemetryLabelParts[1] ?? ''}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.telemetry.description')}
        </small>
      </label>
      <div class="col d-flex align-items-center">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="telemetryEnabled"
            autocomplete="off"
            bind:checked={data.telemetryEnabled} />
        </div>
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
      <div class="alert alert-warning d-flex align-items-start mt-3" role="alert">
        <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{@html $_('pages.settings.platform.auth.email-disabled-warning')}</div>
      </div>
    {:else if !data.requireEmailVerification}
      <div class="alert alert-warning d-flex align-items-start mt-3" role="alert">
        <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{$_('pages.settings.platform.auth.require-email-verification-warning')}</div>
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
      <div class="alert alert-danger d-flex align-items-start mt-2">
        <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{$_('pages.settings.platform.auth.password-hash-algorithm-warning')}</div>
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
        disabled={saveMaintenanceLoading} />
      <label class="form-check-label mb-0" for="maintenanceToggle">
        {$_('pages.settings.platform.maintenance.title')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.maintenance.enabled-sub')}
        </small>
      </label>
    </div>
  </div>
  <div class="card-body" class:opacity-50={maintenanceDisabled}>
    <!-- Only once it is saved: the switch alone changes nothing for visitors. -->
    {#if maintenanceActive}
      <div class="alert alert-danger d-flex align-items-start mb-3" role="alert">
        <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{$_('pages.settings.platform.maintenance.active-warning')}</div>
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
      <!-- Everything in the card is off while maintenance mode is off (owner, 2026-10-13). -->
      <button
        type="button"
        class="btn btn-link p-0 text-decoration-none"
        disabled={maintenanceDisabled}
        on:click={onEditMaintenancePageClick}>
        <i class="fas fa-pencil me-1"></i>
        {$_('pages.settings.platform.maintenance.edit-page')}
      </button>
      <!-- The real page on the site, in a new tab. It is rendered for an admin whether or not
           maintenance mode is on, so the page can be looked at before it is switched on (the
           switch above is only a draft until it is saved). -->
      <a
        class="btn btn-link p-0 text-decoration-none"
        href="/api/v1/panel/maintenance/preview-page"
        target="_blank"
        rel="noopener noreferrer"
        class:disabled={maintenanceDisabled}
        aria-disabled={maintenanceDisabled}>
        <i class="fas fa-external-link me-1"></i>
        {$_('pages.settings.platform.maintenance.preview-page')}
      </a>
      <button
        type="button"
        class="btn btn-link p-0 text-decoration-none"
        title={$_('pages.settings.platform.maintenance.banned-ips.sub')}
        disabled={maintenanceDisabled}
        on:click={onOpenBannedIpsClick}>
        <i class="fa-solid fa-ban me-1"></i>
        {$_('pages.settings.platform.maintenance.banned-ips.title')}
        {#if bannedIpCount > 0}
          <span class="badge text-bg-danger ms-1">{bannedIpCount}</span>
        {/if}
      </button>
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
</div>

<!-- SM-35 — which alerts Pano raises, and whether each one is also sent by e-mail (§2.4.7).
     The kinds are fixed by the backend's `AlertManager`, so the card renders the list it knows
     and simply keeps whatever the settings endpoint answered for the rest. -->
{#if canManageAlerts && $usageMode !== UsageModes.WEBSITE}
  <div class="card">
    <div class="card-header">
      {$_('pages.settings.platform.alerts.title')}
      <small class="d-block text-muted">
        {$_('pages.settings.platform.alerts.description')}
      </small>
    </div>
    <div class="card-body">
      {#if !alertsSupported}
        <div class="alert alert-secondary mb-0 d-flex align-items-start" role="alert">
          <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
          <div>{$_('pages.settings.platform.alerts.unavailable')}</div>
        </div>
      {:else}
        {#if !alertsEmailAvailable}
          <div class="alert alert-warning d-flex align-items-start" role="alert">
            <i class="fa-solid fa-envelope-circle-check me-3 mt-1" aria-hidden="true"></i>
            <div>{$_('pages.settings.platform.alerts.email-unavailable')}</div>
          </div>
        {/if}

        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">{$_('pages.settings.platform.alerts.column-kind')}</th>
                <th scope="col" class="text-end">
                  {$_('pages.settings.platform.alerts.column-enabled')}
                </th>
                <th scope="col" class="text-end">
                  {$_('pages.settings.platform.alerts.column-email')}
                </th>
              </tr>
            </thead>
            <tbody>
              {#each ALERT_KINDS as kind (kind)}
                <tr>
                  <td>
                    <span class="fw-semibold">
                      {$_(`pages.settings.platform.alerts.kinds.${kind.toLowerCase()}`)}
                    </span>
                    <small class="d-block text-muted">
                      {$_(`pages.settings.platform.alerts.hints.${kind.toLowerCase()}`)}
                    </small>
                  </td>
                  <td class="text-end">
                    <div class="form-check form-switch d-inline-block m-0">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="alertEnabled-{kind}"
                        autocomplete="off"
                        aria-label={$_('pages.settings.platform.alerts.column-enabled')}
                        bind:checked={alertSettings[kind].enabled} />
                    </div>
                  </td>
                  <td class="text-end">
                    <div class="form-check form-switch d-inline-block m-0">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="alertEmail-{kind}"
                        autocomplete="off"
                        aria-label={$_('pages.settings.platform.alerts.column-email')}
                        title={alertsEmailAvailable
                          ? ''
                          : $_('pages.settings.platform.alerts.email-unavailable')}
                        disabled={!alertsEmailAvailable}
                        bind:checked={alertSettings[kind].email} />
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <button
          class="btn btn-secondary mt-3"
          on:click={onSaveAlertsClick}
          disabled={saveAlertsLoading || alertsSaveDisabled}>
          {$_('buttons.save')}
          {#if saveAlertsLoading}
            <span class="spinner-border spinner-border-sm text-primary ms-2" role="status"></span>
          {/if}
        </button>
      {/if}
    </div>
  </div>
{/if}

{#if mailError}
  <div
    class="alert alert-danger alert-dismissible fade show d-flex align-items-start mb-0"
    role="alert">
    <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
    <div>
      {$_('pages.settings.platform.smtp.email-validation-error', {
        values: { mailError },
      })}
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label={$_('buttons.close')}
    ></button>
  </div>
{/if}

<div class="card">
  <div class="card-header">
    <!-- Laid out like the maintenance card's header: the switch centred next to a title with a
         description under it. -->
    <div class="form-switch ps-0 d-flex align-items-center gap-2">
      <input
        class="form-check-input mt-0 ms-0 flex-shrink-0"
        type="checkbox"
        role="switch"
        id="smtpToggle"
        bind:checked={smtpEnabled}
        on:change={onToggleSmtp}
        disabled={toggleSmtpLoading} />
      <label class="form-check-label mb-0" for="smtpToggle">
        {$_('pages.settings.platform.smtp-settings')}
        <small class="d-block text-muted">
          {$_('pages.settings.platform.smtp-settings-sub')}
        </small>
      </label>
    </div>
  </div>
  <div class="card-body" class:opacity-50={smtpDisabled}>
    {#if smtpDisabled}
      <div class="alert alert-warning d-flex align-items-start mb-3" role="alert">
        <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{@html $_('pages.settings.platform.smtp.smtp-disabled-alert')}</div>
      </div>
    {/if}

    <!-- Everything below is off with the switch: a fieldset disables every control in it at once
         (the single `disabled` flags further down missed the Pano Mail choice and its buttons). -->
    <fieldset disabled={smtpDisabled} class="border-0 p-0 m-0" style="min-width: 0;">
      {#if panoMailStatus}
        <div
          class="btn-group w-100 mb-3"
          role="group"
          aria-label={$_('pages.settings.platform.smtp.pano-mail.choice')}>
          <button
            type="button"
            class="btn"
            class:btn-primary={mailChoice === 'pano'}
            class:btn-outline-primary={mailChoice !== 'pano'}
            aria-pressed={mailChoice === 'pano'}
            title={$_('pages.settings.platform.smtp.pano-mail.pano')}
            aria-label={$_('pages.settings.platform.smtp.pano-mail.pano')}
            on:click={() => (mailChoice = 'pano')}
            disabled={saveEmailLoading || panoMailBusy}
            >{$_('pages.settings.platform.smtp.pano-mail.pano')}</button>
          <button
            type="button"
            class="btn"
            class:btn-primary={mailChoice === 'own'}
            class:btn-outline-primary={mailChoice !== 'own'}
            aria-pressed={mailChoice === 'own'}
            title={$_('pages.settings.platform.smtp.pano-mail.own')}
            aria-label={$_('pages.settings.platform.smtp.pano-mail.own')}
            on:click={() => (mailChoice = 'own')}
            disabled={saveEmailLoading || panoMailBusy}
            >{$_('pages.settings.platform.smtp.pano-mail.own')}</button>
        </div>
      {/if}

      {#if showPanoMail}
        {#if panoMailPhase === 'connect'}
          <div class="d-flex align-items-center gap-2 mb-1">
            <b>{$_('pages.settings.platform.smtp.pano-mail.pano')}</b>
            {#if panoMailOffered?.free}
              <span class="badge text-bg-success"
                >{$_('pages.settings.platform.smtp.pano-mail.free')}</span>
            {:else if panoMailOffered?.name}
              <span class="badge text-bg-secondary">{panoMailOffered.name}</span>
            {/if}
          </div>
          {#if panoMailOffered}
            <div>
              {$_('pages.settings.platform.smtp.pano-mail.allowance', {
                values: {
                  month: panoMailOffered.mailsPerMonth.toLocaleString($currentLanguage.code),
                  day: panoMailOffered.mailsPerDay.toLocaleString($currentLanguage.code),
                },
              })}
            </div>
          {/if}
          <div class="mb-3">{$_('pages.settings.platform.smtp.pano-mail.no-setup')}</div>
          <button
            type="button"
            class="btn btn-secondary"
            title={$_('pages.settings.platform.smtp.pano-mail.connect')}
            aria-label={$_('pages.settings.platform.smtp.pano-mail.connect')}
            on:click={onConnectClick}
            disabled={connecting}>
            {$_('pages.settings.platform.smtp.pano-mail.connect')}
            {#if connecting}
              <span class="spinner-border spinner-border-sm" role="status"></span>
            {/if}
          </button>
        {:else if panoMailPhase === 'activate'}
          <div class="d-flex align-items-center gap-2 mb-1">
            <b>{$_('pages.settings.platform.smtp.pano-mail.pano')}</b>
            {#if panoMailOffered?.free}
              <span class="badge text-bg-success"
                >{$_('pages.settings.platform.smtp.pano-mail.free')}</span>
            {:else if panoMailOffered?.name}
              <span class="badge text-bg-secondary">{panoMailOffered.name}</span>
            {/if}
          </div>
          {#if panoMailOffered}
            <div>
              {$_('pages.settings.platform.smtp.pano-mail.allowance', {
                values: {
                  month: panoMailOffered.mailsPerMonth.toLocaleString($currentLanguage.code),
                  day: panoMailOffered.mailsPerDay.toLocaleString($currentLanguage.code),
                },
              })}
            </div>
          {/if}
          <div class="mb-3">{$_('pages.settings.platform.smtp.pano-mail.no-setup')}</div>
          <button
            type="button"
            class="btn btn-secondary"
            title={$_('pages.settings.platform.smtp.pano-mail.use')}
            aria-label={$_('pages.settings.platform.smtp.pano-mail.use')}
            on:click={onUsePanoMailClick}
            disabled={panoMailBusy}>
            {$_('pages.settings.platform.smtp.pano-mail.use')}
            {#if panoMailBusy}
              <span class="spinner-border spinner-border-sm" role="status"></span>
            {/if}
          </button>
        {:else if panoMailPhase === 'unreadable'}
          <div class="alert alert-warning d-flex align-items-start mb-0" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>
              <div>{$_('pages.settings.platform.smtp.pano-mail.unreadable')}</div>
              <button
                type="button"
                class="btn alert-btn mt-2"
                title={$_('buttons.retry')}
                aria-label={$_('buttons.retry')}
                on:click={onPanoMailRetryClick}
                disabled={panoMailBusy}>{$_('buttons.retry')}</button>
            </div>
          </div>
        {:else}
          {#if panoMailStatus.held}
            <div class="alert alert-danger d-flex align-items-start" role="alert">
              <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
              <div>
                <h5 class="alert-heading mb-2">
                  {$_('pages.settings.platform.smtp.pano-mail.held-title')}
                </h5>
                <div>{$_('pages.settings.platform.smtp.pano-mail.held')}</div>
              </div>
            </div>
          {/if}

          {#if panoMailPreparing}
            <div class="alert alert-info d-flex align-items-start" role="alert">
              <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
              <div>{$_('pages.settings.platform.smtp.pano-mail.preparing')}</div>
            </div>
          {/if}

          {#if panoMailUsageAlert}
            <div
              class="alert alert-{panoMailUsageAlert.level} d-flex align-items-start"
              role="alert">
              <i
                class="fa-solid {panoMailUsageAlert.level === 'danger'
                  ? 'fa-circle-exclamation'
                  : 'fa-triangle-exclamation'} me-3 mt-1"
                aria-hidden="true"></i>
              <div>
                {#if panoMailUsageAlert.level === 'danger'}
                  <h5 class="alert-heading mb-2">
                    {$_('pages.settings.platform.smtp.pano-mail.limit-title')}
                  </h5>
                  <div>
                    {$_(
                      `pages.settings.platform.smtp.pano-mail.limit-${panoMailUsageAlert.period}`,
                      {
                        values: {
                          date: formatReset(panoMailUsageAlert.resetsAt, $currentLanguage.code),
                        },
                      },
                    )}
                  </div>
                {:else}
                  <h5 class="alert-heading mb-2">
                    {$_('pages.settings.platform.smtp.pano-mail.near-title')}
                  </h5>
                  <div>
                    {$_(
                      `pages.settings.platform.smtp.pano-mail.near-${panoMailUsageAlert.period}`,
                      {
                        values: { percent: panoMailUsageAlert.percent },
                      },
                    )}
                  </div>
                {/if}
                {#if panoMailStatus.manageUrl}
                  <a
                    class="alert-link d-inline-block mt-2"
                    href={panoMailStatus.manageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class:pe-none={smtpDisabled}
                    aria-disabled={smtpDisabled}
                    tabindex={smtpDisabled ? -1 : undefined}
                    >{$_('pages.settings.platform.smtp.pano-mail.bigger-plan')}</a>
                {/if}
              </div>
            </div>
          {/if}

          {#each [['month', panoMailStatus.usage.month], ['day', panoMailStatus.usage.day]] as [period, usage] (period)}
            <div class="mb-3">
              <div class="d-flex justify-content-between">
                <span>{$_(`pages.settings.platform.smtp.pano-mail.${period}`)}</span>
                <span
                  >{usage.used.toLocaleString($currentLanguage.code)} / {usage.limit.toLocaleString(
                    $currentLanguage.code,
                  )}</span>
              </div>
              <div
                class="progress"
                style="height: 6px;"
                role="progressbar"
                aria-label={$_(`pages.settings.platform.smtp.pano-mail.${period}`)}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percentUsed(usage)}>
                <div
                  class="progress-bar"
                  class:bg-warning={usageLevel(usage) === 'warning'}
                  class:bg-danger={usageLevel(usage) === 'danger'}
                  style="width: {percentUsed(usage)}%;">
                </div>
              </div>
              {#if usage.resetsAt}
                <div class="form-text">
                  {$_('pages.settings.platform.smtp.pano-mail.resets', {
                    values: { date: formatReset(usage.resetsAt, $currentLanguage.code) },
                  })}
                </div>
              {/if}
            </div>
          {/each}

          <div class="row mb-3">
            <div class="col-md-6">{$_('pages.settings.platform.smtp.pano-mail.plan')}</div>
            <div class="col-md-6 d-flex align-items-center gap-2 flex-wrap">
              <b>{panoMailStatus.plan.name}</b>
              {#if panoMailStatus.plan.free}
                <span class="badge text-bg-success"
                  >{$_('pages.settings.platform.smtp.pano-mail.free')}</span>
              {/if}
              {#if panoMailStatus.manageUrl}
                <a
                  href={panoMailStatus.manageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class:pe-none={smtpDisabled}
                  aria-disabled={smtpDisabled}
                  tabindex={smtpDisabled ? -1 : undefined}
                  >{$_('pages.settings.platform.smtp.pano-mail.bigger-plan')}</a>
              {/if}
            </div>
          </div>

          {#if panoMailStatus.senders.length > 0}
            <div class="row mb-3">
              <label class="col-md-6 col-form-label" for="panoMailFromName"
                >{$_('pages.settings.platform.smtp.pano-mail.from')}</label>
              <div class="col-md-6">
                <div class="input-group">
                  <input
                    id="panoMailFromName"
                    type="text"
                    class="form-control"
                    class:is-invalid={panoMailFromLocal !== '' &&
                      !validLocalPart(panoMailFromLocal)}
                    maxlength="64"
                    autocomplete="off"
                    aria-label={$_('pages.settings.platform.smtp.pano-mail.from-name')}
                    bind:value={panoMailFromLocal}
                    disabled={panoMailBusy} />
                  <span class="input-group-text">@</span>
                  <select
                    class="form-select"
                    aria-label={$_('pages.settings.platform.smtp.pano-mail.from-domain')}
                    bind:value={panoMailFromDomain}
                    disabled={panoMailBusy || panoMailStatus.senders.length < 2}>
                    {#each panoMailStatus.senders as domain (domain)}
                      <option value={domain}>{domain}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="btn btn-secondary"
              on:click={onPanoMailSenderSaveClick}
              disabled={panoMailBusy ||
                !panoMailSenderChanged ||
                !validLocalPart(panoMailFromLocal)}>
              {$_('buttons.save')}
              {#if panoMailBusy}
                <span class="spinner-border spinner-border-sm" role="status"></span>
              {/if}
            </button>
          {:else if panoMailStatus.from}
            <div class="row mb-3">
              <label class="col-md-6 col-form-label" for="panoMailFrom"
                >{$_('pages.settings.platform.smtp.pano-mail.from')}</label>
              <div class="col-md-6">
                <input
                  id="panoMailFrom"
                  type="text"
                  class="form-control"
                  value={panoMailStatus.from}
                  readonly />
              </div>
            </div>
          {/if}
        {/if}
      {/if}

      {#if !showPanoMail}
        {#if data.email.hostMailAvailable}
          <!-- Pano Host: its package mail or the customer's own SMTP. Picking one only changes the form;
           Save switches (after a confirmation), and each side keeps its settings. -->
          <div class="btn-group w-100 mb-3" role="group">
            <button
              type="button"
              class="btn"
              class:btn-primary={mailMode === 'host'}
              class:btn-outline-primary={mailMode !== 'host'}
              aria-pressed={mailMode === 'host'}
              on:click={() => requestMailMode('host')}
              disabled={smtpDisabled || saveEmailLoading}
              >{$_('pages.settings.platform.smtp.host-mail')}</button>
            <button
              type="button"
              class="btn"
              class:btn-primary={mailMode === 'own'}
              class:btn-outline-primary={mailMode !== 'own'}
              aria-pressed={mailMode === 'own'}
              on:click={() => requestMailMode('own')}
              disabled={smtpDisabled || saveEmailLoading}
              >{$_('pages.settings.platform.smtp.own-mail')}</button>
          </div>

          {#if mailMode === 'host'}
            <p class="text-muted mb-3">
              {$_('pages.settings.platform.smtp.host-mail-description', {
                values: { website: websiteDisplayHost() },
              })}
            </p>
          {/if}
        {/if}

        <!-- Pano Host mail: the same form, filled with the relay's settings and locked except the
         sender (the rest is written from the host's env on every boot). -->
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
              disabled={smtpDisabled || hostMailLocked} />
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
              disabled={smtpDisabled || hostMailLocked} />
            {#if !hostMailLocked && hasStoredPassword && !data.email.password}
              <div class="form-text">{$_('pages.settings.platform.smtp.password-kept')}</div>
            {/if}
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
                disabled={smtpDisabled || hostMailLocked} />
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
              disabled={smtpDisabled || hostMailLocked}>
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
            <!-- Pano Host mail: only the name before `@` is the customer's; the domain is the host's. -->
            <div class="input-group" class:has-validation={hostMailLocked && hostSenderInvalid}>
              {#if hostMailLocked && hostDefaultDomain}
                <input
                  class="form-control"
                  class:is-invalid={hostSenderInvalid}
                  id="senderAddress"
                  type="text"
                  placeholder="noreply"
                  maxlength="64"
                  value={hostSenderLocal}
                  on:input={onHostSenderLocalInput}
                  disabled={smtpDisabled} />
                <span class="input-group-text">@{hostDefaultDomain}</span>
              {:else}
                <input
                  class="form-control"
                  id="senderAddress"
                  type="text"
                  placeholder="no-reply@forexample.com"
                  bind:value={data.email.sender}
                  disabled={smtpDisabled} />
              {/if}
              <!-- Only once the sender differs from the default: nothing to reset otherwise. -->
              {#if hostMailLocked && hostSenderCustomized}
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  title={$_('pages.settings.platform.smtp.reset-sender')}
                  aria-label={$_('pages.settings.platform.smtp.reset-sender')}
                  on:click={onResetHostSenderClick}
                  disabled={smtpDisabled}>
                  <i class="fa-solid fa-rotate-left"></i>
                </button>
              {/if}
            </div>
            {#if hostMailLocked && hostSenderInvalid}
              <div class="invalid-feedback d-block">
                {$_('pages.settings.platform.smtp.sender-local-invalid')}
              </div>
            {/if}
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
              disabled={smtpDisabled || hostMailLocked} />
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
              disabled={smtpDisabled || hostMailLocked} />
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
              disabled={smtpDisabled || hostMailLocked}>
              <option value="PLAIN">PLAIN</option>
              <option value=""></option>
            </select>
          </div>
        </div>

        {#if hostMailLocked}
          <button
            class="btn btn-secondary"
            on:click={onSaveHostMailClick}
            disabled={saveEmailLoading ||
              smtpDisabled ||
              !hostMailChanged ||
              !data.email.sender ||
              hostSenderInvalid}
            >{$_(hostMailActivating ? 'buttons.activate' : 'buttons.save')}
          </button>
        {:else}
          <button
            class="btn btn-secondary"
            on:click={onSaveSmtpClick}
            disabled={saveEmailLoading || !mailValidated || smtpDisabled}
            >{$_(customActivating ? 'buttons.activate' : 'buttons.save')}
          </button>
          <!-- Turning the custom SMTP on always validates first, even when its form is unchanged. -->
          {#if !mailValidated && (customActivating ? customPasswordKnown : !emailSaveDisabled)}
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
        {/if}
      {/if}
    </fieldset>
  </div>
</div>

<EditMaintenancePageModal />
<MaintenanceBannedIpsModal />
<ConfirmSaveCriticalSettingsModal />
<ConfirmRemovePanoAccountModal />
<ConfirmDisableEmailModal />
<ConfirmStopPanoModal />
<ConfirmRestartPanoModal runMode={data.runMode} />
<UsageDataModal />

<script context="module">
  import { base } from '@panomc/sdk/core/js/basePath.js';
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { isEndpointUnavailable, showServerActionError } from '$lib/servers.util.js';
  import { hostedMocked, mockHostMail } from '$lib/hosted-mock.util.js';
  import { normalizeUsageMode, UsageModes } from '$lib/navigation.util.js';
  import { createFrontendApi } from '$lib/pages/view/frontend/frontend.api.js';
  import { describeError } from '$lib/pages/view/frontend/frontend.util.js';
  import {
    createPanoMailApi,
    offeredPlan,
    splitAddress,
    validLocalPart,
    formatReset,
    panoMailView,
    percentUsed,
    usageAlert,
    usageLevel,
  } from './pano-mail.js';

  /** Pano Host mail sender name (before `@`); mirrors `HostedEnvConfig.SENDER_LOCAL`. */
  export const HOST_SENDER_LOCAL = /^[A-Za-z0-9_+-]+(\.[A-Za-z0-9_+-]+)*$/;

  /**
   * The alert kinds of §2.4.7, in the order the card lists them. They mirror the backend's
   * `AlertManager`; a build that knows more kinds keeps them (they are merged back on save),
   * they simply have no row here until the panel learns about them too.
   */
  export const ALERT_KINDS = Object.freeze([
    'SERVER_CRASHED',
    'NODE_OFFLINE',
    'BACKUP_FAILED',
    'DISK_LOW',
    'TPS_LOW',
    'SCHEDULE_FAILED',
    'PLUGIN_UPDATES',
  ]);

  /**
   * @param {unknown} response the body of `GET /api/v1/panel/settings/alerts`.
   * @returns {Record<string, { enabled: boolean, email: boolean }>} every kind the panel knows,
   *   defaulted to the contract's `{ enabled: true, email: false }`.
   */
  export function readAlertSettings(response) {
    const body = response && typeof response === 'object' ? response : {};
    const raw = body.alerts && typeof body.alerts === 'object' ? body.alerts : body;
    /** @type {Record<string, { enabled: boolean, email: boolean }>} */
    const settings = {};

    for (const kind of ALERT_KINDS) {
      const entry = raw[kind] && typeof raw[kind] === 'object' ? raw[kind] : {};

      settings[kind] = { enabled: entry.enabled !== false, email: entry.email === true };
    }

    return settings;
  }

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
    const { usageMode } = await parent();

    // Alerts are a server-management feature: a WEBSITE install has no such endpoint (404), so
    // it is not asked — also on the reload that follows saving the usage mode.
    const alertsInUse = normalizeUsageMode(usageMode) !== UsageModes.WEBSITE;
    // The theme dev server belongs to the front-end API, which a SERVERS install does not have.
    const frontendInUse = normalizeUsageMode(usageMode) !== UsageModes.SERVERS;

    const [
      generalSettings,
      authSettings,
      maintenanceSettings,
      alertSettings,
      frontendSettings,
      panoMailRead,
    ] = await Promise.all([
      ApiUtil.get({
        path: '/panel/settings' + buildQueryParams({ type: 'GENERAL' }),
        request: event,
      }),
      ApiUtil.get({
        path: '/panel/settings' + buildQueryParams({ type: 'AUTH' }),
        request: event,
      }),
      ApiUtil.get({
        path: '/panel/settings' + buildQueryParams({ type: 'MAINTENANCE' }),
        request: event,
      }),
      // Alerts are a separate endpoint (§2.4.7) and an older backend does not have it, so the
      // card is hidden instead of failing the whole page.
      alertsInUse ? ApiUtil.get({ path: '/panel/settings/alerts', request: event }) : null,
      frontendInUse ? createFrontendApi(ApiUtil, event).getFrontend() : null,
      // An older platform has no such route: then only the SMTP form is shown.
      createPanoMailApi(ApiUtil, event).getStatus(),
    ]);

    const alertsSupported =
      !!alertSettings && !isEndpointUnavailable(alertSettings) && !alertSettings.error;

    const body = { ...generalSettings, ...authSettings, ...maintenanceSettings };

    // `devUrl` ("Theme dev server") is stored with the front-end, not with the general settings,
    // and sits in the snapshot below so the save button tracks it like any other field.
    const frontendSupported = !!frontendSettings?.ok;

    body.devUrl = frontendSupported ? (frontendSettings.body.devUrl ?? '') : '';
    body.frontendMode = frontendSupported ? (frontendSettings.body.mode ?? 'THEME') : 'THEME';

    // Dev-only Pano Host preview (`VITE_MOCK_HOSTED`): offer the package mail as Pano Host does.
    if (hostedMocked && body.email) {
      body.email.hostMailAvailable = true;
      body.email.hostMail ??= mockHostMail(body.email.hostSender);
    }

    body.oldSettings = structuredClone(body);

    const failed = searchParams.get('failed');
    const encodedData = searchParams.get('encodedData');
    const state = searchParams.get('state');

    return {
      ...body,
      alerts: readAlertSettings(alertsSupported ? alertSettings : null),
      alertsEmailAvailable: alertsSupported && alertSettings.emailAvailable === true,
      alertsSupported,
      frontendSupported,
      panoMail: panoMailRead,
      platformConnectFailed: failed,
      encodedData,
      state,
    };
  }
</script>

<script>
  import { getContext, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import { page } from '@panomc/sdk/core/js/appStores.js';
  import { goto, invalidateAll } from '$app/navigation';
  import { browser } from '$app/env';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import { currentLanguage } from '$lib/language.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
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
  import UsageDataModal, {
    show as showUsageDataModal,
  } from '$lib/components/modals/UsageDataModal.svelte';
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
  // The saved mode, not the one being edited in the form: alerts are a server-management feature.
  const usageMode = getContext('usageMode');

  pageTitle.set('pages.settings.platform.title');

  export let data;

  const canManageAlerts = hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS);

  // The mail switch is a draft of this page: it starts from what the server has and is only written
  // by a save. (It used to be bound to the shared site info, so an unsaved "on" stayed on for the
  // whole panel and came back as "enabled" on the next visit.)
  let smtpSaved = !!data.oldSettings?.email?.enabled;
  let smtpEnabled = smtpSaved;

  $: if (!!data.oldSettings?.email?.enabled !== smtpSaved) {
    smtpSaved = !!data.oldSettings?.email?.enabled;
    smtpEnabled = smtpSaved;
  }

  $: smtpDisabled = !smtpEnabled;

  let showAlert = false;

  /** Server management is on and the admin can reach it: only then the setting means anything. */
  $: showNodeAutoUpdate =
    $usageMode !== UsageModes.WEBSITE &&
    (hasPermission(Permissions.MANAGE_SERVERS) || hasPermission(Permissions.MANAGE_NODES));
  let nodeAutoUpdate = /** @type {boolean | null} */ (null);
  let savingNodeAutoUpdate = false;

  async function loadNodeAutoUpdate() {
    if (!showNodeAutoUpdate) {
      return;
    }

    const body = await ApiUtil.get({
      path: '/panel/updates/servers',
      handler: (response) => response,
    });

    if (
      body &&
      !isEndpointUnavailable(body) &&
      !body.error &&
      typeof body.nodeAutoUpdate === 'boolean'
    ) {
      nodeAutoUpdate = body.nodeAutoUpdate;
    }
  }

  /** @param {boolean} enabled */
  async function saveNodeAutoUpdate(enabled) {
    savingNodeAutoUpdate = true;

    try {
      const body = await ApiUtil.put({
        path: '/panel/updates/node-auto-update',
        body: { enabled },
        handler: (response) => response,
      });

      if (!body || body.error) {
        if (body?.error) {
          showServerActionError(body.error, body);
        }

        // Put the switch back where the server still has it.
        nodeAutoUpdate = !enabled;

        return;
      }

      nodeAutoUpdate = enabled;
    } finally {
      savingNodeAutoUpdate = false;
    }
  }

  /** The plain settings a control on this page edits as a draft until its card is saved. */
  const DRAFT_KEYS = [
    'developmentMode',
    'devUrl',
    'allowUserLocaleSelection',
    'telemetryEnabled',
    'requireEmailVerification',
    'passwordHashAlgorithm',
    'locale',
    'updatePeriod',
    'releaseChannel',
    'usageMode',
  ];

  /**
   * Puts every draft back to what the server has. A reload can bring back what the switches and
   * fields showed before it (the browser restores form controls, and the bindings then take that
   * for an edit), so an unsaved "on" looked saved after a refresh. The page always starts from the
   * saved settings.
   */
  function restoreSavedDrafts() {
    const saved = data.oldSettings;

    if (!saved) {
      return;
    }

    for (const key of DRAFT_KEYS) {
      if (key in saved && data[key] !== saved[key]) {
        data[key] = saved[key];
      }
    }

    if (
      saved.maintenance &&
      JSON.stringify(data.maintenance) !== JSON.stringify(saved.maintenance)
    ) {
      data.maintenance = structuredClone(saved.maintenance);
    }

    if (smtpEnabled !== smtpSaved) {
      smtpEnabled = smtpSaved;
    }

    if (JSON.stringify(alertSettings) !== savedAlertSettings) {
      alertSettings = JSON.parse(savedAlertSettings);
    }
  }

  onMount(() => {
    restoreSavedDrafts();
    // Once more after the bindings have settled: they adopt a restored control on their first run.
    void tick().then(restoreSavedDrafts);

    void loadNodeAutoUpdate();

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

  // Same for the usage mode: an install that predates the setting behaves like BOTH. Written
  // reactively (like the telemetry switch) so invalidateAll(), which swaps `data` for a fresh
  // payload, re-applies the fallback to the saved snapshot too.
  $: if (data.usageMode !== normalizeUsageMode(data.usageMode)) {
    data.usageMode = normalizeUsageMode(data.usageMode);
  }

  $: if (
    data.oldSettings &&
    data.oldSettings.usageMode !== normalizeUsageMode(data.oldSettings.usageMode)
  ) {
    data.oldSettings.usageMode = normalizeUsageMode(data.oldSettings.usageMode);
  }

  const usageModeOptions = [
    {
      value: UsageModes.WEBSITE,
      icon: 'fa-solid fa-globe',
      titleKey: 'pages.settings.platform.usage-mode.website.title',
      descriptionKey: 'pages.settings.platform.usage-mode.website.description',
    },
    {
      value: UsageModes.SERVERS,
      icon: 'fa-solid fa-cube',
      titleKey: 'pages.settings.platform.usage-mode.servers.title',
      descriptionKey: 'pages.settings.platform.usage-mode.servers.description',
    },
    {
      value: UsageModes.BOTH,
      icon: 'fa-solid fa-layer-group',
      titleKey: 'pages.settings.platform.usage-mode.both.title',
      descriptionKey: 'pages.settings.platform.usage-mode.both.description',
    },
  ];

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
  /** True while the theme dev server address is refused (not a URL, or this Pano itself). */
  let devUrlError = false;
  let saveAuthLoading;
  let saveAlertsLoading;
  // The switch grid is edited locally and written as a whole map, so it is snapshotted once
  // instead of following `data` — nothing else on the page touches it.
  let alertSettings = readAlertSettings(data.alerts);
  /** What the server last confirmed: "Save" is off while the switches still match it. */
  let savedAlertSettings = JSON.stringify(alertSettings);
  let alertsEmailAvailable = data.alertsEmailAvailable === true;
  let alertsSupported = data.alertsSupported !== false;
  // The one time the snapshot is retaken: the alerts were not loaded (WEBSITE mode asks for
  // none) and a usage-mode save has just brought them in, or the other way round.
  let alertsLoaded = data.alertsSupported;
  $: if (data.alertsSupported !== alertsLoaded) {
    alertsLoaded = data.alertsSupported;
    alertSettings = readAlertSettings(data.alerts);
    savedAlertSettings = JSON.stringify(alertSettings);
    alertsEmailAvailable = data.alertsEmailAvailable === true;
    alertsSupported = data.alertsSupported !== false;
  }
  $: alertsSaveDisabled = JSON.stringify(alertSettings) === savedAlertSettings;
  let saveEmailLoading;
  let connecting = !data.panoAccount && data.state && data.encodedData;
  let disconnecting;
  let mailValidated;

  /** The SMTP fields [mailValidated] holds for: any edit after validating asks for a new validation. */
  let validatedFields = '';

  $: if (mailValidated && data.email && JSON.stringify(emailFields()) !== validatedFields)
    mailValidated = false;
  let mailError;
  let toggleSmtpLoading;
  let saveMaintenanceLoading;

  // Null until the modal reports a fresher figure; the loaded settings own the badge until then.
  let bannedIpsCount = null;

  // Usage data is opt-out, so a server that does not report the field yet is sending it.
  // invalidateAll() swaps `data` for a fresh payload, so the default is re-applied per load,
  // on the saved snapshot too — otherwise the switch would read as a pending change.
  $: if (data.telemetryEnabled == null) {
    data.telemetryEnabled = true;
  }

  $: if (data.oldSettings && data.oldSettings.telemetryEnabled == null) {
    data.oldSettings.telemetryEnabled = true;
  }

  // "usage data" is a link, and it sits at a different point in the sentence in each
  // language, so the label is translated with a {link} placeholder and split around it
  // instead of being glued together from fragments.
  const TELEMETRY_LINK_TOKEN = '\u0000';

  $: telemetryLabelParts = $_('pages.settings.platform.telemetry.label', {
    values: { link: TELEMETRY_LINK_TOKEN },
  }).split(TELEMETRY_LINK_TOKEN);

  $: preferencesSaveDisabled =
    data.oldSettings.usageMode === data.usageMode &&
    data.oldSettings.updatePeriod === data.updatePeriod &&
    data.oldSettings.releaseChannel === data.releaseChannel &&
    data.oldSettings.locale === data.locale &&
    data.oldSettings.allowUserLocaleSelection === data.allowUserLocaleSelection &&
    data.oldSettings.telemetryEnabled === data.telemetryEnabled &&
    data.oldSettings.developmentMode === data.developmentMode &&
    data.oldSettings.devUrl === data.devUrl;

  $: authSaveDisabled =
    data.oldSettings.requireEmailVerification === data.requireEmailVerification &&
    data.oldSettings.passwordHashAlgorithm === data.passwordHashAlgorithm;

  $: emailSaveDisabled =
    JSON.stringify(data.oldSettings.email) === JSON.stringify(data.email) ||
    (!data.email.password && !hasStoredPassword);

  // invalidateAll() swaps `data` for a fresh payload, so re-apply the defaults on every load.
  $: if (!data.maintenance) {
    data.maintenance = { ...DEFAULT_MAINTENANCE };
  }

  $: if (data.oldSettings && !data.oldSettings.maintenance) {
    data.oldSettings.maintenance = { ...DEFAULT_MAINTENANCE };
  }

  $: maintenanceDisabled = !data.maintenance.enabled;
  /** Maintenance mode as the server has it (the switch above is only a draft until it is saved). */
  $: maintenanceActive = !!data.oldSettings?.maintenance?.enabled;

  $: customLoginUrlDisabled = maintenanceDisabled || data.maintenance.showLoginButton;

  $: customLoginUrlError = data.maintenance.showLoginButton
    ? null
    : validateCustomLoginUrl(data.maintenance.customLoginUrl);

  // Blank is the documented way to ask for the default panel-access node, so it is never an error.
  $: bypassPermissionNodeError = validateBypassPermissionNode(
    data.maintenance.bypassPermissionNode,
    false,
  );

  // Nothing changed, or a field the platform would refuse. Switching maintenance off is never held
  // back by a field: that is the save that brings the website back up.
  $: maintenanceSaveDisabled =
    JSON.stringify(data.oldSettings.maintenance) === JSON.stringify(data.maintenance) ||
    (!!data.maintenance.enabled && (!!customLoginUrlError || !!bypassPermissionNodeError));

  $: bannedIpCount = bannedIpsCount ?? data.maintenanceBannedIpCount ?? 0;

  if (browser) {
    if (!data.panoAccount && data.state && data.encodedData) {
      ApiUtil.post({
        path: '/panel/platform/connect',
        body: {
          encodedData: data.encodedData,
          state: data.state,
        },
        handler: async (body, reject) => {
          if (body.error) {
            if (body.error?.code === 'ALREADY_CONNECTED_TO_PANO') {
              await goto($page.url.pathname, { refreshAll: true });
              connecting = false;
              return;
            }

            const queryParameters = buildQueryParams({ failed: true });
            await goto($page.url.pathname + queryParameters, {
              refreshAll: true,
            });
            connecting = false;

            return;
          }

          await goto($page.url.pathname, { refreshAll: true });
          await showSuccessToast('components.toasts.pano-account-connect-success');

          connecting = false;
        },
      });
    }
  }

  function onConnectClick() {
    connecting = true;

    ApiUtil.post({
      path: '/panel/platform/code',
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
        path: '/panel/platform/disconnect',
        handler: async (body, reject) => {
          if (body.error) {
            if (body.error?.code === 'PANO_CONNECT_FAILED') {
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
    devUrlError = false;

    // The theme dev server is a front-end setting with its own endpoint. It goes first: a refused
    // address stops the save, so the form never ends up half saved.
    if (data.frontendSupported && data.devUrl !== data.oldSettings.devUrl) {
      const result = await createFrontendApi(ApiUtil).saveFrontend({ devUrl: data.devUrl.trim() });

      if (!result.ok) {
        const { key, values } = describeError(result.error);

        devUrlError = true;
        savePreferencesLoading = false;

        await showErrorToast(key, values);

        return;
      }

      // The backend keeps the origin of what was typed.
      data.devUrl = result.body.devUrl ?? '';
      data.oldSettings.devUrl = data.devUrl;
    }

    const formData = new FormData();

    formData.append('usageMode', data.usageMode);
    formData.append('updatePeriod', data.updatePeriod);
    formData.append('releaseChannel', data.releaseChannel);
    formData.append('locale', data.locale);
    formData.append('allowUserLocaleSelection', data.allowUserLocaleSelection);
    formData.append('telemetryEnabled', data.telemetryEnabled);
    formData.append('developmentMode', data.developmentMode);

    ApiUtil.put({
      path: '/panel/settings',
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

  /**
   * §2.4.7 — the whole `{ KIND: { enabled, email } }` map is written at once, like the other
   * cards on this page write their own block.
   */
  function onSaveAlertsClick() {
    if (alertsSaveDisabled) {
      return;
    }

    saveAlertsLoading = true;

    const sent = JSON.stringify(alertSettings);

    ApiUtil.put({
      path: '/panel/settings/alerts',
      body: { alerts: alertSettings },
      handler: async (body, reject) => {
        saveAlertsLoading = false;

        if (body.error) {
          reject();

          return;
        }

        savedAlertSettings = sent;

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
      path: '/panel/settings',
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
      path: '/panel/settings/verify/mail',
      body: emailFields(),
      handler: async (body, reject) => {
        saveEmailLoading = false;

        if (body.error) {
          mailError = body.mailError;

          return;
        }

        if (!hostMailLocked) {
          mailValidated = true;
          validatedFields = JSON.stringify(emailFields());
        }

        await showSuccessToast('components.toasts.email-config-validate-success');
      },
    });
  }

  /** The SMTP fields the save and verify routes take (nothing of the Pano Host extras). */
  function emailFields() {
    const { hostname, port, ssl, starttls, username, password, sender, authMethods } = data.email;

    return {
      hostname: hostname || '',
      port: port || 0,
      ssl: ssl || false,
      starttls: starttls || 'DISABLED',
      username: username || '',
      password: password || '',
      sender: (sender || '').trim(),
      authMethods: authMethods || '',
    };
  }

  const panoMailApi = createPanoMailApi(ApiUtil);

  /** Pano Mail status of the last load (or the last retry); `supported` is false on older platforms. */
  let panoMail = data.panoMail ?? { supported: false, status: null };
  let panoMailFor = data.panoMail;
  /** Which side of the e-mail card is open: `pano` or `own`. Follows the stored provider on a reload. */
  let mailChoice = panoMail.status?.provider === 'PANO_MAIL' ? 'pano' : 'own';
  let panoMailBusy = false;

  // A reload brings a fresh status: the choice follows what is stored again.
  $: if (data.panoMail !== panoMailFor) {
    panoMailFor = data.panoMail;
    panoMail = data.panoMail ?? { supported: false, status: null };
    mailChoice = panoMail.status?.provider === 'PANO_MAIL' ? 'pano' : 'own';
  }

  $: panoMailStatus = panoMail.supported ? panoMail.status : null;
  $: showPanoMail = !!panoMailStatus && mailChoice === 'pano';
  $: panoMailPhase = panoMailStatus ? panoMailView(panoMailStatus) : null;
  $: panoMailUsageAlert = panoMailPhase === 'active' ? usageAlert(panoMailStatus.usage) : null;
  $: panoMailPreparing =
    panoMailPhase === 'active' && panoMailStatus.enabled && !panoMailStatus.ready;
  $: panoMailOffered = panoMailStatus ? offeredPlan(panoMailStatus) : null;

  /** The sender picker: the stored address split in two, reset whenever the status is (re)read. */
  let panoMailFromLocal = '';
  let panoMailFromDomain = '';
  let panoMailSenderFor;

  $: if (panoMailStatus !== panoMailSenderFor) {
    panoMailSenderFor = panoMailStatus;

    const stored = panoMailStoredSender(panoMailStatus);

    panoMailFromLocal = stored.localPart;
    panoMailFromDomain = stored.domain;
  }

  $: panoMailSenderChanged =
    !!panoMailStatus &&
    (panoMailFromLocal !== panoMailStoredSender(panoMailStatus).localPart ||
      panoMailFromDomain !== panoMailStoredSender(panoMailStatus).domain);

  /** This Pano's own sender while it is at one of the account's domains, else the website's default. */
  function panoMailStoredSender(status) {
    if (!status) return { localPart: '', domain: '' };

    const own = splitAddress(status.provider === 'PANO_MAIL' ? data.email?.sender : '');
    const picked = status.senders.includes(own.domain) ? own : splitAddress(status.from);

    return {
      localPart: picked.localPart || 'no-reply',
      domain: status.senders.includes(picked.domain) ? picked.domain : (status.senders[0] ?? ''),
    };
  }

  async function onPanoMailSenderSaveClick() {
    panoMailBusy = true;

    const result = await panoMailApi.switchToPanoMail(`${panoMailFromLocal}@${panoMailFromDomain}`);

    if (!result.ok) {
      const key =
        result.code === 'INVALID_DATA'
          ? 'err-sender'
          : result.code === 'PANO_MAIL_UNAVAILABLE'
            ? 'err-unavailable'
            : 'err-generic';

      await showErrorToast(`pages.settings.platform.smtp.pano-mail.${key}`);
      panoMailBusy = false;

      return;
    }

    await invalidateAll();
    await showSuccessToast('components.toasts.settings-save-success');
    panoMailBusy = false;
  }

  async function onPanoMailRetryClick() {
    panoMailBusy = true;

    const result = await panoMailApi.getStatus();

    if (result.supported) panoMail = result;

    panoMailBusy = false;
  }

  async function onUsePanoMailClick() {
    panoMailBusy = true;

    const result = await panoMailApi.switchToPanoMail();

    if (!result.ok) {
      const key =
        result.code === 'CONNECT_REQUIRED'
          ? 'err-connect'
          : result.code === 'PANO_MAIL_UNAVAILABLE'
            ? 'err-unavailable'
            : 'err-generic';

      await showErrorToast(`pages.settings.platform.smtp.pano-mail.${key}`);
      panoMailBusy = false;

      return;
    }

    await invalidateAll();
    await showSuccessToast('components.toasts.settings-save-success');
    panoMailBusy = false;
  }

  /** Pano Host: `host` = the package mail (`email.hostManaged`), `own` = the customer's own SMTP. */
  let mailMode = data.email?.hostManaged === false ? 'own' : 'host';

  /** The form as it was when the current mode was shown: anything else is an unsaved edit. */
  let mailModeSnapshot = '';
  let mailStateFor;

  // A (re)load sets the mode to the stored one. Keyed on the loaded snapshot (`oldSettings`): `data`
  // itself is invalidated by every edit of the form, and re-syncing then would undo the user's pick.
  $: resetMailState(data.oldSettings);

  function resetMailState(loaded) {
    if (loaded === mailStateFor) return;

    mailStateFor = loaded;
    mailMode = data.email?.hostManaged === false ? 'own' : 'host';
    mailValidated = false;

    if (data.email?.hostMailAvailable && mailMode === 'host') showHostMail();

    mailModeSnapshot = JSON.stringify(data.email);
  }

  /** Pano Host mail selected: the SMTP form shows the relay's settings, read-only but the sender. */
  $: hostMailLocked = !!data.email?.hostMailAvailable && mailMode === 'host';

  $: storedEmail = data.oldSettings?.email || {};

  /** The instance's own default sender (`PANO_SMTP_FROM`), what the reset button restores. */
  $: hostDefaultSender = data.email?.hostMail?.defaultSender || '';

  $: hostDefaultDomain = hostDefaultSender.split('@')[1] || '';

  /** Pano Host mail: the sender's name before `@` (the domain is always the host's). */
  $: hostSenderLocal = String(data.email?.sender || '').split('@')[0];

  /** Letters, digits and `. _ + -`, not starting or ending with a dot: what the backend accepts. */
  $: hostSenderInvalid = !HOST_SENDER_LOCAL.test(hostSenderLocal);

  /** The sender differs from the default (case aside), so the reset button has something to do. */
  $: hostSenderCustomized =
    !!hostDefaultSender &&
    String(data.email?.sender || '')
      .trim()
      .toLowerCase() !== hostDefaultSender.toLowerCase();

  function onHostSenderLocalInput(event) {
    const local = event.target.value.replace(/@.*$/, '').trim();

    data.email.sender = local ? `${local}@${hostDefaultDomain}` : '';
  }

  /** Saving the custom SMTP turns it on: mail is off, or Pano Host mail is the stored one. */
  $: customActivating =
    !storedEmail.enabled || (!!data.email?.hostMailAvailable && storedEmail.hostManaged !== false);

  /** A password to validate with: typed, or the stored one of the same server and account. */
  $: customPasswordKnown = !!data.email?.password || hasStoredPassword;

  /** Saving Pano Host mail turns it on: mail is off, or the customer's own SMTP is the stored one. */
  $: hostMailActivating = !storedEmail.enabled || storedEmail.hostManaged === false;

  /** Something to save for Pano Host mail: switching to it, turning mail on, or another sender. */
  $: hostMailChanged =
    !storedEmail.hostManaged ||
    !storedEmail.enabled ||
    String(data.email?.sender || '').trim() !== (storedEmail.hostMail?.sender || '');

  /** Own SMTP: a stored password of this server and account is kept when the field stays empty. */
  $: hasStoredPassword =
    !!data.email?.customHasPassword &&
    data.email?.custom?.hostname === data.email?.hostname &&
    data.email?.custom?.username === data.email?.username;

  function showHostMail() {
    const hostMail = data.email.hostMail;

    if (hostMail) data.email = { ...data.email, ...hostMail, password: '' };
  }

  function showOwnMail() {
    // Own SMTP in use: its stored values. Pano Host mail in use: the kept copy, else an empty form.
    const custom = storedEmail.hostManaged === false ? storedEmail : data.email.custom;

    data.email = {
      ...data.email,
      hostname: custom?.hostname || '',
      port: custom?.port || 587,
      ssl: custom?.ssl ?? false,
      starttls: custom?.starttls || 'REQUIRED',
      username: custom?.username || '',
      password: '',
      sender: custom?.sender || '',
      authMethods: custom?.authMethods || '',
    };
  }

  function setMailMode(mode) {
    mailMode = mode;
    mailValidated = false;
    mailError = null;

    if (mode === 'host') showHostMail();
    else showOwnMail();

    mailModeSnapshot = JSON.stringify(data.email);
  }

  /** Switching discards unsaved edits of the form, so that asks first. */
  function requestMailMode(mode) {
    if (mode === mailMode) return;

    if (JSON.stringify(data.email) === mailModeSnapshot) {
      setMailMode(mode);

      return;
    }

    showConfirmActionModal(
      {
        title: 'pages.settings.platform.smtp.confirm-discard-title',
        description: 'pages.settings.platform.smtp.confirm-discard-description',
        confirmLabel: 'buttons.discard',
        variant: 'danger',
      },
      () => setMailMode(mode),
    );
  }

  function onResetHostSenderClick() {
    data.email.sender = hostDefaultSender;
  }

  /** Pano Host mail: switch to it (confirmed), turn mail on or save another sender. */
  function onSaveHostMailClick() {
    if (storedEmail.hostManaged === false) {
      showConfirmActionModal(
        {
          title: 'pages.settings.platform.smtp.confirm-switch-host-title',
          description: 'pages.settings.platform.smtp.confirm-switch-host-description',
          confirmLabel: 'buttons.switch',
          variant: 'primary',
        },
        saveHostMail,
      );

      return;
    }

    saveHostMail();
  }

  function saveHostMail() {
    saveEmailLoading = true;

    const formData = new FormData();

    formData.append(
      'email',
      JSON.stringify({
        enabled: true,
        hostManaged: true,
        hostname: '',
        port: 0,
        ssl: false,
        starttls: 'OPTIONAL',
        username: '',
        password: '',
        sender: String(data.email.sender || '').trim(),
        authMethods: '',
      }),
    );

    ApiUtil.put({
      path: '/panel/settings',
      body: formData,
      handler: async (body, reject) => {
        saveEmailLoading = false;

        if (body.error) {
          reject();
          return;
        }

        await invalidateAll();
        await showSuccessToast('components.toasts.settings-save-success');
      },
    });
  }

  /** Own SMTP: switching away from Pano Host mail asks first. */
  function onSaveSmtpClick() {
    if (data.email.hostMailAvailable && storedEmail.hostManaged !== false) {
      showConfirmActionModal(
        {
          title: 'pages.settings.platform.smtp.confirm-switch-own-title',
          description: 'pages.settings.platform.smtp.confirm-switch-own-description',
          confirmLabel: 'buttons.switch',
          variant: 'primary',
        },
        saveSmtp,
      );

      return;
    }

    saveSmtp();
  }

  function saveSmtp() {
    saveEmailLoading = true;

    const formData = new FormData();

    formData.append(
      'email',
      JSON.stringify({
        enabled: true,
        ...emailFields(),
        // Pano Host: own SMTP explicitly (an older backend ignores the field).
        ...(data.email.hostMailAvailable ? { hostManaged: false } : {}),
      }),
    );

    ApiUtil.put({
      path: '/panel/settings',
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

        // Mail was already on before this save: it is a plain settings save, not a switch-on.
        const enabled = smtpSaved;

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
    // Mail was never turned on (only switched on here, unsaved): switching it off again just drops
    // the unsaved edits, nothing to confirm or save.
    if (!event.target.checked && !storedEmail.enabled) {
      smtpEnabled = false;
      data.email = structuredClone(data.oldSettings.email);
      mailError = null;
      mailStateFor = null;
      resetMailState(data.oldSettings);

      return;
    }

    if (!event.target.checked) {
      // Stays on until the confirmation is accepted and the server has switched it off.
      smtpEnabled = true;
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
            // Pano Host: turning mail off keeps the chosen mode.
            ...(data.email.hostMailAvailable
              ? { hostManaged: storedEmail.hostManaged !== false }
              : {}),
          }),
        );

        ApiUtil.put({
          path: '/panel/settings',
          body: formData,
          handler: async (body, reject) => {
            if (body.error) {
              reject();

              return;
            }

            saveEmailLoading = false;
            smtpEnabled = false;

            await invalidateAll();

            await showSuccessToast('components.toasts.smtp-disabled-success');

            toggleSmtpLoading = false;
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

  /**
   * What "Save" sends. With maintenance being switched off, a field the platform would refuse is
   * emptied instead of failing the request: both are inert while maintenance is off.
   */
  function maintenanceSettingsToSave() {
    const settings = currentMaintenanceSettings();

    if (!settings.enabled) {
      if (validateCustomLoginUrl(settings.customLoginUrl)) {
        settings.customLoginUrl = '';
      }

      if (validateBypassPermissionNode(settings.bypassPermissionNode)) {
        settings.bypassPermissionNode = '';
      }
    }

    return settings;
  }

  /**
   * The switch in the header only changes the card; "Save" writes it. Switching maintenance on or
   * off is re-authenticated, so that save asks for the password first; a save that leaves the
   * switch as it was goes straight through.
   */
  function onSaveMaintenanceClick() {
    if (maintenanceSaveDisabled) {
      return;
    }

    if (!!data.maintenance.enabled !== !!maintenanceSnapshot().enabled) {
      showConfirmSaveCriticalSettingsModal((password) => saveMaintenance(password));

      return;
    }

    saveMaintenance();
  }

  function saveMaintenance(password) {
    const confirmed = password != null;

    saveMaintenanceLoading = true;

    if (confirmed) {
      setSaveCriticalSettingsLoading(true);
    }

    ApiUtil.put({
      path: '/panel/settings',
      body: buildMaintenanceFormData(maintenanceSettingsToSave(), password),
      handler: async (body, reject) => {
        saveMaintenanceLoading = false;

        if (body.error) {
          // Wrong password: keep the modal open with the field marked so it can be retyped.
          if (confirmed && body.error?.code === 'NO_PERMISSION') {
            setSaveCriticalSettingsError(true);

            return;
          }

          if (confirmed) {
            hideSaveCriticalSettingsModal();
          }

          // A value this card sent was refused: that is not a connection problem, and the
          // network splash would hide the very form the operator has to correct.
          if (body.error?.code === 'BAD_REQUEST') {
            await showErrorToast('errors.BAD_REQUEST');

            return;
          }

          reject();

          return;
        }

        if (confirmed) {
          hideSaveCriticalSettingsModal();
        }

        data.oldSettings.maintenance = structuredClone(data.maintenance);

        await invalidateAll();

        await showSuccessToast('components.toasts.maintenance-save-success');
      },
    });
  }

  function onUsageDataClick() {
    showUsageDataModal();
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
