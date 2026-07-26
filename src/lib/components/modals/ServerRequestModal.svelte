<!-- Server Connect Request Modal -->
<div
  id="serverRequestModal"
  aria-hidden="true"
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1">
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
                    src={sanitizeImageSrc(
                      $server.favicon ? $server.favicon : '/api/server/icon/default',
                      '/api/server/icon/default'
                    )}
                    class="rounded border"
                    width="48"
                    height="48"
                    alt={$server.name} />
                </div>
                <div class="col text-start">
                  <span class="badge text-bg-primary rounded-pill mb-2">{$server.type}</span>
                  <div class="d-flex flex-row justify-content-between gap-2 mb-1">
                    <span class="small text-body-secondary">{$_('buttons.remote')}:</span>
                    <span class="flex-shrink-0">{$server.playerCount}/{$server.maxPlayerCount}</span>
                  </div>
                  <div class="font-monospace user-select-all text-break mb-1">
                    {getPrimaryAddress($server)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="text-start px-2 mt-3 w-100">
            <label class="form-label small mb-1" for="acceptServerDisplayName">
              {$_('components.modals.server-request.display-name-label')}
            </label>
            <input
              id="acceptServerDisplayName"
              type="text"
              class="form-control form-control-sm"
              maxlength="255"
              bind:value={$acceptDisplayName}
              disabled={$submitLoading}
              autocomplete="off"
              aria-describedby="acceptServerDisplayNameHint" />
            <small id="acceptServerDisplayNameHint" class="text-muted d-block mt-1">
              {$_('components.modals.server-request.display-name-hint')}
            </small>
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

  import {
    showSuccess as showSuccessToast,
    showError as showErrorToast,
  } from '$lib/components/ToastContainer.svelte';

  const modalElement = writable();

  export const acceptDisplayName = writable('');

  let callback = () => {};
  let hideCallback = () => {};
  let modal;
  const defaultServer = {
    id: -1,
    name: '',
    customName: null,
    playerCount: 0,
    maxPlayerCount: 0,
    type: '',
    version: '',
    favicon: '',
    host: '',
    port: 0,
    remoteAddress: null,
    permissionGranted: false,
    status: 'OFFLINE',
  };
  const server = writable(defaultServer);
  const loading = writable(true);
  const submitLoading = writable(false);

  export function show(serverId) {
    const el = get(modalElement);
    modal = window.bootstrap.Modal.getOrCreateInstance(el);

    loading.set(true);
    submitLoading.set(false);
    server.set(defaultServer);
    acceptDisplayName.set('');

    modal.show();

    initData(serverId);
  }

  export function hide() {
    const el = get(modalElement);
    const inst = window.bootstrap.Modal.getInstance(el) || modal;
    inst?.hide();
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

    showErrorToast('components.toasts.expired-server-connect-request');
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
        acceptDisplayName.set(
          body.server.customName != null && String(body.server.customName).trim() !== ''
            ? String(body.server.customName).trim()
            : body.server.name || ''
        );
        loading.set(false);
      },
    });
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { get as getStore } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { sanitizeImageSrc } from '$lib/security.util.js';

  import { invalidateAll } from '$app/navigation';

  import { hideBootstrapModalAndWait } from '$lib/modal.util.js';

  const selectedServer = getContext('selectedServer');

  function getServerRequestModalEl() {
    return typeof document !== 'undefined' ? document.getElementById('serverRequestModal') : null;
  }

  function getPrimaryAddress(server) {
    const remoteAddress = String(server?.remoteAddress || '').trim();
    return remoteAddress || server?.host || '';
  }

  function acceptServer() {
    $submitLoading = true;

    const rawName = getStore(acceptDisplayName).trim().slice(0, 255);
    const customNamePayload = rawName.length === 0 ? null : rawName;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/accept`,
      body: { customName: customNamePayload },
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          callback($server);

          $selectedServer = { ...$server, permissionGranted: true, customName: customNamePayload };

          await hideBootstrapModalAndWait(getServerRequestModalEl());
          await invalidateAll();

          await showSuccessToast('components.toasts.server-selected', {
            name: customNamePayload ?? $server.name,
          });
          await showSuccessToast('components.toasts.accepted-server-connect-request');
          $submitLoading = false;

          return;
        } else if (body.result === 'error') {
          await hideBootstrapModalAndWait(getServerRequestModalEl());
          await showErrorToast('components.toasts.expired-server-connect-request');
          $submitLoading = false;

          return;
        }

        $submitLoading = false;
        reject();
      },
    });
  }

  function rejectServer() {
    $submitLoading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/reject`,
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          callback($server);
          await hideBootstrapModalAndWait(getServerRequestModalEl());
          $submitLoading = false;
          showSuccessToast('components.toasts.rejected-server-connect');

          return;
        } else if (body.result === 'error') {
          await hideBootstrapModalAndWait(getServerRequestModalEl());
          $submitLoading = false;
          showErrorToast('components.toasts.expired-server-connect-request');

          return;
        }

        $submitLoading = false;
        reject();
      },
    });
  }
</script>
