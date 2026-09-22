<style>
  .plugin-search {
    max-width: 260px;
  }

  .plugin-description {
    max-width: 380px;
  }

  .plugin-file {
    max-width: 22ch;
  }
</style>

<!-- SM-16 + SM-32 — what a server has installed, and (for a managed one) the catalogue it can
     install from (§2.4.2, §2.4.5). The Installed tab merges the list the game reported with the
     jar files the node found, so a jar that is on disk but not loaded is visible too. -->
<div class="container vstack gap-3">
  {#if canBrowse}
    <PageActions>
      <div slot="left">
        <PageNav>
          <PageNavItem href="/servers/{serverId}/plugins" active={tab === 'installed'}>
            <i class="fa-solid fa-list-check me-2" aria-hidden="true"></i>
            {$_('pages.servers.plugins.tab-installed')}
          </PageNavItem>
          <PageNavItem href="/servers/{serverId}/plugins?tab=browse" active={tab === 'browse'}>
            <i class="fa-solid fa-magnifying-glass me-2" aria-hidden="true"></i>
            {$_('pages.servers.plugins.tab-browse')}
          </PageNavItem>
        </PageNav>
      </div>
    </PageActions>
  {/if}

  {#if tab === 'browse' && canBrowse}
    <ServerPluginBrowser {serverId} {canInstall} oninstalled={() => void loadPlugins()} />
  {:else if !listable}
    <!-- §2.4.35 — nothing can list the plugins (Vanilla has none; the node is offline; the
         plugin lacks the capability): the notice is the whole page, never a "could not be
         loaded" state with a Refresh that cannot help. -->
    <ServerCapabilityNotice
      server={$server}
      feature="plugins.list"
      section="components.server-navigation-menu.plugins" />
  {:else}
    {#if restartRequired}
      <div class="alert alert-warning d-flex align-items-start gap-2 mb-0" role="alert">
        <i class="fa-solid fa-rotate-right mt-1" aria-hidden="true"></i>
        <div>
          <div class="fw-semibold">{$_('pages.servers.plugins.restart-required-title')}</div>
          <div class="small">{$_('pages.servers.plugins.restart-required-description')}</div>
        </div>
      </div>
    {/if}

    <div class="card">
      <CardHeader>
        <span slot="left" class="d-flex align-items-center gap-2">
          {$_('pages.servers.plugins.title')}
          <span class="badge rounded-pill text-bg-secondary">
            {$_('pages.servers.plugins.count', { values: { count: rows.length } })}
          </span>
          {#if updateCount > 0}
            <span class="badge rounded-pill text-bg-warning">
              {$_('pages.servers.plugins.updates.count', { values: { count: updateCount } })}
            </span>
          {/if}
        </span>

        <span
          slot="right"
          class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-end gap-2 w-100">
          {#if canUpdate && updateCount > 0}
            <button
              type="button"
              class="btn btn-sm btn-warning text-nowrap"
              disabled={updatingAll || loading}
              onclick={() => void updateAll()}>
              {#if updatingAll}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {:else}
                <i class="fa-solid fa-circle-arrow-up me-1" aria-hidden="true"></i>
              {/if}
              {$_('pages.servers.plugins.updates.update-all', {
                values: { count: updateCount },
              })}
            </button>
          {/if}

          {#if canIdentify}
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary text-nowrap"
              disabled={identifying || loading}
              use:tooltip={[
                $_('pages.servers.plugins.updates.identify-hint'),
                { placement: 'bottom' },
              ]}
              onclick={() => void identifySources()}>
              {#if identifying}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {:else}
                <i class="fa-solid fa-fingerprint me-1" aria-hidden="true"></i>
              {/if}
              {$_('pages.servers.plugins.updates.identify')}
            </button>
          {/if}

          <span class="plugin-search w-100">
            <SearchInput
              placeholderKey="pages.servers.plugins.search-placeholder"
              ariaLabelKey="pages.servers.plugins.search-placeholder"
              showSpinner={false}
              onchange={(value) => (query = value)} />
          </span>
        </span>
      </CardHeader>

      {#if loading}
        <div class="card-body d-flex justify-content-center py-5">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else if listError}
        <div class="card-body text-center vstack gap-3 py-5">
          <div>
            <i class="fa-solid fa-puzzle-piece fa-3x text-body-secondary" aria-hidden="true"></i>
          </div>
          <div class="text-body-secondary">{$_(listError)}</div>
          <div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              onclick={() => void loadPlugins()}>
              {$_('buttons.refresh')}
            </button>
          </div>
        </div>
      {:else if !visibleRows.length}
        <div class="card-body">
          <NoContent
            icon="fa-solid fa-puzzle-piece fa-3x"
            text={query.trim()
              ? $_('pages.servers.plugins.no-matches')
              : online || managed
                ? $_('pages.servers.plugins.empty')
                : $_('pages.servers.plugins.empty-offline')} />
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-nowrap">{$_('pages.servers.plugins.column-name')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.plugins.column-version')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.plugins.column-authors')}</th>
                {#if managed}
                  <th scope="col" class="text-nowrap"
                    >{$_('pages.servers.plugins.installed.column-file')}</th>
                {:else}
                  <th scope="col" class="text-nowrap"
                    >{$_('pages.servers.plugins.column-description')}</th>
                {/if}
                <th scope="col" class="text-end text-nowrap"
                  >{$_('pages.servers.plugins.column-enabled')}</th>
                {#if canRemove}
                  <th scope="col" class="text-end text-nowrap">
                    {$_('pages.servers.plugins.installed.column-actions')}
                  </th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each visibleRows as row (row.key)}
                <tr>
                  <td class="fw-semibold text-break">
                    {row.name}
                    {#if !row.loaded}
                      <span
                        class="badge rounded-pill text-bg-warning ms-1 align-middle"
                        use:tooltip={[
                          $_('pages.servers.plugins.installed.not-loaded-hint'),
                          { placement: 'top' },
                        ]}>
                        {$_('pages.servers.plugins.installed.not-loaded')}
                      </span>
                    {/if}
                    {#if row.sourceName}
                      <!-- SM-48 — where the jar came from, as Pano recorded it on install or
                           worked out from the file's hash. -->
                      <span
                        class="badge rounded-pill text-bg-light border fw-normal ms-1 align-middle"
                        use:tooltip={[
                          $_(
                            row.identified
                              ? 'pages.servers.plugins.updates.source-identified-hint'
                              : 'pages.servers.plugins.updates.source-hint',
                            { values: { source: row.sourceName } },
                          ),
                          { placement: 'top' },
                        ]}>
                        {row.sourceName}
                      </span>
                    {/if}
                  </td>
                  <td class="small">
                    <span class="text-nowrap font-monospace">
                      {row.version || row.trackedVersion || '-'}
                    </span>
                    {#if row.updateAvailable}
                      <span class="d-block mt-1">
                        {#if row.pageUrl}
                          <a
                            class="badge rounded-pill text-bg-warning text-decoration-none"
                            href={row.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            use:tooltip={[
                              $_('pages.servers.plugins.updates.update-available-hint', {
                                values: { version: row.latestVersion },
                              }),
                              { placement: 'top' },
                            ]}>
                            {$_('pages.servers.plugins.updates.update-available', {
                              values: { version: row.latestVersion },
                            })}
                          </a>
                        {:else}
                          <span class="badge rounded-pill text-bg-warning">
                            {$_('pages.servers.plugins.updates.update-available', {
                              values: { version: row.latestVersion },
                            })}
                          </span>
                        {/if}
                      </span>
                    {/if}
                  </td>
                  <td class="small text-body-secondary text-break">
                    {row.authors.length
                      ? row.authors.join(', ')
                      : $_('pages.servers.plugins.authors-unknown')}
                  </td>
                  {#if managed}
                    <td class="small text-body-secondary">
                      {#if row.filename}
                        <span class="plugin-file d-inline-block text-truncate font-monospace">
                          {row.filename}
                        </span>
                        {#if row.size}
                          <span class="ms-1 opacity-75">({formatBytes(row.size, 1)})</span>
                        {/if}
                      {:else}
                        <span class="opacity-75">
                          {$_('pages.servers.plugins.installed.no-file')}
                        </span>
                      {/if}
                    </td>
                  {:else}
                    <td class="plugin-description small text-body-secondary text-break">
                      {row.description || $_('pages.servers.plugins.no-description')}
                    </td>
                  {/if}
                  <td class="text-end">
                    {#if !row.loaded}
                      <span class="badge rounded-pill text-bg-secondary">
                        {$_('pages.servers.plugins.installed.status-on-disk')}
                      </span>
                    {:else if canToggle}
                      <!-- A disabled switch drops pointer events, so the tooltip sits on the wrapper. -->
                      <span
                        class="d-inline-block"
                        use:tooltip={[
                          toggleDisabledReason
                            ? $_(toggleDisabledReason, {
                                values: {
                                  section: $_('components.server-navigation-menu.plugins'),
                                },
                              })
                            : '',
                          { placement: 'left' },
                        ]}>
                        <div class="form-check form-switch d-inline-block m-0">
                          {#if busyName === row.name}
                            <span class="spinner-border spinner-border-sm" aria-hidden="true"
                            ></span>
                          {:else}
                            <input
                              class="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="pluginSwitch-{row.key}"
                              aria-label={row.name}
                              checked={row.enabled}
                              disabled={!!toggleDisabledReason || !!busyName}
                              onchange={(event) => void onToggle(row, event)} />
                          {/if}
                        </div>
                      </span>
                    {:else}
                      <span
                        class="badge rounded-pill"
                        class:text-bg-success={row.enabled}
                        class:text-bg-secondary={!row.enabled}>
                        {row.enabled
                          ? $_('pages.servers.plugins.enabled-badge')
                          : $_('pages.servers.plugins.disabled-badge')}
                      </span>
                    {/if}
                  </td>
                  {#if canRemove}
                    <td class="text-end text-nowrap">
                      {#if row.updateAvailable && row.filename}
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-warning me-1"
                          disabled={isUpdating(row.filename) || busyFile === row.filename}
                          use:tooltip={[
                            $_('pages.servers.plugins.updates.update-available', {
                              values: { version: row.latestVersion },
                            }),
                            { placement: 'left' },
                          ]}
                          onclick={() => void updateFile(row.filename)}>
                          {#if isUpdating(row.filename)}
                            <span class="spinner-border spinner-border-sm" aria-hidden="true"
                            ></span>
                          {:else}
                            <i class="fa-solid fa-circle-arrow-up" aria-hidden="true"></i>
                          {/if}
                          <span class="ms-1">{$_('pages.servers.plugins.updates.update')}</span>
                        </button>
                      {/if}
                      {#if row.filename}
                        <button
                          type="button"
                          class="btn btn-link btn-sm link-danger"
                          disabled={busyFile === row.filename || isUpdating(row.filename)}
                          aria-label={$_('pages.servers.plugins.installed.remove')}
                          use:tooltip={[
                            $_('pages.servers.plugins.installed.remove'),
                            { placement: 'left' },
                          ]}
                          onclick={() => askRemove(row)}>
                          {#if busyFile === row.filename}
                            <span class="spinner-border spinner-border-sm" aria-hidden="true"
                            ></span>
                          {:else}
                            <i class="fa-solid fa-trash" aria-hidden="true"></i>
                          {/if}
                        </button>
                      {:else}
                        <span class="text-body-secondary">—</span>
                      {/if}
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if !loading && !listError}
        <div class="card-footer small text-body-secondary vstack gap-1">
          {#if jarList}
            <!-- §2.4.17 — nothing inside the game answered, so this is the jar scan: what is on
                 disk, not what the running server loaded. -->
            <span>
              <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
              {$_('pages.servers.plugins.jar-list-hint')}
            </span>
          {/if}
          {#if managed && !capable}
            <span>
              <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
              {$_('pages.servers.plugins.installed.game-list-unavailable')}
            </span>
          {/if}
          {#if !managed}
            <span>
              <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
              {$_('pages.servers.plugins.linked-hint')}
            </span>
          {/if}
          {#if canToggle}
            <span>
              <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
              {$_('pages.servers.plugins.restart-hint')}
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<script module>
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchServerPlugins } from '$lib/servers.util.js';

  /**
   * The page opens for every server that has a plugin list at all — the node's jar scan, the
   * plugin's loaded list, or neither, in which case it says so.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { server, user } = await parent();

    // Only the permission bounces. A linked server whose plugin lacks `plugins` still opens the
    // page: the list is empty, the controls are off, and the notice says what to update.
    if (!hasPermission(Permissions.MANAGE_SERVER_PLUGINS, user)) {
      throw redirect(302, `${base}/servers/${params.id}`);
    }

    // The list is part of the page, not something it asks for once it is on screen. A backend
    // that cannot answer (no endpoint, node offline) comes back as a status the page renders,
    // so opening the page still works.
    return {
      serverId: Number(params.id),
      serverPlugins: await fetchServerPlugins(params.id, event),
    };
  }
</script>

<script>
  /**
   * SM-16 / SM-32 — the plugins (or mods) of one server.
   *
   * Hydrated from `GET /plugins` and refreshed by `plugins` frames: the game sends the loaded
   * list, and for a managed server the same frame is also used as a bare nudge after an install
   * or a removal, in which case the page re-reads the endpoint (which is where `files[]` and
   * `restartRequired` come from).
   *
   * Whether the enable switch exists at all comes from the response's `toggleable` flag rather
   * than a hard-coded server-type list: only the Bukkit family can enable and disable a plugin
   * at runtime, and the backend is the one that decides.
   */
  import { getContext, onDestroy, onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { formatBytes } from '$lib/string.util.js';
  import {
    featureSource,
    FeatureSources,
    featureUnavailableReason,
    hasFeature,
    isEndpointUnavailable,
    isManaged,
    isPluginConnected,
    isServerOnline,
    normalizeServerPlugins,
    showServerActionError,
    showServerLoadError,
  } from '$lib/servers.util.js';
  import { onServerPlugins, onTaskProgress, subscribeServerPlugins } from '$lib/panelRealtime.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import ServerPluginBrowser from '$lib/components/servers/ServerPluginBrowser.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';

  let { data } = $props();

  const server = getContext('server');

  const canManage = hasPermission(Permissions.MANAGE_SERVER_PLUGINS);

  /** @type {Array<{ name: string, version: string, authors: string[], description: string, enabled: boolean }>} */
  let plugins = $state([]);
  /** @type {Array<{ filename: string, size: number, modified: number|null, matchedPlugin: string }>} */
  let files = $state([]);
  let restartRequired = $state(false);
  /** Only ever true for a *re*-read: the first list comes in with the page (`load`). */
  let loading = $state(false);
  let listError = $state('');
  let query = $state('');
  let busyName = $state(null);
  let busyFile = $state(null);
  let capable = $state(true);
  /** Whether this platform can enable/disable at all, as the backend reported it. */
  let toggleable = $state(false);
  /** The open tab lives in the URL (`?tab=browse`) so it can be linked to and survives a reload. */
  const tab = $derived($page.url.searchParams.get('tab') === 'browse' ? 'browse' : 'installed');

  /**
   * SM-48 — what Pano knows about where each jar came from (§2.4.13): one entry per file it
   * either installed itself or matched by hash. A backend from before the ticket sends none of
   * this, which simply leaves the source badges, the update buttons and the identify button out.
   *
   * @type {Array<{ filename: string, source: string, projectName: string, pageUrl: string, versionNumber: string, updateAvailable: boolean, latestVersion: string, identified: boolean }>}
   */
  let tracked = $state([]);
  /** Whether the node of this server can hash its files, which is what identification needs. */
  let identifySupported = $state(false);
  /** @type {string[]} the jars Pano cannot attribute to a source yet. */
  let unknownFiles = $state([]);
  /** @type {string[]} the files whose update task has not reported back yet. */
  let updatingFiles = $state([]);
  let updatingAll = $state(false);
  let identifying = $state(false);

  let hydratedId = null;
  let listSeq = 0;
  /** taskId → the file that task is updating, so only our own tasks toast and clear. */
  let updateTaskFiles = {};

  /**
   * Display name per tracked `source`, mirroring `ServerPluginInstall.source`. An id this build
   * does not know is shown as the backend spelled it rather than hidden.
   *
   * @type {Readonly<Record<string, string>>}
   */
  const SOURCE_NAMES = Object.freeze({
    MODRINTH: 'Modrinth',
    HANGAR: 'Hangar',
    CURSEFORGE: 'CurseForge',
  });

  const serverId = $derived($server?.id ?? null);
  // The loaded-plugin list and live toggles come from the plugin itself.
  const online = $derived(isPluginConnected($server));
  const managed = $derived(isManaged($server));

  /**
   * §2.4.17 — every control follows the source Pano resolved for it, not the server's kind:
   * the node scans and renames the jars, a protocol-2 plugin does the same from the inside, and
   * either one may be the one that is there. Without `features` these are the old rules.
   */
  const listSource = $derived(featureSource($server, 'plugins.list'));
  const listable = $derived(hasFeature($server, 'plugins.list'));
  /** The list is the jar scan rather than what the running server loaded. */
  const jarList = $derived(listSource === FeatureSources.NODE);
  const toggleSource = $derived(featureSource($server, 'plugins.toggle'));
  const canToggle = $derived(
    canManage && (toggleSource === undefined ? toggleable : toggleSource !== null),
  );
  const toggleDisabledReason = $derived(
    toggleSource === undefined
      ? online
        ? ''
        : 'pages.servers.plugins.toggle-disabled-offline'
      : toggleSource === null
        ? featureUnavailableReason($server, 'plugins.toggle')
        : '',
  );
  /** Putting a jar there, replacing it and deleting it are all the same source. */
  const installSupported = $derived(hasFeature($server, 'plugins.install'));
  const canInstall = $derived(installSupported && canManage);
  const canBrowse = $derived(installSupported);
  const canRemove = $derived(canInstall);
  const canUpdate = $derived(canInstall);
  /** The tracked rows by file, which is what lines them up with `files[]`. */
  const trackedByFile = $derived(new Map(tracked.map((entry) => [entry.filename, entry])));
  /**
   * Counted off the tracked rows rather than read from `updateCount`, so the header badge and
   * the per-row badges can never disagree about how many updates there are.
   */
  const updateCount = $derived(tracked.filter((entry) => entry.updateAvailable).length);
  const canIdentify = $derived(
    canManage &&
      hasFeature($server, 'plugins.identify') &&
      identifySupported &&
      unknownFiles.length > 0,
  );

  /**
   * One row per plugin the game loaded, plus one per jar the node found that no loaded plugin
   * claims — those are the "dropped in but not loaded yet" ones.
   */
  const rows = $derived.by(() => {
    /** @type {Map<string, object>} */
    const byPluginName = new Map();

    for (const file of files) {
      if (file.matchedPlugin) {
        byPluginName.set(file.matchedPlugin.toLowerCase(), file);
      }
    }

    /** @type {Set<string>} */
    const claimed = new Set();

    const loadedRows = plugins.map((plugin) => {
      const file = byPluginName.get(plugin.name.toLowerCase()) || null;

      if (file) {
        claimed.add(file.filename);
      }

      return {
        key: `plugin:${plugin.name}`,
        name: plugin.name,
        version: plugin.version,
        authors: plugin.authors,
        description: plugin.description,
        enabled: plugin.enabled,
        loaded: true,
        filename: file?.filename || '',
        size: file?.size ?? 0,
        ...trackedFields(file?.filename || ''),
      };
    });

    const unloadedRows = files
      .filter((file) => !claimed.has(file.filename))
      .map((file) => ({
        key: `file:${file.filename}`,
        name: file.matchedPlugin || file.filename,
        version: '',
        authors: [],
        description: '',
        enabled: false,
        loaded: false,
        filename: file.filename,
        size: file.size,
        ...trackedFields(file.filename),
      }));

    return [...loadedRows, ...unloadedRows];
  });

  const visibleRows = $derived.by(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.filename.toLowerCase().includes(needle) ||
        row.description.toLowerCase().includes(needle) ||
        row.authors.some((author) => author.toLowerCase().includes(needle)),
    );
  });

  // Called once here so the very first render — SSR included — already is the finished list,
  // and again from the effect below when the route moves to another server.
  untrack(() => hydrate(Number(data?.serverId ?? serverId)));

  $effect(() => {
    // Only these two say "this is another server now"; everything the hydrate itself touches is
    // deliberately left untracked.
    const id = Number(data?.serverId ?? serverId);

    untrack(() => hydrate(id));
  });

  // The plugin feed is per server, so the token follows the id in the URL.
  $effect(() => {
    const id = serverId;

    if (id == null) {
      return;
    }

    const release = subscribeServerPlugins(id);

    return () => release();
  });

  /** `null` until the effect below has seen the first answer, so opening the page never re-reads. */
  let wasListable = null;

  // The list read while nothing could serve it was only ever the notice's; once something can
  // again (the node reconnected, the plugin is back), it is read afresh instead of left stale.
  $effect(() => {
    const now = listable;

    untrack(() => {
      if (now && wasListable === false) {
        void loadPlugins();
      }

      wasListable = now;
    });
  });

  /**
   * The tracked columns of one row (§2.4.13): where the jar came from and whether a newer
   * version is out. A file nothing tracks gets the same shape with empty values, so the markup
   * never has to check for null.
   *
   * @param {string} filename
   */
  function trackedFields(filename) {
    const entry = filename ? trackedByFile.get(filename) : null;

    return {
      sourceName: entry ? SOURCE_NAMES[entry.source] || entry.source : '',
      identified: entry?.identified === true,
      trackedVersion: entry?.versionNumber || '',
      updateAvailable: entry?.updateAvailable === true,
      latestVersion: entry?.latestVersion || '',
      pageUrl: entry?.pageUrl || '',
    };
  }

  /**
   * @param {string} filename
   * @returns {boolean} whether an update task Pano started for this file is still running.
   */
  function isUpdating(filename) {
    return !!filename && updatingFiles.includes(filename);
  }

  /**
   * Puts one {@link fetchServerPlugins} answer on screen. A read that failed leaves the rows
   * alone — the error state replaces the table anyway, and a refresh that could not reach the
   * node should not look like "this server has no plugins".
   *
   * @param {Awaited<ReturnType<typeof fetchServerPlugins>>} result
   */
  function applyPlugins(result) {
    if (result.status === 'unavailable') {
      listError = 'pages.servers.errors.unavailable';

      return;
    }

    // `network` means the request never completed — ApiUtil already raised the offline splash.
    if (result.status !== 'ok') {
      listError = 'pages.servers.plugins.list-failed';

      return;
    }

    listError = '';
    capable = result.capable;
    toggleable = result.toggleable;
    plugins = result.plugins;
    files = result.files;
    restartRequired = result.restartRequired;
    tracked = result.tracked;
    identifySupported = result.identifySupported;
    unknownFiles = result.unknownFiles;

    // An update replaces the old jar with the new one, so a file that is gone can no longer be
    // waiting for a task frame — this is the safety net for a frame that never arrives.
    updatingFiles = updatingFiles.filter((filename) =>
      files.some((file) => file.filename === filename),
    );
  }

  /**
   * The list `load` fetched, applied once per server.
   *
   * @param {number} id the server the current `data` belongs to.
   */
  function hydrate(id) {
    if (!Number.isFinite(id) || hydratedId === id) {
      return;
    }

    hydratedId = id;
    // Whatever re-read is still in flight belongs to the server that was open a moment ago.
    listSeq += 1;
    loading = false;

    const result = data?.serverPlugins;

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadPlugins();
      }

      return;
    }

    applyPlugins(result);

    // The list itself says "this failed"; the toast is what names *why* — unless it is a
    // state (node offline, feature unavailable...), which the page explains (§2.4.35). While
    // nothing can list the plugins the notice is the whole page, so nothing is toasted at all:
    // an older backend answered Vanilla with a 404 here.
    if (browser && result.status === 'error' && listable) {
      showServerLoadError(result.error, id);
    }
  }

  /** Re-reads the list after an action or a `plugins` nudge; the spinner is for these only. */
  async function loadPlugins() {
    const id = serverId;

    if (id == null) {
      return;
    }

    const sequence = ++listSeq;

    loading = true;
    listError = '';

    const result = await fetchServerPlugins(id);

    if (sequence !== listSeq) {
      return;
    }

    loading = false;
    applyPlugins(result);

    if (result.status === 'error' && listable) {
      showServerLoadError(result.error, id);
    }
  }

  /**
   * @param {{ name: string, enabled: boolean, loaded: boolean }} row
   * @param {Event} event
   */
  async function onToggle(row, event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);
    const enabled = input.checked;

    if (serverId == null || busyName) {
      input.checked = row.enabled;

      return;
    }

    busyName = row.name;

    try {
      const body = await ApiUtil.put({
        path: `/api/panel/servers/${serverId}/plugins/${encodeURIComponent(row.name)}/enabled`,
        body: { enabled },
        handler: (/** @type {object} */ response) => response,
      });

      // `undefined` means the request never completed; ApiUtil already raised the offline
      // splash, so a second toast would only be noise.
      if (!body || body.error) {
        if (body?.error) {
          showServerActionError(body.error, body, {
            server: $server,
            feature: 'plugins.toggle',
          });
        }

        plugins = plugins.map((entry) =>
          entry.name === row.name ? { ...entry, enabled: row.enabled } : entry,
        );

        return;
      }

      // The authoritative list arrives as a `plugins` push right after; this only keeps the
      // switch from snapping back while that is in flight.
      plugins = plugins.map((entry) => (entry.name === row.name ? { ...entry, enabled } : entry));

      // §2.4.17 — the node toggles a plugin by renaming its jar, which the running server only
      // notices on its next start. The banner is the same one an install raises.
      if (toggleSource === FeatureSources.NODE) {
        restartRequired = true;
      }

      void showSuccess(
        enabled ? 'pages.servers.plugins.toggled-on' : 'pages.servers.plugins.toggled-off',
        { name: row.name },
      );
    } finally {
      busyName = null;
    }
  }

  /**
   * @param {{ filename: string }} row
   */
  function askRemove(row) {
    if (!canRemove || !row.filename || busyFile) {
      return;
    }

    void showConfirmActionModal(
      'pages.servers.plugins.installed.remove-confirm',
      { filename: row.filename },
      () => void removeFile(row.filename),
    );
  }

  /**
   * @param {string} filename
   */
  async function removeFile(filename) {
    if (!canRemove || serverId == null || busyFile) {
      return;
    }

    busyFile = filename;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/plugins/remove`,
        body: { filename },
        handler: (/** @type {object} */ response) => response,
      });

      if (!body) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'plugins.install' });

        return;
      }

      void showSuccess('pages.servers.plugins.installed.removed', { filename });
      await loadPlugins();
    } finally {
      busyFile = null;
    }
  }

  /**
   * SM-48 — the same install path the browser tab uses, only with the file Pano already knows
   * about: the backend resolves the newest compatible version itself and replaces the jar.
   *
   * @param {string} filename
   */
  async function updateFile(filename) {
    if (!canUpdate || serverId == null || !filename || isUpdating(filename)) {
      return;
    }

    updatingFiles = [...updatingFiles, filename];

    const body = await ApiUtil.post({
      path: `/api/panel/servers/${serverId}/plugins/update`,
      body: { filename },
      handler: (/** @type {object} */ response) => response,
    });

    if (!body || isEndpointUnavailable(body) || body.error) {
      updatingFiles = updatingFiles.filter((entry) => entry !== filename);

      if (!body) {
        // ApiUtil already raised the offline splash for a network error.
        return;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return;
      }

      // The one code this page answers itself: the row is stale, not broken.
      if (String(body.error).toUpperCase() === 'PLUGIN_UP_TO_DATE') {
        void showSuccess('pages.servers.plugins.updates.up-to-date', { filename });
        await loadPlugins();

        return;
      }

      showServerActionError(body.error, body, { server: $server, feature: 'plugins.install' });

      return;
    }

    rememberUpdateTask(body.taskId, body.filename == null ? filename : String(body.filename));
    void showSuccess('pages.servers.plugins.updates.update-started');
  }

  async function updateAll() {
    if (!canUpdate || serverId == null || updatingAll) {
      return;
    }

    updatingAll = true;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/plugins/update-all`,
        body: {},
        handler: (/** @type {object} */ response) => response,
      });

      if (!body) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'plugins.install' });

        return;
      }

      const started = Array.isArray(body.started) ? body.started : [];
      const skipped = Array.isArray(body.skipped) ? body.skipped : [];

      for (const entry of started) {
        rememberUpdateTask(entry?.taskId, String(entry?.filename ?? ''));
      }

      if (!started.length) {
        void showSuccess('pages.servers.plugins.updates.update-all-none');

        return;
      }

      void showSuccess('pages.servers.plugins.updates.update-all-started', {
        started: started.length,
        skipped: skipped.length,
      });
    } finally {
      updatingAll = false;
    }
  }

  /**
   * Marks the row busy until the PLUGIN_INSTALL frame of its task arrives.
   *
   * @param {unknown} taskId
   * @param {string} filename
   */
  function rememberUpdateTask(taskId, filename) {
    if (!filename) {
      return;
    }

    if (!isUpdating(filename)) {
      updatingFiles = [...updatingFiles, filename];
    }

    const id = taskId == null ? '' : String(taskId);

    if (id) {
      updateTaskFiles[id] = filename;
    }
  }

  /**
   * Asks Pano to match the jars it did not install against the sources that can look a file up
   * by hash (§2.4.13) — Modrinth always, CurseForge when the platform has an API key.
   */
  async function identifySources() {
    if (!canUpdate || serverId == null || identifying) {
      return;
    }

    identifying = true;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/plugins/identify`,
        body: {},
        handler: (/** @type {object} */ response) => response,
      });

      if (!body) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'plugins.identify' });

        return;
      }

      void showSuccess('pages.servers.plugins.updates.identify-done', {
        identified: Array.isArray(body.identified) ? body.identified.length : 0,
        unknown: Array.isArray(body.unknown) ? body.unknown.length : 0,
      });

      await loadPlugins();
    } finally {
      identifying = false;
    }
  }

  onMount(() => {
    const offPlugins = onServerPlugins((frame) => {
      if (serverId == null || Number(frame.serverId) !== Number(serverId)) {
        return;
      }

      // A frame without rows is the install/remove nudge (§2.4.5): the jar list and the
      // restart flag only exist on the REST side, so the page re-reads them.
      if (frame.plugins == null) {
        void loadPlugins();

        return;
      }

      plugins = normalizeServerPlugins(frame.plugins);
    });

    // An update is a PLUGIN_INSTALL task like any other (§2.4.13), so the row stays busy until
    // its frame lands. Only the tasks this page started are toasted — the browse tab reports
    // its own installs, and a task somebody else started just refreshes the list.
    const offTask = onTaskProgress((frame) => {
      if (
        serverId == null ||
        Number(frame.serverId) !== Number(serverId) ||
        frame.kind !== 'PLUGIN_INSTALL' ||
        (frame.status !== 'DONE' && frame.status !== 'FAILED')
      ) {
        return;
      }

      const taskId = String(frame.taskId || '');
      const filename = updateTaskFiles[taskId] || '';

      if (filename) {
        delete updateTaskFiles[taskId];
        updatingFiles = updatingFiles.filter((entry) => entry !== filename);

        if (frame.status === 'DONE') {
          void showSuccess('pages.servers.plugins.updates.update-done', { filename });
        } else {
          void showError('pages.servers.plugins.updates.update-failed', {
            filename,
            error: frame.error || '',
          });
        }
      }

      void loadPlugins();
    });

    return () => {
      offPlugins();
      offTask();
    };
  });

  onDestroy(() => {
    listSeq += 1;
  });
</script>
