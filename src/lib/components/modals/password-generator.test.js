import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import {
  DEFAULT_LENGTH,
  DIGITS,
  LOWERCASE,
  MAX_LENGTH,
  MIN_LENGTH,
  SYMBOLS,
  UPPERCASE,
  clampLength,
  generatePassword,
  randomInt,
} from './password-generator.js';

const has = (password, set) => [...password].some((char) => set.includes(char));

describe('generatePassword', () => {
  const originalRandom = Math.random;

  beforeEach(() => {
    Math.random = () => {
      throw new Error('Math.random must not be used');
    };
  });

  afterEach(() => {
    Math.random = originalRandom;
  });

  test('defaults to 16 characters', () => {
    expect(generatePassword()).toHaveLength(DEFAULT_LENGTH);
  });

  test('honours the length and clamps it to 12-64', () => {
    expect(generatePassword({ length: 30 })).toHaveLength(30);
    expect(generatePassword({ length: 4 })).toHaveLength(MIN_LENGTH);
    expect(generatePassword({ length: 500 })).toHaveLength(MAX_LENGTH);
    expect(clampLength(Number.NaN)).toBe(DEFAULT_LENGTH);
  });

  test('contains every enabled class, always', () => {
    for (let i = 0; i < 300; i++) {
      const password = generatePassword({ length: MIN_LENGTH });

      expect(has(password, LOWERCASE)).toBe(true);
      expect(has(password, UPPERCASE)).toBe(true);
      expect(has(password, DIGITS)).toBe(true);
      expect(has(password, SYMBOLS)).toBe(true);
    }
  });

  test('uses only allowed characters', () => {
    for (let i = 0; i < 200; i++) {
      const lettersOnly = generatePassword({ digits: false, symbols: false, length: 64 });
      expect(lettersOnly).toMatch(/^[a-zA-Z]+$/);

      const noSymbols = generatePassword({ symbols: false, length: 64 });
      expect(noSymbols).toMatch(/^[a-zA-Z0-9]+$/);
      expect(has(noSymbols, DIGITS)).toBe(true);

      const allowed = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;
      expect([...generatePassword({ length: 64 })].every((c) => allowed.includes(c))).toBe(true);
    }
  });

  test('source never mentions Math.random', () => {
    const source = readFileSync(new URL('./password-generator.js', import.meta.url), 'utf8');
    expect(source.includes('Math.random')).toBe(false);
  });
});

describe('randomInt', () => {
  test('rejects values from the incomplete top bucket', () => {
    // 2^32 % 10 = 6, so the last 6 values must be redrawn.
    const values = [2 ** 32 - 1, 2 ** 32 - 6, 42];
    let calls = 0;
    const random = (array) => {
      array[0] = values[calls++];
      return array;
    };

    expect(randomInt(10, random)).toBe(2);
    expect(calls).toBe(3);
  });

  test('stays in range', () => {
    for (let i = 0; i < 1000; i++) {
      const value = randomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});
