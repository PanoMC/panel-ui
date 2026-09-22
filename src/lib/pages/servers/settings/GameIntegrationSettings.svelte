<div class="card">
  <div class="card-header">{$_('pages.servers.game-integration.minecraft')}</div>
  <div class="card-body">
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="authIntegration">
        {$_('pages.servers.game-integration.auth-integration')}
        <small class="d-block"
          >{$_('pages.servers.game-integration.auth-integration-description')}<br />
          <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/authme" target="_blank"
            >{$_('buttons.see-docs')} <i class="fas fa-external-link"></i></a
          ></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="authIntegration"
            bind:checked={serverSettings.authIntegration}
            autocomplete="off" />
        </div>
      </div>
    </div>
    {#if !requireEmailVerification}
      <div class="alert alert-warning py-2 mb-3" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {$_('pages.servers.game-integration.auth-require-verified-disabled-warning')}
      </div>
    {/if}
    <div class="row mb-3">
      <label class="col-md-6 col-form-label position-relative" for="authRequireVerified">
        <span
          class="position-absolute start-0 top-0 bottom-0 border-start border-2"
          class:border-secondary={serverSettings.authIntegration}
          class:border-gray={!serverSettings.authIntegration}
          style="width: 2px;"></span>
        <span class="ps-3 d-block">
          {$_('pages.servers.game-integration.auth-require-verified')}
          <small class="d-block"
            >{$_('pages.servers.game-integration.auth-require-verified-description')}<br />
            <a
              href="{PANO_WEBSITE_URL}/docs/platform/integrations/authme/#step-3-verify-auth-integration-is-enabled-in-panel"
              target="_blank">{$_('buttons.see-docs')} <i class="fas fa-external-link"></i></a
            ></small>
        </span>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="authRequireVerified"
            bind:checked={serverSettings.authRequireVerified}
            disabled={!serverSettings.authIntegration || !requireEmailVerification}
            autocomplete="off" />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label position-relative" for="authKickAfterRegister">
        <span
          class="position-absolute start-0 top-0 bottom-0 border-start border-2"
          class:border-secondary={serverSettings.authIntegration}
          class:border-gray={!serverSettings.authIntegration}
          style="width: 2px;"></span>
        <span class="ps-3 d-block">
          {$_('pages.servers.game-integration.auth-kick-after-register')}
          <small class="d-block"
            >{$_('pages.servers.game-integration.auth-kick-after-register-description')}<br />
            <a
              href="{PANO_WEBSITE_URL}/docs/platform/integrations/authme/#step-3-verify-auth-integration-is-enabled-in-panel"
              target="_blank">{$_('buttons.see-docs')} <i class="fas fa-external-link"></i></a
            ></small>
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
            autocomplete="off" />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="permissionIntegration">
        {$_('pages.servers.game-integration.permission-integration')}
        <small class="d-block"
          >{$_('pages.servers.game-integration.permission-integration-description')}<br />
          <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/luckperms/" target="_blank"
            >{$_('buttons.see-docs')} <i class="fas fa-external-link"></i></a
          ></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="permissionIntegration"
            bind:checked={serverSettings.permissionIntegration}
            autocomplete="off" />
        </div>
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-md-6 col-form-label" for="banIntegration">
        {$_('pages.servers.game-integration.ban-integration')}
        <small class="d-block"
          >{$_('pages.servers.game-integration.ban-integration-description')}<br />
          <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/ban-management/" target="_blank"
            >{$_('buttons.see-docs')} <i class="fas fa-external-link"></i></a
          ></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="banIntegration"
            bind:checked={serverSettings.banIntegration}
            autocomplete="off" />
        </div>
      </div>
    </div>

    <button
      class="btn btn-secondary"
      class:disabled={saving || saveDisabled}
      aria-disabled={saving || saveDisabled}
      on:click={save}>
      {$_('buttons.save')}
    </button>
  </div>
</div>

<script context="module">
  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const parentData = await parent();
    const { server, requireEmailVerification } = parentData;

    const serverSettings = structuredClone(server.settings);

    return {
      serverSettings,
      serverSettingsOriginal: structuredClone(serverSettings),
      requireEmailVerification,
    };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { PANO_WEBSITE_URL } from '@panomc/sdk/core/js/variables.js';

  import ApiUtil from '$lib/api.util.js';

  export let data;

  const server = getContext('server');

  let serverSettings;
  let serverSettingsOriginal;
  let requireEmailVerification;

  $: if (data?.serverSettings) {
    serverSettings = data.serverSettings;
    serverSettingsOriginal = structuredClone(data.serverSettingsOriginal);
    requireEmailVerification = data.requireEmailVerification;
  }

  let saving;

  $: saveDisabled =
    saving || JSON.stringify(serverSettings) === JSON.stringify(serverSettingsOriginal);

  /** The switches this page owns; everything else in `settings` belongs to another page. */
  const INTEGRATION_KEYS = [
    'authIntegration',
    'authRequireVerified',
    'authKickAfterRegister',
    'banIntegration',
    'permissionIntegration',
  ];

  function save() {
    saving = true;

    // Only this page's switches: the load data this copy came from is not refreshed after a save
    // elsewhere, so sending the whole blob would put back a stale `autoUpdateCheck` (SM-69).
    const settings = Object.fromEntries(INTEGRATION_KEYS.map((key) => [key, serverSettings[key]]));

    ApiUtil.put({
      path: `/api/panel/servers/${$server.id}/settings`,
      body: { settings },
      handler: async (body, reject) => {
        saving = false;

        if (body.result !== 'ok') {
          reject();

          return;
        }

        serverSettingsOriginal = structuredClone(serverSettings);

        server.update((current) => ({
          ...current,
          settings: { ...current.settings, ...settings },
        }));
      },
    });
  }
</script>
