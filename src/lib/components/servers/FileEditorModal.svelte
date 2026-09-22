<style>
  .file-editor-host {
    height: min(62vh, 640px);
    overflow: hidden;
  }

  .file-editor-host :global(.cm-editor) {
    height: 100%;
  }

  .file-editor-host :global(.cm-editor.cm-focused) {
    outline: none;
  }
</style>

<!-- SM-31 — the in-browser editor. CodeMirror is loaded on first open, never before. -->
<div
  class="modal fade"
  tabindex="-1"
  aria-hidden="true"
  aria-labelledby="fileEditorTitle"
  bind:this={modalElement}>
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title text-break" id="fileEditorTitle">
          <i class="fa-solid fa-file-pen me-2" aria-hidden="true"></i>
          <span class="font-monospace">{path || ''}</span>
          {#if !loading && !loadError}
            <!-- What the file weighs now, following the edits; the size on disk beside it once
                 the two differ. -->
            <span class="badge text-bg-secondary fw-normal ms-2">
              {liveSize !== size && !binary
                ? $_('components.modals.file-editor.size-changed', {
                    values: { size: liveSizeText, delta: deltaText },
                  })
                : sizeText}
            </span>
          {/if}
          {#if dirty}
            <span class="badge text-bg-warning ms-2">
              {$_('components.modals.file-editor.unsaved')}
            </span>
          {/if}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
          onclick={requestClose}></button>
      </div>

      <div class="modal-body vstack gap-2">
        {#if loadError}
          <div class="alert alert-danger mb-0 d-flex align-items-center gap-2" role="alert">
            <span>{$_(loadError)}</span>
          </div>
        {/if}

        {#if binary}
          <div class="alert alert-warning mb-0 d-flex align-items-center gap-2" role="alert">
            <span>
              <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
              {$_('components.modals.file-editor.binary')}
            </span>
          </div>
        {:else if truncated}
          <div class="alert alert-warning mb-0 d-flex align-items-center gap-2" role="alert">
            <span>
              <i class="fa-solid fa-scissors me-1" aria-hidden="true"></i>
              {$_('components.modals.file-editor.truncated')}
            </span>
          </div>
        {/if}

        {#if loading}
          <div class="d-flex justify-content-center py-5">
            <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
          </div>
        {/if}

        <div
          class="file-editor-host border rounded"
          class:d-none={loading || binary || !!loadError}
          bind:this={editorHost}>
        </div>

        {#if !loading && !loadError && !binary}
          <div class="small text-body-secondary d-flex flex-wrap gap-3">
            <span>{$_('components.modals.file-editor.save-hint')}</span>
          </div>
        {/if}
      </div>

      <div class="modal-footer flex-nowrap">
        {#if confirmDiscard}
          <span class="me-auto small text-danger">
            {$_('components.modals.file-editor.discard-question')}
          </span>
          <button type="button" class="btn btn-link m-0" onclick={() => (confirmDiscard = false)}>
            {$_('components.modals.file-editor.keep-editing')}
          </button>
          <button type="button" class="btn btn-danger m-0" onclick={close}>
            {$_('components.modals.file-editor.discard')}
          </button>
        {:else}
          <button type="button" class="btn btn-link m-0" onclick={requestClose}>
            {$_('buttons.close')}
          </button>
          {#if cannotEdit && ondownload}
            <!-- What the editor cannot show in full can still be taken away whole. -->
            <button type="button" class="btn btn-primary m-0" onclick={() => ondownload(path)}>
              <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
              {$_('pages.servers.files.action-download')}
            </button>
          {:else}
            <button
              type="button"
              class="btn btn-primary m-0"
              disabled={!canSave}
              onclick={() => void save()}>
              {#if saving}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_('buttons.save')}
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<script>
  /**
   * Opens one file of a managed server in CodeMirror (§2.4.4 `files/content`).
   *
   * Read gives back `{ content, size, truncated, binary }`: a truncated read and a binary
   * file are both read-only — the panel would otherwise write back a mangled file. Content is
   * never rendered as HTML (§2.7); it only ever reaches a CodeMirror document.
   */
  import { onDestroy, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { createFileEditor, isPanelDark, onPanelThemeChange } from '$lib/codemirror.util.js';
  import { editorLanguageFor, isPathSafe } from '$lib/files.util.js';
  import { formatBytes } from '$lib/string.util.js';
  import { isEndpointUnavailable, showServerActionError } from '$lib/servers.util.js';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { serverId = null, onsaved = undefined, ondownload = undefined } = $props();

  let modalElement = $state();
  let editorHost = $state();
  let path = $state('');
  let loading = $state(false);
  let saving = $state(false);
  let dirty = $state(false);
  let binary = $state(false);
  let truncated = $state(false);
  let size = $state(0);
  /** Bytes of the document as it is in the editor, UTF-8, like the file it will be saved as. */
  let liveSize = $state(0);
  let loadError = $state('');
  let confirmDiscard = $state(false);

  let modal;
  /** The mounted CodeMirror instance, created on the first open. */
  let editor = null;
  /** Guards a read that comes back after the admin already opened another file. */
  let readSeq = 0;
  let savedContent = '';
  let currentContent = '';
  let stopThemeWatch;

  const sizeText = $derived(formatBytes(Number(size) || 0, 1));
  const liveSizeText = $derived(formatBytes(Number(liveSize) || 0, 1));
  /** How far the edits moved the size, signed, so a few bytes do not vanish into rounding. */
  const deltaText = $derived(
    `${liveSize >= size ? '+' : '−'}${formatBytes(Math.abs(liveSize - size), 1)}`,
  );
  const encoder = new TextEncoder();
  /** One measurement per frame at most: a held-down key would otherwise encode per keystroke. */
  let measureFrame = 0;

  function measure() {
    if (measureFrame) {
      return;
    }

    measureFrame = requestAnimationFrame(() => {
      measureFrame = 0;
      liveSize = encoder.encode(currentContent).length;
    });
  }
  /** Binary, cut short or unreadable: nothing here can be saved, so the footer offers the file. */
  const cannotEdit = $derived(!loading && (binary || truncated || !!loadError));
  const canSave = $derived(!loading && !saving && !binary && !truncated && dirty && !loadError);

  /**
   * Loads a file and shows the dialog. Safe to call while another file is open.
   *
   * @param {string} filePath the path relative to the server directory.
   */
  export function open(filePath) {
    if (!isPathSafe(filePath)) {
      void showError('pages.servers.errors.path-denied');

      return;
    }

    path = String(filePath);
    confirmDiscard = false;
    loadError = '';
    binary = false;
    truncated = false;
    dirty = false;
    size = 0;
    liveSize = 0;
    modal?.show();

    void read(path);
  }

  /** Closes the dialog, throwing away unsaved changes. */
  export function close() {
    confirmDiscard = false;
    modal?.hide();
  }

  function requestClose() {
    if (dirty && !confirmDiscard) {
      confirmDiscard = true;

      return;
    }

    close();
  }

  /**
   * @param {string} filePath
   */
  async function read(filePath) {
    const sequence = ++readSeq;

    loading = true;
    savedContent = '';
    currentContent = '';

    const body = await ApiUtil.get({
      path: `/api/panel/servers/${serverId}/files/content?path=${encodeURIComponent(filePath)}`,
      handler: (response) => response,
    });

    if (sequence !== readSeq) {
      return;
    }

    loading = false;

    if (!body) {
      // ApiUtil already raised the offline splash; a toast on top of it is noise.
      loadError = 'components.modals.file-editor.read-failed';

      return;
    }

    if (isEndpointUnavailable(body)) {
      loadError = 'pages.servers.errors.unavailable';

      return;
    }

    if (body.error) {
      loadError = 'components.modals.file-editor.read-failed';
      showServerActionError(body.error, body, { serverId, feature: 'files.source' });

      return;
    }

    binary = body.binary === true;
    truncated = body.truncated === true;
    size = Number(body.size) || 0;
    liveSize = size;
    savedContent = binary ? '' : String(body.content ?? '');
    currentContent = savedContent;
    dirty = false;

    if (binary) {
      return;
    }

    await tick();
    await mountEditor();
  }

  /** Creates the editor on first use, and otherwise re-uses the mounted one. */
  async function mountEditor() {
    if (!editorHost) {
      return;
    }

    const language = editorLanguageFor(path);
    const readOnly = truncated;

    if (editor) {
      editor.setDoc(savedContent);
      editor.setLanguage(language);
      editor.setReadOnly(readOnly);
      editor.focus();

      return;
    }

    try {
      editor = await createFileEditor({
        parent: editorHost,
        doc: savedContent,
        language,
        dark: isPanelDark(),
        readOnly,
        onChange: (value) => {
          currentContent = value;
          dirty = value !== savedContent;
          measure();
        },
        onSave: () => void save(),
      });

      stopThemeWatch = onPanelThemeChange((dark) => editor?.setDark(dark));
      editor.focus();
    } catch (error) {
      console.error('Failed to load the file editor', error);
      loadError = 'components.modals.file-editor.load-failed';
    }
  }

  async function save() {
    if (!canSave) {
      return;
    }

    saving = true;

    try {
      const body = await ApiUtil.put({
        path: `/api/panel/servers/${serverId}/files/content`,
        body: { path, content: currentContent },
        handler: (response) => response,
      });

      if (!body) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        void showError('pages.servers.errors.unavailable');

        return;
      }

      if (body.error) {
        showServerActionError(body.error, body, { serverId, feature: 'files.source' });

        return;
      }

      savedContent = currentContent;
      dirty = false;
      size = encoder.encode(savedContent).length;
      liveSize = size;
      void showSuccess('pages.servers.files.saved', { name: path });
      onsaved?.(path);
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

    const onHidden = () => {
      confirmDiscard = false;
    };

    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    return () => {
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
    };
  });

  onDestroy(() => {
    readSeq += 1;
    // onDestroy also runs during SSR, where there is no animation frame to cancel.
    if (measureFrame) {
      cancelAnimationFrame(measureFrame);
    }
    stopThemeWatch?.();
    editor?.destroy();
    editor = null;
    modal?.hide();
    modal = null;
  });
</script>
