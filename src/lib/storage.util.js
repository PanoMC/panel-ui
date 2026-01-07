import { browser } from '$app/environment';

const SIDEBAR_STORAGE_STATUS = 'sidebar_storage_status';
const SIDEBAR_TABS_STORAGE_STATE = 'sidebar_tabs_storage_state';

export const PanelSidebarStorageUtil = {
  getSidebarOpenStatus() {
    return browser ? localStorage.getItem(SIDEBAR_STORAGE_STATUS) === 'true' : true;
  },

  savePanelSidebarStorageUtil(status) {
    localStorage.setItem(SIDEBAR_STORAGE_STATUS, status);
  },

  isThereSideBarOpenStatus() {
    return browser ? !!localStorage.getItem(SIDEBAR_STORAGE_STATUS) : true;
  },

  getSidebarTabsState() {
    return browser ? localStorage.getItem(SIDEBAR_TABS_STORAGE_STATE) : 'website';
  },

  setSidebarTabsState(state) {
    localStorage.setItem(SIDEBAR_TABS_STORAGE_STATE, state);
  },

  isThereSideBarTabsState() {
    return browser ? !!localStorage.getItem(SIDEBAR_TABS_STORAGE_STATE) : false;
  },
};
