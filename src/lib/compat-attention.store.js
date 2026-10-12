import { writable } from 'svelte/store';

import ApiUtil from '$lib/api.util.js';
import { createCompatibilityApi } from '$lib/pages/addons/compat/compat.api.js';
import { attentionCounts, normalizeCompatibility } from '$lib/pages/addons/compat/compat.util.js';

/**
 * How many addons need the admin, for the small exclamation icon beside "Addons" in the sidebar.
 * The list sets it from the data it just loaded; the sidebar reads it once on arrival
 * (`refreshCompatAttention`).
 */
export const compatAttention = writable({ addons: 0 });

/** @type {Promise<void> | null} */
let running = null;

/**
 * Reads the compatibility answer the panel already has and counts what needs attention. A failed
 * or refused read counts as nothing: the icon is a hint, never a reason to break the menu.
 */
export function refreshCompatAttention() {
  running ??= (async () => {
    try {
      const report = await createCompatibilityApi(ApiUtil).getCompatibility();

      compatAttention.set(attentionCounts(report.ok ? normalizeCompatibility(report.body) : null));
    } catch {
      // keep what is shown
    } finally {
      running = null;
    }
  })();

  return running;
}
