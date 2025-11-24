<!-- Server Settings Sub Page -->
<div class="card animate__animated animate__fadeIn">
  <div class="card-header">Tercihler</div>
  <div class="card-body">
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="serverName">
        {$_("pages.server.settings.server-name")}
      </label>
      <div class="col">
        <div class="mb-3">
          <input
            type="text"
            class="form-control"
            name="serverName"
            id="serverName"
            bind:value="{server.customName}"
            on:input={onNameChange}
            placeholder={$_("pages.server.settings.server-name")} />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="mainServer">
        {$_("pages.server.settings.main-server")}
        <small class="d-block"
          >{$_("pages.server.settings.main-server-info")}</small>
      </label>
      <div class="col col-form-label">
        {#if $selectedServer.id === $mainServer.id}
          <button class="btn btn-secondary btn-sm disabled" disabled>
            <i class="fa-solid fa-check me-1"></i>
            {$_("pages.server.settings.already-main-server", {
              values: { serverName: $selectedServer.customName || $selectedServer.name },
            })}
          </button>
        {:else}
          <button
            on:click={() => showMakeMainServerModal($selectedServer)}
            class="btn btn-secondary btn-sm">
            <i class="fas fa-crown me-1"></i>
            {$_("pages.server.settings.make-main-server")}</button>
        {/if}
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="removeServer">
        {$_("pages.server.settings.remove-server")}
      </label>
      <div class="col hstack gap-2">
        <span class="badge text-bg-primary">{$selectedServer.customName || $selectedServer.name}</span>
        <button
          type="button"
          title={$_("buttons.remove")}
          aria-label={$_("buttons.remove")}
          on:click={() => showRemoveServerModal($selectedServer)}
          class="btn-close">
        </button>
      </div>
    </div>

    <button class="btn btn-secondary"
      class:disabled={saving || saveDisabled}
      aria-disabled={saving || saveDisabled}
      on:click={save}>
      {$_("buttons.save")}
    </button>
  </div>
</div>

<MakeMainServerModal />
<RemoveServerModal />

<script context="module">
  import ApiUtil from "$lib/api.util.js";

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {

    const { parent } = event;
    const parentData = await parent();
    const { selectedServer } = parentData;

    const response = await ApiUtil.get({
      path: `/api/panel/servers/${selectedServer.id}`,
      request: event,
    });

    const { server } = response

    if (!server.customName) {
      server.customName = server.name
    }

    return {server, serverOriginal: structuredClone(server)}
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import MakeMainServerModal, {
    show as showMakeMainServerModal,
  } from "$lib/component/modals/MakeMainServerModal.svelte";
  import RemoveServerModal, {
    show as showRemoveServerModal,
  } from "$lib/component/modals/RemoveServerModal.svelte";

  export let data;

  let {server, serverOriginal} = data

  const mainServer = getContext("mainServer");
  const selectedServer = getContext("selectedServer");
  const pageTitle = getContext("pageTitle");

  let saving;

  $: saveDisabled = saving || JSON.stringify(server) === JSON.stringify(serverOriginal) || !server.customName || server.customName === server.name

  pageTitle.set("pages.server.settings.title");

  function onNameChange(event) {
    let value = event.target.value;

    if (value.length > 64) {
      value = value.substring(0, 64);
    }

    server.customName = value;
  }

  function save() {
    saving = true;

    ApiUtil.put({
      path: `/api/panel/servers/${data.selectedServer.id}/settings`,
      body: { customName: server.customName },
      handler: async (body, reject) => {
        saving = false;

        if (body.result !== "ok") {
          reject()
          return
        }

        serverOriginal = structuredClone(server)

        if ($selectedServer.id === server.id) {
          $selectedServer = structuredClone(server)
        }
      }
    });
  }
</script>
