import { describe, expect, test } from 'bun:test';

import {
  createMailTemplatesApi,
  fieldErrorsOf,
  groupByOwner,
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
});
