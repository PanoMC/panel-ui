import { writable } from 'svelte/store';

import ApiUtil from '$lib/api.util.js';
import { hasPermission, Permissions } from '$lib/auth.util.js';
import { createCompatibilityApi } from '$lib/pages/addons/compat/compat.api.js';
import { attentionCounts, normalizeCompatibility } from '$lib/pages/addons/compat/compat.util.js';
import { normalizeReport } from '$lib/pages/view/theme/compat.util.js';
import { createThemeApi } from '$lib/pages/view/theme/theme.api.js';

/**
 * How many addons and themes need the admin, for the small exclamation icon beside "Addons" and
 * "Themes" in the sidebar. The lists set it from the data they just loaded; the sidebar reads it
 * once on arrival (`refreshCompatAttention`).
 */
export const compatAttention = writable({ addons: 0, themes: 0 });

/** @type {Promise<void> | null} */
let running = null;

/**
 * Reads the two compatibility answers the panel already has and counts what needs attention. A
 * failed or refused read counts as nothing: the icon is a hint, never a reason to break the menu.
 */
export function refreshCompatAttention() {
  running ??= (async () => {
    try {
      const [report, themeReport] = await Promise.all([
        createCompatibilityApi(ApiUtil).getCompatibility(),
        hasPermission(Permissions.MANAGE_VIEW)
          ? createThemeApi(ApiUtil).getCompatibility()
          : Promise.resolve(null),
      ]);

      compatAttention.set(
        attentionCounts(
          report.ok ? normalizeCompatibility(report.body) : null,
          themeReport?.ok ? normalizeReport(themeReport.body) : null,
        ),
      );
    } catch {
      // keep what is shown
    } finally {
      running = null;
    }
  })();

  return running;
}
