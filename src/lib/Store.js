import { get, writable } from "svelte/store";

import { invalidateAll } from "$app/navigation";

import { PanelSidebarStorageUtil } from "$lib/storage.util";

export const options = Object.freeze({
  DEFAULT_PAGE_TITLE: "Pano",
});

export const networkErrorCallbacks = writable([]);
export const retryingNetworkErrors = writable(false);

export const quickNotifications = writable([]);

export const logoutLoading = writable(false);

export const websiteLogoSrc = writable("/api/websiteLogo");

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
      return
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
      await callback(true)

      calledList.push(callback);

      networkErrorCallbacks.update((list) =>
        list.filter((item) => item !== callback),
      );

      check(currentList, calledList);
    } catch (_) {
      calledList.push(callback);

      check(currentList, calledList);
    }
  }
}
