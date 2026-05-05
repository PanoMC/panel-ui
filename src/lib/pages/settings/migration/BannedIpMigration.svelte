<style>
  .fs-7 {
    font-size: 0.85rem;
  }
</style>

{#if currentStep === 'upload'}
  <div class="alert alert-info mb-3">
    <i class="fas fa-info-circle me-1"></i>
    <strong>{$_('pages.migration.banned-ips.supported-info-title')}</strong>
    <ul class="mb-0 mt-1">
      <li>{$_('pages.migration.banned-ips.supported-format')}</li>
      <li>{$_('pages.migration.banned-ips.enforce-info')}</li>
    </ul>
  </div>

  <label class="form-label" for="uploadBannedIpFile">
    {$_('pages.migration.banned-ips.upload-label')}
  </label>
  {#if file}
    <div class="position-relative">
      <DragAndDropZone
        id="uploadBannedIpFile"
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
      id="uploadBannedIpFile"
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
        <label class="fw-bold mb-0" for="skipExpiredIp">
          {$_('pages.migration.banned-ips.skip-expired')}
        </label>
        <small class="d-block text-muted">
          {$_('pages.migration.banned-ips.skip-expired-desc', {
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
            id="skipExpiredIp"
            bind:checked={skipExpired} />
        </div>
      </div>
    </div>
  {/if}

  {#if previewData.existingCount > 0}
    <div class="row align-items-center mb-3">
      <div class="col-9">
        <label class="fw-bold mb-0" for="overrideExistingIp">
          {$_('pages.migration.banned-ips.override-existing')}
        </label>
        <small class="d-block text-muted">
          {$_('pages.migration.banned-ips.override-existing-desc', {
            values: { count: previewData.existingCount },
          })}
        </small>
      </div>
      <div class="col-3 text-end">
        <div class="form-check form-switch d-inline-block">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="overrideExistingIp"
            bind:checked={overrideExisting} />
        </div>
      </div>
    </div>
  {/if}

  {#if previewData.expiredCount > 0 || previewData.existingCount > 0}
    <hr />
  {/if}

  <div class="card mb-3">
    <CardHeader>
      <div slot="left">
        <span class="me-3">
          <strong>
            {$_('pages.migration.banned-ips.total-entries', {
              values: { count: previewData.totalCount },
            })}
          </strong>
        </span>
        <span class="badge text-bg-success me-2">
          {$_('pages.migration.banned-ips.new', {
            values: { count: previewData.newCount },
          })}
        </span>
        <span class="badge text-bg-warning">
          {$_('pages.migration.banned-ips.existing', {
            values: { count: previewData.existingCount },
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
        <button class="btn btn-link text-decoration-none px-0 px-md-2" on:click={selectAllNew}>
          {$_('pages.migration.banned-ips.select-all-new')}
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
              <th class="align-middle text-nowrap" scope="col">IP</th>
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
              <tr>
                <td>
                  <input
                    type="checkbox"
                    class="form-check-input"
                    checked={selectedItems.has(item.ip)}
                    on:change={() => toggleItem(item.ip)} />
                </td>
                <td class="fw-semibold">
                  <code class="user-select-all fs-7">{item.ip}</code>
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
                  {#if item.status === 'new'}
                    <span class="badge text-bg-success">
                      {$_('pages.migration.authme.status-new')}
                    </span>
                  {:else if item.status === 'existing'}
                    <span class="badge text-bg-warning">
                      {$_('pages.migration.authme.status-existing')}
                    </span>
                  {:else}
                    <span class="badge text-bg-secondary">
                      {$_('pages.migration.banned-players.status-expired')}
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}

            {#if paginatedItems.length === 0}
              <tr>
                <td colspan="5" class="text-center text-muted py-4">
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
          {$_('pages.migration.banned-ips.importing-status', {
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
        {$_('pages.migration.banned-ips.result-title')}
      </h6>
      <p class="mb-0 small">
        <strong>{importResult.importedCount}</strong>
        {$_('pages.migration.banned-ips.result-imported')}{#if importResult.updatedCount > 0},
          <strong>{importResult.updatedCount}</strong>
          {$_('pages.migration.banned-ips.result-updated')}{/if}{#if importResult.skippedCount > 0},
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

  export let currentStep = 'upload';
  export let previewData = null;
  export let selectedItems = new Set();
  export let skipExpired = true;
  export let overrideExisting = false;

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
        (item.ip || '').toLowerCase().includes(q) ||
        (item.reason || '').toLowerCase().includes(q) ||
        (item.source || '').toLowerCase().includes(q)
      );
    }) ?? [];

  $: paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  $: totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  $: areAllFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selectedItems.has(i.ip));

  function handleFile(droppedFile) {
    if (!droppedFile) return;

    if (!droppedFile.name.toLowerCase().endsWith('.json')) {
      uploadError = $_('pages.migration.banned-ips.error-valid-json');
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
        path: '/api/panel/migration/server/banned-ips/upload',
        body: formData,
        onUploadProgress: (progress) => {
          uploadProgress = progress;
        },
      });

      if (result?.result === 'error') {
        uploadError =
          result.message || result.error || $_('pages.migration.banned-ips.error-upload-failed');
        return;
      }

      if (result) {
        previewData = result;

        const preselected = new Set();
        result.items.forEach((item) => {
          if (item.status === 'new') preselected.add(item.ip);
        });
        selectedItems = preselected;

        currentStep = 'review';
      }
    } catch (error) {
      uploadError = error.message || $_('pages.migration.banned-ips.error-upload-failed');
    } finally {
      isProcessing = false;
    }
  }

  function toggleItem(ip) {
    if (selectedItems.has(ip)) {
      selectedItems.delete(ip);
    } else {
      selectedItems.add(ip);
    }
    selectedItems = new Set(selectedItems);
  }

  function toggleAllFiltered() {
    if (filteredItems.every((i) => selectedItems.has(i.ip))) {
      filteredItems.forEach((i) => selectedItems.delete(i.ip));
    } else {
      filteredItems.forEach((i) => selectedItems.add(i.ip));
    }
    selectedItems = new Set(selectedItems);
  }

  function selectAllNew() {
    selectedItems = new Set(
      previewData.items.filter((i) => i.status === 'new').map((i) => i.ip),
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
        path: '/api/panel/migration/server/banned-ips/import',
        body: {
          selection: Array.from(selectedItems),
          skipExpired,
          overrideExisting,
        },
      });

      clearInterval(progressInterval);
      importProgress = 1;

      if (result?.result === 'error') {
        uploadError =
          result.message || result.error || $_('pages.migration.banned-ips.error-import-failed');
        return;
      }

      if (result) {
        importResult = result;
        currentStep = 'result';
      }
    } catch (error) {
      clearInterval(progressInterval);
      uploadError = error.message || $_('pages.migration.banned-ips.error-import-failed');
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
    overrideExisting = false;
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
