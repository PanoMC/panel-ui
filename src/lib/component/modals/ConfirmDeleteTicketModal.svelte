<!-- Confirm Close Ticket Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$selectedTickets.length === 1
          ? $_('components.modals.confirm-delete-ticket.title-single')
          : $_('components.modals.confirm-delete-ticket.title-multi')}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled={loading}
          aria-disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled={loading}
          aria-disabled={loading}
          on:click={onYesClick}>
          {$_('buttons.yes')}
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
  import ApiUtil from '$lib/api.util';

  import { show as showToast } from '$lib/component/ToastContainer.svelte';
  import { _ } from 'svelte-i18n';

  let loading;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    ApiUtil.delete({
      path:
        '/api/panel/tickets?ids=' + Object.values(get(selectedTickets)).map((id) => parseInt(id)),
      handler: (body, reject) => {
        if (body.error) {
          refreshBrowserPage();
          return;
        }

        loading = false;

        hide();

        const count = get(selectedTickets).length;

        showToast(
          count > 1
            ? 'components.toasts.tickets-deleted-permanently.multi'
            : 'components.toasts.tickets-deleted-permanently.single',
          { count },
        );

        callback(get(selectedTickets));
      },
    });
  }
</script>
