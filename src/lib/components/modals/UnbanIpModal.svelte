<!-- Unban / remove IP ban (confirm) -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_('components.modals.unban-ip.title', {
          values: { ip: $bannedIp?.ip ?? '' },
        })}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={onSubmit}>
          {$_('buttons.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const bannedIp = writable({ id: 0, ip: '' });

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show(newBannedIp) {
    bannedIp.set(newBannedIp);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    hideCallback(get(bannedIp));

    modal?.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import ApiUtil from '$lib/api.util.js';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import { _ } from 'svelte-i18n';

  let loading;

  function onSubmit() {
    const row = $bannedIp;
    if (!row?.id) {
      return;
    }

    loading = true;

    ApiUtil.delete({
      path: `/api/panel/banned-ips/${row.id}`,
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === 'NOT_EXISTS') {
            location.reload();
            return;
          }

          reject(body.error);
          loading = false;
          return;
        }

        hide();

        showToast('components.toasts.ip-unban.done', {
          values: { ip: row.ip },
        });

        callback();
        loading = false;
      },
    });
  }
</script>
