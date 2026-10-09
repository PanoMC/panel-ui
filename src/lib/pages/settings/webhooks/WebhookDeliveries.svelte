<WebhookDeliveryModal bind:this={detailModal} {controller} />

<div class="card">
  <CardHeader>
    <div slot="left">
      {#if $endpointId}
        <button
          type="button"
          class="btn btn-sm btn-link p-0 me-2"
          data-clear-endpoint
          title={$_('pages.webhooks.deliveries.all-endpoints')}
          aria-label={$_('pages.webhooks.deliveries.all-endpoints')}
          onclick={() => controller.setEndpoint(null)}>
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        </button>
      {/if}
      {$_('pages.webhooks.deliveries.table-title', {
        values: { count: $page.totalItems ?? $items.length },
      })}
      {#if $endpointId}
        <span class="text-body-secondary" data-endpoint-name>
          &middot; {$names[$endpointId] ?? `#${$endpointId}`}
        </span>
      {/if}
    </div>
    <div slot="right" class="d-flex align-items-center gap-2">
      <select
        class="form-select form-select-sm"
        data-source-filter
        aria-label={$_('pages.webhooks.filters.source')}
        value={$source}
        onchange={(event) => controller.setSource(event.currentTarget.value)}>
        <option value="">{$_('pages.webhooks.filters.all-sources')}</option>
        {#each sources as item (item.value)}
          <option value={item.value}>{item.title}</option>
        {/each}
      </select>
      <select
        class="form-select form-select-sm"
        data-status-filter
        aria-label={$_('pages.webhooks.filters.status')}
        value={$status}
        onchange={(event) => controller.setStatus(event.currentTarget.value)}>
        <option value="">{$_('pages.webhooks.filters.all-statuses')}</option>
        {#each DELIVERY_STATUSES as item (item)}
          <option value={item}>{$_(`pages.webhooks.status.${item}`)}</option>
        {/each}
      </select>
    </div>
  </CardHeader>

  {#if $failed && $items.length === 0}
    <div class="card-body">
      <div class="alert alert-danger d-flex align-items-center mb-0" role="alert" data-load-failed>
        <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
        <div class="flex-grow-1">{$_('pages.webhooks.load-failed')}</div>
        <button
          type="button"
          title={$_('buttons.try-again')}
          aria-label={$_('buttons.try-again')}
          class="btn alert-btn ms-3"
          onclick={() => controller.reload()}>
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  {:else if $items.length === 0}
    <NoContent icon="" text={$_('pages.webhooks.deliveries.empty')} />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="align-middle text-nowrap" scope="col"></th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.event')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.endpoint')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.subject')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.status')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.attempts')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.http')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.duration')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.webhooks.deliveries.table.created')}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each $items as row (row.id)}
            <tr data-delivery-row={row.id}>
              <th scope="row" class="align-middle text-center">
                <div class="dropdown position-static">
                  <button
                    type="button"
                    class="btn btn-link"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title={$_('pages.webhooks.deliveries.actions')}
                    aria-label={$_('pages.webhooks.deliveries.actions')}>
                    <span class="fas fa-ellipsis-v"></span>
                  </button>
                  <div class="dropdown-menu dropdown-menu-start">
                    <button
                      type="button"
                      class="dropdown-item"
                      data-action="view"
                      onclick={() => detailModal?.show(row)}>
                      <i class="fas fa-eye me-2"></i>
                      {$_('buttons.view')}
                    </button>
                    {#if canRedeliver(row)}
                      <button
                        type="button"
                        class="dropdown-item"
                        data-action="redeliver"
                        disabled={$redelivering === row.id}
                        onclick={() => controller.requestRedeliver(row)}>
                        <i class="fas fa-rotate-right me-2"></i>
                        {$_('pages.webhooks.deliveries.redeliver.button')}
                      </button>
                    {/if}
                  </div>
                </div>
              </th>
              <td class="align-middle text-nowrap font-monospace">{row.event}</td>
              <td class="align-middle text-nowrap">
                {#if row.endpointId}
                  {$names[row.endpointId] ?? `#${row.endpointId}`}
                {:else}
                  <span class="text-body-secondary">{$_('pages.webhooks.deliveries.direct')}</span>
                {/if}
              </td>
              <td class="align-middle text-nowrap">
                {#if row.subjectRef}{row.subjectRef}{:else}<span class="text-body-secondary">—</span
                  >{/if}
              </td>
              <td class="align-middle text-nowrap">
                <span class="badge {statusBadgeClass(row.status)}">
                  {$_(`pages.webhooks.status.${row.status}`)}
                </span>
              </td>
              <td class="align-middle text-nowrap">{row.attempts ?? 0}/{row.maxAttempts ?? '—'}</td>
              <td class="align-middle text-nowrap">{row.lastStatusCode ?? '—'}</td>
              <td class="align-middle text-nowrap">
                {row.durationMs == null
                  ? '—'
                  : $_('pages.webhooks.deliveries.ms', { values: { ms: row.durationMs } })}
              </td>
              <td class="align-middle text-nowrap">
                {#if row.createdAt}<DateText time={row.createdAt} fullFormat />{:else}—{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if pageCount($page) > 1}
      <div class="card-footer">
        <Pagination
          page={$page}
          on:firstPageClick={() => controller.gotoPage(1)}
          on:lastPageClick={() => controller.gotoPage(pageCount($page))}
          on:pageLinkClick={(event) => controller.gotoPage(event.detail.page)} />
      </div>
    {/if}
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateText from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { pageCount } from '$lib/components/pagination.util.js';

  import WebhookDeliveryModal from './WebhookDeliveryModal.svelte';
  import {
    DELIVERY_STATUSES,
    canRedeliver,
    sourceOptions,
    statusBadgeClass,
  } from './webhooks.util.js';

  /**
   * The Deliveries tab: the log with a source and a status filter, the detail dialog and redeliver.
   * @type {{ controller: ReturnType<typeof import('./deliveries.controller.js').createDeliveriesController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { items, page, source, status, endpointId, failed, redelivering, catalogue, names } =
    controller;

  let detailModal = $state();

  const sources = $derived(sourceOptions($catalogue, $source));
</script>
