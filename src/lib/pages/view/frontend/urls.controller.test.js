import { describe, expect, test } from 'bun:test';
import { get, writable } from 'svelte/store';

import { createFrontendApi } from './frontend.api.js';
import { recordingNotify, stubClient } from './testkit.js';
import { createUrlsController, normalizeUrlsState, sourceKey } from './urls.controller.js';

/** The answer of `GET /panel/frontend/urls`, with one target per kind of row. */
function urlsState({ overrides = { 'auth.login': '/sign-in' }, targets } = {}) {
  return {
    siteUrl: 'https://example.com',
    overrides,
    targets: targets ?? [
      {
        id: 'auth.login',
        owner: 'core',
        source: 'OVERRIDE',
        path: '/sign-in',
        defaultPath: '/login',
        fallback: true,
        createsSession: false,
      },
      {
        id: 'market.order',
        owner: 'pano-plugin-market',
        source: 'FALLBACK',
        path: '/_pano/market.order',
        defaultPath: '/store/order/{id}',
        fallback: true,
        createsSession: true,
      },
      {
        id: 'market.store',
        owner: 'pano-plugin-market',
        source: 'THEME',
        path: '/store',
        defaultPath: '/store',
        fallback: false,
        createsSession: false,
      },
      {
        id: 'user.profile',
        owner: 'core',
        source: null,
        path: null,
        defaultPath: '/profile',
        fallback: false,
        createsSession: false,
      },
    ],
  };
}

const STATE = urlsState();

function setup(answers = {}, { hasKey = false, initial = STATE } = {}) {
  const client = stubClient(answers);
  const notify = recordingNotify();
  const keys = writable(hasKey);
  const controller = createUrlsController({
    api: createFrontendApi(client),
    notify,
    initial,
    hasKey: keys,
  });

  return { client, notify, keys, controller };
}

describe('normalizeUrlsState', () => {
  test('fills every field, drops empty overrides and unknown sources', () => {
    const state = normalizeUrlsState({
      overrides: { a: '/x', b: '' },
      targets: [{ id: 'a', source: 'WHATEVER', path: null }],
    });

    expect(state.siteUrl).toBe('');
    expect(state.overrides).toEqual({ a: '/x' });
    expect(state.targets[0]).toMatchObject({
      id: 'a',
      owner: 'core',
      source: null,
      path: null,
      fallback: false,
      createsSession: false,
    });
    expect(normalizeUrlsState(undefined).targets).toEqual([]);
  });

  test('sourceKey names the step, or "no page"', () => {
    expect(sourceKey('FALLBACK')).toBe('pages.frontend.urls.source.FALLBACK');
    expect(sourceKey(null)).toBe('pages.frontend.urls.source.NONE');
  });
});

describe('Link targets controller', () => {
  test('rows carry source, path and the override of each target', () => {
    const { controller } = setup();
    const rows = get(controller.rows);

    expect(rows.map((row) => row.id)).toEqual([
      'auth.login',
      'market.order',
      'market.store',
      'user.profile',
    ]);
    expect(rows[0]).toMatchObject({ source: 'OVERRIDE', path: '/sign-in', override: '/sign-in' });
    expect(rows[1]).toMatchObject({
      source: 'FALLBACK',
      path: '/_pano/market.order',
      override: null,
    });
    expect(rows[3]).toMatchObject({ source: null, path: null });
  });

  test('a session-creating target is "needed for server-side front-ends" only while a key is stored', () => {
    const { controller, keys } = setup({}, { hasKey: false });

    expect(get(controller.rows).some((row) => row.neededForServerSide)).toBe(false);

    keys.set(true);

    expect(
      get(controller.rows)
        .filter((row) => row.neededForServerSide)
        .map((row) => row.id),
    ).toEqual(['market.order']);
  });

  test('setting an override sends the whole map and shows the answer', async () => {
    const { controller, client, notify } = setup({
      'PUT /panel/frontend/urls': (options) => urlsState({ overrides: options.body.overrides }),
    });

    expect(await controller.setOverride('market.store', ' /shop ')).toBe(true);

    expect(client.calls[0].body).toEqual({
      overrides: { 'auth.login': '/sign-in', 'market.store': '/shop' },
    });
    expect(get(controller.state).overrides['market.store']).toBe('/shop');
    expect(notify.toasts.at(-1)).toMatchObject({
      type: 'success',
      key: 'pages.frontend.urls.saved',
    });
  });

  test('an empty value removes the override of that row only', async () => {
    const { controller, client, notify } = setup({
      'PUT /panel/frontend/urls': (options) => urlsState({ overrides: options.body.overrides }),
    });

    expect(await controller.removeOverride('auth.login')).toBe(true);
    expect(client.calls[0].body).toEqual({ overrides: {} });
    expect(get(controller.rows)[0].override).toBeNull();
    expect(notify.toasts.at(-1)?.key).toBe('pages.frontend.urls.override-removed');
  });

  test('a refused address is explained and the state stays as it was', async () => {
    const { controller } = setup({
      'PUT /panel/frontend/urls': {
        error: { code: 'INVALID_FIELDS', fields: { 'overrides.market.store': 'INVALID_LOCATION' } },
      },
    });

    expect(await controller.setOverride('market.store', 'javascript:alert(1)')).toBe(false);
    expect(get(controller.error)?.key).toBe('pages.frontend.errors.INVALID_LOCATION');
    expect(get(controller.state).overrides).toEqual({ 'auth.login': '/sign-in' });
  });

  test('a failed remove is a toast, there is no dialog to show it in', async () => {
    const { controller, notify } = setup({
      'PUT /panel/frontend/urls': { error: { code: 'NETWORK_ERROR' } },
    });

    expect(await controller.removeOverride('auth.login')).toBe(false);
    expect(notify.toasts.at(-1)).toMatchObject({
      type: 'error',
      key: 'pages.frontend.errors.NETWORK_ERROR',
    });
  });

  test('refresh reads the targets again', async () => {
    const { controller } = setup({
      'GET /panel/frontend/urls': urlsState({ overrides: {}, targets: [] }),
    });

    expect(await controller.refresh()).toBe(true);
    expect(get(controller.rows)).toEqual([]);
  });
});
