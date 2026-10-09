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
  canUpdate,
  cardSections,
  createCompatibilityController,
  createPlanController,
  normalizeCompatibility,
  normalizePlan,
  planCounts,
  planNeedsAttention,
  resourceNote,
  retryable,
  safeDownloadPath,
  lockedReason,
  heldReason,
  isLocked,
  normalizeHeldBy,
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

const { default: CompatibilityCard } = await import('$lib/components/CompatibilityCard.svelte');
const { default: UpdatePlan } = await import('./UpdatePlan.svelte');
const { default: AgentJarList } = await import('./AgentJarList.svelte');
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

describe('cardSections', () => {
  test('counts every part and says visible', () => {
    const sections = cardSections(normalizeCompatibility(REPORT), OUTDATED_THEME);

    expect(sections.plugins).toHaveLength(1);
    expect(sections.themes).toHaveLength(1);
    // The jars to place by hand belong to their servers and nodes, not to this card.
    expect(sections.agents).toBeUndefined();
    expect(sections.externalUrls).toHaveLength(1);
    // The namespace clash is a plugin matter, not a view that shows the default look.
    expect(sections.themeViews).toEqual({ theme: OUTDATED_THEME.theme, count: 2 });
    expect(sections.count).toBe(1 + 1 + 1 + 1);
    expect(sections.visible).toBe(true);
  });

  test('nothing to say hides the card', () => {
    expect(cardSections(normalizeCompatibility({ resources: [], agents: [] }), null).visible).toBe(
      false,
    );
    expect(cardSections(null, null).visible).toBe(false);
    expect(cardSections(normalizeCompatibility({}), { status: 'OK', issues: [] }).visible).toBe(
      false,
    );
    expect(
      cardSections(normalizeCompatibility({}), { status: 'UNKNOWN', issues: [] }).visible,
    ).toBe(false);
  });

  test('a row that says OK is not an issue', () => {
    const report = normalizeCompatibility({
      resources: [{ id: 'a', type: 'PLUGIN', verdict: 'OK' }],
    });

    expect(cardSections(report).visible).toBe(false);
  });

  test('retryable only while something is refused', () => {
    expect(retryable(normalizeCompatibility(REPORT))).toBe(true);
    expect(retryable(normalizeCompatibility({ agents: REPORT.agents }))).toBe(false);
  });

  test('resourceNote says what the last reconcile learned', () => {
    const [market, blaze] = normalizeCompatibility(REPORT).resources;

    expect(resourceNote(market).key).toBe('components.compatibility-card.note.update-found');
    expect(resourceNote(blaze).key).toBe('components.compatibility-card.note.error');
    expect(resourceNote({ ...market, hasCompatibleUpdate: false }).key).toBe(
      'components.compatibility-card.note.no-update',
    );
    expect(verdictKey('SOMETHING_NEW')).toBe('components.compatibility-card.verdict.UNKNOWN');
  });
});

describe('the api', () => {
  test('asks the paths of doc 04 section 7', async () => {
    const client = stubClient({
      'GET /panel/compatibility': REPORT,
      'POST /panel/compatibility/reconcile': REPORT,
      'GET /panel/updates/platform/plan': PLAN,
    });
    const api = createCompatibilityApi(client);

    expect((await api.getCompatibility()).ok).toBe(true);
    expect((await api.reconcile()).ok).toBe(true);
    expect((await api.getPlan()).ok).toBe(true);
    expect(client.calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /panel/compatibility',
      'POST /panel/compatibility/reconcile',
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

describe('the Retry controller', () => {
  const recorder = () => {
    const toasts = [];

    return {
      toasts,
      notify: {
        success: (key, values) => toasts.push(['success', key, values]),
        error: (key, values) => toasts.push(['error', key, values]),
      },
    };
  };

  test('takes the refreshed report from the answer of the call', async () => {
    const { toasts, notify } = recorder();
    const calls = [];
    const clean = { ...REPORT, resources: [], agents: [], externalUrls: [] };
    const controller = createCompatibilityController({
      api: {
        reconcile: async () => {
          calls.push('reconcile');

          return { ok: true, body: clean, error: null };
        },
      },
      report: normalizeCompatibility(REPORT),
      notify,
    });

    await controller.retry();

    expect(calls).toEqual(['reconcile']);
    expect(controller.state.report.resources).toEqual([]);
    expect(controller.state.retrying).toBe(false);
    expect(toasts).toEqual([['success', 'components.compatibility-card.retry-done', undefined]]);
  });

  test('says how many are still off when the store had nothing', async () => {
    const { toasts, notify } = recorder();
    const controller = createCompatibilityController({
      api: { reconcile: async () => ({ ok: true, body: REPORT, error: null }) },
      report: null,
      notify,
    });

    await controller.retry();

    expect(toasts).toEqual([['error', 'components.compatibility-card.retry-still', { count: 2 }]]);
    expect(controller.state.report.resources).toHaveLength(2);
  });

  test('a failed call keeps the old report and says so', async () => {
    const { toasts, notify } = recorder();
    const before = normalizeCompatibility(REPORT);
    const controller = createCompatibilityController({
      api: { reconcile: async () => ({ ok: false, body: null, error: { code: 'NO_PERMISSION' } }) },
      report: before,
      notify,
    });

    await controller.retry();

    expect(controller.state.report).toBe(before);
    expect(controller.state.failed).toBe(true);
    expect(toasts).toEqual([
      ['error', 'components.compatibility-card.retry-failed', { code: 'NO_PERMISSION' }],
    ]);
  });

  test('a second press while one runs does not start another call', async () => {
    let calls = 0;
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    const controller = createCompatibilityController({
      api: {
        reconcile: async () => {
          calls++;
          await gate;

          return { ok: true, body: REPORT, error: null };
        },
      },
      report: null,
    });

    const first = controller.retry();
    const second = controller.retry();

    expect(controller.state.retrying).toBe(true);

    release();
    await Promise.all([first, second]);

    expect(calls).toBe(1);
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
    expect(canUpdate({ status: 'failed', acknowledged: false })).toBe(false);
    expect(canUpdate({ status: 'failed', acknowledged: true })).toBe(true);
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

  test('any other failure keeps the button off until the admin says so', async () => {
    const controller = createPlanController({
      api: { getPlan: async () => ({ ok: false, body: null, error: { code: 'NETWORK_ERROR' } }) },
    });

    await controller.load();

    expect(controller.state.status).toBe('failed');
    expect(controller.state.errorCode).toBe('NETWORK_ERROR');
    expect(controller.canUpdate).toBe(false);

    controller.acknowledge(true);
    expect(controller.canUpdate).toBe(true);

    controller.acknowledge(false);
    expect(controller.canUpdate).toBe(false);
  });

  test('a body that is not a plan is a failure', async () => {
    const controller = createPlanController({
      api: { getPlan: async () => ({ ok: true, body: { error: 'x' }, error: null }) },
    });

    await controller.load();

    expect(controller.state.status).toBe('failed');
  });

  test('a retry drops the acknowledgement and the older answer', async () => {
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

describe('CompatibilityCard', () => {
  const render = (props) => renderHtml(CompatibilityCard, props);

  test('renders nothing while everything is compatible', () => {
    expect(render({ report: normalizeCompatibility({}), theme: null })).not.toContain(
      'data-compat-card',
    );
    expect(render({ report: null, theme: null })).not.toContain('data-compat-card');
  });

  test('says loudly what is off and offers Retry', () => {
    const html = render({ report: normalizeCompatibility(REPORT) });
    const text = textOf(html);

    expect(html).toContain('data-compat-refused');
    expect(text).toContain('2 Addons And Themes Are Switched Off');
    expect(text).toContain('API level 1 to 2');
    expect(text).toContain('press Retry');
    expect(html).toContain('data-compat-retry');
    expect(text).toContain('Retry');
    // Every row: name, type, version, level, verdict and what the last attempt learned.
    expect(text).toContain('Market');
    expect(text).toContain('v1.0.0-dev.18');
    expect(text).toContain('Too Old');
    expect(text).toContain('No API level');
    expect(text).toContain('A compatible version was found in the store');
    expect(text).toContain('The last attempt failed: DOWNLOAD_FAILED');
    // A refused theme means the site shows Vanilla, and that is said.
    expect(text).toContain('Your site shows the bundled Vanilla theme');
    // The store was not reached in the last run.
    expect(html).toContain('data-compat-store-down');
    expect(html).toContain('href="/addons/detail/pano-plugin-market"');
    expect(html).toContain('href="/view/detail/blaze-theme"');
  });

  test('the jars to place by hand are not announced on the card any more', () => {
    const html = render({ report: normalizeCompatibility(REPORT) });

    expect(html).not.toContain('data-compat-agent-alert');
    expect(html).not.toContain('data-compat-agents');
    expect(textOf(html)).not.toContain('Need A New Jar By Hand');
  });

  test('only agents affected renders nothing, not an empty card', () => {
    const html = render({
      report: normalizeCompatibility({ resources: [], externalUrls: [], agents: REPORT.agents }),
    });

    expect(html).not.toContain('data-compat-card');
    expect(textOf(html)).toBe('');
  });

  test('lists the changed addresses with a copy button', () => {
    const html = render({ report: normalizeCompatibility(REPORT) });
    const text = textOf(html);

    expect(html).toContain('data-compat-urls');
    expect(text).toContain('Microsoft redirect URL');
    expect(text).toContain('https://example.com/api/plugins/pano-plugin-premium-login/callback');
    expect(html).toContain('data-compat-copy');
    expect(text).toContain('paste it into the other service');
  });

  test('shows the theme whose views fall back, from the theme report', () => {
    const html = render({ report: normalizeCompatibility({}), theme: OUTDATED_THEME });

    expect(html).toContain('data-compat-card');
    expect(html).toContain('data-compat-alert');
    expect(textOf(html)).toContain('2 views of blaze-theme show');
    expect(html).toContain('href="/view/detail/blaze-theme"');
    // Nothing else shows when only the theme has something to say.
    expect(html).not.toContain('data-compat-refused');
    expect(html).not.toContain('data-compat-agent-alert');
  });

  test('uses the alert structure of the panel design guide', () => {
    const html = render({ report: normalizeCompatibility(REPORT), theme: OUTDATED_THEME });

    // Titles are h5.alert-heading, actions are alert-btn / alert-link; no other button variant.
    expect(html).toContain('class="alert-heading mb-2"');
    expect(html).not.toMatch(/btn-(primary|secondary|warning|danger|outline)/);
    expect(html).not.toContain('<h6');
  });
});

describe('UpdatePlan', () => {
  const render = (state) => renderHtml(UpdatePlan, { state });
  const ready = (plan) => ({ status: 'ready', plan: normalizePlan(plan), acknowledged: false });

  test('says it is checking while the plan loads', () => {
    const html = render({ status: 'loading', plan: null, acknowledged: false });

    expect(html).toContain('data-plan-loading');
    expect(textOf(html)).toContain('up to 20 seconds');
  });

  test('says what will be switched off, what is updated, and what stays', () => {
    const html = render(ready(PLAN));
    const text = textOf(html);

    expect(html).toContain('data-plan-ready');
    expect(text).toContain('Read This Before You Update');
    expect(text).toContain('Pano v2.0.0 runs addons and themes built for API level 2 to 3');
    expect(html).toContain('data-plan-disable');
    expect(text).toContain('1 Addon Or Theme Will Be Switched Off');
    expect(text).toContain('you have to install it by hand');
    expect(text).toContain('pano-plugin-old');
    expect(html).toContain('data-plan-update');
    expect(text).toContain('1 Addon Or Theme Will Be Updated After The Restart');
    expect(text).toContain('pano-plugin-market');
    expect(html).toContain('data-plan-compatible');
    expect(text).toContain('1 addon or theme keeps running as it is.');
  });

  test('an update that touches nothing is a green notice', () => {
    const html = render(
      ready({
        ...PLAN,
        resources: [{ id: 'a', type: 'PLUGIN', installedVersion: '1', verdict: 'COMPATIBLE' }],
      }),
    );

    expect(html).toContain('alert-success');
    expect(textOf(html)).toContain('This Update Fits Your Addons And Themes');
    expect(html).not.toContain('data-plan-disable');
  });

  test('an unknown target says it cannot tell', () => {
    const html = render(
      ready({
        target: { version: 'v2.0.0', apiLevel: null, minApiLevel: null },
        resources: [{ id: 'a', type: 'PLUGIN', installedVersion: '1', verdict: 'COMPATIBLE' }],
      }),
    );

    expect(html).toContain('data-plan-unknown');
    expect(textOf(html)).toContain('does not say which API level it needs');
    expect(html).toContain('alert-warning');
  });

  test('game servers that need a jar are part of the plan', () => {
    const html = render(ready({ ...PLAN, resources: [], agents: REPORT.agents }));

    expect(html).toContain('data-plan-agents');
    expect(html).toContain('href="/api/v1/panel/servers/3/pano-plugin/jar"');
    expect(textOf(html)).toContain('put the new jar in place of the old one');
  });

  test('an unreachable store is said and offers a retry', () => {
    const html = render(ready({ ...PLAN, storeReachable: false }));

    expect(html).toContain('data-plan-store-down');
    expect(html).toContain('data-plan-retry');
  });

  test('a failed plan offers a retry and the explicit way around it', () => {
    const html = render({ status: 'failed', plan: null, acknowledged: false });
    const text = textOf(html);

    expect(html).toContain('data-plan-failed');
    expect(text).toContain('The Update Plan Could Not Be Read');
    expect(text).toContain('Update without the plan');
    expect(html).toContain('data-plan-retry');
    expect(html).not.toContain('checked');
    expect(render({ status: 'failed', plan: null, acknowledged: true })).toContain('checked');
  });

  test('draws nothing when the platform has no plan or no update', () => {
    expect(textOf(render({ status: 'unavailable', plan: null, acknowledged: false }))).toBe('');
    expect(textOf(render(ready({ target: null, resources: [], agents: [] })))).toBe('');
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

  test('on a card the level is hidden and a refusal still shows', () => {
    expect(
      renderHtml(AddonApiLevel, { plugin: { apiLevel: 2, verdict: 'OK' }, refusedOnly: true }),
    ).not.toContain('data-api-level');

    const html = renderHtml(AddonApiLevel, {
      plugin: { apiLevel: 0, verdict: 'TOO_OLD' },
      refusedOnly: true,
    });

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

  test('the list badge and the detail line say why', () => {
    const badge = renderHtml(AddonApiLevel, { plugin: held, refusedOnly: true });

    expect(badge).toContain('data-held-by="market"');
    expect(textOf(badge)).toContain('Waiting for Market');

    const detail = renderHtml(AddonDetail, {
      data: { addon: { ...held, dependencies: [], requires: '', hash: 'x', size: 1 } },
    });

    expect(textOf(detail)).toContain('update Market');
  });

  test('the compatibility card counts and lists it, the retry counts it as still locked', () => {
    const report = normalizeCompatibility({
      resources: [
        { id: 'market', type: 'PLUGIN', title: 'Market', verdict: 'TOO_OLD', apiLevel: 0 },
        { id: 'pay', type: 'PLUGIN', title: 'Pay', verdict: 'OK', apiLevel: 1, heldBy },
      ],
    });

    const sections = cardSections(report);

    expect(sections.plugins.map((row) => row.id)).toEqual(['market', 'pay']);
    expect(sections.count).toBe(2);
    expect(resourceNote(report.resources[1]).key).toBe('components.compatibility-card.held');

    const html = renderHtml(CompatibilityCard, { report: { ...report, agents: [] } });

    expect(html).toContain('data-held-by="market"');
  });

  test('every language has the held texts', () => {
    for (const locale of ['en-US', 'tr', 'ru']) {
      const card = readLang(locale).components['compatibility-card'];

      expect(card.held).toContain('{name}');
      expect(card['held-short']).toContain('{name}');
    }
  });
});

describe('AgentJarList', () => {
  test('one line per agent', () => {
    const html = renderHtml(AgentJarList, { agents: normalizeCompatibility(REPORT).agents });

    expect((html.match(/<li>/g) ?? []).length).toBe(2);
    expect(textOf(html)).toContain('Game server');
    expect(textOf(html)).toContain('Download Jar');
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
      join(COMPONENT_DIRS[2], 'CompatibilityCard.svelte'),
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

    for (const type of ['PLUGIN', 'THEME']) {
      expect(typeof lookup(messages, `components.compatibility-card.type.${type}`)).toBe('string');
    }

    for (const type of ['SERVER', 'NODE', 'AGENT']) {
      expect(typeof lookup(messages, `components.compatibility-card.agent-type.${type}`)).toBe(
        'string',
      );
    }

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
