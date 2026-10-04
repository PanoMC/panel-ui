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
    <div class="modal-body text-center vstack gap-3">
      <div>
        <div class="pb-3">
          <i class="fas fa-triangle-exclamation fa-3x d-block m-auto text-gray"></i>
        </div>
        <div>{$_('pages.settings.backups.restore.title')}</div>
        {#if label}
          <div>{label}</div>
        {/if}
      </div>

      <div class="alert alert-info d-flex gap-2 mb-0 text-start">
        <i class="fa-solid fa-circle-info mt-1" aria-hidden="true"></i>
        <ul class="mb-0 ps-3">
          <li>{$_('pages.settings.backups.restore.step-maintenance')}</li>
          <li>{$_('pages.settings.backups.restore.step-safety')}</li>
          <li>{$_('pages.settings.backups.restore.step-replace')}</li>
          <li>{$_('pages.settings.backups.restore.step-restart')}</li>
        </ul>
      </div>

      {#if source === 'file'}
        <div class="vstack gap-2 text-start">
          {#if file}
            <div class="d-flex align-items-center gap-3 border rounded p-3">
              <i
                class="fa-solid {archive.type === 'encrypted'
                  ? 'fa-file-shield'
                  : 'fa-file-zipper'} fa-2x"
                aria-hidden="true"></i>
              <div class="vstack min-w-0">
                <span class="text-truncate">{file.name}</span>
                <span>
                  {formatBytes(file.size)}
                  {#if archive.type === 'encrypted'}
                    · <i class="fa-solid fa-lock" aria-hidden="true"></i>
                    {$_('pages.settings.backups.encrypted')}
                  {:else if archive.type === 'plain'}
                    · {$_('pages.settings.backups.plain')}
                  {/if}
                </span>
              </div>
              <button
                type="button"
                class="btn btn-link btn-sm ms-auto"
                aria-label={$_('pages.settings.backups.restore.change-file')}
                title={$_('pages.settings.backups.restore.change-file')}
                disabled={busy}
                onclick={clearFile}>
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
          {:else}
            <DragAndDropZone
              id="pano-restore-file"
              accept={['.panoarc', '.zip']}
              style="min-height: 9rem; cursor: pointer;"
              icon="fa-solid fa-file-arrow-up fa-2x"
              title={$_('pages.settings.backups.restore.drop')}
              subtitle={$_('pages.settings.backups.restore.file')}
              on:drop={(event) => void pickFile(event.detail)}
              on:error={() => (fileRejected = true)} />
          {/if}
          {#if fileRejected || (file && archive.type === 'unknown' && !inspecting)}
            <div class="text-danger">
              {$_('pages.settings.backups.restore.not-an-archive')}
            </div>
          {:else if file && archive.keyMode === 'workload'}
            <div class="text-danger">
              {$_('pages.settings.backups.restore.workload-key', {
                values: { website: websiteDisplayHost() },
              })}
            </div>
          {/if}
        </div>
      {/if}

      {#if askPassphrase}
        <div class="text-start">
          <div class="form-floating">
            <input
              id="pano-restore-passphrase"
              class="form-control"
              type="password"
              placeholder=" "
              autocomplete="off"
              bind:this={passphraseInput}
              bind:value={passphrase}
              class:border-danger={error?.code === 'WRONG_PASSPHRASE' ||
                error?.code === 'PASSPHRASE_REQUIRED'} />
            <label class="text-capitalize" for="pano-restore-passphrase">
              {$_('pages.settings.backups.passphrase')}
            </label>
          </div>
          {#if source === 'remote'}
            <div class="mt-1">
              {$_('pages.settings.backups.restore.passphrase-saved-hint')}
            </div>
          {/if}
        </div>
      {/if}

      <div class="form-floating text-start">
        <input
          id="pano-restore-password"
          class="form-control"
          type="password"
          placeholder=" "
          autocomplete="current-password"
          bind:value={currentPassword}
          class:border-danger={error?.code === 'CURRENT_PASSWORD_NOT_CORRECT'} />
        <label class="text-capitalize" for="pano-restore-password">
          {$_('pages.settings.backups.current-password')}
        </label>
      </div>

      <div class="form-check text-start">
        <input
          id="pano-restore-confirm"
          class="form-check-input"
          type="checkbox"
          bind:checked={confirmed} />
        <label class="form-check-label" for="pano-restore-confirm">
          {$_('pages.settings.backups.restore.confirm')}
        </label>
      </div>

      {#if error}
        <div class="alert alert-danger mb-0">{$_(error.key, { values: error.values })}</div>
      {/if}
    </div>
    <div class="modal-footer flex-nowrap text-capitalize">
      <button
        type="button"
        class="btn btn-link text-decoration-none col-6 m-0"
        data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button type="submit" class="btn btn-danger text-capitalize col-6 m-0" disabled={!canSubmit}>
        {#if busy}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('pages.settings.backups.restore.submit')}
      </button>
    </div>
  </form>
</BsModal>

<script>
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { websiteDisplayHost } from '$lib/website-display.util.js';

  import { formatBytes } from '$lib/string.util.js';
  import { inspectArchiveFile } from '$lib/pano-backup.util.js';

  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
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
  /** The header of the picked file is still being read. */
  let inspecting = $state(false);
  /** The dropped file was not a .panoarc / .zip at all. */
  let fileRejected = $state(false);
  /** @type {HTMLInputElement | undefined} */
  let passphraseInput = $state();
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
    source !== 'file' ||
      (!!file && !inspecting && archive.type !== 'unknown' && archive.keyMode !== 'workload'),
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
    inspecting = false;
    fileRejected = false;
    passphrase = '';
    currentPassword = '';
    confirmed = false;
    error = null;
  }

  /**
   * Reads the start of the chosen archive: an encrypted one asks for its passphrase right away,
   * anything that is not a Pano backup is refused before it is uploaded.
   *
   * @param {File} picked
   */
  async function pickFile(picked) {
    file = picked;
    archive = { type: 'unknown', keyMode: null };
    fileRejected = false;
    error = null;
    inspecting = true;

    try {
      archive = await inspectArchiveFile(picked).catch(() => ({ type: 'unknown', keyMode: null }));
    } finally {
      inspecting = false;
    }

    if (archive.type === 'encrypted') {
      await tick();
      passphraseInput?.focus();
    }
  }

  function clearFile() {
    file = null;
    archive = { type: 'unknown', keyMode: null };
    fileRejected = false;
    passphrase = '';
    error = null;
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
