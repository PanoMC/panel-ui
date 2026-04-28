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
  import { getContext, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import copy from 'copy-to-clipboard';
  import { differenceInSeconds } from 'date-fns';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';

  import ApiUtil from '$lib/api.util';
  import tooltip from '$lib/tooltip.util';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';

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
  let firstStartCountDown = false;
  let isRemoteConnection = false;

  const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

  let acceptPluginAuth = $session.basicData.acceptPluginAuth;
  let toggleLoading;

  function getTimeLeftInSeconds() {
    const now = new Date(); // current time
    const end = new Date(get(platformKeyRefreshedTime)); // future time

    const difference = differenceInSeconds(now, end);

    return 30 - difference;
  }

  function startCountDown() {
    timeToRefreshKey = getTimeLeftInSeconds();

    const timer = setInterval(() => {
      if (timeToRefreshKey > 0) {
        timeToRefreshKey--;
      } else {
        clearInterval(timer);

        timeToRefreshKey = '...';

        refreshKey();
      }
    }, 1000);
  }

  function refreshKey() {
    ApiUtil.get({
      path: '/api/panel/platformAuth/refreshKey',
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        platformServerMatchKey.set(body.key);
        platformKeyRefreshedTime.set(body.timeStarted);

        if (!firstStartCountDown) {
          return;
        }

        startCountDown();
      },
    });
  }

  function toggleAcceptPluginAuth() {
    toggleLoading = true;
    ApiUtil.put({
      path: '/api/panel/platformAuth/toggle',
      handler: async (body) => {
        if (body?.error) {
          await showToast('components.toasts.settings-save-error', { errorCode: body.error });
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
      // remote: use browser hostname and port from platformHostAddress if exists
      const platformAddress = cleanHostAddress(get(platformHostAddress));
      const portMatch = platformAddress.match(/:(\d+)$/);
      const port = portMatch ? portMatch[1] : null;
      const hostname = window.location.hostname;

      hostAddress = port ? `${hostname}:${port}` : hostname;
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

    const modalElement = document.getElementById('connectServer');
    if (!modalElement) return;

    const handleShow = () => {
      setDefaultConnectionTab();
    };

    modalElement.addEventListener('show.bs.modal', handleShow);

    return () => {
      modalElement.removeEventListener('show.bs.modal', handleShow);
    };
  });

  if (browser) {
    onDestroy(
      platformKeyRefreshedTime.subscribe((value) => {
        if (value !== 0 && !firstStartCountDown) {
          firstStartCountDown = true;

          startCountDown();
        }
      }),
    );

    onDestroy(
      platformHostAddress.subscribe(() => {
        updateCommandText();
      }),
    );

    onDestroy(
      platformServerMatchKey.subscribe(() => {
        updateCommandText();
      }),
    );
  }
</script>
