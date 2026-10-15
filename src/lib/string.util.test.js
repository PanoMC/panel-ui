import { describe, expect, test } from 'bun:test';
import { formatMinPanoVersion } from './string.util.js';

describe('formatMinPanoVersion', () => {
  test('shows a version as a lower bound', () => {
    expect(formatMinPanoVersion('1.0.0')).toBe('v1.0.0+');
    expect(formatMinPanoVersion('v1.2.0')).toBe('v1.2.0+');
  });

  test('keeps a value that is not a version', () => {
    expect(formatMinPanoVersion('local-build')).toBe('local-build');
    expect(formatMinPanoVersion('')).toBe('-');
    expect(formatMinPanoVersion(undefined)).toBe('-');
  });
});
