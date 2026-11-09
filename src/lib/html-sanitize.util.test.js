import { describe, expect, test } from 'bun:test';

import {
  safeHref,
  sanitizeRichText,
  sanitizeTranslation,
  sanitizeTranslations,
} from './html-sanitize.util.js';

describe('sanitizeRichText', () => {
  test('drops script and event handlers', () => {
    const out = sanitizeRichText(
      '<p>hi</p><img src=x onerror="alert(1)"><script>alert(2)</script>',
    );
    expect(out).toContain('<p>hi</p>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<script');
  });

  test('drops javascript: links', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  test('keeps editor markup', () => {
    const html =
      '<p><strong>a</strong> <em>b</em> <span style="color:#ff0000">c</span></p><img src="https://x.test/a.png" />';
    const out = sanitizeRichText(html);
    expect(out).toContain('<strong>a</strong>');
    expect(out).toContain('color:#ff0000');
    expect(out).toContain('src="https://x.test/a.png"');
  });

  test('plain text and empty values pass', () => {
    expect(sanitizeRichText('a & b')).toBe('a & b');
    expect(sanitizeRichText(null)).toBe('');
  });
});

describe('sanitizeTranslation', () => {
  test('plain texts are untouched', () => {
    expect(sanitizeTranslation('**{username}** made "{title}" & more')).toBe(
      '**{username}** made "{title}" & more',
    );
    expect(sanitizeTranslation(5)).toBe(5);
  });

  test('keeps simple markup and drops handlers', () => {
    const out = sanitizeTranslation(
      '<b>Hi</b> <img src=x onerror=alert(1)> <a href="{href}">x</a>',
    );
    expect(out).toContain('<b>Hi</b>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<img');
    expect(out).toContain('href="{href}"');
  });

  test('walks nested objects', () => {
    const out = sanitizeTranslations({ a: { b: '<svg onload=alert(1)>x' }, c: 'ok' });
    expect(out.a.b).not.toContain('onload');
    expect(out.c).toBe('ok');
  });
});

describe('safeHref', () => {
  test('blocks script schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#');
    expect(safeHref(' java\tscript:alert(1)')).toBe('#');
    expect(safeHref('data:text/html,x')).toBe('#');
    expect(safeHref('vbscript:x')).toBe('#');
  });

  test('allows normal links', () => {
    expect(safeHref('https://panomc.com')).toBe('https://panomc.com');
    expect(safeHref('/panel/logs')).toBe('/panel/logs');
    expect(safeHref('mailto:a@b.c')).toBe('mailto:a@b.c');
  });
});
