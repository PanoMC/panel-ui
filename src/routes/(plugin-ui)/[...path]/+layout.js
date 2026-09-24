import { requireSignedIn } from '$lib/auth.api.js';

import { load as loadLayout } from './+layout.svelte';

/**
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load(event) {
  // Plugin pages need a session as much as the panel's own do; a signed-out visitor on a
  // SERVERS install gets the login form in place instead of a plugin's 404.
  requireSignedIn(await event.parent());

  return loadLayout(event);
}
