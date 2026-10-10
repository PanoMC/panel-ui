import { redirect } from '@sveltejs/kit';

import { base } from '$app/paths';

/**
 * The Front-end settings are a dialog on the Themes page now; the old address (and the links the
 * backend's messages carry) lands there and opens it.
 *
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load({ url }) {
  const tab = url.searchParams.get('tab');

  throw redirect(302, `${base}/view?frontend=${encodeURIComponent(tab || 'open')}`);
}
