import { requireSignedIn } from '$lib/auth.api.js';

/**
 * Every panel page needs a session. On a SERVERS install the root layout no longer redirects a
 * signed-out visitor anywhere; this is where their request stops, with the login form rendered
 * in place (see `requireSignedIn`).
 *
 * @type {import('@sveltejs/kit').LayoutLoad}
 */
export async function load({ parent }) {
  requireSignedIn(await parent());

  return {};
}
