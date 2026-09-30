import { get } from 'svelte/store';

import { base } from '$app/paths';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

import { getCredentials, safeNextPath, sendLogout } from '$lib/auth.api.js';
import { showSuccess } from '$lib/components/ToastContainer.svelte';

/**
 * Finishes a sign-in whose cookies the backend has already set: the panel's own login form, and
 * every plugin flow that ends in a session (social login, Microsoft login, magic link, …) through
 * `pano.ui.auth.login.complete`. One path so each of them gets the same panel-access check and
 * lands on the same page.
 *
 * @param {string} csrfToken the token the sign-in response returned.
 * @param {{ target?: string }} [options] where to go instead of `?next=` / the dashboard.
 * @returns {Promise<'ok' | 'NO_PANEL_ACCESS'>}
 */
export async function completeSignIn(csrfToken, { target } = {}) {
  // Confirms the cookies really took before the panel opens. A failure here is not fatal —
  // the loads below re-read `basicData` anyway.
  const credentials = await getCredentials(csrfToken).catch(() => null);

  // A backend older than the `panel` login flag, or a plugin flow that has no such flag at all,
  // signs anybody in. Such a session is of no use here and would only strand the visitor on the
  // permission splash, so it is closed again at once.
  if (credentials?.result === 'ok' && credentials.panelAccess === false) {
    await sendLogout().catch(() => null);

    return 'NO_PANEL_ACCESS';
  }

  await showSuccess('pages.auth.login.signed-in');

  const url = get(page).url;

  // No document reload: every load runs again with the new cookies (the root server load
  // re-reads `basicData` through hooks) and the root layout wires the realtime hub the moment
  // `signedIn` turns true. `replaceState` keeps the signed-out view out of the history.
  await goto(target || safeNextPath(url.searchParams.get('next'), base) || base || '/', {
    invalidateAll: true,
    replaceState: true,
  });

  return 'ok';
}
