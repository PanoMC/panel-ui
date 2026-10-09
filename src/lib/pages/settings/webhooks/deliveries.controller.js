import { get, readable, writable } from 'svelte/store';

import { DELIVERY_PAGE_SIZE, describeError } from './webhooks.util.js';

/**
 * The state and the actions of the Deliveries tab: the log with its source and status filters, one
 * delivery's detail and redeliver.
 *
 * @param {object} options
 * @param {ReturnType<import('./webhooks.api.js').createWebhooksApi>} options.api
 * @param {{ success: (key: string, values?: object) => any, error: (key: string, values?: object) => any }} options.notify
 * @param {(options: object, callback: () => any, values?: object) => any} options.confirm
 * @param {{ items?: any[], page?: any } | null} [options.initial] the first page, read with the filters below
 * @param {{ source?: string, status?: string, endpointId?: number | null }} [options.filters]
 * @param {import('svelte/store').Readable<any[]>} [options.catalogue] the event catalogue; its sources fill the source filter
 * @param {import('svelte/store').Readable<Record<string, string>>} [options.names] endpoint id to name
 */
export function createDeliveriesController({
  api,
  notify,
  confirm,
  initial = null,
  filters = {},
  catalogue = readable([]),
  names = readable({}),
}) {
  const items = writable(/** @type {any[]} */ (initial?.items ?? []));
  const page = writable(initial?.page ?? { number: 1, size: DELIVERY_PAGE_SIZE, totalItems: 0 });
  const source = writable(filters.source ?? '');
  const status = writable(filters.status ?? '');
  const endpointId = writable(/** @type {number | null} */ (filters.endpointId ?? null));
  const loading = writable(false);
  /** True once a read failed, until the next one succeeds. */
  const failed = writable(false);
  /** The delivery open in the detail dialog: `null`, or the answer of `GET /webhook-deliveries/:id`. */
  const detail = writable(/** @type {any} */ (null));
  const detailLoading = writable(false);
  const redelivering = writable(/** @type {number | null} */ (null));

  let requestTag = 0;
  let detailTag = 0;

  function fail(error) {
    const { key, values } = describeError(error);

    notify.error(key, values);
  }

  /**
   * Reads one page with the current filters. A page number that no longer exists (rows were
   * deleted) falls back to the first page once.
   *
   * @param {number} [number]
   */
  async function load(number = 1) {
    const tag = ++requestTag;

    loading.set(true);

    try {
      const query = {
        endpointId: get(endpointId),
        source: get(source),
        status: get(status),
        page: number,
      };
      let result = await api.listDeliveries(query);

      if (tag !== requestTag) return false;

      if (!result.ok && result.error.code === 'PAGE_NOT_FOUND' && number > 1) {
        result = await api.listDeliveries({ ...query, page: 1 });

        if (tag !== requestTag) return false;
      }

      if (!result.ok) {
        failed.set(true);

        // A deleted endpoint ends the per-endpoint view.
        if (result.error.code === 'WEBHOOK_NOT_FOUND') endpointId.set(null);

        fail(result.error);

        return false;
      }

      failed.set(false);
      items.set(result.body.items ?? []);
      page.set(result.body.page ?? { number: 1, size: DELIVERY_PAGE_SIZE, totalItems: 0 });

      return true;
    } finally {
      if (tag === requestTag) loading.set(false);
    }
  }

  const reload = () => load(get(page).number ?? 1);

  function setSource(value) {
    source.set(value ?? '');

    return load(1);
  }

  function setStatus(value) {
    status.set(value ?? '');

    return load(1);
  }

  /** Narrows the log to one endpoint (or back to all with `null`). */
  function setEndpoint(id) {
    endpointId.set(id ?? null);

    return load(1);
  }

  const gotoPage = (number) => load(number);

  /** Opens a delivery's detail: the stored body and the last response come with the single read. */
  async function open(row) {
    const tag = ++detailTag;

    detail.set(null);
    detailLoading.set(true);

    try {
      const result = await api.getDelivery(row.id);

      if (tag !== detailTag) return null;

      if (!result.ok) {
        fail(result.error);

        if (result.error.code === 'WEBHOOK_NOT_FOUND') await reload();

        return null;
      }

      detail.set(result.body);

      return result.body;
    } finally {
      if (tag === detailTag) detailLoading.set(false);
    }
  }

  function closeDetail() {
    detailTag++;
    detail.set(null);
    detailLoading.set(false);
  }

  async function redeliver(row) {
    redelivering.set(row.id);

    try {
      const result = await api.redeliver(row.id);

      if (!result.ok) {
        fail(result.error);

        // A row that moved on (in flight now) or is gone: show what it is today.
        if (['WEBHOOK_IN_FLIGHT', 'WEBHOOK_NOT_FOUND'].includes(result.error.code)) await reload();

        return false;
      }

      notify.success('pages.webhooks.deliveries.redelivered');
      await reload();

      return true;
    } finally {
      redelivering.set(null);
    }
  }

  function requestRedeliver(row) {
    confirm(
      {
        title: 'pages.webhooks.deliveries.redeliver.title',
        description: 'pages.webhooks.deliveries.redeliver.description',
        confirmLabel: 'pages.webhooks.deliveries.redeliver.confirm',
        variant: 'primary',
      },
      () => redeliver(row),
    );
  }

  return {
    catalogue,
    names,
    items,
    page,
    source,
    status,
    endpointId,
    loading,
    failed,
    detail,
    detailLoading,
    redelivering,
    load,
    reload,
    setSource,
    setStatus,
    setEndpoint,
    gotoPage,
    open,
    closeDetail,
    redeliver,
    requestRedeliver,
  };
}
