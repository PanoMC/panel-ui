<!-- One delivery with its stored body and the last response. -->
<div class="modal fade" bind:this={element} role="dialog" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.webhooks.deliveries.detail.title')}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <div class="modal-body">
        {#if $detailLoading}
          <div class="text-center text-body-secondary py-4">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </div>
        {:else if $detail}
          <dl class="row mb-0" data-delivery-detail>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.status')}</dt>
            <dd class="col-sm-8">
              <span class="badge {statusBadgeClass($detail.status)}">
                {$_(`pages.webhooks.status.${$detail.status}`)}
              </span>
            </dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.event')}</dt>
            <dd class="col-sm-8 text-break font-monospace">{$detail.event ?? '—'}</dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.detail.url')}</dt>
            <dd class="col-sm-8 text-break">{$detail.url ?? '—'}</dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.attempts')}</dt>
            <dd class="col-sm-8">{$detail.attempts ?? 0}/{$detail.maxAttempts ?? '—'}</dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.http')}</dt>
            <dd class="col-sm-8">{$detail.lastStatusCode ?? '—'}</dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.duration')}</dt>
            <dd class="col-sm-8">
              {$detail.durationMs == null
                ? '—'
                : $_('pages.webhooks.deliveries.ms', { values: { ms: $detail.durationMs } })}
            </dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.detail.error')}</dt>
            <dd class="col-sm-8 text-break">{$detail.lastError || '—'}</dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.created')}</dt>
            <dd class="col-sm-8">
              {#if $detail.createdAt}<DateText time={$detail.createdAt} fullFormat />{:else}—{/if}
            </dd>
            <dt class="col-sm-4">{$_('pages.webhooks.deliveries.table.delivered')}</dt>
            <dd class="col-sm-8">
              {#if $detail.deliveredAt}<DateText
                  time={$detail.deliveredAt}
                  fullFormat />{:else}—{/if}
            </dd>
          </dl>

          {#if bodyText}
            <h6 class="mt-4">{$_('pages.webhooks.deliveries.detail.body')}</h6>
            <pre class="mb-0 text-wrap" data-delivery-body>{bodyText}</pre>
          {/if}
          {#if responseText}
            <h6 class="mt-4">{$_('pages.webhooks.deliveries.detail.response')}</h6>
            <pre class="mb-0 text-wrap" data-delivery-response>{responseText}</pre>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import DateText from '$lib/components/Date.svelte';

  import { prettyText, statusBadgeClass } from './webhooks.util.js';

  /**
   * @type {{ controller: ReturnType<typeof import('./deliveries.controller.js').createDeliveriesController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { detail, detailLoading } = controller;

  let element = $state();
  let modal;

  const bodyText = $derived($detail ? prettyText($detail.body) : '');
  const responseText = $derived($detail ? prettyText($detail.lastResponse) : '');

  /** Opens the dialog and reads the delivery. */
  export async function show(row) {
    if (!window.bootstrap?.Modal) return;

    modal = window.bootstrap.Modal.getOrCreateInstance(element);
    modal.show();

    const opened = await controller.open(row);

    // A failed read leaves nothing to show.
    if (!opened) modal.hide();
  }

  onMount(() => {
    const onHidden = () => controller.closeDetail();

    element.addEventListener('hidden.bs.modal', onHidden);

    return () => element.removeEventListener('hidden.bs.modal', onHidden);
  });
</script>
