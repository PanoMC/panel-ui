/**
 * The panel API of the Webhooks page (doc 06 section 4.5, `/api/v1/panel/webhooks...`).
 *
 * Every call answers `{ ok, body, error }` like the Front-end page's API; the HTTP client is passed
 * in (`ApiUtil` in the panel, a stub in tests).
 */
import { deliveriesPath } from './webhooks.util.js';

/**
 * The answer of a call as `{ ok, body, error }`. Only an error envelope (`error` is an object with a
 * `code`, doc 04 section 3) is a failure: the test answer has its own plain `error` text next to
 * `statusCode`, and that is a successful answer.
 *
 * @param {any} body what the client resolved with
 * @returns {{ ok: boolean, body: any, error: { code: string, details: Record<string, any>, fields: Record<string, any> } | null }}
 */
export function toResult(body) {
  // The demo guard resolves with nothing (the client shows its own toast).
  if (body === undefined || body === null) {
    return { ok: false, body: null, error: { code: 'DISABLED_FOR_DEMO', details: {}, fields: {} } };
  }

  const error = body.error;

  if (error && typeof error === 'object' && typeof error.code === 'string') {
    return {
      ok: false,
      body,
      error: { code: error.code, details: error.details ?? {}, fields: error.fields ?? {} },
    };
  }

  return { ok: true, body, error: null };
}

/**
 * @param {{ get: Function, post: Function, put: Function, delete: Function }} client
 * @param {any} [request] the SvelteKit load event, for a call made while loading
 */
export function createWebhooksApi(client, request) {
  const call = async (method, options) => toResult(await client[method]({ request, ...options }));

  return {
    /** `{ items: [endpoint], limit }`; the secret and every header value read `********`. */
    listEndpoints: () => call('get', { path: '/panel/webhooks' }),

    /** `{ items: [{ source, title, events: [{ name, subscribable, sample }] }] }` */
    listEvents: () => call('get', { path: '/panel/webhooks/events' }),

    /** `{ id, secret? }` - the secret is in this answer only. */
    createEndpoint: (body) => call('post', { path: '/panel/webhooks', body }),

    /** `{ id, secret? }`; a partial body keeps the other fields. */
    updateEndpoint: (id, body) => call('put', { path: `/panel/webhooks/${id}`, body }),

    deleteEndpoint: (id) => call('delete', { path: `/panel/webhooks/${id}` }),

    /** `{ statusCode, durationMs, error }` */
    testEndpoint: (id) => call('post', { path: `/panel/webhooks/${id}/test`, body: {} }),

    /** `{ items, page }`; `endpointId` limits the log to one endpoint. */
    listDeliveries: (filters) => call('get', { path: deliveriesPath(filters) }),

    /** The list shape plus `url`, `format`, `signing`, `body` and `lastResponse`. */
    getDelivery: (id) => call('get', { path: `/panel/webhook-deliveries/${id}` }),

    redeliver: (id) =>
      call('post', { path: `/panel/webhook-deliveries/${id}/redeliver`, body: {} }),
  };
}
