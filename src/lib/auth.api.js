/**
 * The core authentication endpoints, called exactly the way the theme calls them
 * (`@panomc/theme-core` → `src/lib/services/auth.js`). The panel-native login (U-06) is a
 * second front end for the *same* API, so nothing here may diverge: the backend sets the auth
 * and CSRF cookies itself on `POST /api/auth/login` (HttpOnly, path `/`), and the panel's
 * `hooks.server.js` picks them up on the next document load — which is why the login page
 * finishes with a full navigation instead of a client-side `goto`.
 *
 * Every call is made without an `ApiUtil` handler, again like the theme: a network failure then
 * resolves to `undefined` instead of latching the panel's offline splash over the login form.
 */

import ApiUtil from '$lib/api.util.js';

/**
 * `POST /api/auth/login`.
 *
 * Body: `{ usernameOrEmail, password?, registerEmail?, newUsername? }` — plus any field a
 * plugin's `AuthEventListener` reads straight off the request body (pano-plugin-auth-guard
 * reads `totpCode` and `captchaStepToken` there). Answers `{ result: 'ok', csrfToken }`, or
 * `{ result: 'error', error: '<CODE>', ... }`.
 *
 * @param {Record<string, unknown>} body
 * @returns {Promise<Record<string, any> | undefined>}
 */
export function sendLogin(body) {
  return ApiUtil.post({ path: '/api/auth/login', body });
}

/**
 * `POST /api/auth/logout` — clears the auth cookies server-side. Allowed while the site is in
 * maintenance, so it works from anywhere.
 *
 * @returns {Promise<Record<string, any> | undefined>}
 */
export function sendLogout() {
  return ApiUtil.post({ path: '/api/auth/logout' });
}

/**
 * `GET /api/auth/credentials` — the signed-in user. The theme calls it right after a login to
 * refresh its session store; the panel only uses it to confirm the cookies really took before
 * it navigates into the dashboard.
 *
 * @param {string} [csrfToken] the token the login response returned.
 * @returns {Promise<Record<string, any> | undefined>}
 */
export function getCredentials(csrfToken) {
  return ApiUtil.get({ path: '/api/auth/credentials', csrfToken });
}

/**
 * Whether `basicData` says nobody is signed in. A user who *is* signed in but lacks
 * `ACCESS_PANEL` answers `NO_PERMISSION` instead — sending them to the login page would only
 * bounce them straight back, so that case keeps the existing "no permission" splash.
 *
 * @param {{ result?: string, error?: string } | null | undefined} basicData
 * @returns {boolean}
 */
export function isNotLoggedIn(basicData) {
  return String(basicData?.error || '').toUpperCase() === 'NOT_LOGGED_IN';
}

/**
 * Whether `basicData` describes a usable panel session.
 *
 * @param {{ result?: string } | null | undefined} basicData
 * @returns {boolean}
 */
export function isSignedIn(basicData) {
  return basicData?.result === 'ok';
}

/**
 * Sanitizes a `?next=` value into a path this app may navigate to. Anything that is not a
 * same-origin absolute path (`//evil.com`, `/\evil.com`, `https://…`) is dropped, so the login
 * page can never be turned into an open redirect.
 *
 * @param {string | null | undefined} next
 * @param {string} base the app's base path (`/panel`).
 * @returns {string} a safe path, or '' when there was none.
 */
export function safeNextPath(next, base) {
  const value = String(next || '').trim();

  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '';
  }

  // The panel is mounted under `base`; a path outside it belongs to the theme, not here.
  if (base && !(value === base || value.startsWith(`${base}/`) || value.startsWith(`${base}?`))) {
    return '';
  }

  // `/panel/login` itself would loop.
  if (value === `${base}/login` || value.startsWith(`${base}/login?`)) {
    return '';
  }

  return value;
}
