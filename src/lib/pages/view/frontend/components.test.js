import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { get, readable, writable } from 'svelte/store';

import {
  renderHtml,
  textOf,
  useLocale,
  stubClient,
  recordingNotify,
  autoConfirm,
} from './testkit.js';
import { createFrontendApi } from './frontend.api.js';
import { createKeysController } from './keys.controller.js';
import { createModeController } from './mode.controller.js';
import { createOriginsController } from './origins.controller.js';
import { createUrlsController } from './urls.controller.js';

// The page imports the panel's own HTTP client, toasts, confirm dialog and plugin menus; none of
// them is under test here, so they are stand-ins.
mock.module('$lib/api.util', () => ({ default: stubClient(), buildQueryParams: () => '' }));
mock.module('$lib/components/ToastContainer.svelte', () => ({
  showSuccess: () => {},
  showError: () => {},
  show: () => {},
}));
mock.module('$lib/components/modals/ConfirmActionModal.svelte', () => ({
  show: () => {},
  hide: () => {},
}));
// `Date` reads the tooltip action and the current language; both need the browser SDK.
mock.module('$lib/tooltip.util', () => ({ default: () => ({}) }));
mock.module('$lib/language.util.js', () => ({
  currentLanguage: writable({ dateFnsCode: 'enUS' }),
}));

const { default: FrontendKeys } = await import('./FrontendKeys.svelte');
const { default: FrontendMode } = await import('./FrontendMode.svelte');
const { default: ProxyBanner } = await import('./ProxyBanner.svelte');
const { default: FrontendKeyReveal } = await import('./FrontendKeyReveal.svelte');
const { default: Frontend } = await import('./FrontendContent.svelte');
const { default: FrontendModal } = await import('./FrontendModal.svelte');
const { default: FrontendOriginsModal } = await import('./FrontendOriginsModal.svelte');
const { default: FrontendOtherSites } = await import('./FrontendOtherSites.svelte');
const { default: FrontendUrls } = await import('./FrontendUrls.svelte');

beforeAll(() => useLocale('en-US'));

/** The opening tag that carries an attribute, so a test can ask whether that very element is disabled. */
const tagWith = (html, attribute) =>
  html.match(new RegExp(`<[a-z]+[^>]*${attribute}[^>]*>`))?.[0] ?? '';

const keysController = (initial) => {
  const { confirm } = autoConfirm();

  return createKeysController({
    api: createFrontendApi(stubClient()),
    notify: recordingNotify(),
    confirm,
    initial,
  });
};

const modeController = (initial) => {
  const { confirm } = autoConfirm();

  return createModeController({
    api: createFrontendApi(stubClient()),
    notify: recordingNotify(),
    confirm,
    initial,
  });
};

const STATE = {
  mode: 'THEME',
  customAppId: '',
  upstreamUrl: '',
  siteUrl: '',
  descriptorUrl: '',
  devUrl: '',
  customApps: [],
  running: true,
  activeId: 'vanilla-theme',
  devUrlActive: false,
};

const APPS = [
  { id: 'shop', title: 'Shop', version: '1.0.0', author: 'Ada', active: false },
  { id: 'blog', title: 'Blog', version: '2.1.0', author: 'Bob', active: true },
];

const ORIGINS = { origins: ['https://play.example.com', 'https://shop.example.com'], max: 20 };

const URLS = {
  siteUrl: 'https://example.com',
  overrides: { 'auth.login': '/sign-in' },
  targets: [
    {
      id: 'auth.login',
      owner: 'core',
      source: 'OVERRIDE',
      path: '/sign-in',
      defaultPath: '/login',
      fallback: true,
      createsSession: false,
    },
    {
      id: 'market.order',
      owner: 'pano-plugin-market',
      source: 'FALLBACK',
      path: '/_pano/market.order',
      defaultPath: '/store/order/{id}',
      fallback: true,
      createsSession: true,
    },
    {
      id: 'user.profile',
      owner: 'core',
      source: null,
      path: null,
      defaultPath: '/profile',
      fallback: false,
      createsSession: false,
    },
  ],
};

const originsController = (initial = ORIGINS) =>
  createOriginsController({
    api: createFrontendApi(stubClient()),
    notify: recordingNotify(),
    confirm: autoConfirm().confirm,
    initial,
  });

const urlsController = (initial = URLS, hasKey = readable(false)) =>
  createUrlsController({
    api: createFrontendApi(stubClient()),
    notify: recordingNotify(),
    initial,
    hasKey,
  });

describe('Site connection keys modal', () => {
  test('an empty list shows the empty state and no table', () => {
    const html = renderHtml(FrontendKeys, { controller: keysController({ items: [], max: 20 }) });
    const text = textOf(html);

    expect(text).toContain('0/20 Site Connection Keys');
    expect(text).toContain('No site connection keys yet.');
    expect(html).not.toContain('<table');
    expect(text).toContain('Create Key');
  });

  test('a row shows the name, only the hint of the key, and the last use', () => {
    const html = renderHtml(FrontendKeys, {
      controller: keysController({
        items: [
          { id: 1, name: 'my-site', hint: 'ab12', createdAt: 1_700_000_000_000, lastUsedAt: null },
          {
            id: 2,
            name: 'shop',
            hint: 'cd34',
            createdAt: 1_700_000_000_000,
            lastUsedAt: 1_700_100_000_000,
          },
        ],
        max: 20,
      }),
    });
    const text = textOf(html);

    expect(text).toContain('2/20 Site Connection Keys');
    expect(text).toContain('my-site');
    expect(text).toContain('ab12');
    expect(text).toContain('Never');
    expect(html.match(/data-key-row=/g)).toHaveLength(2);
    expect(html).toContain('Revoke');
    // The list never has more than a hint: no full key is rendered.
    expect(html).not.toMatch(/pfk_[A-Za-z0-9_-]{20,}/);
  });

  test('the create button is disabled when the key limit is reached', () => {
    const html = renderHtml(FrontendKeys, {
      controller: keysController({
        items: [{ id: 1, name: 'a', hint: '1111', createdAt: 1, lastUsedAt: null }],
        max: 1,
      }),
    });

    expect(tagWith(html, 'data-create-key')).toContain('disabled');
  });

  test('the create dialog asks for a name only and has one full-width button', () => {
    const html = renderHtml(FrontendKeys, { controller: keysController({ items: [], max: 20 }) });

    expect(textOf(html)).toContain('Create a site connection key');
    expect(html).toContain('placeholder="Key name, for example my-site"');
    expect(html).toContain('maxlength="64"');
    expect(html).toContain('btn btn-primary w-100');
  });

  test('the reveal shows the key and the two env lines, each with a copy button', () => {
    const html = renderHtml(FrontendKeyReveal, {
      created: {
        key: 'pfk_SECRETSECRET',
        env: ['PANO_API_URL=https://example.com/api', 'PANO_FRONTEND_KEY=pfk_SECRETSECRET'],
      },
    });

    expect(html).toContain('value="pfk_SECRETSECRET"');
    expect(html).toContain(
      'PANO_API_URL=https://example.com/api\nPANO_FRONTEND_KEY=pfk_SECRETSECRET',
    );
    expect(html.match(/fa-copy/g)).toHaveLength(2);
  });
});

describe('Mode tab', () => {
  test('lists the four modes and marks the stored one', () => {
    const html = renderHtml(FrontendMode, {
      controller: modeController({ ...STATE, mode: 'NONE' }),
    });

    for (const mode of ['THEME', 'CUSTOM_APP', 'EXTERNAL', 'NONE']) {
      expect(html).toContain(`data-mode="${mode}"`);
    }

    expect(html).toMatch(
      /aria-checked="true"[^>]*data-mode="NONE"|data-mode="NONE"[^>]*aria-checked="true"/,
    );
    expect(html).toContain('data-section="site-url"');
    expect(html).toContain('data-section="descriptor-url"');
    expect(html).not.toContain('data-section="external"');
  });

  test('THEME has no fields; the save button is disabled until something changes', () => {
    const html = renderHtml(FrontendMode, { controller: modeController(STATE) });

    expect(html).not.toContain('data-section=');
    expect(tagWith(html, 'data-save-mode')).toContain('disabled');
  });

  test('EXTERNAL shows the upstream, site and descriptor fields with their values', () => {
    const html = renderHtml(FrontendMode, {
      controller: modeController({
        ...STATE,
        mode: 'EXTERNAL',
        upstreamUrl: 'http://127.0.0.1:4000',
        siteUrl: 'https://example.com',
      }),
    });

    expect(html).toContain('data-section="external"');
    expect(html).toContain('value="http://127.0.0.1:4000"');
    expect(html).toContain('value="https://example.com"');
    expect(html).toContain('data-section="descriptor-url"');
    expect(textOf(html)).toContain('Upstream URL');
  });

  test('CUSTOM_APP lists the uploaded apps with the active one badged and not deletable', () => {
    const html = renderHtml(FrontendMode, {
      controller: modeController({
        ...STATE,
        mode: 'CUSTOM_APP',
        customAppId: 'shop',
        customApps: APPS,
      }),
    });
    const text = textOf(html);

    expect(html).toContain('data-section="custom-app"');
    expect(html.match(/data-app-row=/g)).toHaveLength(2);
    expect(text).toContain('Shop');
    expect(text).toContain('2.1.0');
    expect(text).toContain('Active');
    expect(html).toMatch(/data-delete-app="blog"/);
    expect(tagWith(html, 'data-delete-app="blog"')).toContain('disabled');
    expect(tagWith(html, 'data-delete-app="shop"')).not.toContain('disabled');
    expect(html).toContain('data-upload-input');
    expect(text).toContain('Upload App (.zip)');
  });

  test('CUSTOM_APP without any app shows the empty state next to the upload button', () => {
    const html = renderHtml(FrontendMode, {
      controller: modeController({ ...STATE, mode: 'CUSTOM_APP' }),
    });

    expect(textOf(html)).toContain('No custom app uploaded yet.');
    expect(html).toContain('data-upload-app');
  });

  test('an active theme dev server is announced', () => {
    const html = renderHtml(FrontendMode, {
      controller: modeController({ ...STATE, devUrl: 'http://localhost:3000', devUrlActive: true }),
    });

    expect(textOf(html)).toContain('http://localhost:3000');
    expect(html).toContain('data-dev-url-note');
  });

  test('a refused save renders its message; an unreachable upstream also renders "Save Anyway"', async () => {
    const client = stubClient({
      'PUT /panel/frontend': { error: { code: 'UPSTREAM_UNREACHABLE', fields: {} } },
    });
    const { confirm } = autoConfirm();
    const controller = createModeController({
      api: createFrontendApi(client),
      notify: recordingNotify(),
      confirm,
      initial: { ...STATE, mode: 'EXTERNAL', upstreamUrl: 'http://10.0.0.5:4000' },
    });

    controller.draft.update((d) => ({ ...d, upstreamUrl: 'http://10.0.0.6:4000' }));
    await controller.save();

    const html = renderHtml(FrontendMode, { controller });

    expect(html).toContain('data-error-code="UPSTREAM_UNREACHABLE"');
    expect(textOf(html)).toContain('Nothing answered at that address within 5 seconds.');
    expect(html).toContain('data-force-save');
  });

  test('the manifest error names the field', async () => {
    const client = stubClient({
      'POST /panel/frontend/custom-apps': {
        error: {
          code: 'CUSTOM_APP_INVALID_MANIFEST',
          details: { field: 'version' },
          fields: { version: 'INVALID' },
        },
      },
    });
    const { confirm } = autoConfirm();
    const controller = createModeController({
      api: createFrontendApi(client),
      notify: recordingNotify(),
      confirm,
      initial: { ...STATE, mode: 'CUSTOM_APP' },
    });

    await controller.upload(new File(['x'], 'a.zip'));

    const html = renderHtml(FrontendMode, { controller });

    expect(textOf(html)).toContain('Check the field "version".');
    expect(html).not.toContain('data-force-save');
  });
});

describe('Proxy banner', () => {
  test('nothing is rendered while the proxy is fine, or unknown', () => {
    expect(
      renderHtml(ProxyBanner, { status: { state: 'OK', peers: [], suggestion: null } }).trim(),
    ).not.toContain('data-proxy-banner');
    expect(renderHtml(ProxyBanner, { status: null })).not.toContain('data-proxy-banner');
  });

  test('an untrusted proxy shows the peer and the exact trusted-proxies line', () => {
    const line = 'trusted-proxies = ["203.0.113.7"]';
    const html = renderHtml(ProxyBanner, {
      status: { state: 'UNTRUSTED_PROXY', peers: ['203.0.113.7'], suggestion: line },
    });

    expect(html).toContain('data-proxy-banner');
    expect(textOf(html)).toContain('203.0.113.7');
    expect(html).toContain(`data-proxy-line="">${line}</pre>`);
    expect(textOf(html)).toContain('Copy Line');
  });

  test('a single client address names the proxy and has no line to copy', () => {
    const html = renderHtml(ProxyBanner, {
      status: { state: 'SINGLE_CLIENT_IP', peers: ['10.0.0.2'], suggestion: null },
    });

    expect(textOf(html)).toContain('All Visitors Look Like One Address');
    expect(textOf(html)).toContain('10.0.0.2');
    expect(html).not.toContain('data-proxy-line');
  });
});

describe('Front-end settings', () => {
  const content = (data) =>
    renderHtml(Frontend, {
      data,
      api: createFrontendApi(stubClient()),
      notify: recordingNotify(),
      confirm: () => {},
    });
  const KEYS = {
    items: [{ id: 1, name: 'my-site', hint: 'ab12', createdAt: 1, lastUsedAt: null }],
    max: 20,
  };
  const dataFor = (mode) => ({
    keys: KEYS,
    frontend: { ...STATE, mode },
    proxyStatus: null,
    origins: ORIGINS,
    urls: URLS,
  });

  test('has no tabs: the mode choice, then the keys, other websites and link targets rows', () => {
    const html = content({
      ...dataFor('CUSTOM_APP'),
      frontend: { ...STATE, mode: 'CUSTOM_APP', customAppId: 'shop', customApps: APPS },
      proxyStatus: {
        state: 'UNTRUSTED_PROXY',
        peers: ['203.0.113.7'],
        suggestion: 'trusted-proxies = ["203.0.113.7"]',
      },
    });
    const text = textOf(html);

    expect(html).toContain('data-proxy-banner');
    expect(html).not.toContain('data-tab=');
    expect(html).not.toContain('role="tablist"');
    expect(html).toContain('data-section="custom-app"');
    expect(html).toContain('data-row="keys"');
    expect(html).toContain('data-other-sites');
    expect(html).toContain('data-row="urls"');
    expect(text).toContain('Site connection keys');
    expect(text).toContain('Allow other websites to access this Pano');
    expect(text).toContain('Link targets');
    expect(text).not.toMatch(/origin/i);
  });

  test('the keys row is enabled while the saved mode is Custom app, External or None', () => {
    for (const mode of ['CUSTOM_APP', 'EXTERNAL', 'NONE']) {
      const html = content(dataFor(mode));

      expect(tagWith(html, 'data-open-keys')).not.toContain('disabled');
      expect(html).toContain('data-keys-modal');
    }
  });

  test('in Theme mode the keys row is disabled and nothing explains why', () => {
    const html = content(dataFor('THEME'));

    expect(tagWith(html, 'data-open-keys')).toContain('disabled');
    expect(html).not.toContain('data-frontend-locked');
    expect(textOf(html)).not.toContain('work only when the front-end is not a theme');
    // Stored keys stay in the list and work again when the mode changes.
    expect(html).toContain('data-key-row="1"');
  });

  test('the other-websites switch and the link targets row work in every mode', () => {
    for (const mode of ['THEME', 'CUSTOM_APP', 'EXTERNAL', 'NONE']) {
      const html = content(dataFor(mode));

      expect(tagWith(html, 'data-other-sites-switch')).not.toContain('disabled');
      expect(tagWith(html, 'data-open-urls')).not.toContain('disabled');
    }
  });

  test('the rows mark the link targets from the keys the keys modal holds', () => {
    const html = content(dataFor('EXTERNAL'));

    expect(html.match(/data-needed-for-server/g)).toHaveLength(1);
  });

  test('a failed keys read disables the row; a failed websites read is reported in its row', () => {
    const html = content({ ...dataFor('EXTERNAL'), keys: null, origins: null });

    expect(tagWith(html, 'data-open-keys')).toContain('disabled');
    expect(html.match(/data-load-failed/g)).toHaveLength(1);
  });
});

describe('Websites list modal', () => {
  test('lists the origins with the count and a remove action each', () => {
    const html = renderHtml(FrontendOriginsModal, { controller: originsController() });
    const text = textOf(html);

    expect(text).toContain('2/20 Websites');
    expect(html.match(/data-origin-row=/g)).toHaveLength(2);
    expect(text).toContain('https://play.example.com');
    expect(text).toContain('Remove');
    expect(text).toContain('Add Website');
  });

  test('an empty list shows the empty state and no table', () => {
    const html = renderHtml(FrontendOriginsModal, {
      controller: originsController({ origins: [], max: 20 }),
    });

    expect(textOf(html)).toContain('No websites yet.');
    expect(html).not.toContain('<table');
  });

  test('the add button is disabled at the limit', () => {
    const html = renderHtml(FrontendOriginsModal, {
      controller: originsController({ origins: ['https://a.example.com'], max: 1 }),
    });

    expect(tagWith(html, 'data-add-origin')).toContain('disabled');
  });

  test('the add dialog is one field and one full-width button', () => {
    const html = renderHtml(FrontendOriginsModal, { controller: originsController() });
    const dialog = html.slice(html.indexOf('modal fade'));

    expect(textOf(dialog)).toContain('Add a website');
    expect(dialog).toContain('placeholder="https://play.example.com"');
    expect(dialog).toMatch(/<button[^>]*class="btn btn-primary w-100"[^>]*type="submit"/);
  });

  test('a refused origin is explained under the field, with the different-domain wording', async () => {
    const controller = createOriginsController({
      api: createFrontendApi(
        stubClient({ 'PUT /panel/frontend/origins': { error: { code: 'ORIGIN_DIFFERENT_SITE' } } }),
      ),
      notify: recordingNotify(),
      confirm: autoConfirm().confirm,
      initial: ORIGINS,
    });

    await controller.add('https://evil.com');

    const html = renderHtml(FrontendOriginsModal, { controller });

    expect(html).toContain('data-origin-error="ORIGIN_DIFFERENT_SITE"');
    expect(textOf(html).toLowerCase()).toContain('a different domain uses a site connection key');
  });
});

describe('Link targets modal', () => {
  test('a row per target with its owner, source, path and override', () => {
    const html = renderHtml(FrontendUrls, { controller: urlsController() });
    const text = textOf(html);

    expect(text).toContain('3 Link Targets');
    expect(html.match(/data-target-row=/g)).toHaveLength(3);
    expect(html).toContain('data-source="OVERRIDE"');
    expect(html).toContain('data-source="FALLBACK"');
    expect(html).toContain('data-source="NONE"');
    expect(text).toContain('Admin override');
    expect(text).toContain('Built-in page');
    expect(text).toContain('No page');
    expect(text).toContain('/_pano/market.order');
    expect(text).toContain('pano-plugin-market');
    expect(text).toContain('Pano');
  });

  test('only a row with an override offers to remove it', () => {
    const html = renderHtml(FrontendUrls, { controller: urlsController() });
    const rows = html.split('data-target-row=').slice(1);

    expect(rows[0]).toContain('Remove Override');
    expect(rows[1]).not.toContain('Remove Override');
    expect(rows[1]).toContain('Set Override');
  });

  test('session-creating rows are marked "needed for server-side front-ends" only while a key is stored', () => {
    const without = renderHtml(FrontendUrls, { controller: urlsController(URLS, readable(false)) });
    const withKey = renderHtml(FrontendUrls, { controller: urlsController(URLS, readable(true)) });

    expect(without).not.toContain('data-needed-for-server');
    expect(withKey.match(/data-needed-for-server/g)).toHaveLength(1);
    expect(textOf(withKey)).toContain('needed for server-side front-ends');

    // The mark sits on the row that creates a session.
    const marked = withKey
      .split('data-target-row=')
      .slice(1)
      .find((row) => row.includes('data-needed-for-server'));

    expect(marked).toContain('market.order');
  });

  test('the page marks the rows from the keys the keys modal holds', () => {
    const html = renderHtml(Frontend, {
      data: {
        keys: {
          items: [{ id: 1, name: 'site', hint: 'ab12', createdAt: 1, lastUsedAt: null }],
          max: 20,
        },
        frontend: { ...STATE },
        proxyStatus: null,
        origins: ORIGINS,
        urls: URLS,
      },
      api: createFrontendApi(stubClient()),
      notify: recordingNotify(),
      confirm: () => {},
    });

    expect(html.match(/data-needed-for-server/g)).toHaveLength(1);
  });

  test('the override dialog is one field and one full-width button', () => {
    const html = renderHtml(FrontendUrls, { controller: urlsController() });
    const dialog = html.slice(html.indexOf('modal fade'));

    expect(dialog).toContain('placeholder="/shop or https://example.com/shop"');
    expect(dialog).toMatch(/<button[^>]*class="btn btn-primary w-100"[^>]*type="submit"/);
  });
});

describe('Allow other websites switch', () => {
  const sites = (initial) => {
    const { confirm, dialogs } = autoConfirm();
    const controller = createOriginsController({
      api: createFrontendApi(stubClient({ 'PUT /panel/frontend/origins': { origins: [] } })),
      notify: recordingNotify(),
      confirm,
      initial,
    });

    return { controller, dialogs };
  };

  test('is off with an empty list: no count, no edit button', () => {
    const { controller } = sites({ origins: [], max: 20 });
    const html = renderHtml(FrontendOtherSites, { controller });

    expect(tagWith(html, 'data-other-sites-switch')).not.toContain('checked');
    expect(html).not.toContain('data-sites-count');
    expect(html).not.toContain('data-edit-sites');
    expect(textOf(html)).toContain('Allow other websites to access this Pano');
    expect(textOf(html)).toContain('read data from this Pano in the visitor');
  });

  test('is on with a saved site and shows the count and an Edit button', () => {
    const { controller } = sites(ORIGINS);
    const html = renderHtml(FrontendOtherSites, { controller });

    expect(tagWith(html, 'data-other-sites-switch')).toContain('checked');
    expect(textOf(html)).toContain('2 websites');
    expect(tagWith(html, 'data-edit-sites')).toContain('title="Edit"');
  });

  test('turning it off asks first, then saves an empty list', async () => {
    const { controller, dialogs } = sites(ORIGINS);

    controller.requestDisable();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialogs).toHaveLength(1);
    expect(dialogs[0].title).toBe('pages.frontend.origins.disable.title');
    expect(get(controller.items)).toEqual([]);
    expect(get(controller.enabled)).toBe(false);
  });

  test('turning it on reads as on until the editor closes empty, then goes back to off', () => {
    const { controller } = sites({ origins: [], max: 20 });

    controller.enable();
    expect(get(controller.enabled)).toBe(true);

    controller.editorClosed();
    expect(get(controller.enabled)).toBe(false);
  });

  test('closing the editor with a site on the list keeps it on', async () => {
    const { controller } = sites({ origins: [], max: 20 });
    const added = createOriginsController({
      api: createFrontendApi(
        stubClient({ 'PUT /panel/frontend/origins': { origins: ['https://play.example.com'] } }),
      ),
      notify: recordingNotify(),
      confirm: () => {},
      initial: { origins: [], max: 20 },
    });

    added.enable();
    await added.add('https://play.example.com');
    added.editorClosed();

    expect(get(added.enabled)).toBe(true);
    expect(get(controller.enabled)).toBe(false);
  });
});

describe('Front-end settings modal', () => {
  test('is a scrollable modal with the title and a close button, and no data until opened', () => {
    const html = renderHtml(FrontendModal, { api: createFrontendApi(stubClient()) });

    expect(html).toContain('modal-dialog-scrollable');
    expect(html).toContain('btn-close');
    expect(textOf(html)).toContain('Front-end');
    expect(html).not.toContain('data-tab=');
  });
});
