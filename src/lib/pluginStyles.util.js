/**
 * The own stylesheet of a plugin (`client/plugin.css` of its UI package) for plugin views the panel
 * draws outside a plugin page: the items plugins add to the sign-in form.
 *
 * A theme links that file for every plugin view. The panel did not: a view rendered by the server
 * carried its styles along, one mounted in the browser (the sign-in form shown in place of a page,
 * on `/panel/` while signed out) came without them, so a "Continue with Discord" button fell back
 * to a bare `.btn`.
 *
 * The file wraps its rules in `@layer pano-plugin`, which a theme orders below its own sheet on
 * purpose. The panel's Bootstrap is not layered, and an unlayered rule beats a layered one whatever
 * its selector, so the wrapper is taken off before the rules go into the page.
 */

/**
 * The plugins that own some of [items]: an item id starts with its plugin's id
 * (`pano-plugin-auth-guard-magic-login`). The longest matching id wins, so `pano-plugin-market`
 * does not claim an item of `pano-plugin-market-paypal`.
 *
 * @param {{ id?: string }[]} items
 * @param {string[]} pluginIds
 * @returns {string[]} sorted, each once
 */
export function pluginIdsOf(items, pluginIds) {
  const known = [...pluginIds].sort((a, b) => b.length - a.length);
  const found = new Set();

  for (const item of items ?? []) {
    const id = String(item?.id ?? '');
    const owner = known.find((pluginId) => id === pluginId || id.startsWith(pluginId + '-'));

    if (owner) found.add(owner);
  }

  return [...found].sort();
}

/** The rules of a plugin sheet without the `@layer pano-plugin { ... }` around them. */
export function unlayer(css) {
  const text = String(css ?? '');
  const match = /^\s*@layer\s+pano-plugin\s*\{/.exec(text);
  const end = text.lastIndexOf('}');

  return match && end > match[0].length ? text.slice(match[0].length, end) : text;
}

/** Where a plugin's own sheet is served, below the panel's base path. */
export function pluginStyleUrl(pluginId, uiHash, base = '') {
  const query = uiHash ? `?v=${encodeURIComponent(uiHash)}` : '';

  return `${base}/plugins/${encodeURIComponent(pluginId)}/resources/plugin-ui/client/plugin.css${query}`;
}

const STYLE_ATTRIBUTE = 'data-pano-plugin-style';

/**
 * Puts the own sheet of each of [pluginIds] into the page, once per plugin and UI build. A plugin
 * without a sheet (404) or a failed read is left as it is: the view still works, only plainer.
 * Browser only.
 *
 * @param {string[]} pluginIds
 * @param {Record<string, { uiHash?: string }>} plugins the active plugins
 * @param {string} [base] the panel's base path
 */
export async function ensurePluginStyles(pluginIds, plugins, base = '') {
  if (typeof document === 'undefined') return;

  await Promise.all(
    pluginIds.map(async (pluginId) => {
      const key = `${pluginId}@${plugins?.[pluginId]?.uiHash ?? ''}`;

      if (document.head.querySelector(`style[${STYLE_ATTRIBUTE}="${CSS.escape(key)}"]`)) return;

      // claimed before the request, so two calls in a row ask once
      const style = document.createElement('style');

      style.setAttribute(STYLE_ATTRIBUTE, key);
      document.head.appendChild(style);

      try {
        const response = await fetch(pluginStyleUrl(pluginId, plugins?.[pluginId]?.uiHash, base));

        if (response.ok && /css/.test(response.headers.get('content-type') || '')) {
          style.textContent = unlayer(await response.text());
        }
      } catch {
        /* a plugin without a sheet stays as it is */
      }
    }),
  );
}
