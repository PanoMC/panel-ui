<style>
  .cron-value {
    max-width: 16ch;
  }
</style>

<!-- SM-34 — the cron schedules of one server (§2.4.6). Whoever Pano picked runs them: the node,
     the plugin inside the game, or Pano's own runner (§2.4.17). A BACKUP task needs whoever can
     zip the server directory, which is not the same question. -->
<div class="container vstack gap-3">
  <ServerCapabilityNotice
    server={$server}
    feature="schedules.runner"
    section="components.server-navigation-menu.schedules" />

  <div class="card">
    <CardHeader>
      <span slot="left" class="d-flex align-items-center gap-2">
        {$_('pages.servers.schedules.title')}
        <span class="badge rounded-pill text-bg-secondary">
          {$_('pages.servers.schedules.count', { values: { count: schedules.length } })}
        </span>
      </span>

      <span slot="right">
        <button type="button" class="btn btn-sm btn-primary" onclick={() => editor?.open(null)}>
          <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
          {$_('pages.servers.schedules.create')}
        </button>
      </span>
    </CardHeader>

    <div class="card-body pb-0">
      <div class="small text-body-secondary">
        {$_(
          managed
            ? 'pages.servers.schedules.description-managed'
            : 'pages.servers.schedules.description-linked',
        )}
      </div>
    </div>

    {#if loading}
      <div class="card-body d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
      </div>
    {:else if listError}
      <div class="card-body text-center vstack gap-3 py-5">
        <div>
          <i class="fa-solid fa-clock fa-3x text-body-secondary" aria-hidden="true"></i>
        </div>
        <div class="text-body-secondary">{$_(listError)}</div>
        <div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            onclick={() => void loadSchedules()}>
            {$_('buttons.refresh')}
          </button>
        </div>
      </div>
    {:else if !schedules.length}
      <div class="card-body">
        <NoContent icon="fa-solid fa-clock fa-3x" text={$_('pages.servers.schedules.empty')} />
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" class="text-nowrap">{$_('pages.servers.schedules.column-name')}</th>
              <th scope="col" class="text-nowrap">{$_('pages.servers.schedules.column-cron')}</th>
              <th scope="col" class="text-nowrap">
                {$_('pages.servers.schedules.column-next-run')}
              </th>
              <th scope="col" class="text-nowrap">
                {$_('pages.servers.schedules.column-last-run')}
              </th>
              <th scope="col" class="text-end text-nowrap"
                >{$_('pages.servers.schedules.column-enabled')}</th>
              <th scope="col" class="text-end text-nowrap"
                >{$_('pages.servers.schedules.column-actions')}</th>
            </tr>
          </thead>
          <tbody>
            {#each schedules as schedule (schedule.id)}
              <tr>
                <th scope="row" class="fw-semibold text-break">
                  {schedule.name}
                  <span class="d-block fw-normal small text-body-secondary">
                    {taskSummary(schedule.tasks)}
                  </span>
                </th>
                <td>
                  <code class="cron-value d-inline-block text-truncate">{schedule.cron}</code>
                  <span class="d-block small text-body-secondary">
                    {describeCron(schedule.cron)}
                    {#if schedule.timezone}
                      <span class="opacity-75">&middot; {schedule.timezone}</span>
                    {/if}
                  </span>
                </td>
                <td class="small text-nowrap">
                  {#if schedule.enabled && schedule.nextRunAt}
                    <DateComponent time={schedule.nextRunAt} relativeFormat />
                  {:else}
                    <span class="text-body-secondary">—</span>
                  {/if}
                </td>
                <td class="small text-nowrap">
                  {#if schedule.lastRunAt}
                    <DateComponent time={schedule.lastRunAt} relativeFormat />
                    <span
                      class="badge rounded-pill ms-1 text-bg-{statusColour(schedule.lastStatus)}">
                      {statusLabel(schedule.lastStatus)}
                    </span>
                  {:else}
                    <span class="text-body-secondary">
                      {$_('pages.servers.schedules.never-run')}
                    </span>
                  {/if}
                </td>
                <td class="text-end">
                  <div class="form-check form-switch d-inline-block m-0">
                    {#if busyId === schedule.id}
                      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    {:else}
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="scheduleSwitch-{schedule.id}"
                        aria-label={schedule.name}
                        checked={schedule.enabled}
                        disabled={!!busyId}
                        onchange={(event) => void onToggle(schedule, event)} />
                    {/if}
                  </div>
                </td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn btn-link btn-sm"
                    disabled={!!busyId}
                    aria-label={$_('pages.servers.schedules.run-now')}
                    use:tooltip={[$_('pages.servers.schedules.run-now'), { placement: 'top' }]}
                    onclick={() => void runNow(schedule)}>
                    <i class="fa-solid fa-play" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-link btn-sm"
                    aria-label={$_('buttons.edit')}
                    use:tooltip={[$_('buttons.edit'), { placement: 'top' }]}
                    onclick={() => editor?.open(schedule)}>
                    <i class="fa-solid fa-pen" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-link btn-sm link-danger"
                    disabled={!!busyId}
                    aria-label={$_('buttons.delete')}
                    use:tooltip={[$_('buttons.delete'), { placement: 'top' }]}
                    onclick={() => askDelete(schedule)}>
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<ScheduleEditorModal
  bind:this={editor}
  {serverId}
  {canBackup}
  onsaved={() => void loadSchedules()} />

<script module>
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchServerSchedules } from '$lib/servers.util.js';

  /** The run statuses the panel has a label for; anything else is shown as the raw code. */
  const KNOWN_STATUSES = Object.freeze(['OK', 'SUCCESS', 'FAILED', 'RUNNING', 'SKIPPED']);

  /** Bootstrap contextual colour per run status. */
  const STATUS_COLOURS = Object.freeze({
    OK: 'success',
    SUCCESS: 'success',
    FAILED: 'danger',
    RUNNING: 'info',
    SKIPPED: 'secondary',
  });

  /**
   * Schedules exist for both kinds of server (a linked one is driven by Pano's own runner), so
   * this only gates on the permission.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { user } = await parent();

    if (!hasPermission(Permissions.MANAGE_SERVER_SCHEDULES, user)) {
      throw redirect(302, `${base}/servers/${params.id}`);
    }

    // The table comes with the page; a backend that cannot answer is a status it renders.
    return {
      serverId: Number(params.id),
      serverSchedules: await fetchServerSchedules(params.id, event),
    };
  }
</script>

<script>
  /**
   * SM-34 — list, run, toggle and delete the cron schedules of one server (§2.4.6).
   *
   * The table is re-read on the `schedules` nudge (so a second admin's change lands) and on
   * `scheduleRun` frames, which is how a run that just finished updates its last-run cell.
   */
  import { getContext, onDestroy, onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import { currentLanguage } from '$lib/language.util.js';
  import {
    hasFeature,
    isEndpointUnavailable,
    isManaged,
    showServerActionError,
    showServerLoadError,
  } from '$lib/servers.util.js';
  import { onScheduleRun, onServerSchedulesChanged } from '$lib/panelRealtime.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import ScheduleEditorModal from '$lib/components/servers/ScheduleEditorModal.svelte';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';

  let { data } = $props();

  const server = getContext('server');

  /** @type {Array<object>} */
  let schedules = $state([]);
  /** Only ever true for a *re*-read: the first table comes in with the page (`load`). */
  let loading = $state(false);
  let listError = $state('');
  /** The id of the schedule whose request is in flight, so only its own row spins. */
  let busyId = $state(null);
  let editor = $state();

  let hydratedId = null;
  let listSeq = 0;

  const serverId = $derived($server?.id ?? null);
  const managed = $derived(isManaged($server));
  /** §2.4.17 — a BACKUP task is offered wherever a backup can actually be taken. */
  const canBackup = $derived(hasFeature($server, 'backups.create'));

  // Called once here so the very first render — SSR included — already is the finished table,
  // and again from the effect below when the route moves to another server.
  untrack(() => hydrate(Number(data?.serverId ?? serverId)));

  $effect(() => {
    // Only these two say "this is another server now"; everything the hydrate itself touches is
    // deliberately left untracked.
    const id = Number(data?.serverId ?? serverId);

    untrack(() => hydrate(id));
  });

  /**
   * @param {unknown} status
   * @returns {string}
   */
  function statusLabel(status) {
    const code = String(status || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '');

    if (!code) {
      return '—';
    }

    return KNOWN_STATUSES.includes(code)
      ? $_(`pages.servers.schedules.status-${code.toLowerCase()}`)
      : code;
  }

  /**
   * @param {unknown} status
   * @returns {string}
   */
  function statusColour(status) {
    return STATUS_COLOURS[String(status || '').toUpperCase()] || 'secondary';
  }

  /**
   * A one-line "what does it do" for the name column: the tasks in the order they run.
   *
   * @param {Array<object>} tasks
   * @returns {string}
   */
  function taskSummary(tasks) {
    if (!tasks.length) {
      return $_('pages.servers.schedules.no-tasks');
    }

    return tasks
      .map((task) => {
        if (task.kind === 'POWER') {
          return $_(`pages.servers.schedules.power-action.${String(task.action).toLowerCase()}`);
        }

        if (task.kind === 'BACKUP') {
          return $_('pages.servers.schedules.task-kind.backup');
        }

        return `/${task.command}`;
      })
      .join(' → ');
  }

  /**
   * The common cron shapes in plain words. Anything else keeps the raw expression, which is
   * still shown next to it — the authoritative description comes from the preview endpoint in
   * the editor, and one request per row would be wasteful here.
   *
   * @param {string} cron
   * @returns {string}
   */
  function describeCron(cron) {
    const parts = String(cron || '')
      .trim()
      .split(/\s+/);

    if (parts.length !== 5) {
      return '';
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const everyHours = /^\*\/(\d+)$/.exec(hour);

    if (everyHours && minute === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return $_('pages.servers.schedules.cron-every-hours', {
        values: { hours: everyHours[1] },
      });
    }

    if (!/^\d+$/.test(minute) || !/^\d+$/.test(hour) || month !== '*') {
      return '';
    }

    const time = `${String(Number(hour)).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`;

    if (dayOfMonth === '*' && dayOfWeek === '*') {
      return $_('pages.servers.schedules.cron-daily', { values: { time } });
    }

    if (dayOfMonth === '*' && /^[0-7]$/.test(dayOfWeek)) {
      return $_('pages.servers.schedules.cron-weekly', {
        values: { day: weekdayName(Number(dayOfWeek)), time },
      });
    }

    if (dayOfWeek === '*' && /^\d+$/.test(dayOfMonth)) {
      return $_('pages.servers.schedules.cron-monthly', {
        values: { day: Number(dayOfMonth), time },
      });
    }

    return '';
  }

  /**
   * @param {number} day cron's day of week, where 0 and 7 are both Sunday.
   * @returns {string} the weekday in the panel's language, without a translation key per day.
   */
  function weekdayName(day) {
    // 2024-01-07 was a Sunday, so the offset lands on the right weekday for 0..7.
    const date = new Date(Date.UTC(2024, 0, 7 + (day % 7)));

    try {
      return new Intl.DateTimeFormat($currentLanguage?.code || undefined, {
        weekday: 'long',
        timeZone: 'UTC',
      }).format(date);
    } catch {
      return String(day);
    }
  }

  /**
   * Puts one {@link fetchServerSchedules} answer on screen.
   *
   * @param {Awaited<ReturnType<typeof fetchServerSchedules>>} result
   */
  function applySchedules(result) {
    if (result.status === 'unavailable') {
      listError = 'pages.servers.errors.unavailable';
      schedules = [];

      return;
    }

    // `network` means the request never completed — ApiUtil already raised the offline splash.
    if (result.status !== 'ok') {
      listError = 'pages.servers.schedules.list-failed';
      schedules = [];

      return;
    }

    listError = '';
    schedules = result.schedules;
  }

  /**
   * The table `load` fetched, applied once per server.
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

    const result = data?.serverSchedules;

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadSchedules();
      }

      return;
    }

    applySchedules(result);

    // The table itself says "this failed"; the toast is what names *why* — unless it is a
    // state, which the notice explains (§2.4.35).
    if (browser && result.status === 'error') {
      showServerLoadError(result.error, id);
    }
  }

  /** Re-reads the table after a change or a `schedules` nudge; the spinner is for these only. */
  async function loadSchedules() {
    const id = serverId;

    if (id == null) {
      return;
    }

    const sequence = ++listSeq;

    loading = true;
    listError = '';

    const result = await fetchServerSchedules(id);

    if (sequence !== listSeq) {
      return;
    }

    loading = false;
    applySchedules(result);

    if (result.status === 'error') {
      showServerLoadError(result.error, id);
    }
  }

  /**
   * Every mutation on one schedule is the same shape: a POST under its id.
   *
   * @param {object} schedule
   * @param {string} action `toggle`, `run` or `delete`.
   * @param {object} [body]
   * @returns {Promise<object | null>}
   */
  async function postOnSchedule(schedule, action, body = {}) {
    if (serverId == null || busyId) {
      return null;
    }

    busyId = schedule.id;

    try {
      const response = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/schedules/${encodeURIComponent(schedule.id)}/${action}`,
        body,
        handler: (/** @type {object} */ answer) => answer,
      });

      if (!response) {
        return null;
      }

      if (isEndpointUnavailable(response)) {
        void showError('pages.servers.errors.unavailable');

        return null;
      }

      if (response.error) {
        showServerActionError(response.error, response, {
          server: $server,
          feature: 'schedules.runner',
        });

        return null;
      }

      return response;
    } finally {
      busyId = null;
    }
  }

  /**
   * @param {object} schedule
   * @param {Event} event
   */
  async function onToggle(schedule, event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);
    const enabled = input.checked;

    const response = await postOnSchedule(schedule, 'toggle', { enabled });

    if (!response) {
      input.checked = schedule.enabled;

      return;
    }

    void showSuccess(
      enabled ? 'pages.servers.schedules.enabled-toast' : 'pages.servers.schedules.disabled-toast',
      { name: schedule.name },
    );
    await loadSchedules();
  }

  /**
   * @param {object} schedule
   */
  async function runNow(schedule) {
    const response = await postOnSchedule(schedule, 'run');

    if (!response) {
      return;
    }

    void showSuccess('pages.servers.schedules.run-started', { name: schedule.name });
  }

  /**
   * @param {object} schedule
   */
  function askDelete(schedule) {
    void showConfirmActionModal(
      'pages.servers.schedules.delete-confirm',
      { name: schedule.name },
      () => void remove(schedule),
    );
  }

  /**
   * @param {object} schedule
   */
  async function remove(schedule) {
    const response = await postOnSchedule(schedule, 'delete');

    if (!response) {
      return;
    }

    void showSuccess('pages.servers.schedules.deleted', { name: schedule.name });
    await loadSchedules();
  }

  onMount(() => {
    const offSchedules = onServerSchedulesChanged((frame) => {
      if (serverId == null || Number(frame.serverId) !== Number(serverId)) {
        return;
      }

      void loadSchedules();
    });

    const offRun = onScheduleRun((frame) => {
      if (serverId == null || Number(frame.serverId) !== Number(serverId)) {
        return;
      }

      const schedule = schedules.find((entry) => Number(entry.id) === Number(frame.scheduleId));
      const name = schedule?.name || '';

      if (frame.ok) {
        void showSuccess('pages.servers.schedules.run-finished', { name });
      } else {
        void showError('pages.servers.schedules.run-failed', { name, error: frame.error || '' });
      }

      void loadSchedules();
    });

    return () => {
      offSchedules();
      offRun();
    };
  });

  onDestroy(() => {
    listSeq += 1;
  });
</script>
