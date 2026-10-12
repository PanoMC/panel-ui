import { describe, expect, test } from 'bun:test';

import { pluginIdsOf, pluginStyleUrl, unlayer } from './pluginStyles.util.js';

describe('own stylesheets of plugin sign-in items', () => {
  const ids = ['pano-plugin-market', 'pano-plugin-market-paypal', 'pano-plugin-auth-guard'];

  test('an item belongs to the plugin whose id it starts with, the longest one', () => {
    const items = [
      { id: 'login-form' },
      { id: 'pano-plugin-auth-guard-magic-login' },
      { id: 'pano-plugin-auth-guard-2fa-guard' },
      { id: 'pano-plugin-market-paypal-button' },
      { id: 'pano-plugin-marketing-banner' },
      {},
    ];

    expect(pluginIdsOf(items, ids)).toEqual([
      'pano-plugin-auth-guard',
      'pano-plugin-market-paypal',
    ]);
    expect(pluginIdsOf([], ids)).toEqual([]);
    expect(pluginIdsOf(null, ids)).toEqual([]);
  });

  test('the layer around a plugin sheet is taken off, nested braces stay', () => {
    const sheet =
      '@layer pano-plugin {\n.a.svelte-x { color: red; }\n@keyframes k { to { opacity: 1; } }\n}\n';

    expect(unlayer(sheet).trim()).toBe(
      '.a.svelte-x { color: red; }\n@keyframes k { to { opacity: 1; } }',
    );
    expect(unlayer('.a { color: red; }')).toBe('.a { color: red; }');
    expect(unlayer(null)).toBe('');
  });

  test('the sheet is served below the panel base, with the UI hash as its version', () => {
    expect(pluginStyleUrl('pano-plugin-social-login', 'abc', '/panel')).toBe(
      '/panel/plugins/pano-plugin-social-login/resources/plugin-ui/client/plugin.css?v=abc',
    );
    expect(pluginStyleUrl('x', undefined)).toBe('/plugins/x/resources/plugin-ui/client/plugin.css');
  });
});
