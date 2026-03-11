<!-- Servers Modal -->
<style>
  .server-card {
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    overflow: hidden;
  }

  @media (min-width: 576px) {
    .server-card {
      aspect-ratio: 1 / 1;
    }
  }

  .server-card :global(.card-body) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 1rem;
  }

  @media (min-width: 576px) {
    .server-card :global(.card-body) {
      padding: 0.75rem !important;
    }
  }

  .server-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-color: var(--bs-primary);
  }

  .server-card .text-truncate {
    max-width: 100%;
    white-space: nowrap;
  }

  .server-card .server-name {
    /* Restore original size */
  }

  .server-card .server-ip {
    font-size: 0.75rem;
  }

  .server-card .badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }

  .server-card .player-count {
    font-size: 0.7rem;
  }
</style>
<div class="modal fade" bind:this={modalEl} role="dialog" data-bs-scroll="true" tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <div class="row w-100 align-items-center g-0">
          <div class="col-4">
            <h5 class="modal-title">
              {$_('components.modals.servers.servers')}
            </h5>
          </div>
          <div class="col-4">
            <SearchInput
              placeholderKey="components.modals.servers.search-placeholder"
              initialValue={$searchTerm}
              onchange={(v) => searchTerm.set(v)} />
          </div>
          <div class="col-4 d-flex justify-content-end">
            <button
              aria-label={$_('buttons.close')}
              class="btn-close"
              on:click={hide}
              type="button">
            </button>
          </div>
        </div>
      </div>

      <div class="modal-body">
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
        {:else if $servers.length === 0 && !$loading}
          <NoContent />
        {:else}
          <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
            {#each filteredServers as server (server.id)}
              <!-- Server Card -->

              <div class="col">
                <div
                  class="card h-100 server-card position-relative"
                  class:border-primary={$selectedServer?.id === server.id}
                  class:border-2={$selectedServer?.id === server.id}
                  class:shadow-sm={$selectedServer?.id === server.id}
                  on:click={() => ($selectingServer ? {} : onSelect(server))}
                  on:keydown={(e) => handleKeyDown(e, server)}
                  use:tooltip={[
                    $selectedServer?.id !== server.id
                      ? $_('components.modals.servers.select-server-tooltip')
                      : '',
                    { placement: 'bottom' },
                  ]}
                  tabindex="0"
                  role="button">
                  {#if server.id === $mainServer.id}
                    <div
                      class="position-absolute top-0 end-0 p-2 text-warning"
                      use:tooltip={[$_('components.modals.servers.main-server')]}>
                      <i class="fa-solid fa-crown"></i>
                    </div>
                  {/if}

                  <div
                    class="card-body d-flex flex-column align-items-center text-center p-3">
                    <img
                      src={sanitizeImageSrc(
                        server.favicon ? server.favicon : base + '/assets/img/server-icon.png',
                        base + '/assets/img/server-icon.png'
                      )}
                      class="rounded border mb-2"
                      height="32"
                      width="32"
                      alt={server.customName || server.name} />

                    <div class="fw-bold text-truncate w-100 mb-1 server-name">
                      {server.customName || server.name}
                    </div>

                    <div class="small text-truncate w-100 mb-1 server-ip">
                      <code
                        class="user-select-all cursor-pointer"
                        on:click={(e) => onCopy(e, server)}
                        on:keydown={(e) => e.key === 'Enter' && onCopy(e, server)}
                        tabindex="0"
                        use:tooltip={[
                          copiedId === server.id
                            ? $_('components.modals.connect-server.copied')
                            : $_('buttons.copy'),
                          { placement: 'top', hideOnClick: false },
                        ]}>{server.host}:{server.port}</code>
                    </div>

                    <div class="mt-auto w-100">
                      <div
                        class="badge rounded-pill mb-1"
                        class:text-bg-success={server.status === 'ONLINE'}
                        class:text-bg-danger={server.status !== 'ONLINE'}>
                        {server.type}
                      </div>
                      <div class="player-count">
                        {server.playerCount}/{server.maxPlayerCount}
                      </div>
                    </div>
                  </div>

                  {#if $selectedServer?.id === server.id}
                    <div class="card-footer bg-primary text-white text-center py-1 small">
                      <i class="fas fa-check-circle me-1"></i> {$_('buttons.selected') || 'Selected'}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
            <!-- No Server -->
          </div>
        {/if}
      </div>
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
  const searchTerm = writable('');

  export function show() {
    const el = get(modalElement);
    if (!el) {
      console.warn('Modal element not found.');
      return;
    }

    modal = window.bootstrap?.Modal?.getOrCreateInstance(el);
    if (!modal) return;

    selectingServer.set(null);
    loading.set(true);
    searchTerm.set('');

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

  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { sanitizeImageSrc } from '$lib/security.util.js';
  import copy from 'copy-to-clipboard';

  const mainServer = getContext('mainServer');
  const selectedServer = getContext('selectedServer');

  let modalEl;
  $: modalElement.set(modalEl);

  let copiedId = null;
  let copiedTimeout;

  function onCopy(e, server) {
    e.stopPropagation();
    const text = `${server.host}:${server.port}`;
    copy(text);
    
    copiedId = server.id;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      copiedId = null;
    }, 2000);
  }

  function handleKeyDown(event, server) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!$selectingServer) {
        onSelect(server);
      }
    }
  }

  $: filteredServers = $servers.filter(
    (s) =>
      (s.customName || s.name || '').toLowerCase().includes($searchTerm.toLowerCase()) ||
      (s.host || '').toLowerCase().includes($searchTerm.toLowerCase())
  );

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
