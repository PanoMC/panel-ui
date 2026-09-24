<!-- Per-server alert switches: each server-scoped alert follows the platform setting unless this
     server says otherwise (`settings.alerts`). E-mail stays a platform decision. -->
<div class="card">
  <div class="card-header">{$_('pages.servers.settings.alerts.title')}</div>
  <div class="card-body">
    <p class="text-body-secondary small">{$_('pages.servers.settings.alerts.description')}</p>

    {#each SERVER_ALERT_KINDS as kind (kind)}
      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="serverAlert-{kind}">
          {$_('pages.settings.platform.alerts.kinds.' + kind.toLowerCase())}
          <small class="d-block text-body-secondary">
            {$_('pages.settings.platform.alerts.hints.' + kind.toLowerCase())}
          </small>
        </label>
        <div class="col-md-6 col-form-label">
          <select
            id="serverAlert-{kind}"
            class="form-select form-select-sm"
            value={choices[kind]}
            disabled={saving || !canEdit}
            onchange={(event) => (choices[kind] = event.currentTarget.value)}>
            <option value={Choice.DEFAULT}>{defaultLabel(kind)}</option>
            <option value={Choice.ON}>{$_('pages.servers.settings.alerts.option-on')}</option>
            <option value={Choice.OFF}>{$_('pages.servers.settings.alerts.option-off')}</option>
          </select>
        </div>
      </div>
    {/each}

    {#if canEdit}
      <button
        type="button"
        class="btn btn-secondary"
        disabled={saving || !changed}
        onclick={() => void save()}>
        {#if saving}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('buttons.save')}
      </button>
    {/if}
  </div>
</div>

<script module>
  /**
   * The alerts that are about one server (ServerAlertKind.serverScoped); the node alerts are about
   * a machine and stay platform-wide.
   */
  export const SERVER_ALERT_KINDS = Object.freeze([
    'SERVER_CRASHED',
    'BACKUP_FAILED',
    'TPS_LOW',
    'SCHEDULE_FAILED',
    'PLUGIN_UPDATES',
  ]);

  export const Choice = Object.freeze({ DEFAULT: 'default', ON: 'on', OFF: 'off' });

  /**
   * @param {Record<string, unknown> | null | undefined} overrides the server's `settings.alerts`.
   * @returns {Record<string, string>}
   */
  export function choicesOf(overrides) {
    /** @type {Record<string, string>} */
    const choices = {};

    for (const kind of SERVER_ALERT_KINDS) {
      const value = overrides?.[kind];

      choices[kind] = value === true ? Choice.ON : value === false ? Choice.OFF : Choice.DEFAULT;
    }

    return choices;
  }
</script>

<script>
  import { getContext, onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { isEndpointUnavailable } from '$lib/servers.util.js';

  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  const server = getContext('server');

  const canEdit = hasPermission(Permissions.MANAGE_SERVERS);
  const canReadPlatform = hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS);

  // Read once from the store, not reactively: a realtime frame must not reset an unsaved edit.
  const initial = untrack(() => choicesOf($server?.settings?.alerts));

  let choices = $state({ ...initial });
  let saved = $state({ ...initial });
  let saving = $state(false);

  /** The platform switch per kind, when this user may read it; unknown otherwise. */
  /** @type {Record<string, boolean> | null} */
  let platform = $state(null);

  const changed = $derived(SERVER_ALERT_KINDS.some((kind) => choices[kind] !== saved[kind]));

  /**
   * @param {string} kind
   * @returns {string}
   */
  function defaultLabel(kind) {
    if (platform == null) {
      return $_('pages.servers.settings.alerts.option-default');
    }

    return $_(
      platform[kind] === false
        ? 'pages.servers.settings.alerts.option-default-off'
        : 'pages.servers.settings.alerts.option-default-on',
    );
  }

  async function save() {
    const id = $server?.id;

    if (id == null || saving) {
      return;
    }

    saving = true;

    // Only what changed; `null` hands a kind back to the platform setting.
    /** @type {Record<string, boolean | null>} */
    const alerts = {};

    for (const kind of SERVER_ALERT_KINDS) {
      if (choices[kind] !== saved[kind]) {
        alerts[kind] =
          choices[kind] === Choice.ON ? true : choices[kind] === Choice.OFF ? false : null;
      }
    }

    const body = await ApiUtil.put({
      path: `/api/panel/servers/${id}/settings`,
      body: { settings: { alerts } },
      handler: (/** @type {any} */ response) => response,
    });

    saving = false;

    if (!body || body.result !== 'ok') {
      if (body && isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');
      } else {
        void showError('pages.servers.errors.generic', { error: body?.error || 'NETWORK_ERROR' });
      }

      return;
    }

    saved = { ...choices };

    server.update((current) => {
      const next = { ...(current?.settings?.alerts || {}) };

      for (const [kind, value] of Object.entries(alerts)) {
        if (value === null) {
          delete next[kind];
        } else {
          next[kind] = value;
        }
      }

      return { ...current, settings: { ...current?.settings, alerts: next } };
    });

    void showSuccess('pages.servers.settings.alerts.saved');
  }

  onMount(() => {
    if (!canReadPlatform) {
      return;
    }

    void ApiUtil.get({
      path: '/api/panel/settings/alerts',
      handler: (/** @type {any} */ response) => response,
    }).then((body) => {
      const raw = body?.alerts;

      if (!raw || typeof raw !== 'object') {
        return;
      }

      /** @type {Record<string, boolean>} */
      const next = {};

      for (const kind of SERVER_ALERT_KINDS) {
        next[kind] = raw[kind]?.enabled !== false;
      }

      platform = next;
    });
  });
</script>
