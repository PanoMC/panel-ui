<style>
  .path-bar {
    min-height: 2rem;
  }

  .file-table td,
  .file-table th {
    vertical-align: middle;
  }

  .file-name-button {
    background: none;
    border: 0;
    padding: 0;
    text-align: left;
  }

  .file-icon {
    width: 1.25rem;
    text-align: center;
  }

  .file-drop-zone {
    position: relative;
  }

  .file-drop-zone.dragging::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px dashed var(--bs-primary);
    border-radius: var(--bs-border-radius);
    background-color: rgba(var(--bs-primary-rgb), 0.08);
    pointer-events: none;
  }

  /* Says where the drop will land, pinned to the visible part of a long listing. */
  .drop-banner {
    position: sticky;
    top: 50%;
    z-index: 5;
    height: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .drop-banner > span {
    transform: translateY(-50%);
    box-shadow: var(--bs-box-shadow);
  }

  .file-table tr.drop-row > * {
    background-color: rgba(var(--bs-primary-rgb), 0.25) !important;
  }

  .file-search {
    max-width: 250px;
  }

  .upload-progress {
    height: 4px;
  }

  .sort-button {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
  }
</style>

<svelte:window onkeydown={onWindowKeydown} />

<!-- SM-31 — the file manager (§2.4.4, §2.4.17). Every path is relative to the server directory;
     the backend is the authority on what is allowed, the checks here only keep an obviously bad
     path from leaving the browser. -->
<div class="container vstack gap-3">
  <ServerCapabilityNotice
    server={$server}
    feature="files.source"
    section="components.server-navigation-menu.files" />

  <!-- §2.4.35 — while nothing can read the directory the notice above is the whole page: no
       toolbar that cannot act, no "could not be read" state with a Refresh that cannot help. -->
  {#if available}
    <div class="card">
      <div class="card-body vstack gap-3">
        <div class="path-bar d-flex flex-wrap align-items-center gap-2">
          {#if editingPath}
            <form class="input-group input-group-sm flex-grow-1" onsubmit={submitPathInput}>
              <span class="input-group-text">
                <i class="fa-solid fa-folder-tree" aria-hidden="true"></i>
              </span>
              <!-- svelte-ignore a11y_autofocus -->
              <input
                type="text"
                class="form-control font-monospace"
                autocomplete="off"
                spellcheck="false"
                autofocus
                aria-label={$_('pages.servers.files.path-label')}
                placeholder={$_('pages.servers.files.path-placeholder')}
                bind:value={pathInput} />
              <button class="btn btn-outline-secondary" type="submit">
                {$_('pages.servers.files.path-go')}
              </button>
              <button
                class="btn btn-outline-secondary"
                type="button"
                onclick={() => (editingPath = false)}>
                {$_('buttons.cancel')}
              </button>
            </form>
          {:else}
            <nav aria-label={$_('pages.servers.files.path-label')}>
              <ol class="breadcrumb mb-0 small">
                <li class="breadcrumb-item">
                  <button
                    type="button"
                    class="btn btn-link btn-sm p-0"
                    onclick={() => navigate('')}>
                    <i class="fa-solid fa-hard-drive me-1" aria-hidden="true"></i>
                    {$_('pages.servers.files.root')}
                  </button>
                </li>
                {#each segments as segment (segment.path)}
                  <li class="breadcrumb-item">
                    <button
                      type="button"
                      class="btn btn-link btn-sm p-0 text-break"
                      onclick={() => navigate(segment.path)}>
                      {segment.name}
                    </button>
                  </li>
                {/each}
              </ol>
            </nav>

            <button
              type="button"
              class="btn btn-sm btn-outline-secondary ms-auto"
              onclick={startEditingPath}
              use:tooltip={[$_('pages.servers.files.path-edit'), { placement: 'left' }]}
              aria-label={$_('pages.servers.files.path-edit')}>
              <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
            </button>
          {/if}
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn btn-outline-secondary"
              disabled={!canManage || busy}
              onclick={() => startPrompt('new-file')}>
              <i class="fa-solid fa-file-circle-plus me-1" aria-hidden="true"></i>
              {$_('pages.servers.files.new-file')}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              disabled={!canManage || busy}
              onclick={() => startPrompt('new-folder')}>
              <i class="fa-solid fa-folder-plus me-1" aria-hidden="true"></i>
              {$_('pages.servers.files.new-folder')}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              disabled={!canManage || busy}
              onclick={() => showUploadModal(path, (files) => void uploadFiles(files))}>
              <i class="fa-solid fa-upload me-1" aria-hidden="true"></i>
              {$_('pages.servers.files.upload')}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              disabled={loading}
              onclick={() => void refresh()}>
              <i class="fa-solid fa-rotate-right me-1" aria-hidden="true"></i>
              {$_('buttons.refresh')}
            </button>
          </div>

          {#if path}
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick={goUp}>
              <i class="fa-solid fa-arrow-turn-up me-1" aria-hidden="true"></i>
              {$_('pages.servers.files.go-up')}
            </button>
          {/if}

          <span class="file-search w-100 ms-auto">
            <SearchInput onchange={(value) => (query = value)} />
          </span>
        </div>
      </div>
    </div>

    {#if uploads.length}
      <div class="card">
        <CardHeader>
          <span slot="left">
            <i class="fa-solid fa-cloud-arrow-up me-2" aria-hidden="true"></i>
            {$_('pages.servers.files.uploads-title')}
          </span>
          <span slot="right">
            <button type="button" class="btn btn-sm btn-link" onclick={clearFinishedUploads}>
              {$_('pages.servers.files.uploads-clear')}
            </button>
          </span>
        </CardHeader>
        <ul class="list-group list-group-flush">
          {#each uploads as upload (upload.id)}
            <li class="list-group-item">
              <div class="d-flex align-items-center gap-2 small">
                <span class="text-break flex-grow-1 font-monospace">{upload.name}</span>
                {#if upload.status === 'done'}
                  <span class="badge text-bg-success">{$_('pages.servers.files.upload-done')}</span>
                {:else if upload.status === 'failed'}
                  <span class="badge text-bg-danger"
                    >{$_('pages.servers.files.upload-failed')}</span>
                {:else}
                  <span class="font-monospace">{upload.percent}%</span>
                {/if}
              </div>
              {#if upload.status === 'uploading'}
                <div
                  class="progress upload-progress mt-1"
                  role="progressbar"
                  aria-label={upload.name}
                  aria-valuenow={upload.percent}
                  aria-valuemin="0"
                  aria-valuemax="100">
                  <div class="progress-bar" style="width: {upload.percent}%;"></div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- The listing doubles as the drop target for uploads, so it carries a role of its own. -->
    <div
      class="card file-drop-zone"
      class:dragging
      role="region"
      aria-label={$_('pages.servers.files.drop-hint')}
      bind:this={dropZone}
      ondragenter={onDragOver}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}>
      {#if dragging}
        <div class="drop-banner">
          <span class="badge text-bg-primary fs-6 fw-normal px-3 py-2">
            <i class="fa-solid fa-cloud-arrow-up me-2" aria-hidden="true"></i>
            {$_('pages.servers.files.drop-into', { values: { path: '/' + dropTargetPath } })}
          </span>
        </div>
      {/if}
      <CardHeader>
        <span slot="left" class="d-flex align-items-center gap-2">
          {$_('pages.servers.files.title')}
          <span class="badge rounded-pill text-bg-secondary">
            {$_('pages.servers.files.count', { values: { count: visibleEntries.length } })}
          </span>
        </span>

        <span slot="right" class="d-flex flex-wrap align-items-center gap-2">
          {#if selectedNames.length}
            <span class="small text-body-secondary">
              {$_('pages.servers.files.selected', { values: { count: selectedNames.length } })}
            </span>
            <!-- One file downloads as itself; anything more, or a folder, arrives as one zip that is
               built while it downloads — nothing is left behind on the server. -->
            <span
              class="d-inline-block"
              use:tooltip={[
                selectionIsZip ? $_('pages.servers.files.download-zip-hint') : '',
                { placement: 'bottom' },
              ]}>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                disabled={busy}
                onclick={() => downloadNames(selectedNames)}>
                <i
                  class="fa-solid {selectionIsZip ? 'fa-file-zipper' : 'fa-download'} me-1"
                  aria-hidden="true"></i>
                {selectionIsZip
                  ? $_('pages.servers.files.download-as-zip')
                  : $_('pages.servers.files.action-download')}
              </button>
            </span>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              disabled={!canManage || busy}
              onclick={() => askDelete(selectedNames)}>
              <i class="fa-solid fa-trash me-1" aria-hidden="true"></i>
              {$_('buttons.delete')}
            </button>
          {/if}
        </span>
      </CardHeader>

      {#if loading}
        <div class="card-body d-flex justify-content-center py-5">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else if listError}
        <div class="card-body text-center vstack gap-3 py-5">
          <div>
            <i class="fa-solid fa-folder-open fa-3x text-body-secondary" aria-hidden="true"></i>
          </div>
          <div class="text-body-secondary">{$_(listError)}</div>
          <div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              onclick={() => void refresh()}>
              {$_('buttons.refresh')}
            </button>
          </div>
        </div>
      {:else if !visibleEntries.length}
        <div class="card-body">
          <NoContent
            icon="fa-solid fa-folder-open fa-3x"
            text={query.trim()
              ? $_('pages.servers.files.no-matches')
              : $_('pages.servers.files.empty-directory')}>
            <div class="text-center small text-body-secondary pb-3">
              {$_('pages.servers.files.drop-hint')}
            </div>
          </NoContent>
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table table-hover file-table mb-0">
            <thead>
              <tr>
                <th scope="col" style="width: 2.5rem;">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    checked={allSelected}
                    indeterminate={selectedNames.length > 0 && !allSelected}
                    aria-label={$_('pages.servers.files.select-all')}
                    onchange={toggleSelectAll} />
                </th>
                <th scope="col">
                  <button
                    type="button"
                    class="sort-button"
                    onclick={() => sortBy(FileSortKeys.NAME)}>
                    {$_('pages.servers.files.column-name')}
                    <i class="{sortIcon(FileSortKeys.NAME)} ms-1 small" aria-hidden="true"></i>
                  </button>
                </th>
                <th scope="col" class="text-nowrap">
                  <button
                    type="button"
                    class="sort-button"
                    onclick={() => sortBy(FileSortKeys.SIZE)}>
                    {$_('pages.servers.files.column-size')}
                    <i class="{sortIcon(FileSortKeys.SIZE)} ms-1 small" aria-hidden="true"></i>
                  </button>
                </th>
                <th scope="col" class="text-nowrap">
                  <button
                    type="button"
                    class="sort-button"
                    onclick={() => sortBy(FileSortKeys.MODIFIED)}>
                    {$_('pages.servers.files.column-modified')}
                    <i class="{sortIcon(FileSortKeys.MODIFIED)} ms-1 small" aria-hidden="true"></i>
                  </button>
                </th>
                <th scope="col" class="text-end">{$_('pages.servers.files.column-actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#if path}
                <tr>
                  <td></td>
                  <td colspan="4">
                    <button type="button" class="file-name-button" onclick={goUp}>
                      <i class="fa-solid fa-turn-up file-icon me-2" aria-hidden="true"></i>
                      <span class="font-monospace">..</span>
                    </button>
                  </td>
                </tr>
              {/if}

              {#each visibleEntries as entry (entry.name)}
                <tr
                  class:table-active={selectedNames.includes(entry.name)}
                  class:drop-row={dragging && dropFolder === entry.name}
                  data-drop-folder={isDirectory(entry) ? entry.name : undefined}>
                  <td>
                    <input
                      class="form-check-input"
                      type="checkbox"
                      checked={selectedNames.includes(entry.name)}
                      aria-label={entry.name}
                      onchange={() => toggleSelect(entry.name)} />
                  </td>
                  <th scope="row" class="fw-normal">
                    <button
                      type="button"
                      class="file-name-button text-break"
                      onclick={() => openEntry(entry)}>
                      <i class="{fileIconClass(entry)} file-icon me-2" aria-hidden="true"></i>
                      <span class:fw-semibold={isDirectory(entry)}>{entry.name}</span>
                    </button>
                  </th>
                  <td class="text-nowrap font-monospace small">{formatEntrySize(entry)}</td>
                  <td class="text-nowrap small text-body-secondary">
                    {#if entry.modified}
                      <DateComponent time={entry.modified} relativeFormat />
                    {:else}
                      —
                    {/if}
                  </td>
                  <td class="text-end">
                    <span class="dropdown position-static">
                      <button
                        type="button"
                        class="btn btn-link btn-sm"
                        aria-expanded="false"
                        aria-haspopup="true"
                        data-bs-toggle="dropdown"
                        disabled={busy}
                        aria-label={$_('pages.servers.files.column-actions')}>
                        <span class="fas fa-ellipsis-v"></span>
                      </button>
                      <div class="dropdown-menu dropdown-menu-end">
                        <button
                          type="button"
                          class="dropdown-item"
                          onclick={() => openEntry(entry)}>
                          <i
                            class="fa-solid {isDirectory(entry)
                              ? 'fa-folder-open'
                              : previewKind(entry)
                                ? 'fa-eye'
                                : 'fa-pen'} me-2"
                            aria-hidden="true"></i>
                          {isDirectory(entry)
                            ? $_('pages.servers.files.action-open')
                            : previewKind(entry)
                              ? $_('pages.servers.files.action-preview')
                              : $_('pages.servers.files.action-edit')}
                        </button>

                        <button
                          type="button"
                          class="dropdown-item"
                          onclick={() => downloadNames([entry.name])}>
                          <i
                            class="fa-solid {isDirectory(entry)
                              ? 'fa-file-zipper'
                              : 'fa-download'} me-2"
                            aria-hidden="true"></i>
                          {isDirectory(entry)
                            ? $_('pages.servers.files.download-as-zip')
                            : $_('pages.servers.files.action-download')}
                        </button>

                        {#if canManage}
                          {#if isArchive(entry)}
                            <button
                              type="button"
                              class="dropdown-item"
                              onclick={() => startPrompt('unarchive', entry)}>
                              <i class="fa-solid fa-box-open me-2" aria-hidden="true"></i>
                              {$_('pages.servers.files.action-unarchive')}
                            </button>
                          {/if}

                          <button
                            type="button"
                            class="dropdown-item"
                            onclick={() => startPrompt('rename', entry)}>
                            <i class="fa-solid fa-i-cursor me-2" aria-hidden="true"></i>
                            {$_('pages.servers.files.action-rename')}
                          </button>

                          {#if entry.mode}
                            <button
                              type="button"
                              class="dropdown-item"
                              onclick={() => startPrompt('chmod', entry)}>
                              <i class="fa-solid fa-user-lock me-2" aria-hidden="true"></i>
                              {$_('pages.servers.files.action-chmod')}
                            </button>
                          {/if}

                          <div class="dropdown-divider"></div>
                          <button
                            type="button"
                            class="dropdown-item text-danger"
                            onclick={() => askDelete([entry.name])}>
                            <i class="fa-solid fa-trash me-2" aria-hidden="true"></i>
                            {$_('buttons.delete')}
                          </button>
                        {/if}
                      </div>
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="card-footer small text-body-secondary">
          <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
          {$_('pages.servers.files.drop-hint')}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- One dialog for every "type a name" action: new file, new folder, rename, archive,
     extract, chmod. They differ only in their label and what the value is checked against. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={promptModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body">
        <h5 class="mb-3">{promptTitle ? $_(promptTitle) : ''}</h5>
        <label class="form-label" for="filePromptInput">
          {promptLabel ? $_(promptLabel) : ''}
        </label>
        <input
          id="filePromptInput"
          type="text"
          class="form-control font-monospace"
          autocomplete="off"
          spellcheck="false"
          bind:value={promptValue}
          onkeydown={onPromptKeydown} />
        {#if promptHint}
          <div class="form-text">{$_(promptHint)}</div>
        {/if}
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn btn-primary col-6 m-0"
          disabled={!promptValid || busy}
          onclick={() => void confirmPrompt()}>
          {#if busy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('pages.servers.files.prompt-confirm')}
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={deleteModalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-danger"></i>
        </div>
        <h5 class="mb-2">{$_('pages.servers.files.delete-title')}</h5>
        <div class="text-body-secondary">
          {$_('pages.servers.files.delete-description', {
            values: { count: deleteTargets.length },
          })}
        </div>
        <div class="small font-monospace text-break mt-2">{deleteTargets.join(', ')}</div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
          {$_('buttons.cancel')}
        </button>
        <button
          type="button"
          class="btn btn-danger col-6 m-0"
          disabled={busy}
          onclick={() => void confirmDelete()}>
          {#if busy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.delete')}
        </button>
      </div>
    </div>
  </div>
</div>

<FileEditorModal
  bind:this={editorModal}
  {serverId}
  onsaved={() => void refresh()}
  ondownload={(filePath) => download([filePath], { base: parentPath(filePath) })} />
<FilePreviewModal
  bind:this={previewModal}
  {serverId}
  ondownload={(filePath) => download([filePath], { base: parentPath(filePath) })} />
<ServerFileUploadModal />

<!-- Downloads are a plain navigation to the streaming endpoint (§2.4.4), so the browser's own
     download UI handles a multi-gigabyte world folder instead of the page buffering it. -->
<a class="d-none" bind:this={downloadAnchor} href={base} tabindex="-1" aria-hidden="true">
  {$_('pages.servers.files.action-download')}
</a>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { fetchServerFiles } from '$lib/files.util.js';
  import { featureSource, hasFeature } from '$lib/servers.util.js';

  /**
   * Files need somebody on the other end that can read the directory — the node, or a
   * protocol-2 plugin from the inside (§2.4.17). A server that can never have either sends a
   * hand-typed URL back to the overview, the same way the sidebar hides the section; one whose
   * source is merely away right now still opens, with the notice that says so.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params, url } = event;
    const { server, user } = await parent();

    const listed =
      hasFeature(server, 'files.source') || featureSource(server, 'files.source') === null;

    if (!listed || !hasPermission(Permissions.MANAGE_SERVER_FILES, user)) {
      throw redirect(302, `${base}/servers/${params.id}`);
    }

    // The directory in the URL is read here, so the page opens on its listing. Walking around
    // inside the manager from there is client-side and never comes back through `load`.
    return {
      serverId: Number(params.id),
      serverFiles: await fetchServerFiles(params.id, url.searchParams.get('path') || '', event),
    };
  }
</script>

<script>
  /**
   * SM-31 — the file manager (§2.4.4).
   *
   * Every listing is one `GET …/files?path=`; mutations are the small POST endpoints; reads
   * and writes go through the editor dialog. Uploads and downloads use the streaming
   * endpoints, which the backend relays to the node over transfer tickets.
   */
  import { getContext, onDestroy, onMount, tick, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/stores';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import {
    defaultExtractName,
    fileDownloadUrl,
    FileSortKeys,
    fileIconClass,
    formatEntrySize,
    isArchive,
    isDirectory,
    isModeValid,
    isNameSafe,
    isPathSafe,
    joinPath,
    normalizePath,
    parentPath,
    pathSegments,
    previewKind,
    sortFileEntries,
  } from '$lib/files.util.js';
  // `hasFeature` is already imported by the module script above, whose scope this shares.
  import {
    isEndpointUnavailable,
    showServerActionError,
    showServerLoadError,
  } from '$lib/servers.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import FileEditorModal from '$lib/components/servers/FileEditorModal.svelte';
  import FilePreviewModal from '$lib/components/servers/FilePreviewModal.svelte';
  import ServerFileUploadModal, {
    show as showUploadModal,
  } from '$lib/components/servers/ServerFileUploadModal.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { data } = $props();

  const server = getContext('server');

  /** What each prompt mode asks for; `validate` decides whether Confirm lights up. */
  const PROMPT_MODES = Object.freeze({
    'new-file': {
      title: 'pages.servers.files.new-file',
      label: 'pages.servers.files.prompt-name',
      hint: 'pages.servers.files.new-file-hint',
      validate: isNameSafe,
    },
    'new-folder': {
      title: 'pages.servers.files.new-folder',
      label: 'pages.servers.files.prompt-name',
      hint: '',
      validate: isNameSafe,
    },
    rename: {
      title: 'pages.servers.files.action-rename',
      label: 'pages.servers.files.prompt-new-name',
      hint: '',
      validate: isNameSafe,
    },
    unarchive: {
      title: 'pages.servers.files.action-unarchive',
      label: 'pages.servers.files.prompt-extract-into',
      hint: 'pages.servers.files.unarchive-hint',
      validate: isNameSafe,
    },
    chmod: {
      title: 'pages.servers.files.action-chmod',
      label: 'pages.servers.files.prompt-mode',
      hint: 'pages.servers.files.chmod-hint',
      validate: isModeValid,
    },
  });

  /** Whether anything can read the server directory right now — the page's own feature. */
  const available = $derived(hasFeature($server, 'files.source'));
  /** Writing needs the permission *and* a source that can do it right now (§2.4.17). */
  const canManage = $derived(hasPermission(Permissions.MANAGE_SERVER_FILES) && available);

  // Seeded from the URL and immediately confirmed by the hydrate below, which is what `load`
  // actually read.
  let path = $state(normalizePath($page.url.searchParams.get('path') || ''));
  /** @type {import('$lib/files.util.js').FileEntry[]} */
  let entries = $state([]);
  /** Only ever true for a *re*-read: the first listing comes in with the page (`load`). */
  let loading = $state(false);
  /** i18n key of the "this listing failed" state, or `''`. */
  let listError = $state('');
  let query = $state('');
  let sortKey = $state(FileSortKeys.NAME);
  let sortDirection = $state('asc');
  /** Names selected in the current directory; cleared on every navigation. */
  let selectedNames = $state([]);
  let busy = $state(false);
  let dragging = $state(false);
  let editingPath = $state(false);
  let pathInput = $state('');
  /** @type {Array<{ id: number, name: string, percent: number, status: string }>} */
  let uploads = $state([]);
  let previewModal = $state();
  let dropZone = $state();
  /** The folder row under the pointer while dragging, `''` for the folder on screen. */
  let dropFolder = $state('');
  let promptMode = $state('');
  let promptValue = $state('');
  /** The row a rename / extract / chmod was started from. */
  let promptEntry = $state(null);
  let deleteTargets = $state([]);

  let promptModalElement = $state();
  let deleteModalElement = $state();
  let downloadAnchor = $state();
  let editorModal = $state();

  let promptModal;
  let deleteModal;
  /** Guards a listing that comes back after the admin navigated somewhere else. */
  let listSeq = 0;
  let uploadSeq = 0;
  /** `<server id>:<directory>` of the listing on screen, so `load` never repeats itself. */
  let hydratedKey = null;

  const serverId = $derived($server?.id ?? null);
  const segments = $derived(pathSegments(path));
  const promptTitle = $derived(PROMPT_MODES[promptMode]?.title || '');
  const promptLabel = $derived(PROMPT_MODES[promptMode]?.label || '');
  const promptHint = $derived(PROMPT_MODES[promptMode]?.hint || '');
  const promptValid = $derived(!!PROMPT_MODES[promptMode]?.validate(promptValue));

  const visibleEntries = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? entries.filter((entry) => entry.name.toLowerCase().includes(needle))
      : entries;

    return sortFileEntries(filtered, sortKey, sortDirection);
  });

  const dropTargetPath = $derived(dropFolder ? joinPath(path, dropFolder) : path);
  /** Whether the selection downloads as one zip: more than one entry, or a folder. */
  const selectionIsZip = $derived(
    selectedNames.length > 1 ||
      entries.some((entry) => selectedNames.includes(entry.name) && isDirectory(entry)),
  );
  const allSelected = $derived(
    visibleEntries.length > 0 &&
      visibleEntries.every((entry) => selectedNames.includes(entry.name)),
  );

  // Called once here so the very first render — SSR included — already is the listing, and
  // again from the effect below when `load` re-runs (another server, or a `?path=` that was
  // opened from outside the manager).
  untrack(() => hydrate(Number(data?.serverId ?? serverId)));

  $effect(() => {
    // Only these two say "this is another listing now"; everything the hydrate itself touches
    // is deliberately left untracked.
    const id = Number(data?.serverId ?? serverId);

    untrack(() => hydrate(id));
  });

  /** `null` until the effect below has seen the first answer, so opening the page never re-reads. */
  let wasAvailable = null;

  // The listing read while nothing could serve it was refused; once something can again (the
  // node reconnected, the plugin is back), the directory is read afresh instead.
  $effect(() => {
    const now = available;

    untrack(() => {
      if (now && wasAvailable === false) {
        void refresh();
      }

      wasAvailable = now;
    });
  });

  /**
   * @param {string} key
   * @returns {string} the Font Awesome classes of the header's sort marker.
   */
  function sortIcon(key) {
    if (sortKey !== key) {
      return 'fa-solid fa-sort opacity-25';
    }

    return sortDirection === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
  }

  /**
   * @param {string} key
   */
  function sortBy(key) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

      return;
    }

    sortKey = key;
    sortDirection = 'asc';
  }

  /**
   * Puts one {@link fetchServerFiles} answer on screen.
   *
   * @param {Awaited<ReturnType<typeof fetchServerFiles>>} result
   */
  function applyEntries(result) {
    entries = result.entries;

    if (result.status === 'ok') {
      listError = '';

      return;
    }

    // A path the panel refuses to send, and a build without the endpoint, both name themselves;
    // `network` means the request never completed and ApiUtil already raised the splash.
    if (result.status === 'denied') {
      listError = 'pages.servers.errors.path-denied';
    } else if (result.status === 'unavailable') {
      listError = 'pages.servers.errors.unavailable';
    } else {
      listError = 'pages.servers.files.list-failed';
    }
  }

  /**
   * The listing `load` fetched, applied once per server and directory.
   *
   * @param {number} id the server the current `data` belongs to.
   */
  function hydrate(id) {
    const result = data?.serverFiles;
    const target = result ? result.path : path;
    const key = `${id}:${target}`;

    if (!Number.isFinite(id) || hydratedKey === key) {
      return;
    }

    hydratedKey = key;
    // Whatever re-read is still in flight belongs to the directory we just left.
    listSeq += 1;
    loading = false;
    selectedNames = [];

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadEntries(target);
      }

      return;
    }

    path = target;
    applyEntries(result);

    // The empty table says the listing failed; the toast is what names why. A state (node
    // offline, feature unavailable...) is the notice's to explain, so it only refreshes the row.
    if (browser && result.status === 'error') {
      showServerLoadError(result.error, id);
    }
  }

  /**
   * Reads one directory — every navigation inside the manager, and every refresh after a
   * change. The path is sent as typed (the backend canonicalizes and enforces the denylist),
   * but an obviously unsafe one never leaves the browser.
   *
   * @param {string} target
   */
  async function loadEntries(target) {
    if (serverId == null) {
      return;
    }

    const sequence = ++listSeq;

    loading = true;
    listError = '';

    const result = await fetchServerFiles(serverId, target);

    if (sequence !== listSeq) {
      return;
    }

    loading = false;
    hydratedKey = `${Number(serverId)}:${result.path}`;
    applyEntries(result);

    if (result.status === 'error') {
      showServerLoadError(result.error, serverId);
    }
  }

  function refresh() {
    return loadEntries(path);
  }

  /**
   * @param {string} next
   */
  function navigate(next) {
    const target = normalizePath(next);

    if (!isPathSafe(target)) {
      void showError('pages.servers.errors.path-denied');

      return;
    }

    path = target;
    selectedNames = [];
    editingPath = false;
    syncUrl(target);

    void loadEntries(target);
  }

  function goUp() {
    if (!path) {
      return;
    }

    navigate(parentPath(path));
  }

  /**
   * Keeps `?path=` in the address bar in step with the directory, so the view is shareable and
   * survives a reload. It is page state, not a route, so `load` is not re-run.
   *
   * @param {string} target
   */
  function syncUrl(target) {
    if (!browser) {
      return;
    }

    try {
      const url = new URL(window.location.href);

      if (target) {
        url.searchParams.set('path', target);
      } else {
        url.searchParams.delete('path');
      }

      replaceState(url, {});
    } catch {
      // The router is not ready yet (or this is an external navigation) — the directory is
      // component state either way, so there is nothing to recover.
    }
  }

  /**
   * @param {import('$lib/files.util.js').FileEntry} entry
   */
  function openEntry(entry) {
    if (isDirectory(entry)) {
      navigate(joinPath(path, entry.name));

      return;
    }

    // Images, videos and sounds are shown; everything else opens in the editor, which still
    // explains itself for a binary it cannot edit.
    if (previewKind(entry)) {
      previewModal?.open(joinPath(path, entry.name), entry.size);

      return;
    }

    editorModal?.open(joinPath(path, entry.name));
  }

  function startEditingPath() {
    pathInput = path;
    editingPath = true;
  }

  /**
   * @param {SubmitEvent} event
   */
  function submitPathInput(event) {
    event.preventDefault();
    navigate(pathInput);
  }

  /**
   * @param {string} name
   */
  function toggleSelect(name) {
    selectedNames = selectedNames.includes(name)
      ? selectedNames.filter((entry) => entry !== name)
      : [...selectedNames, name];
  }

  function toggleSelectAll() {
    selectedNames = allSelected ? [] : visibleEntries.map((entry) => entry.name);
  }

  /**
   * Hands a download to the browser's own download manager through the hidden anchor, so a
   * multi-gigabyte world never passes through the page.
   *
   * @param {string[]} paths server-relative paths.
   * @param {{ base?: string, archive?: boolean }} [options]
   */
  function download(paths, options = {}) {
    if (!downloadAnchor || serverId == null || !paths.length || !paths.every(isPathSafe)) {
      return;
    }

    downloadAnchor.href = fileDownloadUrl(serverId, paths, options);
    // The name comes from Pano's Content-Disposition, which knows whether this is a zip.
    downloadAnchor.download = '';
    downloadAnchor.click();
  }

  /**
   * Downloads entries of the current folder: one file as itself, a folder or several entries as
   * a single zip named after them (§2.4.4).
   *
   * @param {string[]} names
   */
  function downloadNames(names) {
    const picked = entries.filter((entry) => names.includes(entry.name));

    if (!picked.length) {
      return;
    }

    download(
      picked.map((entry) => joinPath(path, entry.name)),
      { base: path, archive: picked.length > 1 || picked.some(isDirectory) },
    );
  }

  /**
   * Runs one of the small mutation endpoints and refreshes the listing when it worked.
   *
   * @param {string} endpoint the path after `files/`.
   * @param {object} body
   * @param {string} successKey
   * @param {Record<string, unknown>} [values]
   * @returns {Promise<boolean>}
   */
  async function mutate(endpoint, body, successKey, values = {}) {
    if (!canManage || serverId == null || busy) {
      return false;
    }

    busy = true;

    try {
      const response = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/files/${endpoint}`,
        body,
        handler: (result) => result,
      });

      if (!response) {
        return false;
      }

      if (isEndpointUnavailable(response)) {
        void showError('pages.servers.errors.unavailable');

        return false;
      }

      if (response.error) {
        showServerActionError(response.error, response, {
          server: $server,
          feature: 'files.source',
        });

        return false;
      }

      void showSuccess(successKey, values);
      selectedNames = [];
      await refresh();

      return true;
    } finally {
      busy = false;
    }
  }

  /**
   * @param {string} mode
   * @param {import('$lib/files.util.js').FileEntry | null} [entry]
   */
  function startPrompt(mode, entry = null) {
    if (!canManage || !PROMPT_MODES[mode]) {
      return;
    }

    promptMode = mode;
    promptEntry = entry;

    if (mode === 'rename') {
      promptValue = entry?.name || '';
    } else if (mode === 'unarchive') {
      promptValue = defaultExtractName(entry?.name || '');
    } else if (mode === 'chmod') {
      promptValue = entry?.mode || '0644';
    } else {
      promptValue = '';
    }

    promptModal?.show();
  }

  /**
   * @param {KeyboardEvent} event
   */
  function onPromptKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void confirmPrompt();
    }
  }

  async function confirmPrompt() {
    if (!promptValid || busy) {
      return;
    }

    const value = promptValue.trim();
    const mode = promptMode;
    let done = false;

    if (mode === 'new-file') {
      done = await writeEmptyFile(joinPath(path, value));
    } else if (mode === 'new-folder') {
      done = await mutate('mkdir', { path: joinPath(path, value) }, 'pages.servers.files.created', {
        name: value,
      });
    } else if (mode === 'rename') {
      done = await mutate(
        'rename',
        { from: joinPath(path, promptEntry?.name || ''), to: joinPath(path, value) },
        'pages.servers.files.renamed',
        { name: value },
      );
    } else if (mode === 'unarchive') {
      done = await mutate(
        'unarchive',
        { path: joinPath(path, promptEntry?.name || ''), target: joinPath(path, value) },
        'pages.servers.files.unarchived',
        { name: value },
      );
    } else if (mode === 'chmod') {
      done = await mutate(
        'chmod',
        { path: joinPath(path, promptEntry?.name || ''), mode: value },
        'pages.servers.files.chmod-done',
        { name: promptEntry?.name || '', mode: value },
      );
    }

    if (done) {
      promptModal?.hide();
    }
  }

  /**
   * "New file" is a write of an empty document — the contract has no create endpoint, and a
   * write to a path that does not exist is exactly what it does.
   *
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  async function writeEmptyFile(filePath) {
    if (!canManage || serverId == null || busy) {
      return false;
    }

    busy = true;

    try {
      const response = await ApiUtil.put({
        path: `/api/panel/servers/${serverId}/files/content`,
        body: { path: filePath, content: '' },
        handler: (result) => result,
      });

      if (!response) {
        return false;
      }

      if (isEndpointUnavailable(response)) {
        void showError('pages.servers.errors.unavailable');

        return false;
      }

      if (response.error) {
        showServerActionError(response.error, response, {
          server: $server,
          feature: 'files.source',
        });

        return false;
      }

      void showSuccess('pages.servers.files.created', { name: filePath });
      await refresh();

      return true;
    } finally {
      busy = false;
    }
  }

  /**
   * @param {string[]} names
   */
  function askDelete(names) {
    if (!canManage || !names.length) {
      return;
    }

    deleteTargets = [...names];
    deleteModal?.show();
  }

  async function confirmDelete() {
    const done = await mutate(
      'delete',
      { paths: deleteTargets.map((name) => joinPath(path, name)) },
      'pages.servers.files.deleted',
      { count: deleteTargets.length },
    );

    if (done) {
      deleteModal?.hide();
      deleteTargets = [];
    }
  }

  /**
   * @param {number} id
   * @param {object} patch
   */
  function patchUpload(id, patch) {
    uploads = uploads.map((upload) => (upload.id === id ? { ...upload, ...patch } : upload));
  }

  /**
   * Uploads one file per request (multipart, §2.4.4) so the progress list can show a bar per
   * file; the backend spools each one and pushes it to the node over a transfer ticket.
   *
   * @param {FileList | Array<File | { file: File, dir: string }> | null} list
   * @param {string} [into] the folder to upload into; the one on screen by default.
   */
  async function uploadFiles(list, into = path) {
    // Plain files land in `into`; files from a dropped folder carry the folder they were in.
    const items = Array.from(list || []).map((item) =>
      item instanceof File ? { file: item, dir: '' } : item,
    );

    if (!items.length || !canManage || serverId == null) {
      return;
    }

    const shown = path;

    for (const { file, dir } of items) {
      const id = ++uploadSeq;
      const target = joinPath(into, dir);

      if (!isPathSafe(joinPath(target, file.name))) {
        void showError('pages.servers.files.upload-failed-toast', { name: file.name });

        continue;
      }

      uploads = [
        ...uploads,
        { id, name: joinPath(target, file.name), percent: 0, status: 'uploading' },
      ];

      const form = new FormData();

      form.append('file', file, file.name);

      /** @type {any} */
      let response = null;

      try {
        response = await ApiUtil.post({
          path: `/api/panel/servers/${serverId}/files/upload?path=${encodeURIComponent(target)}`,
          body: form,
          onUploadProgress: (progress) => {
            patchUpload(id, { percent: Math.min(100, Math.round(Number(progress) * 100)) });
          },
          handler: (result) => result,
        });
      } catch (error) {
        console.error('Upload failed', error);
        response = null;
      }

      if (!response || isEndpointUnavailable(response) || response.error) {
        patchUpload(id, { status: 'failed', percent: 100 });

        if (response?.error) {
          showServerActionError(response.error, response, {
            server: $server,
            feature: 'files.source',
          });
        } else if (response && isEndpointUnavailable(response)) {
          void showError('pages.servers.errors.unavailable');
        } else {
          void showError('pages.servers.files.upload-failed-toast', { name: file.name });
        }

        continue;
      }

      patchUpload(id, { status: 'done', percent: 100 });
    }

    // A drop into a sub-folder still changes this listing when that folder was new.
    if (shown === path) {
      await refresh();
    }
  }

  function clearFinishedUploads() {
    uploads = uploads.filter((upload) => upload.status === 'uploading');
  }

  /**
   * Only a drag that carries files from outside the page is an upload; dragging text or a link
   * around must not light the listing up.
   *
   * @param {DragEvent} event
   */
  function isFileDrag(event) {
    return Array.from(event.dataTransfer?.types || []).includes('Files');
  }

  /**
   * Follows the pointer over the listing: over a folder's row the drop goes into that folder,
   * anywhere else into the folder on screen.
   *
   * @param {DragEvent} event
   */
  function onDragOver(event) {
    if (!canManage || !isFileDrag(event)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    const row = /** @type {HTMLElement | null} */ (event.target)?.closest?.('[data-drop-folder]');

    dropFolder = row?.getAttribute('data-drop-folder') || '';
    dragging = true;
  }

  /**
   * @param {DragEvent} event
   */
  function onDragLeave(event) {
    // Leaving a row for its neighbour fires this too; only leaving the listing itself counts.
    const next = /** @type {Node | null} */ (event.relatedTarget);

    if (next && dropZone?.contains(next)) {
      return;
    }

    dragging = false;
    dropFolder = '';
  }

  /**
   * @param {DragEvent} event
   */
  async function onDrop(event) {
    const into = dropTargetPath;

    dragging = false;
    dropFolder = '';

    if (!canManage || !isFileDrag(event)) {
      return;
    }

    event.preventDefault();

    const picked = await filesFromDrop(event.dataTransfer);

    void uploadFiles(picked, into);
  }

  /**
   * Everything a drop carries, folders included: a dropped folder is walked and its files keep
   * their place inside it, so dragging `plugins/` from the desktop recreates `plugins/` here.
   *
   * The entry API has to be read synchronously inside the drop handler, which is why the items
   * are turned into entries before the first `await`.
   *
   * @param {DataTransfer | null} transfer
   * @returns {Promise<Array<{ file: File, dir: string }>>}
   */
  async function filesFromDrop(transfer) {
    if (!transfer) {
      return [];
    }

    const entries = Array.from(transfer.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.webkitGetAsEntry?.())
      .filter(Boolean);

    // No entry API (or nothing it could read): the flat file list is still something.
    if (!entries.length) {
      return Array.from(transfer.files || []).map((file) => ({ file, dir: '' }));
    }

    /** @type {Array<{ file: File, dir: string }>} */
    const collected = [];

    /**
     * @param {any} entry
     * @param {string} dir
     */
    async function walk(entry, dir) {
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));

        collected.push({ file, dir });

        return;
      }

      if (!entry.isDirectory) {
        return;
      }

      const reader = entry.createReader();
      const inside = joinPath(dir, entry.name);

      // readEntries hands the listing over in batches until it answers with an empty one.
      for (;;) {
        const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));

        if (!batch.length) {
          break;
        }

        for (const child of batch) {
          await walk(child, inside);
        }
      }
    }

    for (const entry of entries) {
      try {
        await walk(entry, '');
      } catch (error) {
        console.error('Could not read a dropped item', error);
      }
    }

    return collected;
  }

  /**
   * Backspace goes up a directory, the way a file manager does — unless the caret is in a
   * field, where Backspace is what the admin actually meant.
   *
   * @param {KeyboardEvent} event
   */
  function onWindowKeydown(event) {
    // No manager on screen while nothing can read the directory, so nothing to go up in.
    if (event.key !== 'Backspace' || event.defaultPrevented || !available) {
      return;
    }

    const target = /** @type {HTMLElement | null} */ (event.target);
    const tag = String(target?.tagName || '').toLowerCase();

    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
      return;
    }

    if (document.querySelector('.modal.show')) {
      return;
    }

    event.preventDefault();
    goUp();
  }

  onMount(() => {
    promptModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(promptModalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;
    deleteModal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(deleteModalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    void tick().then(() => {
      if (promptModalElement) {
        promptModalElement.addEventListener('shown.bs.modal', focusPromptInput);
      }
    });

    return () => {
      promptModalElement?.removeEventListener('shown.bs.modal', focusPromptInput);
    };
  });

  function focusPromptInput() {
    /** @type {HTMLInputElement | null} */
    const input = document.getElementById('filePromptInput');

    input?.focus();
    input?.select();
  }

  onDestroy(() => {
    listSeq += 1;
    promptModal?.hide();
    deleteModal?.hide();
    promptModal = null;
    deleteModal = null;
  });
</script>
