import { baseAPI, pageAPI } from '../pano-sdk/core/js/PluginAPI';
import { originalSiteNavItems } from '$lib/component/sidebar/SiteNavigationMenu.svelte';
import { originalServerNavItems } from '$lib/component/sidebar/ServerNavigationMenu.svelte';
import { originalThemeMenuItems } from '$lib/pages/view/Themes.svelte';
import { originalPostMenuItems } from '$lib/pages/Posts.svelte';

export let siteNavigationItems = [];
export let serverNavigationItems = [];
export let themeMenuItems = [];
export let postMenuItems = [];

export async function init() {
  siteNavigationItems = structuredClone(originalSiteNavItems);
  serverNavigationItems = structuredClone(originalServerNavItems);
  themeMenuItems = structuredClone(originalThemeMenuItems);
  postMenuItems = structuredClone(originalPostMenuItems);
}

export const panoApi = {
  ...baseAPI,
  ui: {
    ...pageAPI,
    nav: {
      site: {
        async editNavLinks(handler = async (navigationItems) => navigationItems) {
          siteNavigationItems = await handler(siteNavigationItems);
        },
      },
      server: {
        async editNavLinks(handler = async (navigationItems) => navigationItems) {
          serverNavigationItems = await handler(serverNavigationItems);
        },
      },
    },
    view: {
      themes: {
        async editMenu(handler = async (items) => items) {
          themeMenuItems = await handler(themeMenuItems);
        },
      },
    },
    posts: {
      async editMenu(handler = async (items) => items) {
        postMenuItems = await handler(postMenuItems);
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
