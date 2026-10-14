import { describe, expect, test } from 'bun:test';

import {
  createMailTemplatesApi,
  effectiveLayout,
  fieldErrorsOf,
  groupByOwner,
  layoutEditHref,
  layoutRequestValue,
  layoutSelection,
  layoutSource,
  pickLocale,
  renderLayoutSample,
  toResult,
  variableToken,
} from './mail-templates.api.js';

describe('mail template helpers', () => {
  test('html variables are inserted with triple braces', () => {
    expect(variableToken({ name: 'items', type: 'html' })).toBe('{{{items}}}');
    expect(variableToken({ name: 'username', type: 'text' })).toBe('{{username}}');
  });

  test('list variables are inserted as a loop, on one line in a one-line input', () => {
    expect(variableToken({ name: 'items', type: 'list' })).toBe('{{#each items}}\n\n{{/each}}');
    expect(variableToken({ name: 'items', type: 'list' }, { inline: true })).toBe(
      '{{#each items}}{{/each}}',
    );
    expect(variableToken({ name: 'username' }, { inline: true })).toBe('{{username}}');
  });

  test('the layout select keeps the default apart from an own choice', () => {
    expect(layoutSelection('core:default', 'core:default')).toBe('');
    expect(layoutSelection('none', 'core:default')).toBe('none');
    expect(layoutSelection('custom:news', 'none')).toBe('custom:news');
    expect(effectiveLayout('', 'none')).toBe('none');
    expect(effectiveLayout('custom:news', 'core:default')).toBe('custom:news');
    expect(layoutRequestValue('')).toBeNull();
    expect(layoutRequestValue('none')).toBe('none');
  });

  test('a layout comes from Pano, a plugin or the admin', () => {
    expect(layoutSource({ owner: 'core' })).toBe('core');
    expect(layoutSource({ owner: 'custom' })).toBe('custom');
    expect(layoutSource({ owner: 'pano-plugin-market', pluginId: 'pano-plugin-market' })).toBe(
      'plugin',
    );
    expect(layoutEditHref('/panel', 'core:default')).toBe(
      '/panel/settings/mail-templates/layouts/core%3Adefault',
    );
  });

  test('core comes first, plugins by name', () => {
    const groups = groupByOwner([
      { owner: 'pano-plugin-market', pluginName: 'Market', key: 'order' },
      { owner: 'pano-plugin-auth-guard', pluginName: 'Auth Guard', key: 'magic-login' },
      { owner: 'core', key: 'activation' },
    ]);

    expect(groups.map((group) => group.owner)).toEqual([
      'core',
      'pano-plugin-auth-guard',
      'pano-plugin-market',
    ]);
  });

  test('the locale falls back to the panel language, then en-US', () => {
    const locales = [{ code: 'en-US' }, { code: 'tr' }];

    expect(pickLocale(locales, 'ru', 'tr')).toBe('tr');
    expect(pickLocale(locales, null, 'de')).toBe('en-US');
  });

  test('field errors carry the template error message', () => {
    const { error } = toResult({
      error: { code: 'INVALID_FIELDS', message: 'Parse error', fields: { body: 'TEMPLATE_ERROR' } },
    });

    expect(fieldErrorsOf(error)).toEqual({
      body: { code: 'TEMPLATE_ERROR', message: 'Parse error' },
    });
  });

  test('the layout sample fills the content slot and drops conditions', () => {
    const html = renderLayoutSample(
      '<h1>{{subject}}</h1>{{#if footer}}<p>{{{footer}}}</p>{{else}}none{{/if}}{{{content}}}',
      { subject: 'A & B', footer: 'F', content: '<p>Body</p>' },
    );

    expect(html).toBe('<h1>A &amp; B</h1><p>F</p><p>Body</p>');
  });

  test('template paths are encoded under the panel base', async () => {
    const calls = [];
    const client = { get: async (options) => (calls.push(options.path), {}) };

    await createMailTemplatesApi(client).get('core', 'activation', 'default', 'en-US');

    expect(calls).toEqual(['/panel/mail-templates/core/activation/default/en-US']);
  });

  test('layout calls address the layout by its encoded id', async () => {
    const calls = [];
    const record = (method) => async (options) => (
      calls.push([method, options.path, options.body]),
      {}
    );
    const client = {
      get: record('get'),
      post: record('post'),
      put: record('put'),
      delete: record('delete'),
    };
    const api = createMailTemplatesApi(client);

    await api.getLayout('custom:news');
    await api.saveLayout('core:default', '<p>{{{content}}}</p>');
    await api.saveLayout('custom:news', 'x', 'News');
    await api.deleteLayout('custom:news');
    await api.createLayout({ name: 'News', copyFrom: 'core:default' });
    await api.setLayout('core', 'activation', null);

    expect(calls).toEqual([
      ['get', '/panel/mail-templates/layouts/custom%3Anews', undefined],
      ['put', '/panel/mail-templates/layouts/core%3Adefault', { body: '<p>{{{content}}}</p>' }],
      ['put', '/panel/mail-templates/layouts/custom%3Anews', { body: 'x', name: 'News' }],
      ['delete', '/panel/mail-templates/layouts/custom%3Anews', undefined],
      ['post', '/panel/mail-templates/layouts', { name: 'News', copyFrom: 'core:default' }],
      ['put', '/panel/mail-templates/core/activation/layout', { layout: null }],
    ]);
  });
});
