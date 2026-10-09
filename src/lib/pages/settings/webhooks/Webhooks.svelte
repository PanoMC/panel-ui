<div class="vstack gap-3">
  <ul class="nav nav-tabs" role="tablist">
    {#each tabs as item (item.id)}
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          class:active={tab === item.id}
          id="webhooks-tab-{item.id}"
          role="tab"
          aria-selected={tab === item.id}
          aria-controls="webhooks-pane-{item.id}"
          data-tab={item.id}
          onclick={() => selectTab(item.id)}>
          <i class="{item.icon} me-1" aria-hidden="true"></i>
          {$_(item.titleKey)}
        </button>
      </li>
    {/each}
  </ul>

  <div
    id="webhooks-pane-endpoints"
    role="tabpanel"
    aria-labelledby="webhooks-tab-endpoints"
    hidden={tab !== 'endpoints'}>
    {#if endpointsController}
      <WebhookEndpoints
        controller={endpointsController}
        {notify}
        onShowDeliveries={showDeliveriesOf} />
    {:else}
      {@render loadFailed()}
    {/if}
  </div>

  <div
    id="webhooks-pane-deliveries"
    role="tabpanel"
    aria-labelledby="webhooks-tab-deliveries"
    hidden={tab !== 'deliveries'}>
    <WebhookDeliveries controller={deliveriesController} />
  </div>
</div>

{#snippet loadFailed()}
  <div class="alert alert-danger d-flex align-items-center mb-0" role="alert" data-load-failed>
    <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
    <div class="flex-grow-1">{$_('pages.webhooks.load-failed')}</div>
    <button
      type="button"
      title={$_('buttons.try-again')}
      aria-label={$_('buttons.try-again')}
      class="btn alert-btn ms-3"
      onclick={() => invalidateAll()}>
      <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
    </button>
  </div>
{/snippet}

<script module>
  import ApiUtil from '$lib/api.util';

  import { createWebhooksApi } from './webhooks.api.js';
  import { parseEndpointId } from './webhooks.util.js';

  /**
   * The three reads of the page. Each can fail alone, so a failed read is `null` and only its part
   * of the page says so. `?source=` narrows both tabs (the market settings link to it) and
   * `?endpointId=` opens the log of one endpoint.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    await event.parent();

    const api = createWebhooksApi(ApiUtil, event);
    const params = event.url.searchParams;
    const filters = {
      source: params.get('source') ?? '',
      status: '',
      endpointId: parseEndpointId(params.get('endpointId')),
    };
    const [endpoints, events, deliveries] = await Promise.all([
      api.listEndpoints(),
      api.listEvents(),
      api.listDeliveries(filters),
    ]);

    return {
      endpoints: endpoints.ok ? endpoints.body : null,
      events: events.ok ? events.body : null,
      deliveries: deliveries.ok ? deliveries.body : null,
      filters,
      tab: params.get('tab') === 'deliveries' || filters.endpointId ? 'deliveries' : 'endpoints',
    };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { derived } from 'svelte/store';

  import { invalidateAll } from '$app/navigation';

  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  import { createDeliveriesController } from './deliveries.controller.js';
  import { createEndpointsController } from './endpoints.controller.js';
  import WebhookDeliveries from './WebhookDeliveries.svelte';
  import WebhookEndpoints from './WebhookEndpoints.svelte';

  /**
   * The Webhooks page (Settings -> Webhooks): the endpoints and the delivery log. `api`, `notify`
   * and `confirm` default to the panel's own; they are props so a test can pass stubs.
   * @type {{ data: { endpoints: any, events: any, deliveries: any, filters: { source: string, status: string, endpointId: number | null }, tab?: string }, api?: any, notify?: any, confirm?: any }}
   */
  let {
    data,
    api = createWebhooksApi(ApiUtil),
    notify = {
      success: (key, values) => showSuccess(key, values),
      error: (key, values) => showError(key, values),
    },
    confirm = showConfirm,
  } = $props();

  const pageTitle = getContext('pageTitle');

  pageTitle?.set('pages.webhooks.title');

  const tabs = [
    { id: 'endpoints', icon: 'fa-solid fa-link', titleKey: 'pages.webhooks.tabs.endpoints' },
    { id: 'deliveries', icon: 'fa-solid fa-list', titleKey: 'pages.webhooks.tabs.deliveries' },
  ];

  // svelte-ignore state_referenced_locally
  let tab = $state(data.tab === 'deliveries' ? 'deliveries' : 'endpoints');

  // The controllers hold the state from here on; `data` only seeds them.
  // svelte-ignore state_referenced_locally
  const endpointsController = data.endpoints
    ? createEndpointsController({
        api,
        notify,
        confirm,
        initial: {
          endpoints: data.endpoints,
          events: data.events,
          source: data.filters?.source ?? '',
        },
      })
    : null;

  const names = endpointsController
    ? derived(endpointsController.items, (items) =>
        Object.fromEntries(items.map((endpoint) => [endpoint.id, endpoint.name])),
      )
    : undefined;

  // svelte-ignore state_referenced_locally
  const deliveriesController = createDeliveriesController({
    api,
    notify,
    confirm,
    initial: data.deliveries,
    filters: data.filters,
    catalogue: endpointsController?.catalogue,
    names,
  });

  function selectTab(id) {
    tab = id;

    // The log may have moved on while the other tab was open.
    if (id === 'deliveries') deliveriesController.reload();
  }

  /** The "Deliveries" action of an endpoint's menu: the log narrowed to that endpoint. */
  function showDeliveriesOf(endpoint) {
    tab = 'deliveries';
    deliveriesController.setEndpoint(endpoint.id);
  }
</script>
