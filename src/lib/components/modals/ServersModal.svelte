<!-- Servers Modal -->
<div
  class="modal fade"
  bind:this={modalEl}
  on:keydown|capture={handleModalSearchKeydown}
  on:shown.bs.modal={onModalShown}
  on:hidden.bs.modal={onModalHidden}
  role="dialog"
  data-bs-scroll="true"
  tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <div class="row w-100 align-items-center g-0">
          <div class="col-4 d-flex flex-wrap align-items-center gap-2">
            <h5 class="modal-title mb-0">
              {$_('components.modals.servers.servers')}
            </h5>
            <button
              class="btn btn-sm btn-primary"
              on:click={openConnectServer}
              type="button"
              aria-label={$_('components.modals.servers.connect-server-button')}>
              <i class="fa-solid fa-plug me-1" aria-hidden="true"></i>
              {$_('components.modals.servers.connect-server-button')}
            </button>
          </div>
          <div class="col-4">
            {#if !$loading && $otherServers.length > 0}
              <SearchInput
                inputId={SERVERS_MODAL_SEARCH_INPUT_ID}
                placeholderKey="components.modals.servers.search-placeholder"
                initialValue={$searchTerm}
                onchange={(v) => searchTerm.set(v)} />
            {/if}
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
          <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
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
          </div>
        {:else if $pinnedServers.length === 0 && $otherServers.length === 0}
          <NoContent />
        {:else}
          <div class="d-flex flex-column gap-3">
            {#if $pinnedServers.length > 0}
              <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                {#each $pinnedServers as server (server.id)}
                  <ServersModalServerCard
                    {server}
                    selectingServerId={$selectingServer}
                    {copiedId}
                    onSelectCard={onSelect}
                    onCopy={onCopy} />
                {/each}
              </div>
            {/if}

            {#if $otherServers.length > 0}
              {#if $pinnedServers.length > 0}
                <div
                  class="d-flex align-items-center gap-2 my-1"
                  role="separator"
                  aria-label={$_('components.modals.servers.other-servers-heading')}>
                  <hr class="flex-grow-1 m-0 opacity-50" />
                  <span class="small text-body-secondary text-nowrap px-1">
                    {$_('components.modals.servers.other-servers-heading')}
                  </span>
                  <hr class="flex-grow-1 m-0 opacity-50" />
                </div>
              {/if}

              {#if filteredOtherServers.length > 0}
                <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                  {#each filteredOtherServers as server (server.id)}
                    <ServersModalServerCard
                      {server}
                      selectingServerId={$selectingServer}
                      {copiedId}
                      onSelectCard={onSelect}
                      onCopy={onCopy} />
                  {/each}
                </div>
              {:else if $searchTerm}
                <div
                  class="d-flex w-100 justify-content-center align-items-center text-center text-body-secondary small py-4">
                  {$_('components.modals.servers.search-no-matches')}
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const pinnedServers = writable([]);
  const otherServers = writable([]);
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

        const hasNewShape = body.pinned != null || body.otherServers != null;
        const list = body.servers ?? [];

        if (hasNewShape) {
          pinnedServers.set(body.pinned ?? []);
          otherServers.set(body.otherServers ?? []);
        } else {
          pinnedServers.set([]);
          otherServers.set(list);
        }

        loading.set(false);
      },
    });
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { get as getStore } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import copy from 'copy-to-clipboard';
  import {
    onPanelServerRemoved,
    onPanelServerUpdate,
    setPanelServersListSubscription,
  } from '$lib/panelRealtime.js';

  import { show as showConnectServerModal } from './ConnectServerModal.svelte';
  import ServersModalServerCard from './ServersModalServerCard.svelte';

  const selectedServer = getContext('selectedServer');

  const SERVERS_MODAL_SEARCH_INPUT_ID = 'servers-modal-search-input';

  let modalEl;
  $: modalElement.set(modalEl);

  let serversModalOpen = false;

  function onModalShown() {
    serversModalOpen = true;
    setPanelServersListSubscription(true);
  }

  function onModalHidden() {
    serversModalOpen = false;
    setPanelServersListSubscription(false);
  }

  let copiedId = null;
  let copiedTimeout;

  function openConnectServer() {
    if (!browser) return;
    if (!modalEl) {
      showConnectServerModal();
      return;
    }
    const onHidden = () => {
      modalEl.removeEventListener('hidden.bs.modal', onHidden);
      showConnectServerModal();
    };
    modalEl.addEventListener('hidden.bs.modal', onHidden);
    const inst = window.bootstrap?.Modal?.getOrCreateInstance(modalEl);
    inst?.hide();
  }

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

  function isTextFieldElement(target) {
    if (!target || target.nodeType !== 1) return false;
    const t = target.nodeName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return true;
    return !!target.isContentEditable;
  }

  function focusSearchInput() {
    if (getStore(otherServers).length === 0) return;
    const el = document.getElementById(SERVERS_MODAL_SEARCH_INPUT_ID);
    if (!el) return;
    el.focus();
    requestAnimationFrame(() => {
      const len = (getStore(searchTerm) ?? '').length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        // ignore
      }
    });
  }

  function handleModalSearchKeydown(e) {
    if (!modalEl?.classList?.contains('show')) return;
    if (getStore(otherServers).length === 0) return;
    if (e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab') return;

    const target = e.target;

    if (isTextFieldElement(target)) {
      if (e.key === 'Escape' && (getStore(searchTerm) ?? '').length > 0) {
        e.stopPropagation();
        searchTerm.set('');
        focusSearchInput();
      }
      return;
    }

    if (e.key === 'Escape' && (getStore(searchTerm) ?? '').length > 0) {
      e.preventDefault();
      e.stopPropagation();
      searchTerm.set('');
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      searchTerm.update((s) => (s || '').slice(0, -1));
      focusSearchInput();
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      searchTerm.update((s) => (s || '') + e.key);
      focusSearchInput();
    }
  }

  $: filteredOtherServers = $otherServers.filter(
    (s) =>
      (s.customName || s.name || '').toLowerCase().includes($searchTerm.toLowerCase()) ||
      (s.host || '').toLowerCase().includes($searchTerm.toLowerCase())
  );

  onMount(() => {
    const u1 = onPanelServerUpdate((server) => {
      if (!serversModalOpen || !server || server.id == null) {
        return;
      }
      const merge = (list) => {
        const i = list.findIndex((s) => Number(s.id) === Number(server.id));
        if (i < 0) {
          return list;
        }
        const next = [...list];
        next[i] = { ...next[i], ...server };
        return next;
      };
      pinnedServers.update(merge);
      otherServers.update(merge);
    });
    const u2 = onPanelServerRemoved((id) => {
      if (!serversModalOpen) {
        return;
      }
      pinnedServers.update((l) => l.filter((s) => s.id !== id));
      otherServers.update((l) => l.filter((s) => s.id !== id));
    });
    return () => {
      u1();
      u2();
    };
  });

  onDestroy(() => {
    if (browser) {
      setPanelServersListSubscription(false);
    }
  });

  function onSelect(server) {
    selectingServer.set(server.id);

    ApiUtil.post({
      path: `/api/panel/servers/${server.id}/select`,
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          $selectedServer = server;
          await invalidateAll();
          selectingServer.set(null);
          hide();
          await showToast('components.toasts.server-selected', {
            name: server.customName || server.name,
          });

          return;
        } else if (body.error && body.error === 'NOT_EXISTS') {
          selectingServer.set(null);
          await showToast('components.toasts.server-not-exists');
          initData();

          return;
        }

        selectingServer.set(null);
        reject();
      },
    });
  }
</script>
