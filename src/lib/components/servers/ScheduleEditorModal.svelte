<style>
  .task-kind-select {
    max-width: 11rem;
  }

  .task-action-select {
    max-width: 12rem;
  }

  .keep-input {
    max-width: 7rem;
  }

  .preview-list {
    list-style: none;
  }
</style>

<!-- SM-34 — the editor behind "New schedule" and the pencil in the schedules table (§2.4.6).
     The cron field is checked by `GET /api/panel/cron/preview`, which is also where the human
     description and the next five runs come from, so the panel never parses cron itself. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={modalElement}>
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_(
            editingId == null
              ? 'components.modals.schedule-editor.create-title'
              : 'components.modals.schedule-editor.edit-title',
          )}
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>

      <div class="modal-body vstack gap-3">
        <div>
          <label class="form-label" for="scheduleName">
            {$_('components.modals.schedule-editor.name-label')}
          </label>
          <input
            id="scheduleName"
            type="text"
            class="form-control"
            maxlength="64"
            placeholder={$_('components.modals.schedule-editor.name-placeholder')}
            bind:value={name} />
        </div>

        <div>
          <span class="form-label d-block" id="scheduleCronLabel">
            {$_('components.modals.schedule-editor.cron-label')}
          </span>
          <div
            class="btn-group btn-group-sm flex-wrap"
            role="group"
            aria-labelledby="scheduleCronLabel">
            {#each CRON_PRESETS as preset (preset.id)}
              <button
                type="button"
                class="btn"
                class:btn-primary={activePreset === preset.id}
                class:btn-outline-secondary={activePreset !== preset.id}
                onclick={() => (cron = preset.cron)}>
                {$_(`pages.servers.schedules.presets.${preset.id}`)}
              </button>
            {/each}
            <button
              type="button"
              class="btn"
              class:btn-primary={activePreset === 'custom'}
              class:btn-outline-secondary={activePreset !== 'custom'}
              onclick={() => customCronInput?.focus()}>
              {$_('pages.servers.schedules.presets.custom')}
            </button>
          </div>

          <input
            type="text"
            class="form-control font-monospace mt-2"
            aria-label={$_('components.modals.schedule-editor.cron-label')}
            placeholder="0 4 * * *"
            bind:this={customCronInput}
            bind:value={cron} />
          <div class="form-text">{$_('components.modals.schedule-editor.cron-hint')}</div>
        </div>

        <div class="row g-3">
          <div class="col-md-7">
            <label class="form-label" for="scheduleTimezone">
              {$_('components.modals.schedule-editor.timezone-label')}
            </label>
            <select id="scheduleTimezone" class="form-select" bind:value={timezone}>
              {#each timezoneOptions as zone (zone)}
                <option value={zone}>{zone}</option>
              {/each}
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label" for="scheduleWarnMinutes">
              {$_('components.modals.schedule-editor.warn-label')}
            </label>
            <input
              id="scheduleWarnMinutes"
              type="number"
              class="form-control"
              min="0"
              max="60"
              bind:value={warnMinutes} />
            <div class="form-text">{$_('components.modals.schedule-editor.warn-hint')}</div>
          </div>
        </div>

        {#if previewSupported}
          <div class="border rounded p-3">
            {#if previewLoading}
              <div class="d-flex align-items-center gap-2 small text-body-secondary">
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                {$_('components.modals.schedule-editor.preview-loading')}
              </div>
            {:else if previewError}
              <div class="small text-body-secondary">{$_(previewError)}</div>
            {:else if preview && !preview.valid}
              <div class="small text-danger">
                {$_('components.modals.schedule-editor.preview-invalid')}
              </div>
            {:else if preview}
              <div class="small fw-semibold">
                {preview.description || $_('components.modals.schedule-editor.preview-title')}
              </div>
              {#if preview.next.length}
                <ul class="preview-list small text-body-secondary mb-0 mt-2 ps-0">
                  {#each preview.next as next, index (`${next}-${index}`)}
                    <li>
                      <i class="fa-regular fa-clock me-1" aria-hidden="true"></i>
                      <DateComponent time={next} fullFormat />
                    </li>
                  {/each}
                </ul>
              {/if}
            {:else}
              <div class="small text-body-secondary">
                {$_('components.modals.schedule-editor.preview-title')}
              </div>
            {/if}
          </div>
        {/if}

        <div>
          <span class="form-label d-block"
            >{$_('components.modals.schedule-editor.tasks-label')}</span>
          <div class="form-text mb-2">{$_('components.modals.schedule-editor.tasks-hint')}</div>

          {#if !tasks.length}
            <div class="text-body-secondary small border rounded p-3">
              {$_('components.modals.schedule-editor.tasks-empty')}
            </div>
          {:else}
            <div class="vstack gap-2">
              {#each tasks as task, index (task.uid)}
                <div class="border rounded p-2 d-flex flex-wrap align-items-center gap-2">
                  <span class="badge rounded-pill text-bg-secondary">{index + 1}</span>

                  <select
                    class="form-select form-select-sm task-kind-select"
                    aria-label={$_('components.modals.schedule-editor.task-kind')}
                    value={task.kind}
                    onchange={(event) => onKindChange(task, event)}>
                    <option value="POWER">{$_('pages.servers.schedules.task-kind.power')}</option>
                    <option value="COMMAND">
                      {$_('pages.servers.schedules.task-kind.command')}
                    </option>
                    {#if canBackup}
                      <option value="BACKUP">
                        {$_('pages.servers.schedules.task-kind.backup')}
                      </option>
                    {/if}
                  </select>

                  {#if task.kind === 'POWER'}
                    <select
                      class="form-select form-select-sm task-action-select"
                      aria-label={$_('components.modals.schedule-editor.task-action')}
                      bind:value={task.action}>
                      <option value="RESTART">
                        {$_('pages.servers.schedules.power-action.restart')}
                      </option>
                      <option value="STOP"
                        >{$_('pages.servers.schedules.power-action.stop')}</option>
                    </select>
                  {:else if task.kind === 'COMMAND'}
                    <input
                      type="text"
                      class="form-control form-control-sm flex-grow-1 font-monospace"
                      maxlength="512"
                      aria-label={$_('components.modals.schedule-editor.task-command')}
                      placeholder={$_('components.modals.schedule-editor.task-command-placeholder')}
                      bind:value={task.command} />
                  {:else}
                    <input
                      type="text"
                      class="form-control form-control-sm flex-grow-1"
                      maxlength="64"
                      aria-label={$_('components.modals.schedule-editor.task-backup-name')}
                      placeholder={$_('components.modals.schedule-editor.task-backup-placeholder')}
                      bind:value={task.backupName} />
                    <input
                      type="number"
                      class="form-control form-control-sm keep-input"
                      min="0"
                      max="100"
                      aria-label={$_('components.modals.schedule-editor.task-keep')}
                      title={$_('components.modals.schedule-editor.task-keep')}
                      bind:value={task.keep} />
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary text-nowrap"
                      aria-expanded={task.showOptions}
                      onclick={() => (task.showOptions = !task.showOptions)}>
                      <i class="fa-solid fa-sliders me-1" aria-hidden="true"></i>
                      {$_(`components.backup-options.mode-${task.options.mode.toLowerCase()}`)}
                      &middot;
                      {$_(`components.backup-options.scope-${task.options.scope.toLowerCase()}`)}
                    </button>
                  {/if}

                  <div class="btn-group btn-group-sm ms-auto">
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      disabled={index === 0}
                      aria-label={$_('components.modals.schedule-editor.move-up')}
                      onclick={() => moveTask(index, -1)}>
                      <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      disabled={index === tasks.length - 1}
                      aria-label={$_('components.modals.schedule-editor.move-down')}
                      onclick={() => moveTask(index, 1)}>
                      <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-danger"
                      aria-label={$_('buttons.remove')}
                      onclick={() => removeTask(index)}>
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                  </div>

                  {#if task.kind === 'BACKUP' && task.showOptions}
                    <!-- Everything a backup from the Backups page can be, per step. -->
                    <div class="w-100 border-top pt-2 mt-1">
                      <BackupOptions
                        bind:value={task.options}
                        idPrefix="schedule-task-{task.uid}" />
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <div class="d-flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              onclick={() => addTask('POWER')}>
              <i class="fa-solid fa-power-off me-1" aria-hidden="true"></i>
              {$_('pages.servers.schedules.task-kind.power')}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              onclick={() => addTask('COMMAND')}>
              <i class="fa-solid fa-terminal me-1" aria-hidden="true"></i>
              {$_('pages.servers.schedules.task-kind.command')}
            </button>
            {#if canBackup}
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                onclick={() => addTask('BACKUP')}>
                <i class="fa-solid fa-box-archive me-1" aria-hidden="true"></i>
                {$_('pages.servers.schedules.task-kind.backup')}
              </button>
            {:else}
              <span class="form-text m-0 align-self-center">
                {$_('components.modals.schedule-editor.backup-unavailable')}
              </span>
            {/if}
          </div>
        </div>

        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="scheduleEnabled"
            bind:checked={enabled} />
          <label class="form-check-label" for="scheduleEnabled">
            {$_('components.modals.schedule-editor.enabled-label')}
          </label>
        </div>

        {#if formError}
          <div class="alert alert-danger mb-0 small" role="alert">{$_(formError)}</div>
        {/if}
      </div>

      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn btn-primary col-6 m-0"
          disabled={saving}
          onclick={() => void save()}>
          {#if saving}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.save')}
        </button>
      </div>
    </div>
  </div>
</div>

<script module>
  /** The presets the cron row offers; everything else is typed into the field. */
  export const CRON_PRESETS = Object.freeze([
    { id: 'daily', cron: '0 4 * * *' },
    { id: 'six-hours', cron: '0 */6 * * *' },
    { id: 'weekly', cron: '0 5 * * 0' },
  ]);

  /** @returns {string} the zone the browser is in, which is what the admin means by "04:00". */
  export function browserTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  /**
   * @param {string} current
   * @returns {string[]} every zone the runtime knows, with `current` guaranteed to be in it.
   */
  export function listTimezones(current) {
    /** @type {string[]} */
    let zones = [];

    try {
      // Not in every engine yet, and the select still has to work without it.
      zones =
        typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    } catch {
      zones = [];
    }

    if (!zones.length) {
      zones = [...new Set(['UTC', browserTimezone()])];
    }

    return current && !zones.includes(current) ? [current, ...zones] : zones;
  }
</script>

<script>
  /**
   * SM-34 — create or edit one schedule of a server (§2.4.6).
   *
   * The parent owns the list and mounts this once: `open()` starts a new schedule, `open(row)`
   * edits an existing one. Saving posts the whole schedule (tasks included, in order) and the
   * parent re-reads the list — the hub also sends the `schedules` nudge, so a second admin's
   * table updates too.
   */
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { isEndpointUnavailable, showServerActionError } from '$lib/servers.util.js';

  import BackupOptions, {
    backupOptionsFromPayload,
    backupOptionsPayload,
    backupOptionsValid,
  } from '$lib/components/servers/BackupOptions.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';

  /**
   * `canBackup` is §2.4.17's `backups.create`: whoever can zip this server's directory — its
   * node, or a protocol-2 plugin from the inside — can also run a BACKUP task.
   *
   * @type {{ serverId: number|null, canBackup?: boolean, onsaved?: () => void }}
   */
  let { serverId, canBackup = false, onsaved } = $props();

  /** How long after the last keystroke the cron preview is asked for. */
  const PREVIEW_DEBOUNCE_MS = 400;

  let modalElement = $state();
  let customCronInput = $state();
  let editingId = $state(null);
  let name = $state('');
  let cron = $state(CRON_PRESETS[0].cron);
  let timezone = $state(browserTimezone());
  let enabled = $state(true);
  let warnMinutes = $state(5);
  /** @type {Array<{ uid: number, kind: string, action: string, command: string, backupName: string, keep: number, options: import('$lib/components/servers/BackupOptions.svelte').BackupOptionsValue, showOptions: boolean }>} */
  let tasks = $state([]);
  let saving = $state(false);
  let formError = $state('');
  /** @type {{ valid: boolean, description: string, next: Array<number|string> } | null} */
  let preview = $state(null);
  let previewLoading = $state(false);
  let previewError = $state('');
  /** Cleared when the preview endpoint answers 404 — the editor works without it. */
  let previewSupported = $state(true);

  let modal;
  let previewTimer;
  let previewSeq = 0;
  let taskUid = 0;

  const timezoneOptions = $derived(listTimezones(timezone));
  const activePreset = $derived(
    CRON_PRESETS.find((preset) => preset.cron === cron.trim())?.id || 'custom',
  );

  // The preview is the only cron validation the panel has, so it follows every edit of the
  // expression and of the zone it is read in.
  $effect(() => {
    const expression = cron.trim();
    const zone = timezone;

    if (!previewSupported || !expression) {
      preview = null;

      return;
    }

    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => void loadPreview(expression, zone), PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(previewTimer);
  });

  /**
   * Starts the editor. `schedule` null means a new one.
   *
   * @param {object | null} schedule
   */
  export function open(schedule = null) {
    formError = '';
    preview = null;
    saving = false;

    if (schedule) {
      editingId = schedule.id;
      name = schedule.name || '';
      cron = schedule.cron || CRON_PRESETS[0].cron;
      timezone = schedule.timezone || browserTimezone();
      enabled = schedule.enabled !== false;
      warnMinutes = Number(schedule.warnMinutes) || 0;
      tasks = (Array.isArray(schedule.tasks) ? schedule.tasks : []).map((task) => toEditable(task));
    } else {
      editingId = null;
      name = '';
      cron = CRON_PRESETS[0].cron;
      timezone = browserTimezone();
      enabled = true;
      warnMinutes = 5;
      tasks = [toEditable({ kind: canBackup ? 'BACKUP' : 'COMMAND' })];
    }

    modal?.show();
  }

  /**
   * The wire shape of a task is `{ kind, payload }`, where the payload differs per kind; the
   * form is flat, so it is unpacked here and packed again on save.
   *
   * @param {object} task
   */
  function toEditable(task) {
    const raw = task?.payload;
    /** @type {Record<string, unknown>} */
    let payload = {};

    if (typeof raw === 'string') {
      try {
        payload = JSON.parse(raw) || {};
      } catch {
        payload = {};
      }
    } else if (raw && typeof raw === 'object') {
      payload = raw;
    }

    const kind = String(task?.kind || 'COMMAND').toUpperCase();

    return {
      uid: ++taskUid,
      kind: kind === 'POWER' || kind === 'BACKUP' ? kind : 'COMMAND',
      action: String(payload.action ?? task?.action ?? 'RESTART').toUpperCase(),
      command: String(payload.command ?? task?.command ?? ''),
      backupName: String(payload.name ?? task?.name ?? ''),
      keep: Number(payload.keep ?? task?.keep ?? 0) || 0,
      options: backupOptionsFromPayload(payload),
      showOptions: false,
    };
  }

  /**
   * @param {{ kind: string, action: string, command: string, backupName: string, keep: number }} task
   */
  function toWire(task) {
    if (task.kind === 'POWER') {
      return { kind: 'POWER', payload: { action: task.action } };
    }

    if (task.kind === 'BACKUP') {
      /** @type {Record<string, unknown>} */
      const payload = {};

      if (task.backupName.trim()) {
        payload.name = task.backupName.trim();
      }

      if (Number(task.keep) > 0) {
        payload.keep = Number(task.keep);
      }

      return { kind: 'BACKUP', payload: { ...payload, ...backupOptionsPayload(task.options) } };
    }

    return { kind: 'COMMAND', payload: { command: task.command.trim() } };
  }

  /**
   * @param {string} kind
   */
  function addTask(kind) {
    tasks = [...tasks, toEditable({ kind })];
  }

  /**
   * @param {object} task
   * @param {Event} event
   */
  function onKindChange(task, event) {
    const select = /** @type {HTMLSelectElement} */ (event.currentTarget);

    task.kind = select.value;
  }

  /**
   * @param {number} index
   */
  function removeTask(index) {
    tasks = tasks.filter((_task, position) => position !== index);
  }

  /**
   * @param {number} index
   * @param {number} direction -1 for up, 1 for down.
   */
  function moveTask(index, direction) {
    const target = index + direction;

    if (target < 0 || target >= tasks.length) {
      return;
    }

    const next = [...tasks];

    [next[index], next[target]] = [next[target], next[index]];
    tasks = next;
  }

  /**
   * @param {string} expression
   * @param {string} zone
   */
  async function loadPreview(expression, zone) {
    const sequence = ++previewSeq;

    previewLoading = true;
    previewError = '';

    const params = new URLSearchParams({ cron: expression, timezone: zone });

    // The preview is permission-checked per server, so a user scoped to one server needs the id.
    if (serverId != null) {
      params.set('serverId', String(serverId));
    }

    const body = await ApiUtil.get({
      path: `/api/panel/cron/preview?${params.toString()}`,
      handler: (/** @type {object} */ response) => response,
    });

    if (sequence !== previewSeq) {
      return;
    }

    previewLoading = false;

    if (!body) {
      previewError = 'components.modals.schedule-editor.preview-failed';

      return;
    }

    if (isEndpointUnavailable(body)) {
      previewSupported = false;
      preview = null;

      return;
    }

    if (body.error) {
      previewError = 'components.modals.schedule-editor.preview-failed';

      return;
    }

    preview = {
      valid: body.valid !== false,
      description: body.description == null ? '' : String(body.description),
      next: Array.isArray(body.next) ? body.next : [],
    };
  }

  /**
   * @returns {string} the i18n key of the first problem, or an empty string.
   */
  function validate() {
    if (!name.trim()) {
      return 'components.modals.schedule-editor.error-name';
    }

    if (!cron.trim()) {
      return 'components.modals.schedule-editor.error-cron';
    }

    if (preview && !preview.valid) {
      return 'components.modals.schedule-editor.error-cron-invalid';
    }

    if (!tasks.length) {
      return 'components.modals.schedule-editor.error-tasks';
    }

    if (tasks.some((task) => task.kind === 'COMMAND' && !task.command.trim())) {
      return 'components.modals.schedule-editor.error-command';
    }

    if (tasks.some((task) => task.kind === 'BACKUP' && !backupOptionsValid(task.options))) {
      return 'components.modals.schedule-editor.error-backup-include';
    }

    return '';
  }

  async function save() {
    if (saving || serverId == null) {
      return;
    }

    formError = validate();

    if (formError) {
      return;
    }

    saving = true;

    const body = {
      name: name.trim(),
      cron: cron.trim(),
      timezone,
      enabled,
      warnMinutes: Math.max(0, Number(warnMinutes) || 0),
      tasks: tasks.map((task) => toWire(task)),
    };

    try {
      const path =
        editingId == null
          ? `/api/panel/servers/${serverId}/schedules`
          : `/api/panel/servers/${serverId}/schedules/${encodeURIComponent(editingId)}`;

      const response = await (editingId == null
        ? ApiUtil.post({ path, body, handler: (/** @type {object} */ answer) => answer })
        : ApiUtil.put({ path, body, handler: (/** @type {object} */ answer) => answer }));

      if (!response) {
        return;
      }

      if (isEndpointUnavailable(response)) {
        formError = 'pages.servers.errors.unavailable';

        return;
      }

      if (response.error) {
        formError = 'components.modals.schedule-editor.save-failed';
        // The 409 names the feature and why it is unavailable, which is the whole sentence.
        showServerActionError(response.error, response);

        return;
      }

      modal?.hide();
      void showSuccess(
        editingId == null ? 'pages.servers.schedules.created' : 'pages.servers.schedules.updated',
        { name: body.name },
      );
      onsaved?.();
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;
  });

  onDestroy(() => {
    previewSeq += 1;
    clearTimeout(previewTimer);
    modal?.hide();
    modal = null;
  });
</script>
