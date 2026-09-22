<style>
  .console-toolbar {
    min-width: 0;
  }

  .console-search {
    max-width: 260px;
  }
</style>

<svelte:window on:keydown={onWindowKeydown} />

<div class="container vstack gap-3">
  <!-- The log always streams from somebody (Pano keeps its own ring buffer), so what can be
       missing here is the prompt — and that is what the notice explains (§2.4.35). -->
  <ServerCapabilityNotice
    server={$server}
    feature="console.input"
    section="pages.servers.capabilities.commands" />

  <div class="card">
    <CardHeader rightClasses="console-toolbar">
      <span slot="left" class="d-flex align-items-center gap-2">
        {$_('pages.servers.console.title')}
        {#if sourceLabel}
          <!-- Where the lines come from, as an icon: the node's own pipe (managed) or the
               plugin's logger tap (linked). -->
          <i
            class="{sourceIcon} text-body-secondary small"
            role="img"
            aria-label={$_(sourceLabel)}
            use:tooltip={[$_(sourceLabel), { placement: 'bottom' }]}></i>
        {/if}
      </span>

      <span slot="right" class="d-flex flex-wrap align-items-center justify-content-end gap-2">
        <div class="console-search flex-grow-1">
          <SearchInput onchange={(value) => (query = value)} />
        </div>

        <div class="form-check form-switch m-0">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="consoleLive"
            bind:checked={following} />
          <label class="form-check-label small" for="consoleLive">
            {$_('pages.servers.console.live')}
          </label>
        </div>

        <div class="form-check form-switch m-0">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="consoleTimestamps"
            bind:checked={showTimestamps} />
          <label class="form-check-label small" for="consoleTimestamps">
            {$_('pages.servers.console.timestamps')}
          </label>
        </div>

        <div class="form-check form-switch m-0">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="consoleWrapLines"
            bind:checked={wrapLines} />
          <label class="form-check-label small" for="consoleWrapLines">
            {$_('pages.servers.console.wrap-lines')}
          </label>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          on:click={reloadConsole}
          aria-label={$_('pages.servers.console.reload')}
          use:tooltip={[$_('pages.servers.console.reload'), { placement: 'bottom' }]}
          disabled={loading}>
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          on:click={onCopyVisible}
          aria-label={$_('pages.servers.console.copy-visible')}
          use:tooltip={[$_('pages.servers.console.copy-visible'), { placement: 'bottom' }]}
          disabled={!visibleEntries.length}>
          <i class="fa-regular fa-copy" aria-hidden="true"></i>
        </button>

        {#if canDownloadLog}
          <!-- The whole of today's log as the server wrote it, not just what the panel holds:
               a plain download through the file manager's streaming endpoint. -->
          <a
            class="btn btn-sm btn-outline-secondary"
            href={fileDownloadUrl(serverId, [LATEST_LOG_PATH])}
            download="latest.log"
            aria-label={$_('pages.servers.console.download-latest')}
            use:tooltip={[$_('pages.servers.console.download-latest'), { placement: 'bottom' }]}>
            <i class="fa-solid fa-download" aria-hidden="true"></i>
          </a>
        {/if}
      </span>
    </CardHeader>

    <!-- The log fills the body edge to edge; only the extras around it keep the card padding. -->
    <div class="card-body p-0">
      {#if deepSearch}
        <!-- Deep search: every log file, newest first, matches appearing as they are found. -->
        <div
          class="d-flex flex-wrap align-items-center gap-2 px-3 py-2 small border-bottom"
          role="status">
          {#if deepSearch.running}
            <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
            <span>
              {$_('pages.servers.console.deep-search-running', {
                values: {
                  scanned: deepSearch.scannedFiles,
                  total: deepSearch.totalFiles || '…',
                  found: deepSearch.found,
                },
              })}
            </span>
            <button type="button" class="btn btn-sm btn-link p-0 ms-auto" on:click={stopDeepSearch}>
              <i class="fa-solid fa-stop me-1" aria-hidden="true"></i>
              {$_('pages.servers.console.deep-search-stop')}
            </button>
          {:else}
            <i class="fa-solid fa-magnifying-glass text-body-secondary" aria-hidden="true"></i>
            <span class="text-body-secondary">
              {$_(
                deepSearch.stopped
                  ? 'pages.servers.console.deep-search-stopped'
                  : deepSearch.limited
                    ? 'pages.servers.console.deep-search-limited'
                    : 'pages.servers.console.deep-search-done',
                {
                  values: {
                    scanned: deepSearch.scannedFiles,
                    total: deepSearch.totalFiles,
                    found: deepSearch.found,
                  },
                },
              )}
              {#if deepSearch.capped}
                &middot; {$_('pages.servers.console.deep-search-capped')}
              {/if}
            </span>
          {/if}
        </div>
      {/if}
      {#if loading}
        <div class="d-flex align-items-center justify-content-center py-5">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else}
        <ServerConsoleView
          bind:this={consoleView}
          entries={visibleEntries}
          {query}
          {showTimestamps}
          wrap={wrapLines}
          bind:following
          {canLoadOlder}
          {loadingOlder}
          onLoadOlder={loadOlder}
          ariaLabel={$_('pages.servers.console.title')}
          flush
          {emptyText} />
      {/if}

      {#if connection.hint}
        <div class="small text-body-secondary px-3 py-2">
          <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
          {$_(connection.hint)}
        </div>
      {/if}
    </div>

    <ServerConsoleCommandBar server={$server} {serverId} autofocus />
  </div>
</div>

<script context="module">
  import { fetchConsoleHistory, fetchConsoleSearch } from '$lib/serverConsole.util.js';

  /** Where every Minecraft server (and Velocity) writes the current log. */
  const LATEST_LOG_PATH = 'logs/latest.log';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { params } = event;

    // The replay comes with the page; a server that is offline or a source that cannot tap the
    // log answers with a status, which the view shows as an empty console.
    return {
      serverId: Number(params.id),
      serverConsole: await fetchConsoleHistory({ serverId: params.id, request: event }),
    };
  }
</script>

<script>
  /**
   * SM-12 — the live console of one linked server (§2.4.1).
   *
   * The page hydrates from `GET /console?limit=500` and then follows the hub: `consoleState`
   * frames carry the authoritative streaming/capability state (the subscribe is permission
   * checked server-side, so it is asynchronous — until the first frame lands the badge says
   * "connecting"), `console` frames carry batches of lines plus the count the backend had to
   * drop. Nothing is ever rendered as HTML: console output is untrusted text (§2.7).
   */
  import { getContext, onDestroy, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { browser } from '$app/environment';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import ServerConsoleCommandBar from '$lib/components/servers/ServerConsoleCommandBar.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import ServerConsoleView from '$lib/components/servers/ServerConsoleView.svelte';
  import tooltip from '$lib/tooltip.util';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';
  import { hasFeature, isServerOnline, showServerLoadError } from '$lib/servers.util.js';
  import { fileDownloadUrl } from '$lib/files.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import {
    appendConsoleLines,
    CONSOLE_HYDRATE_LINES,
    CONSOLE_SOURCE_LABELS,
    consoleSourceIcon,
    consoleStreamSource,
    formatConsoleTime,
    loadConsoleWrapPreference,
    prependConsoleLines,
    saveConsoleWrapPreference,
  } from '$lib/serverConsole.util.js';
  import {
    onServerConsole,
    onServerConsoleState,
    subscribeServerConsole,
  } from '$lib/panelRealtime.js';

  export let data;

  const server = getContext('server');

  /** @type {import('$lib/serverConsole.util.js').ConsoleEntry[]} */
  let entries = [];
  /** Only ever true for a replay this page had to fetch itself; the first one comes with it. */
  let loading = false;
  /** §2.4.14 — the source reported lines older than the ones on screen. */
  let hasMore = false;
  let loadingOlder = false;
  /**
   * @type {{ anchorPrepend: (count: number) => void } | undefined} the view owns the scroll
   *   box, so it is what re-anchors it after a prepend.
   */
  let consoleView;
  let query = '';
  let showTimestamps = true;
  /**
   * Wrap long lines instead of scrolling sideways; remembered per browser, on by default (the
   * server render assumes the default so a browser that kept it on sees no flash).
   */
  let wrapLines = browser ? loadConsoleWrapPreference() : true;
  /** Follows the tail; bound to the view, which turns it off when the reader scrolls up. */
  let following = true;
  /**
   * @type {{ streaming: boolean, capable: boolean, source: string|null } | null} the last
   *   `consoleState` frame.
   */
  let liveState = null;
  /** Capability as the REST hydrate reported it; only used before the first frame arrives. */
  let restCapable = null;
  let releaseConsole;
  let offConsole;
  let offConsoleState;
  let hydratedId = null;
  let wiredId = null;
  /** Set by `onDestroy`: a hydrate still in flight must not attach feeds to a dead page. */
  let destroyed = false;
  /**
   * §2.4.20 — the Find text the buffer currently holds the server's matches for; '' means the
   * buffer is the plain log. It changes the moment a search starts, so the live gate and "load
   * older" follow the new query before its first page has even arrived.
   */
  let searchQuery = '';
  /** Bumped by every buffer swap: a response for an older generation is dropped on arrival. */
  let searchGeneration = 0;
  /**
   * The deep search on screen: progress while it runs, the tally once it is over; null for the
   * plain console and for the windowed fallback.
   *
   * @type {{ running: boolean, stopped: boolean, limited: boolean, capped: boolean, scannedFiles: number, totalFiles: number, found: number } | null}
   */
  let deepSearch = null;
  /** Most matches a deep search puts on screen before it asks for a sharper query. */
  const DEEP_SEARCH_MAX_MATCHES = 5000;
  /** `<server id>\0<trimmed Find text>` the buffer was last synchronised for. */
  let searchKey = '';
  $: serverId = $server?.id ?? null;

  // The replay `load` fetched, on screen before the first paint — on the server as well as in
  // the browser — and re-applied when the route moves to another server. It has to come before
  // everything that reads what it sets (`entries`, `hasMore`, `restCapable`): `hydrate` writes `entries` from inside a function, which the legacy
  // reactivity cannot see as a dependency, so a filter declared first would already have run
  // for this tick and keep showing the empty buffer until the next live line arrived.
  $: hydrate(data, serverId);

  // §2.4.20 — Find searches the whole loadable window, not just the lines already here. After
  // `hydrate` on purpose: on a server switch the plain replay lands first and the search then
  // replaces it with that server's matches.
  $: syncSearch(query, serverId);

  $: if (browser) {
    saveConsoleWrapPreference(wrapLines);
  }

  $: online = isServerOnline($server);
  $: connection = describeConnection(online, liveState, restCapable);

  // §2.4.14 — paging needs whoever holds the log file: the node has it whether the process runs
  // or not, the plugin only while the game is up. §2.4.17 — `console.history` is that answer.
  $: canLoadOlder = hasMore && hasFeature($server, 'console.history');
  // The log is a file, so it is fetched the way the file manager fetches one: that needs the
  // files permission and someone able to read the server directory.
  $: canDownloadLog =
    serverId != null &&
    hasPermission(Permissions.MANAGE_SERVER_FILES) &&
    hasFeature($server, 'files.source');

  // §2.4.17 — who taps the lines, as Pano resolved it: the node's stdout pipe, the plugin's
  // logger appender, or Pano's own ring buffer. Which one it is changes what the admin should
  // expect to see. A backend with no `features` falls back to what the `consoleState` frame
  // reports, and one that reports neither shows no chip at all.
  $: streamSource = consoleStreamSource($server, liveState);
  $: sourceLabel = CONSOLE_SOURCE_LABELS[streamSource] || '';
  $: sourceIcon = consoleSourceIcon(streamSource);

  $: needle = query.trim().toLowerCase();
  $: visibleEntries = needle
    ? entries.filter((entry) => entry.kind === 'dropped' || entry.m.toLowerCase().includes(needle))
    : entries;

  $: emptyText = needle
    ? $_('pages.servers.console.no-matches')
    : $_('pages.servers.console.empty');

  // The stream is per server, so it follows the id rather than the mount.
  $: if (browser && serverId != null && wiredId !== serverId) {
    wiredId = serverId;
    start(serverId);
  }

  /**
   * @param {boolean} isOnline
   * @param {{ streaming: boolean, capable: boolean } | null} state
   * @param {boolean | null} fallbackCapable
   */
  function describeConnection(isOnline, state, fallbackCapable) {
    const capable = state ? state.capable : fallbackCapable;

    if (capable === false) {
      return {
        label: 'pages.servers.console.state-unsupported',
        badge: 'text-bg-secondary',
        hint: 'pages.servers.console.state-unsupported-hint',
        spinner: false,
      };
    }

    if (!isOnline) {
      return {
        label: 'pages.servers.console.state-offline',
        badge: 'text-bg-danger',
        hint: 'pages.servers.console.state-offline-hint',
        spinner: false,
      };
    }

    if (!state) {
      return {
        label: 'pages.servers.console.state-connecting',
        badge: 'text-bg-secondary',
        hint: '',
        spinner: true,
      };
    }

    return state.streaming
      ? {
          label: 'pages.servers.console.state-streaming',
          badge: 'text-bg-success',
          hint: '',
          spinner: false,
        }
      : {
          label: 'pages.servers.console.state-idle',
          badge: 'text-bg-warning',
          hint: 'pages.servers.console.state-idle-hint',
          spinner: false,
        };
  }

  /**
   * The replay `load` fetched, applied once per server.
   *
   * @param {object | undefined} pageData
   * @param {number | null} currentId
   */
  function hydrate(pageData, currentId) {
    const id = Number(pageData?.serverId ?? currentId);

    if (!Number.isFinite(id) || hydratedId === id) {
      return;
    }

    hydratedId = id;

    const result = pageData?.serverConsole;

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadHistory(id);
      }

      return;
    }

    applyHistory(result);
  }

  /**
   * @param {Awaited<ReturnType<typeof fetchConsoleHistory>>} result
   */
  function applyHistory(result) {
    loading = false;
    loadingOlder = false;
    restCapable = result.capable;
    // §2.4.14 — whether the source has anything older than the page it just replayed.
    hasMore = result.status === 'ok' && result.hasMore === true;

    if (result.status !== 'ok') {
      entries = [];

      // An empty console is all there is to show; the toast is what names why — unless it is a
      // state, which the notice above the console explains (§2.4.35).
      if (browser && result.status === 'error') {
        showServerLoadError(result.error, serverId);
      }

      return;
    }

    // `dropped` is cumulative on the REST hydrate, so it becomes one marker at the top.
    entries = appendConsoleLines([], result.lines, result.dropped);
  }

  /**
   * @param {number} id
   */
  async function loadHistory(id) {
    entries = [];
    hasMore = false;
    restCapable = null;
    loading = true;

    const result = await fetchConsoleHistory({ serverId: id });

    // Another server won the race while this request was in flight.
    if (destroyed || hydratedId !== id) {
      return;
    }

    applyHistory(result);
  }

  /**
   * @param {string} rawQuery the Find text, as typed.
   * @param {number | null} id
   */
  /**
   * Starts the console over as if the page had just been opened: the newest page again (of
   * matches, while Find holds a query), everything older dropped, following the tail.
   */
  function reloadConsole() {
    if (serverId == null) {
      return;
    }

    following = true;
    void runSearch(Number(serverId), searchQuery);
  }

  function syncSearch(rawQuery, id) {
    if (!browser || id == null) {
      return;
    }

    const text = String(rawQuery ?? '').trim();
    const key = `${id}\u0000${text}`;

    if (key === searchKey) {
      return;
    }

    const wasSearching = searchQuery !== '';

    searchKey = key;

    // No search before and none now: the plain replay `hydrate` put on screen is the buffer.
    if (!text && !wasSearching) {
      return;
    }

    void runSearch(Number(id), text);
  }

  /**
   * Swaps the buffer: the server's first page of matches for [text], or — for a cleared Find —
   * the plain replay again. The page spinner covers only this first page; older pages use the
   * view's own loading pill.
   *
   * @param {number} id
   * @param {string} text trimmed; '' restores the plain buffer.
   */
  async function runSearch(id, text) {
    const generation = ++searchGeneration;

    searchQuery = text;
    entries = [];
    hasMore = false;
    loadingOlder = false;
    deepSearch = null;
    loading = true;

    // Every log file, as far back as the server kept them; the windowed search below is only
    // for a backend or a source that cannot do that yet.
    if (text && (await runDeepSearch(id, text, generation))) {
      return;
    }

    if (destroyed || generation !== searchGeneration || hydratedId !== id) {
      return;
    }

    const result = await fetchConsoleHistory({ serverId: id, query: text });

    // Another keystroke, a cleared Find or another server won while this was in flight.
    if (destroyed || generation !== searchGeneration || hydratedId !== id) {
      return;
    }

    if (text && !isEchoOf(result.query, text)) {
      loading = false;

      return;
    }

    applyHistory(result);
  }

  /**
   * Whether the backend's echo names the query that was asked. It trims and caps the text at 200
   * characters itself; a backend without the echo (null) is taken at its word.
   *
   * @param {string | null | undefined} echo
   * @param {string} asked
   */
  function isEchoOf(echo, asked) {
    if (echo == null) {
      return true;
    }

    const normalise = (/** @type {string} */ value) =>
      String(value).trim().slice(0, 200).toLowerCase();

    return normalise(echo) === normalise(asked);
  }

  /**
   * @param {{ m?: string }} line
   * @param {string} text
   */
  function lineMatches(line, text) {
    return String(line?.m ?? '')
      .toLowerCase()
      .includes(text.toLowerCase());
  }

  /**
   * Walks every log file for [text], a budgeted step at a time, putting each step's matches on
   * screen as they arrive: older matches go on top, exactly where "Load older" would put them,
   * so the console reads oldest to newest while it keeps filling upwards.
   *
   * Returns false when deep search is not available here, so the caller can fall back — decided
   * on the first step only; once matches are on screen a later failure just ends the search.
   *
   * @param {number} id
   * @param {string} text
   * @param {number} generation
   * @returns {Promise<boolean>}
   */
  async function runDeepSearch(id, text, generation) {
    const stale = () => destroyed || generation !== searchGeneration || hydratedId !== id;
    /** @type {string | null} */
    let cursor = null;
    let first = true;

    for (;;) {
      const result = await fetchConsoleSearch({ serverId: id, query: text, cursor });

      if (stale()) {
        return true;
      }

      if (result.status !== 'ok') {
        if (first) {
          return false;
        }

        if (result.status === 'error') {
          showServerLoadError(result.error, id);
        }

        break;
      }

      if (first) {
        first = false;
        loading = false;
        deepSearch = {
          running: true,
          stopped: false,
          limited: false,
          capped: false,
          scannedFiles: 0,
          totalFiles: 0,
          found: 0,
        };
      }

      // A step's matches come newest first; the buffer is oldest first.
      const older = prependConsoleLines(entries, result.lines.slice().reverse());
      const shownBefore = visibleEntries.length;

      if (older.added) {
        entries = older.entries;
      }

      deepSearch = {
        ...deepSearch,
        scannedFiles: result.scannedFiles,
        totalFiles: result.totalFiles,
        found: deepSearch.found + older.added,
        capped: deepSearch.capped || result.capped,
      };

      if (older.added && !following) {
        await tick();
        consoleView?.anchorPrepend(visibleEntries.length - shownBefore);
      }

      if (result.done || !result.cursor) {
        break;
      }

      if (deepSearch.stopped || stale()) {
        return true;
      }

      // Enough to read through; past this the question needs a sharper search, not more rows.
      if (deepSearch.found >= DEEP_SEARCH_MAX_MATCHES) {
        deepSearch = { ...deepSearch, limited: true };

        break;
      }

      cursor = result.cursor;
    }

    if (!stale() && deepSearch) {
      deepSearch = { ...deepSearch, running: false };
    }

    return true;
  }

  function stopDeepSearch() {
    if (deepSearch?.running) {
      deepSearch = { ...deepSearch, running: false, stopped: true };
    }
  }

  /**
   * "Load older" (§2.4.14): asks the source for the page before the one on screen and puts it
   * in front of the buffer, leaving the view looking at the same line it was looking at.
   *
   * §2.4.20 — in search mode the page is the next page of *matches*, and `skip` counts the
   * matches already in the buffer (live lines are gated by the query, so that is every line).
   */
  async function loadOlder() {
    const id = serverId;

    if (id == null || loadingOlder || !hasMore) {
      return;
    }

    const text = searchQuery;
    const generation = searchGeneration;

    // `skip` is counted in real log lines: the drop markers are the panel's own, and the live
    // lines the stream appended are in the source's log file too, so they are part of the count.
    const skip = entries.reduce((count, entry) => count + (entry.kind === 'line' ? 1 : 0), 0);
    const shownBefore = visibleEntries.length;

    loadingOlder = true;

    try {
      const result = await fetchConsoleHistory({
        serverId: id,
        limit: CONSOLE_HYDRATE_LINES,
        skip,
        query: text,
      });

      // Another server, or another search, won the race while this request was in flight.
      if (destroyed || hydratedId !== id || generation !== searchGeneration) {
        return;
      }

      if (text && !isEchoOf(result.query, text)) {
        return;
      }

      // The request never completed — ApiUtil already raised the offline splash, and the button
      // simply comes back so the admin can try again.
      if (result.status === 'network') {
        return;
      }

      if (result.status !== 'ok') {
        hasMore = false;

        if (result.status === 'error') {
          showServerLoadError(result.error, id);
        }

        return;
      }

      const older = prependConsoleLines(entries, result.lines);

      // An empty page, or one that was entirely on screen already, means the next click would
      // ask for exactly the same lines: the button goes even if the source still claims more.
      hasMore = result.hasMore && older.added > 0;

      if (!older.added) {
        return;
      }

      entries = older.entries;

      // The rows have to exist before the scroll box can be corrected, and the filter decides
      // how many of them are actually on screen.
      await tick();

      consoleView?.anchorPrepend(visibleEntries.length - shownBefore);
    } finally {
      loadingOlder = false;
    }
  }

  /**
   * Attaches to the hub. The replay is already on screen by now: attaching before it would let
   * a live batch be overwritten by older history.
   *
   * @param {number} id
   */
  function start(id) {
    stop();

    liveState = null;

    if (destroyed) {
      return;
    }

    offConsole = onServerConsole((frame) => {
      if (Number(frame.serverId) !== Number(id)) {
        return;
      }

      // §2.4.20 — while the buffer holds search matches, only the live lines that match join
      // it; the rest come back with the plain replay once Find is cleared.
      const lines =
        searchQuery && Array.isArray(frame.lines)
          ? frame.lines.filter((line) => lineMatches(line, searchQuery))
          : frame.lines;

      entries = appendConsoleLines(entries, lines, frame.dropped);
    });

    offConsoleState = onServerConsoleState((frame) => {
      if (Number(frame.serverId) !== Number(id)) {
        return;
      }

      liveState = {
        streaming: frame.streaming,
        capable: frame.capable,
        source: frame.source ?? null,
      };
    });

    releaseConsole = subscribeServerConsole(id);
  }

  function stop() {
    if (offConsole) {
      offConsole();
      offConsole = undefined;
    }

    if (offConsoleState) {
      offConsoleState();
      offConsoleState = undefined;
    }

    if (releaseConsole) {
      releaseConsole();
      releaseConsole = undefined;
    }
  }

  function clearView() {
    entries = [];
  }

  function onCopyVisible() {
    // What is on screen right now, not the whole buffer behind the scroll box.
    const onScreen = consoleView?.onScreenEntries?.() ?? visibleEntries;
    const text = onScreen
      .map((entry) => {
        if (entry.kind === 'dropped') {
          return $_('pages.servers.console.dropped', { values: { count: entry.count } });
        }

        return showTimestamps ? `${formatConsoleTime(entry.t)} ${entry.m}` : entry.m;
      })
      .join('\n');

    copy(text);
    showSuccess('pages.servers.console.copied');
  }

  /** Ctrl+L clears the view, like a terminal. */
  function onWindowKeydown(event) {
    if (!event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (String(event.key).toLowerCase() !== 'l') {
      return;
    }

    event.preventDefault();
    clearView();
  }

  onDestroy(() => {
    destroyed = true;
    stop();
  });
</script>
