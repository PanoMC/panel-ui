<!-- Startup settings (SM-27) — managed servers only: the process Pano launches, plus the
     server.properties fields people change most often. -->
<div class="vstack gap-3">
  <div class="alert alert-info mb-0 small" role="alert">
    <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
    {$_('pages.servers.startup.restart-hint')}
  </div>

  <div class="card">
    <div class="card-header">{$_('pages.servers.startup.process-title')}</div>
    <div class="card-body">
      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="startupMemory">
          {$_('pages.servers.create.memory-label')}
          <small class="d-block">{$_('pages.servers.create.memory-hint')}</small>
        </label>
        <div class="col">
          <div class="input-group">
            <input
              id="startupMemory"
              type="number"
              class="form-control"
              min="512"
              step="512"
              bind:value={form.memoryMb} />
            <span class="input-group-text">MB</span>
          </div>
          <div class="btn-group btn-group-sm mt-2" role="group">
            {#each MEMORY_PRESETS as preset (preset)}
              <button
                type="button"
                class="btn btn-outline-secondary"
                class:active={Number(form.memoryMb) === preset}
                onclick={() => (form.memoryMb = preset)}>
                {preset / 1024} GB
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="startupPort">
          {$_('pages.servers.create.port-label')}
          <small class="d-block">{$_('pages.servers.create.port-hint')}</small>
        </label>
        <div class="col">
          <input
            id="startupPort"
            type="number"
            class="form-control"
            min="1"
            max="65535"
            bind:value={form.port} />
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="startupJava">
          {$_('pages.servers.create.java-label')}
          <small class="d-block">{$_('pages.servers.create.java-hint')}</small>
        </label>
        <div class="col">
          <select id="startupJava" class="form-select" bind:value={form.javaMajor}>
            <option value="">
              {automaticJava
                ? $_('pages.servers.create.java-auto-resolved', {
                    values: { major: automaticJava.major },
                  })
                : $_('pages.servers.create.java-auto')}
            </option>
            {#each javaOptions as major (major)}
              <option value={String(major)}>Java {major}</option>
            {/each}
            {#each downloadOptions as entry (entry.major)}
              <option value={String(entry.major)}>
                {javaDownloadSize(entry.size)
                  ? $_('pages.servers.create.java-will-download', {
                      values: { major: entry.major, size: javaDownloadSize(entry.size) },
                    })
                  : $_('pages.servers.create.java-will-download-unsized', {
                      values: { major: entry.major },
                    })}
              </option>
            {/each}
          </select>
          {#if javaDownloadNote}
            <div class="form-text">
              <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
              {javaDownloadNote}
            </div>
          {/if}
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="startupAutoStart">
          {$_('pages.servers.create.auto-start-label')}
        </label>
        <div class="col col-form-label">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="startupAutoStart"
              bind:checked={form.autoStart} />
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="startupCrashRestart">
          {$_('pages.servers.create.crash-restart-label')}
        </label>
        <div class="col col-form-label">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="startupCrashRestart"
              bind:checked={form.crashRestart} />
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-md-6 col-form-label" for="startupJvmArgs">
          {$_('pages.servers.create.jvm-args-label')}
          <small class="d-block">{$_('pages.servers.create.jvm-args-hint')}</small>
        </label>
        <div class="col">
          <textarea
            id="startupJvmArgs"
            class="form-control font-monospace"
            rows="3"
            spellcheck="false"
            bind:value={form.jvmArgs}></textarea>
          <button type="button" class="btn btn-outline-secondary btn-sm mt-2" onclick={useAikar}>
            <i class="fa-solid fa-wand-magic-sparkles me-1" aria-hidden="true"></i>
            {$_('pages.servers.create.aikar-preset')}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- server.properties has a tab of its own now, with every key; this only points there. -->
  <div class="card">
    <div class="card-body d-flex flex-wrap align-items-center gap-3">
      <div class="me-auto">
        <div class="fw-semibold">{$_('pages.servers.startup.properties-title')}</div>
        <div class="text-body-secondary small">
          {$_('pages.servers.startup.properties-description')}
        </div>
      </div>
      <a class="btn btn-outline-secondary" href="{base}/servers/{$server.id}/settings/properties">
        <i class="fa-solid fa-sliders me-1" aria-hidden="true"></i>
        {$_('pages.servers.startup.properties-open')}
      </a>
    </div>
  </div>

  <div>
    <button
      type="button"
      class="btn btn-secondary"
      disabled={saving || !dirty || !valid}
      onclick={save}>
      {#if saving}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('buttons.save')}
    </button>
  </div>
</div>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { browser } from '$app/environment';
  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchNode, getCachedNode } from '$lib/nodes.util.js';
  import { isManaged, jvmArgsToText } from '$lib/servers.util.js';

  /**
   * The editable copy of everything this page owns, built from the `server` row the detail
   * layout loaded. server.properties is the Server properties tab's, not this page's.
   *
   * @param {object | null} server
   * @returns {Record<string, unknown>}
   */
  function buildForm(server) {
    return {
      memoryMb: Number(server?.memoryMb) || 2048,
      port: Number(server?.gamePort ?? server?.port) || 25565,
      javaMajor: server?.javaVersion == null ? '' : String(server.javaVersion),
      jvmArgs: jvmArgsToText(server?.jvmArgs),
      autoStart: server?.autoStart !== false,
      crashRestart: server?.crashRestart !== false,
    };
  }

  /**
   * Startup settings only exist for a server Pano runs itself, so a linked server (or an admin
   * without `MANAGE_SERVER_STARTUP`) is sent back to the general settings tab.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { server, user } = await parent();

    if (!isManaged(server) || !hasPermission(Permissions.MANAGE_SERVER_STARTUP, user)) {
      throw redirect(302, `${base}/servers/${params.id}/settings`);
    }

    // The Java majors in the select come from the node's `NODE_HELLO`, so the row is read here
    // rather than after the form is already on screen — and not at all when the browser already
    // has it. Best effort: without `MANAGE_NODES`, or on a backend that cannot answer, it stays
    // null and the select falls back to "automatic" plus whatever this server is pinned to.
    const nodeId = server?.nodeId ?? null;
    const readable = nodeId != null && hasPermission(Permissions.MANAGE_NODES, user);
    // The cache is module state, shared by every SSR render, so only the browser may read it.
    const node =
      (browser && readable ? getCachedNode(nodeId) : null) ??
      (readable ? await fetchNode(nodeId, event) : null);

    // The route keys the page on this, so switching servers gives the form a fresh component
    // instead of an effect that has to notice and rebuild itself.
    return { serverId: Number(params.id), node };
  }
</script>

<script>
  import { getContext, onMount, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import {
    aikarFlags,
    isEndpointUnavailable,
    jvmArgsToList,
    showServerActionError,
  } from '$lib/servers.util.js';
  import {
    cacheNode,
    fetchNodeJava,
    fetchSoftwareJavaRequirement,
    javaChoicesFor,
    javaDownloadSize,
    resolveAutomaticJava,
  } from '$lib/nodes.util.js';

  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { data } = $props();

  /** Published by `ServerDetailLayout`, and kept live by the realtime feeds. */
  const server = getContext('server');

  const MEMORY_PRESETS = [1024, 2048, 4096, 8192];

  /**
   * The form is seeded once, from the server the route named: the store behind it is updated
   * by every realtime frame, and re-reading it would throw away what the admin typed. The
   * route re-creates this component when the server changes, so there is nothing to watch.
   */
  let form = $state(buildForm(get(server)));
  let original = $state(structuredClone(buildForm(get(server))));
  let saving = $state(false);
  /** The node `load` read, falling back to whatever another page already cached. */
  let nodeRow = $state(untrack(() => data?.node ?? getCachedNode(get(server)?.nodeId)));

  // Warm the shared cache once we are in the browser, so the server header and the create-server
  // wizard reuse this row instead of asking for it again.
  /**
   * SM-63 — the node's Java catalogue, so majors it would download can be picked too. Null while
   * it loads, or for good when the node / backend cannot answer: the select then offers the
   * installed majors only, as before.
   *
   * @type {import('$lib/nodes.util.js').JavaCatalog | null}
   */
  let javaCatalog = $state(null);
  /** What this server's software version needs, for the "Automatic (Java N)" label. */
  let javaRequirement = $state(null);

  onMount(() => {
    if (data?.node) {
      nodeRow = cacheNode(data.node) ?? nodeRow;
    }

    const current = get(server);
    const nodeId = current?.nodeId ?? nodeRow?.id ?? null;
    let active = true;

    if (nodeId != null) {
      void fetchNodeJava(nodeId).then((result) => {
        if (active && result.status === 'ok') {
          javaCatalog = result.catalog ?? null;
        }
      });
    }

    void fetchSoftwareJavaRequirement(current?.software, current?.softwareVersion).then(
      (requirement) => {
        if (active) {
          javaRequirement = requirement;
        }
      },
    );

    return () => {
      active = false;
    };
  });

  const javaChoices = $derived(javaChoicesFor(nodeRow, javaCatalog));
  const javaOptions = $derived(javaMajorsFor(javaChoices.installed, form.javaMajor));
  const downloadOptions = $derived(
    javaChoices.downloadable.filter((entry) => !javaOptions.includes(entry.major)),
  );
  const automaticJava = $derived(resolveAutomaticJava(javaRequirement, javaChoices));
  const javaDownloadNote = $derived.by(() => {
    const pinned = downloadOptions.find((entry) => String(entry.major) === form.javaMajor);
    const target =
      pinned ?? (form.javaMajor === '' && automaticJava?.download ? automaticJava : null);

    if (!target) {
      return '';
    }

    return $_('pages.servers.startup.java-download-note', {
      values: {
        major: target.major,
        size: javaDownloadSize(target.size) || $_('pages.servers.create.java-size-unknown'),
      },
    });
  });
  const dirty = $derived(JSON.stringify(form) !== JSON.stringify(original));
  const valid = $derived(
    Number(form.memoryMb) >= 512 &&
      Number(form.port) >= 1 &&
      Number(form.port) <= 65535 &&
      Number(form.maxPlayers) >= 1 &&
      Number(form.viewDistance) >= 2,
  );

  /**
   * The Java majors the node reported, plus whatever this server is already pinned to, so the
   * select never silently drops the current value.
   *
   * A pinned major the node would download is listed among the downloads instead.
   *
   * @param {number[]} majors the installed majors.
   * @param {string} selected
   * @returns {number[]}
   */
  function javaMajorsFor(majors, selected) {
    const pinned = Number(selected);

    if (
      Number.isFinite(pinned) &&
      pinned > 0 &&
      !majors.includes(pinned) &&
      !javaChoices.downloadable.some((entry) => entry.major === pinned)
    ) {
      return [...majors, pinned].sort((a, b) => a - b);
    }

    return majors;
  }

  function useAikar() {
    form.jvmArgs = aikarFlags(form.memoryMb);
  }

  async function save() {
    if (saving || !dirty || !valid) {
      return;
    }

    saving = true;

    const payload = {
      memoryMb: Number(form.memoryMb),
      port: Number(form.port),
      javaMajor: form.javaMajor === '' ? null : Number(form.javaMajor),
      jvmArgs: jvmArgsToList(form.jvmArgs),
      autoStart: !!form.autoStart,
      crashRestart: !!form.crashRestart,
    };

    const body = await ApiUtil.put({
      path: `/api/panel/servers/${get(server).id}/startup`,
      body: payload,
      handler: (response) => response,
    });

    saving = false;

    // `undefined`/`null` is the network-error path — ApiUtil already raised the splash.
    if (body === undefined || body === null) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      await showError('pages.servers.startup.unavailable');

      return;
    }

    if (body.error) {
      await showServerActionError(body.error);

      return;
    }

    original = structuredClone(form);

    server.update((current) => ({
      ...current,
      memoryMb: payload.memoryMb,
      gamePort: payload.port,
      javaVersion: payload.javaMajor,
      jvmArgs: payload.jvmArgs,
      autoStart: payload.autoStart,
      crashRestart: payload.crashRestart,
    }));

    await showSuccess('pages.servers.startup.saved');
  }
</script>
