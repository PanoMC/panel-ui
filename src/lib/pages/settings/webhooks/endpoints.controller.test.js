import { describe, expect, test } from 'bun:test';
import { get } from 'svelte/store';

import { autoConfirm, recordingNotify, stubClient } from '../../view/frontend/testkit.js';
import { createEndpointsController } from './endpoints.controller.js';
import { createWebhooksApi } from './webhooks.api.js';
import { MASK, blankForm } from './webhooks.util.js';

const ENDPOINT = {
  id: 4,
  name: 'Ops',
  url: 'https://example.com/ops',
  events: ['core.user.registered'],
  format: 'JSON',
  signing: 'HMAC_SHA256',
  secret: MASK,
  headers: {},
  template: null,
  enabled: true,
  maxAttempts: 8,
  lastStatusCode: 200,
  lastDeliveryAt: 1700000000000,
};

const LIST = { items: [ENDPOINT], limit: 50 };
const EVENTS = {
  items: [
    {
      source: 'core',
      title: 'Pano',
      events: [{ name: 'core.user.registered', subscribable: true, sample: { id: 1 } }],
    },
  ],
};
const error = (code, extra = {}) => ({ error: { code, details: {}, fields: {}, ...extra } });

function setup(answers = {}, initial = { endpoints: LIST, events: EVENTS }) {
  const client = stubClient({
    'GET /panel/webhooks': LIST,
    'GET /panel/webhooks/events': EVENTS,
    ...answers,
  });
  const notify = recordingNotify();
  const { confirm, dialogs } = autoConfirm();
  const controller = createEndpointsController({
    api: createWebhooksApi(client),
    notify,
    confirm,
    initial,
  });

  return { client, notify, dialogs, controller };
}

const form = (patch = {}) => ({
  ...blankForm(),
  name: 'Ops',
  url: 'https://example.com/ops',
  ...patch,
});
const callsOf = (client, method, path) =>
  client.calls.filter((call) => call.method === method && call.path === path);

describe('GET /panel/webhooks and /events', () => {
  test('starts from the first answer and reads the catalogue', () => {
    const { controller } = setup();

    expect(get(controller.items)).toEqual([ENDPOINT]);
    expect(get(controller.limit)).toBe(50);
    expect(get(controller.catalogue).map((group) => group.source)).toEqual(['core']);
  });

  test('refresh reads both lists again', async () => {
    const { controller, client } = setup(
      { 'GET /panel/webhooks': { items: [], limit: 3 } },
      { endpoints: LIST },
    );

    expect(await controller.refresh()).toBe(true);
    expect(get(controller.items)).toEqual([]);
    expect(get(controller.full)).toBe(false);
    expect(get(controller.limit)).toBe(3);
    expect(callsOf(client, 'GET', '/panel/webhooks/events')).toHaveLength(1);
    expect(get(controller.catalogue)).toHaveLength(1);
  });

  test('a failed list read toasts and keeps what is shown', async () => {
    const { controller, notify } = setup({ 'GET /panel/webhooks': error('NETWORK_ERROR') });

    expect(await controller.refresh()).toBe(false);
    expect(get(controller.items)).toEqual([ENDPOINT]);
    expect(notify.toasts[0]).toMatchObject({
      type: 'error',
      key: 'pages.webhooks.errors.NETWORK_ERROR',
    });
  });

  test('the source filter narrows the visible endpoints', () => {
    const { controller } = setup(undefined, { endpoints: LIST, events: EVENTS, source: 'market' });

    expect(get(controller.visible)).toEqual([]);
    controller.source.set('core');
    expect(get(controller.visible)).toEqual([ENDPOINT]);
  });
});

describe('POST /panel/webhooks', () => {
  test('creates and hands back the secret that was made, once', async () => {
    const { controller, client } = setup({
      'POST /panel/webhooks': { id: 9, secret: 'whsec_abc' },
    });
    const result = await controller.save(form(), null);

    expect(result).toEqual({ ok: true, id: 9, secret: 'whsec_abc' });
    expect(callsOf(client, 'POST', '/panel/webhooks')[0].body).toMatchObject({
      name: 'Ops',
      signing: 'HMAC_SHA256',
      events: ['*'],
    });
    // The list was read again after the save; the secret is nowhere in it.
    expect(callsOf(client, 'GET', '/panel/webhooks')).toHaveLength(1);
    expect(JSON.stringify(get(controller.items))).not.toContain('whsec_abc');
  });

  test('an unsigned endpoint answers without a secret', async () => {
    const { controller } = setup({ 'POST /panel/webhooks': { id: 10 } });

    expect(await controller.save(form({ signing: 'NONE' }), null)).toEqual({
      ok: true,
      id: 10,
      secret: undefined,
    });
  });

  test('a form that fails its checks sends nothing', async () => {
    const { controller, client } = setup();
    const result = await controller.save(form({ name: '' }), null);

    expect(result.ok).toBe(false);
    expect(result.errors.name).toBe('REQUIRED');
    expect(callsOf(client, 'POST', '/panel/webhooks')).toHaveLength(0);
  });

  test('WEBHOOK_URL_REFUSED marks the url field instead of toasting', async () => {
    const { controller, notify } = setup({
      'POST /panel/webhooks': error('WEBHOOK_URL_REFUSED', { fields: { url: 'PRIVATE_ADDRESS' } }),
    });
    const result = await controller.save(form(), null);

    expect(result).toEqual({ ok: false, errors: { url: 'PRIVATE_ADDRESS' } });
    expect(get(controller.serverErrors)).toEqual({ url: 'PRIVATE_ADDRESS' });
    expect(notify.toasts).toEqual([]);
    expect(get(controller.saving)).toBe(false);
  });

  test('WEBHOOK_LIMIT, WEBHOOK_UNKNOWN_EVENT and header errors', async () => {
    const limit = setup({
      'POST /panel/webhooks': error('WEBHOOK_LIMIT', { details: { limit: 50 } }),
    });

    await limit.controller.save(form(), null);
    expect(limit.notify.toasts[0]).toMatchObject({
      key: 'pages.webhooks.errors.WEBHOOK_LIMIT',
      values: { limit: '50' },
    });

    const unknown = setup({
      'POST /panel/webhooks': error('WEBHOOK_UNKNOWN_EVENT', {
        details: { events: ['x.y'] },
        fields: { events: 'UNKNOWN_EVENT' },
      }),
    });

    await unknown.controller.save(form(), null);
    expect(get(unknown.controller.serverErrors)).toEqual({ events: 'UNKNOWN_EVENT' });
    expect(unknown.notify.toasts[0].values).toEqual({ events: 'x.y' });

    const headers = setup({
      'POST /panel/webhooks': error('WEBHOOK_HEADERS_INVALID', {
        fields: { 'headers.X-Bad': 'INVALID_VALUE' },
      }),
    });

    await headers.controller.save(form({ headers: [{ key: 'X-Bad', value: 'v' }] }), null);
    expect(get(headers.controller.serverErrors).headers.byName).toEqual({
      'X-Bad': 'INVALID_VALUE',
    });
  });
});

describe('PUT /panel/webhooks/:id', () => {
  test('edits with the whole body and keeps a masked header', async () => {
    const { controller, client } = setup({ 'PUT /panel/webhooks/4': { id: 4 } });
    const result = await controller.save(
      form({ headers: [{ key: 'Authorization', value: MASK }] }),
      4,
    );

    expect(result.ok).toBe(true);
    expect(callsOf(client, 'PUT', '/panel/webhooks/4')[0].body.headers).toEqual({
      Authorization: MASK,
    });
  });

  test('a signing switch to HMAC answers with a new secret', async () => {
    const { controller } = setup({ 'PUT /panel/webhooks/4': { id: 4, secret: 'whsec_new' } });

    expect((await controller.save(form(), 4)).secret).toBe('whsec_new');
  });

  test('an endpoint deleted meanwhile refreshes the list', async () => {
    const { controller, client } = setup({ 'PUT /panel/webhooks/4': error('WEBHOOK_NOT_FOUND') });

    await controller.save(form(), 4);
    expect(callsOf(client, 'GET', '/panel/webhooks')).toHaveLength(1);
  });

  test('toggle sends only enabled', async () => {
    const { controller, client } = setup({ 'PUT /panel/webhooks/4': { id: 4 } });

    await controller.toggle(ENDPOINT);
    expect(callsOf(client, 'PUT', '/panel/webhooks/4')[0].body).toEqual({ enabled: false });
  });

  test('regenerate asks first, then returns the secret for the dialog', async () => {
    const { controller, dialogs, client } = setup({
      'PUT /panel/webhooks/4': { id: 4, secret: 'whsec_fresh' },
    });
    const seen = [];

    controller.requestRegenerate(ENDPOINT, (secret) => seen.push(secret));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialogs[0].title).toBe('pages.webhooks.endpoints.regenerate.title');
    expect(callsOf(client, 'PUT', '/panel/webhooks/4')[0].body).toEqual({ regenerateSecret: true });
    expect(seen).toEqual(['whsec_fresh']);
  });
});

describe('DELETE /panel/webhooks/:id', () => {
  test('asks, deletes and reads the list again', async () => {
    const { controller, client, notify, dialogs } = setup({ 'DELETE /panel/webhooks/4': {} });

    controller.requestDelete(ENDPOINT);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialogs[0]).toMatchObject({ variant: 'danger' });
    expect(callsOf(client, 'DELETE', '/panel/webhooks/4')).toHaveLength(1);
    expect(notify.toasts[0]).toEqual({
      type: 'success',
      key: 'pages.webhooks.endpoints.deleted',
      values: {},
    });
  });

  test('already gone counts as deleted; other errors toast', async () => {
    const gone = setup({ 'DELETE /panel/webhooks/4': error('WEBHOOK_NOT_FOUND') });

    expect(await gone.controller.remove(ENDPOINT)).toBe(true);

    const denied = setup({ 'DELETE /panel/webhooks/4': error('NO_PERMISSION') });

    expect(await denied.controller.remove(ENDPOINT)).toBe(false);
    expect(denied.notify.toasts[0].key).toBe('pages.webhooks.errors.NO_PERMISSION');
  });
});

describe('POST /panel/webhooks/:id/test', () => {
  test('a 2xx answer toasts success with status and time', async () => {
    const { controller, notify } = setup({
      'POST /panel/webhooks/4/test': { statusCode: 200, durationMs: 42, error: null },
    });

    expect((await controller.test(ENDPOINT)).ok).toBe(true);
    expect(notify.toasts[0]).toEqual({
      type: 'success',
      key: 'pages.webhooks.endpoints.test.ok',
      values: { status: 200, ms: 42 },
    });
  });

  test('a receiver error toasts the reason', async () => {
    const { controller, notify } = setup({
      'POST /panel/webhooks/4/test': { statusCode: null, durationMs: 5, error: 'TIMEOUT' },
    });

    expect((await controller.test(ENDPOINT)).ok).toBe(false);
    expect(notify.toasts[0]).toMatchObject({
      type: 'error',
      key: 'pages.webhooks.endpoints.test.failed',
      values: { error: 'TIMEOUT' },
    });
  });

  test('an endpoint that is gone refreshes the list', async () => {
    const { controller, client } = setup({
      'POST /panel/webhooks/4/test': error('WEBHOOK_NOT_FOUND'),
    });

    expect(await controller.test(ENDPOINT)).toBeNull();
    expect(callsOf(client, 'GET', '/panel/webhooks')).toHaveLength(1);
  });
});
