import { describe, expect, test } from 'bun:test';

import { subList, withPlayerPages } from './playerDetailPages.js';

describe('player detail sub-lists', () => {
  test('a plain array and its count become items and a page object', () => {
    const out = subList([{ id: 1 }], 23, 2);

    expect(out.items).toEqual([{ id: 1 }]);
    expect(out.page).toEqual({ number: 2, size: 10, totalItems: 23 });
  });

  test('an answer that already has items and page is kept', () => {
    const list = { items: [1], page: { number: 1, size: 10, totalItems: 1 } };

    expect(subList(list, 99, 5)).toBe(list);
  });

  test('a missing list stays missing', () => {
    expect(subList(undefined, undefined, 1)).toBeUndefined();
  });

  test('both lists get their page and the asked page numbers', () => {
    const body = withPlayerPages(
      { banHistory: [], banHistoryCount: 0, tickets: [{ id: 3 }], ticketCount: 11 },
      2,
      1,
    );

    expect(body.tickets.page).toEqual({ number: 2, size: 10, totalItems: 11 });
    expect(body.banHistory.page.totalItems).toBe(0);
    expect(body.ticketsPage).toBe(2);
  });

  test('no tickets key (SERVERS mode) leaves tickets out', () => {
    const body = withPlayerPages({ banHistory: [], banHistoryCount: 0 }, 1, 1);

    expect('tickets' in body).toBe(false);
  });
});
