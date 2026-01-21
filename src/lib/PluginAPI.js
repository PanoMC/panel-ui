import { baseAPI, pageAPI } from '../pano-sdk/core/js/PluginAPI';
import { derived, writable, get } from "svelte/store";
import { originalSiteNavItems } from '$lib/component/sidebar/SiteNavigationMenu.svelte';
import { originalServerNavItems } from '$lib/component/sidebar/ServerNavigationMenu.svelte';
import { originalThemeMenuItems } from '$lib/pages/view/Themes.svelte';
import { originalPostMenuItems } from '$lib/pages/Posts.svelte';

const hooks = writable({});

export const siteNavigationItems = writable([]);
export const serverNavigationItems = writable([]);
export const themeMenuItems = writable([]);
export const postMenuItems = writable([]);

export async function init() {
  siteNavigationItems.set(structuredClone(originalSiteNavItems));
  serverNavigationItems.set(structuredClone(originalServerNavItems));
  themeMenuItems.set(structuredClone(originalThemeMenuItems));
  postMenuItems.set(structuredClone(originalPostMenuItems));
  hooks.set({});
  lifecycleHandlers.set({});
}

const lifecycleHandlers = writable({});

export async function executeLifecycle(name, data, event) {
  const handlers = get(lifecycleHandlers)[name] || [];
  for (const handler of handlers) {
    try {
      await handler(data, event);
    } catch (e) {
      console.error(`[Lifecycle:${name}] failed`, e);
    }
  }
}

const hookExecutionCache = new WeakMap();
const componentLoadCache = new WeakMap();

export async function executeHookLoad(name, event) {
  // Prevent double execution of the SAME hook name during the same load cycle
  if (event) {
    if (!hookExecutionCache.has(event)) {
      hookExecutionCache.set(event, {});
    }
    const cache = hookExecutionCache.get(event);
    if (cache[name]) {
      return cache[name];
    }
  }

  const $h = get(hooks);
  const list = $h[name] || [];
  const results = [];

  console.debug(`[Hook:${name}] Executing ${list.length} hooks`);

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    const raw = entry.component || entry;
    let module = raw;
    if (typeof raw === 'function' && !raw.prototype) {
      module = await raw();
      // Cache the resolved module back into the hooks store
      hooks.update(h => {
        if (h[name]) {
          if (h[name][i].component) {
            h[name][i].component = Object.assign(module, { _original: raw });
          } else {
            h[name][i] = Object.assign(module, { _original: raw });
          }
        }
        return h;
      });
    } else if (typeof raw !== 'object' || !raw.default) {
      module = { default: raw };
    }

    let props = {};
    const Component = module.default || module;
    const loadFn = module.load || (Component && Component.load);

    if (loadFn && !entry.skipLoad) {
      // PER-EVENT COMPONENT CACHE: If this component already loaded for another hook in this event, reuse results.
      let eventCache = null;
      if (event) {
        if (!componentLoadCache.has(event)) componentLoadCache.set(event, new Map());
        eventCache = componentLoadCache.get(event);
      }

      if (eventCache && eventCache.has(module)) {
        props = eventCache.get(module);
      } else {
        try {
          props = await loadFn(event);
          if (eventCache) eventCache.set(module, props);
        } catch (e) {
          console.warn(`[Hook:${name}] Load failed`, e);
        }
      }
    }
    results.push(props || {});
  }

  // Cache the final results for this specific hook name
  if (event) {
    hookExecutionCache.get(event)[name] = results;
  }

  return results;
}

export const panoApi = {
  ...baseAPI,
  ui: {
    ...pageAPI,
    nav: {
      site: {
        async editNavLinks(handler = async (navigationItems) => navigationItems) {
          siteNavigationItems.set(await handler(get(siteNavigationItems)));
        },
      },
      server: {
        async editNavLinks(handler = async (navigationItems) => navigationItems) {
          serverNavigationItems.set(await handler(get(serverNavigationItems)));
        },
      },
    },
    view: {
      themes: {
        async editMenu(handler = async (items) => items) {
          themeMenuItems.set(await handler(get(themeMenuItems)));
        },
      },
    },
    posts: {
      async editMenu(handler = async (items) => items) {
        postMenuItems.set(await handler(get(postMenuItems)));
      },
      onLoad(handler) {
        panoApi.ui.lifecycle.on('panel:posts:load', handler);
      }
    },
    addon: {
      onLoad(handler) {
        panoApi.ui.lifecycle.on('panel:addon-detail:load', handler);
      }
    },
    lifecycle: {
      on(name, handler) {
        lifecycleHandlers.update(h => {
          if (!h[name]) h[name] = [];
          h[name].push(handler);
          return h;
        });
      },
    },
    hook: {
      register(options) {
        const { name } = options;
        hooks.update(h => {
          if (!h[name]) h[name] = [];
          h[name].push(options);
          return h;
        });
      },
      get(name) {
        return derived(hooks, $h => ($h[name] || []));
      }
    }
  },
};

export const panoApiServer = {
  ...panoApi,
};

export const panoApiClient = {
  ...panoApi,
};
