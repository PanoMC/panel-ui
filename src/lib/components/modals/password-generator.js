// Random passwords for the create-player modal. Pure apart from the random source, which is
// `crypto.getRandomValues` (a cryptographic source) and can be swapped in tests.

export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGITS = '0123456789';
export const SYMBOLS = '!@#$%^&*-_=+?';

export const MIN_LENGTH = 12;
export const MAX_LENGTH = 64;
export const DEFAULT_LENGTH = 16;

const UINT32_RANGE = 2 ** 32;

/**
 * @param {Uint32Array} array
 * @returns {Uint32Array}
 */
function defaultRandom(array) {
  return globalThis.crypto.getRandomValues(array);
}

/**
 * A uniform integer in `[0, max)`. Values from the top, incomplete bucket of the 32-bit range are
 * thrown away and drawn again, so no result is more likely than another (no modulo bias).
 *
 * @param {number} max
 * @param {(array: Uint32Array) => Uint32Array} random
 * @returns {number}
 */
export function randomInt(max, random = defaultRandom) {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
    throw new RangeError('max must be an integer between 1 and 2^32');
  }

  const limit = UINT32_RANGE - (UINT32_RANGE % max);
  const buffer = new Uint32Array(1);

  for (;;) {
    random(buffer);

    if (buffer[0] < limit) {
      return buffer[0] % max;
    }
  }
}

/**
 * @param {number} length
 * @returns {number}
 */
export function clampLength(length) {
  const value = Math.round(Number(length));

  if (!Number.isFinite(value)) {
    return DEFAULT_LENGTH;
  }

  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, value));
}

/**
 * The character classes a password with these options is built from. Letters are always on.
 *
 * @param {{ digits?: boolean, symbols?: boolean }} [options]
 * @returns {string[]}
 */
export function characterClasses({ digits = true, symbols = true } = {}) {
  const classes = [LOWERCASE, UPPERCASE];

  if (digits) {
    classes.push(DIGITS);
  }

  if (symbols) {
    classes.push(SYMBOLS);
  }

  return classes;
}

/**
 * A random password with at least one character of every enabled class.
 *
 * @param {{
 *   length?: number,
 *   digits?: boolean,
 *   symbols?: boolean,
 *   random?: (array: Uint32Array) => Uint32Array,
 * }} [options]
 * @returns {string}
 */
export function generatePassword({
  length = DEFAULT_LENGTH,
  digits = true,
  symbols = true,
  random = defaultRandom,
} = {}) {
  const size = clampLength(length);
  const classes = characterClasses({ digits, symbols });
  const all = classes.join('');

  /** @param {string} set */
  const pick = (set) => set[randomInt(set.length, random)];

  const chars = classes.map(pick);

  while (chars.length < size) {
    chars.push(pick(all));
  }

  // Fisher-Yates, so the guaranteed characters are not always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, random);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
