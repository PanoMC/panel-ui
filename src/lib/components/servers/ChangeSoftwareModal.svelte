<style>
  .choice-card {
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius-lg);
    text-align: start;
    width: 100%;
    transition: border-color 0.15s ease-in-out;
  }

  .choice-card:hover:not(:disabled),
  .choice-card:focus-visible {
    border-color: var(--bs-primary);
  }

  .choice-card.selected {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 1px var(--bs-primary);
  }

  .software-grid {
    max-height: 16rem;
    overflow-y: auto;
  }
</style>

<!--
  Change a managed server's software (SM-66, §2.4.31) — and, with the software locked to the one
  it already runs, the plain "Reinstall". One dialog, four parts: what to install (software +
  version + the Java it will run on), what to carry over (worlds / plugins or mods /
  configuration, defaults and limits from `reinstall-preview`), how (backup first, start
  afterwards, account password), then the task's own step messages until it is DONE or FAILED.
-->
<div
  aria-hidden="true"
  aria-labelledby="changeSoftwareTitle"
  class="modal fade"
  role="dialog"
  tabindex="-1"
  bind:this={modalElement}>
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="changeSoftwareTitle">
          {$_(
            locked
              ? 'components.modals.change-software.title-reinstall'
              : 'components.modals.change-software.title',
            { values: { name: serverName } },
          )}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
          disabled={submitting}
          onclick={() => modalInstance?.hide()}></button>
      </div>

      {#if phase === 'progress'}
        <div class="modal-body">
          <div class="d-flex align-items-center gap-2 mb-3">
            {#if taskStatus === 'DONE'}
              <i class="fa-solid fa-circle-check text-success fa-lg" aria-hidden="true"></i>
            {:else if taskStatus === 'FAILED'}
              <i class="fa-solid fa-circle-xmark text-danger fa-lg" aria-hidden="true"></i>
            {:else}
              <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
            {/if}
            <span class="fw-semibold">
              {$_(
                taskStatus === 'DONE'
                  ? 'components.modals.change-software.progress-done'
                  : taskStatus === 'FAILED'
                    ? 'components.modals.change-software.progress-failed'
                    : 'components.modals.change-software.progress-running',
              )}
            </span>
          </div>

          <div
            class="progress mb-2"
            role="progressbar"
            aria-label={$_('components.modals.change-software.progress-running')}
            aria-valuenow={taskPercent}
            aria-valuemin="0"
            aria-valuemax="100">
            <div
              class="progress-bar"
              class:progress-bar-striped={taskStatus !== 'DONE' && taskStatus !== 'FAILED'}
              class:progress-bar-animated={taskStatus !== 'DONE' && taskStatus !== 'FAILED'}
              class:bg-danger={taskStatus === 'FAILED'}
              class:bg-success={taskStatus === 'DONE'}
              style="width: {taskPercent}%">
            </div>
          </div>

          {#if taskSteps.length > 0}
            <ol class="list-unstyled small mb-0 vstack gap-1">
              {#each taskSteps as entry, index (index)}
                <li class:text-body-secondary={index < taskSteps.length - 1}>
                  <!-- The step under way spins: an arrow here read as a switch that opens something. -->
                  <i
                    class="fa-solid fa-fw me-1 {index < taskSteps.length - 1 ||
                    taskStatus === 'DONE'
                      ? 'fa-check text-success'
                      : taskStatus === 'FAILED'
                        ? 'fa-xmark text-danger'
                        : 'fa-circle-notch fa-spin text-primary'}"
                    aria-hidden="true"></i>
                  {entry}
                </li>
              {/each}
            </ol>
            {#if taskBuilds}
              <!-- BuildTools' output, as on the server header: the latest line opens the rest. -->
              <TaskOutputLine
                class="mt-2"
                line={taskLines[taskLines.length - 1] ?? ''}
                lines={taskLines} />
            {/if}
          {:else}
            <div class="small text-body-secondary">
              {$_('components.modals.change-software.progress-waiting')}
            </div>
          {/if}

          {#if taskStatus === 'FAILED'}
            <div class="alert alert-danger small mt-3 mb-0" role="alert">
              {$_(serverActionErrorKey(taskError || 'TASK_FAILED'), {
                values: { error: taskError || 'TASK_FAILED' },
              })}
              <div class="mt-1">{$_('components.modals.change-software.progress-rolled-back')}</div>
            </div>
          {:else if taskStatus !== 'DONE'}
            <div class="form-text mt-3">
              {$_('components.modals.change-software.progress-background')}
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={() => modalInstance?.hide()}>
            {$_('buttons.close')}
          </button>
        </div>
      {:else}
        <form onsubmit={submit}>
          <div class="modal-body vstack gap-4">
            <!-- 1. What to install -->
            <section>
              <h6 class="text-uppercase small text-body-secondary mb-2">
                {$_('components.modals.change-software.section-software')}
              </h6>

              {#if softwareLoading}
                <div class="text-center py-3">
                  <span class="spinner-border" role="status" aria-hidden="true"></span>
                </div>
              {:else if pickable.length === 0}
                <div class="alert alert-warning small mb-0" role="alert">
                  {$_(
                    softwareUnavailable
                      ? 'components.modals.create-server.software-unavailable'
                      : 'components.modals.create-server.software-empty',
                  )}
                </div>
              {:else}
                <div class="row g-2" class:software-grid={!locked}>
                  {#each pickable as item (item.id)}
                    {@const noteBadge = softwareNoteBadge(item)}
                    {@const current = sameSoftware(item.id, fromSoftware)}
                    <div class={locked ? 'col-12' : 'col-md-6'}>
                      <button
                        type="button"
                        class="choice-card card h-100 p-2 bg-body"
                        class:selected={softwareId === item.id}
                        aria-pressed={softwareId === item.id}
                        disabled={locked}
                        onclick={() => selectSoftware(item)}>
                        <div class="d-flex flex-wrap align-items-center gap-2">
                          <SoftwareLogo id={item.id} />
                          <span class="fw-semibold">{item.name || item.id}</span>
                          {#if current}
                            <span class="badge text-bg-secondary">
                              {$_('components.modals.change-software.current')}
                            </span>
                          {/if}
                          {#if noteBadge}
                            <span
                              class="badge {noteBadge.className}"
                              use:tooltip={[
                                noteBadge.hint ? $_(noteBadge.hint) : '',
                                { placement: 'top' },
                              ]}>
                              {$_(noteBadge.label)}
                            </span>
                          {/if}
                        </div>
                      </button>
                    </div>
                  {/each}
                </div>

                {#if selectedSoftware}
                  <div class="row g-3 mt-0">
                    <div class="col-md-6">
                      <label class="form-label" for="changeSoftwareVersion">
                        {$_('components.modals.create-server.version-label')}
                      </label>
                      <select
                        id="changeSoftwareVersion"
                        class="form-select"
                        bind:value={version}
                        onchange={loadPreview}>
                        {#each versionsOf(selectedSoftware) as option (option)}
                          {@const versionLabel = softwareVersionLabelKey(selectedSoftware, option)}
                          <option value={option}>
                            {versionLabel ? $_(versionLabel) : option}{option === fromVersion &&
                            sameSoftware(selectedSoftware.id, fromSoftware)
                              ? ` (${$_('components.modals.change-software.current')})`
                              : ''}
                          </option>
                        {/each}
                      </select>
                    </div>
                    <div class="col-md-6">
                      <span class="form-label d-block">
                        {$_('pages.servers.create.java-label')}
                      </span>
                      <div class="form-control-plaintext py-1">
                        {javaLabel}
                      </div>
                      {#if javaDownloadNote}
                        <div class="form-text">
                          <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
                          {javaDownloadNote}
                        </div>
                      {/if}
                      {#if pinnedJavaOutside}
                        <div class="form-text text-warning">
                          <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                          {$_('components.modals.change-software.java-pinned-outside', {
                            values: { major: pinnedJava },
                          })}
                        </div>
                      {/if}
                    </div>
                  </div>

                  {#if BUILD_TOOLS_SOFTWARE.includes(String(selectedSoftware.id).toUpperCase())}
                    <div class="alert alert-warning mt-3 mb-0 small" role="alert">
                      <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                      {$_('components.modals.create-server.spigot-hint')}
                    </div>
                  {/if}
                {/if}
              {/if}
            </section>

            <!-- 2. What to keep -->
            <section>
              <h6 class="text-uppercase small text-body-secondary mb-2">
                {$_('components.modals.change-software.section-keep')}
              </h6>

              {#if previewLoading}
                <div class="small text-body-secondary mb-2">
                  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                  {$_('components.modals.change-software.preview-loading')}
                </div>
              {/if}

              <div class="vstack gap-2">
                {#each KEEP_OPTIONS as option (option)}
                  {@const allowed = allowedKeep[option]}
                  <span
                    class="d-inline-block"
                    use:tooltip={[
                      allowed ? '' : $_(`components.modals.change-software.keep-${option}-denied`),
                      { placement: 'top' },
                    ]}>
                    <span class="form-check mb-0">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="changeSoftwareKeep-{option}"
                        disabled={!allowed || !preview}
                        bind:checked={keep[option]} />
                      <label class="form-check-label" for="changeSoftwareKeep-{option}">
                        {$_(keepLabelKey(option))}
                        <small class="d-block text-body-secondary">
                          {$_(keepHintKey(option))}
                        </small>
                      </label>
                    </span>
                  </span>
                {/each}
              </div>

              {#if kindChanges}
                <div class="alert alert-warning small mt-3 mb-0" role="alert">
                  <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                  {$_(
                    toKind === 'proxy'
                      ? 'components.modals.change-software.warning-to-proxy'
                      : 'components.modals.change-software.warning-to-backend',
                  )}
                </div>
              {/if}
              {#if familyChanges && fromHasAddons}
                <div class="alert alert-warning small mt-3 mb-0" role="alert">
                  <i class="fa-solid fa-puzzle-piece me-1" aria-hidden="true"></i>
                  {$_(
                    FAMILY_MODS.includes(fromFamily)
                      ? 'components.modals.change-software.warning-mods'
                      : 'components.modals.change-software.warning-plugins',
                    { values: { from: fromName, to: toName } },
                  )}
                </div>
              {/if}
              {#if !keep.worlds && !kindChanges && toKind === 'backend'}
                <div class="alert alert-danger small mt-3 mb-0" role="alert">
                  <i class="fa-solid fa-earth-europe me-1" aria-hidden="true"></i>
                  {$_('components.modals.change-software.warning-worlds-dropped')}
                </div>
              {/if}
            </section>

            <!-- 3. How -->
            <section>
              <h6 class="text-uppercase small text-body-secondary mb-2">
                {$_('components.modals.change-software.section-confirm')}
              </h6>

              <div class="vstack gap-2">
                <!-- A server whose install failed has nothing to back up (Pano skips it too). -->
                {#if !installFailed}
                  <div class="form-check form-switch mb-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="changeSoftwareBackup"
                      bind:checked={backupFirst} />
                    <label class="form-check-label" for="changeSoftwareBackup">
                      {$_('components.modals.change-software.backup-first')}
                      <small class="d-block text-body-secondary">
                        {backupEstimate
                          ? $_('components.modals.change-software.backup-first-hint-size', {
                              values: { size: backupEstimate },
                            })
                          : $_('components.modals.change-software.backup-first-hint')}
                      </small>
                    </label>
                  </div>
                  {#if !backupFirst}
                    <div class="alert alert-danger small mb-0" role="alert">
                      <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                      {$_('components.modals.change-software.no-backup-warning')}
                    </div>
                  {/if}
                {/if}

                <div class="form-check form-switch mb-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="changeSoftwareStartAfter"
                    bind:checked={startAfter} />
                  <label class="form-check-label" for="changeSoftwareStartAfter">
                    {$_('components.modals.change-software.start-after')}
                    <small class="d-block text-body-secondary">
                      {$_(
                        running
                          ? 'components.modals.change-software.start-after-running'
                          : 'components.modals.change-software.start-after-stopped',
                      )}
                    </small>
                  </label>
                </div>

                {#if toKind !== 'proxy'}
                  <div class="form-check mb-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="changeSoftwareEula"
                      bind:checked={acceptEula} />
                    <label class="form-check-label" for="changeSoftwareEula">
                      {$_('components.modals.create-server.eula-label')}
                      <a href={EULA_URL} target="_blank" rel="noreferrer noopener">
                        {$_('components.modals.create-server.eula-link')}
                        <i
                          class="fa-solid fa-arrow-up-right-from-square ms-1 small"
                          aria-hidden="true"></i>
                      </a>
                    </label>
                  </div>
                {/if}

                <div>
                  <label class="form-label mb-1" for="changeSoftwarePassword">
                    {$_('components.modals.change-software.password-label')}
                  </label>
                  <input
                    id="changeSoftwarePassword"
                    class="form-control"
                    type="password"
                    autocomplete="current-password"
                    placeholder={$_('pages.servers.nodes.delete-password')}
                    bind:value={password}
                    bind:this={passwordInput}
                    class:is-invalid={passwordError} />
                  {#if passwordError}
                    <div class="invalid-feedback">
                      {$_('pages.servers.errors.wrong-password')}
                    </div>
                  {/if}
                </div>

                {#if submitError}
                  <div class="alert alert-danger small mb-0" role="alert">{submitError}</div>
                {/if}

                <div class="small text-body-secondary">
                  <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
                  {$_(
                    running
                      ? 'components.modals.change-software.summary-running'
                      : 'components.modals.change-software.summary-stopped',
                    { values: { from: fromLabel, to: toLabel } },
                  )}
                </div>
              </div>
            </section>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-link"
              disabled={submitting}
              onclick={() => modalInstance?.hide()}>
              {$_('buttons.cancel')}
            </button>
            <button type="submit" class="btn btn-danger" disabled={!canSubmit}>
              {#if submitting}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_(
                locked || !softwareChanges
                  ? 'buttons.reinstall'
                  : 'components.modals.change-software.submit',
              )}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

<script module>
  /** @type {((options: { server: object, lockSoftware?: boolean }) => void) | null} */
  let openModal = null;

  /**
   * Opens the dialog for `server`. `lockSoftware` is the danger zone's plain "Reinstall": the
   * same dialog, but only the version of the software the server already runs can be picked.
   *
   * @param {{ server: object, lockSoftware?: boolean }} options
   */
  export function show(options) {
    openModal?.(options);
  }

  /**
   * The software families — what can be carried from one to another (§2.4.31). Keep in step with
   * the backend's table next to `ServerSoftwareCatalog` and the node's install pipeline; this copy
   * only fills in while `reinstall-preview` has not answered (or on a Pano without it).
   *
   * @type {Readonly<Record<string, string>>}
   */
  const SOFTWARE_FAMILIES = Object.freeze({
    paper: 'bukkit',
    purpur: 'bukkit',
    folia: 'bukkit',
    spigot: 'bukkit',
    craftbukkit: 'bukkit',
    fabric: 'fabric',
    quilt: 'fabric',
    forge: 'forge',
    neoforge: 'forge',
    vanilla: 'vanilla',
    velocity: 'velocity',
    bungeecord: 'bungee',
    waterfall: 'bungee',
  });

  const PROXY_FAMILIES = ['velocity', 'bungee'];
  const BACKEND_FAMILIES = ['bukkit', 'fabric', 'forge', 'vanilla'];
  /** Families whose add-ons are mods (`mods/` + `config/`) rather than plugins. */
  const FAMILY_MODS = ['fabric', 'forge'];
  /** Families that have add-ons at all. */
  const FAMILY_ADDONS = ['bukkit', 'bungee', 'velocity', 'fabric', 'forge'];

  /** Families that read the vanilla config files (`server.properties`, whitelist, ops, bans). */
  const VANILLA_CONFIG_FAMILIES = ['bukkit', 'fabric', 'vanilla'];

  const KEEP_OPTIONS = /** @type {const} */ (['worlds', 'plugins', 'configs']);

  const BUILD_TOOLS_SOFTWARE = ['SPIGOT', 'CRAFTBUKKIT'];

  /** How many BuildTools lines the output log keeps; the node's own log file has them all. */
  const MAX_TASK_LINES = 300;

  const EULA_URL = 'https://aka.ms/MinecraftEULA';

  /**
   * @param {unknown} id
   * @returns {string}
   */
  function softwareKey(id) {
    return String(id ?? '')
      .trim()
      .toLowerCase();
  }

  /**
   * @param {unknown} software
   * @returns {string} '' when unknown.
   */
  function familyOf(software) {
    return SOFTWARE_FAMILIES[softwareKey(software)] || '';
  }

  /**
   * @param {string} family
   * @returns {'proxy'|'backend'|''}
   */
  function kindOfFamily(family) {
    if (PROXY_FAMILIES.includes(family)) {
      return 'proxy';
    }

    return BACKEND_FAMILIES.includes(family) ? 'backend' : '';
  }

  /**
   * The keep defaults and limits the backend would answer with (§2.4.31), for when it cannot.
   *
   * @param {string} fromFamily
   * @param {string} toFamily
   */
  function localKeepRules(fromFamily, toFamily) {
    const bothBackend =
      kindOfFamily(fromFamily) === 'backend' && kindOfFamily(toFamily) === 'backend';
    const sameFamily = !!fromFamily && fromFamily === toFamily;
    const plugins = sameFamily && FAMILY_ADDONS.includes(fromFamily);
    // Bukkit, Fabric and vanilla all read the vanilla files, so those carry across them.
    const configs =
      sameFamily ||
      (VANILLA_CONFIG_FAMILIES.includes(fromFamily) && VANILLA_CONFIG_FAMILIES.includes(toFamily));
    const rules = { worlds: bothBackend, plugins, configs };

    // The backend preselects everything it allows.
    return { defaults: rules, allowed: rules };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import {
    fetchNode,
    fetchNodeJava,
    fetchSoftwareJavaRequirement,
    javaChoicesFor,
    javaDownloadSize,
    resolveAutomaticJava,
  } from '$lib/nodes.util.js';
  import {
    getProcessState,
    getServerDisplayName,
    isEndpointUnavailable,
    ProcessStates,
    serverActionErrorKey,
    showServerActionError,
    softwareNoteBadge,
    softwareVersionLabelKey,
  } from '$lib/servers.util.js';
  import { onTaskProgress } from '$lib/panelRealtime.js';
  import { formatBytes } from '$lib/string.util.js';

  import SoftwareLogo from '$lib/components/servers/SoftwareLogo.svelte';
  import TaskOutputLine from '$lib/components/servers/TaskOutputLine.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let modalElement = $state();
  /** @type {any} */
  let modalInstance = null;

  /** @type {any} */
  let server = $state(null);
  let locked = $state(false);
  /** 'form' while choosing, 'progress' once the task is running. */
  let phase = $state('form');

  let softwareList = $state([]);
  let softwareLoading = $state(false);
  let softwareUnavailable = $state(false);
  let softwareId = $state('');
  let version = $state('');

  /** @type {any} */
  let preview = $state(null);
  let previewLoading = $state(false);
  /** Whether this Pano answers `reinstall-preview` at all; the local rules fill in if not. */
  let previewSupported = $state(true);
  let previewSeq = 0;
  /** The target the keep checkboxes were last reset for — a new software starts from defaults. */
  let keepResetFor = '';

  let keep = $state({ worlds: true, plugins: true, configs: true });
  let backupFirst = $state(true);
  let startAfter = $state(false);
  let acceptEula = $state(false);
  let password = $state('');
  let passwordInput = $state();
  let passwordError = $state(false);
  let submitError = $state('');
  let submitting = $state(false);

  /** @type {import('$lib/nodes.util.js').JavaCatalog | null} */
  let javaCatalog = $state(null);
  /** @type {object | null} */
  let node = $state(null);
  /** @type {{ minimum: number, maximum: number|null } | null} */
  let fallbackJava = $state(null);

  let taskId = $state('');
  let taskStatus = $state('');
  let taskPercent = $state(0);
  let taskError = $state('');
  /** @type {string[]} */
  let taskSteps = $state([]);
  /** Whether the task compiles its jar with BuildTools, whose Maven output comes as its messages. */
  let taskBuilds = $state(false);
  /**
   * Every message of a BuildTools task, for its output log; the steps keep only the phases.
   *
   * @type {string[]}
   */
  let taskLines = $state([]);
  /** The percentage the newest step arrived at: a BuildTools line that moves it is a new phase. */
  let stepPercent = -1;

  const serverName = $derived(server ? getServerDisplayName(server) : '');
  const fromSoftware = $derived(softwareKey(preview?.from?.software ?? server?.software));
  const fromVersion = $derived(String(preview?.from?.version ?? server?.softwareVersion ?? ''));

  const selectedSoftware = $derived(softwareList.find((item) => item.id === softwareId) ?? null);
  /** Locked (plain reinstall) shows only the current software; otherwise the whole catalogue. */
  const pickable = $derived(
    locked ? softwareList.filter((item) => sameSoftware(item.id, fromSoftware)) : softwareList,
  );

  const fromFamily = $derived(
    String(preview?.from?.family || familyOf(fromSoftware)).toLowerCase(),
  );
  const toFamily = $derived(String(preview?.to?.family || familyOf(softwareId)).toLowerCase());
  const fromKind = $derived(String(preview?.from?.kind || kindOfFamily(fromFamily)).toLowerCase());
  const toKind = $derived(String(preview?.to?.kind || kindOfFamily(toFamily)).toLowerCase());
  const familyChanges = $derived(!!fromFamily && !!toFamily && fromFamily !== toFamily);
  const kindChanges = $derived(!!fromKind && !!toKind && fromKind !== toKind);
  const fromHasAddons = $derived(FAMILY_ADDONS.includes(fromFamily));
  const softwareChanges = $derived(!!softwareId && !sameSoftware(softwareId, fromSoftware));

  const localRules = $derived(localKeepRules(fromFamily, toFamily));
  const allowedKeep = $derived({
    worlds: preview?.allowed ? preview.allowed.worlds === true : localRules.allowed.worlds,
    plugins: preview?.allowed ? preview.allowed.plugins === true : localRules.allowed.plugins,
    configs: preview?.allowed ? preview.allowed.configs === true : localRules.allowed.configs,
  });

  /** The server's install failed (`installError`): the reinstall is its first real install. */
  const installFailed = $derived(!!server?.installError);

  const running = $derived(
    typeof preview?.running === 'boolean'
      ? preview.running
      : getProcessState(server) === ProcessStates.RUNNING ||
          getProcessState(server) === ProcessStates.STARTING,
  );

  const fromName = $derived(softwareName(fromSoftware));
  const toName = $derived(softwareName(softwareId));
  const fromLabel = $derived(`${fromName} ${fromVersion}`.trim());
  const toLabel = $derived(`${toName} ${version}`.trim());

  const backupEstimate = $derived(
    Number(preview?.backupEstimateBytes) > 0
      ? formatBytes(Number(preview.backupEstimateBytes), 1)
      : '',
  );

  const javaRequirement = $derived(
    Number(preview?.java?.minimum) > 0
      ? {
          minimum: Number(preview.java.minimum),
          maximum: Number(preview.java.maximum) > 0 ? Number(preview.java.maximum) : null,
        }
      : fallbackJava,
  );
  const javaChoices = $derived(javaChoicesFor(node, javaCatalog));
  const automaticJava = $derived(resolveAutomaticJava(javaRequirement, javaChoices));
  const pinnedJava = $derived(Number(server?.javaVersion ?? server?.javaMajor) || null);
  const pinnedJavaOutside = $derived(
    pinnedJava != null &&
      javaRequirement != null &&
      (pinnedJava < javaRequirement.minimum ||
        (javaRequirement.maximum != null && pinnedJava > javaRequirement.maximum)),
  );
  const javaLabel = $derived(
    pinnedJava != null && !pinnedJavaOutside
      ? `Java ${pinnedJava}`
      : automaticJava
        ? $_('pages.servers.create.java-auto-resolved', { values: { major: automaticJava.major } })
        : $_('pages.servers.create.java-auto'),
  );
  const javaDownloadNote = $derived(
    (pinnedJava == null || pinnedJavaOutside) && automaticJava?.download
      ? $_('pages.servers.create.java-download-note', {
          values: {
            major: automaticJava.major,
            size:
              javaDownloadSize(automaticJava.size) || $_('pages.servers.create.java-size-unknown'),
          },
        })
      : '',
  );

  const canSubmit = $derived(
    !submitting &&
      !!server &&
      !!softwareId &&
      !!version &&
      password.length > 0 &&
      (toKind === 'proxy' || acceptEula) &&
      !previewLoading,
  );

  /**
   * @param {unknown} a
   * @param {unknown} b
   */
  function sameSoftware(a, b) {
    return !!softwareKey(a) && softwareKey(a) === softwareKey(b);
  }

  /**
   * @param {unknown} id
   * @returns {string}
   */
  function softwareName(id) {
    const item = softwareList.find((entry) => sameSoftware(entry.id, id));

    return item?.name || String(id ?? '');
  }

  /**
   * @param {any} item
   * @returns {string[]}
   */
  function versionsOf(item) {
    return Array.isArray(item?.versions) ? item.versions.map((entry) => String(entry)) : [];
  }

  /**
   * @param {'worlds'|'plugins'|'configs'} option
   */
  function keepLabelKey(option) {
    if (option === 'plugins' && FAMILY_MODS.includes(fromFamily)) {
      return 'components.modals.change-software.keep-mods';
    }

    return `components.modals.change-software.keep-${option}`;
  }

  /**
   * @param {'worlds'|'plugins'|'configs'} option
   */
  function keepHintKey(option) {
    if (option === 'plugins' && FAMILY_MODS.includes(fromFamily)) {
      return 'components.modals.change-software.keep-mods-hint';
    }

    if (option === 'configs' && familyChanges) {
      return 'components.modals.change-software.keep-configs-vanilla-hint';
    }

    return `components.modals.change-software.keep-${option}-hint`;
  }

  /**
   * @param {any} item
   */
  function selectSoftware(item) {
    if (locked) {
      return;
    }

    softwareId = item.id;

    // The running version is the natural pick for the same software; otherwise the recommended.
    const versions = versionsOf(item);

    version =
      sameSoftware(item.id, fromSoftware) && versions.includes(fromVersion)
        ? fromVersion
        : item.recommendedVersion || versions[0] || '';

    void loadPreview();
  }

  /**
   * Applies the preview's (or the local rules') defaults when the target software changed, and
   * otherwise only clears what the new target no longer allows.
   */
  function applyKeepDefaults() {
    const target = softwareKey(softwareId);
    const defaults = preview?.defaults || localRules.defaults;

    if (target !== keepResetFor) {
      keepResetFor = target;
      keep = {
        worlds: defaults.worlds === true && allowedKeep.worlds,
        plugins: defaults.plugins === true && allowedKeep.plugins,
        configs: defaults.configs === true && allowedKeep.configs,
      };

      return;
    }

    keep = {
      worlds: keep.worlds && allowedKeep.worlds,
      plugins: keep.plugins && allowedKeep.plugins,
      configs: keep.configs && allowedKeep.configs,
    };
  }

  /**
   * Without the preview (a Pano before SM-66) the Java note falls back to the wizard's version
   * resolve.
   *
   * @param {number} seq the preview request this belongs to.
   * @param {string} target
   * @param {string} targetVersion
   */
  async function loadFallbackJava(seq, target, targetVersion) {
    fallbackJava = null;

    const requirement = await fetchSoftwareJavaRequirement(target, targetVersion);

    if (seq === previewSeq) {
      fallbackJava = requirement;
    }
  }

  /** Every software/version pick asks the backend what can be carried over. */
  async function loadPreview() {
    const target = softwareId;
    const targetVersion = version;
    const id = server?.id;
    const seq = ++previewSeq;

    if (!target || !targetVersion || id == null) {
      return;
    }

    if (!previewSupported) {
      applyKeepDefaults();
      void loadFallbackJava(seq, target, targetVersion);

      return;
    }

    previewLoading = true;

    let body;

    try {
      body = await ApiUtil.get({
        path: `/api/panel/servers/${id}/reinstall-preview?software=${encodeURIComponent(
          target,
        )}&version=${encodeURIComponent(targetVersion)}`,
        handler: (response) => response,
      });
    } catch {
      body = null;
    }

    if (seq !== previewSeq) {
      return;
    }

    previewLoading = false;

    if (body && isEndpointUnavailable(body)) {
      previewSupported = false;
      preview = null;
      void loadFallbackJava(seq, target, targetVersion);
    } else if (body && !body.error && body.from && body.to) {
      preview = body;
    } else {
      preview = null;

      if (body?.error) {
        submitError = $_(serverActionErrorKey(body.error), { values: { error: body.error } });
      }
    }

    applyKeepDefaults();
  }

  async function loadSoftware() {
    softwareLoading = true;

    const body = await ApiUtil.get({
      path: '/api/panel/software',
      handler: (response) => response,
    });

    softwareLoading = false;

    if (body === undefined || body === null) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      softwareUnavailable = true;
      softwareList = [];

      return;
    }

    if (body.error) {
      await showServerActionError(body.error);

      return;
    }

    softwareUnavailable = false;
    softwareList = Array.isArray(body.software) ? body.software : Array.isArray(body) ? body : [];

    const current = softwareList.find((item) => sameSoftware(item.id, fromSoftware));

    if (current) {
      softwareId = current.id;

      const versions = versionsOf(current);

      version = versions.includes(fromVersion)
        ? fromVersion
        : current.recommendedVersion || versions[0] || '';

      void loadPreview();
    } else if (!locked) {
      const recommended = softwareList.find((item) => item.recommended) || softwareList[0];

      if (recommended) {
        selectSoftware(recommended);
      }
    }
  }

  async function loadJava() {
    const nodeId = server?.nodeId;

    if (nodeId == null) {
      return;
    }

    const [row, result] = await Promise.all([fetchNode(nodeId), fetchNodeJava(nodeId)]);

    node = row;
    javaCatalog = result.status === 'ok' ? (result.catalog ?? null) : null;
  }

  /**
   * @param {SubmitEvent} event
   */
  async function submit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    submitting = true;
    submitError = '';
    passwordError = false;

    /** @type {Record<string, unknown>} */
    const payload = {
      currentPassword: password,
      software: softwareId,
      version,
      acceptEula: true,
      keep: {
        worlds: !!keep.worlds && allowedKeep.worlds,
        plugins: !!keep.plugins && allowedKeep.plugins,
        configs: !!keep.configs && allowedKeep.configs,
      },
      backupFirst: !!backupFirst && !installFailed,
      startAfter: !!startAfter,
    };

    const body = await ApiUtil.post({
      path: `/api/panel/servers/${server.id}/reinstall`,
      body: payload,
      handler: (response) => response,
    });

    submitting = false;

    // `undefined`/`null` is the network-error path — ApiUtil already raised the splash.
    if (body === undefined || body === null) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      await showError('pages.servers.settings.reinstall-unavailable');

      return;
    }

    if (body.error) {
      const code = String(body.error).toUpperCase();

      if (code === 'CURRENT_PASSWORD_NOT_CORRECT' || code === 'WRONG_PASSWORD') {
        passwordError = true;
        passwordInput?.focus();

        return;
      }

      submitError = $_(serverActionErrorKey(code), { values: { error: code } });

      // The backend's rules moved under us — read them again so the checkboxes match.
      // `keep` (top-level extra) names the refused switches: untick them, then re-read the rules.
      if (code === 'KEEP_INCOMPATIBLE') {
        const refused = Array.isArray(body.keep) ? body.keep.map(String) : [];

        keep = {
          worlds: keep.worlds && !refused.includes('worlds'),
          plugins: keep.plugins && !refused.includes('plugins'),
          configs: keep.configs && !refused.includes('configs'),
        };
        void loadPreview();
      }

      return;
    }

    password = '';
    taskId = body.taskId == null ? '' : String(body.taskId);
    taskStatus = 'PENDING';
    taskPercent = 0;
    taskError = '';
    taskSteps = [];
    taskBuilds = BUILD_TOOLS_SOFTWARE.includes(String(softwareId).toUpperCase());
    taskLines = [];
    stepPercent = -1;
    phase = 'progress';
  }

  function reset() {
    phase = 'form';
    preview = null;
    previewLoading = false;
    previewSupported = true;
    previewSeq++;
    keepResetFor = '';
    keep = { worlds: true, plugins: true, configs: true };
    backupFirst = true;
    acceptEula = false;
    password = '';
    passwordError = false;
    submitError = '';
    submitting = false;
    softwareId = '';
    version = '';
    node = null;
    javaCatalog = null;
    taskId = '';
    taskStatus = '';
    taskPercent = 0;
    taskError = '';
    taskSteps = [];
    taskBuilds = false;
    taskLines = [];
    stepPercent = -1;
  }

  onMount(() => {
    modalInstance = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          // The dialog holds the account password, so a stray backdrop click must not drop it.
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    openModal = (options) => {
      reset();

      server = options?.server ?? null;
      locked = options?.lockSoftware === true;
      startAfter =
        getProcessState(server) === ProcessStates.RUNNING ||
        getProcessState(server) === ProcessStates.STARTING;

      void loadSoftware();
      void loadJava();

      modalInstance?.show();
    };

    const onShown = () => passwordInput?.focus();

    modalElement?.addEventListener('shown.bs.modal', onShown);

    // The task's step messages; the server layout reloads the row itself once it is DONE.
    const offTask = onTaskProgress((frame) => {
      if (phase !== 'progress' || !taskId || String(frame.taskId) !== taskId) {
        return;
      }

      taskStatus = frame.status;
      taskPercent = Math.max(0, Math.min(100, Math.round(frame.percent)));

      if (taskBuilds) {
        // Thousands of Maven lines arrive as messages: all of them go to the output log, and only
        // a line that moves the percentage (BuildTools reached its next phase) becomes a step.
        if (frame.message && frame.message !== taskLines[taskLines.length - 1]) {
          taskLines = [...taskLines, frame.message].slice(-MAX_TASK_LINES);
        }

        if (frame.message && (taskSteps.length === 0 || taskPercent !== stepPercent)) {
          if (frame.message !== taskSteps[taskSteps.length - 1]) {
            taskSteps = [...taskSteps, frame.message];
          }

          stepPercent = taskPercent;
        }
      } else if (frame.message && frame.message !== taskSteps[taskSteps.length - 1]) {
        taskSteps = [...taskSteps, frame.message];
      }

      if (frame.status === 'FAILED') {
        taskError = frame.error || 'TASK_FAILED';
      }

      if (frame.status === 'DONE') {
        taskPercent = 100;
        void showSuccess(
          softwareChanges
            ? 'components.modals.change-software.done-toast'
            : 'components.modals.change-software.done-toast-reinstall',
          { name: serverName, software: toLabel },
        );
        modalInstance?.hide();
      }
    });

    return () => {
      offTask();
      modalElement?.removeEventListener('shown.bs.modal', onShown);
      modalInstance?.hide();
      modalInstance?.dispose?.();
      modalInstance = null;
      openModal = null;
    };
  });
</script>
