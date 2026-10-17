import { redirect } from '@sveltejs/kit';

import { base } from '@panomc/sdk/core/js/basePath.js';

/**
 * The single layout's old address, and the old editor addresses: the editors are dialogs on the
 * mail templates page now.
 *
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load() {
  throw redirect(302, `${base}/settings/mail-templates`);
}
