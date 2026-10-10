import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntlMessageFormat } from 'intl-messageformat';

import { renderHtml, stubClient, textOf, useLocale } from '../frontend/testkit.js';
import { createThemeApi } from './theme.api.js';
import {
  baselineOf,
  createCompatWatcher,
  describeIssue,
  fallbackIssues,
  memoryStorage,
  newFallbackIssues,
  normalizeReport,
  rememberReport,
} from './compat.util.js';
import {
  createHomeController,
  isConcretePath,
  normalizeHome,
  optionLabel,
} from './home.controller.js';

const { default: ThemeCompatIssues } = await import('./ThemeCompatIssues.svelte');
const { default: HomePageSelect } = await import('./HomePageSelect.svelte');
const { default: SourceTag } = await import('../../translations/SourceTag.svelte');

beforeAll(() => useLocale('en-US'));

/** The payload of doc 01 section 7. */
const REPORT = {
  theme: { id: 'blaze-theme', version: 'v1.4.0' },
  status: 'OUTDATED',
  counts: { overrides: 34, active: 31, fallback: 2, pluginNotInstalled: 1 },
  issues: [
    {
      type: 'CONTRACT_MISMATCH',
      view: 'market:ProductCard',
      pluginId: 'pano-plugin-market',
      pluginVersion: '1.1.0',
      themeContract: 1,
      currentContract: 2,
    },
    {
      type: 'VIEW_REMOVED',
      view: 'market:OldBadge',
      pluginId: 'pano-plugin-market',
      pluginVersion: '1.1.0',
    },
    {
      type: 'NAMESPACE_CLASH',
      namespace: 'market',
      pluginId: 'market',
      heldBy: 'pano-plugin-market',
    },
  ],
};

const OK_REPORT = {
  theme: { id: 'blaze-theme', version: 'v1.4.0' },
  status: 'OK',
  counts: { overrides: 3, active: 3, fallback: 0, pluginNotInstalled: 0 },
  issues: [],
};

/** The payload of doc 01 section 9. */
const HOME = {
  value: null,
  default: 'landing',
  options: [
    { id: 'posts', label: 'Posts', kind: 'posts', available: true },
    {
      id: 'landing',
      label: { 'en-US': 'Landing', tr: 'Açılış' },
      kind: 'page',
      available: true,
    },
    { id: 'store', label: 'Store', kind: 'path', path: '/store', available: false },
    { id: 'custom', label: 'Custom page', kind: 'custom', path: '*', available: true },
  ],
};

const recorder = () => {
  const toasts = [];

  return {
    toasts,
    warn: (key, values) => toasts.push({ key, values }),
    success: (key) => toasts.push({ type: 'success', key }),
    error: (key) => toasts.push({ type: 'error', key }),
  };
};

describe('issue sentences', () => {
  test('a contract mismatch reads as the doc example', () => {
    const html = renderHtml(ThemeCompatIssues, { report: normalizeReport(REPORT) });

    expect(textOf(html)).toContain(
      "ProductCard of Market shows the plugin's default look: the theme was made for version 1, the plugin is on 2",
    );
  });

  test('every issue of the payload gets one line, in order', () => {
    const html = renderHtml(ThemeCompatIssues, { report: normalizeReport(REPORT) });

    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain('data-issue="CONTRACT_MISMATCH"');
    expect(html).toContain('data-issue="VIEW_REMOVED"');
    expect(html).toContain('data-issue="NAMESPACE_CLASH"');
    expect(textOf(html)).toContain(
      'OldBadge of Market no longer exists in the plugin (version 1.1.0)',
    );
    expect(textOf(html)).toContain(
      'The plugin market asks for the short name market, which pano-plugin-market already holds',
    );
  });

  test('controller and engine mismatches have their own sentence', () => {
    const report = normalizeReport({
      ...OK_REPORT,
      status: 'OUTDATED',
      issues: [
        {
          type: 'CONTROLLER_MISMATCH',
          view: 'market:ProductCard',
          controller: 'market/cart',
          themeVersion: 1,
          currentVersion: 3,
        },
        { type: 'ENGINE_MISMATCH', view: 'Navbar', themeContract: 1, engineContract: 2 },
      ],
    });
    const text = textOf(renderHtml(ThemeCompatIssues, { report }));

    expect(text).toContain(
      "ProductCard of Market shows the plugin's default look: the theme uses the market/cart controller at version 1, the plugin is on 3",
    );
    expect(text).toContain(
      "Navbar of the theme engine shows the engine's default look: the theme was made for version 1, the engine is on 2",
    );
  });

  test('an unknown type from a newer backend is still listed', () => {
    const line = describeIssue({ type: 'SOMETHING_NEW', view: 'market:X' });

    expect(line.key).toBe('pages.theme-compat.issues.UNKNOWN');
    expect(line.values).toEqual({ type: 'SOMETHING_NEW', view: 'X' });
  });

  test('no issue, no list', () => {
    expect(renderHtml(ThemeCompatIssues, { report: normalizeReport(OK_REPORT) })).not.toContain(
      'data-compat-issues',
    );
    expect(renderHtml(ThemeCompatIssues, { report: null })).not.toContain('data-compat-issues');
  });

  test('a garbage answer is no report', () => {
    expect(normalizeReport(null)).toBeNull();
    expect(normalizeReport({ error: { code: 'NO_PERMISSION' } })).toBeNull();
    expect(normalizeReport({ status: 'WEIRD' }).status).toBe('UNKNOWN');
  });
});

describe('toast after a plugin update', () => {
  const grown = (extra = []) =>
    normalizeReport({
      ...REPORT,
      counts: { ...REPORT.counts, fallback: 2 + extra.length },
      issues: [...REPORT.issues, ...extra],
    });

  const before = normalizeReport({
    ...REPORT,
    counts: { ...REPORT.counts, fallback: 1 },
    issues: [REPORT.issues[0], REPORT.issues[2]],
  });

  test('only a bigger fallback count has something new', () => {
    const baseline = baselineOf(before);

    expect(newFallbackIssues(baseline, grown()).map((i) => i.view)).toEqual(['market:OldBadge']);
    expect(newFallbackIssues(baseline, before)).toEqual([]);
    expect(newFallbackIssues(baselineOf(grown()), before)).toEqual([]);
  });

  test('a first look, another theme or UNKNOWN is never new', () => {
    expect(newFallbackIssues(null, grown())).toEqual([]);
    expect(newFallbackIssues({ ...baselineOf(before), theme: 'other' }, grown())).toEqual([]);
    expect(
      newFallbackIssues(baselineOf(before), normalizeReport({ ...REPORT, status: 'UNKNOWN' })),
    ).toEqual([]);
  });

  test('check toasts the same line the list shows, once', async () => {
    const storage = memoryStorage();
    const notify = recorder();
    const answers = [before, grown()];
    const api = {
      getCompatibility: async () => ({ ok: true, body: answers.shift() }),
    };
    const watcher = createCompatWatcher({ api, notify, storage });

    await watcher.check();
    expect(notify.toasts).toEqual([]);

    await watcher.check();
    expect(notify.toasts).toHaveLength(1);
    expect(notify.toasts[0].key).toBe('pages.theme-compat.issues.VIEW_REMOVED');
    expect(notify.toasts[0].values.view).toBe('OldBadge');

    answers.push(grown());
    await watcher.check();
    expect(notify.toasts).toHaveLength(1);
  });

  test('more than three new lines are summed up in one toast', async () => {
    const storage = memoryStorage();
    const notify = recorder();
    const extra = [1, 2, 3, 4, 5].map((n) => ({
      type: 'CONTRACT_MISMATCH',
      view: `market:V${n}`,
      themeContract: 1,
      currentContract: 2,
    }));

    rememberReport(before, storage);

    await createCompatWatcher({
      api: { getCompatibility: async () => ({ ok: true, body: grown(extra) }) },
      notify,
      storage,
    }).check();

    expect(notify.toasts).toHaveLength(4);
    expect(notify.toasts[3]).toEqual({
      key: 'pages.theme-compat.toast-more',
      values: { count: 3 },
    });
  });

  test('a failed read toasts nothing and keeps the baseline', async () => {
    const storage = memoryStorage();
    const notify = recorder();

    rememberReport(before, storage);

    const result = await createCompatWatcher({
      api: { getCompatibility: async () => ({ ok: false, body: null }) },
      notify,
      storage,
    }).check();

    expect(result).toBeNull();
    expect(notify.toasts).toEqual([]);
    expect(JSON.parse(storage.getItem('pano.theme-compat.baseline')).fallback).toBe(1);
  });

  test('a blocked storage does not break the check', async () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const notify = recorder();

    const result = await createCompatWatcher({
      api: { getCompatibility: async () => ({ ok: true, body: grown() }) },
      notify,
      storage: blocked,
    }).check();

    expect(result.fresh).toEqual([]);
    expect(fallbackIssues(result.report)).toHaveLength(2);
  });
});

describe('theme api', () => {
  test('talks to the three panel paths', async () => {
    const client = stubClient({
      'GET /panel/theme/compatibility': REPORT,
      'GET /panel/theme/home': HOME,
      'PUT /panel/theme/home': { value: 'store' },
    });
    const api = createThemeApi(client);

    expect((await api.getCompatibility()).body.status).toBe('OUTDATED');
    expect((await api.getHome()).body.default).toBe('landing');
    expect((await api.saveHome('custom:/rules')).ok).toBe(true);
    expect(client.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /panel/theme/compatibility',
      'GET /panel/theme/home',
      'PUT /panel/theme/home',
    ]);
    expect(client.calls[2].body).toEqual({ homePage: 'custom:/rules' });
  });

  test('an error envelope and a thrown request both come back as a failed result', async () => {
    const failing = createThemeApi({
      get: async () => ({ error: { code: 'NO_PERMISSION' } }),
      put: async () => {
        throw new Error('offline');
      },
    });

    expect((await failing.getHome()).error.code).toBe('NO_PERMISSION');
    expect((await failing.saveHome(null)).error.code).toBe('NETWORK_ERROR');
  });
});

describe('home page controller', () => {
  const make = (initial = HOME, answers = {}) => {
    const client = stubClient({ 'PUT /panel/theme/home': { value: null }, ...answers });
    const notify = recorder();

    return {
      client,
      notify,
      c: createHomeController({ api: createThemeApi(client), notify, initial }),
    };
  };
  const get = (store) => {
    let value;

    store.subscribe((v) => (value = v))();

    return value;
  };

  test('starts on the theme default when nothing is stored', () => {
    const { c } = make();

    expect(get(c.selected)).toBe('landing');
    expect(get(c.dirty)).toBe(false);
    expect(get(c.canSave)).toBe(false);
  });

  test('picking another option sends its id; picking the default sends null', async () => {
    const { c, client } = make();

    c.select('posts');
    expect(get(c.payload)).toBe('posts');
    expect(get(c.canSave)).toBe(true);
    expect(await c.save()).toBe(true);
    expect(client.calls.at(-1).body).toEqual({ homePage: 'posts' });
    expect(get(c.dirty)).toBe(false);

    c.select('landing');
    expect(get(c.payload)).toBeNull();
    await c.save();
    expect(client.calls.at(-1).body).toEqual({ homePage: null });
  });

  test('an option that is not available cannot be picked', () => {
    const { c } = make();

    c.select('store');

    expect(get(c.selected)).toBe('landing');
  });

  test('the custom option asks for a path and sends custom:/path', async () => {
    const { c, client } = make();

    c.select('custom');
    expect(get(c.customSelected)).toBe(true);
    expect(get(c.pathInvalid)).toBe(true);
    expect(get(c.canSave)).toBe(false);

    c.customPath.set('  /rules ');
    expect(get(c.pathInvalid)).toBe(false);
    await c.save();
    expect(client.calls.at(-1).body).toEqual({ homePage: 'custom:/rules' });
  });

  test('a stored custom path preselects the custom option with the path', () => {
    const { c } = make({ ...HOME, value: 'custom:/rules' });

    expect(get(c.selected)).toBe('custom');
    expect(get(c.customPath)).toBe('/rules');
    expect(get(c.dirty)).toBe(false);
  });

  test('paths follow the backend rule', () => {
    for (const good of ['/', '/rules', '/store/vip', '/a-b_c?x=1'])
      expect(isConcretePath(good)).toBe(true);
    for (const bad of [
      '',
      'rules',
      '//evil.com',
      '/a b',
      '/store/[slug]',
      '/a\\b',
      '/' + 'a'.repeat(256),
    ])
      expect(isConcretePath(bad)).toBe(false);
  });

  test('a refused save keeps the form dirty and says why', async () => {
    const { c, notify } = make(HOME, {
      'PUT /panel/theme/home': { error: { code: 'INVALID_HOME_PAGE' } },
    });

    c.select('posts');

    expect(await c.save()).toBe(false);
    expect(get(c.dirty)).toBe(true);
    expect(get(c.problem)).toEqual({ code: 'INVALID_HOME_PAGE', key: 'errors.INVALID_HOME_PAGE' });
    expect(notify.toasts.at(-1)).toEqual({ type: 'error', key: 'errors.INVALID_HOME_PAGE' });
  });

  test('labels: plain, locale map with fallbacks, and the id when missing', () => {
    expect(optionLabel({ id: 'posts', label: 'Posts' })).toBe('Posts');
    expect(optionLabel(HOME.options[1], 'tr')).toBe('Açılış');
    expect(optionLabel(HOME.options[1], 'ru')).toBe('Landing');
    expect(optionLabel({ id: 'x', label: { de: 'Start' } }, 'tr')).toBe('Start');
    expect(optionLabel({ id: 'x' })).toBe('x');
    expect(normalizeHome(null).default).toBe('posts');
  });
});

describe('home page select', () => {
  const render = (initial) =>
    renderHtml(HomePageSelect, {
      controller: createHomeController({
        api: createThemeApi(stubClient()),
        notify: recorder(),
        initial,
      }),
    });

  test('lists the options, marks the default and disables what is unavailable', () => {
    const html = render(HOME);

    expect(textOf(html)).toContain('Home Page');
    expect(html).toMatch(/<option value="posts"[^>]*>\s*Posts\s*<\/option>/);
    expect(textOf(html)).toContain('Landing (Default)');
    expect(html).toMatch(/<option value="store"[^>]*disabled/);
    expect(textOf(html)).toContain('Store (Unavailable)');
    expect(html).toMatch(/<option value="landing"[^>]*selected/);
  });

  test('the path input shows only while custom is picked', () => {
    expect(render(HOME)).not.toContain('id="homePageCustomPath"');

    const html = render({ ...HOME, value: 'custom:/rules' });

    expect(html).toContain('id="homePageCustomPath"');
    expect(html).toContain('value="/rules"');
  });

  test('save is disabled until something changes', () => {
    const tag = render(HOME).match(/<button[^>]*data-save-home[^>]*>/)?.[0] ?? '';

    expect(tag).toContain('disabled');
  });
});

describe('translation source tag', () => {
  test('a theme text gets the tag', () => {
    const html = renderHtml(SourceTag, { source: 'theme' });

    expect(html).toContain('data-source-tag="theme"');
    expect(textOf(html)).toBe('Theme');
  });

  test('a plugin text and a row without a source get none', () => {
    expect(renderHtml(SourceTag, { source: 'plugin' })).not.toContain('data-source-tag');
    expect(renderHtml(SourceTag, {})).not.toContain('data-source-tag');
  });
});

describe('lang keys', () => {
  const read = (locale) =>
    JSON.parse(
      readFileSync(join(import.meta.dir, '../../../../../lang', `${locale}.json`), 'utf8'),
    );
  const at = (tree, path) => path.split('.').reduce((node, part) => node?.[part], tree);

  const KEYS = [
    'pages.theme-compat.title',
    'pages.theme-compat.description',
    'pages.theme-compat.badge-title',
    'pages.theme-compat.toast-more',
    'pages.theme-settings.home.label',
    'pages.theme-settings.home.description',
    'pages.theme-settings.home.default',
    'pages.theme-settings.home.unavailable',
    'pages.theme-settings.home.custom-path',
    'pages.theme-settings.home.custom-path-placeholder',
    'pages.theme-settings.home.custom-path-invalid',
    'pages.theme-settings.home.saved',
    'pages.theme-settings.home.save-failed',
    'pages.translations.source-theme',
    'pages.translations.source-theme-title',
    'errors.INVALID_HOME_PAGE',
    ...[
      'CONTRACT_MISMATCH',
      'CONTROLLER_MISMATCH',
      'VIEW_REMOVED',
      'ENGINE_MISMATCH',
      'NAMESPACE_CLASH',
      'UNKNOWN',
    ].map((type) => `pages.theme-compat.issues.${type}`),
  ];

  const VALUES = {
    view: 'V',
    plugin: 'P',
    theme: 't',
    count: 2,
    themeContract: 1,
    currentContract: 2,
    controller: 'c',
    themeVersion: 1,
    currentVersion: 2,
    pluginVersion: '1',
    engineContract: 2,
    pluginId: 'p',
    namespace: 'n',
    heldBy: 'h',
    type: 'T',
  };

  for (const locale of ['en-US', 'tr', 'ru']) {
    test(`${locale} has every key and each one is valid ICU`, () => {
      const lang = read(locale);
      const missing = KEYS.filter(
        (key) => typeof at(lang, key) !== 'string' || at(lang, key) === '',
      );
      const broken = [];

      for (const key of KEYS) {
        try {
          new IntlMessageFormat(at(lang, key), locale).format(VALUES);
        } catch {
          broken.push(key);
        }
      }

      expect(missing).toEqual([]);
      expect(broken).toEqual([]);
    });
  }
});
