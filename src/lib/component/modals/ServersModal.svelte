<!-- Servers Modal -->
<div class="modal fade" bind:this={$modalElement} role="dialog" data-bs-scroll="true" tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('components.modals.servers.servers')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          class="btn-close"
          on:click={hide}
          title={$_('buttons.close')}
          type="button">
        </button>
      </div>

      <div class="modal-body">
        <div class="row row-cols-1 row-cols-lg-3 g-3">
          {#if $loading}
            {#each Array(4) as _, i}
              <div class="col">
                <div class="card h-100">
                  <div class="card-body">
                    <div class="card-text placeholder-glow">
                      <span class="placeholder col-3"></span>
                    </div>
                    <div class="placeholder-glow">
                      <span class="placeholder col-7"></span>
                    </div>
                    <div class="card-text placeholder-glow">
                      <span class="placeholder col-3"></span>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            {#each $servers as server, index (server)}
              <!-- Server Card -->

              <div class="col">
                <div class="ratio ratio-1x1">
                  <div class="card">
                    <div
                      class="card-header d-flex justify-content-center align-items-center vstack gap-2">
                      <img
                        src={server.favicon ? server.favicon : base + '/assets/img/server-icon.png'}
                        class="rounded border"
                        height="64"
                        width="64"
                        title={server.customName || server.name}
                        alt={server.customName || server.name} />

                      <div>
                        {#if server.id === $mainServer.id}
                          <i
                            class="fa fa-crown me-1 text-secondary"
                            title={$_('components.modals.servers.main-server')}>
                          </i>
                        {/if}
                        {server.customName || server.name}
                      </div>
                    </div>
                    <div class="card-body d-flex flex-column justify-content-center">
                      <ul class="list-unstyled d-flex flex-column gap-2 text-center">
                        <li>
                          <div
                            class="badge rounded-pill text-bg-primary"
                            class:text-bg-success={server.status === 'ONLINE'}>
                            <div
                              use:tooltip={[
                                $_('components.modals.servers.online'),
                                { placement: 'bottom' },
                              ]}>
                              {server.type}
                            </div>
                          </div>
                        </li>
                        <li>
                          <code class="user-select-all">{server.host}:{server.port}</code>
                        </li>
                        <li>
                          {server.playerCount}/{server.maxPlayerCount}
                        </li>
                      </ul>
                    </div>
                    <div class="card-footer d-flex justify-content-center">
                      <button
                        type="button"
                        class:active={$selectedServer?.id === server.id}
                        data-bs-toggle="button"
                        class="btn"
                        class:btn-primary={$selectedServer?.id === server.id}
                        class:btn-outline-primary={$selectedServer?.id !== server.id}
                        class:disabled={$selectedServer?.id === server.id}
                        on:click={() => ($selectingServer ? {} : onSelect(server))}
                        >{#if $selectedServer?.id === server.id}
                          <i class="fas fa-check-circle"></i>
                        {:else}
                          <i class="far fa-check-circle"></i>
                        {/if}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- No Server -->
      {#if $servers.length === 0 && !$loading}
        <NoContent />
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const servers = writable([]);
  const loading = writable(true);
  const selectingServer = writable(null);

  export function show() {
    modal = new window.bootstrap.Modal(get(modalElement));

    selectingServer.set(null);
    loading.set(true);

    modal.show();

    initData();
  }

  export function hide() {
    hideCallback();

    modal.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }

  function initData() {
    ApiUtil.get({
      path: `/api/panel/servers`,
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        servers.set(body.servers);
        loading.set(false);
      },
    });
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { invalidateAll } from '$app/navigation';
  import { base } from '$app/paths';

  import { show as showToast } from '$lib/component/ToastContainer.svelte';
  import NoContent from '$lib/component/NoContent.svelte';

  const mainServer = getContext('mainServer');
  const selectedServer = getContext('selectedServer');

  function onSelect(server) {
    selectingServer.set(server.id);

    ApiUtil.post({
      path: `/api/panel/servers/${server.id}/select`,
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          $selectedServer = server;
          await invalidateAll();
          hide();
          await showToast('components.toasts.server-selected', {
            name: server.customName || server.name,
          });

          return;
        } else if (body.error && body.error === 'NOT_EXISTS') {
          await showToast('components.toasts.server-not-exists');
          initData();

          return;
        }

        reject();
      },
    });
  }
</script>
