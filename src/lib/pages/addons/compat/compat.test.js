import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  readLang,
  renderHtml,
  stubClient,
  textOf,
  useLocale,
} from '../../view/frontend/testkit.js';
import { createCompatibilityApi } from './compat.api.js';
import {
  attentionCounts,
  canUpdate,
  createPlanController,
  externalUrlsOf,
  normalizeCompatibility,
  normalizePlan,
  planCounts,
  planNeedsAttention,
  planProblem,
  pluginProblem,
  refusalProblem,
  safeDownloadPath,
  lockedReason,
  heldReason,
  isLocked,
  normalizeHeldBy,
  themeProblem,
  verdictKey,
} from './compat.util.js';

// The card imports the panel's HTTP client and toasts; none of them is under test here.
mock.module('$lib/api.util', () => ({ default: stubClient(), buildQueryParams: () => '' }));
mock.module('$lib/components/ToastContainer.svelte', () => ({
  showSuccess: () => {},
  showError: () => {},
  show: () => {},
}));
mock.module('$lib/tooltip.util', () => ({ default: () => ({}) }));

const { default: CompatProblemIcon } = await import('$lib/components/CompatProblemIcon.svelte');
const { default: UpdatePlanIcon } = await import('./UpdatePlanIcon.svelte');
const { default: AddonProblemIcon } = await import('../AddonProblemIcon.svelte');
const { default: AddonApiLevel } = await import('../AddonApiLevel.svelte');
const { default: AddonToggle } = await import('../AddonToggle.svelte');
const { default: AddonDetail } = await import('../AddonDetail.svelte');
const { default: ThemeActivateButton } =
  await import('../../view/theme/ThemeActivateButton.svelte');

beforeAll(() => useLocale('en-US'));

/** What `GET /panel/compatibility` answers while a plugin and a theme are refused. */
const REPORT = {
  apiLevel: { min: 1, current: 2 },
  resources: [
    {
      id: 'pano-plugin-market',
      type: 'PLUGIN',
      title: 'Market',
      version: 'v1.0.0-dev.18',
      apiLevel: 0,
      verdict: 'TOO_OLD',
      hasCompatibleUpdate: true,
      lastError: null,
    },
    {
      id: 'blaze-theme',
      type: 'THEME',
      title: 'Blaze',
      version: '1.4.0',
      apiLevel: 0,
      verdict: 'TOO_OLD',
      hasCompatibleUpdate: false,
      lastError: 'DOWNLOAD_FAILED',
    },
  ],
  agents: [
    {
      type: 'SERVER',
      id: 3,
      name: 'Survival',
      protocolVersion: 2,
      minProtocolVersion: 3,
      pluginVersion: 'alpha.65',
      action: 'MANUAL_JAR',
      downloadPath: '/api/v1/panel/servers/3/pano-plugin/jar',
    },
    {
      type: 'NODE',
      id: 1,
      name: 'Node One',
      protocolVersion: 4,
      minProtocolVersion: 5,
      pluginVersion: '1.0.0',
      action: 'MANUAL_JAR',
      downloadPath: '/api/v1/node/pano-node.jar',
    },
  ],
  externalUrls: [
    {
      pluginId: 'pano-plugin-premium-login',
      label: 'Microsoft redirect URL',
      url: 'https://example.com/api/plugins/pano-plugin-premium-login/callback',
    },
  ],
  reconcile: { running: false, ranAt: 1700000000000, storeReachable: false, installed: [] },
};

const PLAN = {
  target: { version: 'v2.0.0', apiLevel: 3, minApiLevel: 2 },
  resources: [
    {
      id: 'pano-plugin-market',
      type: 'PLUGIN',
      installedVersion: 'v1.0.0',
      verdict: 'UPDATE',
      updateVersionId: 'abc',
    },
    { id: 'pano-plugin-old', type: 'PLUGIN', installedVersion: 'v0.3.0', verdict: 'DISABLE' },
    { id: 'blaze-theme', type: 'THEME', installedVersion: '1.4.0', verdict: 'COMPATIBLE' },
  ],
  agents: [],
  storeReachable: true,
};

const OUTDATED_THEME = {
  theme: { id: 'blaze-theme', version: '1.4.0' },
  status: 'OUTDATED',
  counts: { overrides: 3, active: 1, fallback: 2, pluginNotInstalled: 0 },
  issues: [
    { type: 'CONTRACT_MISMATCH', view: 'market:ProductCard' },
    { type: 'VIEW_REMOVED', view: 'market:Cart' },
    { type: 'NAMESPACE_CLASH', namespace: 'x', pluginId: 'y', heldBy: 'z' },
  ],
};

describe('normalizeCompatibility', () => {
  test('keeps what the backend sent and fills what it left out', () => {
    const report = normalizeCompatibility(REPORT);

    expect(report.apiLevel).toEqual({ min: 1, current: 2 });
    expect(report.resources[0]).toMatchObject({
      id: 'pano-plugin-market',
      apiLevel: 0,
      hasCompatibleUpdate: true,
    });
    expect(report.resources[1].lastError).toBe('DOWNLOAD_FAILED');
    expect(report.agents[1]).toMatchObject({
      type: 'NODE',
      protocolVersion: 4,
      minProtocolVersion: 5,
    });
    expect(report.reconcile.storeReachable).toBe(false);

    const bare = normalizeCompatibility({});

    expect(bare.resources).toEqual([]);
    expect(bare.agents).toEqual([]);
    expect(bare.externalUrls).toEqual([]);
    expect(bare.apiLevel).toEqual({ min: null, current: null });
  });

  test('an error or a non-object is not a report', () => {
    expect(normalizeCompatibility(null)).toBeNull();
    expect(normalizeCompatibility('x')).toBeNull();
    expect(normalizeCompatibility({ error: { code: 'NO_PERMISSION' } })).toBeNull();
  });

  test('a download path that leaves this Pano is dropped', () => {
    expect(safeDownloadPath('/api/v1/node/pano-node.jar')).toBe('/api/v1/node/pano-node.jar');
    expect(safeDownloadPath('https://evil.example/x.jar')).toBeNull();
    expect(safeDownloadPath('//evil.example/x.jar')).toBeNull();
    expect(safeDownloadPath('javascript:alert(1)')).toBeNull();
    expect(safeDownloadPath('/a\\b')).toBeNull();
    expect(safeDownloadPath(undefined)).toBeNull();

    const report = normalizeCompatibility({
      agents: [
        { type: 'SERVER', id: 9, name: 'Hostile', downloadPath: 'https://evil.example/x.jar' },
      ],
    });

    expect(report.agents[0].downloadPath).toBeNull();
  });

  test('an address without a url is left out', () => {
    const report = normalizeCompatibility({ externalUrls: [{ pluginId: 'a', label: 'x' }] });

    expect(report.externalUrls).toEqual([]);
  });
});

const translate = (key, options) => key + JSON.stringify(options?.values ?? {});

describe('the problem texts', () => {
  const report = normalizeCompatibility(REPORT);
  const [market, blaze] = report.resources;

  test('a refused plugin says why, its level against the accepted range, and to update', () => {
    expect(refusalProblem(market, report.apiLevel, translate)).toBe(
      'components.compatibility-card.problem.too-old{"level":0,"min":1,"current":2}',
    );
    expect(
      refusalProblem({ verdict: 'TOO_NEW', apiLevel: 9 }, report.apiLevel, translate),
    ).toContain('problem.too-new{');
    // Without the report only the plain wording is possible.
    expect(refusalProblem(market, null, translate)).toContain('problem.too-old-plain');
    expect(refusalProblem({ verdict: 'OK' }, report.apiLevel, translate)).toBe('');
  });

  test('a held plugin names the dependency to update', () => {
    const held = { verdict: 'OK', heldBy: { pluginId: 'm', name: 'Market', verdict: 'TOO_OLD' } };

    expect(refusalProblem(held, report.apiLevel, translate)).toBe(heldReason(held, translate));
  });

  test('pluginProblem is red for a refusal, amber for changed addresses, and joins both', () => {
    const premium = { id: 'pano-plugin-premium-login', verdict: 'OK' };

    expect(pluginProblem(market, report, translate).level).toBe('danger');
    expect(pluginProblem(premium, report, translate)).toEqual({
      text: 'components.compatibility-card.problem.urls{}',
      level: 'warning',
    });
    expect(
      pluginProblem({ ...market, id: 'pano-plugin-premium-login' }, report, translate).text,
    ).toContain(' · ');
    expect(pluginProblem({ id: 'fine', verdict: 'OK' }, report, translate)).toBeNull();
    expect(pluginProblem({ id: 'fine', verdict: 'OK' }, null, translate)).toBeNull();
  });

  test('externalUrlsOf keeps only the addresses of one plugin', () => {
    expect(externalUrlsOf(report, 'pano-plugin-premium-login')).toHaveLength(1);
    expect(externalUrlsOf(report, 'other')).toEqual([]);
    expect(externalUrlsOf(null, 'other')).toEqual([]);
  });

  test('themeProblem: a refused theme, or the active theme whose views fall back', () => {
    const themeReport = { status: 'OUTDATED', issues: OUTDATED_THEME.issues };

    expect(themeProblem({ verdict: 'TOO_OLD', apiLevel: 0 }, report, null, translate).level).toBe(
      'danger',
    );
    expect(themeProblem({ active: true, verdict: 'OK' }, report, themeReport, translate)).toEqual({
      text: 'pages.theme-compat.badge-title{"count":2}',
      level: 'warning',
    });
    // Only the active theme falls back; a theme that is not active shows nothing.
    expect(
      themeProblem({ active: false, verdict: 'OK' }, report, themeReport, translate),
    ).toBeNull();
    expect(themeProblem({ active: true, verdict: 'OK' }, report, null, translate)).toBeNull();
  });

  test('the sidebar counts plugins once and themes with fallbacks', () => {
    expect(attentionCounts(report, { status: 'OUTDATED', issues: OUTDATED_THEME.issues })).toEqual({
      addons: 2,
      themes: 2,
    });
    expect(attentionCounts(null, null)).toEqual({ addons: 0, themes: 0 });
    expect(attentionCounts(normalizeCompatibility({}), { status: 'OK', issues: [] })).toEqual({
      addons: 0,
      themes: 0,
    });
    expect(verdictKey('SOMETHING_NEW')).toBe('components.compatibility-card.verdict.UNKNOWN');
    expect(blaze.type).toBe('THEME');
  });
});

describe('the api', () => {
  test('asks the paths of doc 04 section 7', async () => {
    const client = stubClient({
      'GET /panel/compatibility': REPORT,
      'GET /panel/updates/platform/plan': PLAN,
    });
    const api = createCompatibilityApi(client);

    expect((await api.getCompatibility()).ok).toBe(true);
    expect((await api.getPlan()).ok).toBe(true);
    expect(client.calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /panel/compatibility',
      'GET /panel/updates/platform/plan',
    ]);
  });

  test('an error envelope and a thrown request are failures, not crashes', async () => {
    const api = createCompatibilityApi(
      stubClient({ 'GET /panel/compatibility': { error: { code: 'NO_PERMISSION' } } }),
    );

    expect((await api.getCompatibility()).error.code).toBe('NO_PERMISSION');

    const broken = createCompatibilityApi({
      get: async () => {
        throw new Error('offline');
      },
    });

    expect((await broken.getPlan()).error.code).toBe('NETWORK_ERROR');
  });
});

describe('the update plan', () => {
  test('normalizePlan reads the verdicts and the unknown target', () => {
    const plan = normalizePlan(PLAN);

    expect(plan.known).toBe(true);
    expect(planCounts(plan)).toEqual({ COMPATIBLE: 1, UPDATE: 1, DISABLE: 1 });
    expect(planNeedsAttention(plan)).toBe(true);

    const unknown = normalizePlan({
      target: { version: 'v2', apiLevel: null, minApiLevel: null },
      resources: [{ id: 'a', type: 'PLUGIN', installedVersion: '1', verdict: 'COMPATIBLE' }],
    });

    expect(unknown.known).toBe(false);
    expect(planNeedsAttention(unknown)).toBe(false);

    expect(normalizePlan({ target: null }).target).toBeNull();
    expect(normalizePlan({ error: { code: 'X' } })).toBeNull();
    // A verdict a newer backend invents reads as compatible rather than breaking the page.
    expect(normalizePlan({ resources: [{ id: 'a', verdict: 'NEW' }] }).resources[0].verdict).toBe(
      'COMPATIBLE',
    );
  });

  test('a game server waiting for its jar needs attention even when every resource fits', () => {
    const plan = normalizePlan({ ...PLAN, resources: [], agents: REPORT.agents });

    expect(planNeedsAttention(plan)).toBe(true);
  });

  test('the update button follows the state', () => {
    expect(canUpdate({ status: 'loading' })).toBe(false);
    expect(canUpdate({ status: 'ready' })).toBe(true);
    expect(canUpdate({ status: 'unavailable' })).toBe(true);
    // A plan that could not be read does not lock the button; the icon and the confirmation warn.
    expect(canUpdate({ status: 'failed' })).toBe(true);
  });

  test('loading, then ready', async () => {
    const seen = [];
    const controller = createPlanController({
      api: { getPlan: async () => ({ ok: true, body: PLAN, error: null }) },
      onChange: (state) => seen.push(state.status),
    });

    expect(controller.canUpdate).toBe(false);

    await controller.load();

    expect(seen).toEqual(['loading', 'ready']);
    expect(controller.canUpdate).toBe(true);
    expect(controller.state.plan.target.version).toBe('v2.0.0');
  });

  test('an older platform has no plan: nothing to wait for', async () => {
    const controller = createPlanController({
      api: { getPlan: async () => ({ ok: false, body: null, error: { code: 'NOT_FOUND' } }) },
    });

    await controller.load();

    expect(controller.state.status).toBe('unavailable');
    expect(controller.canUpdate).toBe(true);
  });

  test('any other failure leaves the button usable', async () => {
    const controller = createPlanController({
      api: { getPlan: async () => ({ ok: false, body: null, error: { code: 'NETWORK_ERROR' } }) },
    });

    await controller.load();

    expect(controller.state.status).toBe('failed');
    expect(controller.state.errorCode).toBe('NETWORK_ERROR');
    expect(controller.canUpdate).toBe(true);
  });

  test('a body that is not a plan is a failure', async () => {
    const controller = createPlanController({
      api: { getPlan: async () => ({ ok: true, body: { error: 'x' }, error: null }) },
    });

    await controller.load();

    expect(controller.state.status).toBe('failed');
  });

  test('a retry drops the older answer', async () => {
    const answers = [];
    const controller = createPlanController({
      api: {
        getPlan: () =>
          new Promise((resolve) => {
            answers.push(resolve);
          }),
      },
    });

    const first = controller.load();
    const second = controller.load();

    // The second answer arrives first; the first (older) one must not overwrite it.
    answers[1]({ ok: true, body: PLAN, error: null });
    await second;
    answers[0]({ ok: false, body: null, error: { code: 'NETWORK_ERROR' } });
    await first;

    expect(controller.state.status).toBe('ready');
  });
});

describe('CompatProblemIcon', () => {
  test('draws the exclamation with the text for a screen reader, red by default', () => {
    const html = renderHtml(CompatProblemIcon, { text: 'Too old. Update it.' });

    expect(html).toContain('fa-circle-exclamation');
    expect(html).toContain('text-danger');
    expect(html).toContain('aria-label="Too old. Update it."');
    expect(renderHtml(CompatProblemIcon, { text: 'x', level: 'warning' })).toContain(
      'text-warning',
    );
  });

  test('draws nothing without a text', () => {
    expect(renderHtml(CompatProblemIcon, { text: '' })).not.toContain('fa-circle-exclamation');
    expect(renderHtml(CompatProblemIcon, {})).not.toContain('data-compat-problem');
  });

  test('a refused plugin card shows the icon with the reason, a fine one nothing', () => {
    const report = normalizeCompatibility(REPORT);
    const refused = renderHtml(AddonProblemIcon, {
      plugin: { id: 'pano-plugin-market', status: 'DISABLED', verdict: 'TOO_OLD', apiLevel: 0 },
      report,
    });

    expect(refused).toContain('data-compat-problem="danger"');
    expect(refused).toContain('built for API level 0, this Pano accepts 1 to 2');
    expect(refused).not.toContain('badge');

    const fine = renderHtml(AddonProblemIcon, {
      plugin: { id: 'fine', status: 'DISABLED', verdict: 'OK', apiLevel: 2 },
      report,
    });

    expect(fine).not.toContain('data-compat-problem');
  });

  test('the detail page lists the changed addresses of that plugin with copy buttons', () => {
    const addon = {
      id: 'pano-plugin-premium-login',
      status: 'STARTED',
      verdict: 'OK',
      apiLevel: 2,
      dependencies: [],
      requires: '',
      hash: 'x',
      size: 1,
    };
    const html = renderHtml(AddonDetail, {
      data: { addon, compatibility: normalizeCompatibility(REPORT) },
    });

    expect(html).toContain('data-external-urls');
    expect(html).toContain('callback');
    expect(html).toContain('data-copy-url');
    expect(html).not.toContain('class="alert');

    const other = renderHtml(AddonDetail, {
      data: { addon: { ...addon, id: 'other' }, compatibility: normalizeCompatibility(REPORT) },
    });

    expect(other).not.toContain('data-external-urls');
  });

  test('changed addresses give the plugin card an amber icon', () => {
    const html = renderHtml(AddonProblemIcon, {
      plugin: { id: 'pano-plugin-premium-login', status: 'STARTED', verdict: 'OK', apiLevel: 2 },
      report: normalizeCompatibility(REPORT),
    });

    expect(html).toContain('data-compat-problem="warning"');
    expect(textOf(html)).not.toContain('example.com');
  });
});

describe('UpdatePlanIcon', () => {
  const render = (state, props = {}) => renderHtml(UpdatePlanIcon, { state, ...props });
  const ready = (plan) => ({ status: 'ready', plan: normalizePlan(plan) });

  test('a spinner while the plan loads', () => {
    const html = render({ status: 'loading', plan: null });

    expect(html).toContain('data-plan-loading');
    expect(html).toContain('spinner-border');
    expect(html).toContain('up to 20 seconds');
  });

  test('says what will be switched off, what is updated and the jars by hand', () => {
    const html = render(ready({ ...PLAN, agents: REPORT.agents }));

    expect(html).toContain('data-plan-attention');
    expect(html).toContain('text-warning');
    expect(html).toContain('1 addon or theme will be switched off');
    expect(html).toContain('pano-plugin-old');
    expect(html).toContain('will be updated by Pano after the restart: pano-plugin-market');
    expect(html).toContain('game servers and nodes need a new jar by hand: Survival, Node One');
    expect(html).not.toContain('data-plan-retry');
  });

  test('an update that touches nothing shows no icon at all', () => {
    const html = render(
      ready({
        ...PLAN,
        resources: [{ id: 'a', type: 'PLUGIN', installedVersion: '1', verdict: 'COMPATIBLE' }],
      }),
    );

    expect(html).not.toContain('fa-circle-exclamation');
    expect(html).not.toContain('alert');
  });

  test('an unknown target says it cannot tell', () => {
    const html = render(
      ready({
        target: { version: 'v2.0.0', apiLevel: null, minApiLevel: null },
        resources: [{ id: 'a', type: 'PLUGIN', installedVersion: '1', verdict: 'COMPATIBLE' }],
      }),
    );

    expect(html).toContain('does not say which API level it needs');
  });

  test('an unreachable store is said and offers a retry button', () => {
    const html = render(ready({ ...PLAN, storeReachable: false }));

    expect(html).toContain('The store could not be reached');
    expect(html).toContain('data-plan-retry');
  });

  test('a failed plan is a red icon with a retry button and no checkbox', () => {
    const html = render({ status: 'failed', plan: null });

    expect(html).toContain('data-plan-failed');
    expect(html).toContain('text-danger');
    expect(html).toContain('data-plan-retry');
    expect(html).toContain('The update plan could not be read');
    expect(html).not.toContain('checkbox');
  });

  test('draws nothing when the platform has no plan or no update', () => {
    expect(textOf(render({ status: 'unavailable', plan: null }))).toBe('');
    expect(render({ status: 'unavailable', plan: null })).not.toContain('fa-circle-exclamation');
    expect(planProblem(ready({ target: null, resources: [], agents: [] }), translate)).toBe('');
  });
});

describe('AddonApiLevel', () => {
  test('shows the level of a compatible addon quietly', () => {
    const html = renderHtml(AddonApiLevel, { plugin: { apiLevel: 2, verdict: 'OK' } });

    expect(html).toContain('data-api-level');
    expect(html).toContain('text-bg-secondary');
    expect(textOf(html)).toContain('API 2');
  });

  test('shows the verdict of a refused addon in red', () => {
    const html = renderHtml(AddonApiLevel, { plugin: { apiLevel: 0, verdict: 'TOO_OLD' } });

    expect(html).toContain('text-bg-danger');
    expect(textOf(html)).toContain('Too Old');
  });

  test('shows nothing when the backend sent neither', () => {
    expect(renderHtml(AddonApiLevel, { plugin: { id: 'a' } })).not.toContain('data-api-level');
  });
});

describe('a refused addon or theme can not be switched on', () => {
  const translate = (key, options) => key + JSON.stringify(options?.values ?? {});

  test('lockedReason names the level for a refusal and is empty for a compatible resource', () => {
    expect(lockedReason({ verdict: 'TOO_OLD', apiLevel: 0 }, translate)).toBe(
      'components.compatibility-card.locked{"level":0}',
    );
    expect(lockedReason({ verdict: 'TOO_NEW', apiLevel: 9 }, translate, 'THEME')).toBe(
      'components.compatibility-card.locked-theme{"level":9}',
    );
    expect(lockedReason({ verdict: 'OK', apiLevel: 1 }, translate)).toBe('');
    expect(lockedReason({}, translate)).toBe('');
  });

  test('the addon switch of a refused addon is disabled with the reason as its title', () => {
    const html = renderHtml(AddonToggle, {
      plugin: { status: 'DISABLED', verdict: 'TOO_OLD', apiLevel: 0 },
    });

    expect(html).toContain('data-locked');
    expect(html).toContain('disabled');
    expect(html).toContain('title="Not compatible with this Pano (built for API level 0)');
  });

  test('the addon switch of a compatible addon is a normal switch', () => {
    const html = renderHtml(AddonToggle, {
      plugin: { status: 'DISABLED', verdict: 'OK', apiLevel: 1 },
    });

    expect(html).not.toContain('data-locked');
    expect(html).not.toContain('disabled');
    expect(html).not.toContain('title=');
  });

  test('a switch that is on stays usable so the admin can turn it off', () => {
    const html = renderHtml(AddonToggle, {
      plugin: { status: 'STARTED', verdict: 'TOO_NEW', apiLevel: 9 },
    });

    expect(html).not.toContain('data-locked');
  });

  test('the Activate button of a refused theme is disabled with the reason, a compatible one is a button', () => {
    const refused = renderHtml(ThemeActivateButton, {
      theme: { verdict: 'TOO_OLD', apiLevel: 0 },
    });

    expect(refused).toContain('data-locked');
    expect(refused).toContain('disabled');
    expect(refused).toContain('can not be activated until you update it');

    const fine = renderHtml(ThemeActivateButton, { theme: { verdict: 'OK', apiLevel: 1 } });

    expect(fine).not.toContain('data-locked');
    expect(fine).not.toContain('disabled');
  });

  test('every language answers the refusal codes and the lock texts', () => {
    for (const locale of ['en-US', 'tr', 'ru']) {
      const lang = readLang(locale);
      const flat = JSON.stringify(lang);

      for (const key of ['PLUGIN_API_LEVEL_UNSUPPORTED', 'THEME_API_LEVEL_UNSUPPORTED']) {
        expect(flat).toContain(`"${key}"`);
      }

      expect(lang.components['compatibility-card'].locked).toContain('{level}');
      expect(lang.components['compatibility-card']['locked-theme']).toContain('{level}');
    }
  });
});

describe('a plugin held back by a refused required plugin', () => {
  const heldBy = { pluginId: 'market', name: 'Market', verdict: 'TOO_OLD', via: 'market' };
  const held = { id: 'pay', status: 'DISABLED', verdict: 'OK', apiLevel: 1, heldBy };
  const translate = (key, options) => key + JSON.stringify(options?.values ?? {});

  test('the reason names the plugin to update, and is empty for everything else', () => {
    expect(heldReason(held, translate)).toBe('components.compatibility-card.held{"name":"Market"}');
    expect(lockedReason(held, translate)).toBe(heldReason(held, translate));
    expect(heldReason({ verdict: 'OK', heldBy: null }, translate)).toBe('');
    expect(isLocked(held)).toBe(true);
    expect(isLocked({ verdict: 'OK' })).toBe(false);
    expect(normalizeHeldBy({ pluginId: 'm' })).toEqual({
      pluginId: 'm',
      name: 'm',
      verdict: '',
      via: 'm',
    });
    expect(normalizeHeldBy(null)).toBeNull();
  });

  test('the switch is disabled with the reason as its title', () => {
    const html = renderHtml(AddonToggle, { plugin: held });

    expect(html).toContain('data-locked');
    expect(html).toContain('disabled');
    expect(html).toContain('Needs Market, which is not compatible with this Pano: update Market.');
  });

  test('a started plugin with a heldBy stays switchable off', () => {
    expect(renderHtml(AddonToggle, { plugin: { ...held, status: 'STARTED' } })).not.toContain(
      'data-locked',
    );
  });

  test('the list icon and the detail line say why', () => {
    const icon = renderHtml(AddonProblemIcon, { plugin: held });

    expect(icon).toContain('data-compat-problem="danger"');
    expect(icon).toContain('Needs Market, which is not compatible with this Pano: update Market.');

    const detail = renderHtml(AddonDetail, {
      data: { addon: { ...held, dependencies: [], requires: '', hash: 'x', size: 1 } },
    });

    expect(textOf(detail)).toContain('update Market');
  });

  test('the retry-free counts: the held plugin counts for the sidebar', () => {
    const report = normalizeCompatibility({
      resources: [
        { id: 'market', type: 'PLUGIN', title: 'Market', verdict: 'TOO_OLD', apiLevel: 0 },
        { id: 'pay', type: 'PLUGIN', title: 'Pay', verdict: 'OK', apiLevel: 1, heldBy },
      ],
    });

    expect(attentionCounts(report)).toEqual({ addons: 2, themes: 0 });
  });

  test('every language has the held texts', () => {
    for (const locale of ['en-US', 'tr', 'ru']) {
      const card = readLang(locale).components['compatibility-card'];

      expect(card.held).toContain('{name}');
      expect(card['held-short']).toContain('{name}');
    }
  });
});

describe('lang files', () => {
  const COMPONENT_DIRS = [
    join(import.meta.dir),
    join(import.meta.dir, '..'),
    join(import.meta.dir, '../../../components'),
  ];

  /** Every literal `$_('key')` of the files this unit wrote. */
  function usedKeys() {
    const files = [
      ...readdirSync(COMPONENT_DIRS[0])
        .filter((name) => name.endsWith('.svelte'))
        .map((n) => join(COMPONENT_DIRS[0], n)),
      join(COMPONENT_DIRS[1], 'AddonApiLevel.svelte'),
      join(COMPONENT_DIRS[2], 'CompatProblemIcon.svelte'),
    ];
    const keys = new Set();

    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\$_\(\s*'([a-z0-9.-]+)'/g)) {
        keys.add(match[1]);
      }
    }

    return [...keys];
  }

  const lookup = (messages, key) => key.split('.').reduce((node, part) => node?.[part], messages);

  test.each(['en-US', 'tr', 'ru'])('%s has every key the components ask for', (locale) => {
    const messages = readLang(locale);

    for (const key of usedKeys()) {
      expect(typeof lookup(messages, key)).toBe('string');
    }

    // Keys built at run time: the verdicts, the types, the agent types.
    for (const verdict of ['OK', 'TOO_OLD', 'TOO_NEW', 'UNKNOWN']) {
      expect(typeof lookup(messages, verdictKey(verdict))).toBe('string');
    }

    // The problem texts and the plan tooltip lines are picked at run time.
    for (const name of ['too-old', 'too-new', 'too-old-plain', 'too-new-plain', 'urls']) {
      expect(typeof lookup(messages, `components.compatibility-card.problem.${name}`)).toBe(
        'string',
      );
    }

    for (const name of ['unknown', 'disable', 'update', 'agents', 'store-down']) {
      expect(typeof lookup(messages, `pages.settings.updates.plan.tip.${name}`)).toBe('string');
    }

    for (const name of ['addons', 'themes']) {
      expect(typeof lookup(messages, `components.site-navigation-menu.attention.${name}`)).toBe(
        'string',
      );
    }

    expect(typeof lookup(messages, 'components.modals.confirm-update-platform.plan-failed')).toBe(
      'string',
    );

    expect(typeof messages.buttons.retry).toBe('string');
  });

  test('tr and ru carry the same keys and the same placeholders as en-US', () => {
    const en = readLang('en-US');

    const flatten = (node, prefix = '') =>
      Object.entries(node).flatMap(([key, value]) =>
        typeof value === 'object'
          ? flatten(value, `${prefix}${key}.`)
          : [[`${prefix}${key}`, value]],
      );
    const names = (text) => [...text.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]).sort();

    for (const locale of ['tr', 'ru']) {
      const other = readLang(locale);

      for (const root of ['components.compatibility-card', 'pages.settings.updates.plan']) {
        for (const [key, value] of flatten(lookup(en, root), `${root}.`)) {
          const translated = lookup(other, key);

          expect(typeof translated).toBe('string');
          expect(names(translated)).toEqual(names(value));
        }
      }
    }
  });
});
