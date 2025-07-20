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
        <h5 class="modal-title">
          {$_("components.modals.connect-server.title")}
        </h5>
        <button
          class="btn-close"
          data-bs-dismiss="modal"
          title="{$_('buttons.close')}"
          type="button">
        </button>
      </div>
      <div class="modal-body">
        <ol class="list-group list-group-numbered">
          <div class="list-group-item">
            {$_("components.modals.connect-server.steps.1")}
            <br />
            <small class="text-muted"
              >Paper 1.20, Spigot 1.20, Velocity, 1.2, Bungeecord 1.2
            </small>
            <a
              class="btn btn-secondary mt-2 d-block shadow-none"
              href="{PANO_WEBSITE_URL}/download/plugin/mc{PRERELEASE
                ? '?type=prerelease'
                : ''}"
              target="_blank">{$_("buttons.download")}</a>
          </div>

          <div class="list-group-item">
            {$_("components.modals.connect-server.steps.2")}
            <br />
            <small class="text-muted">
              {$_("components.modals.connect-server.code-refresh", {
                values: { timeToRefreshKey },
              })}
            </small>
            <div class="input-group">
              <input type="text" class="form-control" value="{commandText}" readonly />
              <button
                class="btn btn-link border"
                type="button"
                id="button-addon2"
                on:click="{onCopyCommandTextClick}"
                use:tooltip="{[
                  isCommandTextCopied
                    ? $_('components.modals.connect-server.copied')
                    : $_('components.modals.connect-server.copy'),
                  { placement: 'bottom', hideOnClick: false },
                ]}">
                <i class="fa-regular fa-clipboard"></i>
              </button>
            </div>
          </div>

          <div class="list-group-item">
            {$_("components.modals.connect-server.steps.3")}
            <br />
            <small class="text-muted">
              {$_("components.modals.connect-server.notification-will-come")}
            </small>
          </div>
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

  let timeToRefreshKey = "...";
  let commandText;
  let isCommandTextCopied = false;
  let copyClickIDForCommandText = 0;
  let firstStartCountDown = false;

  const platformServerMatchKey = getContext("platformServerMatchKey");
  const platformKeyRefreshedTime = getContext("platformKeyRefreshedTime");
  const platformHostAddress = getContext("platformHostAddress");

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

  function updateCommandText() {
    commandText =
      "/pano connect " +
      get(platformHostAddress) +
      " " +
      get(platformServerMatchKey);
  }

  function onCopyCommandTextClick() {
    copyClickIDForCommandText++;

    const id = copyClickIDForCommandText;

    copy(commandText);

    isCommandTextCopied = true;

    setTimeout(function () {
      if (copyClickIDForCommandText === id) {
        isCommandTextCopied = false;
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
