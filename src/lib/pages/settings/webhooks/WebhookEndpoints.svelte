<WebhookModal bind:this={modal} {controller} {notify} />

<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.webhooks.endpoints.table-title', {
        values: { count: $visible.length, max: $limit },
      })}
    </div>
    <div slot="right" class="d-flex align-items-center gap-2">
      {#if sources.length > 0}
        <select
          class="form-select form-select-sm"
          data-source-filter
          aria-label={$_('pages.webhooks.filters.source')}
          value={$source}
          onchange={(event) => source.set(event.currentTarget.value)}>
          <option value="">{$_('pages.webhooks.filters.all-sources')}</option>
          {#each sources as item (item.value)}
            <option value={item.value}>{item.title}</option>
          {/each}
        </select>
      {/if}
      <button
        type="button"
        class="btn btn-sm btn-link text-nowrap"
        disabled={$full}
        data-create-endpoint
        onclick={() => modal?.show()}>
        <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
        {$_('pages.webhooks.endpoints.create')}
      </button>
    </div>
  </CardHeader>

  {#if $visible.length === 0}
    <NoContent icon="" text={$_('pages.webhooks.endpoints.empty')} />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="align-middle text-nowrap" scope="col"></th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.endpoints.table.name')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.endpoints.table.url')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.endpoints.table.events')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.endpoints.table.format')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.endpoints.table.status')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.endpoints.table.last-delivery')}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each $visible as endpoint (endpoint.id)}
            {@const status = endpointStatus(endpoint)}
            {@const count = eventsCount(endpoint)}
            <tr data-endpoint-row={endpoint.id}>
              <th scope="row" class="align-middle text-center">
                <div class="dropdown position-static">
                  <button
                    type="button"
                    class="btn btn-link"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title={$_('pages.webhooks.endpoints.actions')}
                    aria-label={$_('pages.webhooks.endpoints.actions')}>
                    <span class="fas fa-ellipsis-v"></span>
                  </button>
                  <div class="dropdown-menu dropdown-menu-start">
                    <button
                      type="button"
                      class="dropdown-item"
                      data-action="edit"
                      onclick={() => modal?.show(endpoint)}>
                      <i class="fas fa-pen me-2"></i>
                      {$_('buttons.edit')}
                    </button>
                    <button
                      type="button"
                      class="dropdown-item"
                      data-action="test"
                      disabled={$busy === endpoint.id}
                      onclick={() => controller.test(endpoint)}>
                      <i class="fas fa-paper-plane me-2"></i>
                      {$_('pages.webhooks.endpoints.send-test')}
                    </button>
                    <button
                      type="button"
                      class="dropdown-item"
                      data-action="deliveries"
                      onclick={() => onShowDeliveries(endpoint)}>
                      <i class="fas fa-list me-2"></i>
                      {$_('pages.webhooks.endpoints.deliveries')}
                    </button>
                    {#if endpoint.signing === 'HMAC_SHA256'}
                      <button
                        type="button"
                        class="dropdown-item"
                        data-action="regenerate"
                        disabled={$busy === endpoint.id}
                        onclick={() =>
                          controller.requestRegenerate(endpoint, (s) => modal?.reveal(s))}>
                        <i class="fas fa-key me-2"></i>
                        {$_('pages.webhooks.endpoints.regenerate.button')}
                      </button>
                    {/if}
                    <button
                      type="button"
                      class="dropdown-item"
                      data-action="toggle"
                      disabled={$busy === endpoint.id}
                      onclick={() => controller.toggle(endpoint)}>
                      <i class="fas {endpoint.enabled ? 'fa-pause' : 'fa-play'} me-2"></i>
                      {endpoint.enabled
                        ? $_('pages.webhooks.endpoints.disable')
                        : $_('pages.webhooks.endpoints.enable')}
                    </button>
                    <button
                      type="button"
                      class="dropdown-item link-danger"
                      data-action="delete"
                      disabled={$busy === endpoint.id}
                      onclick={() => controller.requestDelete(endpoint)}>
                      <i class="fas fa-trash me-2"></i>
                      {$_('buttons.delete')}
                    </button>
                  </div>
                </div>
              </th>
              <td class="align-middle text-break">{endpoint.name}</td>
              <td class="align-middle text-nowrap" title={endpoint.url}>
                {shortUrl(endpoint.url)}
              </td>
              <td class="align-middle text-nowrap">
                {count === null ? $_('pages.webhooks.endpoints.all-events') : count}
              </td>
              <td class="align-middle text-nowrap">
                {#if endpoint.format === 'DISCORD'}
                  <i class="fa-brands fa-discord me-1" aria-hidden="true"></i>
                {/if}
                {$_(`pages.webhooks.format.${endpoint.format === 'DISCORD' ? 'DISCORD' : 'JSON'}`)}
              </td>
              <td class="align-middle text-nowrap">
                {#if status.kind === 'enabled'}
                  <span class="badge text-bg-success"
                    >{$_('pages.webhooks.endpoints.enabled')}</span>
                {:else}
                  <span class="badge text-bg-secondary">
                    {$_('pages.webhooks.endpoints.disabled')}
                  </span>
                  {#if status.auto}
                    <span class="badge text-bg-danger ms-1" data-auto-disabled>
                      {$_('pages.webhooks.endpoints.auto-disabled')}
                    </span>
                  {/if}
                {/if}
              </td>
              <td class="align-middle text-nowrap">
                {#if endpoint.lastDeliveryAt}
                  {endpoint.lastStatusCode ?? ''}
                  <DateText time={endpoint.lastDeliveryAt} fullFormat />
                {:else}
                  <span class="text-body-secondary">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateText from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';

  import WebhookModal from './WebhookModal.svelte';
  import { endpointStatus, eventsCount, shortUrl, sourceOptions } from './webhooks.util.js';

  /**
   * The Endpoints tab: the webhook endpoints with their menu (edit, test, deliveries, regenerate
   * the secret, switch, delete) and the create / edit dialog.
   * @type {{ controller: ReturnType<typeof import('./endpoints.controller.js').createEndpointsController>, notify?: any, onShowDeliveries?: (endpoint: any) => void }}
   */
  let { controller, notify = undefined, onShowDeliveries = () => {} } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { visible, limit, full, busy, source, catalogue } = controller;

  let modal = $state();

  const sources = $derived(sourceOptions($catalogue, $source));
</script>
