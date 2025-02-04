<!-- Servers Modal -->
<div
  class="modal fade"
  aria-hidden="true"
  id="{dialogID}"
  role="dialog"
  data-bs-scroll="true"
  tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <div class="row justify-content-between w-100">
          <div class="col-4">
            <button
              class="btn btn-secondary btn-sm"
              data-bs-target="#connectServer"
              data-bs-toggle="modal"
              on:click="{hide}">
              <i class="fa-solid fa-plus"></i>
              <span class="d-xl-inline d-none ms-2"
                >{$_("components.modals.servers.connect-server-button")}</span>
            </button>
          </div>
          <div class="col-4 d-flex justify-content-center align-items-center">
            <h5 class="modal-title pr-2">
              {$_("components.modals.servers.servers")}
            </h5>
          </div>
          <div class="col-4 d-flex align-items-center">
            <button
              aria-label="{$_('components.modals.servers.close')}"
              class="btn-close"
              on:click="{hide}"
              title="{$_('components.modals.servers.close')}"
              type="button">
            </button>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="row">
          {#if $loading}
            {#each Array(4) as _, i}
              <div class="col-xl-3 col-6 mb-2">
                <div class="card">
                  <div class="card-body text-center">
                    <p class="card-text placeholder-glow">
                      <span class="placeholder col-3"></span>
                    </p>
                    <h6 class="card-title placeholder-glow">
                      <span class="placeholder col-7"></span>
                    </h6>
                    <p class="card-text placeholder-glow">
                      <span class="placeholder col-3"></span>
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            {#each $servers as server, index (server)}
              <!-- Server Card -->

              <div class="col-xl-3 col-6 mb-2">
                <a
                  href="javascript:void(0);"
                  on:click="{() => ($selectingServer ? {} : onSelect(server))}"
                  class="card bg-light animate__animated animate__fadeIn"
                  class:border="{$selectedServer &&
                    $selectedServer.id === server.id}"
                  class:border-3="{$selectedServer &&
                    $selectedServer.id === server.id}"
                  class:border-primary="{$selectedServer &&
                    $selectedServer.id === server.id}"
                  class:opacity-50="{$selectingServer}">
                  <div class="card-body text-center position-relative h-100">
                    {#if server.id === $mainServer.id}
                      <div
                        class="position-absolute top-0 start-50 translate-middle rounded bg-primary p-1 text-white"
                        use:tooltip="{[
                          $_('components.modals.servers.main-server'),
                          { placement: 'bottom' },
                        ]}">
                        <i class="fa-solid fa-house"></i>
                      </div>
                    {/if}
                    <img
                      src="{server.favicon
                        ? server.favicon
                        : 'https://icons.iconarchive.com/icons/chrisl21/minecraft/64/Crafting-Table-icon.png'}"
                      class="rounded d-block m-auto mb-3 bg-white"
                      height="64"
                      width="64"
                      alt="" />

                    {#if server.status === "ONLINE"}
                      <p
                        class="badge bg-secondary text-white rounded-pill mb-3"
                        use:tooltip="{[
                          $_('components.modals.servers.online'),
                          { placement: 'bottom' },
                        ]}">
                        {server.type}
                      </p>
                    {:else}
                      <p class="badge bg-white text-black rounded-pill mb-3">
                        {server.type}
                      </p>
                    {/if}
                    <h6 class="card-title">{server.host}:{server.port}</h6>
                    <p class="card-text text-muted">
                      {server.playerCount}/{server.maxPlayerCount}
                    </p>
                  </div>
                </a>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- No Server -->
      {#if $servers.length === 0 && !$loading}
        <NoContent />
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable } from "svelte/store";

  import { showNetworkErrorOnCatch } from "$lib/Store.js";
  import ApiUtil from "$lib/api.util.js";
  import tooltip from "$lib/tooltip.util";

  const dialogID = "serversModal";

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const servers = writable([]);
  const loading = writable(true);
  const selectingServer = writable(null);

  export function show() {
    modal = new window.bootstrap.Modal(document.getElementById(dialogID));

    selectingServer.set(null);
    loading.set(true);

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
    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/servers`,
      })
        .then((body) => {
          if (body.result === "ok") {
            servers.set(body.servers);
            loading.set(false);
          } else reject();
        })
        .catch(() => {
          reject();
        });
    });
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { invalidateAll } from "$app/navigation";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import ServerNotExistsToast from "$lib/component/toasts/ServerNotExistsToast.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import ServerSelectedToast from "$lib/component/toasts/ServerSelectedToast.svelte";

  const mainServer = getContext("mainServer");
  const selectedServer = getContext("selectedServer");

  function onSelect(server) {
    selectingServer.set(server.id);

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.post({
        path: `/api/panel/servers/${server.id}/select`,
      })
        .then(async (body) => {
          if (body.result === "ok") {
            $selectedServer = server;
            await invalidateAll();
            hide();
            showToast(ServerSelectedToast, { name: server.name });
          } else if (body.error && body.error === "NOT_EXISTS") {
            showToast(ServerNotExistsToast);
            initData();
          } else reject();
        })
        .catch((err) => {
          console.log(err);
          reject();
        });
    });
  }
</script>
