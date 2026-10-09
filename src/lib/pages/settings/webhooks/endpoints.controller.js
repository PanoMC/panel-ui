import { derived, get, writable } from 'svelte/store';

import {
  DEFAULT_ENDPOINT_LIMIT,
  buildBody,
  describeError,
  normalizeCatalogue,
  serverFieldErrors,
  subscribesToSource,
  testOutcome,
} from './webhooks.util.js';

/**
 * The state and the actions of the Endpoints tab. The page renders the stores; the tests drive the
 * actions with a stubbed API.
 *
 * @param {object} options
 * @param {ReturnType<import('./webhooks.api.js').createWebhooksApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {(options: object, callback: () => any, values?: object) => any} options.confirm the shared confirmation dialog
 * @param {{ endpoints?: { items?: any[], limit?: number } | null, events?: any, source?: string }} [options.initial]
 */
export function createEndpointsController({ api, notify, confirm, initial = {} }) {
  const items = writable(/** @type {any[]} */ (initial.endpoints?.items ?? []));
  const limit = writable(initial.endpoints?.limit ?? DEFAULT_ENDPOINT_LIMIT);
  const catalogue = writable(normalizeCatalogue(initial.events));
  /** The source the list is narrowed to ('' = all). */
  const source = writable(initial.source ?? '');
  const saving = writable(false);
  /** The id of the endpoint a row action is running for. */
  const busy = writable(/** @type {number | null} */ (null));
  /** Field errors of the last save the server refused. */
  const serverErrors = writable(/** @type {Record<string, any>} */ ({}));

  const full = derived([items, limit], ([$items, $limit]) => $items.length >= $limit);
  const visible = derived([items, source], ([$items, $source]) =>
    $items.filter((endpoint) => subscribesToSource(endpoint, $source)),
  );

  function fail(error) {
    const { key, values } = describeError(error);

    notify.error(key, values);
  }

  async function refresh() {
    const [list, events] = await Promise.all([api.listEndpoints(), api.listEvents()]);

    if (list.ok) {
      items.set(list.body.items ?? []);
      limit.set(list.body.limit ?? DEFAULT_ENDPOINT_LIMIT);
    } else {
      fail(list.error);
    }

    // The catalogue is only for the form; a failed read keeps the one that is there.
    if (events.ok) catalogue.set(normalizeCatalogue(events.body));

    return list.ok;
  }

  /**
   * Validates and saves the form.
   *
   * @param {any} form
   * @param {number | null} id the endpoint being edited, or null to create one
   * @returns {Promise<{ ok: boolean, errors?: Record<string, any>, id?: number, secret?: string }>}
   *   `secret` is the generated signing secret, known only in this answer.
   */
  async function save(form, id = null) {
    serverErrors.set({});

    const built = buildBody(form);

    if (built.errors) return { ok: false, errors: built.errors };

    saving.set(true);

    try {
      const result =
        id === null
          ? await api.createEndpoint(built.body)
          : await api.updateEndpoint(id, built.body);

      if (!result.ok) {
        const fields = serverFieldErrors(result.error);

        if (Object.keys(fields).length > 0) serverErrors.set(fields);

        // An unknown event is a field error and a message: the person needs to know which one.
        if (Object.keys(fields).length === 0 || result.error.code === 'WEBHOOK_UNKNOWN_EVENT') {
          fail(result.error);
        }

        if (result.error.code === 'WEBHOOK_NOT_FOUND') await refresh();

        return { ok: false, errors: fields };
      }

      await refresh();

      return {
        ok: true,
        id: result.body.id,
        secret: typeof result.body.secret === 'string' ? result.body.secret : undefined,
      };
    } finally {
      saving.set(false);
    }
  }

  async function toggle(endpoint) {
    busy.set(endpoint.id);

    try {
      const result = await api.updateEndpoint(endpoint.id, { enabled: !endpoint.enabled });

      if (!result.ok) fail(result.error);

      await refresh();

      return result.ok;
    } finally {
      busy.set(null);
    }
  }

  async function remove(endpoint) {
    busy.set(endpoint.id);

    try {
      const result = await api.deleteEndpoint(endpoint.id);

      // Already gone is the state the person wanted.
      if (!result.ok && result.error.code !== 'WEBHOOK_NOT_FOUND') {
        fail(result.error);

        return false;
      }

      notify.success('pages.webhooks.endpoints.deleted');
      await refresh();

      return true;
    } finally {
      busy.set(null);
    }
  }

  /** Asks first: the endpoint's open deliveries end as dead. */
  function requestDelete(endpoint) {
    confirm(
      {
        title: 'pages.webhooks.endpoints.delete.title',
        description: 'pages.webhooks.endpoints.delete.description',
        confirmLabel: 'pages.webhooks.endpoints.delete.confirm',
        variant: 'danger',
      },
      () => remove(endpoint),
      { name: endpoint.name },
    );
  }

  /** Sends `core.test.ping` and reports what the receiver answered. */
  async function test(endpoint) {
    busy.set(endpoint.id);

    try {
      const result = await api.testEndpoint(endpoint.id);

      if (!result.ok) {
        fail(result.error);

        if (result.error.code === 'WEBHOOK_NOT_FOUND') await refresh();

        return null;
      }

      const outcome = testOutcome(result.body);

      if (outcome.ok) {
        notify.success('pages.webhooks.endpoints.test.ok', {
          status: outcome.status,
          ms: outcome.ms,
        });
      } else {
        notify.error('pages.webhooks.endpoints.test.failed', {
          status: outcome.status,
          error: outcome.error || String(outcome.status),
        });
      }

      await refresh();

      return outcome;
    } finally {
      busy.set(null);
    }
  }

  /**
   * Makes a new signing secret; the old one stops matching at once.
   *
   * @returns {Promise<string | null>} the new secret, shown once, or null
   */
  async function regenerateSecret(endpoint) {
    busy.set(endpoint.id);

    try {
      const result = await api.updateEndpoint(endpoint.id, { regenerateSecret: true });

      if (!result.ok) {
        fail(result.error);

        return null;
      }

      await refresh();

      return typeof result.body.secret === 'string' ? result.body.secret : null;
    } finally {
      busy.set(null);
    }
  }

  /** Asks first, then regenerates and hands the secret to `onSecret`. */
  function requestRegenerate(endpoint, onSecret) {
    confirm(
      {
        title: 'pages.webhooks.endpoints.regenerate.title',
        description: 'pages.webhooks.endpoints.regenerate.description',
        confirmLabel: 'pages.webhooks.endpoints.regenerate.confirm',
        variant: 'primary',
      },
      async () => {
        const secret = await regenerateSecret(endpoint);

        if (secret) onSecret(secret);
      },
      { name: endpoint.name },
    );
  }

  return {
    items,
    visible,
    limit,
    full,
    catalogue,
    source,
    saving,
    busy,
    serverErrors,
    refresh,
    save,
    toggle,
    remove,
    requestDelete,
    test,
    regenerateSecret,
    requestRegenerate,
    count: () => get(items).length,
  };
}
