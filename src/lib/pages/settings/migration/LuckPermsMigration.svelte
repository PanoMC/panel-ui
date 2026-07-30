<style>
  .fs-7 {
    font-size: 0.85rem;
  }

  /*
    Bootstrap's .table-success / .table-warning hardcode a light tint and black text and have no
    dark override, so they break under the dark and copper themes. Drive Bootstrap's own table
    variables from the theme-aware subtle/emphasis colours instead.
  */
  tr.lp-row-new {
    --bs-table-bg: var(--bs-success-bg-subtle);
    --bs-table-color: var(--bs-success-text-emphasis);
    --bs-table-border-color: var(--bs-success-border-subtle);
  }

  tr.lp-row-overwrite {
    --bs-table-bg: var(--bs-warning-bg-subtle);
    --bs-table-color: var(--bs-warning-text-emphasis);
    --bs-table-border-color: var(--bs-warning-border-subtle);
  }

  tr.lp-row-deleted {
    --bs-table-bg: var(--bs-danger-bg-subtle);
    --bs-table-color: var(--bs-danger-text-emphasis);
    --bs-table-border-color: var(--bs-danger-border-subtle);
  }

  .lp-legend-swatch {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
    border: 1px solid;
    vertical-align: -0.15rem;
  }

  .lp-legend-new {
    background-color: var(--bs-success-bg-subtle);
    border-color: var(--bs-success-border-subtle);
  }

  .lp-legend-overwrite {
    background-color: var(--bs-warning-bg-subtle);
    border-color: var(--bs-warning-border-subtle);
  }

  .lp-legend-edited {
    background-color: rgba(253, 126, 20, 0.18);
    border-color: rgba(253, 126, 20, 0.4);
  }

  .lp-legend-deleted {
    background-color: var(--bs-danger-bg-subtle);
    border-color: var(--bs-danger-border-subtle);
  }

  .lp-legend-unchanged {
    background-color: var(--bs-secondary-bg);
    border-color: var(--bs-border-color);
  }

  /* Merge-strategy picker: the whole card is the radio's hit area. */
  .lp-strategy {
    cursor: pointer;
    border: 2px solid var(--bs-border-color);
    transition:
      border-color 0.15s ease-in-out,
      background-color 0.15s ease-in-out;
  }

  .lp-strategy:hover {
    border-color: var(--bs-primary);
  }

  .lp-strategy-icon,
  .lp-strategy-check {
    color: var(--bs-secondary-color);
  }

  .lp-strategy-danger:hover {
    border-color: var(--bs-danger);
  }

  .btn-check:checked + .lp-strategy {
    border-color: var(--bs-primary);
    background-color: var(--bs-primary-bg-subtle);
  }

  .btn-check:checked + .lp-strategy .lp-strategy-icon,
  .btn-check:checked + .lp-strategy .lp-strategy-check {
    color: var(--bs-primary);
  }

  /* Replacing wipes every existing group, track and node, so make that option read as destructive. */
  .btn-check:checked + .lp-strategy-danger {
    border-color: var(--bs-danger);
    background-color: var(--bs-danger-bg-subtle);
  }

  .btn-check:checked + .lp-strategy-danger .lp-strategy-icon,
  .btn-check:checked + .lp-strategy-danger .lp-strategy-check {
    color: var(--bs-danger);
  }

  .btn-check:focus-visible + .lp-strategy {
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25);
  }

  .btn-check:focus-visible + .lp-strategy-danger {
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-danger-rgb), 0.25);
  }
</style>

{#if currentStep === 'upload'}
  <div class="alert alert-info mb-3">
    <i class="fas fa-info-circle me-1"></i>
    <strong>{$_('pages.migration.luckperms.supported-info-title')}</strong>
    <ul class="mb-0 mt-1">
      <li>{$_('pages.migration.luckperms.supported-backends')}</li>
      <li>{$_('pages.migration.luckperms.supported-data')}</li>
      <li>{$_('pages.migration.luckperms.merge-note')}</li>
    </ul>
  </div>

  <label class="form-label" for="lpUploadConfig"
    >{$_('pages.migration.authme.upload-config')}</label>
  {#if configFile}
    <div class="position-relative">
      <DragAndDropZone
        id="lpUploadConfig"
        accept={['.yml', '.yaml']}
        on:drop={(e) => handleConfigFile(e.detail)}
        icon="fas fa-file-alt fs-1"
        title={configFile?.name || 'config.yml'}
        subtitle="{(configFile.size / 1024).toFixed(2)} KB" />
      <button
        class="btn-close position-absolute top-0 end-0 m-2"
        aria-label={$_('buttons.remove')}
        title={$_('buttons.remove')}
        on:click|stopPropagation={removeConfigFile}></button>
    </div>
  {:else}
    <DragAndDropZone
      id="lpUploadConfig"
      accept={['.yml', '.yaml']}
      on:drop={(e) => handleConfigFile(e.detail)}
      title={$_('pages.migration.authme.drag-drop-file')}
      subtitle={$_('pages.migration.authme.click-to-browse')} />
  {/if}

  {#if showDatabaseUpload}
    <div class="mt-3">
      <label class="form-label" for="lpUploadDb"
        >{$_('pages.migration.luckperms.h2-database-label')}</label>
      <div class="alert alert-warning">
        <i class="fas fa-info-circle me-1"></i>
        {$_('pages.migration.luckperms.h2-detected-note')}
      </div>
      {#if dbFile}
        <div class="position-relative">
          <DragAndDropZone
            id="lpUploadDb"
            accept={['.db', '.mv.db']}
            on:drop={(e) => handleDbFile(e.detail)}
            icon="fas fa-database fa-lg"
            title={dbFile?.name || 'database.db'}
            subtitle="{(dbFile.size / 1024).toFixed(2)} KB" />
          <button
            class="btn-close position-absolute top-0 end-0 m-2"
            aria-label={$_('buttons.remove')}
            title={$_('buttons.remove')}
            on:click|stopPropagation={removeDbFile}></button>
        </div>
      {:else}
        <DragAndDropZone
          id="lpUploadDb"
          accept={['.db', '.mv.db']}
          on:drop={(e) => handleDbFile(e.detail)}
          title={$_('pages.migration.authme.drag-drop-file')}
          subtitle={$_('pages.migration.authme.click-to-browse')} />
      {/if}
    </div>
  {/if}

  {#if configFile && dbConnectionInfo}
    <div class="card border-warning">
      <div class="card-header bg-warning">
        <strong>{detectedBackend}</strong> — {$_('pages.migration.luckperms.db-connect-info')}
      </div>
      <div class="card-body py-3">
        <div class="row g-2 mb-2">
          <div class="col-12 col-sm-8">
            <label class="form-label small mb-1" for="dbHost"
              >{$_('pages.migration.authme.host')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbHost"
              bind:value={dbConnectionInfo.host} />
          </div>
          <div class="col-12 col-sm-4">
            <label class="form-label small mb-1" for="dbPort"
              >{$_('pages.migration.authme.port')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbPort"
              bind:value={dbConnectionInfo.port} />
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbName"
              >{$_('pages.migration.authme.database')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbName"
              bind:value={dbConnectionInfo.database} />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbPrefix"
              >{$_('pages.migration.luckperms.table-prefix')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbPrefix"
              bind:value={dbConnectionInfo.tablePrefix} />
          </div>
        </div>
        <div class="row g-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbUser"
              >{$_('pages.migration.authme.username')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbUser"
              bind:value={dbConnectionInfo.username} />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbPass"
              >{$_('pages.migration.authme.password')}</label>
            <input
              type="password"
              class="form-control form-control-sm"
              id="dbPass"
              bind:value={dbConnectionInfo.password} />
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if configFile && !showDatabaseUpload}
    <div class="mt-3">
      <button class="btn btn-primary" on:click={uploadAndPreview} disabled={isProcessing}>
        {#if isProcessing}
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        {/if}
        {#if dbConnectionInfo}
          <i class="fas fa-plug me-1"></i> {$_('pages.migration.luckperms.connect-preview')}
        {:else}
          <i class="fas fa-upload me-1"></i> {$_('pages.migration.luckperms.upload-preview')}
        {/if}
      </button>
    </div>
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
{:else if currentStep === 'review' && previewData}
  <!--
    Two picker cards rather than a pair of far-right radios: the choice reads as a choice, and the
    destructive option is visibly destructive rather than looking like the harmless one.
  -->
  <fieldset class="mb-4">
    <legend class="fs-6 fw-bold mb-2">
      {$_('pages.migration.luckperms.merge-strategy-title')}
    </legend>
    <small class="d-block opacity-75 mb-3">
      {$_('pages.migration.luckperms.merge-strategy-desc')}
    </small>

    <div class="row g-3">
      <div class="col-12 col-md-6">
        <input
          class="btn-check"
          type="radio"
          name="mergeStrategy"
          id="strategyMerge"
          value="merge"
          bind:group={mergeStrategy} />
        <label class="lp-strategy card h-100 mb-0" for="strategyMerge">
          <div class="card-body d-flex gap-3">
            <i class="fas fa-code-merge fs-4 lp-strategy-icon"></i>
            <span>
              <span class="d-block fw-bold">
                {$_('pages.migration.luckperms.strategy-merge')}
                {#if mergeStrategy === 'merge'}
                  <i class="fas fa-circle-check ms-1 lp-strategy-check"></i>
                {/if}
              </span>
              <small class="d-block opacity-75">
                {$_('pages.migration.luckperms.strategy-merge-desc')}
              </small>
            </span>
          </div>
        </label>
      </div>

      <div class="col-12 col-md-6">
        <input
          class="btn-check"
          type="radio"
          name="mergeStrategy"
          id="strategyReplace"
          value="replace"
          bind:group={mergeStrategy} />
        <label class="lp-strategy lp-strategy-danger card h-100 mb-0" for="strategyReplace">
          <div class="card-body d-flex gap-3">
            <i class="fas fa-triangle-exclamation fs-4 lp-strategy-icon"></i>
            <span>
              <span class="d-block fw-bold">
                {$_('pages.migration.luckperms.strategy-replace')}
                {#if mergeStrategy === 'replace'}
                  <i class="fas fa-circle-check ms-1 lp-strategy-check"></i>
                {/if}
              </span>
              <small class="d-block opacity-75">
                {$_('pages.migration.luckperms.strategy-replace-desc')}
              </small>
            </span>
          </div>
        </label>
      </div>
    </div>
  </fieldset>

  {#if previewData.existingPanoNodeCount > 0}
    <div class="alert {mergeStrategy === 'replace' ? 'alert-danger' : 'alert-warning'} mb-3">
      <i class="fas fa-exclamation-triangle me-1"></i>
      {#if mergeStrategy === 'replace'}
        {$_('pages.migration.luckperms.existing-data-replace-warning', {
          values: {
            groupCount: previewData.existingPanoGroupCount,
            nodeCount: previewData.existingPanoNodeCount,
          },
        })}
      {:else}
        {$_('pages.migration.luckperms.existing-data-warning', {
          values: {
            groupCount: previewData.existingPanoGroupCount,
            nodeCount: previewData.existingPanoNodeCount,
          },
        })}
      {/if}
    </div>
  {/if}

  <div class="alert alert-secondary d-flex flex-wrap gap-3 mb-3">
    <span>
      <span class="lp-legend-swatch lp-legend-new me-1"></span>
      {$_('pages.migration.luckperms.legend-new')}
    </span>
    <span>
      <span class="lp-legend-swatch lp-legend-overwrite me-1"></span>
      {$_('pages.migration.luckperms.legend-overwrite')}
    </span>
    <span>
      <span class="lp-legend-swatch lp-legend-edited me-1"></span>
      {$_('pages.migration.luckperms.legend-edited')}
    </span>
    {#if mergeStrategy === 'replace'}
      <span>
        <span class="lp-legend-swatch lp-legend-deleted me-1"></span>
        {$_('pages.migration.luckperms.legend-deleted')}
      </span>
    {:else}
      <span>
        <span class="lp-legend-swatch lp-legend-unchanged me-1"></span>
        {$_('pages.migration.luckperms.legend-unchanged')}
      </span>
    {/if}
  </div>

  <hr />

  <!-- Groups Table -->
  <div class="card mb-3">
    <CardHeader>
      <div slot="left">
        <span class="me-3"><strong>{$_('pages.migration.luckperms.groups-title')}</strong></span>
        <span class="badge text-bg-success me-2"
          >{previewData.newGroupCount} {$_('pages.migration.authme.status-new')}</span>
        <span class="badge text-bg-warning"
          >{previewData.existingGroupCount} {$_('pages.migration.authme.status-existing')}</span>
        {#if previewData.panoOnlyGroupCount > 0}
          <span class="badge text-bg-secondary ms-2"
            >{previewData.panoOnlyGroupCount} {$_('pages.migration.luckperms.pano-only')}</span>
        {/if}
      </div>
      <div slot="middle" style="width: 250px;">
        <SearchInput
          placeholderKey="buttons.find"
          showSpinner={false}
          on:change={(e) => (groupSearchQuery = e.detail.value)} />
      </div>
      <div slot="right" class="d-flex flex-wrap gap-2">
        <button class="btn btn-link text-decoration-none px-0 px-md-2" on:click={selectAllGroups}>
          {$_('buttons.select-all')}
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
                  checked={selectedGroups.size === importableGroups().length &&
                    selectedGroups.size > 0}
                  on:change={toggleAllGroups} />
              </th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.migration.luckperms.header-group')}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.migration.luckperms.header-status')}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.migration.luckperms.header-permissions')}</th>
              <th class="align-middle text-nowrap" scope="col" style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedGroups as group (group.name)}
              {@const groupState = groupStatus(group)}
              <tr
                class:lp-row-new={groupState === 'new'}
                class:lp-row-overwrite={groupState === 'update'}
                class:lp-row-deleted={groupState === 'deleted'}>
                <td>
                  {#if group.inLuckPerms !== false}
                    <input
                      type="checkbox"
                      class="form-check-input"
                      checked={selectedGroups.has(group.name)}
                      on:change={() => toggleGroup(group.name)} />
                  {/if}
                </td>
                <td class="fw-semibold">
                  {group.name}
                  {#if group.inLuckPerms === false}
                    <div class="small opacity-75 fw-normal mt-1">
                      <i class="fas fa-database me-1"></i>{$_(
                        'pages.migration.luckperms.player-pano-only',
                      )}
                    </div>
                  {/if}
                </td>
                <td>
                  <span class={`badge ${trackBadgeClass(groupState)}`}>
                    {$_(`pages.migration.luckperms.track-${groupState}`)}
                  </span>
                </td>
                <td>
                  <span class="badge text-bg-primary"
                    >{$_('pages.migration.luckperms.nodes-count', {
                      values: { count: (groupNodes[group.name] ?? []).length },
                    })}</span>
                </td>
                <td class="text-end">
                  <button
                    class="btn btn-link text-body p-0 border-0"
                    on:click={() => toggleGroupExpand(group.name)}
                    title={expandedGroups.has(group.name)
                      ? $_('buttons.show-less-details')
                      : $_('buttons.show-more-details')}
                    aria-label={expandedGroups.has(group.name)
                      ? $_('buttons.show-less-details')
                      : $_('buttons.show-more-details')}>
                    <i class="fas fa-chevron-{expandedGroups.has(group.name) ? 'up' : 'down'}"></i>
                  </button>
                </td>
              </tr>
              {#if expandedGroups.has(group.name)}
                <tr>
                  <td colspan="5" class="p-0">
                    <div class="bg-body-tertiary p-3 border-top">
                      <LuckPermsNodeTable
                        {mergeStrategy}
                        nodes={groupNodes[group.name] ?? []}
                        on:change={(e) =>
                          patchNode('GROUP', group.name, e.detail.node, e.detail.changes)}
                        on:add={() => addNode('GROUP', group.name)}
                        on:remove={(e) => removeNode('GROUP', group.name, e.detail.node)} />
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}

            {#if filteredGroups.length === 0}
              <tr>
                <td colspan="5" class="text-center opacity-75 py-4">
                  {$_('pages.migration.luckperms.no-groups')}
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer d-flex flex-wrap align-items-center gap-2">
      <select
        class="form-select form-select-sm w-auto"
        bind:value={groupsPerPage}
        on:change={() => (groupPage = 1)}
        aria-label={$_('pages.migration.luckperms.per-page')}>
        {#each pageSizeOptions as size}
          <option value={size}
            >{$_('pages.migration.luckperms.per-page-option', { values: { count: size } })}</option>
        {/each}
      </select>
      <small class="opacity-75">
        {$_('pages.migration.luckperms.total-count', {
          values: { count: filteredGroups.length },
        })}
      </small>
      <div class="ms-auto">
        <Pagination
          page={groupPage}
          totalPage={totalGroupPages}
          on:firstPageClick={() => (groupPage = 1)}
          on:lastPageClick={() => (groupPage = totalGroupPages)}
          on:pageLinkClick={(e) => (groupPage = e.detail.page)} />
      </div>
    </div>
  </div>

  <!-- Tracks Table. Shown even when empty: "there are no tracks" is information too, and hiding the
       card entirely made it look like the feature was missing. -->
  {#if previewData.tracks}
    <div class="card mb-3">
      <CardHeader>
        <div slot="left">
          <span class="me-3"><strong>{$_('pages.migration.luckperms.tracks-title')}</strong></span>
          <span class="badge text-bg-primary">{previewData.tracks.length}</span>
          {#if previewData.panoOnlyTrackCount > 0}
            <span class="badge text-bg-secondary ms-2"
              >{previewData.panoOnlyTrackCount} {$_('pages.migration.luckperms.pano-only')}</span>
          {/if}
        </div>
        <div slot="middle" style="width: 250px;">
          <SearchInput
            placeholderKey="buttons.find"
            showSpinner={false}
            on:change={(e) => (trackSearchQuery = e.detail.value)} />
        </div>
        <div slot="right" class="d-flex flex-wrap gap-2">
          <button class="btn btn-link text-decoration-none px-0 px-md-2" on:click={selectAllTracks}>
            {$_('buttons.select-all')}
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
                    checked={selectedTracks.size === importableTracks().length &&
                      selectedTracks.size > 0}
                    on:change={toggleAllTracks} />
                </th>
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.migration.luckperms.header-track')}</th>
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.migration.luckperms.header-status')}</th>
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.migration.luckperms.header-groups')}</th>
                <th class="align-middle text-nowrap" scope="col" style="width: 40px;"></th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedTracks as track (track.name)}
                {@const chain = trackChain(track)}
                {@const trackState = trackStatus(track)}
                <tr
                  class:lp-row-new={trackState === 'new'}
                  class:lp-row-overwrite={trackState === 'update'}
                  class:lp-row-deleted={trackState === 'deleted'}>
                  <td>
                    {#if track.inLuckPerms !== false}
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={selectedTracks.has(track.name)}
                        on:change={() => toggleTrack(track.name)} />
                    {/if}
                  </td>
                  <td class="fw-semibold">
                    {track.name}
                    {#if track.inLuckPerms === false}
                      <div class="small opacity-75 fw-normal mt-1">
                        <i class="fas fa-database me-1"></i>{$_(
                          'pages.migration.luckperms.player-pano-only',
                        )}
                      </div>
                    {/if}
                  </td>
                  <td>
                    <span class={`badge ${trackBadgeClass(trackState)}`}>
                      {$_(`pages.migration.luckperms.track-${trackState}`)}
                    </span>
                  </td>
                  <td>
                    {#each chain as g, i}
                      <span
                        class="badge me-1 {isGroupImportable(g)
                          ? 'text-bg-secondary'
                          : 'text-bg-danger'}"
                        title={isGroupImportable(g)
                          ? ''
                          : $_('pages.migration.luckperms.track-group-dropped')}>
                        {i + 1}. {g}
                      </span>
                    {/each}
                    {#if chain.length === 0}
                      <span class="opacity-75">—</span>
                    {/if}
                  </td>
                  <td class="text-end">
                    <button
                      class="btn btn-link text-body p-0 border-0"
                      on:click={() => toggleTrackExpand(track.name)}
                      title={expandedTracks.has(track.name)
                        ? $_('buttons.show-less-details')
                        : $_('buttons.show-more-details')}
                      aria-label={expandedTracks.has(track.name)
                        ? $_('buttons.show-less-details')
                        : $_('buttons.show-more-details')}>
                      <i class="fas fa-chevron-{expandedTracks.has(track.name) ? 'up' : 'down'}"
                      ></i>
                    </button>
                  </td>
                </tr>
                {#if expandedTracks.has(track.name)}
                  <tr>
                    <td colspan="5" class="p-0">
                      <div class="bg-body-tertiary p-3 border-top">
                        {#if track.status !== 'new' && track.existingGroups?.length}
                          <div class="mb-3 small">
                            <span class="opacity-75 me-2"
                              >{$_('pages.migration.luckperms.track-current-chain')}</span>
                            {#each track.existingGroups as g, i}
                              <span class="badge text-bg-secondary me-1">{i + 1}. {g}</span>
                            {/each}
                          </div>
                        {/if}

                        {#if chain.some((g) => !isGroupImportable(g))}
                          <div class="alert alert-danger py-2 small">
                            <i class="fas fa-exclamation-triangle me-1"></i>
                            {$_('pages.migration.luckperms.track-unknown-groups', {
                              values: {
                                groups: chain.filter((g) => !isGroupImportable(g)).join(', '),
                              },
                            })}
                          </div>
                        {/if}

                        <label class="form-label small mb-1" for="trackDesc-{track.name}">
                          {$_('pages.migration.luckperms.track-description')}
                        </label>
                        <input
                          id="trackDesc-{track.name}"
                          class="form-control form-control-sm mb-3"
                          value={trackDescription(track)}
                          on:input={(e) => setTrackDescription(track, e.currentTarget.value)} />

                        <div class="small opacity-75 mb-2">
                          {$_('pages.migration.luckperms.track-order-hint')}
                        </div>
                        <ol class="list-group list-group-numbered mb-2">
                          {#each chain as g, i (g)}
                            <li
                              class="list-group-item d-flex align-items-center justify-content-between py-1">
                              <span class={isGroupImportable(g) ? '' : 'text-danger'}>{g}</span>
                              <span class="d-flex gap-1">
                                <button
                                  class="btn btn-sm btn-outline-secondary py-0"
                                  disabled={i === 0}
                                  on:click={() => moveTrackGroup(track, i, -1)}
                                  aria-label={$_('buttons.move-up')}
                                  title={$_('buttons.move-up')}>
                                  <i class="fas fa-arrow-up"></i>
                                </button>
                                <button
                                  class="btn btn-sm btn-outline-secondary py-0"
                                  disabled={i === chain.length - 1}
                                  on:click={() => moveTrackGroup(track, i, 1)}
                                  aria-label={$_('buttons.move-down')}
                                  title={$_('buttons.move-down')}>
                                  <i class="fas fa-arrow-down"></i>
                                </button>
                                <button
                                  class="btn btn-sm btn-outline-danger py-0"
                                  on:click={() => removeTrackGroup(track, i)}
                                  aria-label={$_('buttons.remove')}
                                  title={$_('buttons.remove')}>
                                  <i class="fas fa-trash"></i>
                                </button>
                              </span>
                            </li>
                          {/each}
                        </ol>

                        <div class="d-flex gap-2">
                          <select
                            class="form-select form-select-sm"
                            style="max-width: 260px;"
                            bind:value={trackGroupToAdd}
                            aria-label={$_('pages.migration.luckperms.track-add-group')}>
                            <option value=""
                              >{$_('pages.migration.luckperms.track-add-group')}</option>
                            {#each previewData.groups.filter((g) => !chain.includes(g.name)) as g}
                              <option value={g.name}>{g.name}</option>
                            {/each}
                          </select>
                          <button
                            class="btn btn-sm btn-outline-secondary"
                            disabled={!trackGroupToAdd}
                            on:click={() => addTrackGroup(track)}>
                            <i class="fas fa-plus me-1"></i>{$_('buttons.add')}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}

              {#if filteredTracks.length === 0}
                <tr>
                  <td colspan="5" class="text-center opacity-75 py-4">
                    {$_('pages.migration.luckperms.no-tracks')}
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer d-flex flex-wrap align-items-center gap-2">
        <select
          class="form-select form-select-sm w-auto"
          bind:value={tracksPerPage}
          on:change={() => (trackPage = 1)}
          aria-label={$_('pages.migration.luckperms.per-page')}>
          {#each pageSizeOptions as size}
            <option value={size}
              >{$_('pages.migration.luckperms.per-page-option', {
                values: { count: size },
              })}</option>
          {/each}
        </select>
        <small class="opacity-75">
          {$_('pages.migration.luckperms.total-count', {
            values: { count: filteredTracks.length },
          })}
        </small>
        <div class="ms-auto">
          <Pagination
            page={trackPage}
            totalPage={totalTrackPages}
            on:firstPageClick={() => (trackPage = 1)}
            on:lastPageClick={() => (trackPage = totalTrackPages)}
            on:pageLinkClick={(e) => (trackPage = e.detail.page)} />
        </div>
      </div>
    </div>
  {/if}

  <!-- User Permissions Section -->
  {#if previewData.players}
    <div class="card mb-3">
      <CardHeader>
        <div slot="left">
          <span class="me-3"
            ><strong>{$_('pages.migration.luckperms.user-perms-title')}</strong></span>
          <span class="badge text-bg-success me-2"
            >{previewData.panoPlayerCount} {$_('pages.migration.luckperms.in-pano')}</span>
          {#if missingPlayers.length > 0}
            <span class="badge text-bg-danger"
              >{missingPlayers.length} {$_('pages.migration.luckperms.not-in-pano')}</span>
          {/if}
          {#if previewData.panoOnlyPlayerCount > 0}
            <span class="badge text-bg-secondary ms-2"
              >{previewData.panoOnlyPlayerCount} {$_('pages.migration.luckperms.pano-only')}</span>
          {/if}
        </div>
        <div slot="middle" style="width: 250px;">
          <SearchInput
            placeholderKey="buttons.find"
            showSpinner={false}
            on:change={(e) => (playerSearchQuery = e.detail.value)} />
        </div>
      </CardHeader>
      <div class="card-body pb-3">
        <div class="row align-items-center">
          <div class="col-9">
            <label class="fw-bold mb-0" for="importUserPerms">
              {$_('pages.migration.luckperms.import-user-perms')}
            </label>
            <small class="d-block opacity-75"
              >{$_('pages.migration.luckperms.import-user-perms-desc')}</small>
          </div>
          <div class="col-3 text-end">
            <div class="form-check form-switch d-inline-block">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="importUserPerms"
                bind:checked={importUserPermissions} />
            </div>
          </div>
        </div>

        {#if importUserPermissions}
          <div class="row align-items-center mt-3">
            <div class="col-9">
              <label class="fw-bold mb-0" for="createMissingPlayers">
                {$_('pages.migration.luckperms.create-missing-players')}
              </label>
              <small class="d-block opacity-75">
                {$_('pages.migration.luckperms.create-missing-players-desc')}
              </small>
            </div>
            <div class="col-3 text-end">
              <div class="form-check form-switch d-inline-block">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="createMissingPlayers"
                  bind:checked={createMissingPlayers} />
              </div>
            </div>
          </div>
        {/if}

        {#if importUserPermissions && creatablePlayers.length > 0}
          <div class="alert {createMissingPlayers ? 'alert-success' : 'alert-warning'} mb-0 mt-3">
            <i class="fas {createMissingPlayers ? 'fa-user-plus' : 'fa-exclamation-triangle'} me-1"
            ></i>
            {#if createMissingPlayers}
              {$_('pages.migration.luckperms.players-will-be-created', {
                values: { count: creatablePlayers.length, total: previewData.players.length },
              })}
            {:else}
              {$_('pages.migration.luckperms.players-will-be-skipped', {
                values: { count: creatablePlayers.length, total: previewData.players.length },
              })}
            {/if}
          </div>
        {/if}
      </div>

      {#if importUserPermissions}
        <div class="table-responsive border-top">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th style="width: 40px;"></th>
                <th style="width: 40px;"></th>
                <th>{$_('pages.migration.luckperms.header-player')}</th>
                <th>{$_('pages.migration.luckperms.header-primary-group')}</th>
                <th class="text-center">{$_('pages.migration.luckperms.header-nodes')}</th>
                <th class="text-center">{$_('pages.migration.luckperms.header-status')}</th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedPlayers as player (player.uuid)}
                {@const status = playerStatus(player)}
                {@const resulting = resultingGroup(player)}
                <tr
                  class:opacity-50={skippedPlayers.has(player.uuid)}
                  class:lp-row-new={!skippedPlayers.has(player.uuid) && status === 'new'}
                  class:lp-row-overwrite={!skippedPlayers.has(player.uuid) && status === 'changed'}
                  class:lp-row-deleted={!skippedPlayers.has(player.uuid) && status === 'deleted'}>
                  <td>
                    {#if !isPanoOnly(player)}
                      <input
                        type="checkbox"
                        class="form-check-input"
                        title={$_('pages.migration.luckperms.include-player')}
                        aria-label={$_('pages.migration.luckperms.include-player')}
                        checked={!skippedPlayers.has(player.uuid)}
                        on:change={() => togglePlayer(player.uuid)} />
                    {/if}
                  </td>
                  <td>
                    <button
                      class="btn btn-link text-body p-0 border-0"
                      on:click={() => togglePlayerExpand(player.uuid)}
                      title={expandedPlayers.has(player.uuid)
                        ? $_('buttons.show-less-details')
                        : $_('buttons.show-more-details')}
                      aria-label={expandedPlayers.has(player.uuid)
                        ? $_('buttons.show-less-details')
                        : $_('buttons.show-more-details')}>
                      <i
                        class="fas fa-chevron-{expandedPlayers.has(player.uuid)
                          ? 'up'
                          : 'down'} fs-7"></i>
                    </button>
                  </td>
                  <td>
                    <input
                      class="form-control form-control-sm"
                      class:is-invalid={!playerUsername(player).trim()}
                      aria-label={$_('pages.migration.luckperms.header-username')}
                      value={playerUsername(player)}
                      readonly={isPanoOnly(player)}
                      on:input={(e) => setPlayerUsername(player, e.currentTarget.value)} />
                    {#if isPanoOnly(player)}
                      <div class="small opacity-75 fw-normal mt-1">
                        <i class="fas fa-database me-1"></i>{$_(
                          'pages.migration.luckperms.player-pano-only',
                        )}
                      </div>
                    {:else}
                      <div class="small opacity-75 fw-normal mt-1">{player.uuid}</div>
                      {#if player.panoUsername && player.panoUsername !== playerUsername(player)}
                        <div class="small opacity-75 fw-normal">
                          <i class="fas fa-link me-1"></i>{player.panoUsername}
                        </div>
                      {/if}
                    {/if}
                  </td>
                  <td>
                    <span class="badge text-bg-secondary">{player.primaryGroup}</span>
                    {#if resulting !== player.primaryGroup}
                      <i class="fas fa-arrow-right mx-1 opacity-75 fs-7"></i>
                      <span
                        class="badge {resulting === 'default'
                          ? 'text-bg-danger'
                          : 'text-bg-success'}"
                        title={resulting === 'default'
                          ? $_('pages.migration.luckperms.group-falls-back-to-default')
                          : ''}>
                        {resulting}
                      </span>
                    {/if}
                  </td>
                  <td class="text-center">
                    <span class="badge text-bg-primary"
                      >{(userNodes[player.uuid] ?? []).length}</span>
                  </td>
                  <td class="text-center">
                    <span class={`badge ${playerBadgeClass(status)}`}>
                      {$_(`pages.migration.luckperms.player-${status}`)}
                    </span>
                  </td>
                </tr>
                {#if expandedPlayers.has(player.uuid)}
                  <tr>
                    <td colspan="6" class="p-0">
                      <div class="bg-body-tertiary p-3 border-top">
                        <LuckPermsNodeTable
                          {mergeStrategy}
                          nodes={userNodes[player.uuid] ?? []}
                          on:change={(e) =>
                            patchNode('USER', player.uuid, e.detail.node, e.detail.changes)}
                          on:add={() => addNode('USER', player.uuid)}
                          on:remove={(e) => removeNode('USER', player.uuid, e.detail.node)} />
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}

              {#if filteredPlayers.length === 0}
                <tr>
                  <td colspan="6" class="text-center opacity-75 py-4">
                    {$_('pages.migration.luckperms.no-players')}
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
        <div class="card-footer d-flex flex-wrap align-items-center gap-2">
          <select
            class="form-select form-select-sm w-auto"
            bind:value={playersPerPage}
            on:change={() => (playerPage = 1)}
            aria-label={$_('pages.migration.luckperms.per-page')}>
            {#each pageSizeOptions as size}
              <option value={size}
                >{$_('pages.migration.luckperms.per-page-option', {
                  values: { count: size },
                })}</option>
            {/each}
          </select>
          <small class="opacity-75">
            {$_('pages.migration.luckperms.total-count', {
              values: { count: filteredPlayers.length },
            })}
          </small>
          <div class="ms-auto">
            <Pagination
              page={playerPage}
              totalPage={totalPlayerPages}
              on:firstPageClick={() => (playerPage = 1)}
              on:lastPageClick={() => (playerPage = totalPlayerPages)}
              on:pageLinkClick={(e) => (playerPage = e.detail.page)} />
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if incompleteNodeCount > 0}
    <div class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-1"></i>
      {$_('pages.migration.luckperms.incomplete-nodes-warning', {
        values: { count: incompleteNodeCount },
      })}
    </div>
  {/if}

  {#if invalidUsernameCount > 0}
    <div class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-1"></i>
      {$_('pages.migration.luckperms.invalid-usernames-warning', {
        values: { count: invalidUsernameCount },
      })}
    </div>
  {/if}

  {#if isImporting}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="">{$_('pages.migration.luckperms.importing-permissions')}</small>
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
      on:click={importData}
      disabled={(selectedGroups.size === 0 && selectedTracks.size === 0) ||
        isImporting ||
        incompleteNodeCount > 0 ||
        invalidUsernameCount > 0}>
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
      <h6 class="alert-heading mb-1">{$_('pages.migration.luckperms.result-title')}</h6>
      <p class="mb-0 small">
        <strong>{importResult.importedGroups}</strong>
        {$_('pages.migration.luckperms.import-summary-groups')}{#if importResult.updatedGroups > 0},
          <strong>{importResult.updatedGroups}</strong>
          {$_('pages.migration.luckperms.import-summary-updated')}{/if},
        <strong>{importResult.importedGroupNodes}</strong>
        {$_('pages.migration.luckperms.import-summary-group-nodes')},
        <strong>{importResult.importedUserNodes}</strong>
        {$_('pages.migration.luckperms.import-summary-user-nodes')}
        {#if importResult.importedTracks > 0},
          <strong>{importResult.importedTracks}</strong>
          {$_('pages.migration.luckperms.import-summary-tracks')}{/if}
        {#if importResult.updatedTracks > 0},
          <strong>{importResult.updatedTracks}</strong>
          {$_('pages.migration.luckperms.import-summary-updated-tracks')}{/if}
        {#if importResult.createdUsers > 0},
          <strong>{importResult.createdUsers}</strong>
          {$_('pages.migration.luckperms.import-summary-created-users')}{/if}
        {#if importResult.overwrittenNodes > 0},
          <strong>{importResult.overwrittenNodes}</strong>
          {$_('pages.migration.luckperms.import-summary-overwritten')}{/if}
        {#if importResult.skippedNodes > 0},
          <strong>{importResult.skippedNodes}</strong>
          {$_('pages.migration.luckperms.import-summary-skipped')}{/if}
        {#if importResult.skippedUsers > 0},
          <strong>{importResult.skippedUsers}</strong>
          {$_('pages.migration.luckperms.import-summary-skipped-users')}{/if}.
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
  import LuckPermsNodeTable from './LuckPermsNodeTable.svelte';

  export { resetForm, importData, uploadAndPreview };

  // File upload states
  export let configFile = null;
  export let dbFile = null;
  export let showDatabaseUpload = false;
  export let detectedBackend = '';
  export let dbConnectionInfo = null;
  export let isProcessing = false;
  export let uploadProgress = 0;

  // Migration flow states
  export let currentStep = 'upload'; // 'upload' | 'review' | 'result'
  export let previewData = null;
  export let selectedGroups = new Set();
  export let selectedTracks = new Set();
  export let mergeStrategy = 'merge'; // 'merge' or 'replace'
  export let importUserPermissions = true;
  export let createMissingPlayers = true;
  export let isImporting = false;
  export let importProgress = 0;
  export let importResult = null;
  export let uploadError = null;
  export let expandedGroups = new Set();
  export let expandedPlayers = new Set();
  export let expandedTracks = new Set();

  // Editable track chains and descriptions, keyed by track name.
  let trackChains = {};
  let trackDescriptions = {};
  let trackGroupToAdd = '';

  // Merged working copy of the permission nodes, keyed by holder. Each list holds what Pano already
  // has plus what the import brings, so the review screen can show both side by side.
  // groupNodes: { [groupName]: node[] }, userNodes: { [playerUuid]: node[] }
  let groupNodes = {};
  let userNodes = {};
  // Nodes that came from LuckPerms and were deleted by the admin.
  let removedEdits = [];
  // Pano node ids the admin deleted from the existing data.
  let existingNodeDeletions = [];
  // Usernames the admin retargeted, keyed by LuckPerms uuid.
  let playerUsernames = {};
  // Players the admin excluded from the import, by LuckPerms uuid.
  let skippedPlayers = new Set();
  let nodeSeq = 0;

  // Search & Pagination for groups (AuthMe style consistency)
  export let groupSearchQuery = '';
  let groupPage = 1;
  // Page sizes are per table: a server can have a handful of groups but tens of thousands of
  // players, so one shared setting would be wrong for at least one of them.
  const pageSizeOptions = [10, 20, 50, 100, 1000];
  let groupsPerPage = 10;
  let tracksPerPage = 10;
  let playersPerPage = 10;

  // Search & pagination for players. Both are required rather than cosmetic: a busy server can
  // export tens of thousands of players and rendering them all at once locks up the browser.
  export let playerSearchQuery = '';
  let playerPage = 1;

  export let trackSearchQuery = '';
  let trackPage = 1;

  $: if (groupSearchQuery) groupPage = 1;
  $: if (playerSearchQuery) playerPage = 1;
  $: if (trackSearchQuery) trackPage = 1;

  $: filteredGroups =
    previewData?.groups?.filter((g) => {
      if (!groupSearchQuery.trim()) return true;
      return g.name.toLowerCase().includes(groupSearchQuery.toLowerCase());
    }) ?? [];

  $: totalGroupPages = Math.max(1, Math.ceil(filteredGroups.length / groupsPerPage));
  $: if (groupPage > totalGroupPages) groupPage = totalGroupPages;
  $: paginatedGroups = filteredGroups.slice(
    (groupPage - 1) * groupsPerPage,
    groupPage * groupsPerPage,
  );

  $: filteredPlayers =
    previewData?.players?.filter((p) => {
      if (!playerSearchQuery.trim()) return true;
      const query = playerSearchQuery.toLowerCase();
      return (
        p.username.toLowerCase().includes(query) || (p.uuid ?? '').toLowerCase().includes(query)
      );
    }) ?? [];

  $: totalPlayerPages = Math.max(1, Math.ceil(filteredPlayers.length / playersPerPage));
  $: if (playerPage > totalPlayerPages) playerPage = totalPlayerPages;
  $: paginatedPlayers = filteredPlayers.slice(
    (playerPage - 1) * playersPerPage,
    playerPage * playersPerPage,
  );

  $: filteredTracks =
    previewData?.tracks?.filter((t) => {
      if (!trackSearchQuery.trim()) return true;
      return t.name.toLowerCase().includes(trackSearchQuery.toLowerCase());
    }) ?? [];

  $: totalTrackPages = Math.max(1, Math.ceil(filteredTracks.length / tracksPerPage));
  $: if (trackPage > totalTrackPages) trackPage = totalTrackPages;
  $: paginatedTracks = filteredTracks.slice(
    (trackPage - 1) * tracksPerPage,
    trackPage * tracksPerPage,
  );

  $: missingPlayers = previewData?.players?.filter((p) => !p.existsInPano) ?? [];
  $: creatablePlayers = missingPlayers.filter((p) => p.hasImportableData);

  // A node the admin added but never named cannot be imported, so block the import until it is
  // either filled in or removed rather than dropping it silently.
  $: incompleteNodeCount = [
    ...Object.values(groupNodes).flat(),
    ...Object.values(userNodes).flat(),
  ].filter((node) => !node.permission?.trim()).length;

  $: invalidUsernameCount =
    previewData?.players?.filter(
      (player) => !skippedPlayers.has(player.uuid) && !playerUsername(player).trim(),
    ).length ?? 0;

  // Config file handlers
  async function handleConfigFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
      alert($_('pages.migration.authme.error-valid-yaml'));
      return;
    }

    configFile = file;
    uploadError = null;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      let storageMethod = '';
      let connInfo = {
        host: 'localhost',
        port: '3306',
        database: 'minecraft',
        tablePrefix: 'luckperms_',
        username: 'root',
        password: '',
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        const storageMatch = trimmed.match(/^storage-method\s*:\s*['"]?(\w+)['"]?/i);
        if (storageMatch) storageMethod = storageMatch[1].toUpperCase();

        const addressMatch = trimmed.match(/^address\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (addressMatch) {
          const parts = addressMatch[1].split(':');
          connInfo.host = parts[0];
          if (parts[1]) connInfo.port = parts[1];
        }

        const dbMatch = trimmed.match(/^database\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (dbMatch) connInfo.database = dbMatch[1];

        const prefixMatch = trimmed.match(/^table-prefix\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (prefixMatch) connInfo.tablePrefix = prefixMatch[1];

        const userMatch = trimmed.match(/^username\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (userMatch) connInfo.username = userMatch[1];

        const pwdMatch = trimmed.match(/^password\s*:\s*['"]?([^'"#]*)['"]?/i);
        if (pwdMatch) connInfo.password = pwdMatch[1].trim();
      }

      detectedBackend = storageMethod;
      showDatabaseUpload = storageMethod === 'H2';
      dbConnectionInfo = storageMethod === 'MYSQL' || storageMethod === 'MARIADB' ? connInfo : null;
    } catch (error) {
      console.error('Error parsing config:', error);
    }
  }

  function removeConfigFile(e) {
    e?.preventDefault();
    configFile = null;
    showDatabaseUpload = false;
    detectedBackend = '';
    dbConnectionInfo = null;
    dbFile = null;
    uploadError = null;
  }

  // Database file handlers
  async function handleDbFile(file) {
    if (!file) return;
    const isValid = file.name.endsWith('.db') || file.name.endsWith('.mv.db');

    if (!isValid) {
      alert($_('pages.migration.luckperms.error-valid-h2'));
      return;
    }

    dbFile = file;

    if (configFile && dbFile) {
      await uploadAndPreview();
    }
  }

  function removeDbFile(e) {
    e?.preventDefault();
    dbFile = null;
  }

  // Step 1: Upload files and get preview
  async function uploadAndPreview() {
    isProcessing = true;
    uploadProgress = 0;
    uploadError = null;

    try {
      const formData = new FormData();
      formData.append('config', configFile);
      if (dbFile) {
        formData.append('database', dbFile);
      }
      if (dbConnectionInfo) {
        formData.append('dbHost', dbConnectionInfo.host);
        formData.append('dbPort', dbConnectionInfo.port);
        formData.append('dbName', dbConnectionInfo.database);
        formData.append('dbUser', dbConnectionInfo.username);
        formData.append('dbPassword', dbConnectionInfo.password);
        formData.append('dbTablePrefix', dbConnectionInfo.tablePrefix);
      }

      const result = await ApiUtil.post({
        path: '/api/panel/migration/luckperms/upload',
        body: formData,
        onUploadProgress: (progress) => {
          uploadProgress = progress;
        },
      });

      if (result?.result === 'error') {
        uploadError =
          result.message || result.error || $_('pages.migration.authme.error-upload-failed');
        return;
      }

      if (result) {
        previewData = result;
        buildEditableNodes(result);
        selectedGroups = new Set(result.groups.map((g) => g.name));
        if (result.tracks) {
          selectedTracks = new Set(result.tracks.map((t) => t.name));
        }
        currentStep = 'review';
      }
    } catch (error) {
      uploadError = error.message || $_('pages.migration.authme.error-upload-failed');
    } finally {
      isProcessing = false;
    }
  }

  // ── Permission node merging & editing ──

  function snapshotOf(node) {
    return {
      permission: node.permission,
      value: node.value,
      server: node.server,
      world: node.world,
      contexts: node.contexts,
    };
  }

  function normalise(perm) {
    return {
      permission: perm.permission,
      value: perm.value !== false,
      server: perm.server ?? 'global',
      world: perm.world ?? 'global',
      expiry: perm.expiry ?? 0,
      contexts: perm.contexts ?? '{}',
    };
  }

  // A node Pano already holds. `_before` is what the admin sees as "was there".
  function toPanoRow(node) {
    const row = {
      _id: ++nodeSeq,
      _origin: 'pano',
      _panoNodeId: node.id,
      _match: null,
      _incoming: false,
      _implied: false,
      _fromPrimaryGroup: false,
      ...normalise(node),
    };
    row._before = snapshotOf(row);
    row._incomingSnapshot = null;
    return row;
  }

  // A node arriving from LuckPerms with no Pano counterpart.
  function toIncomingRow(perm) {
    const row = {
      _id: ++nodeSeq,
      _origin: 'luckperms',
      _panoNodeId: null,
      _incoming: true,
      _implied: perm.implied === true,
      _fromPrimaryGroup: perm.fromPrimaryGroup === true,
      ...normalise(perm),
    };
    row._match = {
      permission: row.permission,
      server: row.server,
      world: row.world,
      expiry: row.expiry,
      contexts: row.contexts,
    };
    row._before = null;
    row._incomingSnapshot = snapshotOf(row);
    return row;
  }

  // Fold an incoming node onto the existing Pano row for the same permission, if there is one, so
  // the pair renders as a single "will be overwritten" row instead of two unrelated ones.
  function mergeIncoming(rows, perm) {
    const target = rows.find(
      (row) => row._origin === 'pano' && !row._incoming && row.permission === perm.permission,
    );

    if (!target) {
      rows.push(toIncomingRow(perm));
      return;
    }

    Object.assign(target, normalise(perm), {
      _incoming: true,
      _implied: perm.implied === true,
      _fromPrimaryGroup: perm.fromPrimaryGroup === true,
    });
    target._match = {
      permission: target.permission,
      server: target.server,
      world: target.world,
      expiry: target.expiry,
      contexts: target.contexts,
    };
    target._incomingSnapshot = snapshotOf(target);
  }

  function buildEditableNodes(result) {
    const groups = {};
    const users = {};

    // Seed with what Pano already holds.
    Object.entries(result.existingGroupNodes ?? {}).forEach(([name, nodes]) => {
      groups[name] = nodes.map(toPanoRow);
    });

    (result.groups ?? []).forEach((group) => {
      groups[group.name] ??= [];
    });

    (result.players ?? []).forEach((player) => {
      const existing = result.existingUserNodes?.[player.username.toLowerCase()] ?? [];
      users[player.uuid] = existing.map(toPanoRow);
    });

    // Then fold in what LuckPerms is bringing.
    (result.groupPermissions ?? []).forEach((perm) => {
      if (!perm.groupName) return;
      groups[perm.groupName] ??= [];
      mergeIncoming(groups[perm.groupName], perm);
    });

    (result.userPermissions ?? []).forEach((perm) => {
      if (!perm.uuid) return;
      users[perm.uuid] ??= [];
      mergeIncoming(users[perm.uuid], perm);
    });

    groupNodes = groups;
    userNodes = users;
    removedEdits = [];
    existingNodeDeletions = [];
    playerUsernames = {};
    skippedPlayers = new Set();
    trackChains = {};
    trackDescriptions = {};
  }

  function bumpNodes(holderType) {
    if (holderType === 'GROUP') {
      groupNodes = { ...groupNodes };
    } else {
      userNodes = { ...userNodes };
    }
  }

  function patchNode(holderType, holderKey, node, changes) {
    Object.assign(node, changes);
    bumpNodes(holderType);
  }

  function addNode(holderType, holderKey) {
    const node = {
      _id: ++nodeSeq,
      _origin: 'added',
      _panoNodeId: null,
      _match: null,
      _incoming: true,
      _before: null,
      _incomingSnapshot: null,
      permission: '',
      value: true,
      server: 'global',
      world: 'global',
      expiry: 0,
      contexts: '{}',
    };

    const bucket = holderType === 'GROUP' ? groupNodes : userNodes;
    const next = { ...bucket, [holderKey]: [...(bucket[holderKey] ?? []), node] };

    if (holderType === 'GROUP') {
      groupNodes = next;
    } else {
      userNodes = next;
    }
  }

  function removeNode(holderType, holderKey, node) {
    // A node that came from LuckPerms is dropped from the import; one that already lives in Pano
    // has to be deleted from the database instead.
    if (node._incoming && node._match) {
      removedEdits = [...removedEdits, { holderType, holderKey, match: node._match }];
    }

    if (node._panoNodeId != null) {
      existingNodeDeletions = [...existingNodeDeletions, node._panoNodeId];
    }

    const bucket = holderType === 'GROUP' ? groupNodes : userNodes;
    const next = {
      ...bucket,
      [holderKey]: (bucket[holderKey] ?? []).filter((n) => n._id !== node._id),
    };

    if (holderType === 'GROUP') {
      groupNodes = next;
    } else {
      userNodes = next;
    }
  }

  function isNodeEdited(node) {
    const before = node._incomingSnapshot ?? node._before;
    if (!before) return false;

    return (
      before.permission !== node.permission ||
      before.value !== node.value ||
      before.server !== node.server ||
      before.world !== node.world ||
      String(before.contexts) !== String(node.contexts)
    );
  }

  // Collapse the working copy back into the add/update/remove instructions the backend applies.
  function collectNodeEdits() {
    const edits = removedEdits.map((removed) => ({ ...removed, action: 'remove' }));

    const collect = (holderType, bucket) => {
      Object.entries(bucket).forEach(([holderKey, nodes]) => {
        if (holderType === 'USER' && skippedPlayers.has(holderKey)) return;

        nodes.forEach((node) => {
          const permission = node.permission?.trim();
          if (!permission) return;

          const payload = {
            permission,
            value: node.value,
            server: node.server?.trim() || 'global',
            world: node.world?.trim() || 'global',
            expiry: Number(node.expiry) || 0,
            contexts: node.contexts?.trim() || '{}',
          };

          if (node._origin === 'added') {
            edits.push({ holderType, holderKey, action: 'add', node: payload });
            return;
          }

          if (!isNodeEdited(node)) return;

          if (node._fromPrimaryGroup) {
            // This row was derived from the players table, not from a real user_permissions row, so
            // there is nothing for the backend to match on — send it as an addition instead.
            edits.push({ holderType, holderKey, action: 'add', node: payload });
          } else if (node._match) {
            edits.push({
              holderType,
              holderKey,
              action: 'update',
              match: node._match,
              node: payload,
            });
          } else {
            // An existing Pano node the admin changed. Re-adding it overwrites the old row.
            edits.push({ holderType, holderKey, action: 'add', node: payload });

            if (node._panoNodeId != null && !existingNodeDeletions.includes(node._panoNodeId)) {
              existingNodeDeletions = [...existingNodeDeletions, node._panoNodeId];
            }
          }
        });
      });
    };

    collect('GROUP', groupNodes);
    collect('USER', userNodes);

    return edits;
  }

  // ── Players ──

  function playerUsername(player) {
    return playerUsernames[player.uuid] ?? player.username;
  }

  function setPlayerUsername(player, username) {
    playerUsernames = { ...playerUsernames, [player.uuid]: username };
  }

  function togglePlayer(uuid) {
    const next = new Set(skippedPlayers);

    if (next.has(uuid)) {
      next.delete(uuid);
    } else {
      next.add(uuid);
    }

    skippedPlayers = next;
  }

  // A row that exists only in Pano cannot be renamed or excluded: there is no LuckPerms player
  // behind it, just an account the import may or may not touch.
  function isPanoOnly(player) {
    return player.inLuckPerms === false;
  }

  // Replacing empties the permission tables before importing, so any node Pano holds that the
  // import is not bringing back is gone.
  function nodeSurvivesImport(node) {
    if (mergeStrategy === 'replace' && node._panoNodeId != null && !node._incoming) return false;

    return true;
  }

  // The group the player ends up in once the import has run. Pano falls back to the default group
  // for anyone left without a group node, which is what makes replace mode so easy to misread.
  function resultingGroup(player) {
    if (skippedPlayers.has(player.uuid)) return player.primaryGroup;

    const node = (userNodes[player.uuid] ?? []).find(
      (n) =>
        n.value &&
        n.permission?.startsWith('group.') &&
        n.permission.length > 'group.'.length &&
        nodeSurvivesImport(n),
    );

    return node ? node.permission.slice('group.'.length) : 'default';
  }

  function playerLosesNodes(player) {
    if (mergeStrategy !== 'replace') return false;

    const nodes = userNodes[player.uuid] ?? [];

    return nodes.some((n) => !nodeSurvivesImport(n));
  }

  function playerStatus(player) {
    if (!player.existsInPano) return 'new';

    const nodes = userNodes[player.uuid] ?? [];
    const changed = nodes.some(
      (node) => node._origin === 'added' || (node._incoming && node._before) || isNodeEdited(node),
    );

    // Losing existing nodes outranks any other status: it is the destructive one.
    if (playerLosesNodes(player) && !nodes.some((n) => n._incoming)) return 'deleted';

    if (isPanoOnly(player)) {
      return changed ? 'changed' : 'existing';
    }

    const renamed = playerUsername(player) !== player.username;

    return renamed || changed || playerLosesNodes(player) ? 'changed' : 'existing';
  }

  function playerBadgeClass(status) {
    switch (status) {
      case 'new':
        return 'text-bg-success';
      case 'changed':
        return 'text-bg-warning';
      case 'deleted':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  }

  function collectPlayerEdits() {
    return (previewData?.players ?? [])
      .filter((player) => !skippedPlayers.has(player.uuid))
      .filter((player) => playerUsername(player).trim() !== player.username)
      .map((player) => ({ uuid: player.uuid, username: playerUsername(player).trim() }));
  }

  // Group selection
  function toggleGroup(name) {
    if (selectedGroups.has(name)) {
      selectedGroups.delete(name);
    } else {
      selectedGroups.add(name);
    }
    selectedGroups = new Set(selectedGroups);
  }

  function importableGroups() {
    return (previewData?.groups ?? []).filter((g) => g.inLuckPerms !== false);
  }

  // A group Pano has that the export does not mention survives a merge untouched, but replace
  // empties the group table first.
  function groupStatus(group) {
    if (group.inLuckPerms === false) {
      return mergeStrategy === 'replace' ? 'deleted' : 'kept';
    }

    if (!selectedGroups.has(group.name)) return 'skipped';

    return group.status === 'new' ? 'new' : 'update';
  }

  function toggleAllGroups() {
    if (selectedGroups.size === importableGroups().length) {
      selectedGroups = new Set();
    } else {
      selectedGroups = new Set(importableGroups().map((g) => g.name));
    }
  }

  function selectAllGroups() {
    selectedGroups = new Set(importableGroups().map((g) => g.name));
  }

  // Group expand/collapse
  function toggleGroupExpand(name) {
    if (expandedGroups.has(name)) {
      expandedGroups.delete(name);
    } else {
      expandedGroups.add(name);
    }
    expandedGroups = new Set(expandedGroups);
  }

  // Player expand/collapse
  function togglePlayerExpand(uuid) {
    if (expandedPlayers.has(uuid)) {
      expandedPlayers.delete(uuid);
    } else {
      expandedPlayers.add(uuid);
    }
    expandedPlayers = new Set(expandedPlayers);
  }

  // Track selection
  function toggleTrack(name) {
    if (selectedTracks.has(name)) {
      selectedTracks.delete(name);
    } else {
      selectedTracks.add(name);
    }
    selectedTracks = new Set(selectedTracks);
  }

  function importableTracks() {
    return (previewData?.tracks ?? []).filter((t) => t.inLuckPerms !== false);
  }

  function toggleAllTracks() {
    if (selectedTracks.size === importableTracks().length) {
      selectedTracks = new Set();
    } else {
      selectedTracks = new Set(importableTracks().map((t) => t.name));
    }
  }

  function selectAllTracks() {
    selectedTracks = new Set(importableTracks().map((t) => t.name));
  }

  // ── Tracks ──

  function trackStatus(track) {
    // A track Pano has that the export does not mention survives a merge untouched, but replace
    // empties the track table first.
    if (track.inLuckPerms === false) {
      return mergeStrategy === 'replace' ? 'deleted' : 'kept';
    }

    if (!selectedTracks.has(track.name)) return 'skipped';

    return track.status === 'new' ? 'new' : 'update';
  }

  function trackBadgeClass(status) {
    switch (status) {
      case 'new':
        return 'text-bg-success';
      case 'update':
        return 'text-bg-warning';
      case 'deleted':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  }

  function toggleTrackExpand(name) {
    if (expandedTracks.has(name)) {
      expandedTracks.delete(name);
    } else {
      expandedTracks.add(name);
    }
    expandedTracks = new Set(expandedTracks);
  }

  // The ordered group chain, as edited if the admin touched it.
  function trackChain(track) {
    return trackChains[track.name] ?? track.groups ?? [];
  }

  function setTrackChain(track, chain) {
    trackChains = { ...trackChains, [track.name]: chain };
  }

  function trackDescription(track) {
    return trackDescriptions[track.name] ?? track.existingDescription ?? '';
  }

  function setTrackDescription(track, description) {
    trackDescriptions = { ...trackDescriptions, [track.name]: description };
  }

  // A group only survives into the track if it exists in Pano or is part of this import — anything
  // else has no id to point at and would silently vanish from the promotion order.
  function isGroupImportable(name) {
    return (previewData?.groups ?? []).some((g) => g.name === name);
  }

  function moveTrackGroup(track, index, delta) {
    const chain = [...trackChain(track)];
    const target = index + delta;

    if (target < 0 || target >= chain.length) return;

    [chain[index], chain[target]] = [chain[target], chain[index]];
    setTrackChain(track, chain);
  }

  function removeTrackGroup(track, index) {
    const chain = [...trackChain(track)];
    chain.splice(index, 1);
    setTrackChain(track, chain);
  }

  function addTrackGroup(track) {
    if (!trackGroupToAdd) return;

    setTrackChain(track, [...trackChain(track), trackGroupToAdd]);
    trackGroupToAdd = '';
  }

  function collectTrackEdits() {
    return (previewData?.tracks ?? [])
      .filter((track) => selectedTracks.has(track.name))
      .map((track) => ({
        name: track.name,
        groups: trackChain(track),
        description: trackDescription(track),
      }));
  }

  // Step 3: Import
  async function importData() {
    isImporting = true;
    importProgress = 0;
    uploadError = null;

    const totalActions = selectedGroups.size + selectedTracks.size;
    const progressInterval = setInterval(
      () => {
        if (importProgress < 0.9) {
          importProgress += 0.05;
        }
      },
      Math.max(100, totalActions * 10),
    );

    try {
      const nodeEdits = collectNodeEdits();

      const result = await ApiUtil.post({
        path: '/api/panel/migration/luckperms/import',
        body: {
          selectedGroups: Array.from(selectedGroups),
          selectedTracks: Array.from(selectedTracks),
          importUserPermissions: importUserPermissions,
          createMissingPlayers: createMissingPlayers,
          mergeStrategy: mergeStrategy,
          nodeEdits,
          playerEdits: collectPlayerEdits(),
          skippedPlayers: Array.from(skippedPlayers),
          deletedExistingNodes: existingNodeDeletions,
          trackEdits: collectTrackEdits(),
        },
      });

      clearInterval(progressInterval);
      importProgress = 1;

      if (result?.result === 'error') {
        uploadError =
          result.message || result.error || $_('pages.migration.authme.error-import-failed');
        return;
      }

      if (result) {
        importResult = result;
        currentStep = 'result';
      }
    } catch (error) {
      clearInterval(progressInterval);
      uploadError = error.message || $_('pages.migration.authme.error-import-failed');
    } finally {
      isImporting = false;
    }
  }

  function resetForm() {
    configFile = null;
    dbFile = null;
    showDatabaseUpload = false;
    detectedBackend = '';
    dbConnectionInfo = null;
    isProcessing = false;
    uploadProgress = 0;
    currentStep = 'upload';
    previewData = null;
    selectedGroups = new Set();
    selectedTracks = new Set();
    mergeStrategy = 'merge';
    importUserPermissions = true;
    createMissingPlayers = true;
    isImporting = false;
    importProgress = 0;
    importResult = null;
    uploadError = null;
    expandedGroups = new Set();
    expandedPlayers = new Set();
    expandedTracks = new Set();
    trackChains = {};
    trackDescriptions = {};
    trackGroupToAdd = '';
    trackSearchQuery = '';
    trackPage = 1;
    groupNodes = {};
    userNodes = {};
    removedEdits = [];
    existingNodeDeletions = [];
    playerUsernames = {};
    skippedPlayers = new Set();
    groupSearchQuery = '';
    playerSearchQuery = '';
    groupPage = 1;
    playerPage = 1;
  }
</script>
