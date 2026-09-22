<!-- Updates for what runs the servers: the Pano Nodes and Pano Agents (the daemon, which Pano
     serves itself), and the Pano plugin inside each server. The platform and marketplace
     resources above have their own cards. -->
<div class="card">
  <CardHeader>
    <div slot="left" class="d-flex align-items-center gap-2">
      <i class="fa-solid fa-server text-body-secondary" aria-hidden="true"></i>
      {$_('pages.settings.updates.servers.title')}
      {#if availableCount}
        <span class="badge rounded-pill text-bg-warning">{availableCount}</span>
      {/if}
    </div>
    <div slot="right" class="d-flex align-items-center gap-2">
      <button
        type="button"
        class="btn btn-sm btn-link"
        disabled={loading}
        aria-label={$_('buttons.refresh')}
        title={$_('buttons.refresh')}
        onclick={() => void load()}>
        <i class="fa-solid fa-rotate-right" class:fa-spin={loading} aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-sm btn-secondary"
        disabled={busyAll || !pluginUpdatesAvailable}
        onclick={() => void updateAllPlugins()}>
        {#if busyAll}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {:else}
          <i class="fas fa-download me-1" aria-hidden="true"></i>
        {/if}
        {$_('pages.settings.updates.servers.update-all-plugins')}
      </button>
    </div>
  </CardHeader>

  <div class="card-body vstack gap-3">
    {#if autoUpdate !== null}
      <!-- Node auto-update: the daemon updates itself without stopping the servers it runs, so
           this is on by default; the Pano plugin needs a restart and is never automatic. -->
      <div class="form-check form-switch m-0">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="nodeAutoUpdate"
          checked={autoUpdate}
          disabled={savingAutoUpdate}
          onchange={(event) => void saveAutoUpdate(event.currentTarget.checked)} />
        <label class="form-check-label" for="nodeAutoUpdate">
          {$_('pages.settings.updates.servers.auto-update')}
        </label>
        <div class="form-text">{$_('pages.settings.updates.servers.auto-update-hint')}</div>
      </div>
    {/if}

    {#if loading && !loaded}
      <div class="d-flex justify-content-center py-4">
        <span class="spinner-border" role="status" aria-hidden="true"></span>
      </div>
    {:else if unavailable}
      <div class="text-body-secondary small">
        {$_('pages.settings.updates.servers.unavailable')}
      </div>
    {:else if !rows.length}
      <NoContent
        icon="fas fa-server fa-3x"
        text={$_('pages.settings.updates.servers.empty')}
        dark={false} />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">{$_('pages.settings.updates.servers.column-name')}</th>
              <th scope="col">{$_('pages.settings.updates.servers.column-kind')}</th>
              <th scope="col" class="text-nowrap"
                >{$_('pages.settings.updates.servers.column-version')}</th>
              <th scope="col" class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row (row.key)}
              <tr>
                <th scope="row" class="fw-normal text-break">
                  <span class="d-inline-flex align-items-center gap-2">
                    <span
                      class="rounded-circle d-inline-block"
                      style="width: 0.5rem; height: 0.5rem;"
                      class:bg-success={row.online}
                      class:bg-secondary={!row.online}
                      aria-hidden="true"></span>
                    {#if row.href}
                      <a href={row.href}>{row.name}</a>
                    {:else}
                      {row.name}
                    {/if}
                  </span>
                </th>
                <td class="text-nowrap small">
                  <i class="{KIND_ICONS[row.kind]} me-1 text-body-secondary" aria-hidden="true"></i>
                  {$_(`pages.settings.updates.servers.kind-${row.kind}`)}
                </td>
                <td class="text-nowrap small font-monospace">
                  {row.current || '—'}
                  {#if row.updateAvailable && row.latest}
                    <i class="fa-solid fa-arrow-right mx-1 text-body-secondary" aria-hidden="true"
                    ></i>
                    <span class="text-warning">{row.latest}</span>
                  {/if}
                </td>
                <td class="text-end text-nowrap">
                  {#if row.updateAvailable}
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-warning"
                      disabled={busyKey === row.key || busyAll || !row.online}
                      title={row.online ? '' : $_('pages.settings.updates.servers.offline')}
                      onclick={() => void updateRow(row)}>
                      {#if busyKey === row.key}
                        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"
                        ></span>
                      {/if}
                      {$_('buttons.update')}
                    </button>
                  {:else if row.manual}
                    <!-- Too old to update itself, or not connected: the admin places the jar. -->
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      title={$_(`pages.settings.updates.servers.reason.${row.reason}`, {
                        default: row.reason,
                      })}
                      onclick={() =>
                        showPanoPluginUpdateModal(
                          { id: row.id, name: row.name, type: row.serverType },
                          { latestVersion: row.latest ?? null, reason: row.reason },
                        )}>
                      <i class="fa-solid fa-hand me-1" aria-hidden="true"></i>
                      {$_('pages.settings.updates.servers.update-by-hand')}
                    </button>
                  {:else if row.reason}
                    <span class="small text-body-secondary">
                      {$_(`pages.settings.updates.servers.reason.${row.reason}`, {
                        default: row.reason,
                      })}
                    </span>
                  {:else if !row.current}
                    <!-- Nothing reported a version yet (never started, or no plugin in it), so
                         there is nothing to call up to date. -->
                    <span class="small text-body-secondary">
                      {$_('pages.settings.updates.servers.unknown')}
                    </span>
                  {:else}
                    <span class="small text-success">
                      <i class="fa-solid fa-check me-1" aria-hidden="true"></i>
                      {$_('pages.settings.updates.servers.up-to-date')}
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="form-text m-0">{$_('pages.settings.updates.servers.restart-note')}</div>
    {/if}
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';
  import { isEndpointUnavailable, showServerActionError } from '$lib/servers.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';
  import { show as showPanoPluginUpdateModal } from '$lib/components/modals/PanoPluginUpdateModal.svelte';
  import {
    confirmAgentUpdate,
    confirmNodeUpdate,
    confirmPanoPluginUpdate,
    confirmPanoPluginUpdateAll,
  } from '$lib/components/modals/ConfirmUpdateModal.svelte';

  const KIND_ICONS = {
    node: 'fa-solid fa-server',
    agent: 'fa-solid fa-microchip',
    'pano-plugin': 'fa-solid fa-puzzle-piece',
  };

  /** @type {Array<Record<string, any>>} */
  let rows = $state([]);
  let loading = $state(false);
  let loaded = $state(false);
  let unavailable = $state(false);
  let busyKey = $state('');
  let busyAll = $state(false);
  /** Null until the backend says it has the setting; the switch only shows once it does. */
  let autoUpdate = $state(/** @type {boolean | null} */ (null));
  let savingAutoUpdate = $state(false);

  const availableCount = $derived(rows.filter((row) => row.updateAvailable).length);
  const pluginUpdateCount = $derived(
    rows.filter((row) => row.kind === 'pano-plugin' && row.updateAvailable).length,
  );
  const pluginUpdatesAvailable = $derived(pluginUpdateCount > 0);

  async function load() {
    loading = true;

    const body = await ApiUtil.get({
      path: '/api/panel/updates/servers',
      handler: (response) => response,
    });

    loading = false;
    loaded = true;

    if (!body || isEndpointUnavailable(body) || body.error) {
      unavailable = true;

      return;
    }

    unavailable = false;

    if (typeof body.nodeAutoUpdate === 'boolean') {
      autoUpdate = body.nodeAutoUpdate;
    }

    const nodes = (Array.isArray(body.nodes) ? body.nodes : []).map((node) => ({
      ...node,
      key: `${node.kind}-${node.id}`,
      href:
        node.kind === 'agent' && node.serverId != null
          ? `${base}/servers/${node.serverId}`
          : `${base}/servers/nodes/${node.id}`,
    }));
    const servers = (Array.isArray(body.servers) ? body.servers : []).map((server) => ({
      ...server,
      key: `pano-plugin-${server.id}`,
      href: `${base}/servers/${server.id}`,
    }));

    // What needs doing first, then everything else by name.
    rows = [...nodes, ...servers].sort(
      (a, b) =>
        Number(!!b.updateAvailable) - Number(!!a.updateAvailable) ||
        String(a.name).localeCompare(String(b.name)),
    );
  }

  /**
   * @param {Record<string, any>} row
   */
  async function updateRow(row) {
    if (busyKey) {
      return;
    }

    // SM-77 — every one-click update asks first; "Update by hand" opens its steps directly.
    const target = { name: String(row.name ?? ''), current: row.current, latest: row.latest };
    const confirmed = await (row.kind === 'pano-plugin'
      ? confirmPanoPluginUpdate(target)
      : row.kind === 'agent'
        ? confirmAgentUpdate(target)
        : confirmNodeUpdate(target));

    if (!confirmed || busyKey) {
      return;
    }

    busyKey = row.key;

    const path =
      row.kind === 'pano-plugin'
        ? `/api/panel/servers/${row.id}/pano-plugin/update`
        : row.kind === 'agent' && row.serverId != null
          ? `/api/panel/servers/${row.serverId}/agent/update`
          : `/api/panel/nodes/${row.id}/update`;

    try {
      const body = await ApiUtil.post({ path, handler: (response) => response });

      if (!body) {
        return;
      }

      if (body.error) {
        if (body.manual === true && row.kind === 'pano-plugin') {
          showPanoPluginUpdateModal(
            { id: row.id, name: row.name, type: row.serverType },
            { latestVersion: row.latest ?? null, reason: body.reason },
          );
        } else {
          showServerActionError(body.error, body);
        }

        return;
      }

      void showSuccess(
        row.kind === 'pano-plugin'
          ? 'pages.settings.updates.servers.plugin-update-started'
          : 'pages.settings.updates.servers.node-update-started',
        { name: row.name },
      );
      await load();
    } finally {
      busyKey = '';
    }
  }

  async function updateAllPlugins() {
    if (busyAll || !(await confirmPanoPluginUpdateAll(pluginUpdateCount))) {
      return;
    }

    busyAll = true;

    try {
      const body = await ApiUtil.post({
        path: '/api/panel/servers/pano-plugin/update-all',
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (body.error) {
        showServerActionError(body.error, body);

        return;
      }

      void showSuccess('pages.settings.updates.servers.update-all-started', {
        count: Array.isArray(body.started) ? body.started.length : 0,
      });
      await load();
    } finally {
      busyAll = false;
    }
  }

  /**
   * @param {boolean} enabled
   */
  async function saveAutoUpdate(enabled) {
    savingAutoUpdate = true;

    try {
      const body = await ApiUtil.put({
        path: '/api/panel/updates/node-auto-update',
        body: { enabled },
        handler: (response) => response,
      });

      if (!body || body.error) {
        if (body?.error) {
          showServerActionError(body.error, body);
        }

        return;
      }

      autoUpdate = enabled;
    } finally {
      savingAutoUpdate = false;
    }
  }

  onMount(() => {
    void load();
  });
</script>
