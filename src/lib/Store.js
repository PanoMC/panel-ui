import { get, writable } from 'svelte/store';

import { base } from '$app/paths';
import { page } from '$app/stores';

import { PanelSidebarStorageUtil } from '$lib/storage.util';
import ApiUtil from '$lib/api.util';
import { nudgePanelRealtimeReconnect } from '$lib/panelRealtime.js';

export const options = Object.freeze({
  DEFAULT_PAGE_TITLE: 'Pano',
});

export const networkErrorCallbacks = writable([]);
export const retryingNetworkErrors = writable(false);

export const quickNotifications = writable([]);

export const logoutLoading = writable(false);

export const websiteLogoSrc = writable('/api/websiteLogo');

export const initialized = writable(false);
export const avatarVersion = writable('');

export function toggleSidebar(isSidebarOpen) {
  isSidebarOpen.update((value) => {
    PanelSidebarStorageUtil.savePanelSidebarStorageUtil(!value);

    return !value;
  });
}

export function setSidebarTabsState(state, sidebarTabsState) {
  sidebarTabsState.set(state);

  PanelSidebarStorageUtil.setSidebarTabsState(state);
}

export function showNetworkError(callback) {
  networkErrorCallbacks.update((value) => value.concat(callback));
}

function check(currentList, calledList) {
  for (const item of currentList) {
    if (calledList.indexOf(item) === -1) {
      return;
    }
  }

  retryingNetworkErrors.set(false);
}

export async function resumeAfterNetworkError() {
  retryingNetworkErrors.set(true);

  const currentList = get(networkErrorCallbacks).concat();
  const calledList = [];

  for (const callback of currentList) {
    try {
      await callback(true);

      calledList.push(callback);

      networkErrorCallbacks.update((list) => list.filter((item) => item !== callback));

      check(currentList, calledList);
    } catch (_) {
      calledList.push(callback);

      check(currentList, calledList);
    }
  }

  nudgePanelRealtimeReconnect();
}
export async function logout() {
  logoutLoading.set(true);

  await ApiUtil.post({
    path: '/api/auth/logout',
    handler: () => {
      // A `SERVERS` install never starts a theme, so "/" has nothing to render — the panel's
      // own login page (U-06) is where a signed-out admin belongs. Every other mode keeps
      // landing on the website, which is what an admin expects after leaving the panel.
      const usageMode = get(page)?.data?.usageMode;

      window.location.href = usageMode === 'SERVERS' ? `${base}/login` : '/';
    },
  });
}
