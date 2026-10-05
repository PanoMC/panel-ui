import { createFeatureSet } from '@panomc/sdk/core/js/PluginAPI.js';

/**
 * The capability ids the panel announces through `pano.features` (theme-core spec 4.1, panel
 * column). Plugins test `pano.features?.has('<id>')` instead of comparing versions.
 */
export const PANEL_FEATURE_IDS = Object.freeze([
  'context-components',
  'toast-escaped-values',
  'decoded-route-params',
  'layout-route-params',
  'plugin-notifications',
  'player-detail-menu',
  'panel-auth-util',
  'permission-any-of',
]);

export const panelFeatures = createFeatureSet(PANEL_FEATURE_IDS);
