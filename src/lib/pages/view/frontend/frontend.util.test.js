import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { IntlMessageFormat } from 'intl-messageformat';

import {
  buildModeBody,
  describeError,
  envText,
  frontendModeOptions,
  FrontendModes,
  isModeComplete,
  isModeDirty,
  maskKey,
  normalizeFrontendState,
  themeNotShown,
} from './frontend.util.js';
import { readLang } from './testkit.js';

describe('normalizeFrontendState', () => {
  test('an empty or foreign answer becomes the THEME defaults', () => {
    const state = normalizeFrontendState({});

    expect(state.mode).toBe('THEME');
    expect(state.customApps).toEqual([]);
    expect(state.devUrl).toBe('');
    expect(state.running).toBe(false);
  });

  test('an unknown mode falls back to THEME, a known one is kept', () => {
    expect(normalizeFrontendState({ mode: 'WHATEVER' }).mode).toBe('THEME');
    expect(normalizeFrontendState({ mode: 'EXTERNAL' }).mode).toBe('EXTERNAL');
  });

  test('custom apps keep their fields and default the missing ones', () => {
    const { customApps } = normalizeFrontendState({
      customApps: [{ id: 'shop', version: '1.0.0', author: 'me', active: true }],
    });

    expect(customApps).toEqual([
      {
        id: 'shop',
        title: 'shop',
        version: '1.0.0',
        author: 'me',
        description: null,
        apiLevel: null,
        installedAt: null,
        active: true,
      },
    ]);
  });
});

describe('buildModeBody', () => {
  const draft = {
    mode: 'EXTERNAL',
    customAppId: 'shop',
    upstreamUrl: ' http://127.0.0.1:4000 ',
    siteUrl: 'https://example.com ',
    descriptorUrl: '',
  };

  test('EXTERNAL sends the upstream, the site and the descriptor, trimmed', () => {
    expect(buildModeBody(draft)).toEqual({
      mode: 'EXTERNAL',
      upstreamUrl: 'http://127.0.0.1:4000',
      siteUrl: 'https://example.com',
      descriptorUrl: '',
    });
  });

  test('CUSTOM_APP sends the app and the site only', () => {
    expect(buildModeBody({ ...draft, mode: 'CUSTOM_APP' })).toEqual({
      mode: 'CUSTOM_APP',
      customAppId: 'shop',
      siteUrl: 'https://example.com',
    });
  });

  test('NONE sends the site and the descriptor, THEME sends the mode alone', () => {
    expect(buildModeBody({ ...draft, mode: 'NONE' })).toEqual({
      mode: 'NONE',
      siteUrl: 'https://example.com',
      descriptorUrl: '',
    });
    expect(buildModeBody({ ...draft, mode: 'THEME' })).toEqual({ mode: 'THEME' });
  });

  test('force is added only when asked for', () => {
    expect(buildModeBody(draft).force).toBeUndefined();
    expect(buildModeBody(draft, { force: true }).force).toBe(true);
  });

  test('a change in a field the mode does not use is not a change', () => {
    const saved = normalizeFrontendState({ mode: 'THEME', upstreamUrl: 'http://a:1' });

    expect(isModeDirty(saved, { ...saved, upstreamUrl: 'http://b:2' })).toBe(false);
    expect(isModeDirty(saved, { ...saved, mode: 'NONE' })).toBe(true);
  });

  test('CUSTOM_APP needs an app and EXTERNAL needs an address', () => {
    expect(isModeComplete({ mode: 'CUSTOM_APP', customAppId: '', upstreamUrl: '' })).toBe(false);
    expect(isModeComplete({ mode: 'CUSTOM_APP', customAppId: 'a', upstreamUrl: '' })).toBe(true);
    expect(isModeComplete({ mode: 'EXTERNAL', customAppId: '', upstreamUrl: ' ' })).toBe(false);
    expect(isModeComplete({ mode: 'NONE', customAppId: '', upstreamUrl: '' })).toBe(true);
  });
});

describe('describeError', () => {
  test('a known code maps to its lang key and carries the details as values', () => {
    expect(
      describeError({
        code: 'CUSTOM_APP_INVALID_MANIFEST',
        details: { field: 'version', message: 'x' },
      }),
    ).toEqual({
      key: 'pages.frontend.errors.CUSTOM_APP_INVALID_MANIFEST',
      values: { field: 'version', message: 'x' },
    });
  });

  test('an unknown code gets the generic message', () => {
    expect(describeError({ code: 'SOMETHING_NEW' }).key).toBe('pages.frontend.errors.UNKNOWN');
    expect(describeError(null).key).toBe('pages.frontend.errors.UNKNOWN');
  });
});

describe('FRONTEND_ACCESS_DISABLED', () => {
  test('the code has its own translated message', () => {
    expect(describeError({ code: 'FRONTEND_ACCESS_DISABLED' }).key).toBe(
      'pages.frontend.errors.FRONTEND_ACCESS_DISABLED',
    );
  });
});

describe('themeNotShown', () => {
  const translate = (key, options) =>
    options?.values ? `${key}|${JSON.stringify(options.values)}` : key;

  test('the active theme gets the hint with the name of the mode', () => {
    expect(themeNotShown({ active: true }, 'EXTERNAL', translate)).toEqual({
      text: 'pages.frontend.not-shown|{"mode":"pages.frontend.mode.external.title"}',
      level: 'warning',
    });
    expect(themeNotShown({ active: true }, 'CUSTOM_APP', translate)?.text).toContain(
      'pages.frontend.mode.custom-app.title',
    );
    expect(themeNotShown({ active: true }, 'NONE', translate)?.text).toContain(
      'pages.frontend.mode.none.title',
    );
  });

  test('nothing for Theme mode, an unknown mode, or a theme that is not active', () => {
    expect(themeNotShown({ active: true }, 'THEME', translate)).toBeNull();
    expect(themeNotShown({ active: true }, null, translate)).toBeNull();
    expect(themeNotShown({ active: true }, 'OTHER', translate)).toBeNull();
    expect(themeNotShown({ active: false }, 'EXTERNAL', translate)).toBeNull();
    expect(themeNotShown(null, 'EXTERNAL', translate)).toBeNull();
  });

  test('the sentence reads well in every language', () => {
    for (const locale of ['en-US', 'tr', 'ru']) {
      const lang = readLang(locale);

      expect(lang.pages.frontend['not-shown']).toContain('{mode}');
    }
  });
});

describe('small helpers', () => {
  test('the env lines are copied one per line', () => {
    expect(envText(['A=1', 'B=2'])).toBe('A=1\nB=2');
    expect(envText(undefined)).toBe('');
  });

  test('a listed key shows only its hint', () => {
    expect(maskKey('ab12')).toEndWith('ab12');
    expect(maskKey('ab12')).toStartWith('pfk_');
  });
});

describe('lang files', () => {
  const folder = import.meta.dir;
  const sources = readdirSync(folder)
    .filter(
      (name) => /\.(svelte|js)$/.test(name) && !name.endsWith('.test.js') && name !== 'testkit.js',
    )
    .map((name) => readFileSync(join(folder, name), 'utf8'))
    .join('\n');

  // Every literal key the page and the controllers use, plus the keys built from a code.
  const used = new Set(
    [
      ...sources.matchAll(
        /['"`]((?:pages\.frontend|pages\.settings\.platform\.theme-dev-server)[\w.-]*)['"`]/g,
      ),
    ].map((m) => m[1]),
  );

  for (const option of frontendModeOptions) {
    used.add(option.titleKey);
    used.add(option.descriptionKey);
  }

  // Used by the Themes page and the dialog, outside this folder.
  used.add('pages.frontend.settings-button');
  used.add('pages.frontend.manage');
  used.add('pages.frontend.keys.title');
  used.add('pages.frontend.keys.block-title');
  used.add('pages.frontend.urls.title');
  used.add('pages.frontend.mode.label');
  used.add('pages.frontend.not-shown');

  for (const code of [
    'CUSTOM_APP_INVALID_MANIFEST',
    'CUSTOM_APP_NO_ENTRY',
    'CUSTOM_APP_ID_TAKEN',
    'CUSTOM_APP_API_LEVEL',
    'CUSTOM_APP_ACTIVE',
    'UPSTREAM_INVALID_URL',
    'UPSTREAM_IS_PANO',
    'UPSTREAM_UNREACHABLE',
    'DESCRIPTOR_HOST_NOT_ALLOWED',
    'FRONTEND_START_FAILED',
    'FILE_TOO_LARGE',
    'NOT_A_ZIP',
    'FRONTEND_KEY_LIMIT_REACHED',
    'FRONTEND_ACCESS_DISABLED',
    'INVALID_FIELDS',
    'DISABLED_FOR_DEMO',
    'NETWORK_ERROR',
    'UNKNOWN',
  ]) {
    used.add(`pages.frontend.errors.${code}`);
  }

  const read = (lang, key) => key.split('.').reduce((node, part) => node?.[part], lang);

  for (const locale of ['en-US', 'tr', 'ru']) {
    test(`${locale}: every key the page uses has a message that parses`, () => {
      const lang = readLang(locale);
      const missing = [];
      const broken = [];

      for (const key of used) {
        const message = read(lang, key);

        if (typeof message !== 'string' || message === '') {
          missing.push(key);
          continue;
        }

        // Every `{name}` placeholder gets a value, so only a real syntax error throws.
        const values = Object.fromEntries(
          [...message.matchAll(/\{(\w+)[,}]/g)].map((m) => [m[1], 1]),
        );

        try {
          new IntlMessageFormat(message, locale).format(values);
        } catch {
          broken.push(key);
        }
      }

      expect(missing).toEqual([]);
      expect(broken).toEqual([]);
    });
  }

  test('menu and activity log messages exist in every locale', () => {
    for (const locale of ['en-US', 'tr', 'ru']) {
      const lang = readLang(locale);

      expect(lang.pages.frontend['settings-button']).toBeString();

      for (const type of [
        'CREATED_FRONTEND_KEY',
        'DELETED_FRONTEND_KEY',
        'CHANGED_FRONTEND_MODE',
        'UPLOADED_CUSTOM_APP',
        'DELETED_CUSTOM_APP',
      ]) {
        expect(lang['activity-logs'][type]).toBeString();
      }
    }
  });
});
