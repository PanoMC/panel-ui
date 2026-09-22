<!-- "Link with the Pano Agent" (SM-74): pano-agent.jar goes into the server's own folder and is run
     there instead of the server jar. It starts the server as its own process and Pano controls it
     from there; it never shows up as a node — only the server does. Kept as short as the plugin's
     ConnectServerModal: the docs explain the rest. SM-77 — the same on/off switch as that dialog:
     while it is off Pano refuses every agent code, and this dialog asks for none. -->
<div
  class="modal fade"
  tabindex="-1"
  aria-hidden="true"
  aria-labelledby="agentLinkTitle"
  bind:this={modalElement}>
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <div class="hstack gap-2">
          {#if switchable}
            <div class="form-check form-switch position-relative">
              {#if toggleLoading}
                <span
                  class="position-absolute top-50 start-50 translate-middle"
                  style="z-index: 1;"
                  role="status">
                  <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                </span>
              {:else}
                <input
                  use:tooltip={[$_('components.modals.agent-link.toggle'), { placement: 'right' }]}
                  aria-label={$_('components.modals.agent-link.toggle')}
                  class="form-check-input"
                  type="checkbox"
                  id="toggleAgentLinks"
                  checked={accepting}
                  disabled={toggleLoading}
                  onchange={toggleAcceptAgentLinks}
                  autocomplete="off" />
              {/if}
            </div>
          {/if}
          <h5 class="modal-title" id="agentLinkTitle">
            {$_('components.modals.agent-link.title')}
          </h5>
        </div>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>

      <div class="modal-body" class:opacity-50={!accepting}>
        {#if unavailable}
          <div class="alert alert-warning mb-0" role="alert">
            {$_('components.modals.agent-link.unavailable')}
          </div>
        {:else}
          <ol class="list-group list-group-numbered">
            <li class="list-group-item">
              {$_('components.modals.agent-link.steps.1')}
              <br />
              <a
                class="btn btn-secondary mt-2 d-block shadow-none"
                class:disabled={!accepting || !link.jarUrl}
                aria-disabled={!accepting || !link.jarUrl}
                tabindex={accepting ? 0 : -1}
                href={accepting ? link.jarUrl || undefined : undefined}
                download={link.jarFileName}
                >{$_('buttons.download')}
                <i class="fa-solid fa-download ms-2" aria-hidden="true"></i></a>
            </li>

            <!-- The first run pairs with the per-request code, asks how to start the server,
                 adopts the folder and starts it. -->
            <li class="list-group-item">
              {$_('components.modals.agent-link.steps.2')}
              <br />
              {#if accepting}
                <small>
                  {#if !runCommand}
                    {$_('components.modals.agent-link.code-loading')}
                  {:else if link.expiresAt > 0}
                    {$_('components.modals.agent-link.code-refresh', {
                      values: { seconds: secondsLeft },
                    })}
                  {/if}
                </small>
              {/if}
              <div class="input-group mt-2">
                <input
                  type="text"
                  class="form-control font-monospace"
                  value={accepting ? runCommand : ''}
                  aria-label={$_('components.modals.agent-link.steps.2')}
                  disabled={!accepting}
                  readonly />
                <button
                  class="btn border shadow-none btn-outline-primary"
                  type="button"
                  disabled={!accepting || !runCommand}
                  onclick={copyRunCommand}
                  aria-label={copied
                    ? $_('components.modals.connect-server.copied')
                    : $_('components.modals.connect-server.copy')}
                  use:tooltip={[
                    copied
                      ? $_('components.modals.connect-server.copied')
                      : $_('components.modals.connect-server.copy'),
                    { placement: 'bottom', hideOnClick: false },
                  ]}>
                  <i class="fa-regular fa-clipboard" aria-hidden="true"></i>
                </button>
              </div>
              <small class="d-block mt-1 text-body-secondary">
                {$_('components.modals.agent-link.run-hint')}
              </small>
              {#if link.javaVersion}
                <small class="d-block mt-1 text-body-secondary">
                  <i class="fa-brands fa-java me-1" aria-hidden="true"></i>
                  {$_('components.modals.agent-link.java', {
                    values: { version: link.javaVersion },
                  })}
                </small>
              {/if}
            </li>

            <li class="list-group-item">
              {#if linkedServer}
                <i class="fa-solid fa-circle-check text-success me-1" aria-hidden="true"></i>
                {$_('components.modals.agent-link.linked', {
                  values: { name: getServerDisplayName(linkedServer) },
                })}
              {:else}
                {$_('components.modals.agent-link.steps.3')}
                {#if accepting}
                  <span
                    class="spinner-border spinner-border-sm ms-2 align-middle"
                    aria-hidden="true"></span>
                {/if}
              {/if}
            </li>
          </ol>
        {/if}
      </div>

      {#if linkedServer}
        <div class="modal-footer">
          <button type="button" class="btn btn-link m-0" onclick={hide}>
            {$_('buttons.close')}
          </button>
          <button type="button" class="btn btn-primary m-0" onclick={openLinked}>
            {$_('components.modals.agent-link.open-server')}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script module>
  /** @type {(() => void) | null} */
  let openModal = null;

  /** Opens the dialog; registered by the mounted instance. */
  export function show() {
    openModal?.();
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { base } from '$app/paths';
  import { goto } from '$app/navigation';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import {
    getServerDisplayName,
    isEndpointUnavailable,
    showServerActionError,
  } from '$lib/servers.util.js';
  import { onPanelServerUpdate, subscribePanelServersList } from '$lib/panelRealtime.js';

  import { showError as showErrorToast } from '$lib/components/ToastContainer.svelte';

  /**
   * An agent code lives for a minute and is replaced the moment it runs out, so the command on
   * screen always holds a valid one. A renewal that did not arrive — or came back with the old code
   * because Pano's clock is a little behind the browser's — is asked for again after this.
   */
  const RETRY_MS = 2000;

  /** What `GET /api/panel/servers/agent-link` answers, before it has. */
  function emptyLink() {
    return {
      expiresAt: 0,
      jarUrl: '',
      jarFileName: 'pano-agent.jar',
      runCommand: '',
      /** @type {number | null} */
      javaVersion: null,
    };
  }

  const session = getContext('session');

  let modalElement = $state();
  let link = $state(emptyLink());
  let now = $state(Date.now());
  let loading = $state(false);
  let unavailable = $state(false);
  /** The run command was just copied, for its tooltip. */
  let copied = $state(false);
  /** The server the agent brought in, once it shows up. */
  let linkedServer = $state(null);
  /** `managed-servers.accept-agent-links`: while false, Pano refuses every agent code. */
  let accepting = $state(true);
  /** Whether this Pano has the switch at all; an older one always accepts and shows none. */
  let switchable = $state(false);
  let toggleLoading = $state(false);

  let modal;
  let ticker = null;
  let copiedTimeout;
  let releaseServersList = null;
  let offServerUpdate = null;
  /** When the dialog opened: only a server added after it is the one this command brought in. */
  let openedAt = 0;
  let lastFetchAt = 0;
  /** The backend refused outright: asking again every few seconds would only repeat the toast. */
  let halted = false;
  /** Bumped by every switch, so an answer asked for before it cannot undo it. */
  let generation = 0;
  /** Between show and hidden: an answer that lands after the dialog closed starts nothing. */
  let isOpen = false;

  const secondsLeft = $derived(
    link.expiresAt > 0 ? Math.max(0, Math.ceil((link.expiresAt - now) / 1000)) : 0,
  );
  const expired = $derived(link.expiresAt > 0 && secondsLeft === 0);
  /** A lapsed code is not offered for copying while its replacement is on the way. */
  const runCommand = $derived(expired ? '' : link.runCommand);

  /**
   * The switch as Pano reports it, into the session too, so the dialog opens right next time.
   *
   * @param {boolean} value
   */
  function rememberAccepting(value) {
    switchable = true;

    if (get(session)?.basicData?.acceptAgentLinks === value) {
      return;
    }

    session.update((current) =>
      current?.basicData
        ? { ...current, basicData: { ...current.basicData, acceptAgentLinks: value } }
        : current,
    );
  }

  async function loadLink() {
    if (loading) {
      return;
    }

    const asked = generation;

    loading = true;
    lastFetchAt = Date.now();

    try {
      const body = await ApiUtil.get({
        path: '/api/panel/servers/agent-link',
        handler: (response) => response,
      });

      if (body === undefined || body === null || asked !== generation) {
        return;
      }

      // Switched off: Pano minted nothing and says only what the steps need.
      if (body.enabled === false) {
        rememberAccepting(false);
        accepting = false;
        stopLinking();
        unavailable = false;
        link = {
          ...readLink(body),
          expiresAt: 0,
          runCommand: '',
        };

        return;
      }

      // A backend from before the folder model has no run command to show.
      if (isEndpointUnavailable(body) || (!body.error && !body.runCommand)) {
        unavailable = true;

        return;
      }

      if (body.error) {
        halted = true;
        await showServerActionError(body.error);

        return;
      }

      if (body.enabled === true) {
        rememberAccepting(true);
      }

      accepting = true;
      unavailable = false;
      link = readLink(body);
      now = Date.now();

      if (isOpen) {
        startLinking();
      }
    } finally {
      loading = false;
    }
  }

  /**
   * @param {Record<string, any>} body
   */
  function readLink(body) {
    const expiresAt = Number(body.expiresAt);
    const javaVersion = Number(body.javaVersion);

    return {
      expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : 0,
      jarUrl: String(body.jarUrl ?? ''),
      jarFileName: String(body.jarFileName || 'pano-agent.jar'),
      runCommand: String(body.runCommand ?? ''),
      javaVersion: Number.isFinite(javaVersion) && javaVersion > 0 ? javaVersion : null,
    };
  }

  async function toggleAcceptAgentLinks() {
    if (toggleLoading) {
      return;
    }

    toggleLoading = true;

    try {
      const body = await ApiUtil.put({
        path: '/api/panel/servers/agent-link/toggle',
        handler: (response) => response,
      });

      if (body === undefined || body === null) {
        return;
      }

      if (body.error || typeof body.acceptAgentLinks !== 'boolean') {
        await showErrorToast('components.toasts.settings-save-error', {
          errorCode: body.error || 'UNKNOWN',
        });

        return;
      }

      generation += 1;
      rememberAccepting(body.acceptAgentLinks);
      accepting = body.acceptAgentLinks;

      if (accepting) {
        // A fresh code straight away; the ticker asks again if this one does not arrive.
        halted = false;
        link = { ...link, expiresAt: 0, runCommand: '' };
        startLinking();
        void loadLink();
      } else {
        // Pano dropped every live code, so the one on screen is worthless now.
        stopLinking();
        link = { ...link, expiresAt: 0, runCommand: '' };
      }
    } finally {
      toggleLoading = false;
    }
  }

  /** The countdown, code renewal and linked-server watch — only while links are accepted. */
  function startLinking() {
    startTicker();
    watchServers();
  }

  function stopLinking() {
    clearInterval(ticker);
    ticker = null;
    releaseServersList?.();
    releaseServersList = null;
    offServerUpdate?.();
    offServerUpdate = null;
  }

  function startTicker() {
    if (ticker) {
      return;
    }

    ticker = setInterval(() => {
      now = Date.now();

      // A lapsed or missing code is asked for again; a valid one may already be pasted on the
      // machine, so it is kept until it runs out.
      if (
        accepting &&
        (expired || !link.runCommand) &&
        !linkedServer &&
        !unavailable &&
        !halted &&
        !loading &&
        Date.now() - lastFetchAt >= RETRY_MS
      ) {
        void loadLink();
      }
    }, 1000);
  }

  /** Watch the server list: the agent's server arrives as a new row the moment it adopts. */
  function watchServers() {
    releaseServersList = releaseServersList || subscribePanelServersList();
    offServerUpdate =
      offServerUpdate ||
      onPanelServerUpdate((server) => {
        if (!accepting || !server || server.id == null || linkedServer) {
          return;
        }

        const added = Number(server.acceptedTime ?? server.createdAt ?? 0);

        // A little slack for a clock that runs slightly behind the browser's.
        if (server.agent === true && added >= openedAt - 5000) {
          linkedServer = server;
        }
      });
  }

  function copyRunCommand() {
    if (!runCommand || !accepting) {
      return;
    }

    copy(runCommand);
    copied = true;
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copied = false), 1500);
  }

  function openLinked() {
    const id = linkedServer?.id;

    hide();

    if (id != null) {
      void goto(`${base}/servers/${id}`);
    }
  }

  export function hide() {
    modal?.hide();
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement)
      : null;

    openModal = () => {
      const reported = get(session)?.basicData?.acceptAgentLinks;

      copied = false;
      linkedServer = null;
      unavailable = false;
      halted = false;
      switchable = typeof reported === 'boolean';
      accepting = reported !== false;
      openedAt = Date.now();
      now = openedAt;
      isOpen = true;
      modal?.show();

      // Pano's answer is what counts: switched off it mints nothing and says so; on, it hands
      // back the same code while that is still valid, so reopening is free.
      void loadLink();

      if (accepting) {
        startLinking();
      }
    };

    const onHidden = () => {
      isOpen = false;
      stopLinking();
    };

    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    return () => {
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
    };
  });

  onDestroy(() => {
    stopLinking();
    clearTimeout(copiedTimeout);
    openModal = null;
  });
</script>
