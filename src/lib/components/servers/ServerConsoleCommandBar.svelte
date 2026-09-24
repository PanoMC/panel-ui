<style>
  /* The command line is the console's last row: same dark ground, no box of its own, and the
     card's bottom edge as its frame. */
  .console-command {
    display: flex;
    align-items: center;
    background-color: #11151c;
    border-top: 1px solid #262c36;
    border-bottom-left-radius: var(--bs-card-inner-border-radius);
    border-bottom-right-radius: var(--bs-card-inner-border-radius);
    font-family: var(--bs-font-monospace);
    font-size: 0.8125rem;
    color: #d4d8de;
  }

  .console-command-caret {
    padding-left: 0.75rem;
    color: #6ea8fe;
    user-select: none;
  }

  .console-command-input {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.75rem 0.5rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
  }

  .console-command-input::placeholder {
    color: rgba(212, 216, 222, 0.4);
  }

  .console-command-input:disabled {
    cursor: not-allowed;
  }

  .console-command-send {
    align-self: stretch;
    padding: 0 1rem;
    border: 0;
    border-bottom-right-radius: var(--bs-card-inner-border-radius);
    background: transparent;
    color: #6ea8fe;
  }

  .console-command-send:hover:not(:disabled) {
    background-color: rgba(110, 168, 254, 0.12);
  }

  .console-command-send:disabled {
    color: rgba(212, 216, 222, 0.3);
  }
</style>

<!-- A disabled input swallows pointer events, so the tooltip lives on the wrapper. -->
<div
  use:tooltip={[
    reason
      ? $_(reason, {
          // What the prompt lacks is the command path, not the console: the log may well stream.
          values: { section: $_(featureSectionKey('console.input')) },
        })
      : '',
    { placement: 'top' },
  ]}>
  <form class="console-command" onsubmit={onSubmit}>
    <span class="console-command-caret" aria-hidden="true">&gt;</span>
    <input
      type="text"
      class="console-command-input"
      autocomplete="off"
      spellcheck="false"
      maxlength="1000"
      placeholder={$_('pages.servers.console.command-placeholder')}
      aria-label={$_('pages.servers.console.command-placeholder')}
      disabled={!!reason || sending}
      bind:value={command}
      bind:this={input}
      onkeydown={onKeydown} />
    <button
      type="submit"
      class="console-command-send"
      aria-label={$_('pages.servers.console.command-send')}
      disabled={!!reason || sending || !command.trim()}>
      {#if sending}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
      {/if}
    </button>
  </form>
</div>

<script module>
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import {
    featureSource,
    featureUnavailableReason,
    hasCapability,
    isManaged,
    isServerOnline,
    ServerCapabilities,
  } from '$lib/servers.util.js';

  /**
   * Why this server's console cannot take a command right now, as an i18n key, or '' when it
   * can. The cooldown after a 429 is the bar's own business and is not part of this.
   *
   * §2.4.16 — the node adopted the process across its own restart and holds no stdin pipe for
   * it; the command still goes through when the plugin can dispatch it, so only a server with
   * no `commands` capability either is cut off, and for that reason. §2.4.17 — the prompt
   * follows `console.input` (node stdin > plugin dispatch): a `null` source is disabled with the
   * reason Pano's answer implies. Without `features` the chain is the one the console page has
   * always used.
   *
   * @param {object | null | undefined} server the live server row.
   * @returns {string}
   */
  export function consoleCommandDisabledReason(server) {
    if (!hasPermission(Permissions.MANAGE_SERVER_CONSOLE)) {
      return 'pages.servers.console.command-disabled-permission';
    }

    // A managed server whose process is not up has nothing to read a command, and Pano refuses
    // one anyway; the node's stdin being "available" says nothing about whether a game runs.
    if (isManaged(server) && !isServerOnline(server)) {
      return 'pages.servers.console.command-disabled-offline';
    }

    const inputSource = featureSource(server, 'console.input');

    if (inputSource === null) {
      return featureUnavailableReason(server, 'console.input');
    }

    if (inputSource !== undefined) {
      return '';
    }

    const commands = hasCapability(server, ServerCapabilities.COMMANDS);

    if (server?.stdinAvailable === false && !commands) {
      return 'pages.servers.errors.no-stdin';
    }

    if (!commands) {
      return 'pages.servers.console.command-disabled-capability';
    }

    return isServerOnline(server) ? '' : 'pages.servers.console.command-disabled-offline';
  }
</script>

<script>
  /**
   * The console's command line — the dark `>` bar under the log — shared by the console page and
   * the server Overview's mini console.
   *
   * It owns everything about sending: the ↑/↓ history (per server, kept in the browser), the
   * cooldown after a 429 (§2.4.12), the named deny pattern when a policy refuses a command, the
   * disabled reason as a tooltip, and handing the caret back after Enter. The echo of a command
   * comes back through the console stream, so nothing is appended locally.
   */
  import { tick, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { showError } from '$lib/components/ToastContainer.svelte';
  import {
    createServerActionCooldown,
    featureSectionKey,
    getDeniedCommandPattern,
    isRateLimitError,
    showServerActionError,
  } from '$lib/servers.util.js';
  import { loadCommandHistory, pushCommandHistory } from '$lib/serverConsole.util.js';
  import { notifyLocalServerActivity } from '$lib/panelRealtime.js';
  import tooltip from '$lib/tooltip.util';

  /**
   * @type {{
   *   server?: object | null,
   *   serverId?: number | string | null,
   *   disabledReason?: string,
   *   autofocus?: boolean,
   * }}
   * @property server the live server row; decides whether a command can be sent at all.
   * @property serverId the server the command goes to (and whose history ↑/↓ walks).
   * @property disabledReason an i18n key that overrides the reason derived from `server`.
   * @property autofocus put the caret here on arrival (once per server), unless the admin has
   *   already focused something else.
   */
  let { server = null, serverId = null, disabledReason = undefined, autofocus = false } = $props();

  /**
   * §2.4.12 — after a 429 the prompt goes quiet for a few seconds. Hammering Enter is exactly
   * what earns the next 429, and a dead-looking input says "wait" better than a third toast.
   */
  const cooldown = createServerActionCooldown();

  let command = $state('');
  let sending = $state(false);
  /** @type {HTMLInputElement | undefined} */
  let input = $state();
  /** @type {string[]} oldest first. */
  let history = $state([]);
  /** Where ↑/↓ currently sit in [history]; `history.length` means "the line being typed". */
  let historyCursor = 0;
  let draft = '';
  /** @type {number | string | null} the server the caret was last put here for. */
  let autoFocusedFor = null;
  /** Set on teardown: a send still in flight must not reach for a dead input. */
  let destroyed = false;

  const reason = $derived(
    disabledReason ??
      (consoleCommandDisabledReason(server) ||
        ($cooldown ? 'pages.servers.console.command-disabled-cooldown' : '')),
  );

  // Every server keeps its own history; a switch starts at the end of the new one.
  $effect(() => {
    const id = serverId;

    untrack(() => {
      history = id == null ? [] : loadCommandHistory(id);
      historyCursor = history.length;
      draft = '';
    });
  });

  // Arriving on a console lands in the command line, once the input exists and is usable — but
  // never takes focus away from something the admin clicked, and never on a touch screen, where
  // focusing an input throws the on-screen keyboard over the console before anyone asked to type.
  // There the caret only comes back after a send (see `send`), when the keyboard is already up.
  $effect(() => {
    if (!autofocus || !input || reason || serverId == null || autoFocusedFor === serverId) {
      return;
    }

    if (isTouchScreen()) {
      return;
    }

    autoFocusedFor = serverId;

    void tick().then(() => {
      const active = document.activeElement;

      if (!active || active === document.body) {
        focusInput();
      }
    });
  });

  $effect(() => () => {
    destroyed = true;
    cooldown.cancel();
  });

  /** Whether the primary pointer is a finger: a phone or a tablet, keyboard on screen. */
  function isTouchScreen() {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
  }

  /** Puts the caret in the command line, without scrolling the page to it. */
  function focusInput() {
    if (!input || input.disabled || destroyed) {
      return;
    }

    input.focus({ preventScroll: true });
  }

  /**
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      browseHistory(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      browseHistory(1);
    }
  }

  /**
   * @param {number} direction -1 = older, 1 = newer.
   */
  function browseHistory(direction) {
    if (!history.length) {
      return;
    }

    if (historyCursor === history.length && direction === -1) {
      draft = command;
    }

    const next = Math.min(history.length, Math.max(0, historyCursor + direction));

    if (next === historyCursor) {
      return;
    }

    historyCursor = next;
    command = historyCursor === history.length ? draft : history[historyCursor];

    // Park the caret at the end, which is what a shell does.
    queueMicrotask(() => {
      if (input) {
        input.selectionStart = input.selectionEnd = command.length;
      }
    });
  }

  /**
   * @param {SubmitEvent} event
   */
  function onSubmit(event) {
    event.preventDefault();
    void send();
  }

  async function send() {
    const value = command.trim();
    const id = serverId;

    if (!value || sending || reason || id == null) {
      return;
    }

    sending = true;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${id}/console/command`,
        body: { command: value },
        handler: (response) => response,
      });

      // `undefined` means the request never completed; ApiUtil already raised the offline
      // splash, so a second toast would only be noise.
      if (!body) {
        return;
      }

      if (body.error) {
        // §2.4.12 — a deny policy on the caller's console grant refused this command. Naming
        // the pattern is the whole point: "op" and "op*" fail for visibly different reasons.
        if (String(body.error).toUpperCase() === 'COMMAND_DENIED') {
          showError('pages.servers.errors.command-denied', {
            pattern: getDeniedCommandPattern(body, value),
          });
        } else {
          if (isRateLimitError(body.error)) {
            cooldown.trigger();
          }

          showServerActionError(body.error, body, { server, feature: 'console.input' });
        }

        return;
      }

      history = pushCommandHistory(id, history, value);
      // The command was logged; a backend without the live frame gets its cue from here.
      notifyLocalServerActivity(id);
      historyCursor = history.length;
      draft = '';
      command = '';
    } finally {
      sending = false;

      // The input was disabled while the command was in flight, which drops focus; hand it
      // back so the next command can be typed straight away.
      await tick();
      focusInput();
    }
  }
</script>
