<!-- Servers Modal -->
<div
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  data-bs-scroll="true"
  tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_("components.modals.servers.servers")}
        </h5>
        <button
          aria-label={$_("buttons.close")}
          class="btn-close"
          on:click={hide}
          title={$_("buttons.close")}
          type="button">
        </button>
      </div>

      <div class="modal-body">
        <div class="row row-cols-1 row-cols-lg-3 g-3">
          {#if $loading}
            {#each Array(4) as _, i}
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
          {:else}
            {#each $servers as server, index (server)}
              <!-- Server Card -->

              <div class="col">
                <div class="card h-100 position-relative">
                  <div class="card-header text-center">
                    <img
                      src={server.favicon
                        ? server.favicon
                        : base + "/assets/img/server-icon.png"}
                      class="rounded d-block mx-auto mb-2"
                      height="64"
                      width="64"
                      alt="" />

                    <div>
                      {#if server.id === $mainServer.id}
                        <i
                          class="fa fa-crown me-1"
                          title={$_("components.modals.servers.main-server")}>
                        </i>

                        {server.name}
                      {/if}
                    </div>
                  </div>
                  <ul class="list-group list-group-flush text-center">
                    <li class="list-group-item">
                      <div
                        class="badge rounded-pill text-bg-primary"
                        class:text-bg-success={server.status === "ONLINE"}>
                        <div
                          use:tooltip={[
                            $_("components.modals.servers.online"),
                            { placement: "bottom" },
                          ]}>
                          {server.type}
                        </div>
                      </div>
                    </li>
                    <li class="list-group-item font-monospace user-select-all">
                      {server.host}:{server.port}
                    </li>
                    <li class="list-group-item">
                      {server.playerCount}/{server.maxPlayerCount}
                    </li>
                  </ul>
                  <div class="card-footer d-flex justify-content-center">
                    <button
                      class:active={$selectedServer?.id === server.id}
                      data-bs-toggle="button"
                      class="btn btn-outline-primary"
                      type="button"
                      on:click={() =>
                        $selectingServer ? {} : onSelect(server)}
                      >{$selectedServer?.id === server.id
                        ? "Selected"
                        : "Select Server"}</button>
                  </div>
                </div>
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
  import { get, writable } from "svelte/store";

  import ApiUtil from "$lib/api.util.js";
  import tooltip from "$lib/tooltip.util";

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const servers = writable([]);
  const loading = writable(true);
  const selectingServer = writable(null);

  export function show() {
    modal = new window.bootstrap.Modal(get(modalElement));

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
    ApiUtil.get({
      path: `/api/panel/servers`,
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        servers.set(body.servers);
        loading.set(false);
      },
    });
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { invalidateAll } from "$app/navigation";
  import { base } from "$app/paths";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import NoContent from "$lib/component/NoContent.svelte";

  const mainServer = getContext("mainServer");
  const selectedServer = getContext("selectedServer");

  function onSelect(server) {
    selectingServer.set(server.id);

    ApiUtil.post({
      path: `/api/panel/servers/${server.id}/select`,
      handler: async (body, reject) => {
        if (body.result === "ok") {
          $selectedServer = server;
          await invalidateAll();
          hide();
          await showToast("components.toasts.server-selected", {
            name: server.name,
          });

          return;
        } else if (body.error && body.error === "NOT_EXISTS") {
          await showToast("components.toasts.server-not-exists");
          initData();

          return;
        }

        reject();
      },
    });
  }
</script>
