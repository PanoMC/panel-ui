import { baseAPI, pageAPI } from '../pano-sdk/core/js/PluginAPI';
import { derived, writable, get } from 'svelte/store';
import { originalSiteNavItems } from '$lib/components/sidebar/SiteNavigationMenu.svelte';
import { originalServerNavItems } from '$lib/components/sidebar/ServerNavigationMenu.svelte';
import { originalThemeMenuItems } from '$lib/pages/view/Themes.svelte';
import { originalPostMenuItems } from '$lib/pages/Posts.svelte';
import { avatarVersion } from './Store.js';

const hooks = writable({});
const uiItems = writable({});

// Deduplicate items by id, keeping the last occurrence
function deduplicateById(arr) {
  const seen = new Map();
  for (const item of arr) {
    if (item.id) seen.set(item.id, item);
    else seen.set(Symbol(), item);
  }
  arr.length = 0;
  arr.push(...seen.values());
}

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
  uiItems.set({});
  lifecycleHandlers.set({});
}

const lifecycleHandlers = writable({});

export async function executeLifecycle(name, data, event) {
  const handlers = get(lifecycleHandlers)[name] || [];
  await Promise.allSettled(
    handlers.map(async (handler) => {
      try {
        await handler(data, event);
      } catch (e) {
        console.error(`[Lifecycle:${name}] failed`, e);
      }
    })
  );
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
  console.debug(`[Hook:${name}] Executing ${list.length} hooks`);

  // Resolve all modules and execute load functions in parallel
  const results = await Promise.all(
    list.map(async (entry) => {
      const raw = entry.component || entry;
      let module = raw;
      if (typeof raw === 'function' && !raw.prototype) {
        module = await raw();
        // Cache the resolved module back into the hooks store
        hooks.update((h) => {
          if (h[name]) {
            const idx = h[name].findIndex((item) => (item.component || item) === raw);
            if (idx !== -1) {
              if (h[name][idx].component) {
                h[name][idx].component = Object.assign(module, { _original: raw });
              } else {
                h[name][idx] = Object.assign(module, { _original: raw });
              }
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
        // PER-EVENT COMPONENT CACHE: reuse results if this component already loaded for another hook in this event
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
      return props && typeof props === "object" && Object.keys(props).length > 0 ? props : {};
    })
  );

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
      },
    },
    addon: {
      onLoad(handler) {
        panoApi.ui.lifecycle.on('panel:addon-detail:load', handler);
      },
    },
    player: {
      onEditLoad(handler) {
        panoApi.ui.lifecycle.on('panel:player-detail:edit-modal:load', handler);
      },
      editModal: {
        cardRows: {
          edit(callback) {
            uiItems.update((items) => {
              if (!items['player-edit-modal-rows']) items['player-edit-modal-rows'] = [];
              callback(items['player-edit-modal-rows']);
              deduplicateById(items['player-edit-modal-rows']);
              return items;
            });
          },
          get() {
            return derived(uiItems, ($items) => {
              return ($items['player-edit-modal-rows'] || [])
                .filter((item) => !item.hidden)
                .sort((a, b) => (b.priority || 0) - (a.priority || 0));
            });
          },
        },
      },
    },
    lifecycle: {
      on(name, handler) {
        lifecycleHandlers.update((h) => {
          if (!h[name]) h[name] = [];
          h[name].push(handler);
          return h;
        });
      },
    },
    hook: {
      register(options) {
        const { name } = options;
        hooks.update((h) => {
          if (!h[name]) h[name] = [];
          h[name].push(options);
          return h;
        });
      },
      get(name) {
        return derived(hooks, ($h) => $h[name] || []);
      },
    },
    avatar: {
      updateVersion() {
        avatarVersion.set(`&v=${Date.now()}`);
      },
      getVersion() {
        return avatarVersion;
      },
    },
  },
};

export const panoApiServer = {
  ...panoApi,
};

export const panoApiClient = {
  ...panoApi,
};
