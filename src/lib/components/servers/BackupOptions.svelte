<style>
  /* Bootstrap's floating label pins a field to a single row's height, so a pattern list has to be
     told that it may grow with its rows. */
  .form-floating > textarea.form-control {
    height: auto;
  }
</style>

<!-- What a backup takes and how it is kept: the same controls on the Backups page and in a
     schedule's backup step, so a scheduled backup can be anything a manual one can. -->
<div class="vstack gap-3">
  <div>
    <div class="list-group">
      {#each MODES as option (option.value)}
        <button
          type="button"
          class="list-group-item list-group-item-action text-start"
          class:active={value.mode === option.value}
          aria-pressed={value.mode === option.value}
          {disabled}
          onclick={() => set({ mode: option.value })}>
          <span class="fw-semibold d-block">
            {$_(`components.backup-options.mode-${option.key}`)}
          </span>
          <span class="small text-body-secondary">
            {$_(`components.backup-options.mode-${option.key}-hint`)}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <div>
    <div class="btn-group btn-group-sm w-100" role="group">
      {#each SCOPES as scope (scope)}
        <input
          type="radio"
          class="btn-check"
          id="{idPrefix}-scope-{scope}"
          name="{idPrefix}-scope"
          value={scope}
          checked={value.scope === scope}
          {disabled}
          onchange={() => set({ scope })} />
        <label class="btn btn-outline-primary" for="{idPrefix}-scope-{scope}">
          {$_(`components.backup-options.scope-${scope.toLowerCase()}`)}
        </label>
      {/each}
    </div>
    <div class="form-text">
      {$_(`components.backup-options.scope-${value.scope.toLowerCase()}-hint`)}
      {#if value.scope === 'WORLDS' && worlds}
        {#if worlds.length}
          <span class="d-block mt-1">
            {$_('components.backup-options.worlds-found')}
            {#each worlds as world (world)}
              <code class="me-1">{world}/</code>
            {/each}
          </span>
        {:else}
          <span class="d-block mt-1 text-warning"
            >{$_('components.backup-options.worlds-none')}</span>
        {/if}
      {/if}
    </div>
  </div>

  {#if value.scope === 'CUSTOM'}
    <div>
      <div class="form-floating">
        <textarea
          id="{idPrefix}-include"
          class="form-control font-monospace small"
          class:is-invalid={includeMissing}
          rows="3"
          placeholder=" "
          {disabled}
          bind:value={includeText}
          oninput={() => set({ include: lines(includeText) })}></textarea>
        <label for="{idPrefix}-include">{$_('components.backup-options.include-label')}</label>
      </div>
      <div class="form-text">
        {$_('components.backup-options.include-hint')}
        <span class="opacity-75">world/ · plugins/ · server.properties</span>
      </div>
    </div>
  {/if}

  <div>
    <div class="form-floating">
      <textarea
        id="{idPrefix}-exclude"
        class="form-control font-monospace small"
        rows="2"
        placeholder=" "
        {disabled}
        bind:value={excludeText}
        oninput={() => set({ exclude: lines(excludeText) })}></textarea>
      <label for="{idPrefix}-exclude">{$_('components.backup-options.exclude-label')}</label>
    </div>
    <div class="form-check mt-1">
      <input
        class="form-check-input"
        type="checkbox"
        id="{idPrefix}-exclude-defaults"
        checked={value.excludeDefaults}
        {disabled}
        onchange={(event) => set({ excludeDefaults: event.currentTarget.checked })} />
      <label class="form-check-label" for="{idPrefix}-exclude-defaults">
        {$_('components.backup-options.exclude-defaults')}
        <code>logs/</code>, <code>cache/</code>, <code>*.jar.tmp</code>
      </label>
    </div>
    <div class="form-text">
      {$_('components.backup-options.exclude-hint')}
      <span class="opacity-75">plugins/dynmap/ · *.log</span>
    </div>
  </div>
</div>

<script module>
  /**
   * @typedef {{
   *   mode: 'FULL' | 'SNAPSHOT',
   *   scope: 'ALL' | 'WORLDS' | 'CUSTOM',
   *   include: string[],
   *   exclude: string[],
   *   excludeDefaults: boolean,
   * }} BackupOptionsValue
   */

  /** @returns {BackupOptionsValue} */
  export function defaultBackupOptions() {
    return { mode: 'FULL', scope: 'ALL', include: [], exclude: [], excludeDefaults: true };
  }

  /**
   * The request fields for `POST /backups` or a schedule's backup payload, leaving out
   * everything that is already the default so an older backend sees the body it always did.
   *
   * @param {BackupOptionsValue} options
   * @returns {Record<string, unknown>}
   */
  export function backupOptionsPayload(options) {
    /** @type {Record<string, unknown>} */
    const payload = {};

    if (options.mode !== 'FULL') {
      payload.mode = options.mode;
    }

    if (options.scope !== 'ALL') {
      payload.scope = options.scope;
    }

    if (options.scope === 'CUSTOM' && options.include.length) {
      payload.include = options.include;
    }

    if (options.exclude.length) {
      payload.exclude = options.exclude;
    }

    if (!options.excludeDefaults) {
      payload.excludeDefaults = false;
    }

    return payload;
  }

  /**
   * The inverse of {@link backupOptionsPayload}, for a schedule step being edited.
   *
   * @param {Record<string, unknown> | null | undefined} payload
   * @returns {BackupOptionsValue}
   */
  export function backupOptionsFromPayload(payload) {
    const defaults = defaultBackupOptions();
    const list = (/** @type {unknown} */ value) =>
      Array.isArray(value) ? value.map((entry) => String(entry)).filter(Boolean) : [];

    return {
      mode: payload?.mode === 'SNAPSHOT' ? 'SNAPSHOT' : defaults.mode,
      scope:
        payload?.scope === 'WORLDS' || payload?.scope === 'CUSTOM'
          ? /** @type {'WORLDS' | 'CUSTOM'} */ (payload.scope)
          : defaults.scope,
      include: list(payload?.include),
      exclude: list(payload?.exclude),
      excludeDefaults: payload?.excludeDefaults !== false,
    };
  }

  /**
   * @param {BackupOptionsValue} options
   * @returns {boolean} whether the options can be sent as they are.
   */
  export function backupOptionsValid(options) {
    return options.scope !== 'CUSTOM' || options.include.length > 0;
  }
</script>

<script>
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  /**
   * @type {{
   *   value?: BackupOptionsValue,
   *   worlds?: string[] | null,
   *   disabled?: boolean,
   *   idPrefix?: string,
   * }}
   * @property worlds what the WORLDS scope would take on this server, when the page knows it.
   * @property idPrefix keeps the ids unique when the editor shows several backup steps.
   */
  let {
    value = $bindable(defaultBackupOptions()),
    worlds = null,
    disabled = false,
    idPrefix = 'backup',
  } = $props();

  const MODES = [
    { value: 'FULL', key: 'full' },
    { value: 'SNAPSHOT', key: 'snapshot' },
  ];
  const SCOPES = ['ALL', 'WORLDS', 'CUSTOM'];

  // What is typed, kept as typed: the lists drop blank lines, and feeding them straight back
  // would swallow the newline being typed.
  let includeText = $state(untrack(() => value.include.join('\n')));
  let excludeText = $state(untrack(() => value.exclude.join('\n')));

  // A value replaced from outside (a reset, another step loaded) rewrites the text; the lists
  // this component produced itself already match it and are left alone.
  $effect(() => {
    const include = value.include.join('\n');
    const exclude = value.exclude.join('\n');

    untrack(() => {
      if (lines(includeText).join('\n') !== include) {
        includeText = include;
      }

      if (lines(excludeText).join('\n') !== exclude) {
        excludeText = exclude;
      }
    });
  });

  const includeMissing = $derived(value.scope === 'CUSTOM' && !value.include.length);

  /**
   * @param {Partial<BackupOptionsValue>} patch
   */
  function set(patch) {
    value = { ...value, ...patch };
  }

  /**
   * One pattern per line; blank lines and surrounding spaces do not count.
   *
   * @param {string} text
   */
  function lines(text) {
    return String(text)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
</script>
