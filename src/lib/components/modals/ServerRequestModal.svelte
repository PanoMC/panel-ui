<!-- Server Connect Request Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      {#if $loading}
        <div class="modal-body">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      {:else}
        <div class="modal-header border-bottom-0">
          <button
            class="btn-close"
            aria-label={$_('buttons.close')}
            data-bs-dismiss="modal"
            type="button">
          </button>
        </div>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-plug fa-3x d-block m-auto text-gray"></i>
          </div>
          <p>
            {$_('components.modals.server-request.title', {
              values: { serverName: $server.name },
            })}
          </p>
          <div class="card">
            <div class="card-body">
              <div class="row">
                <div class="col-auto">
                  <img
                    src={$server.favicon ? $server.favicon : '/api/server/icon/default'}
                    class="rounded border"
                    width="48"
                    height="48"
                    alt={$server.name} />
                </div>
                <div class="col text-start">
                  <span class="badge text-bg-primary rounded-pill mb-2">{$server.type}</span>
                  <div class="d-flex flex-row justify-content-between">
                    <span class="font-monospace user-select-all"
                      >{$server.host}:{$server.port}</span>
                    <span>{$server.playerCount}/{$server.maxPlayerCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link link-danger col-6 m-0"
            type="button"
            class:disabled={$submitLoading}
            on:click={rejectServer}>
            {$_('components.modals.server-request.reject')}
          </button>
          <button
            class="btn btn-secondary col-6 m-0"
            type="button"
            class:disabled={$submitLoading}
            on:click={acceptServer}>
            {$_('components.modals.server-request.connect')}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil from '$lib/api.util.js';
  import { get, writable } from 'svelte/store';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;
  const defaultServer = {
    id: -1,
    name: '',
    playerCount: 0,
    maxPlayerCount: 0,
    type: '',
    version: '',
    favicon: '',
    permissionGranted: false,
    status: 'OFFLINE',
  };
  const server = writable(defaultServer);
  const loading = writable(true);
  const submitLoading = writable(false);

  export function show(serverId) {
    modal = new window.bootstrap.Modal(get(modalElement));

    loading.set(true);
    submitLoading.set(false);
    server.set(defaultServer);

    modal.show();

    initData(serverId);
  }

  export function hide() {
    modal.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }

  function showExpiredToast() {
    setTimeout(() => {
      hide();
    }, 500);

    showToast('components.toasts.expired-server-connect-request');
  }

  function initData(serverId) {
    ApiUtil.get({
      path: `/api/panel/servers/${serverId}`,
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === 'NOT_EXISTS') {
            showExpiredToast();

            return;
          }

          reject();

          return;
        }

        if (body.server.permissionGranted) {
          showExpiredToast();

          return;
        }

        server.set(body.server);
        loading.set(false);
      },
    });
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { invalidateAll } from '$app/navigation';

  const selectedServer = getContext('selectedServer');

  function acceptServer() {
    $submitLoading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/accept`,
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          callback($server);

          if (body.selected) {
            $selectedServer = $server;
            await invalidateAll();
            hide();

            await showToast('components.toasts.server-selected', {
              name: $server.name,
            });
          } else {
            await invalidateAll();
            hide();
          }

          await showToast('components.toasts.accepted-server-connect-request');
          $submitLoading = false;

          return;
        } else if (body.result === 'error') {
          hide();
          await showToast('components.toasts.expired-server-connect-request');
          $submitLoading = false;

          return;
        }

        reject();
      },
    });
  }

  function rejectServer() {
    $submitLoading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/reject`,
      handler: (body, reject) => {
        $submitLoading = false;

        if (body.result === 'ok') {
          callback($server);
          hide();
          showToast('components.toasts.rejected-server-connect');

          return;
        } else if (body.result === 'error') {
          hide();
          showToast('components.toasts.expired-server-connect-request');

          return;
        }

        reject();
      },
    });
  }
</script>
