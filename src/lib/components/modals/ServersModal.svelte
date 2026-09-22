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
      <div class="modal-header flex-column align-items-stretch gap-3">
        <div class="d-flex w-100 align-items-start justify-content-between gap-2">
          <div class="d-flex flex-wrap align-items-center gap-2 min-w-0">
            <h5 class="modal-title mb-0 text-break">
              {$_('components.modals.servers.servers')}
            </h5>
            <button
              class="btn btn-sm btn-primary flex-shrink-0"
              on:click={openConnectServer}
              type="button"
              aria-label={$_('components.modals.servers.connect-server-button')}>
              <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
              {$_('components.modals.servers.connect-server-button')}
            </button>
            <!-- How often the gauges refresh while the modal is open — the Overview's intervals. -->
            <select
              class="form-select form-select-sm w-auto"
              aria-label={$_('pages.servers.overview.refresh-interval')}
              bind:value={modalInterval}
              on:change={onModalIntervalChange}>
              {#each METRIC_REFRESH_INTERVALS as interval (interval)}
                <option value={interval}>{metricRefreshIntervalLabel(interval, $_)}</option>
              {/each}
            </select>
          </div>
          <button
            aria-label={$_('buttons.close')}
            class="btn-close flex-shrink-0 mt-1"
            on:click={hide}
            type="button">
          </button>
        </div>
        {#if !$loading && $otherServers.length > 0}
          <div class="w-100">
            <SearchInput
              inputId={SERVERS_MODAL_SEARCH_INPUT_ID}
              placeholderKey="components.modals.servers.search-placeholder"
              initialValue={$searchTerm}
              onchange={(v) => searchTerm.set(v)} />
          </div>
        {/if}
      </div>

      <div class="modal-body">
        {#if $loading}
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
            {#each Array(4) as _, i (i)}
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
              <div
                class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                {#each $pinnedServers as server (server.id)}
                  <ServersModalServerCard
                    {server}
                    selectingServerId={$selectingServer}
                    {copiedId}
                    onSelectCard={onSelect}
                    {onCopy}
                    latest={serverMetrics[server.id]?.latest ?? null} />
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
                <div
                  class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                  {#each filteredOtherServers as server (server.id)}
                    <ServersModalServerCard
                      {server}
                      selectingServerId={$selectingServer}
                      {copiedId}
                      onSelectCard={onSelect}
                      {onCopy}
                      latest={serverMetrics[server.id]?.latest ?? null} />
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
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import {
    showSuccess as showSuccessToast,
    showError as showErrorToast,
  } from '$lib/components/ToastContainer.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import copy from 'copy-to-clipboard';
  import {
    onPanelServerRemoved,
    onPanelServerUpdate,
    onServerMetrics,
    onTaskProgress,
    subscribePanelServersList,
    subscribeServersMetrics,
  } from '$lib/panelRealtime.js';
  import {
    loadMetricRefreshInterval,
    METRIC_REFRESH_INTERVAL_DEFAULT,
    METRIC_REFRESH_INTERVALS,
    metricRefreshIntervalLabel,
    metricRequestInterval,
    storeMetricRefreshInterval,
    createKeyedLatestThrottle,
  } from '$lib/metricsSeries.util.js';

  import { applyTaskFrame } from '$lib/servers.util.js';

  import { show as showAddServerModal } from './AddServerModal.svelte';
  import ServersModalServerCard from './ServersModalServerCard.svelte';

  const selectedServer = getContext('selectedServer');
  const usageMode = getContext('usageMode');

  const SERVERS_MODAL_SEARCH_INPUT_ID = 'servers-modal-search-input';

  let modalEl;
  $: modalElement.set(modalEl);

  /**
   * The old way the gauges refreshed (SM-53), kept as the fallback: a backend without the
   * multi-server metrics subscription sends no frames, and then the modal polls the bulk
   * endpoint at this pace instead.
   */
  const SERVER_METRICS_POLL_MS = 15000;
  const MODAL_INTERVAL_KEY = 'pano.panel.servers-modal.refresh-interval';

  let serversModalOpen = false;
  /** @type {(() => void) | null} */
  let releaseServersList = null;

  /**
   * Per server id, the `latest` sample the cards' gauges are drawn from, as
   * `GET /api/panel/servers-metrics` returns it. It stays empty on a backend that does not
   * serve that endpoint yet, and the gauges then simply read "—".
   *
   * @type {Record<string, { latest?: object|null }>}
   */
  let serverMetrics = {};
  /** @type {ReturnType<typeof setInterval> | null} */
  let metricsTimer = null;
  let metricsInFlight = false;
  /** Refresh interval of the gauges, in ms; 0 is Paused. Remembered per browser. */
  let modalInterval = browser
    ? loadMetricRefreshInterval(MODAL_INTERVAL_KEY)
    : METRIC_REFRESH_INTERVAL_DEFAULT;
  /** @type {{ release: () => void, update: (ids: Array<number|string>, intervalMs: number|null) => void } | null} */
  let metricsSubscription = null;
  /** @type {(() => void) | null} */
  let offMetricsFrames = null;
  /** When the last hub `metrics` frame for a listed server arrived; the polling fallback's cue. */
  let lastMetricsFrameAt = 0;

  // Every server the modal lists — pinned and the rest, search or not — so a card that the
  // search reveals already has live numbers.
  $: listedServerIds = [...$pinnedServers, ...$otherServers].map((server) => server.id);

  // The list and the interval travel with the subscription; changing either re-sends it.
  $: if (serversModalOpen && metricsSubscription) {
    metricsSubscription.update(listedServerIds, metricRequestInterval(modalInterval));
  }

  function onModalShown() {
    serversModalOpen = true;

    if (!releaseServersList) {
      releaseServersList = subscribePanelServersList();
    }

    startServerMetrics();
  }

  function onModalHidden() {
    serversModalOpen = false;
    releaseServersList?.();
    releaseServersList = null;
    stopServerMetrics();
  }

  function onModalIntervalChange() {
    storeMetricRefreshInterval(MODAL_INTERVAL_KEY, modalInterval);
  }

  /**
   * One live sample of one listed server: it becomes that card's `latest`. Paused keeps the
   * gauges on the picture they had.
   *
   * @param {{ serverId: number, sample: object | null }} frame
   */
  function onMetricsFrame(frame) {
    if (
      !serversModalOpen ||
      !frame?.sample ||
      !listedServerIds.some((id) => Number(id) === Number(frame.serverId))
    ) {
      return;
    }

    lastMetricsFrameAt = Date.now();

    if (modalInterval === 0) {
      return;
    }

    // At most one update per server per chosen interval, always the newest sample: a server with
    // both a node and a plugin gets a merged sample on each side's frame, and the hub sends the
    // fastest rate any watcher asked for.
    gaugeThrottle.setInterval(modalInterval);
    gaugeThrottle.push(frame.serverId, frame.sample);
  }

  const gaugeThrottle = createKeyedLatestThrottle((serverId, sample) => {
    if (!serversModalOpen || modalInterval === 0) {
      return;
    }

    const previous = serverMetrics[serverId] ?? {};

    serverMetrics = {
      ...serverMetrics,
      [serverId]: { ...previous, latest: { ...(previous.latest ?? {}), ...sample } },
    };
  });

  /**
   * One bulk call for every card in the grid — the per-server endpoint would mean one request
   * per card on every tick. A backend without it answers 404, which lands here as an error body
   * (or as plain text) and is ignored on purpose: the cards are still perfectly usable without
   * vitals, so nothing is toasted.
   */
  async function loadServerMetrics() {
    if (!browser || metricsInFlight) {
      return;
    }

    metricsInFlight = true;

    try {
      const body = await ApiUtil.get({
        path: `/api/panel/servers-metrics?range=1h`,
        handler: (response) => response,
      });

      if (!serversModalOpen) {
        return;
      }

      if (body && typeof body === 'object' && !body.error && body.servers) {
        serverMetrics = body.servers;
      }
    } finally {
      metricsInFlight = false;
    }
  }

  /**
   * One fetch for the initial numbers (and disk, which only changes every few minutes), then the
   * hub's per-server frames at the chosen interval. The 15-second poll only runs while no frame
   * has arrived for that long — a backend without the multi-server subscription.
   */
  function startServerMetrics() {
    void loadServerMetrics();

    lastMetricsFrameAt = Date.now();

    if (!offMetricsFrames) {
      offMetricsFrames = onServerMetrics(onMetricsFrame);
    }

    if (!metricsSubscription) {
      metricsSubscription = subscribeServersMetrics(
        listedServerIds,
        metricRequestInterval(modalInterval),
      );
    }

    if (metricsTimer == null) {
      metricsTimer = setInterval(() => {
        if (modalInterval !== 0 && Date.now() - lastMetricsFrameAt > SERVER_METRICS_POLL_MS) {
          void loadServerMetrics();
        }
      }, SERVER_METRICS_POLL_MS);
    }
  }

  function stopServerMetrics() {
    if (metricsTimer != null) {
      clearInterval(metricsTimer);
      metricsTimer = null;
    }

    metricsSubscription?.release();
    metricsSubscription = null;
    gaugeThrottle.cancel();
    offMetricsFrames?.();
    offMetricsFrames = null;
  }

  let copiedId = null;
  let copiedTimeout;

  function openConnectServer() {
    if (!browser) return;
    const openChooser = () => showAddServerModal(getStore(usageMode));
    if (!modalEl) {
      openChooser();
      return;
    }
    const onHidden = () => {
      modalEl.removeEventListener('hidden.bs.modal', onHidden);
      openChooser();
    };
    modalEl.addEventListener('hidden.bs.modal', onHidden);
    const inst = window.bootstrap?.Modal?.getOrCreateInstance(modalEl);
    inst?.hide();
  }

  function onCopy(e, server) {
    e.stopPropagation();
    copy(getPrimaryAddress(server));

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

  function getPrimaryAddress(server) {
    const remoteAddress = String(server?.remoteAddress || '').trim();
    return remoteAddress || server?.host || '';
  }

  function getLocalAddress(server) {
    return `${server?.host || ''}:${server?.port ?? ''}`;
  }

  $: filteredOtherServers = $otherServers.filter((s) => {
    const term = $searchTerm.toLowerCase();
    return (
      (s.customName || s.name || '').toLowerCase().includes(term) ||
      getPrimaryAddress(s).toLowerCase().includes(term) ||
      getLocalAddress(s).toLowerCase().includes(term)
    );
  });

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
    // SM-68 — a server's install/backup/... progress, so a card shows the build instead of a
    // plain "Offline" for ten minutes. Closed or not, the list stays current: the frames only
    // reach this session while the list is subscribed anyway.
    const u3 = onTaskProgress((frame) => {
      if (frame?.serverId == null) {
        return;
      }
      const apply = (list) => {
        const i = list.findIndex((s) => Number(s.id) === Number(frame.serverId));
        if (i < 0) {
          return list;
        }
        const updated = applyTaskFrame(list[i], frame);
        if (updated === list[i]) {
          return list;
        }
        const next = [...list];
        next[i] = updated;
        return next;
      };
      pinnedServers.update(apply);
      otherServers.update(apply);
    });
    return () => {
      u1();
      u2();
      u3();
    };
  });

  onDestroy(() => {
    releaseServersList?.();
    releaseServersList = null;
    stopServerMetrics();
  });

  function onSelect(server) {
    selectingServer.set(server.id);

    // The select call still runs so `basicData.selectedServer` remembers the last server the
    // admin opened, but the modal is a navigation now: every server page names its server in
    // the URL.
    ApiUtil.post({
      path: `/api/panel/servers/${server.id}/select`,
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          $selectedServer = server;
          await goto(`${base}/servers/${server.id}`, { invalidateAll: true });
          selectingServer.set(null);
          hide();
          await showSuccessToast('components.toasts.server-selected', {
            name: server.customName || server.name,
          });

          return;
        } else if (body.error && body.error === 'NOT_EXISTS') {
          selectingServer.set(null);
          await showErrorToast('components.toasts.server-not-exists');
          initData();

          return;
        }

        selectingServer.set(null);
        reject();
      },
    });
  }
</script>
