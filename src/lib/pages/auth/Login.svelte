<style>
  .login-card {
    max-width: 26rem;
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
    {/if}
  </div>
</div>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { isSignedIn, safeNextPath } from '$lib/auth.api.js';
  import { UsageModes } from '$lib/navigation.util.js';

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

    // With the website on, the theme's login page is the one to use (see `signInPath`).
    if (data?.usageMode !== UsageModes.SERVERS) {
      throw redirect(302, '/login');
    }

    return {};
  }
</script>

<script>
  /**
   * The panel-native login form (§2.4.9). It is a second front end for the *same* endpoints the
   * theme's login page uses — `POST /api/auth/login` then `GET /api/auth/credentials` — so the
   * cookies, the CSRF token and every error code behave identically; nothing about the session
   * is panel-specific.
   *
   * Two-factor authentication is not part of core: `pano-plugin-auth-guard` denies the login
   * from its `onBeforeLogin` hook with `PLUGIN_DENIED_LOGIN` + a `two-factor-required` reason,
   * and the same request is replayed with `totpCode` added to the body. The theme does that
   * with a fetch interceptor it injects into the theme bundle; the panel has no such component,
   * so the step is handled here explicitly.
   */
  import { getContext, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { format } from 'date-fns';
  import * as dateFnsLocales from 'date-fns/locale';

  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  import { getCredentials, sendLogin } from '$lib/auth.api.js';
  import { currentLanguage } from '$lib/language.util.js';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  // `UsageModes` comes from the module script above, whose scope this shares.

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

    // Confirms the cookies really took before the page reloads into the dashboard. A failure
    // here is not fatal — the next document load re-reads `basicData` anyway.
    await getCredentials(csrfToken).catch(() => null);

    await showSuccess('pages.auth.login.signed-in');

    const target = safeNextPath($page.url.searchParams.get('next'), base) || base || '/';

    // A full navigation, not `goto`: the panel wires its realtime hub, its plugin bundles and
    // its permission-gated modals once per document, and the root layout's server load has no
    // URL dependency to invalidate. Reloading is what makes the freshly minted session real.
    if (browser) {
      window.location.assign(target);
    }
  }

  /**
   * @param {Record<string, any>} response the `{ result: 'error', ... }` body.
   */
  async function handleFailure(response) {
    const code = String(response.error || '').toUpperCase();

    if (code === 'PLUGIN_DENIED_LOGIN') {
      const reason = String(response.reason || '');

      if (TWO_FACTOR_REQUIRED_REASONS.includes(reason)) {
        captchaStepToken = response.captchaStepToken ?? null;
        step = Steps.TWO_FACTOR;
        totpCode = '';
        clearError();

        await tick();
        totpInput?.focus();

        return;
      }

      if (TWO_FACTOR_INVALID_REASONS.includes(reason)) {
        totpCode = '';
        fail('pages.auth.login.errors.two-factor-invalid');

        await tick();
        totpInput?.focus();

        return;
      }

      fail(ERROR_KEYS.PLUGIN_DENIED_LOGIN);

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

  onMount(() => {
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
