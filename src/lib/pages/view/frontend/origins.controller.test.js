import { describe, expect, test } from 'bun:test';
import { get } from 'svelte/store';

import { createFrontendApi } from './frontend.api.js';
import { createOriginsController } from './origins.controller.js';
import { autoConfirm, recordingNotify, stubClient } from './testkit.js';

const LIST = { origins: ['https://play.example.com'], max: 3 };

function setup(answers = {}, initial = LIST) {
  const client = stubClient(answers);
  const notify = recordingNotify();
  const { confirm, dialogs } = autoConfirm();
  const controller = createOriginsController({
    api: createFrontendApi(client),
    notify,
    confirm,
    initial,
  });

  return { client, notify, dialogs, controller };
}

/** A backend that normalizes like the real one: lower case, no trailing slash. */
const echo = (options) => ({
  origins: options.body.origins.map((origin) => origin.toLowerCase().replace(/\/+$/, '')),
});

describe('Allowed origins controller', () => {
  test('starts from the list the page loaded', () => {
    const { controller } = setup();

    expect(get(controller.items)).toEqual(['https://play.example.com']);
    expect(get(controller.max)).toBe(3);
    expect(get(controller.full)).toBe(false);
  });

  test('add sends the whole list with the new origin and shows what the backend kept', async () => {
    const { controller, client, notify } = setup({ 'PUT /panel/frontend/origins': echo });

    expect(await controller.add('  https://Shop.Example.com/ ')).toBe(true);

    expect(client.calls[0].body).toEqual({
      origins: ['https://play.example.com', 'https://Shop.Example.com'],
    });
    expect(get(controller.items)).toEqual(['https://play.example.com', 'https://shop.example.com']);
    expect(notify.toasts.at(-1)).toMatchObject({
      type: 'success',
      key: 'pages.frontend.origins.added',
    });
  });

  test('adding an origin that is already listed sends nothing', async () => {
    const { controller, client } = setup();

    expect(await controller.add('https://play.example.com')).toBe(true);
    expect(client.calls).toHaveLength(0);
  });

  test('an empty entry is refused without a call', async () => {
    const { controller, client } = setup();

    expect(await controller.add('   ')).toBe(false);
    expect(client.calls).toHaveLength(0);
    expect(get(controller.addError)?.key).toBe('pages.frontend.errors.INVALID_ORIGIN');
  });

  test('ORIGIN_DIFFERENT_SITE is explained as a different domain using a front-end key', async () => {
    const { controller } = setup({
      'PUT /panel/frontend/origins': { error: { code: 'ORIGIN_DIFFERENT_SITE' } },
    });

    expect(await controller.add('https://evil.com')).toBe(false);
    expect(get(controller.addError)).toMatchObject({
      code: 'ORIGIN_DIFFERENT_SITE',
      key: 'pages.frontend.errors.ORIGIN_DIFFERENT_SITE',
    });
    // Nothing was saved: the list is as it was.
    expect(get(controller.items)).toEqual(['https://play.example.com']);
  });

  test('a malformed origin (INVALID_FIELDS on origins) and the limit have their own messages', async () => {
    const bad = setup({
      'PUT /panel/frontend/origins': {
        error: { code: 'INVALID_FIELDS', fields: { origins: 'INVALID_ORIGIN' } },
      },
    });

    await bad.controller.add('http://x');
    expect(get(bad.controller.addError)?.key).toBe('pages.frontend.errors.INVALID_ORIGIN');

    const limit = setup({
      'PUT /panel/frontend/origins': { error: { code: 'ORIGIN_LIMIT_REACHED' } },
    });

    await limit.controller.add('https://a.example.com');
    expect(get(limit.controller.addError)?.key).toBe('pages.frontend.errors.ORIGIN_LIMIT_REACHED');
  });

  test('the list is full at the limit', () => {
    const { controller } = setup(
      {},
      { origins: ['https://a.example.com', 'https://b.example.com'], max: 2 },
    );

    expect(get(controller.full)).toBe(true);
  });

  test('remove asks first, then sends the list without it', async () => {
    const { controller, client, dialogs, notify } = setup(
      { 'PUT /panel/frontend/origins': echo },
      { origins: ['https://a.example.com', 'https://b.example.com'], max: 20 },
    );

    controller.requestRemove('https://a.example.com');
    await Promise.resolve();

    expect(dialogs).toHaveLength(1);
    expect(dialogs[0].variant).toBe('danger');
    expect(client.calls[0].body).toEqual({ origins: ['https://b.example.com'] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(get(controller.items)).toEqual(['https://b.example.com']);
    expect(notify.toasts.at(-1)?.key).toBe('pages.frontend.origins.removed');
  });

  test('a refused remove keeps the row and says why', async () => {
    const { controller, notify } = setup({
      'PUT /panel/frontend/origins': { error: { code: 'NETWORK_ERROR' } },
    });

    expect(await controller.remove('https://play.example.com')).toBe(false);
    expect(get(controller.items)).toEqual(['https://play.example.com']);
    expect(notify.toasts.at(-1)).toMatchObject({
      type: 'error',
      key: 'pages.frontend.errors.NETWORK_ERROR',
    });
  });

  test('refresh reads the list again', async () => {
    const { controller } = setup({
      'GET /panel/frontend/origins': { origins: ['https://x.example.com'], max: 5 },
    });

    expect(await controller.refresh()).toBe(true);
    expect(get(controller.items)).toEqual(['https://x.example.com']);
    expect(get(controller.max)).toBe(5);
  });
});
