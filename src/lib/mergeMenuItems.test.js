import { describe, expect, test } from 'bun:test';

import { mergeMenuItems } from './mergeMenuItems.js';

describe('mergeMenuItems', () => {
  test('duplicate ids: last wins, first position is kept', () => {
    const result = mergeMenuItems([
      { id: 'a', text: 'a1' },
      { id: 'b', text: 'b1' },
      { id: 'a', text: 'a2' },
    ]);

    expect(result).toEqual([
      { id: 'a', text: 'a2' },
      { id: 'b', text: 'b1' },
    ]);
  });

  test('permission filter drops items the viewer cannot see', () => {
    const items = [
      { id: 'open', text: 'o' },
      { id: 'secret', text: 's', permission: 'MANAGE_X' },
      { id: 'ok', text: 'k', permission: 'MANAGE_Y' },
    ];

    const result = mergeMenuItems(items, (p) => p === 'MANAGE_Y');

    expect(result.map((i) => i.id)).toEqual(['open', 'ok']);
  });

  test('a replacing duplicate is filtered by its own permission', () => {
    const result = mergeMenuItems([{ id: 'a' }, { id: 'a', permission: 'NOPE' }], () => false);

    expect(result).toEqual([]);
  });

  test('no filter keeps permissioned items; empty and nullish input is safe', () => {
    expect(mergeMenuItems([{ id: 'a', permission: 'P' }])).toHaveLength(1);
    expect(mergeMenuItems([])).toEqual([]);
    expect(mergeMenuItems(undefined)).toEqual([]);
  });
});
