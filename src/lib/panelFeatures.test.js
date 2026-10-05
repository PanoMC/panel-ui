import { describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The sdk's PluginAPI.js imports SvelteKit's `$app/paths` (only exists inside Vite) and the sdk's
// PluginManager.js, which drags in the whole panel. Only `createFeatureSet` is under test here.
mock.module('$app/paths', () => ({ base: '' }));
mock.module(
  fileURLToPath(
    new URL('../../node_modules/@panomc/sdk/core/js/PluginManager.js', import.meta.url),
  ),
  () => ({
    registeredPages: {},
  }),
);

const { PANEL_FEATURE_IDS, panelFeatures } = await import('./panelFeatures.js');

describe('pano.features of the panel', () => {
  test('lists exactly the panel ids of the feature table', () => {
    expect(panelFeatures.list()).toEqual(
      [
        'context-components',
        'toast-escaped-values',
        'decoded-route-params',
        'layout-route-params',
        'plugin-notifications',
        'player-detail-menu',
        'panel-auth-util',
        'permission-any-of',
      ].sort(),
    );
    expect(PANEL_FEATURE_IDS.length).toBe(8);
  });

  test('has() answers per id and rejects unknown ones', () => {
    expect(panelFeatures.has('permission-any-of')).toBe(true);
    expect(panelFeatures.has('page-meta')).toBe(false);
  });

  test('is frozen', () => {
    expect(Object.isFrozen(panelFeatures)).toBe(true);
  });

  test('PluginAPI announces it as pano.features', () => {
    const source = readFileSync(new URL('./PluginAPI.js', import.meta.url), 'utf8');

    expect(source).toContain('features: panelFeatures');
  });
});

describe('locales for plugin notifications and toast links', () => {
  for (const locale of ['en-US', 'tr', 'ru']) {
    const lang = JSON.parse(readFileSync(new URL(`../../lang/${locale}.json`, import.meta.url)));

    test(`${locale}: notifications.UNKNOWN exists`, () => {
      expect(typeof lang.notifications.UNKNOWN).toBe('string');
      expect(lang.notifications.UNKNOWN.length).toBeGreaterThan(0);
    });

    test(`${locale}: link markup lives in the locale string, values are plain`, () => {
      const toasts = lang.components.toasts;

      expect(toasts['post-moved-to-draft']).toContain('<a href="{href}">{title}</a>');
      expect(toasts['post-moved-to-trash']).toContain('<a href="{href}">{title}</a>');
      expect(toasts['post-published-link']).toContain('<a href="{href}">{title}</a>');
      expect(toasts['ticket-closed'].multi).toContain('<a href="{href}">{count}</a>');
    });
  }
});
