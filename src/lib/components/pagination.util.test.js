import { describe, expect, test } from 'bun:test';

import {
  hasMoreItems,
  hasNextPage,
  pageOf,
  pageCount,
  pageNumber,
  pageSlice,
} from './pagination.util.js';

describe('pagination.util', () => {
  test('reads the number and count of a server page object', () => {
    const page = { number: 2, size: 20, totalItems: 57 };

    expect(pageNumber(page)).toBe(2);
    expect(pageCount(page)).toBe(3);
    expect(hasNextPage(page)).toBe(true);
    expect(hasNextPage({ ...page, number: 3 })).toBe(false);
  });

  test('an empty list shows page 1 of 1', () => {
    const page = { number: 1, size: 10, totalItems: 0 };

    expect(pageCount(page)).toBe(1);
    expect(hasNextPage(page)).toBe(false);
    expect(pageCount(undefined)).toBe(1);
    expect(pageNumber(undefined)).toBe(1);
  });

  test('a cursor list has more while nextCursor is set', () => {
    expect(hasMoreItems({ size: 50, nextCursor: 'abc' }, 50)).toBe(true);
    expect(hasMoreItems({ size: 50, nextCursor: null }, 50)).toBe(false);
  });

  test('a numbered list has more while fewer items are loaded than it holds', () => {
    expect(hasMoreItems({ number: 1, size: 10, totalItems: 25 }, 10)).toBe(true);
    expect(hasMoreItems({ number: 3, size: 10, totalItems: 25 }, 25)).toBe(false);
    expect(hasMoreItems(undefined, 0)).toBe(false);
  });

  test('a client-paged list builds the same object and slices by it', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    const page = pageOf(3, items.length, 10);

    expect(pageCount(page)).toBe(3);
    expect(pageSlice(items, 3, 10)).toEqual([20, 21, 22]);
    expect(pageSlice(items, 1, 10)).toHaveLength(10);
  });
});
