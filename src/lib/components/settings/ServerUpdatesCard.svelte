<!-- Updates for what runs the servers: the Pano Nodes and Pano Agents (the daemon, which Pano
     serves itself), and the Pano plugin inside each server. The platform and marketplace
     resources above have their own cards. -->
<div class="card">
  <CardHeader>
    <div slot="left">
      {#if availableCount}{availableCount}{/if}
      {$_('pages.settings.updates.servers.title')}
    </div>
    <div slot="right">
      <div class="dropdown">
        <button
          type="button"
          class="btn btn-sm btn-link"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          aria-label={$_('pages.servers.nodes.column-actions')}>
          <i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-end">
          <button
            type="button"
            class="dropdown-item text-capitalize"
            disabled={loading}
            onclick={() => void load()}>
            <i class="fa-solid fa-rotate-right me-2" class:fa-spin={loading} aria-hidden="true"></i>
            {$_('buttons.refresh')}
          </button>
          <button
            type="button"
            class="dropdown-item text-capitalize"
            disabled={busyAll || !pluginUpdatesAvailable}
            onclick={() => void updateAllPlugins()}>
            <i class="fas fa-download me-2" aria-hidden="true"></i>
            {$_('pages.settings.updates.servers.update-all-plugins')}
          </button>
        </div>
      </div>
    </div>
  </CardHeader>

  {#if loading && !loaded}
    <div class="card-body d-flex justify-content-center py-4">
      <span class="spinner-border" role="status" aria-hidden="true"></span>
    </div>
  {:else if unavailable}
    <NoContent
      icon="fa-solid fa-plug-circle-xmark fa-3x"
      text={$_('pages.settings.updates.servers.unavailable')} />
  {:else if !rows.length}
    <NoContent icon="fas fa-server fa-3x" text={$_('pages.settings.updates.servers.empty')} />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="align-middle" scope="col"></th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.settings.updates.servers.column-name')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.settings.updates.servers.column-kind')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.settings.updates.servers.column-version')}
            </th>
            <th class="align-middle text-nowrap" scope="col">
              {$_('pages.settings.updates.table.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.key)}
            <tr>
              <th scope="row" class="align-middle text-center">
                {#if busyKey === row.key}
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
                  ></span>
                {:else if row.updateAvailable || row.manual}
                  <div class="dropdown position-static">
                    <button
                      type="button"
                      class="btn btn-link"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      title={$_('pages.servers.nodes.column-actions')}
                      aria-label={$_('pages.servers.nodes.column-actions')}>
                      <span class="fas fa-ellipsis-v"></span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-start">
                      {#if row.updateAvailable}
                        <button
                          type="button"
                          class="dropdown-item text-capitalize"
                          disabled={busyAll || !row.online}
                          title={row.online ? '' : $_('pages.settings.updates.servers.offline')}
                          onclick={() => void updateRow(row)}>
                          <i class="fa-solid fa-download me-2" aria-hidden="true"></i>
                          {$_('buttons.update')}
                        </button>
                      {:else}
                        <!-- Too old to update itself, or not connected: the admin places the jar. -->
                        <button
                          type="button"
                          class="dropdown-item text-capitalize"
                          title={$_(`pages.settings.updates.servers.reason.${row.reason}`, {
                            default: row.reason,
                          })}
                          onclick={() =>
                            showPanoPluginUpdateModal(
                              { id: row.id, name: row.name, type: row.serverType },
                              { latestVersion: row.latest ?? null, reason: row.reason },
                            )}>
                          <i class="fa-solid fa-hand me-2" aria-hidden="true"></i>
                          {$_('pages.settings.updates.servers.update-by-hand')}
                        </button>
                      {/if}
                    </div>
                  </div>
                {/if}
              </th>
              <td class="align-middle" style="max-width: 300px;">
                <span class="d-flex align-items-center gap-2">
                  <span
                    class="rounded-circle d-inline-block"
                    style="width: 0.5rem; height: 0.5rem;"
                    class:bg-success={row.online}
                    class:bg-secondary={!row.online}
                    aria-hidden="true"></span>
                  {#if row.href}
                    <a
                      href={row.href}
                      title={row.name}
                      class="rounded focus-ring text-decoration-none d-block text-truncate"
                      >{row.name}</a>
                  {:else}
                    {row.name}
                  {/if}
                </span>
              </td>
              <td class="align-middle text-nowrap">
                <i class="{KIND_ICONS[row.kind]} me-1" aria-hidden="true"></i>
                {$_(`pages.settings.updates.servers.kind-${row.kind}`)}
              </td>
              <td class="align-middle text-nowrap font-monospace">
                {row.current || '—'}
                {#if row.updateAvailable && row.latest}
                  <i class="fa-solid fa-arrow-right mx-1" aria-hidden="true"></i>
                  <span class="text-warning">{row.latest}</span>
                {/if}
              </td>
              <td class="align-middle text-nowrap">
                {#if row.updateAvailable}
                  <span class="badge text-bg-warning">
                    {$_('buttons.update')}
                  </span>
                {:else if row.reason === 'NODE_OFFLINE'}
                  <span class="badge text-bg-danger">
                    {$_('pages.settings.updates.servers.reason.NODE_OFFLINE')}
                  </span>
                {:else if row.manual || row.reason}
                  {$_(`pages.settings.updates.servers.reason.${row.reason}`, {
                    default: row.reason,
                  })}
                {:else if !row.current}
                  {$_('pages.settings.updates.servers.unknown')}
                {:else}
                  <span class="text-success">
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
  {/if}
</div>

{#if !loading && !unavailable && rows.length}
  <div class="form-text">{$_('pages.settings.updates.servers.restart-note')}</div>
{/if}

<script>
  import { errorCode, errorDetails } from '$lib/apiError.util.js';
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
    node: 'fa-solid fa-circle-nodes',
    agent: 'fa-solid fa-microchip',
    'pano-plugin': 'fa-solid fa-puzzle-piece',
  };

  /** @type {{ initial?: any }} the page load's answer of `/panel/updates/servers`, when it has one */
  let { initial = null } = $props();

  /** @type {Array<Record<string, any>>} */
  let rows = $state([]);
  let loading = $state(false);
  let loaded = $state(false);
  let unavailable = $state(false);
  let busyKey = $state('');
  let busyAll = $state(false);
  /** Null until the backend says it has the setting; the switch only shows once it does. */

  const availableCount = $derived(rows.filter((row) => row.updateAvailable).length);
  const pluginUpdateCount = $derived(
    rows.filter((row) => row.kind === 'pano-plugin' && row.updateAvailable).length,
  );
  const pluginUpdatesAvailable = $derived(pluginUpdateCount > 0);

  async function load() {
    loading = true;

    const body = await ApiUtil.get({
      path: '/panel/updates/servers',
      handler: (response) => response,
    });

    loading = false;

    apply(body);
  }

  /** @param {any} body the answer of `/panel/updates/servers`, from the page load or a refresh */
  function apply(body) {
    loaded = true;

    if (!body || isEndpointUnavailable(body) || body.error) {
      unavailable = true;

      return;
    }

    unavailable = false;

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
        ? `/panel/servers/${row.id}/pano-plugin/update`
        : row.kind === 'agent' && row.serverId != null
          ? `/panel/servers/${row.serverId}/agent/update`
          : `/panel/nodes/${row.id}/update`;

    try {
      const body = await ApiUtil.post({ path, handler: (response) => response });

      if (!body) {
        return;
      }

      if (body.error) {
        if (errorDetails(body).manual === true && row.kind === 'pano-plugin') {
          showPanoPluginUpdateModal(
            { id: row.id, name: row.name, type: row.serverType },
            { latestVersion: row.latest ?? null, reason: errorDetails(body).reason },
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
        path: '/panel/servers/pano-plugin/update-all',
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

  // The page load already brought the list; only a card mounted without it asks by itself.
  if (initial) apply(initial);

  onMount(() => {
    if (!initial) void load();
  });
</script>
