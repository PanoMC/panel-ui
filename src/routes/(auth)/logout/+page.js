import { browser } from '$app/environment';
import { base } from '$app/paths';

import { sendLogout } from '$lib/auth.api.js';
import { teardownPanelRealtime } from '$lib/panelRealtime.js';
import { logoutLoading } from '$lib/Store.js';

/**
 * `/panel/logout` — drops the session, then lands on the panel's own login page (U-06). The
 * request has to run in the browser: the backend clears the auth cookies with `Set-Cookie`, and
 * a `Set-Cookie` on a load's server-side fetch never reaches the visitor.
 *
 * The hand-off is a full navigation rather than `goto`, for the same reason the login page
 * reloads on success — the root layout's server load has no URL dependency, so a client-side
 * navigation would keep serving the `basicData` of the session that was just thrown away.
 *
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load() {
  if (!browser) {
    return {};
  }

  logoutLoading.set(true);

  // Best effort: an expired session answers 401, and there is nothing left to clean up then.
  await sendLogout().catch(() => null);

  teardownPanelRealtime();

  window.location.assign(`${base}/login`);

  return {};
}
