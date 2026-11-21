import { describe, expect, test, mock } from 'bun:test';

mock.module('$lib/api.util.js', () => ({ default: {} }));

const { daysLeft, isPanoPlusOn, panoPlusUntil, showsPanoPlusGrace, showsPanoPlusHints } =
  await import('./pano-plus.js');

const on = {
  enabled: true,
  plusUrl: 'https://panomc.com/plus',
  hintsDismissed: false,
  me: { active: false, status: 'NONE', renewsAt: null, graceUntil: null },
};

describe('pano-plus', () => {
  test('nothing shows when off, unknown or without an address', () => {
    expect(isPanoPlusOn(null)).toBe(false);
    expect(isPanoPlusOn({ enabled: false, plusUrl: 'https://panomc.com/plus' })).toBe(false);
    expect(isPanoPlusOn({ ...on, plusUrl: null })).toBe(false);
    expect(showsPanoPlusHints(null)).toBe(false);
    expect(showsPanoPlusGrace({ ...on, enabled: false, me: { status: 'GRACE' } })).toBe(false);
  });

  test('hints show until dismissed and never to members', () => {
    expect(showsPanoPlusHints(on)).toBe(true);
    expect(showsPanoPlusHints({ ...on, hintsDismissed: true })).toBe(false);
    expect(showsPanoPlusHints({ ...on, me: { active: true, status: 'ACTIVE' } })).toBe(false);
  });

  test('grace bar only in the grace, dismissed hints do not hide it', () => {
    const grace = {
      ...on,
      hintsDismissed: true,
      me: { active: true, status: 'GRACE', graceUntil: 10 },
    };
    expect(showsPanoPlusGrace(grace)).toBe(true);
    expect(showsPanoPlusGrace({ ...on, me: { active: true, status: 'ACTIVE' } })).toBe(false);
  });

  test('until and days left', () => {
    expect(
      panoPlusUntil({ me: { active: true, status: 'ACTIVE', renewsAt: 5, graceUntil: 9 } }),
    ).toBe(5);
    expect(
      panoPlusUntil({ me: { active: true, status: 'GRACE', renewsAt: 5, graceUntil: 9 } }),
    ).toBe(9);
    expect(panoPlusUntil({ me: { active: false, status: 'NONE' } })).toBe(null);

    const day = 24 * 60 * 60 * 1000;
    expect(daysLeft(2.5 * day, 0)).toBe(3);
    expect(daysLeft(-1, 0)).toBe(0);
    expect(daysLeft(null, 0)).toBe(null);
  });
});
