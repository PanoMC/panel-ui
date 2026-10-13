import { writable } from 'svelte/store';

import ApiUtil from '$lib/api.util.js';
import { createCompatibilityApi } from '$lib/pages/addons/compat/compat.api.js';
import { attentionCounts, normalizeCompatibility } from '$lib/pages/addons/compat/compat.util.js';

/**
 * How many addons and themes need the admin, for the dot beside "Addons" and "Themes" in the sidebar
 * (refused or held by the API level gate, failed to start, premium without a usable licence). The
 * sidebar reads it once on arrival and the addon list after every load (`refreshCompatAttention`).
 */
export const compatAttention = writable({ addons: 0, themes: 0 });

/** @type {Promise<void> | null} */
let running = null;

/**
 * Reads the compatibility answer the panel already has and counts what needs attention. A failed
 * or refused read counts as nothing: the icon is a hint, never a reason to break the menu.
 */
export function refreshCompatAttention() {
  running ??= (async () => {
    try {
      // Each read stands alone: one the admin may not make (no permission) just adds nothing.
      const items = (path) =>
        ApiUtil.get({ path })
          .then((body) => (body && !body.error && Array.isArray(body.items) ? body.items : null))
          .catch(() => null);
      const [report, plugins, themes] = await Promise.all([
        createCompatibilityApi(ApiUtil)
          .getCompatibility()
          .catch(() => null),
        items('/panel/addons?status=ALL'),
        items('/panel/themes?status=ALL'),
      ]);

      compatAttention.set(
        attentionCounts(report?.ok ? normalizeCompatibility(report.body) : null, {
          plugins,
          themes,
        }),
      );
    } catch {
      // keep what is shown
    } finally {
      running = null;
    }
  })();

  return running;
}
