<!--
  Restoring replaces this Pano (database, files, config): maintenance mode, a safety backup first,
  then a restart. Asks for the account password, the passphrase when the archive needs one, and an
  explicit confirmation. `source`: `local` (a backup on this server), `remote` (a Pano Backup) or
  `file` (an uploaded .panoarc / export zip).
-->
<BsModal bind:this={modal} onhidden={reset}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void submit();
    }}>
    <div class="modal-body vstack gap-3">
      <div class="text-center">
        <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-danger pb-3"></i>
        <h5 class="mb-2">{$_('pages.settings.backups.restore.title')}</h5>
        {#if label}
          <div class="text-body-secondary small">{label}</div>
        {/if}
      </div>

      <ul class="small mb-0 text-body-secondary">
        <li>{$_('pages.settings.backups.restore.step-maintenance')}</li>
        <li>{$_('pages.settings.backups.restore.step-safety')}</li>
        <li>{$_('pages.settings.backups.restore.step-replace')}</li>
        <li>{$_('pages.settings.backups.restore.step-restart')}</li>
      </ul>

      {#if source === 'file'}
        <div>
          <label class="form-label small" for="pano-restore-file">
            {$_('pages.settings.backups.restore.file')}
          </label>
          <input
            id="pano-restore-file"
            class="form-control"
            type="file"
            accept=".panoarc,.zip"
            onchange={pickFile} />
          {#if file}
            <div class="form-text">
              {file.name} · {formatBytes(file.size)}
              {#if archive.type === 'encrypted'}
                · <i class="fa-solid fa-lock" aria-hidden="true"></i>
                {$_('pages.settings.backups.encrypted')}
              {:else if archive.type === 'plain'}
                · {$_('pages.settings.backups.plain')}
              {/if}
            </div>
            {#if archive.type === 'unknown'}
              <div class="form-text text-danger">
                {$_('pages.settings.backups.restore.not-an-archive')}
              </div>
            {:else if archive.keyMode === 'workload'}
              <div class="form-text text-danger">
                {$_('pages.settings.backups.restore.workload-key')}
              </div>
            {/if}
          {/if}
        </div>
      {/if}

      {#if askPassphrase}
        <div>
          <label class="form-label small" for="pano-restore-passphrase">
            {$_('pages.settings.backups.passphrase')}
          </label>
          <input
            id="pano-restore-passphrase"
            class="form-control"
            type="password"
            autocomplete="off"
            bind:value={passphrase}
            class:border-danger={error?.code === 'WRONG_PASSPHRASE' ||
              error?.code === 'PASSPHRASE_REQUIRED'} />
          {#if source === 'remote'}
            <div class="form-text">
              {$_('pages.settings.backups.restore.passphrase-saved-hint')}
            </div>
          {/if}
        </div>
      {/if}

      <div>
        <label class="form-label small" for="pano-restore-password">
          {$_('pages.settings.backups.current-password')}
        </label>
        <input
          id="pano-restore-password"
          class="form-control"
          type="password"
          autocomplete="current-password"
          bind:value={currentPassword}
          class:border-danger={error?.code === 'CURRENT_PASSWORD_NOT_CORRECT'} />
      </div>

      <div class="form-check">
        <input
          id="pano-restore-confirm"
          class="form-check-input"
          type="checkbox"
          bind:checked={confirmed} />
        <label class="form-check-label small" for="pano-restore-confirm">
          {$_('pages.settings.backups.restore.confirm')}
        </label>
      </div>

      {#if error}
        <div class="alert alert-danger small mb-0">{$_(error.key, { values: error.values })}</div>
      {/if}
    </div>
    <div class="modal-footer flex-nowrap">
      <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button type="submit" class="btn btn-danger col-6 m-0" disabled={!canSubmit}>
        {#if busy}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('pages.settings.backups.restore.submit')}
      </button>
    </div>
  </form>
</BsModal>

<script>
  import { _ } from 'svelte-i18n';

  import { formatBytes } from '$lib/string.util.js';
  import { inspectArchiveFile } from '$lib/pano-backup.util.js';

  import BsModal from './BsModal.svelte';

  /**
   * @typedef {{ currentPassword: string, passphrase: string, file: File | null }} RestoreInput
   * @type {{
   *   onsubmit: (input: RestoreInput) => Promise<ReturnType<typeof import('$lib/pano-backup.util.js').describeError>>,
   * }}
   */
  let { onsubmit } = $props();

  /** @type {BsModal | undefined} */
  let modal = $state();
  /** @type {'local' | 'remote' | 'file'} */
  let source = $state('local');
  let label = $state('');
  /** Whether the chosen archive is encrypted; null = unknown. */
  let encrypted = $state(/** @type {boolean | null} */ (null));
  /** @type {File | null} */
  let file = $state(null);
  let archive = $state({ type: 'unknown', keyMode: /** @type {string | null} */ (null) });
  let passphrase = $state('');
  let currentPassword = $state('');
  let confirmed = $state(false);
  let busy = $state(false);
  /** @type {ReturnType<typeof import('$lib/pano-backup.util.js').describeError>} */
  let error = $state(null);

  const askPassphrase = $derived(
    source === 'remote' ||
      (source === 'local' && encrypted !== false) ||
      (source === 'file' && archive.type === 'encrypted'),
  );

  const passphraseOk = $derived(!askPassphrase || source === 'remote' || passphrase.length > 0);

  const fileOk = $derived(
    source !== 'file' || (!!file && archive.type !== 'unknown' && archive.keyMode !== 'workload'),
  );

  const canSubmit = $derived(
    !busy && confirmed && currentPassword.length > 0 && passphraseOk && fileOk,
  );

  /**
   * @param {{ source: 'local' | 'remote' | 'file', label?: string, encrypted?: boolean | null }} options
   */
  export function open(options) {
    reset();
    source = options.source;
    label = options.label || '';
    encrypted = options.encrypted ?? null;
    modal?.show();
  }

  export function close() {
    modal?.hide();
  }

  function reset() {
    file = null;
    archive = { type: 'unknown', keyMode: null };
    passphrase = '';
    currentPassword = '';
    confirmed = false;
    error = null;
  }

  /** @param {Event} event */
  async function pickFile(event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);
    const picked = input.files?.[0] || null;

    file = picked;
    archive = { type: 'unknown', keyMode: null };
    error = null;

    if (picked) {
      archive = await inspectArchiveFile(picked).catch(() => ({ type: 'unknown', keyMode: null }));
    }
  }

  async function submit() {
    if (!canSubmit) {
      return;
    }

    busy = true;
    error = null;

    try {
      error = await onsubmit({
        currentPassword,
        passphrase: askPassphrase ? passphrase : '',
        file,
      });

      if (!error) {
        modal?.hide();
      }
    } finally {
      busy = false;
      currentPassword = '';
    }
  }
</script>
