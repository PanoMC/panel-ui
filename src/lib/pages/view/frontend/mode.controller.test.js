import { describe, expect, test } from 'bun:test';
import { get } from 'svelte/store';

import { createFrontendApi } from './frontend.api.js';
import { createModeController } from './mode.controller.js';
import { autoConfirm, recordingNotify, stubClient } from './testkit.js';

const STATE = {
  mode: 'THEME',
  customAppId: '',
  upstreamUrl: '',
  siteUrl: '',
  descriptorUrl: '',
  devUrl: '',
  customApps: [
    { id: 'shop', title: 'Shop', version: '1.0.0', author: 'me', active: false },
    { id: 'blog', title: 'Blog', version: '2.0.0', author: 'me', active: true },
  ],
  running: true,
  activeId: 'vanilla-theme',
  devUrlActive: false,
};

function setup(answers = {}, initial = STATE) {
  const client = stubClient(answers);
  const notify = recordingNotify();
  const { confirm, dialogs } = autoConfirm();
  const controller = createModeController({
    api: createFrontendApi(client),
    notify,
    confirm,
    initial,
  });

  return { client, notify, dialogs, controller };
}

const zip = (name = 'app.zip', size = 10) => {
  const file = new File(['x'], name, { type: 'application/zip' });

  Object.defineProperty(file, 'size', { value: size });

  return file;
};

describe('Mode tab controller', () => {
  test('the form starts as the stored state and is not dirty', () => {
    const { controller } = setup();

    expect(get(controller.draft).mode).toBe('THEME');
    expect(controller.isDirty()).toBe(false);
  });

  test('choosing a mode makes the form dirty; saving sends only the fields of that mode', async () => {
    const { controller, client, notify } = setup({
      'PUT /panel/frontend': { ...STATE, mode: 'EXTERNAL', upstreamUrl: 'http://127.0.0.1:4000' },
    });

    controller.setMode('EXTERNAL');
    controller.draft.update((d) => ({ ...d, upstreamUrl: 'http://127.0.0.1:4000', siteUrl: '' }));

    expect(controller.isDirty()).toBe(true);
    expect(await controller.save()).toBe(true);
    expect(client.calls[0].body).toEqual({
      mode: 'EXTERNAL',
      upstreamUrl: 'http://127.0.0.1:4000',
      siteUrl: '',
      descriptorUrl: '',
    });
    expect(get(controller.saved).mode).toBe('EXTERNAL');
    expect(controller.isDirty()).toBe(false);
    expect(notify.toasts[0]).toMatchObject({ type: 'success', key: 'pages.frontend.mode.saved' });
  });

  test('EXTERNAL without an address and CUSTOM_APP without an app are not sent', async () => {
    const { controller, client } = setup();

    controller.setMode('EXTERNAL');
    expect(await controller.save()).toBe(false);
    expect(get(controller.fieldErrors)).toEqual({ upstreamUrl: true });

    controller.setMode('CUSTOM_APP');
    expect(await controller.save()).toBe(false);
    expect(get(controller.fieldErrors)).toEqual({ customAppId: true });
    expect(client.calls).toHaveLength(0);
  });

  test('an unreachable upstream shows its message and offers "save anyway", which sends force', async () => {
    let attempt = 0;
    const { controller, client } = setup({
      'PUT /panel/frontend': (options) =>
        ++attempt === 1
          ? { error: { code: 'UPSTREAM_UNREACHABLE', details: { message: 'x' } } }
          : { ...STATE, mode: 'EXTERNAL', upstreamUrl: options.body.upstreamUrl },
    });

    controller.setMode('EXTERNAL');
    controller.draft.update((d) => ({ ...d, upstreamUrl: 'http://10.0.0.5:4000' }));

    expect(await controller.save()).toBe(false);
    expect(get(controller.error)).toMatchObject({
      code: 'UPSTREAM_UNREACHABLE',
      key: 'pages.frontend.errors.UPSTREAM_UNREACHABLE',
    });
    expect(get(controller.canForce)).toBe(true);
    expect(client.calls[0].body.force).toBeUndefined();

    expect(await controller.save({ force: true })).toBe(true);
    expect(client.calls[1].body.force).toBe(true);
    expect(get(controller.error)).toBeNull();
    expect(get(controller.canForce)).toBe(false);
  });

  for (const [code, details, fields] of [
    ['UPSTREAM_INVALID_URL', {}, { upstreamUrl: 'INVALID' }],
    ['UPSTREAM_IS_PANO', {}, { upstreamUrl: 'IS_PANO' }],
    ['DESCRIPTOR_HOST_NOT_ALLOWED', {}, { descriptorUrl: 'HOST_NOT_ALLOWED' }],
    ['FRONTEND_START_FAILED', { message: 'port busy' }, {}],
  ]) {
    test(`${code}: the message is shown, the blamed field is marked, nothing is forced`, async () => {
      const { controller } = setup({
        'PUT /panel/frontend': { error: { code, details, fields } },
      });

      controller.setMode('NONE');

      expect(await controller.save()).toBe(false);
      expect(get(controller.error).key).toBe(`pages.frontend.errors.${code}`);
      expect(get(controller.error).values).toEqual(details);
      expect(get(controller.fieldErrors)).toEqual(
        Object.fromEntries(Object.keys(fields).map((f) => [f, true])),
      );
      expect(get(controller.canForce)).toBe(false);
    });
  }

  test('upload: a zip is sent, the list is re-read and the new app is preselected but not saved', async () => {
    const after = {
      ...STATE,
      customApps: [
        ...STATE.customApps,
        { id: 'new', title: 'New', version: '1', author: 'me', active: false },
      ],
    };
    const { controller, client, notify } = setup({
      'POST /panel/frontend/custom-apps': { id: 'new', title: 'New', version: '1', author: 'me' },
      'GET /panel/frontend': after,
    });

    expect(await controller.upload(zip('new.zip'))).toBe(true);
    expect(client.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /panel/frontend/custom-apps',
      'GET /panel/frontend',
    ]);
    expect(get(controller.saved).customApps.map((a) => a.id)).toContain('new');
    expect(get(controller.draft)).toMatchObject({ mode: 'CUSTOM_APP', customAppId: 'new' });
    expect(get(controller.saved).mode).toBe('THEME');
    expect(notify.toasts[0]).toMatchObject({
      key: 'pages.frontend.custom-apps.uploaded',
      values: { title: 'New' },
    });
  });

  test('upload: a non-zip and a file over 100 MB are refused before any call', async () => {
    const { controller, client } = setup();

    expect(await controller.upload(zip('notes.txt'))).toBe(false);
    expect(get(controller.error).code).toBe('NOT_A_ZIP');
    expect(await controller.upload(zip('big.zip', 101 * 1024 * 1024))).toBe(false);
    expect(get(controller.error).code).toBe('FILE_TOO_LARGE');
    expect(client.calls).toHaveLength(0);
  });

  for (const [code, details] of [
    ['CUSTOM_APP_INVALID_MANIFEST', { field: 'version', message: 'bad' }],
    ['CUSTOM_APP_NO_ENTRY', {}],
    ['CUSTOM_APP_ID_TAKEN', { id: 'vanilla-theme' }],
    ['CUSTOM_APP_API_LEVEL', { apiLevel: 9, min: 1, current: 2 }],
  ]) {
    test(`upload refused with ${code}: its message is shown with the values`, async () => {
      const { controller } = setup({
        'POST /panel/frontend/custom-apps': { error: { code, details } },
      });

      expect(await controller.upload(zip())).toBe(false);
      expect(get(controller.error).key).toBe(`pages.frontend.errors.${code}`);
      expect(get(controller.error).values).toEqual(
        Object.fromEntries(Object.entries(details).map(([k, v]) => [k, String(v)])),
      );
      expect(get(controller.uploading)).toBe(false);
    });
  }

  test('delete asks first; the app is gone from the list afterwards', async () => {
    const { controller, client, dialogs } = setup({
      'DELETE /panel/frontend/custom-apps/shop': {},
      'GET /panel/frontend': { ...STATE, customApps: [STATE.customApps[1]] },
    });

    controller.draft.update((d) => ({ ...d, customAppId: 'shop' }));
    controller.requestDeleteApp(STATE.customApps[0]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialogs[0].title).toBe('pages.frontend.custom-apps.delete.title');
    expect(client.calls[0]).toMatchObject({
      method: 'DELETE',
      path: '/panel/frontend/custom-apps/shop',
    });
    expect(get(controller.saved).customApps.map((a) => a.id)).toEqual(['blog']);
    expect(get(controller.draft).customAppId).toBe('');
  });

  test('deleting the active app is refused by the backend and the message says why', async () => {
    const { controller } = setup({
      'DELETE /panel/frontend/custom-apps/blog': {
        error: { code: 'CUSTOM_APP_ACTIVE', details: { id: 'blog' } },
      },
    });

    expect(await controller.removeApp('blog')).toBe(false);
    expect(get(controller.error).key).toBe('pages.frontend.errors.CUSTOM_APP_ACTIVE');
    expect(get(controller.saved).customApps).toHaveLength(2);
  });
});
