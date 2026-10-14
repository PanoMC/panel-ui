import { error } from '@sveltejs/kit';

import { requireSignedIn } from '$lib/auth.api.js';
import { hasPermission, Permissions } from '$lib/auth.util.js';

/**
 * Pages opened in a window of their own (the mail template preview): no sidebar, no navbar, but
 * the same session and permission as the editor that opens them. A signed-out visitor is sent to
 * the login by the root layout (or gets the login form in place on a SERVERS install); a signed-in
 * admin without `MANAGE_MAIL_TEMPLATES` gets a 403.
 *
 * @type {import('@sveltejs/kit').LayoutLoad}
 */
export async function load({ parent }) {
  const parentData = await parent();

  parentData.resetLayout.set(true);

  requireSignedIn(parentData);

  if (!hasPermission(Permissions.MANAGE_MAIL_TEMPLATES, parentData.user)) {
    throw error(403, 'NO_PERMISSION');
  }

  return {};
}
