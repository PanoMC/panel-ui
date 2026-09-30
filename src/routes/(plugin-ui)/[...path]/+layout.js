import { base } from '$app/paths';

import { requireSignedIn } from '$lib/auth.api.js';
import { findMatch, registeredPages } from '$lib/PluginManager.js';

import { load as loadLayout } from './+layout.svelte';

/**
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load(event) {
  // The root layout is what loads the plugins, so their pages exist only after it ran.
  const parentData = await event.parent();

  const pathname = event.url.pathname;
  const registeredPage = findMatch(
    registeredPages,
    pathname.startsWith(base) ? pathname.slice(base.length) : pathname,
  );

  // Plugin pages need a session as much as the panel's own do; a signed-out visitor on a
  // SERVERS install gets the login form in place instead of a plugin's 404. A page registered
  // with `public: true` is the exception: it is part of signing in (an OAuth callback, a
  // magic-link landing, …) and has to open without a session.
  if (!registeredPage?.public) {
    requireSignedIn(parentData);
  }

  return loadLayout(event);
}
