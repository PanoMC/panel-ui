import { redirect } from '@sveltejs/kit';

import { base } from '$app/paths';

/**
 * The backups used to live under Settings (with sub-pages for Pano Backup and the transfer);
 * old bookmarks land on the single page that replaced them.
 *
 * @type {import('@sveltejs/kit').PageLoad}
 */
export function load() {
  throw redirect(301, `${base}/backups`);
}
