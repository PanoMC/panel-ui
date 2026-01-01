import { baseAPI, pageAPI } from "../pano-ui/js/PluginAPI";
import { originalSiteNavItems } from "$lib/component/sidebar/SiteNavigationMenu.svelte";
import { originalServerNavItems } from "$lib/component/sidebar/ServerNavigationMenu.svelte";

export let siteNavigationItems = [];
export let serverNavigationItems = [];

export async function init() {
  siteNavigationItems = structuredClone(originalSiteNavItems);
  serverNavigationItems = structuredClone(originalServerNavItems);
}

export const panoApi = {
  ...baseAPI,
  ui: {
    ...pageAPI,
    nav: {
      site: {
        async editNavLinks(
          handler = async (navigationItems) => navigationItems,
        ) {
          siteNavigationItems = await handler(siteNavigationItems);
        },
      },
      server: {
        async editNavLinks(
          handler = async (navigationItems) => navigationItems,
        ) {
          serverNavigationItems = await handler(serverNavigationItems);
        },
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
