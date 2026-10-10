import { describe, expect, test } from 'bun:test';

import { createFrontendApi, toResult } from './frontend.api.js';
import { stubClient } from './testkit.js';

describe('toResult', () => {
  test('a body without an error key is a success', () => {
    expect(toResult({ items: [] })).toEqual({ ok: true, body: { items: [] }, error: null });
  });

  test('the error envelope is unpacked into code, details and fields', () => {
    const result = toResult({
      error: {
        code: 'CUSTOM_APP_INVALID_MANIFEST',
        details: { field: 'id' },
        fields: { id: 'INVALID' },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({
      code: 'CUSTOM_APP_INVALID_MANIFEST',
      details: { field: 'id' },
      fields: { id: 'INVALID' },
    });
  });

  test('an old-style string error and a missing body do not throw', () => {
    expect(toResult({ error: 'NOPE' }).error.code).toBe('NOPE');
    expect(toResult(undefined).error.code).toBe('DISABLED_FOR_DEMO');
  });
});

describe('createFrontendApi', () => {
  test('every call goes to the documented panel path with the documented method and body', async () => {
    const client = stubClient();
    const api = createFrontendApi(client);

    await api.listKeys();
    await api.createKey('my-site');
    await api.revokeKey(7);
    await api.getFrontend();
    await api.saveFrontend({ mode: 'NONE' });
    await api.deleteCustomApp('my app');
    await api.getProxyStatus();

    expect(client.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /panel/frontend/keys',
      'POST /panel/frontend/keys',
      'DELETE /panel/frontend/keys/7',
      'GET /panel/frontend',
      'PUT /panel/frontend',
      'DELETE /panel/frontend/custom-apps/my%20app',
      'GET /panel/access/proxy-status',
    ]);
    expect(client.calls[1].body).toEqual({ name: 'my-site' });
    expect(client.calls[4].body).toEqual({ mode: 'NONE' });
  });

  test('the upload sends the zip as the multipart field "file"', async () => {
    const client = stubClient();
    const file = new File(['zip'], 'app.zip', { type: 'application/zip' });

    await createFrontendApi(client).uploadCustomApp(file);

    expect(client.calls[0].method).toBe('POST');
    expect(client.calls[0].path).toBe('/panel/frontend/custom-apps');
    expect(client.calls[0].body).toBeInstanceOf(FormData);
    expect(client.calls[0].body.get('file').name).toBe('app.zip');
  });

  test('origins and link targets go to their documented paths', async () => {
    const client = stubClient();
    const api = createFrontendApi(client);

    await api.listOrigins();
    await api.saveOrigins(['https://play.example.com']);
    await api.getUrls();
    await api.saveUrls({ 'auth.login': '/sign-in' });

    expect(client.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /panel/frontend/origins',
      'PUT /panel/frontend/origins',
      'GET /panel/frontend/urls',
      'PUT /panel/frontend/urls',
    ]);
    expect(client.calls[1].body).toEqual({ origins: ['https://play.example.com'] });
    expect(client.calls[3].body).toEqual({ overrides: { 'auth.login': '/sign-in' } });
  });

  test('the load event is handed on to the client', async () => {
    let seen;
    const client = { get: async (options) => ((seen = options.request), {}) };

    await createFrontendApi(/** @type {any} */ (client), { fetch: 'event' }).getFrontend();

    expect(seen).toEqual({ fetch: 'event' });
  });
});
