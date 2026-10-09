import { describe, expect, test } from 'bun:test';
import { get } from 'svelte/store';

import { autoConfirm, recordingNotify, stubClient } from '../../view/frontend/testkit.js';
import { createDeliveriesController } from './deliveries.controller.js';
import { createWebhooksApi } from './webhooks.api.js';

const ROW = {
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
};
const page = (rows, totalItems = rows.length, number = 1) => ({
  items: rows,
  page: { number, size: 25, totalItems, totalPages: Math.ceil(totalItems / 25) },
});
const error = (code) => ({ error: { code, details: {}, fields: {} } });

function setup(answers = {}, options = {}) {
  const client = stubClient(answers);
  const notify = recordingNotify();
  const { confirm, dialogs } = autoConfirm();
  const controller = createDeliveriesController({
    api: createWebhooksApi(client),
    notify,
    confirm,
    ...options,
  });

  return { client, notify, dialogs, controller };
}

const paths = (client) => client.calls.map((call) => `${call.method} ${call.path}`);

describe('GET /panel/webhook-deliveries', () => {
  test('loads the first page and keeps the page object', async () => {
    const { controller } = setup({ 'GET /panel/webhook-deliveries?pageSize=25': page([ROW], 40) });

    expect(await controller.load()).toBe(true);
    expect(get(controller.items)).toEqual([ROW]);
    expect(get(controller.page).totalItems).toBe(40);
  });

  test('the source filter and the status filter reload from page 1', async () => {
    const { controller, client } = setup({
      'GET /panel/webhook-deliveries?source=market&pageSize=25': page([ROW]),
      'GET /panel/webhook-deliveries?source=market&status=FAILED&pageSize=25': page([ROW]),
    });

    await controller.setSource('market');
    await controller.setStatus('FAILED');

    expect(paths(client)).toEqual([
      'GET /panel/webhook-deliveries?source=market&pageSize=25',
      'GET /panel/webhook-deliveries?source=market&status=FAILED&pageSize=25',
    ]);
    expect(get(controller.source)).toBe('market');
    expect(get(controller.status)).toBe('FAILED');
  });

  test('paging keeps the filters', async () => {
    const { controller, client } = setup(
      { 'GET /panel/webhook-deliveries?status=DEAD&page=2&pageSize=25': page([ROW], 40, 2) },
      { filters: { status: 'DEAD' } },
    );

    await controller.gotoPage(2);
    expect(paths(client)).toEqual(['GET /panel/webhook-deliveries?status=DEAD&page=2&pageSize=25']);
    expect(get(controller.page).number).toBe(2);
  });

  test('one endpoint uses the per-endpoint path and can be cleared', async () => {
    const { controller, client } = setup({
      'GET /panel/webhooks/4/deliveries?pageSize=25': page([ROW]),
      'GET /panel/webhook-deliveries?pageSize=25': page([ROW]),
    });

    await controller.setEndpoint(4);
    await controller.setEndpoint(null);
    expect(paths(client)).toEqual([
      'GET /panel/webhooks/4/deliveries?pageSize=25',
      'GET /panel/webhook-deliveries?pageSize=25',
    ]);
  });

  test('a page that no longer exists falls back to page 1 once', async () => {
    const { controller, client } = setup({
      'GET /panel/webhook-deliveries?page=5&pageSize=25': error('PAGE_NOT_FOUND'),
      'GET /panel/webhook-deliveries?pageSize=25': page([ROW]),
    });

    expect(await controller.load(5)).toBe(true);
    expect(paths(client)).toHaveLength(2);
    expect(get(controller.items)).toEqual([ROW]);
  });

  test('a failed read toasts and marks the list failed; an endpoint that is gone ends its view', async () => {
    const { controller, notify } = setup(
      { 'GET /panel/webhooks/9/deliveries?pageSize=25': error('WEBHOOK_NOT_FOUND') },
      { filters: { endpointId: 9 } },
    );

    expect(await controller.load()).toBe(false);
    expect(get(controller.failed)).toBe(true);
    expect(get(controller.endpointId)).toBeNull();
    expect(notify.toasts[0].key).toBe('pages.webhooks.errors.WEBHOOK_NOT_FOUND');
  });
});

describe('GET /panel/webhook-deliveries/:id', () => {
  test('opens the full row with body and last response', async () => {
    const full = { ...ROW, url: 'https://example.com/h', body: '{"a":1}', lastResponse: 'oops' };
    const { controller } = setup({ 'GET /panel/webhook-deliveries/31': full });

    expect(await controller.open(ROW)).toEqual(full);
    expect(get(controller.detail)).toEqual(full);
    expect(get(controller.detailLoading)).toBe(false);

    controller.closeDetail();
    expect(get(controller.detail)).toBeNull();
  });

  test('a row that is gone toasts and reads the list again', async () => {
    const { controller, client, notify } = setup({
      'GET /panel/webhook-deliveries/31': error('WEBHOOK_NOT_FOUND'),
      'GET /panel/webhook-deliveries?pageSize=25': page([]),
    });

    expect(await controller.open(ROW)).toBeNull();
    expect(notify.toasts[0].type).toBe('error');
    expect(paths(client)).toContain('GET /panel/webhook-deliveries?pageSize=25');
  });
});

describe('POST /panel/webhook-deliveries/:id/redeliver', () => {
  test('asks, queues the row again and reads the list', async () => {
    const { controller, client, notify, dialogs } = setup({
      'POST /panel/webhook-deliveries/31/redeliver': {},
      'GET /panel/webhook-deliveries?pageSize=25': page([{ ...ROW, status: 'PENDING' }]),
    });

    controller.requestRedeliver(ROW);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialogs[0].title).toBe('pages.webhooks.deliveries.redeliver.title');
    expect(paths(client)).toEqual([
      'POST /panel/webhook-deliveries/31/redeliver',
      'GET /panel/webhook-deliveries?pageSize=25',
    ]);
    expect(notify.toasts[0]).toMatchObject({
      type: 'success',
      key: 'pages.webhooks.deliveries.redelivered',
    });
    expect(get(controller.items)[0].status).toBe('PENDING');
  });

  test('WEBHOOK_IN_FLIGHT toasts and shows the row as it is now', async () => {
    const { controller, client, notify } = setup({
      'POST /panel/webhook-deliveries/31/redeliver': error('WEBHOOK_IN_FLIGHT'),
      'GET /panel/webhook-deliveries?pageSize=25': page([{ ...ROW, status: 'SENDING' }]),
    });

    expect(await controller.redeliver(ROW)).toBe(false);
    expect(notify.toasts[0]).toMatchObject({
      type: 'error',
      key: 'pages.webhooks.errors.WEBHOOK_IN_FLIGHT',
    });
    expect(paths(client)).toHaveLength(2);
    expect(get(controller.items)[0].status).toBe('SENDING');
    expect(get(controller.redelivering)).toBeNull();
  });
});
