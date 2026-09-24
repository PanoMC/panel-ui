<!-- Server Settings Sub Page -->
{#if $server && form}
  <div class="card">
    <div class="card-header">{$_('pages.servers.settings.preferences')}</div>
    <div class="card-body">
      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="serverName">
          {$_('pages.servers.settings.server-name')}
        </label>
        <div class="col">
          <div class="mb-3">
            <input
              type="text"
              class="form-control"
              name="serverName"
              id="serverName"
              bind:value={form.customName}
              on:input={onNameChange}
              placeholder={$_('pages.servers.settings.server-name')} />
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="mainServer">
          {$_('pages.servers.settings.main-server')}
          <small class="d-block">{$_('pages.servers.settings.main-server-info')}</small>
        </label>
        <div class="col col-form-label">
          {#if $mainServer && Number($server.id) === Number($mainServer.id)}
            <button class="btn btn-secondary btn-sm disabled" disabled>
              <i class="fa-solid fa-check me-1"></i>
              {$_('pages.servers.settings.already-main-server', {
                values: { serverName: getServerDisplayName($server) },
              })}
            </button>
          {:else}
            <button
              on:click={() => showMakeMainServerModal($server)}
              class="btn btn-secondary btn-sm">
              <i class="fas fa-crown me-1"></i>
              {$_('pages.servers.settings.make-main-server')}</button>
          {/if}
        </div>
      </div>
      {#if managed}
        <!-- SM-69 (§2.4.34): the daily plugin update sweep. Managed servers only, the only ones
             whose plugins Pano tracks; the plugins page still shows updates when opened. -->
        <div class="row mb-3">
          <label class="col-md-6 col-form-label" for="autoUpdateCheck">
            {$_('pages.servers.settings.auto-update-check')}
            <small class="d-block">{$_('pages.servers.settings.auto-update-check-info')}</small>
          </label>
          <div class="col col-form-label">
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="autoUpdateCheck"
                bind:checked={form.autoUpdateCheck}
                autocomplete="off" />
            </div>
          </div>
        </div>
      {/if}
      <button
        class="btn btn-secondary"
        class:disabled={saving || saveDisabled}
        aria-disabled={saving || saveDisabled}
        on:click={save}>
        {$_('buttons.save')}
      </button>
    </div>
  </div>
{:else}
  <PageLoading show={true} />
{/if}

{#if $server}
  <!-- Keyed by server: switching servers must not carry one server's unsaved switches over. -->
  {#key $server.id}
    <ServerAlertSettingsCard />
  {/key}
{/if}

{#if $server && (canReinstall || canRemove)}
  <div class="card border-danger">
    <div class="card-header">{$_('pages.servers.settings.danger-zone')}</div>
    <div class="card-body">
      {#if canReinstall}
        <div class="row mb-3">
          <label class="col-md-6 col-form-label" for="changeServerSoftware">
            {$_('pages.servers.settings.change-software')}
            <small class="d-block">{$_('pages.servers.settings.change-software-info')}</small>
          </label>
          <div class="col col-form-label">
            <button
              id="changeServerSoftware"
              type="button"
              class="btn btn-outline-danger btn-sm"
              on:click={() => showChangeSoftwareModal({ server: $server })}>
              <i class="fa-solid fa-shuffle me-1" aria-hidden="true"></i>
              {$_('pages.servers.settings.change-software-button')}
            </button>
          </div>
        </div>
        <div class="row">
          <label class="col-md-6 col-form-label" for="reinstallServer">
            {$_('pages.servers.settings.reinstall')}
            <small class="d-block">{$_('pages.servers.settings.reinstall-info')}</small>
          </label>
          <div class="col col-form-label">
            <button
              id="reinstallServer"
              type="button"
              class="btn btn-outline-danger btn-sm"
              on:click={() => showChangeSoftwareModal({ server: $server, lockSoftware: true })}>
              <i class="fa-solid fa-rotate me-1" aria-hidden="true"></i>
              {$_('buttons.reinstall')}
            </button>
          </div>
        </div>
      {/if}
      {#if canRemove}
        <!-- A managed server is deleted with its files and backups; a linked one is only
             disconnected from Pano, its files stay on the Minecraft server. -->
        <div class="row" class:mt-3={canReinstall}>
          <label class="col-md-6 col-form-label" for="removeServer">
            {$_(
              managed && !inPlace
                ? 'pages.servers.settings.delete-server'
                : 'pages.servers.settings.remove-server',
            )}
            <small class="d-block">
              {$_(
                inPlace
                  ? 'pages.servers.settings.remove-in-place-info'
                  : managed
                    ? 'pages.servers.settings.delete-server-info'
                    : 'pages.servers.settings.remove-server-info',
              )}
            </small>
          </label>
          <div class="col col-form-label">
            <button
              id="removeServer"
              type="button"
              class="btn btn-outline-danger btn-sm"
              on:click={() => showRemoveServerModal($server)}>
              <i
                class="fa-solid {managed && !inPlace ? 'fa-trash' : 'fa-link-slash'} me-1"
                aria-hidden="true"></i>
              {$_(managed && !inPlace ? 'buttons.delete' : 'buttons.remove')}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Changing the software (or reinstalling it) lays the server down again, so the dialog takes
     the account password (§2.7) and says what is carried over (SM-66, §2.4.31). -->
<ChangeSoftwareModal />
<MakeMainServerModal />
<RemoveServerModal />

<script context="module">
  /**
   * The server is already loaded by `ServerDetailLayout`, so this page only takes an editable
   * copy of it.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const { server } = await parent();

    const serverForm = {
      id: server.id,
      name: server.name,
      customName: server.customName || server.name,
    };

    return { serverForm, serverFormOriginal: structuredClone(serverForm) };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { getServerDisplayName, isInPlace, isManaged } from '$lib/servers.util.js';

  import PageLoading from '$lib/components/PageLoading.svelte';
  import ServerAlertSettingsCard from '$lib/components/servers/ServerAlertSettingsCard.svelte';
  import MakeMainServerModal, {
    show as showMakeMainServerModal,
  } from '$lib/components/modals/MakeMainServerModal.svelte';
  import RemoveServerModal, {
    show as showRemoveServerModal,
  } from '$lib/components/modals/RemoveServerModal.svelte';
  import ChangeSoftwareModal, {
    show as showChangeSoftwareModal,
  } from '$lib/components/servers/ChangeSoftwareModal.svelte';

  export let data;

  const server = getContext('server');
  const mainServer = getContext('mainServer');

  let form;
  let formOriginal;

  // The switch is read from the live `server` store, not the layout's load data: that is fetched
  // once per server and goes stale after a save here, so coming back to this tab would show the
  // old value. `get()` rather than `$server` so a realtime frame does not reset an unsaved edit,
  // and a local rather than `form.autoUpdateCheck` so this block does not depend on `form` and
  // re-run (resetting the form) on every keystroke or toggle.
  $: if (data?.serverForm) {
    const autoUpdateCheck = autoUpdateCheckOf(get(server));

    form = { ...data.serverForm, autoUpdateCheck };
    formOriginal = { ...data.serverFormOriginal, autoUpdateCheck };
  }

  let saving;

  $: managed = isManaged($server);
  $: inPlace = isInPlace($server);
  // Reinstall only exists for a server Pano runs itself, and needs the create permission for
  // the same reason creating one does: it lays the software down from scratch. Not for one run
  // from its own folder: that folder is the admin's, and the node refuses to rebuild it.
  $: canReinstall = managed && !inPlace && hasPermission(Permissions.CREATE_SERVERS);
  // Deleting or disconnecting a server is what the delete endpoint guards with MANAGE_SERVERS.
  $: canRemove = hasPermission(Permissions.MANAGE_SERVERS);

  $: nameChanged = form?.customName !== formOriginal?.customName;
  $: autoUpdateCheckChanged = form?.autoUpdateCheck !== formOriginal?.autoUpdateCheck;

  // The name rules only apply when the name is what changed: flipping the switch on a server
  // that has no custom name must still be savable.
  $: saveDisabled =
    saving ||
    (!nameChanged && !autoUpdateCheckChanged) ||
    (nameChanged && (!form.customName || form.customName === form.name));

  /**
   * An older backend sends no `autoUpdateCheck`; that is the default, which is on.
   *
   * @param {{ settings?: { autoUpdateCheck?: boolean } } | null | undefined} current
   * @returns {boolean}
   */
  function autoUpdateCheckOf(current) {
    return current?.settings?.autoUpdateCheck !== false;
  }

  function onNameChange(event) {
    let value = event.target.value;

    if (value.length > 64) {
      value = value.substring(0, 64);
    }

    form.customName = value;
  }

  function save() {
    saving = true;

    // Only what changed: `settings` carries the switch alone, and the backend keeps every
    // setting a request leaves out, so the game-integration switches are not touched from here.
    /** @type {{ customName?: string, settings?: { autoUpdateCheck: boolean } }} */
    const payload = {};

    if (nameChanged) {
      payload.customName = form.customName;
    }

    if (autoUpdateCheckChanged) {
      payload.settings = { autoUpdateCheck: form.autoUpdateCheck };
    }

    const saved = structuredClone(form);

    ApiUtil.put({
      path: `/api/panel/servers/${form.id}/settings`,
      body: payload,
      handler: async (body, reject) => {
        saving = false;

        if (body.result !== 'ok') {
          reject();

          return;
        }

        formOriginal = saved;

        server.update((current) => ({
          ...current,
          ...(payload.customName !== undefined && { customName: payload.customName }),
          ...(payload.settings && { settings: { ...current.settings, ...payload.settings } }),
        }));
      },
    });
  }
</script>
