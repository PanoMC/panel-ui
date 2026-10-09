import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { writable } from 'svelte/store';

import {
  autoConfirm,
  recordingNotify,
  renderHtml,
  stubClient,
  textOf,
  useLocale,
  readLang,
} from '../../view/frontend/testkit.js';
import { createDeliveriesController } from './deliveries.controller.js';
import { createEndpointsController } from './endpoints.controller.js';
import { createWebhooksApi } from './webhooks.api.js';
import { MASK } from './webhooks.util.js';

// The page imports the panel's own HTTP client, toasts, confirm dialog and the date component's
// language and tooltip; none of them is under test here, so they are stand-ins.
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
mock.module('$lib/tooltip.util', () => ({ default: () => ({}) }));
mock.module('$lib/language.util.js', () => ({
  currentLanguage: writable({ dateFnsCode: 'enUS' }),
}));

const { default: Webhooks } = await import('./Webhooks.svelte');
const { default: WebhookEndpoints } = await import('./WebhookEndpoints.svelte');
const { default: WebhookDeliveries } = await import('./WebhookDeliveries.svelte');
const { default: WebhookDeliveryModal } = await import('./WebhookDeliveryModal.svelte');
const { default: WebhookModal } = await import('./WebhookModal.svelte');
const { default: WebhookSecretReveal } = await import('./WebhookSecretReveal.svelte');
const { default: WebhookEvents } = await import('./WebhookEvents.svelte');
const { blankForm, normalizeCatalogue } = await import('./webhooks.util.js');

beforeAll(() => useLocale('en-US'));

const ENDPOINTS = {
  items: [
    {
      id: 4,
      name: 'Ops channel',
      url: 'https://example.com/ops-hook',
      events: ['*'],
      format: 'JSON',
      signing: 'HMAC_SHA256',
      secret: MASK,
      headers: {},
      template: null,
      enabled: true,
      maxAttempts: 8,
      lastStatusCode: 200,
      lastDeliveryAt: 1700000000000,
      disabledReason: null,
    },
    {
      id: 5,
      name: 'Discord news',
      url: 'https://discord.com/api/webhooks/1/abc',
      events: ['core.post.published', 'market.*'],
      format: 'DISCORD',
      signing: 'NONE',
      secret: null,
      headers: {},
      template: null,
      enabled: false,
      maxAttempts: 8,
      lastStatusCode: null,
      lastDeliveryAt: null,
      disabledReason: 'FAILURES',
    },
  ],
  limit: 50,
};

const EVENTS = {
  items: [
    {
      source: 'core',
      title: 'Pano',
      events: [
        { name: 'core.user.registered', subscribable: true, sample: {} },
        { name: 'core.post.published', subscribable: true, sample: {} },
      ],
    },
    {
      source: 'market',
      title: 'Market',
      events: [{ name: 'market.order.paid', subscribable: true, sample: {} }],
    },
  ],
};

const DELIVERIES = {
  items: [
    {
      id: 31,
      endpointId: 4,
      source: 'market',
      event: 'market.order.paid',
      subjectRef: 'order:12',
      status: 'FAILED',
      attempts: 3,
      maxAttempts: 8,
      lastStatusCode: 500,
      durationMs: 120,
      createdAt: 1700000000000,
    },
    {
      id: 32,
      endpointId: 0,
      source: 'core',
      event: 'core.user.registered',
      subjectRef: null,
      status: 'SENDING',
      attempts: 1,
      maxAttempts: 8,
      lastStatusCode: null,
      durationMs: null,
      createdAt: 1700000100000,
    },
  ],
  page: { number: 1, size: 25, totalItems: 2, totalPages: 1 },
};

const notify = () => recordingNotify();
const confirm = () => autoConfirm().confirm;

function endpointsController(answers = {}, initial = {}) {
  return createEndpointsController({
    api: createWebhooksApi(stubClient(answers)),
    notify: notify(),
    confirm: confirm(),
    initial: { endpoints: ENDPOINTS, events: EVENTS, ...initial },
  });
}

function deliveriesController(answers = {}, options = {}) {
  const endpoints = endpointsController();

  return createDeliveriesController({
    api: createWebhooksApi(stubClient(answers)),
    notify: notify(),
    confirm: confirm(),
    initial: DELIVERIES,
    catalogue: endpoints.catalogue,
    names: writable({ 4: 'Ops channel' }),
    ...options,
  });
}

describe('the page', () => {
  const data = (patch = {}) => ({
    endpoints: ENDPOINTS,
    events: EVENTS,
    deliveries: DELIVERIES,
    filters: { source: '', status: '', endpointId: null },
    tab: 'endpoints',
    ...patch,
  });
  const render = (patch) =>
    renderHtml(Webhooks, {
      data: data(patch),
      api: createWebhooksApi(stubClient()),
      notify: notify(),
      confirm: confirm(),
    });

  test('shows both tabs with the endpoints pane first and the deliveries pane hidden', () => {
    const html = render();

    expect(html).toContain('data-tab="endpoints"');
    expect(html).toContain('data-tab="deliveries"');
    expect(html).toMatch(/id="webhooks-pane-endpoints"[^>]*role="tabpanel"[^>]*>/);
    expect(html).not.toMatch(/id="webhooks-pane-endpoints"[^>]*hidden/);
    expect(html).toMatch(/id="webhooks-pane-deliveries"[^>]*hidden/);
    expect(textOf(html)).toContain('Ops channel');
    expect(textOf(html)).toContain('market.order.paid');
  });

  test('opens on the deliveries tab for ?endpointId= or ?tab=deliveries', () => {
    const html = render({ tab: 'deliveries' });

    expect(html).toMatch(/id="webhooks-pane-endpoints"[^>]*hidden/);
    expect(html).not.toMatch(/id="webhooks-pane-deliveries"[^>]*hidden/);
  });

  test('a failed endpoints read says so and still shows the deliveries tab', () => {
    const html = render({ endpoints: null });

    expect(html).toContain('data-load-failed');
    expect(textOf(html)).toContain('Webhooks could not be loaded.');
    expect(html).toContain('data-delivery-row="31"');
  });
});

describe('Endpoints tab', () => {
  const render = (controller = endpointsController()) =>
    renderHtml(WebhookEndpoints, { controller, notify: notify() });

  test('lists endpoints with format, events, status and last delivery', () => {
    const html = render();
    const text = textOf(html);

    expect(html).toContain('data-endpoint-row="4"');
    expect(html).toContain('data-endpoint-row="5"');
    expect(text).toContain('2/50 Webhooks');
    expect(text).toContain('Ops channel');
    expect(text).toContain('All');
    expect(text).toContain('Discord');
    expect(text).toContain('Disabled');
    expect(text).toContain('Stopped after failures');
    expect(html).toContain('data-auto-disabled');
    expect(text).toContain('200');
  });

  test('the secret is never in the table', () => {
    expect(render()).not.toContain('whsec_');
  });

  test('menu per row: edit, test, deliveries, delete; the new secret only for signed endpoints', () => {
    const html = render();
    const first = html.slice(
      html.indexOf('data-endpoint-row="4"'),
      html.indexOf('data-endpoint-row="5"'),
    );
    const second = html.slice(html.indexOf('data-endpoint-row="5"'));

    for (const action of ['edit', 'test', 'deliveries', 'toggle', 'delete']) {
      expect(first).toContain(`data-action="${action}"`);
      expect(second).toContain(`data-action="${action}"`);
    }

    expect(first).toContain('data-action="regenerate"');
    expect(second).not.toContain('data-action="regenerate"');
    expect(first).toContain('Send Test');
    expect(second).toContain('Enable');
    expect(first).toContain('Disable');
  });

  test('the delete item is the danger item and comes last', () => {
    const html = render();
    const menu = html.slice(
      html.indexOf('data-endpoint-row="4"'),
      html.indexOf('data-endpoint-row="5"'),
    );

    expect(menu.lastIndexOf('data-action="delete"')).toBeGreaterThan(
      menu.lastIndexOf('data-action="toggle"'),
    );
    expect(menu).toMatch(/dropdown-item link-danger"[^>]*data-action="delete"/);
  });

  test('the create button is disabled at the limit; no data shows only NoContent', () => {
    const full = endpointsController({}, { endpoints: { items: ENDPOINTS.items, limit: 2 } });

    expect(textOf(render(full))).toContain('2/2 Webhooks');
    expect(render(full)).toMatch(/<button[^>]*disabled[^>]*data-create-endpoint/);

    const empty = endpointsController({}, { endpoints: { items: [], limit: 50 } });
    const html = render(empty);

    expect(html).not.toContain('<table');
    expect(textOf(html)).toContain('No webhooks yet.');
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*data-create-endpoint/);
  });

  test('the source filter narrows the rows to endpoints that subscribe to that source', () => {
    const only = { items: [ENDPOINTS.items[1]], limit: 50 };
    const rows = (source) =>
      renderHtml(WebhookEndpoints, {
        controller: endpointsController({}, { endpoints: only, source }),
      });

    // Endpoint 5 listens to core.post.published and market.*.
    expect(rows('market')).toContain('data-endpoint-row="5"');
    expect(rows('core')).toContain('data-endpoint-row="5"');
    expect(rows('shop')).not.toContain('data-endpoint-row');
    expect(rows('shop')).toContain('data-source-filter');

    // Endpoint 4 listens to everything, so every source includes it.
    expect(render(endpointsController({}, { source: 'shop' }))).toContain('data-endpoint-row="4"');
  });
});

describe('endpoint dialog', () => {
  const render = (controller = endpointsController()) =>
    renderHtml(WebhookModal, { controller, notify: notify() });

  test('the form has the fields of doc 06 and one full-width submit button', () => {
    const html = render();
    const text = textOf(html);

    expect(html).toContain('data-field="name"');
    expect(html).toContain('data-field="url"');
    expect(html).toContain('data-field="maxAttempts"');
    expect(html).toContain('data-add-header');
    expect(text).toContain('Create a webhook');
    expect(text).toContain('All events');
    expect(text).toContain('HMAC SHA-256');
    expect(html).toMatch(/<button class="btn btn-primary w-100" type="submit"/);
    // Form modals have no Cancel button (design/modals-form.md).
    expect(html).not.toContain('buttons.cancel');
    expect(text).not.toContain('Cancel');
    // No secret input: the secret is made by the server and shown once.
    expect(html).not.toMatch(/placeholder="[^"]*[Ss]ecret/);
  });

  test('the secret panel shows the value read-only with a copy button and a hint that it is shown once', () => {
    const html = renderHtml(WebhookSecretReveal, { secret: 'whsec_test_123', notify: notify() });

    expect(html).toContain('data-secret-value');
    expect(html).toContain('value="whsec_test_123"');
    expect(html).toContain('readonly');
    expect(html).toContain('fa-copy');
    expect(textOf(html)).toContain('cannot show it again');
    expect(readLang('en-US').pages.webhooks.secret.title).toContain('only once');
  });

  test('the event picker lists sources and their events once All events is off', () => {
    const catalogue = normalizeCatalogue(EVENTS);
    const form = { ...blankForm(), allEvents: false, events: ['market.*', 'gone.thing'] };
    const html = renderHtml(WebhookEvents, { form, catalogue, initialEvents: ['gone.thing'] });
    const text = textOf(html);

    expect(html).toContain('data-event-source="core"');
    expect(html).toContain('data-event-source="market"');
    expect(text).toContain('Every Market event');
    expect(text).toContain('core.user.registered');
    expect(html).toContain('data-event-unlisted');
    expect(text).toContain('gone.thing');
    // market.* is on: its single events show checked and disabled.
    expect(html).toMatch(/id="webhookEvent-market.order.paid"[^>]*checked/);

    const all = renderHtml(WebhookEvents, { form: blankForm(), catalogue });

    expect(all).not.toContain('data-event-source');
  });
});

describe('Deliveries tab', () => {
  const render = (controller = deliveriesController()) =>
    renderHtml(WebhookDeliveries, { controller });

  test('lists the log with status, attempts, HTTP code, duration and the endpoint name', () => {
    const html = render();
    const text = textOf(html);

    expect(html).toContain('data-delivery-row="31"');
    expect(text).toContain('2 Deliveries');
    expect(text).toContain('Ops channel');
    expect(text).toContain('Direct');
    expect(text).toContain('order:12');
    expect(text).toContain('Failed');
    expect(text).toContain('Sending');
    expect(text).toContain('3/8');
    expect(text).toContain('500');
    expect(text).toContain('120 ms');
  });

  test('has the source and the status filters', () => {
    const html = render();

    expect(html).toContain('data-source-filter');
    expect(html).toContain('data-status-filter');
    expect(html).toContain('<option value="market">Market</option>');
    expect(html).toContain('<option value="DEAD">Dead</option>');
  });

  test('redeliver is offered for a failed row and not for one being sent', () => {
    const html = render();
    const failed = html.slice(
      html.indexOf('data-delivery-row="31"'),
      html.indexOf('data-delivery-row="32"'),
    );
    const sending = html.slice(html.indexOf('data-delivery-row="32"'));

    expect(failed).toContain('data-action="redeliver"');
    expect(failed).toContain('data-action="view"');
    expect(sending).not.toContain('data-action="redeliver"');
    expect(sending).toContain('data-action="view"');
  });

  test('the per-endpoint view names the endpoint and offers the way back', () => {
    const html = render(deliveriesController({}, { filters: { endpointId: 4 } }));

    expect(html).toContain('data-clear-endpoint');
    expect(html).toContain('data-endpoint-name');
  });

  test('an empty log shows only NoContent; a failed read shows the retry alert', () => {
    const empty = render(
      deliveriesController(
        {},
        { initial: { items: [], page: { number: 1, size: 25, totalItems: 0 } } },
      ),
    );

    expect(empty).not.toContain('<table');
    expect(textOf(empty)).toContain('No deliveries yet.');

    const controller = deliveriesController({}, { initial: null });

    controller.failed.set(true);
    expect(render(controller)).toContain('data-load-failed');
  });

  test('a second page shows the pager in the card footer', () => {
    const html = render(
      deliveriesController(
        {},
        {
          initial: { ...DELIVERIES, page: { number: 1, size: 25, totalItems: 60, totalPages: 3 } },
        },
      ),
    );

    expect(html).toContain('card-footer');
    expect(html).toContain('pagination');
  });
});

describe('delivery detail', () => {
  test('shows the stored body and the last response as text', () => {
    const controller = deliveriesController();

    controller.detail.set({
      ...DELIVERIES.items[0],
      url: 'https://example.com/ops-hook',
      lastError: 'HTTP 500',
      body: '{"event":"market.order.paid","data":{"id":12}}',
      lastResponse: 'Internal error <script>',
    });

    const html = renderHtml(WebhookDeliveryModal, { controller });

    expect(html).toContain('data-delivery-detail');
    expect(textOf(html)).toContain('https://example.com/ops-hook');
    expect(textOf(html)).toContain('HTTP 500');
    expect(html).toMatch(/data-delivery-body="">\{\n {2}"event": "market.order.paid"/);
    // The response is text, never markup.
    expect(html).toContain('Internal error &lt;script>');
    expect(html).not.toContain('<script>');
  });

  test('nothing is rendered before a delivery is opened', () => {
    const html = renderHtml(WebhookDeliveryModal, { controller: deliveriesController() });

    expect(html).not.toContain('data-delivery-detail');
  });
});

describe('lang files', () => {
  const flat = (object, prefix = '') =>
    Object.entries(object).flatMap(([key, value]) =>
      value && typeof value === 'object' ? flat(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    );

  test('en-US, tr and ru have the same pages.webhooks keys and the settings tab', () => {
    const reference = flat(readLang('en-US').pages.webhooks).sort();

    expect(reference.length).toBeGreaterThan(100);

    for (const locale of ['tr', 'ru']) {
      const lang = readLang(locale);

      expect(flat(lang.pages.webhooks).sort()).toEqual(reference);
      expect(typeof lang.components['settings-layout'].webhooks).toBe('string');
    }
  });
});
