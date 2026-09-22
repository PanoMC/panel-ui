<style>
  .pairing-code {
    font-size: 2.25rem;
    letter-spacing: 0.35rem;
  }

  .private-key-input {
    font-size: 0.8125rem;
  }

  .fingerprint {
    word-break: break-all;
  }
</style>

<!--
  Add node (SM-24c + SM-40/41/42). Four ways onto a machine: the local daemon Pano runs itself,
  a command the admin pastes on the other machine, an SSH session Pano opens for them, and a
  Coolify deployment. The last two hand their credentials over once and never store them — the
  form clears them as soon as the request is away (§2.4.10, §2.7).
-->
<div
  aria-hidden="true"
  aria-labelledby="addNodeTitle"
  class="modal fade"
  id="addNode"
  role="dialog"
  tabindex="-1"
  bind:this={modalElement}>
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="addNodeTitle">{$_('pages.servers.nodes.add-title')}</h5>
        <button
          class="btn-close"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="modal"
          type="button"
          disabled={bootstrapRunning}>
        </button>
      </div>

      <div class="modal-body">
        <ul class="nav nav-tabs mb-3">
          {#each TABS as entry (entry.id)}
            <li class="nav-item">
              <!-- A disabled button swallows pointer events, so the tooltip sits outside. -->
              <span
                class="d-inline-block"
                use:tooltip={[
                  tabDisabledReason(entry) ? $_(tabDisabledReason(entry)) : '',
                  { placement: 'top' },
                ]}>
                <button
                  type="button"
                  class="nav-link"
                  class:active={tab === entry.id}
                  disabled={!!tabDisabledReason(entry)}
                  onclick={() => selectTab(entry.id)}>
                  <i class="{entry.icon} me-1" aria-hidden="true"></i>
                  {$_(entry.label)}
                </button>
              </span>
            </li>
          {/each}
        </ul>

        {#if tab === 'local'}
          <p class="text-body-secondary">{$_('pages.servers.nodes.local-description')}</p>

          <button
            type="button"
            class="btn btn-primary"
            disabled={localSetupBusy}
            onclick={setupLocalNode}>
            {#if localSetupBusy}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            {:else}
              <i class="fa-solid fa-bolt me-1" aria-hidden="true"></i>
            {/if}
            {$_('pages.servers.create.setup-local-node')}
          </button>
        {:else if tab === 'manual'}
          <p class="text-body-secondary">{$_('pages.servers.nodes.manual-description')}</p>

          {#if pairingUnavailable}
            <div class="alert alert-warning mb-0" role="alert">
              {$_('pages.servers.nodes.pairing-unavailable')}
            </div>
          {:else}
            <div class="text-center py-2">
              {#if pairingLoading && !code}
                <span class="spinner-border" role="status" aria-hidden="true"></span>
              {:else}
                <div class="pairing-code font-monospace fw-semibold">{code || '——————'}</div>
                <div class="small text-body-secondary mt-1">
                  {$_('pages.servers.nodes.pairing-refresh', {
                    values: { seconds: secondsLeft },
                  })}
                </div>
              {/if}
            </div>

            <div class="btn-group btn-group-sm mt-3" role="group">
              {#each PLATFORMS as entry (entry.id)}
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  class:active={platform === entry.id}
                  onclick={() => (platform = entry.id)}>
                  <i class="{entry.icon} me-1" aria-hidden="true"></i>
                  {$_(entry.label)}
                </button>
              {/each}
            </div>

            <label class="form-label mt-2" for="addNodeCommand">
              {$_('pages.servers.nodes.pairing-command')}
            </label>
            <div class="input-group">
              <input
                id="addNodeCommand"
                type="text"
                class="form-control font-monospace"
                value={commandText}
                readonly />
              <button
                class="btn btn-outline-primary"
                type="button"
                onclick={copyCommand}
                aria-label={$_('components.modals.connect-server.copy')}
                use:tooltip={[
                  copied
                    ? $_('components.modals.connect-server.copied')
                    : $_('components.modals.connect-server.copy'),
                  { placement: 'bottom', hideOnClick: false },
                ]}>
                <i class="fa-regular fa-clipboard" aria-hidden="true"></i>
              </button>
            </div>
            <div class="form-text">{$_('pages.servers.nodes.pairing-hint')}</div>

            <!-- A backend from before the ready-made commands (§2.4.10): what is shown is the
                 panel's own guess, so the address in it is worth a look. -->
            {#if code && !installCommand && !installCommandWindows}
              <div class="alert alert-warning small mt-3 mb-0" role="alert">
                {$_('components.modals.add-node.pano-url.unsupported')}
              </div>
            {/if}

            {@render advancedPanoUrl('addNodeManualPanoUrl', 'mt-3')}
          {/if}
        {:else if phase === Phases.PROGRESS}
          <p class="text-body-secondary small">
            {$_('components.modals.add-node.progress-description')}
          </p>

          <NodeBootstrapLog
            lines={bootstrapLines}
            status={bootstrapStatus}
            percent={bootstrapPercent}
            error={bootstrapError} />

          {#if bootstrapRefusal}
            <!-- Another system's words (§2.7): rendered as text, and never as a key. -->
            <div class="alert alert-danger mt-3 mb-0 py-2 small" role="alert">
              <div class="fw-semibold">{$_(bootstrapRefusalLabel)}</div>
              <span class="text-break">{bootstrapRefusal}</span>
            </div>
          {/if}

          {#if bootstrapStatus === 'FAILED'}
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm mt-3"
              onclick={backToForm}>
              <i class="fa-solid fa-arrow-left me-1" aria-hidden="true"></i>
              {$_('components.modals.add-node.back')}
            </button>
          {/if}
        {:else if phase === Phases.FINGERPRINT}
          <p class="text-body-secondary small">
            {$_('components.modals.add-node.fingerprint-description', {
              values: { host: sshHost },
            })}
          </p>

          <div class="alert alert-warning" role="alert">
            <div class="small text-uppercase fw-semibold mb-1">
              {$_('components.modals.add-node.fingerprint-label')}
            </div>
            <code class="fingerprint">{bootstrapFingerprint}</code>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-primary"
              disabled={submitting}
              onclick={confirmFingerprint}>
              {#if submitting}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_('components.modals.add-node.fingerprint-confirm')}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              disabled={submitting}
              onclick={backToForm}>
              {$_('buttons.cancel')}
            </button>
          </div>
        {:else if tab === 'ssh'}
          <p class="text-body-secondary small">
            {$_('components.modals.add-node.ssh-description')}
          </p>

          <form class="row g-3" onsubmit={onSubmitSsh}>
            <div class="col-md-8">
              <label class="form-label" for="addNodeSshHost">
                {$_('components.modals.add-node.host-label')}
              </label>
              <input
                id="addNodeSshHost"
                type="text"
                class="form-control"
                autocomplete="off"
                spellcheck="false"
                placeholder="node.example.com"
                bind:value={sshHost} />
            </div>

            <div class="col-md-4">
              <label class="form-label" for="addNodeSshPort">
                {$_('components.modals.add-node.port-label')}
              </label>
              <input
                id="addNodeSshPort"
                type="number"
                class="form-control"
                min="1"
                max="65535"
                bind:value={sshPort} />
            </div>

            <div class="col-md-6">
              <label class="form-label" for="addNodeSshUsername">
                {$_('components.modals.add-node.username-label')}
              </label>
              <input
                id="addNodeSshUsername"
                type="text"
                class="form-control"
                autocomplete="off"
                spellcheck="false"
                placeholder="root"
                bind:value={sshUsername} />
            </div>

            <div class="col-md-6">
              <label class="form-label" for="addNodeSshName">
                {$_('components.modals.add-node.name-label')}
              </label>
              <input
                id="addNodeSshName"
                type="text"
                class="form-control"
                maxlength="64"
                placeholder={$_('components.modals.add-node.name-placeholder')}
                bind:value={sshName} />
            </div>

            <div class="col-12">
              <span class="form-label d-block">
                {$_('components.modals.add-node.auth-label')}
              </span>
              <div class="btn-group btn-group-sm" role="group">
                {#each AUTH_TYPES as entry (entry.id)}
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    class:active={sshAuthType === entry.id}
                    onclick={() => (sshAuthType = entry.id)}>
                    <i class="{entry.icon} me-1" aria-hidden="true"></i>
                    {$_(entry.label)}
                  </button>
                {/each}
              </div>
            </div>

            {#if sshAuthType === 'password'}
              <div class="col-12">
                <label class="form-label" for="addNodeSshPassword">
                  {$_('components.modals.add-node.ssh-password-label')}
                </label>
                <input
                  id="addNodeSshPassword"
                  type="password"
                  class="form-control"
                  autocomplete="new-password"
                  bind:value={sshPassword} />
              </div>
            {:else}
              <div class="col-12">
                <label class="form-label" for="addNodeSshKey">
                  {$_('components.modals.add-node.private-key-label')}
                </label>
                <textarea
                  id="addNodeSshKey"
                  class="form-control font-monospace private-key-input"
                  rows="5"
                  spellcheck="false"
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                  bind:value={sshPrivateKey}></textarea>
                <div class="form-text">
                  {$_('components.modals.add-node.private-key-hint')}
                </div>
              </div>

              <div class="col-12">
                <label class="form-label" for="addNodeSshPassphrase">
                  {$_('components.modals.add-node.passphrase-label')}
                </label>
                <input
                  id="addNodeSshPassphrase"
                  type="password"
                  class="form-control"
                  autocomplete="new-password"
                  bind:value={sshPassphrase} />
              </div>
            {/if}

            <div class="col-12">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="addNodeSshSudo"
                  bind:checked={sshSudo} />
                <label class="form-check-label" for="addNodeSshSudo">
                  {$_('components.modals.add-node.sudo-label')}
                </label>
                <div class="form-text">{$_('components.modals.add-node.sudo-hint')}</div>
              </div>
            </div>

            {@render advancedPanoUrl('addNodeSshPanoUrl', 'col-12')}

            {@render currentPasswordField('addNodeSshCurrentPassword')}

            <div class="col-12">
              <button type="submit" class="btn btn-primary" disabled={submitting || !sshValid}>
                {#if submitting}
                  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {/if}
                {$_('components.modals.add-node.ssh-submit')}
              </button>
            </div>
          </form>
        {:else if tab === 'coolify'}
          <p class="text-body-secondary small">
            {$_('components.modals.add-node.coolify-description')}
          </p>

          <form class="row g-3" onsubmit={onSubmitCoolify}>
            <div class="col-md-7">
              <label class="form-label" for="addNodeCoolifyUrl">
                {$_('components.modals.add-node.coolify-url-label')}
              </label>
              <input
                id="addNodeCoolifyUrl"
                type="url"
                class="form-control"
                autocomplete="off"
                spellcheck="false"
                placeholder="https://coolify.example.com"
                bind:value={coolifyUrl} />
            </div>

            <div class="col-md-5">
              <label class="form-label" for="addNodeCoolifyName">
                {$_('components.modals.add-node.name-label')}
              </label>
              <input
                id="addNodeCoolifyName"
                type="text"
                class="form-control"
                maxlength="64"
                placeholder={$_('components.modals.add-node.name-placeholder')}
                bind:value={coolifyName} />
            </div>

            <div class="col-12">
              <label class="form-label" for="addNodeCoolifyToken">
                {$_('components.modals.add-node.coolify-token-label')}
              </label>
              <input
                id="addNodeCoolifyToken"
                type="password"
                class="form-control"
                autocomplete="new-password"
                bind:value={coolifyToken} />
              <div class="form-text">{$_('components.modals.add-node.coolify-token-hint')}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="addNodeCoolifyServer">
                {$_('components.modals.add-node.coolify-server-label')}
              </label>
              <input
                id="addNodeCoolifyServer"
                type="text"
                class="form-control font-monospace"
                autocomplete="off"
                spellcheck="false"
                bind:value={coolifyServerUuid} />
            </div>

            <div class="col-md-6">
              <label class="form-label" for="addNodeCoolifyProject">
                {$_('components.modals.add-node.coolify-project-label')}
              </label>
              <input
                id="addNodeCoolifyProject"
                type="text"
                class="form-control font-monospace"
                autocomplete="off"
                spellcheck="false"
                bind:value={coolifyProjectUuid} />
              <div class="form-text">
                {$_('components.modals.add-node.coolify-project-hint')}
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label" for="addNodeCoolifyEnvironment">
                {$_('components.modals.add-node.coolify-environment-label')}
              </label>
              <input
                id="addNodeCoolifyEnvironment"
                type="text"
                class="form-control"
                autocomplete="off"
                spellcheck="false"
                bind:value={coolifyEnvironment} />
            </div>

            <div class="col-md-4">
              <label class="form-label" for="addNodeCoolifyVolume">
                {$_('components.modals.add-node.coolify-volume-label')}
              </label>
              <input
                id="addNodeCoolifyVolume"
                type="text"
                class="form-control"
                autocomplete="off"
                spellcheck="false"
                bind:value={coolifyDataVolume} />
            </div>

            <div class="col-md-4">
              <label class="form-label" for="addNodeCoolifyPorts">
                {$_('components.modals.add-node.coolify-ports-label')}
              </label>
              <input
                id="addNodeCoolifyPorts"
                type="text"
                class="form-control font-monospace"
                class:is-invalid={coolifyPortRange.trim() !== '' && !coolifyPortRangeValid}
                autocomplete="off"
                spellcheck="false"
                placeholder="25565-25600"
                bind:value={coolifyPortRange} />
              <div class="invalid-feedback">
                {$_('components.modals.add-node.coolify-ports-invalid')}
              </div>
            </div>

            {@render advancedPanoUrl('addNodeCoolifyPanoUrl', 'col-12', true)}

            {@render currentPasswordField('addNodeCoolifyCurrentPassword')}

            <div class="col-12">
              <button type="submit" class="btn btn-primary" disabled={submitting || !coolifyValid}>
                {#if submitting}
                  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {/if}
                {$_('components.modals.add-node.coolify-submit')}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
</div>

{#snippet currentPasswordField(id)}
  <div class="col-12">
    <label class="form-label" for={id}>
      {$_('components.modals.add-node.current-password-label')}
    </label>
    <input
      {id}
      type="password"
      class="form-control"
      autocomplete="current-password"
      bind:value={currentPassword} />
    <div class="form-text">{$_('components.modals.add-node.current-password-hint')}</div>
  </div>
{/snippet}

<!--
  The address the node should use to reach Pano. Folded away because the website URL is right
  almost every time; the setups where it is not (NAT, an SSH tunnel, a lab network) are the ones
  where nothing else works at all.
-->
{#snippet advancedPanoUrl(id, wrapperClass, withCoolifyImage)}
  <div class={wrapperClass}>
    <button
      type="button"
      class="btn btn-link btn-sm p-0 text-decoration-none"
      aria-controls="{id}Panel"
      aria-expanded={advancedOpen}
      onclick={() => (advancedOpen = !advancedOpen)}>
      <i class="fa-solid fa-chevron-{advancedOpen ? 'down' : 'right'} me-1" aria-hidden="true"></i>
      {$_('components.modals.add-node.pano-url.advanced')}
    </button>

    {#if advancedOpen}
      <div class="mt-2" id="{id}Panel">
        <label class="form-label" for={id}>
          {$_('components.modals.add-node.pano-url.label')}
        </label>
        <input
          {id}
          type="url"
          class="form-control"
          class:is-invalid={!panoUrlValid}
          autocomplete="off"
          spellcheck="false"
          maxlength={PANO_URL_MAX_LENGTH}
          placeholder={panoUrl}
          bind:value={panoUrlOverride}
          onchange={onPanoUrlOverrideCommitted} />
        <div class="invalid-feedback">
          {$_('components.modals.add-node.pano-url.invalid')}
        </div>
        <div class="form-text">{$_('components.modals.add-node.pano-url.hint')}</div>

        {#if withCoolifyImage}
          <!-- Where the image comes from is the same kind of answer as where Pano is: right by
               default, and only wrong on a host that cannot reach the published registry. -->
          <div class="row g-3 mt-0">
            <div class="col-md-8">
              <label class="form-label" for="addNodeCoolifyImage">
                {$_('components.modals.add-node.coolify-image-label')}
              </label>
              <input
                id="addNodeCoolifyImage"
                type="text"
                class="form-control font-monospace"
                class:is-invalid={!coolifyImageValid}
                autocomplete="off"
                spellcheck="false"
                maxlength={COOLIFY_IMAGE_MAX_LENGTH}
                placeholder="ghcr.io/panomc/pano-node"
                bind:value={coolifyImage} />
              <div class="invalid-feedback">
                {$_('components.modals.add-node.coolify-image-invalid')}
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label" for="addNodeCoolifyImageTag">
                {$_('components.modals.add-node.coolify-image-tag-label')}
              </label>
              <input
                id="addNodeCoolifyImageTag"
                type="text"
                class="form-control font-monospace"
                class:is-invalid={!coolifyImageTagValid}
                autocomplete="off"
                spellcheck="false"
                maxlength={COOLIFY_IMAGE_TAG_MAX_LENGTH}
                bind:value={coolifyImageTag} />
              <div class="invalid-feedback">
                {$_('components.modals.add-node.coolify-image-tag-invalid')}
              </div>
            </div>

            <div class="col-12">
              <div class="form-text mt-0">
                {$_('components.modals.add-node.coolify-image-hint')}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<script context="module">
  /** @type {(() => void) | null} */
  let openModal = null;

  /** Open the add-node modal. */
  export function show() {
    openModal?.();
  }

  /**
   * `25565-25600` — the shape Coolify wants for `ports_exposes` (§2.4.10).
   *
   * @param {string} value
   * @returns {boolean}
   */
  export function isPortRangeValid(value) {
    const match = /^(\d{1,5})-(\d{1,5})$/.exec(String(value || '').trim());

    if (!match) {
      return false;
    }

    const from = Number(match[1]);
    const to = Number(match[2]);

    return from >= 1 && to <= 65535 && from <= to;
  }

  /** As long as a registry reference may be, the same as the backend's `MAX_IMAGE_LENGTH`. */
  export const COOLIFY_IMAGE_MAX_LENGTH = 255;

  /** Docker's own tag limit, which the backend's `IMAGE_TAG` carries too. */
  export const COOLIFY_IMAGE_TAG_MAX_LENGTH = 128;

  /**
   * Mirrors `PanelCoolifyBootstrapNodeAPI.IMAGE_NAME`: what a registry reference may contain,
   * such as `registry.example.com:5000/team/pano-node`. Lower case, because that is all a
   * repository name is allowed to be. An empty value is not a reference — the caller decides
   * whether that is fine.
   *
   * @param {string} value
   * @returns {boolean}
   */
  export function isCoolifyImageValid(value) {
    const trimmed = String(value || '').trim();

    return (
      trimmed !== '' &&
      trimmed.length <= COOLIFY_IMAGE_MAX_LENGTH &&
      /^[a-z0-9.:/_-]+$/.test(trimmed)
    );
  }

  /**
   * Mirrors `PanelCoolifyBootstrapNodeAPI.IMAGE_TAG`, which is case-sensitive unlike the name.
   *
   * @param {string} value
   * @returns {boolean}
   */
  export function isCoolifyImageTagValid(value) {
    return /^[A-Za-z0-9._-]{1,128}$/.test(String(value || '').trim());
  }

  /** Comfortably past the longest legal host plus a scheme, port and path — as the backend has it. */
  export const PANO_URL_MAX_LENGTH = 255;

  /**
   * Mirrors the backend's `PanoUrlOverride`: an http(s) URL with a real host, nothing longer than
   * a hostname can be. An empty value is not a URL — the caller decides whether that is fine.
   *
   * @param {string} value
   * @returns {boolean}
   */
  export function isPanoUrlValid(value) {
    const trimmed = String(value || '').trim();

    if (trimmed === '' || trimmed.length > PANO_URL_MAX_LENGTH) {
      return false;
    }

    let url;

    try {
      url = new URL(trimmed);
    } catch {
      return false;
    }

    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { browser } from '$app/environment';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import {
    cacheNode,
    fetchLocalNodeStatus,
    fetchNodeStatus,
    fetchNodes,
    getNodeDisplayName,
    isNodeOnline,
    requestLocalNodeSetup,
    setAddNodeOpener,
  } from '$lib/nodes.util.js';
  import {
    isEndpointUnavailable,
    serverActionErrorKey,
    showServerActionError,
  } from '$lib/servers.util.js';
  import { onNode, onTaskProgress, subscribeNodes } from '$lib/panelRealtime.js';

  import NodeBootstrapLog from '$lib/components/servers/NodeBootstrapLog.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  const TABS = [
    {
      id: 'local',
      icon: 'fa-solid fa-house-laptop',
      label: 'pages.servers.nodes.tab-local',
    },
    {
      id: 'manual',
      icon: 'fa-solid fa-terminal',
      label: 'pages.servers.nodes.tab-manual',
    },
    {
      id: 'ssh',
      icon: 'fa-solid fa-key',
      label: 'pages.servers.nodes.tab-ssh',
      requiresManageNodes: true,
    },
    {
      id: 'coolify',
      icon: 'fa-solid fa-cloud',
      label: 'pages.servers.nodes.tab-coolify',
      requiresManageNodes: true,
    },
  ];

  const PLATFORMS = [
    { id: 'linux', icon: 'fa-brands fa-linux', label: 'pages.servers.nodes.platform-linux' },
    { id: 'windows', icon: 'fa-brands fa-windows', label: 'pages.servers.nodes.platform-windows' },
  ];

  const AUTH_TYPES = [
    {
      id: 'password',
      icon: 'fa-solid fa-lock',
      label: 'components.modals.add-node.auth-password',
    },
    { id: 'key', icon: 'fa-solid fa-key', label: 'components.modals.add-node.auth-key' },
  ];

  /** Where an SSH or Coolify bootstrap currently stands. */
  const Phases = Object.freeze({
    FORM: 'FORM',
    /** SSH only: Pano saw the host key for the first time and wants it confirmed. */
    FINGERPRINT: 'FINGERPRINT',
    PROGRESS: 'PROGRESS',
  });

  /** The pairing code rotates every 30 s (§2.4.3), so the countdown starts there. */
  const PAIRING_CODE_SECONDS = 30;

  /** The box is a live tail, not an archive — older lines are dropped. */
  const MAX_LOG_LINES = 500;

  /** How often the local tab asks the supervisor whether its daemon has paired yet. */
  const LOCAL_POLL_INTERVAL_MS = 2_000;

  /** A daemon that has not paired in this long is not going to: the log next to Pano says why. */
  const LOCAL_SETUP_TIMEOUT_MS = 90_000;

  const siteInfo = getContext('siteInfo');

  let modalElement = $state();
  let modalInstance;

  let tab = $state('local');
  let localSetupBusy = $state(false);

  let code = $state('');
  let command = $state('');
  let installCommand = $state('');
  let installCommandWindows = $state('');
  let platform = $state('linux');
  let secondsLeft = $state(PAIRING_CODE_SECONDS);
  let pairingLoading = $state(false);
  let pairingUnavailable = $state(false);
  let copied = $state(false);

  let phase = $state(Phases.FORM);
  let submitting = $state(false);

  let sshHost = $state('');
  let sshPort = $state(22);
  let sshUsername = $state('root');
  let sshAuthType = $state('password');
  let sshPassword = $state('');
  let sshPrivateKey = $state('');
  let sshPassphrase = $state('');
  let sshSudo = $state(true);
  let sshName = $state('');

  let coolifyUrl = $state('');
  let coolifyToken = $state('');
  let coolifyServerUuid = $state('');
  let coolifyProjectUuid = $state('');
  let coolifyEnvironment = $state('production');
  let coolifyName = $state('');
  let coolifyDataVolume = $state('pano-node-data');
  let coolifyPortRange = $state('25565-25600');
  /**
   * Where the node image comes from, when it is not the one Pano publishes (§2.4.10). Empty is
   * the normal answer: the backend then deploys `ghcr.io/panomc/pano-node` at its own version.
   */
  let coolifyImage = $state('');
  let coolifyImageTag = $state('');

  /**
   * The address the node should use to reach Pano instead of the website URL (§2.4.10). Shared by
   * the three tabs on purpose: it is one machine's view of one Pano, whichever way it is set up.
   */
  let panoUrlOverride = $state('');
  let advancedOpen = $state(false);

  /** Required by every destructive/provisioning endpoint (§2.7). */
  let currentPassword = $state('');

  /** @type {string[]} the relayed install-script output, oldest first. */
  let bootstrapLines = $state([]);
  let bootstrapStatus = $state('PENDING');
  let bootstrapPercent = $state(0);
  let bootstrapError = $state('');
  /**
   * What the provider said when it refused the deployment — Coolify's own sentence, not an
   * error code. It is rendered as text, never looked up as a translation key.
   */
  let bootstrapRefusal = $state('');
  /** The label above [bootstrapRefusal]: which system is being quoted. */
  let bootstrapRefusalLabel = $state('components.modals.add-node.coolify-refused');
  let bootstrapFingerprint = $state('');
  /** Polls the local daemon's status while the local tab waits for it to pair (SM-31). */
  let localPollTimer = null;
  let localPollStartedAt = 0;
  /** `{ taskId, taskUuid }` of the running bootstrap, whichever the backend answered with. */
  let bootstrapTaskIds = [];
  /** Set once a frame matched by id, so unmatched frames stop being accepted. */
  let matchedTaskById = false;
  /** Node ids that already existed when the bootstrap started — the new one is the other one. */
  let knownNodeIds = new Set();

  let countdownTimer;
  let copiedTimer;
  let releaseNodes = null;

  const canManageNodes = $derived(hasPermission(Permissions.MANAGE_NODES));
  const bootstrapRunning = $derived(
    phase === Phases.PROGRESS && bootstrapStatus !== 'FAILED' && bootstrapStatus !== 'DONE',
  );

  /** Where the panel itself reaches Pano — the default, and the placeholder for the override. */
  const panoUrl = $derived(
    String($siteInfo?.websiteUrl || '').trim() || (browser ? window.location.origin : ''),
  );

  const panoUrlTrimmed = $derived(panoUrlOverride.trim());

  /** Empty means "use the website URL", which is always valid. */
  const panoUrlValid = $derived(panoUrlTrimmed === '' || isPanoUrlValid(panoUrlTrimmed));

  /**
   * The install one-liner. `GET /api/panel/nodes/pairing-code` returns a ready-made
   * `installCommand` / `installCommandWindows` (§2.4.10); the hand-built fallback keeps the tab
   * useful against a backend that only returns the code.
   */
  const commandText = $derived(
    (platform === 'windows' ? installCommandWindows : installCommand) ||
      command ||
      `pano-node --pano ${(panoUrlValid && panoUrlTrimmed) || panoUrl || '<pano-url>'} --code ${code || '<code>'}`,
  );

  const sshValid = $derived(
    sshHost.trim().length > 0 &&
      sshUsername.trim().length > 0 &&
      Number(sshPort) >= 1 &&
      Number(sshPort) <= 65535 &&
      sshName.trim().length > 0 &&
      currentPassword.length > 0 &&
      panoUrlValid &&
      (sshAuthType === 'password' ? sshPassword.length > 0 : sshPrivateKey.trim().length > 0),
  );

  const coolifyPortRangeValid = $derived(isPortRangeValid(coolifyPortRange));
  // Both image fields are optional, so an empty one is valid — and is simply not sent.
  const coolifyImageValid = $derived(
    coolifyImage.trim() === '' || isCoolifyImageValid(coolifyImage),
  );
  const coolifyImageTagValid = $derived(
    coolifyImageTag.trim() === '' || isCoolifyImageTagValid(coolifyImageTag),
  );

  const coolifyValid = $derived(
    coolifyUrl.trim().length > 0 &&
      coolifyToken.length > 0 &&
      coolifyServerUuid.trim().length > 0 &&
      coolifyEnvironment.trim().length > 0 &&
      coolifyName.trim().length > 0 &&
      coolifyDataVolume.trim().length > 0 &&
      coolifyPortRangeValid &&
      coolifyImageValid &&
      coolifyImageTagValid &&
      panoUrlValid &&
      currentPassword.length > 0,
  );

  /**
   * @param {{ id: string, requiresManageNodes?: boolean }} entry
   * @returns {string} the i18n key explaining why the tab is closed, or '' when it is open.
   */
  function tabDisabledReason(entry) {
    if (bootstrapRunning && entry.id !== tab) {
      return 'components.modals.add-node.busy';
    }

    if (entry.requiresManageNodes && !canManageNodes) {
      return 'components.modals.add-node.no-permission';
    }

    return '';
  }

  /**
   * @param {string} next
   */
  function selectTab(next) {
    tab = next;
    phase = Phases.FORM;

    // The command shown on the manual tab depends on the override, which may have been typed on
    // another tab since it was last fetched.
    if (next === 'manual') {
      refreshPairingCode();
    }
  }

  /**
   * Sets up the local node on the progress screen, like the other tabs: the daemon is started
   * by the backend, and the modal then watches it pair instead of closing on a toast and
   * leaving the outcome to be found on the nodes page.
   */
  async function setupLocalNode() {
    if (localSetupBusy) {
      return;
    }

    localSetupBusy = true;

    await beginBootstrap();

    phase = Phases.PROGRESS;
    bootstrapStatus = 'RUNNING';
    bootstrapPercent = 10;
    pushBootstrapLine($_('components.modals.add-node.local-starting'));

    const result = await requestLocalNodeSetup();

    localSetupBusy = false;

    if (result.status === 'network') {
      backToForm();

      return;
    }

    if (result.status === 'unavailable') {
      failLocalSetup($_('pages.servers.nodes.local-setup-unavailable'));

      return;
    }

    if (result.status === 'error') {
      // The backend's own sentence when it has one; the translated code otherwise.
      failLocalSetup(result.message || $_(serverActionErrorKey(result.error)));

      return;
    }

    describeLocalStatus(result.local || {});

    if (result.local?.status === 'FAILED' || result.local?.givenUp) {
      failLocalSetup(result.local.error || $_('components.modals.add-node.local-failed-generic'));

      return;
    }

    bootstrapPercent = 60;
    pushBootstrapLine($_('components.modals.add-node.local-waiting'));

    localPollStartedAt = Date.now();
    localPollTimer = setInterval(() => void pollLocalNode(), LOCAL_POLL_INTERVAL_MS);
    void pollLocalNode();
  }

  /** @param {Record<string, any>} local the supervisor's status object */
  function describeLocalStatus(local) {
    if (local.javaMajor) {
      pushBootstrapLine(
        $_('components.modals.add-node.local-java', {
          values: { major: local.javaMajor, path: local.javaPath || '' },
        }),
      );
    }

    if (local.pid) {
      pushBootstrapLine(
        $_('components.modals.add-node.local-daemon-started', { values: { pid: local.pid } }),
      );
    }
  }

  async function pollLocalNode() {
    if (phase !== Phases.PROGRESS || bootstrapStatus === 'DONE' || bootstrapStatus === 'FAILED') {
      stopLocalPoll();

      return;
    }

    const status = await fetchLocalNodeStatus();

    // A transient miss is not a failure; the next tick asks again.
    if (status.status !== 'ok' || !status.local) {
      return;
    }

    const local = status.local;

    if (local.status === 'FAILED' || local.givenUp) {
      failLocalSetup(local.error || $_('components.modals.add-node.local-failed-generic'));

      return;
    }

    if (local.nodeId != null) {
      const node = await fetchNodeStatus(local.nodeId);

      if (node && isNodeOnline(node)) {
        finishLocalSetup(node);

        return;
      }
    }

    if (Date.now() - localPollStartedAt > LOCAL_SETUP_TIMEOUT_MS) {
      failLocalSetup(
        $_('components.modals.add-node.local-timeout', {
          values: { seconds: Math.round(LOCAL_SETUP_TIMEOUT_MS / 1000) },
        }),
      );
    }
  }

  /** @param {object} node */
  function finishLocalSetup(node) {
    stopLocalPoll();

    if (bootstrapStatus === 'DONE') {
      return;
    }

    knownNodeIds.add(Number(node.id));
    pushBootstrapLine($_('components.modals.add-node.local-connected'));
    bootstrapStatus = 'DONE';
    bootstrapPercent = 100;

    void showSuccess('components.modals.add-node.node-ready', {
      name: getNodeDisplayName(node),
    });

    hide();
  }

  /** @param {string} text the reason, rendered as text */
  function failLocalSetup(text) {
    stopLocalPoll();

    bootstrapRefusal = String(text || '').trim();
    bootstrapRefusalLabel = 'components.modals.add-node.local-failed';
    bootstrapError = '';
    bootstrapStatus = 'FAILED';
    phase = Phases.PROGRESS;
  }

  function stopLocalPoll() {
    if (localPollTimer) {
      clearInterval(localPollTimer);
      localPollTimer = null;
    }
  }

  /** @param {string} text */
  function pushBootstrapLine(text) {
    bootstrapLines = [...bootstrapLines, text].slice(-MAX_LOG_LINES);
  }

  async function loadPairingCode() {
    pairingLoading = true;

    // The commands are built by the backend, so the override has to travel with the request —
    // the code itself is the same code either way.
    const query =
      panoUrlTrimmed && panoUrlValid ? `?panoUrl=${encodeURIComponent(panoUrlTrimmed)}` : '';

    const body = await ApiUtil.get({
      path: `/api/panel/nodes/pairing-code${query}`,
      handler: (response) => response,
    });

    pairingLoading = false;

    // `undefined`/`null` is the network-error path; ApiUtil already raised the splash.
    if (body === undefined || body === null) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      pairingUnavailable = true;

      return;
    }

    if (body.error) {
      await showServerActionError(body.error);

      return;
    }

    pairingUnavailable = false;
    code = String(body.code ?? body.pairingCode ?? '');
    command = String(body.command ?? '');
    installCommand = String(body.installCommand ?? '');
    installCommandWindows = String(body.installCommandWindows ?? '');
    secondsLeft = remainingSeconds(body);
  }

  /**
   * The endpoint may hand back an absolute expiry, a duration, or the moment the code was
   * minted (as `platformAuth/refreshKey` does); all three end up as seconds.
   *
   * @param {Record<string, unknown>} body
   * @returns {number}
   */
  function remainingSeconds(body) {
    const expiresAt = Number(body.expiresAt);

    if (Number.isFinite(expiresAt) && expiresAt > 0) {
      return Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
    }

    const expiresIn = Number(body.expiresIn);

    if (Number.isFinite(expiresIn) && expiresIn > 0) {
      return Math.round(expiresIn);
    }

    const started = Number(body.timeStarted);

    if (Number.isFinite(started) && started > 0) {
      return Math.max(0, PAIRING_CODE_SECONDS - Math.round((Date.now() - started) / 1000));
    }

    return PAIRING_CODE_SECONDS;
  }

  function startCountdown() {
    stopCountdown();

    countdownTimer = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft -= 1;

        return;
      }

      void loadPairingCode();
    }, 1000);
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  /** A changed override means the install command on screen is stale, so it is fetched again. */
  function onPanoUrlOverrideCommitted() {
    if (tab === 'manual') {
      refreshPairingCode();
    }
  }

  function refreshPairingCode() {
    if (pairingUnavailable || !panoUrlValid) {
      return;
    }

    void loadPairingCode();
  }

  function copyCommand() {
    copy(commandText);
    copied = true;

    if (copiedTimer) {
      clearTimeout(copiedTimer);
    }

    copiedTimer = setTimeout(() => {
      copied = false;
    }, 1500);
  }

  /**
   * @param {SubmitEvent} event
   */
  function onSubmitSsh(event) {
    event.preventDefault();

    void startSshBootstrap();
  }

  /**
   * @param {SubmitEvent} event
   */
  function onSubmitCoolify(event) {
    event.preventDefault();

    void startCoolifyBootstrap();
  }

  /**
   * `POST /api/panel/nodes/ssh-bootstrap` (§2.4.10). Pano opens the session, reads the host key
   * and answers `{ taskId, fingerprint }` — nothing is installed until the fingerprint is
   * confirmed, which is the whole point of the extra round-trip.
   */
  async function startSshBootstrap() {
    if (submitting || !sshValid) {
      return;
    }

    submitting = true;

    await beginBootstrap();

    const body = await postBootstrap('/api/panel/nodes/ssh-bootstrap', {
      host: sshHost.trim(),
      port: Number(sshPort) || 22,
      username: sshUsername.trim(),
      auth:
        sshAuthType === 'password'
          ? { type: 'password', password: sshPassword }
          : {
              type: 'key',
              privateKey: sshPrivateKey,
              ...(sshPassphrase ? { passphrase: sshPassphrase } : {}),
            },
      sudo: !!sshSudo,
      name: sshName.trim(),
      ...(panoUrlTrimmed ? { panoUrl: panoUrlTrimmed } : {}),
      currentPassword,
    });

    // The credentials did their job; the form must not keep them around (§2.7).
    clearSecrets();

    if (!body) {
      return;
    }

    rememberTaskIds(body);

    const fingerprint = String(body.fingerprint ?? '');

    if (fingerprint) {
      bootstrapFingerprint = fingerprint;
      phase = Phases.FINGERPRINT;

      return;
    }

    // A backend that trusts a known host key skips the confirmation and starts right away.
    phase = Phases.PROGRESS;
  }

  /** `POST /api/panel/nodes/ssh-bootstrap/:taskId/confirm` — "yes, that is my server". */
  async function confirmFingerprint() {
    const taskId = bootstrapTaskIds[0];

    if (submitting || !taskId) {
      return;
    }

    submitting = true;

    const body = await ApiUtil.post({
      path: `/api/panel/nodes/ssh-bootstrap/${encodeURIComponent(taskId)}/confirm`,
      handler: (response) => response,
    });

    submitting = false;

    if (!body) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      await showError('components.modals.add-node.unavailable');

      return;
    }

    if (body.error) {
      await showServerActionError(body.error);

      return;
    }

    phase = Phases.PROGRESS;
  }

  /** `POST /api/panel/nodes/coolify-bootstrap` (§2.4.10) — no confirmation step. */
  async function startCoolifyBootstrap() {
    if (submitting || !coolifyValid) {
      return;
    }

    submitting = true;

    await beginBootstrap();

    const body = await postBootstrap('/api/panel/nodes/coolify-bootstrap', {
      coolifyUrl: coolifyUrl.trim().replace(/\/+$/, ''),
      apiToken: coolifyToken,
      serverUuid: coolifyServerUuid.trim(),
      ...(coolifyProjectUuid.trim() ? { projectUuid: coolifyProjectUuid.trim() } : {}),
      environmentName: coolifyEnvironment.trim(),
      name: coolifyName.trim(),
      dataVolume: coolifyDataVolume.trim(),
      portRange: coolifyPortRange.trim(),
      ...(coolifyImage.trim() ? { image: coolifyImage.trim() } : {}),
      ...(coolifyImageTag.trim() ? { imageTag: coolifyImageTag.trim() } : {}),
      ...(panoUrlTrimmed ? { panoUrl: panoUrlTrimmed } : {}),
      currentPassword,
    });

    clearSecrets();

    if (!body) {
      return;
    }

    rememberTaskIds(body);
    phase = Phases.PROGRESS;
  }

  /** Resets the progress state and makes sure the node feed is open before anything starts. */
  async function beginBootstrap() {
    bootstrapLines = [];
    bootstrapStatus = 'PENDING';
    bootstrapPercent = 0;
    bootstrapError = '';
    bootstrapRefusal = '';
    bootstrapFingerprint = '';
    bootstrapTaskIds = [];
    matchedTaskById = false;

    releaseNodes = releaseNodes || subscribeNodes();

    // Whatever arrives on the `node` feed that is not in here is the machine being provisioned.
    const result = await fetchNodes();

    knownNodeIds = new Set(result.nodes.map((node) => Number(node.id)));
  }

  /**
   * @param {string} path
   * @param {Record<string, unknown>} body
   * @returns {Promise<Record<string, any> | null>} null when the caller should stop.
   */
  async function postBootstrap(path, body) {
    const response = await ApiUtil.post({ path, body, handler: (result) => result });

    submitting = false;

    // `undefined` is the network-error path; ApiUtil already raised the offline splash.
    if (!response) {
      return null;
    }

    if (isEndpointUnavailable(response)) {
      await showError('components.modals.add-node.unavailable');

      return null;
    }

    // §2.4.10 — Coolify refused, and repeated why. That sentence is the whole value of the
    // answer (a rejected port range, a project that does not exist), so it belongs on the
    // progress screen next to the form that produced it, not in a splash that would only say
    // the error code back. The task id comes along so its frames keep arriving.
    if (response.error === 'COOLIFY_BOOTSTRAP_FAILED') {
      rememberTaskIds(response);

      bootstrapRefusal = String(response.message || '').trim();
      bootstrapRefusalLabel = 'components.modals.add-node.coolify-refused';
      // Without a message there is nothing to read, so the log's own failure line stays.
      bootstrapError = bootstrapRefusal ? '' : String(response.error);
      bootstrapStatus = 'FAILED';
      phase = Phases.PROGRESS;

      return null;
    }

    if (response.error) {
      await showServerActionError(response.error);

      return null;
    }

    return response;
  }

  /**
   * @param {Record<string, any>} body
   */
  function rememberTaskIds(body) {
    bootstrapTaskIds = [body.taskId, body.taskUuid, body.id]
      .filter((value) => value != null && value !== '')
      .map((value) => String(value));
  }

  function clearSecrets() {
    sshPassword = '';
    sshPrivateKey = '';
    sshPassphrase = '';
    coolifyToken = '';
    currentPassword = '';
  }

  function backToForm() {
    stopLocalPoll();
    phase = Phases.FORM;
    bootstrapLines = [];
    bootstrapStatus = 'PENDING';
    bootstrapPercent = 0;
    bootstrapError = '';
    bootstrapRefusal = '';
    bootstrapFingerprint = '';
    bootstrapTaskIds = [];
    matchedTaskById = false;
  }

  /**
   * Whether a `taskProgress` frame belongs to the bootstrap this modal started. Ids are matched
   * first; a frame that matches none is still taken while no frame ever has, because a backend
   * may identify the task by something the create response did not return — and an empty log is
   * worse than one extra line.
   *
   * @param {{ kind: string, taskId: string }} frame
   * @returns {boolean}
   */
  function isOurBootstrapFrame(frame) {
    if (frame.kind !== 'NODE_BOOTSTRAP') {
      return false;
    }

    if (bootstrapTaskIds.includes(String(frame.taskId))) {
      matchedTaskById = true;

      return true;
    }

    return !matchedTaskById;
  }

  /**
   * @param {(() => void) | undefined} [next]
   */
  function hide(next) {
    if (next && modalElement) {
      modalElement.addEventListener('hidden.bs.modal', next, { once: true });
    }

    modalInstance?.hide();
  }

  function resetAll() {
    tab = 'local';
    phase = Phases.FORM;
    platform = 'linux';
    submitting = false;
    backToForm();
    clearSecrets();
    sshHost = '';
    sshPort = 22;
    sshUsername = 'root';
    sshAuthType = 'password';
    sshSudo = true;
    sshName = '';
    coolifyUrl = '';
    coolifyServerUuid = '';
    coolifyProjectUuid = '';
    coolifyEnvironment = 'production';
    coolifyName = '';
    coolifyDataVolume = 'pano-node-data';
    coolifyPortRange = '25565-25600';
    coolifyImage = '';
    coolifyImageTag = '';
    panoUrlOverride = '';
    advancedOpen = false;
  }

  onMount(() => {
    modalInstance = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    openModal = () => {
      resetAll();
      modalInstance?.show();
    };

    const unregister = setAddNodeOpener(show);

    const onShown = () => {
      void loadPairingCode();
      startCountdown();
    };

    const onHidden = () => {
      stopCountdown();
      stopLocalPoll();
      releaseNodes?.();
      releaseNodes = null;
    };

    modalElement?.addEventListener('shown.bs.modal', onShown);
    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    const offTaskProgress = onTaskProgress((frame) => {
      if (phase !== Phases.PROGRESS || !isOurBootstrapFrame(frame)) {
        return;
      }

      if (frame.message) {
        bootstrapLines = [...bootstrapLines, frame.message].slice(-MAX_LOG_LINES);
      }

      bootstrapPercent = frame.percent;
      bootstrapStatus = frame.status || 'RUNNING';

      if (frame.status === 'FAILED') {
        bootstrapError = frame.error || 'UNKNOWN';
      }
    });

    const offNode = onNode(({ node }) => {
      const cached = cacheNode(node);

      if (phase !== Phases.PROGRESS || !cached || knownNodeIds.has(Number(cached.id))) {
        return;
      }

      // The daemon paired itself: the bootstrap is over, whatever the last frame said.
      knownNodeIds.add(Number(cached.id));
      bootstrapStatus = 'DONE';
      bootstrapPercent = 100;

      void showSuccess('components.modals.add-node.node-ready', {
        name: getNodeDisplayName(cached),
      });

      hide();
    });

    return () => {
      unregister();
      offTaskProgress();
      offNode();
      stopCountdown();
      stopLocalPoll();

      if (copiedTimer) {
        clearTimeout(copiedTimer);
      }

      modalElement?.removeEventListener('shown.bs.modal', onShown);
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
      releaseNodes?.();
      releaseNodes = null;
      openModal = null;
      modalInstance = null;
    };
  });
</script>
