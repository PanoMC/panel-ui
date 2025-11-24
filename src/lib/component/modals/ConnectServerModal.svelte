<!-- Connect Server Modal -->
<div
  aria-hidden="true"
  class="modal modal fade"
  id="connectServer"
  role="document"
  tabindex="-1">
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
                title={$_(
                  "components.modals.connect-server.toggle-connect-server",
                )}
                aria-label={$_(
                  "components.modals.connect-server.toggle-connect-server",
                )}
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
            {$_("components.modals.connect-server.title")}
          </h5>
        </div>

        <button
          class="btn-close"
          aria-label={$_("buttons.close")}
          data-bs-dismiss="modal"
          title={$_("buttons.close")}
          type="button">
        </button>
      </div>
      <div class="modal-body" class:opacity-50={!acceptPluginAuth}>
        <ol class="list-group list-group-numbered">
          <li class="list-group-item">
            {$_("components.modals.connect-server.steps.1")}
            <br />
            <a
              class="btn btn-secondary mt-2 d-block shadow-none"
              href="{PANO_WEBSITE_URL}/download"
              target="_blank"
              tabindex={acceptPluginAuth ? 0 : -1}
              class:disabled={!acceptPluginAuth}
              >{$_("buttons.download")}
              <i class="fa fa-external-link ms-2"></i></a>
          </li>

          <li class="list-group-item">
            {$_("components.modals.connect-server.steps.2")}
            <br />
            {#if acceptPluginAuth}
              <small class="">
                {$_("components.modals.connect-server.code-refresh", {
                  values: { timeToRefreshKey },
                })}
              </small>
            {/if}
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                value={commandText}
                readonly
                disabled={!acceptPluginAuth} />
              <button
                class="btn border shadow-none btn-outline-primary"
                type="button"
                disabled={!acceptPluginAuth}
                on:click={() => onCopyCommandText(false)}
                aria-label={isCommandTextCopied
                  ? $_("components.modals.connect-server.copied")
                  : $_("components.modals.connect-server.copy")}
                use:tooltip={[
                  isCommandTextCopied
                    ? $_("components.modals.connect-server.copied")
                    : $_("components.modals.connect-server.copy"),
                  { placement: "bottom", hideOnClick: false },
                ]}>
                <i class="fa-regular fa-clipboard"></i>
              </button>
              <button
                class="btn border shadow-none btn-outline-secondary"
                type="button"
                disabled={!acceptPluginAuth}
                on:click={() => onCopyCommandText(true)}
                aria-label={isCommandTextForConsoleCopied
                  ? $_("components.modals.connect-server.copied")
                  : $_("components.modals.connect-server.copy-for-console")}
                use:tooltip={[
                  isCommandTextForConsoleCopied
                    ? $_("components.modals.connect-server.copied")
                    : $_("components.modals.connect-server.copy-for-console"),
                  { placement: "bottom", hideOnClick: false },
                ]}>
                <i class="fa-solid fa-terminal"></i>
              </button>
            </div>
          </li>

          <li class="list-group-item">
            {$_("components.modals.connect-server.steps.3")}
            <br />
            <small class="">
              {$_("components.modals.connect-server.notification-will-come")}
            </small>
          </li>
        </ol>
      </div>
    </div>
  </div>
</div>

<script>
  import { getContext, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import copy from "copy-to-clipboard";
  import { differenceInSeconds } from "date-fns";
  import { _ } from "svelte-i18n";

  import { browser } from "$app/environment";

  import ApiUtil from "$lib/api.util";
  import tooltip from "$lib/tooltip.util";

  import { PANO_WEBSITE_URL, PRERELEASE } from "$lib/variables.js";

  const platformServerMatchKey = getContext("platformServerMatchKey");
  const platformKeyRefreshedTime = getContext("platformKeyRefreshedTime");
  const platformHostAddress = getContext("platformHostAddress");
  const session = getContext("session");

  let timeToRefreshKey = "...";
  let commandText;
  let isCommandTextCopied = false;
  let copyClickIDForCommandText = 0;
  let isCommandTextForConsoleCopied = false;
  let copyClickIDForCommandTextForConsole = 0;
  let firstStartCountDown = false;

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

        timeToRefreshKey = "...";

        refreshKey();
      }
    }, 1000);
  }

  function refreshKey() {
    ApiUtil.get({
      path: "/api/panel/platformAuth/refreshKey",
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
      path: "/api/panel/platformAuth/toggle",
      handler: (body) => {
        if (body.error) {
          location.reload();

          return;
        }

        acceptPluginAuth = body.acceptPluginAuth;
        toggleLoading = false;
      },
    });
  }

  function updateCommandText() {
    commandText =
      "/pano connect " +
      get(platformHostAddress) +
      " " +
      get(platformServerMatchKey);
  }

  function onCopyCommandText(forConsole = false) {
    if (forConsole) {
      copyClickIDForCommandTextForConsole++;
    } else {
      copyClickIDForCommandText++;
    }

    const id = forConsole
      ? copyClickIDForCommandTextForConsole
      : copyClickIDForCommandText;

    const textToCopy =
      forConsole && commandText.startsWith("/")
        ? commandText.substring(1)
        : commandText;

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
