<style>
  /* A terminal is dark in either theme. The level colours are Bootstrap utilities reading these
     variables, so they are re-pointed here to shades that stay legible on the dark background. */
  .console-shell {
    position: relative;
    --console-bg: #11151c;
    --console-fg: #d4d8de;
    --bs-danger-rgb: 255, 107, 107;
    --bs-warning-text-emphasis: #f5c56b;
    --bs-secondary-color: rgba(212, 216, 222, 0.55);
    --bs-warning-bg-subtle: rgba(245, 197, 107, 0.25);
  }

  .console-view {
    overflow: auto;
    background-color: var(--console-bg);
    color: var(--console-fg);
    color-scheme: dark;
    border: 1px solid #262c36;
    border-radius: var(--bs-border-radius);
    font-family: var(--bs-font-monospace);
    font-size: 0.8125rem;
  }

  /* Flush: the view is the whole card body, so the card's own edge is its frame. */
  .console-view.flush {
    border: 0;
    border-radius: 0;
  }

  .console-canvas {
    position: relative;
    min-width: 100%;
  }

  .console-row {
    position: absolute;
    left: 0;
    right: 0;
    line-height: 20px;
    height: 20px;
    padding: 0 0.75rem;
    white-space: pre;
  }

  /* Wrap lines: character-level breaks so a monospace line takes exactly
     ceil(length / columns) rows — the arithmetic the virtualizer places rows by. Anything that
     still runs over (a double-width glyph, a tab) is clipped to its own rows rather than drawn
     over the next line. */
  .console-view.wrap {
    overflow-x: hidden;
  }

  .console-view.wrap .console-row {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-all;
    overflow: hidden;
  }

  .console-probe {
    visibility: hidden;
    pointer-events: none;
    top: 0;
  }

  .console-time {
    opacity: 0.55;
  }

  .console-match {
    background-color: var(--bs-warning-bg-subtle);
    color: var(--bs-warning-text-emphasis);
    border-radius: 2px;
  }

  .console-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .console-older {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.8rem;
    border: 1px solid #2f3643;
    border-radius: 999px;
    background-color: rgba(17, 21, 28, 0.92);
    box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.35);
    color: var(--console-fg);
    font-size: 0.75rem;
    pointer-events: none;
  }

  .console-older-end {
    border-color: rgba(117, 183, 152, 0.45);
    color: #75b798;
  }

  .console-pill {
    position: absolute;
    left: 50%;
    bottom: 0.75rem;
    transform: translateX(-50%);
    z-index: 2;
  }
</style>

<div class="console-shell">
  <!-- Older lines load on their own when the view nears the top; this is what says so. -->
  {#if loadingOlder}
    <div class="console-older" role="status" transition:fly={{ y: -12, duration: 180 }}>
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {$_('pages.servers.console.load-older-loading')}
    </div>
  {:else if reachedStart && showReachedStart}
    <div
      class="console-older console-older-end"
      role="status"
      transition:fly={{ y: -12, duration: 180 }}>
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
      {$_('pages.servers.console.reached-start')}
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="console-view"
    class:flush
    class:wrap
    style="height: {height};"
    role="log"
    aria-label={ariaLabel}
    aria-live="off"
    tabindex="0"
    bind:this={container}
    bind:clientHeight={viewportHeight}
    onscroll={onScroll}
    onwheel={noteUserIntent}
    ontouchmove={noteUserIntent}
    onpointerdown={noteUserIntent}
    onkeydown={noteUserIntent}>
    <div
      class="console-canvas"
      style="height: {canvasHeight}px; width: {wrap ? '100%' : `calc(${maxColumns}ch + 1.5rem)`};">
      {#if wrap}
        <!-- Measures one monospace character and the row's side padding, for the wrap maths. -->
        <div class="console-row console-probe" aria-hidden="true" bind:this={probe}>
          <span bind:this={probeText}>0000000000</span>
        </div>
      {/if}
      {#each visible as row (row.entry.id)}
        <div
          class="console-row {row.levelClass}"
          class:fst-italic={row.entry.kind === 'dropped'}
          style="top: {row.top}px;{wrap ? ` height: ${row.height}px;` : ''}">
          {#each row.segments as segment, index (index)}<span
              class:console-time={segment.muted}
              class:console-match={segment.match}
              class:fw-bold={segment.bold}
              class:fst-italic={segment.italic}
              class:text-decoration-underline={segment.underline}
              style:color={segment.color}>{segment.text}</span
            >{/each}
        </div>
      {/each}
    </div>
  </div>

  {#if !entries.length && emptyText}
    <div class="console-empty text-body-secondary small">{emptyText}</div>
  {/if}

  {#if showPill && !following && newLineCount > 0}
    <button
      type="button"
      class="console-pill btn btn-sm btn-secondary shadow"
      onclick={jumpToLatest}>
      <i class="fa-solid fa-arrow-down me-1" aria-hidden="true"></i>
      {$_('pages.servers.console.autoscroll-paused', { values: { count: newLineCount } })}
    </button>
  {/if}
</div>

<script>
  /**
   * Virtualized log view for the server console.
   *
   * Own implementation rather than xterm.js: this is a log stream with a command box, not a
   * TTY. Rows have a fixed height, so the visible window is pure arithmetic — only the rows on
   * screen (plus an overscan margin) exist in the DOM, which keeps a 5 000-line buffer cheap.
   * Long lines scroll horizontally by default; the canvas is sized in `ch` from the widest
   * buffered line. With `wrap` on, each line takes `ceil(columns needed / columns available)`
   * fixed-height rows (the font is monospace), and a prefix sum of those counts places them.
   *
   * Every line is rendered as text nodes (never `{@html}`) — console output is untrusted.
   */
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  import {
    consoleEntryColumns,
    consoleLevelClass,
    CONSOLE_ROW_HEIGHT,
    CONSOLE_TIME_COLUMNS,
    formatConsoleTime,
    consoleTextSegments,
  } from '$lib/serverConsole.util.js';

  let {
    /** @type {import('$lib/serverConsole.util.js').ConsoleEntry[]} */
    entries = [],
    /** Current filter text; matches are highlighted inside the rendered rows. */
    query = '',
    showTimestamps = true,
    /** Any CSS length. */
    height = '60vh',
    /** Already-translated text shown when the buffer is empty. */
    emptyText = '',
    /** The mini console on the overview has no room for the "paused" pill. */
    showPill = true,
    /** §2.4.14 — the source says it has lines older than the ones on screen. */
    canLoadOlder = false,
    /**
     * Say "reached the start of the log" when the reader scrolls to the top. A view that never
     * pages (the Overview's mini console) is not showing the start of anything, so it opts out.
     */
    showReachedStart = true,
    loadingOlder = false,
    /** @type {(() => void) | null} */
    onLoadOlder = null,
    ariaLabel = 'Console',
    /** Drop the view's own frame when it fills a card body edge to edge. */
    flush = false,
    /**
     * Wrap long lines instead of scrolling sideways. Rows then take as many visual rows as the
     * width needs; off is the fixed one-row-per-line layout exactly.
     */
    wrap = false,
    /**
     * Whether the view follows the tail ("Live"). Scrolling up turns it off and reaching the
     * bottom turns it back on; the page binds it to its switch. Lines keep arriving either way.
     */
    following = $bindable(true),
  } = $props();

  /** Rows kept above and below the viewport so a fast scroll never shows a blank strip. */
  const OVERSCAN = 12;

  const rowHeight = CONSOLE_ROW_HEIGHT;

  /** How close to the top, in rows, the next page of history is asked for. */
  const LOAD_OLDER_THRESHOLD_ROWS = 8;

  /** How long the "start of the log" note stays up. */
  const REACHED_START_MS = 2000;

  let reachedStart = $state(false);
  /** Shown once per visit to the top; leaving the top re-arms it. */
  let reachedStartShown = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let reachedStartTimer;

  /** The top of the buffer is the top of the log: say so briefly, then get out of the way. */
  function noteReachedStart() {
    if (reachedStartShown || !entries.length) {
      return;
    }

    // Only a reader who went up to the top has reached the start. A console that was just opened
    // sits at scrollTop 0 for a moment before it is taken to the newest line, and a log shorter
    // than the box never scrolls at all: neither is "reaching" anything. Reading `following`
    // here also makes the effect below run again when the reader leaves the tail, which is what
    // catches a jump to the top in a single scroll (Home, the scrollbar).
    if (following || !container || container.scrollHeight - container.clientHeight <= rowHeight) {
      return;
    }

    reachedStartShown = true;
    reachedStart = true;
    clearTimeout(reachedStartTimer);
    reachedStartTimer = setTimeout(() => (reachedStart = false), REACHED_START_MS);
  }

  /** @type {HTMLDivElement | undefined} */
  let container = $state();
  let viewportHeight = $state(0);
  let scrollTop = $state(0);
  let pausedAtCount = $state(0);

  // Switched off from outside (the page's "Live" switch), the count of new lines starts here.
  $effect(() => {
    if (!following) {
      pausedAtCount = untrack(() => entries.length);
    }
  });

  const newLineCount = $derived(following ? 0 : Math.max(0, entries.length - pausedAtCount));

  const maxColumns = $derived(
    entries.reduce(
      (widest, entry) => Math.max(widest, consoleEntryColumns(entry, showTimestamps)),
      40,
    ),
  );

  /** @type {HTMLDivElement | undefined} */
  let probe = $state();
  /** @type {HTMLSpanElement | undefined} */
  let probeText = $state();
  /** How many monospace characters fit on one visual row; 0 until measured. */
  let wrapColumns = $state(0);

  /**
   * Visual rows per entry as a prefix sum: `offsets[i]` is the row entry `i` starts on and
   * `offsets[entries.length]` the total. Null with wrapping off — every entry is exactly one
   * row then, and the maths below falls back to the index itself, as it always has.
   */
  const offsets = $derived.by(() => {
    if (!wrap || wrapColumns <= 0) {
      return null;
    }

    const table = new Uint32Array(entries.length + 1);

    for (let index = 0; index < entries.length; index += 1) {
      const length = consoleEntryColumns(entries[index], showTimestamps);

      table[index + 1] = table[index] + Math.max(1, Math.ceil(length / wrapColumns));
    }

    return table;
  });

  /** @param {number} index */
  function rowOf(index) {
    return offsets ? offsets[index] : index;
  }

  const totalRows = $derived(offsets ? offsets[entries.length] : entries.length);
  const canvasHeight = $derived(totalRows * rowHeight);

  /**
   * The entry that visual row [row] belongs to (binary search over [offsets]), clamped to the
   * buffer.
   *
   * @param {number} row
   */
  function entryAtRow(row) {
    const total = entries.length;

    if (!total) {
      return 0;
    }

    const target = Math.max(0, Math.min(row, totalRows - 1));

    if (!offsets) {
      return Math.min(total - 1, target);
    }

    let low = 0;
    let high = total - 1;

    while (low < high) {
      const middle = (low + high + 1) >> 1;

      if (offsets[middle] <= target) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }

    return low;
  }

  /** Re-measures the characters per row; cheap, and only ever runs with wrapping on. */
  function measureColumns() {
    if (!wrap || !container || !probe || !probeText) {
      return;
    }

    const charWidth = probeText.getBoundingClientRect().width / 10;
    const style = getComputedStyle(probe);
    const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const available = container.clientWidth - padding;

    if (charWidth > 0 && available > 0) {
      wrapColumns = Math.max(1, Math.floor(available / charWidth));
    }
  }

  // The column count follows the view's width (window resize, sidebar toggle, scrollbar showing
  // up) while wrapping is on.
  $effect(() => {
    if (!wrap || !container) {
      return;
    }

    measureColumns();

    // The observer sees the view itself change width (a sidebar toggle, a scrollbar appearing);
    // the window listener is the cheap backstop for the common case of the window resizing.
    const observer = new ResizeObserver(() => measureColumns());
    const onWindowResize = () => measureColumns();

    observer.observe(container);
    window.addEventListener('resize', onWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onWindowResize);
    };
  });

  const visible = $derived.by(() => {
    const total = entries.length;

    if (!total) {
      return [];
    }

    const rowsOnScreen = Math.ceil((viewportHeight || 320) / rowHeight);
    const firstRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const first = entryAtRow(firstRow);
    const last = Math.min(total, entryAtRow(firstRow + rowsOnScreen + OVERSCAN * 2) + 1);
    const rows = [];

    for (let index = first; index < last; index += 1) {
      const entry = entries[index];
      const top = rowOf(index);

      rows.push({
        index,
        entry,
        top: top * rowHeight,
        height: (rowOf(index + 1) - top) * rowHeight,
        levelClass: entry.kind === 'dropped' ? 'text-body-secondary' : consoleLevelClass(entry.l),
        segments: buildSegments(entry),
      });
    }

    return rows;
  });

  /**
   * One flat segment list per row: the timestamp column is part of it so the row element has a
   * single child block. Svelte trims whitespace at an element's edges, so nothing from the
   * template leaks into the `white-space: pre` row.
   *
   * @param {import('$lib/serverConsole.util.js').ConsoleEntry} entry
   */
  function buildSegments(entry) {
    const segments = [];

    if (showTimestamps) {
      const stamp =
        entry.kind === 'dropped'
          ? ''.padEnd(CONSOLE_TIME_COLUMNS - 1, ' ')
          : formatConsoleTime(entry.t);

      segments.push({ text: `${stamp} `, match: false, muted: true, color: null });
    }

    if (entry.kind === 'dropped') {
      segments.push({
        text: $_('pages.servers.console.dropped', { values: { count: entry.count } }),
        match: false,
        muted: true,
        color: null,
      });

      return segments;
    }

    // §2.4.21 — cut at every colour span and every search match; the colour that comes back is
    // already re-checked against `#rrggbb` and cleared under a match, so it can go straight into
    // `style:color`. A line without spans comes back as plain pieces and keeps its level class.
    for (const part of consoleTextSegments(entry.m, entry.c, query)) {
      segments.push({ ...part, muted: false });
    }

    return segments;
  }

  /** How long after a wheel, touch, key or pointer press a scroll still counts as the reader's. */
  const USER_INTENT_WINDOW_MS = 1000;

  let lastUserIntentAt = 0;

  function noteUserIntent() {
    lastUserIntentAt = performance.now();
  }

  function onScroll() {
    if (!container) {
      return;
    }

    // While following, only the reader may stop it. A scroll nobody asked for — the browser
    // restoring the old position after F5, layout settling — is undone instead of read as
    // "the reader went up", so the console always opens on the newest line.
    if (following && performance.now() - lastUserIntentAt > USER_INTENT_WINDOW_MS) {
      const bottom = container.scrollHeight - container.clientHeight;

      if (bottom - container.scrollTop > rowHeight) {
        container.scrollTop = container.scrollHeight;

        return;
      }
    }

    scrollTop = container.scrollTop;
    anchorId = entries.length ? entries[entryAtRow(Math.floor(scrollTop / rowHeight))].id : null;

    // Near the top with more behind it: fetch the next page before the reader hits the edge.
    // The page anchors the scroll after the prepend, so reading carries on where it was.
    if (
      canLoadOlder &&
      !loadingOlder &&
      container.scrollTop < rowHeight * LOAD_OLDER_THRESHOLD_ROWS
    ) {
      onLoadOlder?.();
    }

    if (container.scrollTop <= rowHeight) {
      if (!canLoadOlder && !loadingOlder) {
        noteReachedStart();
      }
    } else {
      reachedStartShown = false;
    }

    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <= rowHeight;

    if (atBottom !== following) {
      if (!atBottom) {
        pausedAtCount = entries.length;
      }

      following = atBottom;
    }
  }

  /**
   * The rows the reader can actually see — partly visible ones at either edge included — for
   * "copy visible". The overscan rows rendered above and below the viewport are not on screen.
   */
  export function onScreenEntries() {
    if (!container) {
      return entries;
    }

    const firstRow = Math.floor(container.scrollTop / rowHeight);
    const lastRow = Math.ceil((container.scrollTop + container.clientHeight) / rowHeight) - 1;

    if (!entries.length || lastRow < firstRow) {
      return [];
    }

    return entries.slice(entryAtRow(firstRow), entryAtRow(lastRow) + 1);
  }

  /**
   * Called by the page right after it prepended `count` older entries (§2.4.14). Everything
   * that was on screen moved down by exactly the height of those entries — one row each, or
   * their wrapped rows with wrapping on — so adding that to `scrollTop` leaves the
   * previously-first line where it was. When the view was following the tail the add lands on
   * the new maximum, i.e. still the tail, so a prepend never scrolls anywhere on its own.
   *
   * @param {number} count
   */
  export function anchorPrepend(count) {
    const added = Math.min(Number(count) || 0, entries.length);

    if (!container || added <= 0) {
      return;
    }

    container.scrollTop += rowOf(added) * rowHeight;
    scrollTop = container.scrollTop;
    // The pill counts lines that arrived at the *tail* while parked; history is not "new".
    pausedAtCount += added;
  }

  function jumpToLatest() {
    following = true;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // The last page just landed and there is nothing before it: a reader still at the top has
  // reached the start, even though no scroll event says so.
  $effect(() => {
    if (!loadingOlder && !canLoadOlder && container && container.scrollTop <= rowHeight) {
      noteReachedStart();
    }
  });

  $effect(() => () => clearTimeout(reachedStartTimer));

  /** The entry at the top of the viewport while the reader is parked, by id (prepend-safe). */
  let anchorId = null;

  // A re-wrap moves every line; a reader parked mid-log keeps looking at the same line.
  $effect(() => {
    void wrap;
    void wrapColumns;
    void showTimestamps;

    untrack(() => {
      if (!container || following || anchorId == null) {
        return;
      }

      const index = entries.findIndex((entry) => entry.id === anchorId);

      if (index >= 0) {
        container.scrollTop = rowOf(index) * rowHeight;
        scrollTop = container.scrollTop;
      }
    });
  });

  // Follow the tail. The effect deliberately does not read `scrollTop`: assigning `scrollTop`
  // below fires a scroll event that writes it back, which would otherwise loop forever.
  $effect(() => {
    const count = entries.length;

    // Re-wrapping (a toggle, a resize, the timestamps switch) changes the height without adding
    // a line; the tail has to be followed through that as well. With wrapping off the height
    // only moves with the count, exactly as before.
    void canvasHeight;

    if (!container || !following || !count) {
      return;
    }

    const element = container;

    element.scrollTop = element.scrollHeight;

    const settledAt = element.scrollTop;

    // On the first paint the canvas can still be growing to its full height when the line above
    // runs, and the scroll event it queues then lands short of the new bottom and parks the
    // view at the top of a long replay. Once layout has settled, finish the job — unless the
    // reader scrolled up in the meantime: a frame-late snap would otherwise yank them back to the
    // tail (and switch Live back on) right after they left it.
    requestAnimationFrame(() => {
      if (element.scrollTop < settledAt - rowHeight) {
        return;
      }

      element.scrollTop = element.scrollHeight;
      following = true;
    });
  });
</script>
