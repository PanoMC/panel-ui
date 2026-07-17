import { baseAPI, pageAPI } from '../pano-sdk/core/js/PluginAPI';
import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { plugins } from '$lib/PluginManager.js';
import { originalSiteNavItems } from '$lib/components/sidebar/SiteNavigationMenu.svelte';
import { originalServerNavItems } from '$lib/components/sidebar/ServerNavigationMenu.svelte';
import { originalThemeMenuItems } from '$lib/pages/view/Themes.svelte';
import { originalPostMenuItems } from '$lib/pages/Posts.svelte';
import { avatarVersion } from './Store.js';
// The shared plugin engine lives in @panomc/theme-core. The panel is NOT yet wired with the
// `$pano` vite alias (that lands with the theme-core migration), so this imports through the
// package's exports map — resolvable regardless of the alias.
import {
  createHookEngine,
  createLifecycleRegistry,
  createSlotRegistry,
} from '@panomc/theme-core/plugin-engine/engine.js';

// PANEL profile: composes the shared engine into the panel's `pano.ui.*` namespace tree. Moving
// onto the engine upgrades the panel with the fixes it was missing — `_seq` ordering + sortHooks
// on hook.get (kills the SSR/CSR insertion-order drift), structuredCloneSafe on SSR prop passing,
// and the fixed executeHookLoad pipeline — while keeping the panel's exact public surface.
const lifecycle = createLifecycleRegistry();
const hooks = createHookEngine();
const slots = createSlotRegistry({
  getPlugins: () => get(plugins),
  browser,
  executeLifecycle: lifecycle.executeLifecycle,
  lifecyclePrefix: 'panel',
});

export const siteNavigationItems = writable([]);
export const serverNavigationItems = writable([]);
export const themeMenuItems = writable([]);
export const postMenuItems = writable([]);

export async function init() {
  siteNavigationItems.set(structuredClone(originalSiteNavItems));
  serverNavigationItems.set(structuredClone(originalServerNavItems));
  themeMenuItems.set(structuredClone(originalThemeMenuItems));
  postMenuItems.set(structuredClone(originalPostMenuItems));
  hooks.reset();
  slots.reset();
  lifecycle.reset();
}

export const executeLifecycle = lifecycle.executeLifecycle;
export const executeHookLoad = hooks.executeHookLoad;

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
            slots.edit('player-edit-modal-rows', callback);
          },
          get() {
            return derived(slots.uiItems, ($items) => {
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
        lifecycle.on(name, handler);
      },
    },
    hook: {
      register(options) {
        hooks.register(options);
      },
      get(name) {
        return hooks.get(name);
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
