<style>
  /* The tab that is open is the dialog's subject, so it wears the primary colour rather than the
     emphasis colour Bootstrap's tabs default to. */
  .nav-tabs {
    --bs-nav-tabs-link-active-color: var(--bs-primary);
  }
</style>

<!-- Connect Server Modal -->
<div aria-hidden="true" class="modal modal fade" id="connectServer" role="document" tabindex="-1">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <div class="hstack gap-2">
          <div class="form-check form-switch position-relative">
            {#if toggleLoading}
              <span
                class="position-absolute top-50 start-50 translate-middle"
                style="z-index: 1;"
                role="status">
                <i class="fa-solid fa-spinner fa-spin"></i>
              </span>
            {:else}
              <input
                use:tooltip={[
                  $_('components.modals.connect-server.toggle-connect-server'),
                  { placement: 'right' },
                ]}
                aria-label={$_('components.modals.connect-server.toggle-connect-server')}
                class="form-check-input"
                type="checkbox"
                id="toggleConnectServer"
                checked={acceptPluginAuth}
                disabled={toggleLoading}
                on:change={toggleAcceptPluginAuth}
                autocomplete="off" />
            {/if}
          </div>
          <h5 class="modal-title">
            {$_('components.modals.connect-server.title')}
          </h5>
        </div>

        <button
          class="btn-close"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="modal"
          type="button">
        </button>
      </div>
      <div class="modal-body" class:opacity-50={!acceptPluginAuth}>
        <ol class="list-group list-group-numbered">
          <li class="list-group-item">
            {$_('components.modals.connect-server.steps.1')}
            <br />
            <a
              class="btn btn-secondary mt-2 d-block shadow-none"
              href={`${PANO_WEBSITE_URL}/download`}
              target="_blank"
              tabindex={acceptPluginAuth ? 0 : -1}
              class:disabled={!acceptPluginAuth}
              >{$_('buttons.download')}
              <i class="fa fa-external-link ms-2"></i></a>
          </li>

          <li class="list-group-item">
            {$_('components.modals.connect-server.steps.2')}
            <br />
            {#if acceptPluginAuth}
              <small class="">
                {$_('components.modals.connect-server.code-refresh', {
                  values: { timeToRefreshKey },
                })}
              </small>
              <div class="mt-2">
                <ul class="nav nav-tabs border-bottom-0">
                  <li class="nav-item">
                    <button
                      type="button"
                      class="nav-link"
                      class:active={!isRemoteConnection}
                      disabled={!acceptPluginAuth}
                      on:click={() => (isRemoteConnection = false)}>
                      {$_('buttons.local')}
                    </button>
                  </li>
                  <li class="nav-item">
                    <button
                      type="button"
                      class="nav-link"
                      class:active={isRemoteConnection}
                      disabled={!acceptPluginAuth}
                      on:click={() => (isRemoteConnection = true)}>
                      {$_('buttons.remote')}
                    </button>
                  </li>
                </ul>
              </div>
            {/if}
            <div class="input-group">
              <input
                type="text"
                class="form-control rounded-top-0 rounded-end-0"
                value={commandText}
                readonly
                disabled={!acceptPluginAuth} />
              <button
                class="btn border shadow-none btn-outline-primary"
                type="button"
                disabled={!acceptPluginAuth}
                on:click={() => onCopyCommandText(false)}
                aria-label={isCommandTextCopied
                  ? $_('components.modals.connect-server.copied')
                  : $_('components.modals.connect-server.copy')}
                use:tooltip={[
                  isCommandTextCopied
                    ? $_('components.modals.connect-server.copied')
                    : $_('components.modals.connect-server.copy'),
                  { placement: 'bottom', hideOnClick: false },
                ]}>
                <i class="fa-regular fa-clipboard"></i>
              </button>
              <button
                class="btn border shadow-none btn-outline-secondary"
                type="button"
                disabled={!acceptPluginAuth}
                on:click={() => onCopyCommandText(true)}
                aria-label={isCommandTextForConsoleCopied
                  ? $_('components.modals.connect-server.copied')
                  : $_('components.modals.connect-server.copy-for-console')}
                use:tooltip={[
                  isCommandTextForConsoleCopied
                    ? $_('components.modals.connect-server.copied')
                    : $_('components.modals.connect-server.copy-for-console'),
                  { placement: 'bottom', hideOnClick: false },
                ]}>
                <i class="fa-solid fa-terminal"></i>
              </button>
            </div>
          </li>

          <li class="list-group-item">
            {$_('components.modals.connect-server.steps.3')}
            <br />
            <small class="">
              {$_('components.modals.connect-server.notification-will-come')}
            </small>
          </li>
        </ol>
      </div>
    </div>
  </div>
</div>

<script context="module">
  /** Open the Connect Server modal (same as #connectServer / navbar). */
  export function show() {
    if (typeof window === 'undefined' || !window.bootstrap?.Modal) return;
    const el = document.getElementById('connectServer');
    if (!el) return;
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import copy from 'copy-to-clipboard';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';

  import ApiUtil from '$lib/api.util';
  import tooltip from '$lib/tooltip.util';
  import { onPlatformKey, subscribePlatformKey } from '$lib/panelRealtime.js';

  import { showError as showErrorToast } from '$lib/components/ToastContainer.svelte';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  /** How long one platform key lives (Pano's `PlatformCodeManager`). */
  const KEY_PERIOD_MS = 30000;

  /**
   * How late a pushed key may be — after opening, or after the shown key expired — before it is
   * fetched over HTTP once instead (socket down, or a Pano without the `platformKey` feed).
   */
  const PUSH_GRACE_MS = 4000;

  const platformServerMatchKey = getContext('platformServerMatchKey');
  const platformKeyRefreshedTime = getContext('platformKeyRefreshedTime');
  const platformHostAddress = getContext('platformHostAddress');
  const session = getContext('session');

  let timeToRefreshKey = '...';
  let commandText;
  let isCommandTextCopied = false;
  let copyClickIDForCommandText = 0;
  let isCommandTextForConsoleCopied = false;
  let copyClickIDForCommandTextForConsole = 0;
  let isRemoteConnection = false;

  /** When the shown key stops being valid, on this browser's clock. */
  let keyExpiresAt = 0;
  /** When the HTTP fallback kicks in if no key has been pushed by then. */
  let fallbackAt = 0;
  let fallbackInFlight = false;
  /** @type {ReturnType<typeof setInterval> | null} */
  let countdownTimer = null;
  /** @type {(() => void) | null} */
  let releasePlatformKey = null;

  const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

  let acceptPluginAuth = $session.basicData.acceptPluginAuth;
  let toggleLoading;

  /**
   * @param {number|string} key
   * @param {number} timeStarted
   * @param {number} expiresAt this browser's clock
   */
  function applyKey(key, timeStarted, expiresAt) {
    platformServerMatchKey.set(key);
    platformKeyRefreshedTime.set(timeStarted);

    keyExpiresAt = expiresAt;
    fallbackAt = expiresAt + PUSH_GRACE_MS;

    tick();
  }

  function tick() {
    const now = Date.now();
    const left = Math.ceil((keyExpiresAt - now) / 1000);

    // At zero the next key is on its way over the panel socket; there is nothing to fetch.
    timeToRefreshKey = left > 0 ? Math.min(left, KEY_PERIOD_MS / 1000) : '...';

    if (now >= fallbackAt && !fallbackInFlight) {
      void fetchKey();
    }
  }

  /** The HTTP fallback: one request, only when no key was pushed in time. */
  async function fetchKey() {
    fallbackInFlight = true;
    // A failed request is not retried every second: the next try is a whole period away.
    fallbackAt = Date.now() + KEY_PERIOD_MS;

    const body = await ApiUtil.get({
      path: '/api/panel/platformAuth/refreshKey',
      handler: (response) => response,
    });

    fallbackInFlight = false;

    if (!body || body.error || body.key == null) {
      return;
    }

    const timeStarted = Number(body.timeStarted) || Date.now();

    applyKey(body.key, timeStarted, timeStarted + KEY_PERIOD_MS);
  }

  /** The dialog opened: listen for pushed keys, and count down the one we already have. */
  function startKeyFeed() {
    stopKeyFeed();

    keyExpiresAt = Number(get(platformKeyRefreshedTime) || 0) + KEY_PERIOD_MS;
    // The hub sends the current key as soon as the subscription arrives.
    fallbackAt = Date.now() + PUSH_GRACE_MS;

    releasePlatformKey = subscribePlatformKey();

    tick();

    countdownTimer = setInterval(tick, 1000);
  }

  function stopKeyFeed() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    releasePlatformKey?.();
    releasePlatformKey = null;
  }

  function toggleAcceptPluginAuth() {
    toggleLoading = true;
    ApiUtil.put({
      path: '/api/panel/platformAuth/toggle',
      handler: async (body) => {
        if (body?.error) {
          await showErrorToast('components.toasts.settings-save-error', { errorCode: body.error });
          toggleLoading = false;
          return;
        }

        acceptPluginAuth = body.acceptPluginAuth;
        toggleLoading = false;
      },
    });
  }

  function cleanHostAddress(address) {
    // Strip default/invalid ports: -1 (no port in URL) and 443 (HTTPS default)
    return address.replace(/:(-1|443)$/, '');
  }

  function isLocalDomain(hostname) {
    return LOCAL_HOSTNAMES.has(hostname?.toLowerCase());
  }

  function setDefaultConnectionTab() {
    if (!browser) {
      isRemoteConnection = false;
      return;
    }

    isRemoteConnection = !isLocalDomain(window.location.hostname);
  }

  function updateCommandText() {
    let hostAddress;

    if (!isRemoteConnection) {
      hostAddress = cleanHostAddress(get(platformHostAddress));
    } else {
      // Remote: the address this browser reached Pano on — its host name, plus the port only when
      // the URL carries one. Behind a reverse proxy or a tunnel (Cloudflare, ngrok) that is the
      // proxy's 443, not the port Pano listens on, which a server elsewhere cannot reach.
      hostAddress = window.location.host;
    }

    commandText = '/pano connect ' + hostAddress + ' ' + get(platformServerMatchKey);
  }

  function onCopyCommandText(forConsole = false) {
    if (forConsole) {
      copyClickIDForCommandTextForConsole++;
    } else {
      copyClickIDForCommandText++;
    }

    const id = forConsole ? copyClickIDForCommandTextForConsole : copyClickIDForCommandText;

    const textToCopy =
      forConsole && commandText.startsWith('/') ? commandText.substring(1) : commandText;

    copy(textToCopy);

    if (forConsole) {
      isCommandTextForConsoleCopied = true;
    } else {
      isCommandTextCopied = true;
    }

    setTimeout(function () {
      if (forConsole) {
        if (copyClickIDForCommandTextForConsole === id) {
          isCommandTextForConsoleCopied = false;
        }
      } else {
        if (copyClickIDForCommandText === id) {
          isCommandTextCopied = false;
        }
      }
    }, 1000);
  }

  // Reactive statement for connection type changes
  $: if (browser && typeof isRemoteConnection !== 'undefined') {
    updateCommandText();
  }

  onMount(() => {
    setDefaultConnectionTab();

    const offPlatformKey = onPlatformKey((frame) => {
      if (!releasePlatformKey) {
        return;
      }

      applyKey(frame.key, frame.timeStarted, frame.expiresAt);
    });

    const offHostAddress = platformHostAddress.subscribe(() => {
      updateCommandText();
    });

    const offMatchKey = platformServerMatchKey.subscribe(() => {
      updateCommandText();
    });

    const modalElement = document.getElementById('connectServer');

    const handleShow = () => {
      setDefaultConnectionTab();
      startKeyFeed();
    };

    modalElement?.addEventListener('show.bs.modal', handleShow);
    modalElement?.addEventListener('hidden.bs.modal', stopKeyFeed);

    return () => {
      modalElement?.removeEventListener('show.bs.modal', handleShow);
      modalElement?.removeEventListener('hidden.bs.modal', stopKeyFeed);
      offPlatformKey();
      offHostAddress();
      offMatchKey();
      stopKeyFeed();
    };
  });
</script>
