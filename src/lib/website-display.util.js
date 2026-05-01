import { PANO_WEBSITE_URL } from '$lib/variables.js';

/** Hostname from configured website URL (e.g. panomc.com) for translation placeholders. */
export function websiteDisplayHost(url = PANO_WEBSITE_URL) {
  if (!url || typeof url !== 'string') return '';
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(normalized).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || url;
  }
}
