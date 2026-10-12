import { describe, expect, test } from 'bun:test';

import { customTranslations } from './language.translations.js';

const never = async () => {
  throw new Error('the public answer must not be asked for');
};

describe('texts on top of the panel language file', () => {
  test('a signed-in panel user gets the PANEL answer as it is', async () => {
    const data = { pages: { a: 'edited' }, plugins: { 'pano-plugin-x': { title: 'X' } } };

    expect(await customTranslations({ data }, never)).toEqual(data);
    expect(await customTranslations({}, never)).toEqual({});
  });

  test('refused (the sign-in page): only the plugin texts of the public answer are taken', async () => {
    let calls = 0;
    const publicAnswer = async () => {
      calls++;

      return {
        data: {
          pages: { login: { title: 'a theme text that must not reach the panel' } },
          plugins: { 'pano-plugin-auth-guard': { 'two-factor': { title: 'Two-Factor' } } },
        },
      };
    };

    const result = await customTranslations({ error: { code: 'NO_PERMISSION' } }, publicAnswer);

    expect(result).toEqual({
      plugins: { 'pano-plugin-auth-guard': { 'two-factor': { title: 'Two-Factor' } } },
    });
    expect(calls).toBe(1);
    expect(await customTranslations(null, publicAnswer)).toHaveProperty('plugins');
  });

  test('no plugin texts, a refused or a failing public answer leave nothing on top', async () => {
    const refused = { error: { code: 'NO_PERMISSION' } };

    expect(await customTranslations(refused, async () => ({ data: { pages: {} } }))).toEqual({});
    expect(
      await customTranslations(refused, async () => ({ error: { code: 'NOT_FOUND' } })),
    ).toEqual({});
    expect(
      await customTranslations(refused, async () => {
        throw new Error('offline');
      }),
    ).toEqual({});
  });
});
