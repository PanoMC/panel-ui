import { describeError } from '$lib/pano-backup.util.js';
import { websiteDisplayHost } from '$lib/website-display.util.js';

/**
 * `describeError` with `{website}` filled from the Pano website this panel is configured with
 * (siteInfo's website URL), so the texts never name panomc.com when another site runs Pano.
 *
 * @param {any} source
 * @param {{ locale?: string }} [options]
 */
export function describeBackupError(source, options = {}) {
  return describeError(source, { ...options, website: websiteDisplayHost() });
}
