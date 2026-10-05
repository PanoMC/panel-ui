import { describe, expect, mock, test } from 'bun:test';

// auth.util.js reads the signed-in user off the SvelteKit page store when none is passed.
mock.module('$app/stores', () => ({
  page: {
    subscribe(run) {
      run({ data: { user: { permissions: ['pano.panel.manage.market'] } } });
      return () => {};
    },
  },
}));

const { hasPermission } = await import('./auth.util.js');

const user = (permissions, admin = false) => ({ admin, permissions });

describe('hasPermission', () => {
  test('string node: held and not held', () => {
    const u = user(['pano.panel.manage.posts']);

    expect(hasPermission('MANAGE_POSTS', u)).toBe(true);
    expect(hasPermission('pano.panel.manage.posts', u)).toBe(true);
    expect(hasPermission('MANAGE_TICKETS', u)).toBe(false);
  });

  test('array with one match is any-of', () => {
    const u = user(['pano.panel.manage.market']);

    expect(hasPermission(['pano.panel.market.catalogue', 'pano.panel.manage.market'], u)).toBe(
      true,
    );
    expect(hasPermission(['pano.panel.manage.market'], u)).toBe(true);
  });

  test('array without a match is denied', () => {
    const u = user(['pano.panel.manage.posts']);

    expect(hasPermission(['pano.panel.market.catalogue', 'pano.panel.manage.market'], u)).toBe(
      false,
    );
  });

  test('empty array is no requirement', () => {
    expect(hasPermission([], user([]))).toBe(true);
    expect(hasPermission([], user(undefined))).toBe(true);
  });

  test('admin passes string and array checks, even without permissions', () => {
    const admin = user(undefined, true);

    expect(hasPermission('pano.panel.manage.market', admin)).toBe(true);
    expect(hasPermission(['a.b', 'c.d'], admin)).toBe(true);
  });

  test('user without a permission list is denied', () => {
    expect(hasPermission(['pano.panel.manage.market'], user(undefined))).toBe(false);
  });

  test('falls back to the page user when none is passed (string and array)', () => {
    expect(hasPermission('pano.panel.manage.market')).toBe(true);
    expect(hasPermission(['x.y', 'pano.panel.manage.market'])).toBe(true);
    expect(hasPermission(['x.y'])).toBe(false);
  });
});
