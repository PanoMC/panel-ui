<div class="card animate__animated animate__fadeIn">
  <div class="card-header">{$_("pages.server.game-integration.minecraft")}</div>
  <div class="card-body">
    <div class="row">
      <label class="col-md-4 col-form-label" for="authIntegration">
        {$_("pages.server.game-integration.auth-integration")}
        <small class="d-block"
          >{$_("pages.server.game-integration.auth-integration-description")}<br />
          <a href="" target="_blank"
            >{$_("buttons.see-docs")} <i class="fas fa-external-link"></i></a
          ></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="authIntegration"
            bind:checked="{serverSettings.authIntegration}"
            autocomplete="off"/>
        </div>
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label position-relative" class:text-muted={!serverSettings.authIntegration} for="authRequireVerified">
        <span class="position-absolute start-0 top-0 bottom-0 border-start border-2" class:border-secondary={serverSettings.authIntegration} class:border-muted={!serverSettings.authIntegration} style="width: 2px;"></span>
        <span class="ps-3 d-block">
          {$_("pages.server.game-integration.auth-require-verified")}
          <small class="d-block"
            >{$_("pages.server.game-integration.auth-require-verified-description")}<br />
            <a href="" target="_blank" class:text-muted={!serverSettings.authIntegration}
              >{$_("buttons.see-docs")} <i class="fas fa-external-link"></i></a
            ></small
          >
        </span>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="authRequireVerified"
            bind:checked={serverSettings.authRequireVerified}
            disabled={!serverSettings.authIntegration}
            autocomplete="off"/>
        </div>
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label position-relative" class:text-muted={!serverSettings.authIntegration} for="authKickAfterRegister">
        <span class="position-absolute start-0 top-0 bottom-0 border-start border-2" class:border-secondary={serverSettings.authIntegration} class:border-muted={!serverSettings.authIntegration} style="width: 2px;"></span>
        <span class="ps-3 d-block">
          {$_("pages.server.game-integration.auth-kick-after-register")}
          <small class="d-block"
            >{$_("pages.server.game-integration.auth-kick-after-register-description")}<br />
            <a href="" target="_blank" class:text-muted={!serverSettings.authIntegration}
              >{$_("buttons.see-docs")} <i class="fas fa-external-link"></i></a
            ></small
          >
        </span>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="authKickAfterRegister"
            bind:checked={serverSettings.authKickAfterRegister}
            disabled={!serverSettings.authIntegration}
            autocomplete="off"/>
        </div>
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label" for="banIntegration">
        {$_("pages.server.game-integration.ban-integration")}
        <small class="d-block"
          >{$_("pages.server.game-integration.ban-integration-description")}<br />
          <a href="" target="_blank"
            >{$_("buttons.see-docs")} <i class="fas fa-external-link"></i></a
          ></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="banIntegration"
            bind:checked="{serverSettings.banIntegration}"
            autocomplete="off"/>
        </div>
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label" for="permissionIntegration">
        {$_("pages.server.game-integration.permission-integration")}
        <small class="d-block"
          >{$_("pages.server.game-integration.permission-integration-description")}<br />
          <a href="" target="_blank"
            >{$_("buttons.see-docs")} <i class="fas fa-external-link"></i></a
          ></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="permissionIntegration"
            bind:checked="{serverSettings.permissionIntegration}"
            autocomplete="off"/>
        </div>
      </div>
    </div>

    <button
      class="btn btn-secondary"
      class:disabled={saving || saveDisabled}
      aria-disabled={saving || saveDisabled}
      on:click={save}>
      {$_("buttons.save")}
    </button>
  </div>
</div>

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

    const serverSettings = response.server.settings

    return {serverSettings, serverSettingsOriginal: structuredClone(serverSettings)}
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.server.game-integration.title");

  export let data;

  let {serverSettings, serverSettingsOriginal} = data;

  let saving;

  $: saveDisabled = saving || JSON.stringify(serverSettings) === JSON.stringify(serverSettingsOriginal)

  function save() {
    saving = true;

    ApiUtil.put({
      path: `/api/panel/servers/${data.selectedServer.id}/settings`,
      body: { settings: serverSettings },
      handler: async (body, reject) => {
        saving = false;

        if (body.result !== "ok") {
          reject()

          return
        }

        serverSettingsOriginal = structuredClone(serverSettings)
      }
    });
  }
</script>
