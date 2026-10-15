import { redirect } from '@sveltejs/kit';

import { base } from '@panomc/sdk/core/js/basePath.js';

/**
 * The single layout's old address: it is the main layout now, one of several.
 *
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load() {
  throw redirect(
    302,
    `${base}/settings/mail-templates/layouts/${encodeURIComponent('core:default')}`,
  );
}
