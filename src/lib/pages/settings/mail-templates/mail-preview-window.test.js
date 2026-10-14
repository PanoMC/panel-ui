import { describe, expect, test } from 'bun:test';

import {
  LAYOUT_PREVIEW,
  PREVIEW_WIDTHS,
  isDataObject,
  isLayoutPreview,
  previewKey,
  previewWindowHref,
  publishPreview,
  readPreview,
  sampleVariables,
  windowBody,
} from './mail-preview-window.js';

const memory = () => {
  const map = new Map();

  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
};

describe('mail preview window', () => {
  test('keys and URLs carry owner, key and variant', () => {
    expect(previewKey('core', 'activation', 'default')).toBe(
      'pano-panel-mail-preview:core:activation:default',
    );
    expect(previewKey('core', '_layout', null)).toBe('pano-panel-mail-preview:core:_layout:');
    expect(previewWindowHref('/panel', 'core', 'activation', 'default')).toBe(
      '/panel/mail-templates/preview?owner=core&key=activation&variant=default',
    );
    expect(previewWindowHref('/panel', 'my plugin', 'a&b', '')).toBe(
      '/panel/mail-templates/preview?owner=my+plugin&key=a%26b',
    );
  });

  test('the layout has its own fixed target', () => {
    expect(isLayoutPreview(LAYOUT_PREVIEW)).toBe(true);
    expect(isLayoutPreview({ owner: 'core', key: '_layout', variant: 'x' })).toBe(true);
    expect(isLayoutPreview({ owner: 'core', key: 'activation' })).toBe(false);
    expect(isLayoutPreview(null)).toBe(false);
  });

  test('a published draft is read back per mail and variant', () => {
    const storage = memory();

    publishPreview(storage, 'core', 'activation', 'default', {
      title: 'A',
      body: { locale: 'tr' },
    });

    const draft = readPreview(storage, 'core', 'activation', 'default');

    expect(draft.title).toBe('A');
    expect(draft.body.locale).toBe('tr');
    expect(typeof draft.at).toBe('number');
    expect(readPreview(storage, 'core', 'activation', 'other')).toBeNull();
  });

  test('broken or blocked storage is no draft and never throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };

    expect(() => publishPreview(blocked, 'core', 'a', null, {})).not.toThrow();
    expect(readPreview(blocked, 'core', 'a', null)).toBeNull();

    const storage = memory();

    storage.setItem(previewKey('core', 'a', null), '{not json');
    expect(readPreview(storage, 'core', 'a', null)).toBeNull();
  });

  test('sample variables follow the backend defaults', () => {
    expect(
      sampleVariables([
        { name: 'username', type: 'text', sample: 'Steve' },
        { name: 'missing', type: 'text' },
        { name: 'flag', type: 'boolean' },
        { name: 'off', type: 'boolean', sample: 'false' },
        { name: 'on', type: 'boolean', sample: true },
      ]),
    ).toEqual({ username: 'Steve', missing: '', flag: true, off: false, on: true });
    expect(sampleVariables(undefined)).toEqual({});
  });

  test("the window's data replaces the editor's only when it is a JSON object", () => {
    const body = { owner: 'core', variables: { username: 'Steve' } };

    expect(windowBody(null, '{}')).toBeNull();
    expect(windowBody(body, null)).toBe(body);
    expect(windowBody(body, '{"username": "Alex"}')).toEqual({
      owner: 'core',
      variables: { username: 'Alex' },
    });
    expect(windowBody(body, '{broken')).toBe(body);
    expect(windowBody(body, '[1]')).toBe(body);
    expect(isDataObject('null')).toBe(false);
    expect(isDataObject('{"a":1}')).toBe(true);
  });

  test('widths end with the full window', () => {
    expect(PREVIEW_WIDTHS.map((item) => item.width)).toEqual([375, 768, 1024, null]);
  });
});
