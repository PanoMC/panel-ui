<style>
  .login-card {
    max-width: 26rem;
  }

  .alt-methods-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--bs-secondary-color);
    font-size: 0.875rem;
  }

  .alt-methods-divider::before,
  .alt-methods-divider::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--bs-border-color);
  }

  .totp-input {
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
    text-align: center;
  }
</style>

<div class="login-card card mx-auto w-100">
  <div class="card-body p-4">
    {#if step === Steps.LINK_CODE}
      <h1 class="h5 mb-1">{$_('pages.auth.login.link-code-title')}</h1>
      <p class="text-body-secondary small mb-3">
        {$_('pages.auth.login.link-code-description')}
      </p>

      {#if themeLoginHref}
        <a class="btn btn-primary w-100" href={themeLoginHref}>
          {$_('pages.auth.login.link-code-open-site')}
          <i class="fa-solid fa-arrow-up-right-from-square ms-1 small" aria-hidden="true"></i>
        </a>
      {/if}

      <button type="button" class="btn btn-link w-100 mt-2" onclick={resetToCredentials}>
        {$_('pages.auth.login.back-to-sign-in')}
      </button>
    {:else if step === Steps.TWO_FACTOR}
      <h1 class="h5 mb-1">{$_('pages.auth.login.two-factor-title')}</h1>
      <p class="text-body-secondary small mb-3">
        {$_('pages.auth.login.two-factor-description')}
      </p>

      {#if errorKey}
        <div class="alert alert-danger py-2 small" role="alert">{$_(errorKey, errorValues)}</div>
      {/if}

      <form onsubmit={onSubmit}>
        <label class="form-label" for="loginTotpCode">
          {$_('pages.auth.login.two-factor-label')}
        </label>
        <input
          id="loginTotpCode"
          class="form-control totp-input font-monospace"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="000000"
          disabled={loading}
          bind:this={totpInput}
          bind:value={totpCode}
          oninput={onTotpInput} />

        <button
          type="submit"
          class="btn btn-primary w-100 mt-3"
          disabled={loading || totpCode.length !== 6}>
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('pages.auth.login.two-factor-submit')}
        </button>
      </form>

      <button type="button" class="btn btn-link w-100 mt-2" onclick={resetToCredentials}>
        {$_('pages.auth.login.back-to-sign-in')}
      </button>
    {:else}
      <h1 class="h5 mb-1">{$_('pages.auth.login.title')}</h1>
      <p class="text-body-secondary small mb-3">{$_('pages.auth.login.subtitle')}</p>

      {#if errorKey}
        <div class="alert alert-danger py-2 small" role="alert">{$_(errorKey, errorValues)}</div>
      {/if}

      <form onsubmit={onSubmit}>
        <div class="mb-3">
          <label class="form-label" for="loginUsernameOrEmail">
            {$_('pages.auth.login.username-label')}
          </label>
          <input
            id="loginUsernameOrEmail"
            class="form-control"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            maxlength="128"
            placeholder={$_('pages.auth.login.username-placeholder')}
            disabled={loading}
            bind:value={usernameOrEmail}
            oninput={onIdentifierInput} />
        </div>

        <div class="mb-3">
          <label class="form-label" for="loginPassword">
            {$_('pages.auth.login.password-label')}
          </label>
          <div class="input-group">
            <input
              id="loginPassword"
              class="form-control"
              type={passwordVisible ? 'text' : 'password'}
              autocomplete="current-password"
              maxlength="128"
              disabled={loading}
              bind:value={password} />
            <button
              class="btn btn-outline-secondary"
              type="button"
              aria-label={$_(
                passwordVisible
                  ? 'pages.auth.login.hide-password'
                  : 'pages.auth.login.show-password',
              )}
              onclick={() => (passwordVisible = !passwordVisible)}>
              <i class="fa-regular {passwordVisible ? 'fa-eye-slash' : 'fa-eye'}" aria-hidden="true"
              ></i>
            </button>
          </div>
        </div>

        {#if step === Steps.EMAIL_REQUIRED}
          <div class="mb-3">
            <label class="form-label" for="loginRegisterEmail">
              {$_('pages.auth.login.email-required-label')}
            </label>
            <input
              id="loginRegisterEmail"
              class="form-control"
              type="email"
              autocomplete="email"
              autocapitalize="none"
              spellcheck="false"
              maxlength="128"
              disabled={loading}
              bind:this={registerEmailInput}
              bind:value={registerEmail} />
            <div class="form-text">{$_('pages.auth.login.email-required-hint')}</div>
          </div>
        {/if}

        {#if step === Steps.USERNAME_REQUIRED}
          <div class="mb-3">
            <label class="form-label" for="loginNewUsername">
              {$_('pages.auth.login.username-required-label')}
            </label>
            <input
              id="loginNewUsername"
              class="form-control"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              maxlength="16"
              disabled={loading}
              bind:this={newUsernameInput}
              bind:value={newUsername} />
            <div class="form-text">{$_('pages.auth.login.username-required-hint')}</div>
          </div>
        {/if}

        <!-- Plugin widgets that belong inside the form (auth-guard's captcha, …): the same
             priority < 100 rule the theme's login view uses. -->
        {#each $contentItems as item (item.id)}
          {#if item.id !== 'login-form' && item.component && (item.priority || 0) < 100}
            <div class="mb-3">
              <ViewComponent component={item.component} data={{ pageType: 'login' }} />
            </div>
          {/if}
        {/each}

        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div class="form-check m-0">
            <input
              class="form-check-input"
              type="checkbox"
              id="loginRememberMe"
              disabled={loading}
              bind:checked={rememberMe} />
            <label class="form-check-label" for="loginRememberMe">
              {$_('pages.auth.login.remember-label')}
            </label>
          </div>

          {#if forgotHref}
            <a class="small" href={forgotHref}>{$_('pages.auth.login.forgot')}</a>
          {:else if supportEmail}
            <a class="small" href="mailto:{supportEmail}">
              {$_('pages.auth.login.forgot-support', { values: { email: supportEmail } })}
            </a>
          {:else}
            <span class="small text-body-secondary">
              {$_('pages.auth.login.forgot-no-support')}
            </span>
          {/if}
        </div>

        <button type="submit" class="btn btn-primary w-100" disabled={loading || !canSubmit}>
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('pages.auth.login.submit')}
        </button>
      </form>

      {#if $altMethods?.length}
        <div class="alt-methods-divider my-3">{$_('pages.auth.login.or')}</div>

        <div class="vstack gap-2">
          {#each $altMethods as method (method.id)}
            <ViewComponent component={method.component} data={{ pageType: 'login' }} />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Plugin items placed after the form (priority >= 100): auth-guard's 2FA modal, … They stay
     mounted across the steps, since they intercept the sign-in request itself. -->
{#each $contentItems as item (item.id)}
  {#if item.id !== 'login-form' && item.component && (item.priority || 0) >= 100}
    <ViewComponent component={item.component} data={{ pageType: 'login' }} />
  {/if}
{/each}

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { isSignedIn, safeNextPath } from '$lib/auth.api.js';
  import { UsageModes } from '$lib/navigation.util.js';
  import { executeLoginLoad } from '$lib/PluginAPI.js';

  /**
   * U-06 — the panel's own sign-in page, so a `usage-mode = SERVERS` install (which never
   * starts a theme) can still be reached. Somebody who already has a panel session has nothing
   * to do here, so they go straight where they were headed.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, url } = event;
    const data = await parent();

    if (isSignedIn(data?.session?.basicData)) {
      throw redirect(302, safeNextPath(url.searchParams.get('next'), base) || base || '/');
    }

    // With the website on, the theme's login page is the one to use (see `signsInOnTheme`).
    if (data?.usageMode !== UsageModes.SERVERS) {
      throw redirect(302, '/login');
    }

    // The same plugin pipeline as the theme's /login (captcha, 2FA, social buttons, …). A
    // handler can hand back an error to show, e.g. `?socialError=` after a failed OAuth round.
    const loginData = await executeLoginLoad(event);

    return { initialError: loginData.error || null, loginLoaded: true };
  }
</script>

<script>
  /**
   * The panel-native login form (§2.4.9). It is a second front end for the *same* endpoints the
   * theme's login page uses — `POST /api/auth/login` then `GET /api/auth/credentials` — so the
   * cookies, the CSRF token and every error code behave identically; nothing about the session
   * is panel-specific.
   *
   * Plugins take part exactly as on the theme's login: the `login-content` slot (captcha inside
   * the form, auth-guard's 2FA modal after it) and the `login-alt-methods` slot (social,
   * Microsoft, magic-link buttons), fed by `pano.ui.auth.login` (see `PluginAPI.js`).
   *
   * Two-factor authentication is not part of core: `pano-plugin-auth-guard` denies the login
   * from its `onBeforeLogin` hook with `PLUGIN_DENIED_LOGIN` + a `two-factor-required` reason,
   * and the same request is replayed with `totpCode` added to the body. A current auth-guard
   * does that with its own 2FA modal in the `login-content` slot; the step below is only the
   * fallback for an auth-guard that does not register itself on the panel yet.
   */
  import { getContext, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { format } from 'date-fns';
  import * as dateFnsLocales from 'date-fns/locale';

  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  import { sendLogin } from '$lib/auth.api.js';
  import { completeSignIn } from '$lib/signIn.util.js';
  import { currentLanguage } from '$lib/language.util.js';
  import { panoApiClient } from '$lib/PluginAPI.js';
  import { showError } from '$lib/components/ToastContainer.svelte';
  import ViewComponent from '$lib/components/ViewComponent.svelte';
  // `UsageModes` and `executeLoginLoad` come from the module script above, whose scope this
  // shares.

  /** Absent when the root error page renders this form in place of a page (`requireSignedIn`). */
  let { data = null } = $props();

  /** Which form the card is showing. */
  const Steps = Object.freeze({
    CREDENTIALS: 'CREDENTIALS',
    TWO_FACTOR: 'TWO_FACTOR',
    /** The account has no e-mail yet and the platform wants one before it lets you in. */
    EMAIL_REQUIRED: 'EMAIL_REQUIRED',
    /** A `tmp_…` account (created by an entry adapter) has to pick a username first. */
    USERNAME_REQUIRED: 'USERNAME_REQUIRED',
    /** Password-less account: it can only sign in through the in-game link code, on the site. */
    LINK_CODE: 'LINK_CODE',
  });

  /** Where the login form remembers the last identifier, when the box was ticked. */
  const REMEMBER_STORAGE_KEY = 'panel_login_remember';

  /**
   * `PLUGIN_DENIED_LOGIN` reasons that mean "ask for the second factor". The plugin sends its
   * own i18n key; older builds sent the bare code, so both are accepted.
   */
  const TWO_FACTOR_REQUIRED_REASONS = [
    'TWO_FACTOR_REQUIRED',
    'plugins.pano-plugin-auth-guard.errors.two-factor-required',
  ];

  /** auth-guard's own 2FA modal; while it is on the page it answers the challenge, not us. */
  const PLUGIN_TWO_FACTOR_ITEM_ID = 'pano-plugin-auth-guard-2fa-guard';

  const TWO_FACTOR_INVALID_REASONS = [
    'TWO_FACTOR_INVALID_CODE',
    'plugins.pano-plugin-auth-guard.errors.two-factor-invalid-code',
  ];

  /** Error codes this page explains itself; anything else falls back to the generic line. */
  const ERROR_KEYS = Object.freeze({
    LOGIN_IS_INVALID: 'pages.auth.login.errors.invalid',
    LOGIN_USER_IS_BANNED: 'pages.auth.login.errors.banned',
    IP_IS_BANNED: 'pages.auth.login.errors.ip-banned',
    CAPTCHA_VERIFICATION_FAILED: 'pages.auth.login.errors.captcha',
    PLUGIN_DENIED_LOGIN: 'pages.auth.login.errors.denied',
    NO_PANEL_ACCESS: 'pages.auth.login.errors.no-panel-access',
    REGISTER_INVALID_EMAIL: 'pages.auth.login.errors.invalid-email',
    REGISTER_EMAIL_NOT_AVAILABLE: 'pages.auth.login.errors.email-taken',
    REGISTER_USERNAME_NOT_AVAILABLE: 'pages.auth.login.errors.username-taken',
    REGISTER_INVALID_USERNAME: 'pages.auth.login.errors.invalid-username',
    REGISTER_USERNAME_TOO_SHORT: 'pages.auth.login.errors.username-too-short',
    REGISTER_USERNAME_TOO_LONG: 'pages.auth.login.errors.username-too-long',
    INSTALLATION_REQUIRED: 'pages.auth.login.errors.installation-required',
    MAINTENANCE_MODE: 'pages.auth.login.errors.maintenance',
    NETWORK_ERROR: 'pages.auth.login.errors.network',
  });

  const siteInfo = getContext('siteInfo');
  const usageMode = getContext('usageMode');
  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.auth.login.title');

  const contentItems = panoApiClient.ui.auth.login.content.get();
  const altMethods = panoApiClient.ui.auth.login.alternativeMethods.get();

  const pluginHandlesTwoFactor = $derived(
    $contentItems.some((item) => item.id === PLUGIN_TWO_FACTOR_ITEM_ID && item.component),
  );

  let step = $state(Steps.CREDENTIALS);
  let usernameOrEmail = $state('');
  let password = $state('');
  let rememberMe = $state(false);
  let passwordVisible = $state(false);
  let registerEmail = $state('');
  let newUsername = $state('');
  let totpCode = $state('');
  let loading = $state(false);
  let errorKey = $state('');
  /** @type {Record<string, unknown>} */
  let errorValues = $state({});
  /** Minted by auth-guard so the one-time captcha is not spent again on the 2FA round-trip. */
  let captchaStepToken = null;

  let totpInput = $state();
  let registerEmailInput = $state();
  let newUsernameInput = $state();

  const supportEmail = $derived(String($siteInfo?.supportEmail || '').trim());
  const websiteUrl = $derived(String($siteInfo?.websiteUrl || '').replace(/\/+$/, ''));

  /**
   * A `SERVERS` install runs no theme at all, so there is no `/reset-password` page to send
   * anybody to — the support address is the only route back in.
   */
  const forgotHref = $derived(
    $usageMode === UsageModes.SERVERS ? '' : `${websiteUrl}/reset-password`,
  );

  const themeLoginHref = $derived($usageMode === UsageModes.SERVERS ? '' : `${websiteUrl}/login`);

  const canSubmit = $derived(
    usernameOrEmail.trim().length > 0 &&
      password.length > 0 &&
      (step !== Steps.EMAIL_REQUIRED || registerEmail.trim().length > 0) &&
      (step !== Steps.USERNAME_REQUIRED || newUsername.trim().length > 0),
  );

  /** Identifier fields never contain whitespace — the backend strips it, so the UI does too. */
  function onIdentifierInput() {
    usernameOrEmail = usernameOrEmail.replace(/\s/g, '');
    clearError();

    // The public demo advertises its own credentials; filling them in saves a lookup.
    if ($siteInfo?.isDemo && usernameOrEmail === 'demo' && !password) {
      password = '123456';
      passwordVisible = true;
    }
  }

  function onTotpInput() {
    totpCode = totpCode.replace(/\D/g, '').slice(0, 6);
    clearError();
  }

  function clearError() {
    errorKey = '';
    errorValues = {};
  }

  /**
   * @param {string} key
   * @param {Record<string, unknown>} [values]
   */
  function fail(key, values = {}) {
    errorKey = key;
    errorValues = { values };

    void showError(key, values);
  }

  function resetToCredentials() {
    step = Steps.CREDENTIALS;
    totpCode = '';
    captchaStepToken = null;
    clearError();
  }

  /**
   * @param {SubmitEvent} event
   */
  function onSubmit(event) {
    event.preventDefault();

    void submit();
  }

  async function submit() {
    if (loading) {
      return;
    }

    if (step === Steps.TWO_FACTOR ? totpCode.length !== 6 : !canSubmit) {
      return;
    }

    loading = true;
    clearError();

    try {
      /** @type {Record<string, unknown>} */
      const body = {
        usernameOrEmail: usernameOrEmail.trim(),
        password,
        // Core has no notion of a shorter session yet (the cookies are always 90 days), but the
        // flag is part of the contract and ignored by a backend that does not read it.
        rememberMe,
        // Only an account that can use the panel gets a session from this form; anyone else is
        // answered NO_PANEL_ACCESS before a cookie is set.
        panel: true,
      };

      if (step === Steps.EMAIL_REQUIRED) {
        body.registerEmail = registerEmail.trim();
      }

      if (step === Steps.USERNAME_REQUIRED) {
        body.newUsername = newUsername.trim();
      }

      if (step === Steps.TWO_FACTOR) {
        body.totpCode = totpCode;

        if (captchaStepToken) {
          body.captchaStepToken = captchaStepToken;
        }
      }

      const response = await sendLogin(body);

      // `undefined` is the network-error path: `ApiUtil` resolves instead of throwing when no
      // handler was passed, exactly like the theme's login.
      if (!response || typeof response !== 'object') {
        fail(ERROR_KEYS.NETWORK_ERROR);

        return;
      }

      if (response.result === 'ok') {
        await onSignedIn(String(response.csrfToken || ''));

        return;
      }

      await handleFailure(response);
    } finally {
      loading = false;
    }
  }

  /**
   * @param {string} csrfToken from the login response; the cookies are already set.
   */
  async function onSignedIn(csrfToken) {
    rememberIdentifier();

    // Rendered in place of a page (the root error page, `requireSignedIn`), the address to go
    // back to is the one in the bar; on /panel/login itself it is `next`, else the dashboard.
    const onLoginPage = String($page.route?.id || '').startsWith('/(auth)');
    const here = `${$page.url.pathname}${$page.url.search}`;

    const result = await completeSignIn(csrfToken, {
      target: safeNextPath($page.url.searchParams.get('next'), base) || (onLoginPage ? base : here),
    });

    if (result === 'NO_PANEL_ACCESS') {
      fail(ERROR_KEYS.NO_PANEL_ACCESS);
    }
  }

  /**
   * @param {Record<string, any>} response the `{ result: 'error', ... }` body.
   */
  async function handleFailure(response) {
    const code = String(response.error || '').toUpperCase();

    if (code === 'PLUGIN_DENIED_LOGIN') {
      const reason = String(response.reason || '');

      // auth-guard's modal answers the challenge itself; a denial reaching us means it was
      // cancelled, so it is shown like any other plugin refusal.
      if (TWO_FACTOR_REQUIRED_REASONS.includes(reason) && !pluginHandlesTwoFactor) {
        captchaStepToken = response.captchaStepToken ?? null;
        step = Steps.TWO_FACTOR;
        totpCode = '';
        clearError();

        await tick();
        totpInput?.focus();

        return;
      }

      if (TWO_FACTOR_INVALID_REASONS.includes(reason) && !pluginHandlesTwoFactor) {
        totpCode = '';
        fail('pages.auth.login.errors.two-factor-invalid');

        await tick();
        totpInput?.focus();

        return;
      }

      // A plugin's reason is its own i18n key (`plugins.<id>.…`); anything else keeps the
      // generic line.
      fail(reason.startsWith('plugins.') ? reason : ERROR_KEYS.PLUGIN_DENIED_LOGIN);

      return;
    }

    if (code === 'LINK_CODE_REQUIRED') {
      step = Steps.LINK_CODE;
      clearError();

      return;
    }

    if (code === 'REGISTER_EMAIL_REQUIRED') {
      step = Steps.EMAIL_REQUIRED;
      passwordVisible = true;
      clearError();

      await tick();
      registerEmailInput?.focus();

      return;
    }

    if (code === 'USERNAME_REQUIRED') {
      step = Steps.USERNAME_REQUIRED;
      clearError();

      await tick();
      newUsernameInput?.focus();

      return;
    }

    if (code === 'LOGIN_EMAIL_NOT_VERIFIED') {
      fail('pages.auth.login.errors.email-not-verified', {
        email: String(response.email || usernameOrEmail),
      });

      return;
    }

    if (code === 'LOGIN_USER_IS_BANNED') {
      fail(...describeBan(response));

      return;
    }

    fail(ERROR_KEYS[code] || 'pages.auth.login.errors.generic', { code: code || 'UNKNOWN' });
  }

  /**
   * The ban response carries an optional `reason` and an optional `until` (epoch millis, absent
   * for a permanent ban), which is four different sentences.
   *
   * @param {{ reason?: string, until?: number }} response
   * @returns {[string, Record<string, unknown>]}
   */
  function describeBan(response) {
    const reason = String(response.reason || '').trim();

    if (!response.until) {
      return reason
        ? ['pages.auth.login.errors.banned-permanent-reason', { reason }]
        : ['pages.auth.login.errors.banned-permanent', {}];
    }

    const until = format(new Date(Number(response.until)), 'dd/MM/yyyy HH:mm', {
      locale: dateFnsLocales[$currentLanguage?.dateFnsCode],
    });

    return reason
      ? ['pages.auth.login.errors.banned-until-reason', { reason, until }]
      : ['pages.auth.login.errors.banned-until', { until }];
  }

  function rememberIdentifier() {
    if (!browser) {
      return;
    }

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_STORAGE_KEY, usernameOrEmail.trim());
      } else {
        localStorage.removeItem(REMEMBER_STORAGE_KEY);
      }
    } catch {
      /* private mode, blocked storage — remembering the name is a convenience, not a feature */
    }
  }

  /**
   * An error a plugin's login handler handed back (`?socialError=`, `?mcError=`, …): a known
   * core code, a plugin's own i18n key, or a bare code shown through the generic line.
   *
   * @param {unknown} value
   */
  function showInitialError(value) {
    const code = String(value || '').trim();

    if (!code) {
      return;
    }

    if (ERROR_KEYS[code.toUpperCase()]) {
      fail(ERROR_KEYS[code.toUpperCase()]);
    } else if (code.startsWith('plugins.')) {
      fail(code);
    } else {
      fail('pages.auth.login.errors.generic', { code });
    }
  }

  onMount(() => {
    // The root error page shows this form without the page load, so the plugin pipeline runs
    // here instead; everything it adds is client-only anyway (captcha, 2FA, OAuth buttons).
    if (!data?.loginLoaded) {
      void executeLoginLoad().then((loginData) => showInitialError(loginData.error));
    } else {
      showInitialError(data.initialError);
    }

    try {
      const remembered = localStorage.getItem(REMEMBER_STORAGE_KEY);

      if (remembered) {
        usernameOrEmail = remembered;
        rememberMe = true;
      }
    } catch {
      /* see rememberIdentifier() */
    }

    if ($siteInfo?.isDemo && !usernameOrEmail) {
      usernameOrEmail = 'demo';
      password = '123456';
      passwordVisible = true;
    }
  });
</script>
