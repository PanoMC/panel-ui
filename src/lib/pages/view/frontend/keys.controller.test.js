import { describe, expect, test } from 'bun:test';
import { get } from 'svelte/store';

import { createFrontendApi } from './frontend.api.js';
import { createKeysController } from './keys.controller.js';
import { autoConfirm, recordingNotify, stubClient } from './testkit.js';

const LIST = {
  items: [
    { id: 1, name: 'site', hint: 'ab12', createdAt: 1_700_000_000_000, lastUsedAt: null },
    {
      id: 2,
      name: 'shop',
      hint: 'cd34',
      createdAt: 1_700_000_100_000,
      lastUsedAt: 1_700_000_200_000,
    },
  ],
  max: 20,
};

function setup(answers = {}, initial = LIST) {
  const client = stubClient(answers);
  const notify = recordingNotify();
  const { confirm, dialogs } = autoConfirm();
  const controller = createKeysController({
    api: createFrontendApi(client),
    notify,
    confirm,
    initial,
  });

  return { client, notify, dialogs, controller };
}

describe('Keys tab controller', () => {
  test('starts from the list the page loaded', () => {
    const { controller } = setup();

    expect(get(controller.items).map((k) => k.name)).toEqual(['site', 'shop']);
    expect(get(controller.max)).toBe(20);
    expect(get(controller.full)).toBe(false);
  });

  test('create: the answer carries the key and the two env lines, and the list gains a row', async () => {
    const created = {
      id: 3,
      name: 'blog',
      key: 'pfk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwxyz',
      env: ['PANO_API_URL=https://example.com/api', 'PANO_FRONTEND_KEY=pfk_AAAA'],
    };
    const { controller, client } = setup({ 'POST /panel/frontend/keys': created });

    const result = await controller.create('  blog ');

    expect(client.calls[0].body).toEqual({ name: 'blog' });
    expect(result).toEqual(created);
    expect(result.env).toHaveLength(2);
    expect(get(controller.items).at(-1)).toMatchObject({
      id: 3,
      name: 'blog',
      hint: 'wxyz',
      lastUsedAt: null,
    });
    expect(get(controller.creating)).toBe(false);
  });

  test('create: an empty or too long name is refused before any call', async () => {
    const { controller, client } = setup();

    expect(await controller.create('   ')).toBeNull();
    expect(get(controller.createErrors)).toEqual({ name: true });
    expect(await controller.create('x'.repeat(65))).toBeNull();
    expect(client.calls).toHaveLength(0);
  });

  test('create: a field error from the backend marks the field, other errors become a toast', async () => {
    const field = setup({
      'POST /panel/frontend/keys': { error: { code: 'INVALID_FIELDS', fields: { name: true } } },
    });

    expect(await field.controller.create('x')).toBeNull();
    expect(get(field.controller.createErrors)).toEqual({ name: true });
    expect(field.notify.toasts).toEqual([]);

    const limit = setup({
      'POST /panel/frontend/keys': { error: { code: 'FRONTEND_KEY_LIMIT_REACHED' } },
    });

    expect(await limit.controller.create('x')).toBeNull();
    expect(limit.notify.toasts).toEqual([
      { type: 'error', key: 'pages.frontend.errors.FRONTEND_KEY_LIMIT_REACHED', values: {} },
    ]);
  });

  test('the list is full at the maximum', () => {
    const { controller } = setup({}, { items: LIST.items, max: 2 });

    expect(get(controller.full)).toBe(true);
  });

  test('revoke asks first, then deletes the row and says so', async () => {
    const { controller, client, dialogs, notify } = setup({
      'DELETE /panel/frontend/keys/1': { ok: true },
    });

    controller.requestRevoke(get(controller.items)[0]);
    await Promise.resolve();
    await Promise.resolve();

    expect(dialogs[0]).toMatchObject({
      title: 'pages.frontend.keys.revoke.title',
      description: 'pages.frontend.keys.revoke.description',
      variant: 'danger',
    });
    expect(client.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'DELETE /panel/frontend/keys/1',
    ]);
    expect(get(controller.items).map((k) => k.id)).toEqual([2]);
    expect(notify.toasts[0]).toMatchObject({ type: 'success', key: 'pages.frontend.keys.revoked' });
  });

  test('a refused revoke keeps the row and shows the error', async () => {
    const { controller, notify } = setup({
      'DELETE /panel/frontend/keys/1': { error: { code: 'NOT_FOUND' } },
    });

    expect(await controller.revoke(1)).toBe(false);
    expect(get(controller.items)).toHaveLength(2);
    expect(notify.toasts[0].type).toBe('error');
    expect(get(controller.revoking)).toBeNull();
  });

  test('refresh replaces the list', async () => {
    const { controller } = setup({
      'GET /panel/frontend/keys': { items: [{ id: 9, name: 'only', hint: '0000' }], max: 5 },
    });

    expect(await controller.refresh()).toBe(true);
    expect(get(controller.items).map((k) => k.id)).toEqual([9]);
    expect(get(controller.max)).toBe(5);
  });
});
