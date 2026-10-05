<!-- Confirm Close Ticket Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">
          {$selectedTickets.length === 1
            ? $_('components.modals.confirm-close-ticket.title-single')
            : $_('components.modals.confirm-close-ticket.title-multi')}
        </h5>
        <div class="text-body-secondary">
          {$selectedTickets.length === 1
            ? $_('components.modals.confirm-close-ticket.description-single')
            : $_('components.modals.confirm-close-ticket.description-multi')}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link text-decoration-none col-6 m-0"
          data-bs-dismiss="modal"
          type="button"
          class:disabled={loading}
          aria-disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-primary col-6 m-0"
          type="button"
          class:disabled={loading}
          aria-disabled={loading}
          on:click={onYesClick}>
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$selectedTickets.length === 1 ? $_('buttons.close-ticket') : $_('buttons.close-tickets')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const selectedTickets = writable([]);

  let callback = (selectedTickets) => {};
  let hideCallback = (selectedTickets) => {};
  let modal;

  export function show(newSelectedTickets) {
    selectedTickets.set(newSelectedTickets);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback(get(selectedTickets));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';

  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';
  import { TicketStatuses } from '$lib/components/badges/TicketStatusBadge.svelte';
  import { base } from '$app/paths';

  let loading;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    ApiUtil.put({
      path: '/api/panel/tickets',
      body: {
        tickets: Object.values(get(selectedTickets).map((id) => parseInt(id))),
        status: TicketStatuses.CLOSED,
      },
      handler: async (body, reject) => {
        if (body.error) {
          refreshBrowserPage();

          return;
        }

        loading = false;

        hide();

        const count = get(selectedTickets).length;

        await showSuccessToast(
          count > 1
            ? 'components.toasts.ticket-closed.multi'
            : 'components.toasts.ticket-closed.single',
          { count, href: `${base}/tickets?pageType=CLOSED` },
        );

        callback(get(selectedTickets));
      },
    });
  }
</script>
