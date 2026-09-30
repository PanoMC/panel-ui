import { baseAPI, pageAPI } from '@panomc/sdk/core/js/PluginAPI';
import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { plugins } from '$lib/PluginManager.js';
import { originalSiteNavItems } from '$lib/components/sidebar/SiteNavigationMenu.svelte';
import { originalServerNavItems } from '$lib/components/sidebar/ServerNavigationMenu.svelte';
import { originalThemeMenuItems } from '$lib/pages/view/Themes.svelte';
import { originalPostMenuItems } from '$lib/pages/Posts.svelte';
import { avatarVersion } from './Store.js';
import { completeSignIn } from './signIn.util.js';
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
export const executeViewLoad = slots.executeViewLoad;

/**
 * The panel's sign-in page runs the same plugin pipeline as the theme's `/login`: the
 * `panel:login:load` lifecycle, then the `login-content` and `login-alt-methods` view slots.
 * Shared by the page load and the plugin-facing `pano.ui.auth.login.load`, so a plugin page that
 * presents a login (social login's completion step, …) gets the same widgets.
 *
 * @param {any} [event] the SvelteKit load event; absent when called from a component.
 * @returns {Promise<{ error: string | null, username: string | null, event: any }>}
 */
export async function executeLoginLoad(event) {
  // Plugin handlers read `event.url` (`?socialError=`, `?mcError=`, …); a component-side call
  // has no load event, so it gets the address in the bar.
  if (!event && browser) {
    event = { url: new URL(window.location.href) };
  }

  slots.edit('login-content', (items) => {
    items.push({ id: 'login-form', priority: 100, hidden: false });
  });

  const data = { error: null, username: null, event };

  await lifecycle.executeLifecycle('panel:login:load', data, event);
  await slots.executeViewLoad('login-content', event);
  await slots.executeViewLoad('login-alt-methods', event);

  return data;
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
        /**
         * Edits the sections shown under the server named by `/servers/[id]`.
         *
         * An item is `{ href, icon, text, startsWith?, permission?, capability?, modes? }`.
         * `href` is relative to the server (`/console` renders as `/servers/<id>/console`,
         * `''` is the server overview) and the optional `capability` is a capability id — or a
         * list of which any one is enough — the server must have announced, so a section a
         * server cannot serve is never shown. See `originalServerNavItems` in
         * `components/sidebar/ServerNavigationMenu.svelte`.
         */
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
      // The generic view-slot surface, same as the theme's `pano.ui.view`.
      register(options) {
        slots.register(options);
      },
      hide(viewId, id) {
        slots.hide(viewId, id);
      },
      show(viewId, id) {
        slots.show(viewId, id);
      },
      move(viewId, id, priority) {
        slots.move(viewId, id, priority);
      },
      get(viewId) {
        return slots.get(viewId);
      },
      onLoad(viewId, handler) {
        panoApi.ui.lifecycle.on(`panel:view:${viewId}:load`, handler);
      },
      async load(viewId, event) {
        return await slots.executeViewLoad(viewId, event);
      },
    },
    /**
     * The sign-in surface, shaped exactly like the theme's `pano.ui.auth.login` so a plugin
     * registers the same captcha, 2FA and alternative-method items in both. The panel only shows
     * its own sign-in page on a SERVERS install (no theme runs there); anywhere else a signed-out
     * visitor is sent to the theme's `/login` and these handlers never fire.
     */
    auth: {
      login: {
        content: {
          edit(callback) {
            slots.edit('login-content', callback);
          },
          get() {
            return slots.get('login-content');
          },
        },
        alternativeMethods: {
          add(method) {
            slots.upsert('login-alt-methods', method);
          },
          get() {
            return slots.get('login-alt-methods');
          },
        },
        onLoad(handler) {
          panoApi.ui.lifecycle.on('panel:login:load', handler);
        },
        async load(event) {
          return await executeLoginLoad(event);
        },
        /**
         * Panel-only: finishes a plugin sign-in flow once the backend has set the cookies —
         * checks panel access (a session without it is closed again), then opens `?next=` or the
         * dashboard. Resolves to `'ok'` or `'NO_PANEL_ACCESS'`.
         *
         * @param {string} csrfToken
         * @param {{ target?: string }} [options]
         */
        complete(csrfToken, options) {
          return completeSignIn(csrfToken, options);
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
      async execute(name, data = {}, event) {
        await lifecycle.executeLifecycle(name, data, event);
        return data;
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
