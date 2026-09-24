<style>
  .result-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .result-icon-placeholder {
    width: 48px;
    height: 48px;
    background-color: rgba(var(--bs-secondary-rgb), 0.15);
  }

  .result-summary {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .version-list {
    max-height: 60vh;
    overflow-y: auto;
  }

  .version-file-select {
    max-width: 18rem;
  }
</style>

<!-- SM-32 — the install catalogue of a managed server (§2.4.5). Every source is resolved on the
     Pano side, so the panel only ever talks to `/plugins/sources`, `/plugins/search` and
     `/plugins/install`; the download itself happens on the node and is reported as a
     PLUGIN_INSTALL task. -->
<div class="card">
  <div class="card-body vstack gap-3">
    <div class="small text-body-secondary">{$_('pages.servers.plugins.browse.description')}</div>

    {#if sourcesLoading}
      <div class="d-flex justify-content-center py-4">
        <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
      </div>
    {:else if sourcesError}
      <div class="text-center vstack gap-3 py-4">
        <div class="text-body-secondary">{$_(sourcesError)}</div>
        <div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            onclick={() => void loadSources()}>
            {$_('buttons.refresh')}
          </button>
        </div>
      </div>
    {:else}
      <div class="d-flex flex-wrap align-items-center gap-2">
        <CardFilters>
          {#each sources as source (source.id)}
            {#if source.enabled}
              <CardFiltersItem
                button
                active={source.id === activeSource}
                onclick={() => selectSource(source.id)}>
                {source.name}
              </CardFiltersItem>
            {:else}
              <!-- A disabled button swallows its own mouse events, so the reason it is off is
                   carried by a wrapper the tooltip can attach to. -->
              <span
                class="d-inline-block"
                use:tooltip={[
                  source.reason || $_('pages.servers.plugins.browse.source-off'),
                  { placement: 'top' },
                ]}>
                <CardFiltersItem button disabled>
                  {source.name}
                  <i class="fa-solid fa-lock ms-1 small" aria-hidden="true"></i>
                </CardFiltersItem>
              </span>
            {/if}
          {/each}
        </CardFilters>

        <div class="ms-auto" style="min-width: 240px;">
          <SearchInput
            placeholderKey="pages.servers.plugins.browse.search-placeholder"
            ariaLabelKey="pages.servers.plugins.browse.search-placeholder"
            debounceMs={400}
            {searching}
            onchange={(value) => onQueryChange(value)} />
        </div>
      </div>

      {#if !sources.some((source) => source.enabled)}
        <div class="alert alert-secondary mb-0 small" role="alert">
          {$_('pages.servers.plugins.browse.no-sources')}
        </div>
      {/if}

      {#if activeTask}
        <div>
          <div class="d-flex justify-content-between small text-body-secondary">
            <span>
              {$_('pages.servers.plugins.browse.task-install', {
                values: { filename: activeTask.filename },
              })}
              {#if activeTask.message}
                <span class="text-break">&middot; {activeTask.message}</span>
              {/if}
            </span>
            <span class="font-monospace">{taskPercent}%</span>
          </div>
          <div
            class="progress mt-1"
            style="height: 6px;"
            role="progressbar"
            aria-label={$_('pages.servers.plugins.browse.install')}
            aria-valuenow={taskPercent}
            aria-valuemin="0"
            aria-valuemax="100">
            <div
              class="progress-bar progress-bar-striped"
              class:progress-bar-animated={activeTask.status !== 'FAILED'}
              class:bg-danger={activeTask.status === 'FAILED'}
              style="width: {taskPercent}%;">
            </div>
          </div>
        </div>
      {/if}

      {#if searchError}
        <NoContent icon="fa-solid fa-triangle-exclamation fa-3x" text={$_(searchError)} />
      {:else if searching && !results.length}
        <div class="d-flex justify-content-center py-4">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else if !results.length}
        <NoContent
          icon="fa-solid fa-puzzle-piece fa-3x"
          text={query.trim()
            ? $_('pages.servers.plugins.browse.no-results')
            : $_('pages.servers.plugins.browse.search-hint')} />
      {:else}
        {#if !query.trim()}
          <div class="small fw-semibold text-body-secondary">
            <i class="fa-solid fa-fire me-1" aria-hidden="true"></i>
            {$_('pages.servers.plugins.browse.popular-title', {
              values: { source: activeSourceName },
            })}
          </div>
        {/if}
        <div class="row row-cols-1 row-cols-lg-2 g-3">
          {#each results as result (result.key)}
            <div class="col">
              <div class="card h-100">
                <div class="card-body d-flex gap-3">
                  {#if result.iconUrl}
                    <img
                      class="result-icon rounded flex-shrink-0"
                      src={sanitizeImageSrc(result.iconUrl)}
                      alt=""
                      loading="lazy" />
                  {:else}
                    <div
                      class="result-icon-placeholder d-flex align-items-center justify-content-center rounded flex-shrink-0">
                      <i class="fa-solid fa-puzzle-piece text-body-secondary" aria-hidden="true"
                      ></i>
                    </div>
                  {/if}

                  <div class="vstack gap-1 overflow-hidden">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="fw-semibold text-break">{result.name}</span>
                      {#if result.compatible}
                        <span class="badge rounded-pill text-bg-success">
                          {$_('pages.servers.plugins.browse.compatible')}
                        </span>
                      {:else}
                        <span class="badge rounded-pill text-bg-warning">
                          {$_('pages.servers.plugins.browse.incompatible')}
                        </span>
                      {/if}
                    </div>

                    {#if result.author}
                      <div class="small text-body-secondary text-break">
                        {$_('pages.servers.plugins.browse.by-author', {
                          values: { author: result.author },
                        })}
                      </div>
                    {/if}

                    <div class="result-summary small text-body-secondary text-break">
                      {result.summary}
                    </div>

                    <div
                      class="d-flex flex-wrap align-items-center gap-2 small text-body-secondary">
                      <span>
                        <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
                        {$_('pages.servers.plugins.browse.downloads', {
                          values: { count: formatCount(result.downloads) },
                        })}
                      </span>
                      {#each result.categories.slice(0, 3) as category (category)}
                        <span class="badge rounded-pill text-bg-light">{category}</span>
                      {/each}
                    </div>

                    <div class="d-flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        onclick={() => void openVersions(result)}>
                        <i class="fa-solid fa-code-branch me-1" aria-hidden="true"></i>
                        {$_('pages.servers.plugins.browse.versions')}
                      </button>
                      {#if result.pageUrl}
                        <a
                          class="btn btn-sm btn-outline-secondary"
                          href={sanitizeLinkHref(result.pageUrl)}
                          target="_blank"
                          rel="noopener noreferrer">
                          <i class="fa-solid fa-arrow-up-right-from-square me-1" aria-hidden="true"
                          ></i>
                          {$_('pages.servers.plugins.browse.open-page')}
                        </a>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        {#if hasMore}
          <div class="text-center">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              disabled={loadingMore}
              onclick={() => void search(page + 1)}>
              {#if loadingMore}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_('pages.servers.plugins.browse.load-more')}
            </button>
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</div>

<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={versionsModalElement}>
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title text-break">
          {$_('pages.servers.plugins.browse.versions-title', {
            values: { name: versionsProject?.name || '' },
          })}
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <div class="modal-body version-list">
        {#if versionsLoading}
          <div class="d-flex justify-content-center py-4">
            <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
          </div>
        {:else if versionsError}
          <NoContent icon="fa-solid fa-triangle-exclamation fa-3x" text={$_(versionsError)} />
        {:else if !sortedVersions.length}
          <NoContent
            icon="fa-solid fa-puzzle-piece fa-3x"
            text={$_('pages.servers.plugins.browse.no-versions')} />
        {:else}
          <div class="vstack gap-2">
            {#each sortedVersions as version (version.id)}
              <div class="border rounded p-3 vstack gap-2">
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <span class="fw-semibold text-break"
                    >{version.name || version.versionNumber}</span>
                  {#if version.versionNumber && version.versionNumber !== version.name}
                    <span class="font-monospace small text-body-secondary">
                      {version.versionNumber}
                    </span>
                  {/if}
                  {#if version.compatible}
                    <span class="badge rounded-pill text-bg-success">
                      {$_('pages.servers.plugins.browse.compatible')}
                    </span>
                  {:else}
                    <span class="badge rounded-pill text-bg-warning">
                      {$_('pages.servers.plugins.browse.incompatible')}
                    </span>
                  {/if}
                  {#if version.channel}
                    <span class="badge rounded-pill text-bg-secondary">{version.channel}</span>
                  {/if}
                  {#if version.publishedAt}
                    <span class="small text-body-secondary ms-auto">
                      <DateComponent time={version.publishedAt} relativeFormat />
                    </span>
                  {/if}
                </div>

                <div class="small text-body-secondary text-break">
                  {#if version.gameVersions.length}
                    <span class="me-3">
                      {$_('pages.servers.plugins.browse.game-versions', {
                        values: { versions: version.gameVersions.slice(0, 6).join(', ') },
                      })}
                    </span>
                  {/if}
                  {#if version.loaders.length}
                    <span>
                      {$_('pages.servers.plugins.browse.loaders', {
                        values: { loaders: version.loaders.join(', ') },
                      })}
                    </span>
                  {/if}
                </div>

                <div class="d-flex flex-wrap align-items-center gap-2">
                  {#if version.files.length > 1}
                    <select
                      class="form-select form-select-sm version-file-select"
                      aria-label={$_('pages.servers.plugins.browse.file-label')}
                      value={fileChoice[version.id] ?? version.primaryIndex}
                      onchange={(event) => onFileChange(version, event)}>
                      {#each version.files as file, index (file.filename + index)}
                        <option value={index}>
                          {file.filename}{file.size ? ` (${formatBytes(file.size, 1)})` : ''}
                        </option>
                      {/each}
                    </select>
                  {:else if version.files.length === 1}
                    <span class="small text-body-secondary font-monospace text-break">
                      {version.files[0].filename}
                      {#if version.files[0].size}
                        ({formatBytes(version.files[0].size, 1)})
                      {/if}
                    </span>
                  {/if}

                  <button
                    type="button"
                    class="btn btn-sm btn-primary ms-auto"
                    disabled={!canInstall || !version.files.length || !!installingVersionId}
                    use:tooltip={[
                      canInstall ? '' : $_('pages.servers.plugins.browse.install-no-permission'),
                      { placement: 'top' },
                    ]}
                    onclick={() => void install(version)}>
                    {#if installingVersionId === version.id}
                      <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                    {:else}
                      <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
                    {/if}
                    {$_('pages.servers.plugins.browse.install')}
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
  /**
   * SM-32 — search a managed server's plugin/mod sources and install one version of a project.
   *
   * `GET /plugins/sources` says which catalogues this Pano can reach (CurseForge only answers
   * when the admin entered an API key, so a disabled pill carries the reason), `GET
   * /plugins/search` is paged, and `POST /plugins/install` only starts the work: the node
   * downloads the file and reports it through `taskProgress` frames of kind PLUGIN_INSTALL.
   */
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { formatBytes } from '$lib/string.util.js';
  import { sanitizeImageSrc } from '$lib/security.util.js';
  import {
    isEndpointUnavailable,
    showServerActionError,
    showServerLoadError,
  } from '$lib/servers.util.js';
  import { onTaskProgress } from '$lib/panelRealtime.js';

  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /**
   * @type {{ serverId: number|null, canInstall?: boolean, oninstalled?: () => void }}
   */
  let { serverId, canInstall = false, oninstalled } = $props();

  /** How many results one page asks for; the contract's default. */
  const PAGE_SIZE = 20;

  /** @type {Array<{ id: string, name: string, enabled: boolean, reason: string }>} */
  let sources = $state([]);
  let sourcesLoading = $state(true);
  let sourcesError = $state('');
  let activeSource = $state('');
  /** The shown name of [activeSource], for the "Popular on …" heading. */
  const activeSourceName = $derived(
    sources.find((source) => source.id === activeSource)?.name || activeSource,
  );
  let query = $state('');
  /** @type {Array<object>} */
  let results = $state([]);
  let page = $state(0);
  let hasMore = $state(false);
  let searching = $state(false);
  let loadingMore = $state(false);
  let searchError = $state('');
  /** @type {object|null} */
  let versionsProject = $state(null);
  /** @type {Array<object>} */
  let versions = $state([]);
  let versionsLoading = $state(false);
  let versionsError = $state('');
  let installingVersionId = $state(null);
  /** The latest PLUGIN_INSTALL frame for this server, plus the filename Pano answered with. */
  let activeTask = $state(null);
  /** @type {Record<string, number>} */
  let fileChoice = $state({});

  let versionsModalElement = $state();
  let versionsModal;
  let searchSeq = 0;
  let versionsSeq = 0;

  const taskPercent = $derived(
    Math.max(0, Math.min(100, Math.round(Number(activeTask?.percent) || 0))),
  );
  /** Compatible builds first — the list is long and the incompatible ones are a last resort. */
  const sortedVersions = $derived(
    [...versions].sort((a, b) => Number(b.compatible) - Number(a.compatible)),
  );

  /**
   * @param {unknown} value
   * @returns {string} a short download count (`1.2M`), which is all the card has room for.
   */
  function formatCount(value) {
    const count = Number(value) || 0;

    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    }

    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }

    return String(count);
  }

  /**
   * Project pages are links the source API handed us, so only http(s) ones are rendered.
   *
   * @param {unknown} url
   * @returns {string}
   */
  function sanitizeLinkHref(url) {
    const value = String(url || '');

    return value.startsWith('https://') || value.startsWith('http://') ? value : '';
  }

  async function loadSources() {
    if (serverId == null) {
      return;
    }

    sourcesLoading = true;
    sourcesError = '';

    const body = await ApiUtil.get({
      path: `/api/panel/servers/${serverId}/plugins/sources`,
      handler: (/** @type {object} */ response) => response,
    });

    sourcesLoading = false;

    if (!body) {
      sourcesError = 'pages.servers.plugins.browse.sources-failed';

      return;
    }

    if (isEndpointUnavailable(body)) {
      sourcesError = 'pages.servers.errors.unavailable';

      return;
    }

    if (body.error) {
      sourcesError = 'pages.servers.plugins.browse.sources-failed';
      // A state is what the Plugins page's own notices explain; only a failure is toasted.
      showServerLoadError(body.error, serverId, body);

      return;
    }

    const list = Array.isArray(body) ? body : Array.isArray(body.sources) ? body.sources : [];

    sources = list
      .map((/** @type {object} */ source) => ({
        id: String(source?.id ?? ''),
        name: String(source?.name ?? source?.id ?? ''),
        enabled: source?.enabled !== false,
        reason: source?.reason == null ? '' : String(source.reason),
      }))
      .filter((source) => !!source.id);

    const firstEnabled = sources.find((source) => source.enabled);

    activeSource = firstEnabled ? firstEnabled.id : '';

    // The tab opens on the source's most popular plugins instead of an empty page.
    if (activeSource) {
      void search(0);
    }
  }

  /**
   * @param {string} id
   */
  function selectSource(id) {
    if (id === activeSource) {
      return;
    }

    activeSource = id;
    results = [];
    page = 0;
    hasMore = false;

    // With nothing typed this is that source's popular list.
    void search(0);
  }

  /**
   * @param {string} value
   */
  function onQueryChange(value) {
    query = value;
    results = [];
    page = 0;
    hasMore = false;
    void search(0);
  }

  /**
   * @param {number} nextPage
   */
  async function search(nextPage = 0) {
    if (serverId == null || !activeSource) {
      return;
    }

    // An empty term is not "nothing to show": the backend answers it with the source's most
    // downloaded plugins, which is what the tab opens on.
    const term = query.trim();

    const sequence = ++searchSeq;

    if (nextPage > 0) {
      loadingMore = true;
    } else {
      searching = true;
    }

    searchError = '';

    const params = new URLSearchParams({
      source: activeSource,
      q: term,
      page: String(nextPage),
      limit: String(PAGE_SIZE),
    });

    const body = await ApiUtil.get({
      path: `/api/panel/servers/${serverId}/plugins/search?${params.toString()}`,
      handler: (/** @type {object} */ response) => response,
    });

    if (sequence !== searchSeq) {
      return;
    }

    searching = false;
    loadingMore = false;

    if (!body) {
      searchError = 'pages.servers.plugins.browse.search-failed';

      return;
    }

    if (isEndpointUnavailable(body)) {
      searchError = 'pages.servers.errors.unavailable';

      return;
    }

    if (body.error) {
      searchError = 'pages.servers.plugins.browse.search-failed';
      // A state is what the Plugins page's own notices explain; only a failure is toasted.
      showServerLoadError(body.error, serverId, body);

      return;
    }

    const rows = (Array.isArray(body.results) ? body.results : []).map(
      (/** @type {object} */ result) => ({
        key: `${result?.source ?? activeSource}:${result?.projectId ?? result?.slug ?? ''}`,
        source: String(result?.source ?? activeSource),
        projectId: String(result?.projectId ?? result?.slug ?? ''),
        slug: String(result?.slug ?? ''),
        name: String(result?.name ?? ''),
        author: result?.author == null ? '' : String(result.author),
        summary: result?.summary == null ? '' : String(result.summary),
        iconUrl: result?.iconUrl == null ? '' : String(result.iconUrl),
        downloads: Number(result?.downloads) || 0,
        categories: Array.isArray(result?.categories)
          ? result.categories.map((/** @type {unknown} */ category) => String(category))
          : [],
        pageUrl: result?.pageUrl == null ? '' : String(result.pageUrl),
        compatible: result?.compatible !== false,
      }),
    );

    page = Number(body.page) || nextPage;
    hasMore = body.hasMore === true;
    results = nextPage > 0 ? [...results, ...rows] : rows;
  }

  /**
   * @param {object} project
   */
  async function openVersions(project) {
    versionsProject = project;
    versions = [];
    versionsError = '';
    versionsLoading = true;
    versionsModal?.show();

    const sequence = ++versionsSeq;

    const body = await ApiUtil.get({
      path: `/api/panel/servers/${serverId}/plugins/search/${encodeURIComponent(project.source)}/${encodeURIComponent(project.projectId)}/versions`,
      handler: (/** @type {object} */ response) => response,
    });

    if (sequence !== versionsSeq) {
      return;
    }

    versionsLoading = false;

    if (!body) {
      versionsError = 'pages.servers.plugins.browse.versions-failed';

      return;
    }

    if (isEndpointUnavailable(body)) {
      versionsError = 'pages.servers.errors.unavailable';

      return;
    }

    if (body.error) {
      versionsError = 'pages.servers.plugins.browse.versions-failed';
      // A state is what the Plugins page's own notices explain; only a failure is toasted.
      showServerLoadError(body.error, serverId, body);

      return;
    }

    versions = (Array.isArray(body.versions) ? body.versions : []).map(
      (/** @type {object} */ version) => {
        const files = (Array.isArray(version?.files) ? version.files : []).map(
          (/** @type {object} */ file) => ({
            filename: String(file?.filename ?? ''),
            size: Number(file?.size) || 0,
            primary: file?.primary === true,
          }),
        );

        const primaryIndex = Math.max(
          0,
          files.findIndex((file) => file.primary),
        );

        return {
          id: String(version?.id ?? ''),
          name: String(version?.name ?? ''),
          versionNumber: String(version?.versionNumber ?? ''),
          gameVersions: Array.isArray(version?.gameVersions)
            ? version.gameVersions.map((/** @type {unknown} */ entry) => String(entry))
            : [],
          loaders: Array.isArray(version?.loaders)
            ? version.loaders.map((/** @type {unknown} */ entry) => String(entry))
            : [],
          publishedAt: version?.publishedAt ?? null,
          channel: version?.channel == null ? '' : String(version.channel),
          compatible: version?.compatible !== false,
          files,
          primaryIndex,
        };
      },
    );
  }

  /**
   * @param {{ id: string }} version
   * @param {Event} event
   */
  function onFileChange(version, event) {
    const select = /** @type {HTMLSelectElement} */ (event.currentTarget);

    fileChoice = { ...fileChoice, [version.id]: Number(select.value) || 0 };
  }

  /**
   * @param {object} version
   */
  async function install(version) {
    if (!canInstall || serverId == null || installingVersionId || !versionsProject) {
      return;
    }

    const fileIndex = fileChoice[version.id] ?? version.primaryIndex;

    installingVersionId = version.id;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/plugins/install`,
        body: {
          source: versionsProject.source,
          projectId: versionsProject.projectId,
          versionId: version.id,
          fileIndex,
        },
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
        showServerActionError(body.error, body, { serverId, feature: 'plugins.install' });

        return;
      }

      // The node reports the real work through `taskProgress`; this is only the first frame so
      // the bar appears before the node has said anything.
      activeTask = {
        taskId: body.taskId == null ? '' : String(body.taskId),
        status: 'RUNNING',
        percent: 0,
        message: '',
        filename: body.filename == null ? version.versionNumber : String(body.filename),
      };

      versionsModal?.hide();
      void showSuccess('pages.servers.plugins.browse.install-started');
    } finally {
      installingVersionId = null;
    }
  }

  onMount(() => {
    versionsModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(versionsModalElement)
      : null;

    void loadSources();

    const offTask = onTaskProgress((frame) => {
      if (
        serverId == null ||
        Number(frame.serverId) !== Number(serverId) ||
        frame.kind !== 'PLUGIN_INSTALL'
      ) {
        return;
      }

      const filename = activeTask?.filename || '';

      activeTask = { ...frame, filename };

      if (frame.status === 'DONE') {
        void showSuccess('pages.servers.plugins.browse.install-done', { filename });
        activeTask = null;
        oninstalled?.();

        return;
      }

      if (frame.status === 'FAILED') {
        void showError('pages.servers.plugins.browse.install-failed', { error: frame.error || '' });
      }
    });

    return offTask;
  });

  onDestroy(() => {
    searchSeq += 1;
    versionsSeq += 1;
    versionsModal?.hide();
    versionsModal = null;
  });
</script>
