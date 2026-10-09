import { describe, expect, test } from 'bun:test';
import { get } from 'svelte/store';

import { createFrontendApi } from './frontend.api.js';
import { createSettingsController, formOf, normalizeSettingsState } from './settings.controller.js';
import { recordingNotify, stubClient } from './testkit.js';

const SCHEMA = {
  fields: {
    title: { type: 'text', label: 'Site title', required: true },
    compact: { type: 'boolean', label: 'Compact' },
    columns: { type: 'number', label: 'Columns', default: 3 },
    logo: { type: 'image', label: 'Logo' },
  },
};

const BODY = {
  id: 'vanilla-theme',
  mode: 'THEME',
  hasSchema: true,
  schema: SCHEMA,
  settings: { title: 'Pano', compact: false, columns: 3 },
  files: { logo: ['a1.png'] },
};

function setup(answers = {}, initial = BODY) {
  const client = stubClient(answers);
  const notify = recordingNotify();
  const controller = createSettingsController({
    api: createFrontendApi(client),
    notify,
    initial,
    locale: 'tr',
  });

  return { client, notify, controller };
}

describe('normalizeSettingsState', () => {
  test('a front-end without fields has no schema and keeps its own settings page', () => {
    const state = normalizeSettingsState({
      id: 'x',
      mode: 'THEME',
      hasSchema: false,
      schema: null,
    });

    expect(state).toMatchObject({ hasSchema: false, schema: null, settings: {}, files: {} });
    expect(formOf(state).values).toEqual({});
  });

  test('hasSchema without a schema object is treated as none', () => {
    expect(normalizeSettingsState({ hasSchema: true, schema: null }).hasSchema).toBe(false);
  });
});

describe('Settings controller', () => {
  test('the form starts from the stored values, the defaults and the stored files', () => {
    const { controller } = setup();
    const form = formOf(get(controller.state));

    expect(form.values).toEqual({ title: 'Pano', compact: false, columns: 3 });
    expect(form.files).toEqual({ logo: ['a1.png'] });
    expect(form.removed).toEqual([]);
  });

  test('save sends the whole form as JSON and starts the form over from the answer', async () => {
    const answer = { ...BODY, settings: { title: 'Pano Craft', compact: true, columns: 4 } };
    const { controller, client, notify } = setup({ 'PUT /panel/frontend/settings': answer });
    const form = formOf(get(controller.state));

    form.values.title = 'Pano Craft';
    form.values.compact = true;
    form.values.columns = '4';

    const next = await controller.save(form);

    expect(client.calls[0].body).toEqual({
      settings: { title: 'Pano Craft', compact: true, columns: 4, files: { logo: ['a1.png'] } },
    });
    expect(next?.settings.title).toBe('Pano Craft');
    expect(get(controller.state).settings.columns).toBe(4);
    expect(notify.toasts.at(-1)).toMatchObject({
      type: 'success',
      key: 'pages.frontend.settings.saved',
    });
  });

  test('a chosen image goes as multipart and replaces the old file', async () => {
    const picture = new File(['x'], 'b2.png', { type: 'image/png' });
    const { controller, client } = setup({
      'PUT /panel/frontend/settings': { ...BODY, files: { logo: ['b2-stored.png'] } },
    });
    const form = formOf(get(controller.state));

    form.uploads.logo = picture;

    const next = await controller.save(form);
    const sent = client.calls[0].body;

    expect(sent).toBeInstanceOf(FormData);
    expect(sent.get('logo').name).toBe('b2.png');
    expect(JSON.parse(sent.get('settings'))['remove-files']).toEqual(['a1.png']);
    expect(next?.files).toEqual({ logo: ['b2-stored.png'] });
  });

  test('a removed image is named in remove-files and sent as JSON', async () => {
    const { controller, client } = setup({
      'PUT /panel/frontend/settings': { ...BODY, files: {} },
    });
    const form = formOf(get(controller.state));

    form.files.logo = [];
    form.removed = ['a1.png'];

    await controller.save(form);

    expect(client.calls[0].body.settings['remove-files']).toEqual(['a1.png']);
    expect(client.calls[0].body.settings.files).toBeUndefined();
  });

  test('a refused value is shown on its field with the reason, and the form is kept', async () => {
    const { controller, notify } = setup({
      'PUT /panel/frontend/settings': {
        error: { code: 'FRONTEND_SETTING_INVALID', details: { key: 'title', reason: 'TOO_LONG' } },
      },
    });

    expect(await controller.save(formOf(get(controller.state)))).toBeNull();
    expect(get(controller.fieldErrors)).toEqual({ title: 'TOO_LONG' });
    expect(get(controller.error)).toBeNull();
    expect(notify.toasts).toHaveLength(0);
  });

  test('any other refusal is a message above the form', async () => {
    const { controller } = setup({
      'PUT /panel/frontend/settings': { error: { code: 'FRONTEND_SETTINGS_NO_SCHEMA' } },
    });

    expect(await controller.save(formOf(get(controller.state)))).toBeNull();
    expect(get(controller.error)).toMatchObject({
      code: 'FRONTEND_SETTINGS_NO_SCHEMA',
      key: 'pages.frontend.errors.FRONTEND_SETTINGS_NO_SCHEMA',
    });
  });

  test('a front-end without a schema is never written to', async () => {
    const { controller, client } = setup({}, { ...BODY, hasSchema: false, schema: null });

    expect(await controller.save({ values: {} })).toBeNull();
    expect(client.calls).toHaveLength(0);
  });

  test('loadTexts reads the front-end texts of the panel language, nested under data', async () => {
    const { controller, client } = setup({
      'GET /locales/tr/translations/types/THEME': {
        data: { settings: { title: 'Başlık' } },
        meta: {},
      },
    });

    expect(await controller.loadTexts()).toBe(true);
    expect(client.calls[0].path).toBe('/locales/tr/translations/types/THEME');
    expect(get(controller.messages)).toEqual({ settings: { title: 'Başlık' } });
  });

  test('texts that cannot be read leave the labels as they are written', async () => {
    const { controller } = setup({
      'GET /locales/tr/translations/types/THEME': { error: { code: 'NOT_FOUND' } },
    });

    expect(await controller.loadTexts()).toBe(false);
    expect(get(controller.messages)).toEqual({});
  });

  test('refresh reads the settings again and clears an old error', async () => {
    const { controller } = setup({
      'GET /panel/frontend/settings': { ...BODY, id: 'other-theme', settings: { title: 'New' } },
    });

    controller.error.set({ code: 'X', key: 'k', values: {} });

    expect(await controller.refresh()).toBe(true);
    expect(get(controller.state).id).toBe('other-theme');
    expect(get(controller.error)).toBeNull();
  });
});
