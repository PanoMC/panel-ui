<style>
  .fs-7 {
    font-size: 0.85rem;
  }
</style>

{#if currentStep === 'upload'}
  <div class="alert alert-info mb-3">
    <i class="fas fa-info-circle me-1"></i>
    <strong>{$_('pages.migration.banned-players.supported-info-title')}</strong>
    <ul class="mb-0 mt-1">
      <li>{$_('pages.migration.banned-players.supported-format')}</li>
      <li>{$_('pages.migration.banned-players.matching-info')}</li>
      <li>{$_('pages.migration.banned-players.unmatched-note')}</li>
    </ul>
  </div>

  <label class="form-label" for="uploadBannedFile">
    {$_('pages.migration.banned-players.upload-label')}
  </label>
  {#if file}
    <div class="position-relative">
      <DragAndDropZone
        id="uploadBannedFile"
        accept={['.json']}
        on:drop={(e) => handleFile(e.detail)}
        icon="fas fa-file-alt fs-1"
        title={file.name}
        subtitle="{(file.size / 1024).toFixed(2)} KB" />
      <button
        class="btn-close position-absolute top-0 end-0 m-2"
        aria-label={$_('buttons.remove')}
        title={$_('buttons.remove')}
        on:click|stopPropagation={removeFile}></button>
    </div>
  {:else}
    <DragAndDropZone
      id="uploadBannedFile"
      accept={['.json']}
      on:drop={(e) => handleFile(e.detail)}
      title={$_('pages.migration.authme.drag-drop-file')}
      subtitle={$_('pages.migration.authme.click-to-browse')} />
  {/if}

  {#if isProcessing}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="">{$_('pages.migration.authme.uploading-processing')}</small>
        <small class="">{Math.round(uploadProgress * 100)}%</small>
      </div>
      <div class="progress" style="height: 6px;">
        <div
          class="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          style="width: {uploadProgress * 100}%"
          aria-valuenow={Math.round(uploadProgress * 100)}
          aria-valuemin="0"
          aria-valuemax="100">
        </div>
      </div>
    </div>
  {/if}

  {#if uploadError}
    <div class="alert alert-danger mt-3" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {uploadError}
    </div>
  {/if}
{:else if currentStep === 'review'}
  {#if previewData.expiredCount > 0}
    <div class="row align-items-center mb-3">
      <div class="col-9">
        <label class="fw-bold mb-0" for="skipExpired">
          {$_('pages.migration.banned-players.skip-expired')}
        </label>
        <small class="d-block text-muted">
          {$_('pages.migration.banned-players.skip-expired-desc', {
            values: { count: previewData.expiredCount },
          })}
        </small>
      </div>
      <div class="col-3 text-end">
        <div class="form-check form-switch d-inline-block">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="skipExpired"
            bind:checked={skipExpired} />
        </div>
      </div>
    </div>
  {/if}

  {#if previewData.alreadyBannedCount > 0}
    <div class="row align-items-center mb-3">
      <div class="col-9">
        <label class="fw-bold mb-0" for="overrideAlreadyBanned">
          {$_('pages.migration.banned-players.override-already-banned')}
        </label>
        <small class="d-block text-muted">
          {$_('pages.migration.banned-players.override-already-banned-desc', {
            values: { count: previewData.alreadyBannedCount },
          })}
        </small>
      </div>
      <div class="col-3 text-end">
        <div class="form-check form-switch d-inline-block">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="overrideAlreadyBanned"
            bind:checked={overrideAlreadyBanned} />
        </div>
      </div>
    </div>
  {/if}

  {#if previewData.expiredCount > 0 || previewData.alreadyBannedCount > 0}
    <hr />
  {/if}

  {#if previewData.unmatchedCount > 0}
    <div class="alert alert-warning mt-2 mb-3">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {$_('pages.migration.banned-players.unmatched-warning', {
        values: { count: previewData.unmatchedCount },
      })}
    </div>
  {/if}

  <div class="card mb-3">
    <CardHeader>
      <div slot="left">
        <span class="me-3">
          <strong>
            {$_('pages.migration.banned-players.total-entries', {
              values: { count: previewData.totalCount },
            })}
          </strong>
        </span>
        <span class="badge text-bg-success me-2">
          {$_('pages.migration.banned-players.matched', {
            values: { count: previewData.matchedCount },
          })}
        </span>
        <span class="badge text-bg-secondary">
          {$_('pages.migration.banned-players.unmatched', {
            values: { count: previewData.unmatchedCount },
          })}
        </span>
      </div>

      <div slot="middle" style="width: 250px;">
        <SearchInput
          placeholderKey="buttons.find"
          showSpinner={false}
          on:change={(e) => (searchQuery = e.detail.value)} />
      </div>

      <div slot="right" class="d-flex flex-wrap gap-2">
        <button class="btn btn-link text-decoration-none px-0 px-md-2" on:click={selectAllReady}>
          {$_('pages.migration.banned-players.select-all-ready')}
        </button>
      </div>
    </CardHeader>

    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="align-middle text-nowrap" scope="col" style="width: 40px;">
                <input
                  type="checkbox"
                  class="form-check-input"
                  checked={areAllFilteredSelected}
                  on:change={toggleAllFiltered} />
              </th>
              <th class="align-middle text-nowrap" scope="col">{$_('pages.players.table.name')}</th>
              <th class="align-middle text-nowrap" scope="col">UUID</th>
              <th class="align-middle text-nowrap" scope="col">
                {$_('pages.migration.banned-players.reason')}
              </th>
              <th class="align-middle text-nowrap" scope="col">
                {$_('pages.migration.banned-players.duration')}
              </th>
              <th class="align-middle text-nowrap" scope="col">
                {$_('pages.migration.authme.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedItems as item}
              <tr class:opacity-50={item.status === 'unmatched'}>
                <td>
                  <input
                    type="checkbox"
                    class="form-check-input"
                    checked={selectedItems.has(getKey(item))}
                    disabled={item.status === 'unmatched'}
                    on:change={() => toggleItem(item)} />
                </td>
                <td class="fw-semibold">
                  {item.name || '-'}
                  {#if item.matchedUsername && item.matchedUsername !== item.name}
                    <span class="badge text-bg-secondary ms-1 fw-normal">
                      → {item.matchedUsername}
                    </span>
                  {/if}
                </td>
                <td>
                  {#if item.uuid}
                    <code class="user-select-all fs-7">{item.uuid}</code>
                  {:else}
                    <span class="opacity-50">-</span>
                  {/if}
                </td>
                <td class="text-truncate" style="max-width: 200px;">
                  {item.reason || '-'}
                </td>
                <td class="text-nowrap">
                  {#if item.permanent}
                    <span class="badge text-bg-danger">
                      {$_('pages.migration.banned-players.permanent')}
                    </span>
                  {:else if item.expiresAt}
                    <span class="fs-7">{formatExpires(item.expiresAt)}</span>
                  {:else}
                    -
                  {/if}
                </td>
                <td>
                  {#if item.status === 'ready'}
                    <span class="badge text-bg-success">
                      {$_('pages.migration.banned-players.status-ready')}
                    </span>
                  {:else if item.status === 'already-banned'}
                    <span class="badge text-bg-warning">
                      {$_('pages.migration.banned-players.status-already-banned')}
                    </span>
                  {:else if item.status === 'expired'}
                    <span class="badge text-bg-secondary">
                      {$_('pages.migration.banned-players.status-expired')}
                    </span>
                  {:else}
                    <span class="badge text-bg-danger">
                      {$_('pages.migration.banned-players.status-unmatched')}
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}

            {#if paginatedItems.length === 0}
              <tr>
                <td colspan="6" class="text-center text-muted py-4">
                  {$_('pages.migration.banned-players.no-entries')}
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    {#if totalPages > 1}
      <div class="card-footer">
        <Pagination
          page={currentPage}
          totalPage={totalPages}
          on:firstPageClick={() => (currentPage = 1)}
          on:lastPageClick={() => (currentPage = totalPages)}
          on:pageLinkClick={(e) => (currentPage = e.detail.page)} />
      </div>
    {/if}
  </div>

  {#if isImporting}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="">
          {$_('pages.migration.banned-players.importing-status', {
            values: { count: selectedItems.size },
          })}
        </small>
        <small class="">{Math.round(importProgress * 100)}%</small>
      </div>
      <div class="progress" style="height: 6px;">
        <div
          class="progress-bar progress-bar-striped progress-bar-animated bg-success"
          role="progressbar"
          style="width: {importProgress * 100}%"
          aria-valuenow={Math.round(importProgress * 100)}
          aria-valuemin="0"
          aria-valuemax="100">
        </div>
      </div>
    </div>
  {/if}

  {#if uploadError}
    <div class="alert alert-danger mt-3" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {uploadError}
    </div>
  {/if}

  <div class="mt-4 d-flex gap-2">
    <button
      class="btn btn-secondary"
      on:click={importItems}
      disabled={selectedItems.size === 0 || isImporting}>
      {#if isImporting}
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      {/if}
      {$_('buttons.import')}
    </button>
    <button class="btn btn-link text-decoration-none" on:click={resetForm} disabled={isImporting}>
      {$_('buttons.cancel')}
    </button>
  </div>
{:else if currentStep === 'result' && importResult}
  <div class="alert alert-success d-flex align-items-center" role="alert">
    <i class="fas fa-check-circle fs-4 me-3"></i>
    <div>
      <h6 class="alert-heading mb-1">
        {$_('pages.migration.banned-players.result-title')}
      </h6>
      <p class="mb-0 small">
        <strong>{importResult.importedCount}</strong>
        {$_('pages.migration.banned-players.result-imported')}{#if importResult.skippedCount > 0},
          <strong>{importResult.skippedCount}</strong>
          {$_('pages.migration.banned-players.result-skipped')}{/if}.
      </p>
    </div>
  </div>

  {#if importResult?.errors && importResult.errors.length > 0}
    <div class="alert alert-warning mt-3">
      <h6 class="alert-heading mb-2">
        <i class="fas fa-exclamation-triangle me-1"></i>
        {$_('pages.migration.authme.some-issues-occurred')}
      </h6>
      <ul class="mb-0 small">
        {#each importResult.errors as err}
          <li><strong>{err.item}</strong>: {err.error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <button class="btn btn-primary" on:click={resetForm}>
    <i class="fas fa-redo me-2"></i>
    {$_('pages.migration.authme.start-new-migration')}
  </button>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  export { resetForm, importItems, uploadAndPreview };

  export let file = null;
  export let isProcessing = false;
  export let uploadProgress = 0;
  export let uploadError = null;

  export let currentStep = 'upload'; // 'upload' | 'review' | 'result'
  export let previewData = null;
  export let selectedItems = new Set();
  export let skipExpired = true;
  export let overrideAlreadyBanned = false;

  export let isImporting = false;
  export let importProgress = 0;
  export let importResult = null;

  let searchQuery = '';
  let currentPage = 1;
  const itemsPerPage = 10;

  $: if (searchQuery) currentPage = 1;

  $: filteredItems =
    previewData?.items?.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.uuid || '').toLowerCase().includes(q) ||
        (item.matchedUsername || '').toLowerCase().includes(q) ||
        (item.reason || '').toLowerCase().includes(q)
      );
    }) ?? [];

  $: paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  $: totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  $: areAllFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems
      .filter((i) => i.status !== 'unmatched')
      .every((i) => selectedItems.has(getKey(i)));

  function getKey(item) {
    return item.uuid || (item.name || '').toLowerCase();
  }

  function handleFile(droppedFile) {
    if (!droppedFile) return;

    if (!droppedFile.name.toLowerCase().endsWith('.json')) {
      uploadError = $_('pages.migration.banned-players.error-valid-json');
      return;
    }

    file = droppedFile;
    uploadError = null;

    uploadAndPreview();
  }

  function removeFile(e) {
    e?.preventDefault();
    file = null;
    uploadError = null;
  }

  async function uploadAndPreview() {
    if (!file) return;

    isProcessing = true;
    uploadProgress = 0;
    uploadError = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await ApiUtil.post({
        path: '/api/panel/migration/server/banned/upload',
        body: formData,
        onUploadProgress: (progress) => {
          uploadProgress = progress;
        },
      });

      if (result?.result === 'error') {
        uploadError =
          result.message ||
          result.error ||
          $_('pages.migration.banned-players.error-upload-failed');
        return;
      }

      if (result) {
        previewData = result;

        // Pre-select all entries that are ready to be imported
        const preselected = new Set();
        result.items.forEach((item) => {
          if (item.status === 'ready') {
            preselected.add(getKey(item));
          }
        });
        selectedItems = preselected;

        currentStep = 'review';
      }
    } catch (error) {
      uploadError = error.message || $_('pages.migration.banned-players.error-upload-failed');
    } finally {
      isProcessing = false;
    }
  }

  function toggleItem(item) {
    if (item.status === 'unmatched') return;

    const key = getKey(item);
    if (selectedItems.has(key)) {
      selectedItems.delete(key);
    } else {
      selectedItems.add(key);
    }
    selectedItems = new Set(selectedItems);
  }

  function toggleAllFiltered() {
    const selectable = filteredItems.filter((i) => i.status !== 'unmatched');

    if (selectable.every((i) => selectedItems.has(getKey(i)))) {
      selectable.forEach((i) => selectedItems.delete(getKey(i)));
    } else {
      selectable.forEach((i) => selectedItems.add(getKey(i)));
    }
    selectedItems = new Set(selectedItems);
  }

  function selectAllReady() {
    selectedItems = new Set(
      previewData.items.filter((i) => i.status === 'ready').map((i) => getKey(i)),
    );
  }

  async function importItems() {
    if (selectedItems.size === 0) return;

    isImporting = true;
    importProgress = 0;
    uploadError = null;

    const progressInterval = setInterval(() => {
      if (importProgress < 0.9) {
        importProgress += 0.05;
      }
    }, Math.max(100, selectedItems.size * 10));

    try {
      const result = await ApiUtil.post({
        path: '/api/panel/migration/server/banned/import',
        body: {
          selection: Array.from(selectedItems),
          skipExpired,
          overrideAlreadyBanned,
        },
      });

      clearInterval(progressInterval);
      importProgress = 1;

      if (result?.result === 'error') {
        uploadError =
          result.message ||
          result.error ||
          $_('pages.migration.banned-players.error-import-failed');
        return;
      }

      if (result) {
        importResult = result;
        currentStep = 'result';
      }
    } catch (error) {
      clearInterval(progressInterval);
      uploadError = error.message || $_('pages.migration.banned-players.error-import-failed');
    } finally {
      isImporting = false;
    }
  }

  function resetForm() {
    file = null;
    isProcessing = false;
    uploadProgress = 0;
    uploadError = null;
    currentStep = 'upload';
    previewData = null;
    selectedItems = new Set();
    skipExpired = true;
    overrideAlreadyBanned = false;
    isImporting = false;
    importProgress = 0;
    importResult = null;
    searchQuery = '';
    currentPage = 1;
  }

  function formatExpires(ms) {
    if (!ms) return '-';
    try {
      return new Date(ms).toLocaleString();
    } catch (_) {
      return '-';
    }
  }
</script>
