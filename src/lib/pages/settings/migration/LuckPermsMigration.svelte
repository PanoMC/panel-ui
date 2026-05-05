<style>
  .fs-7 {
    font-size: 0.85rem;
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

  <label class="form-label" for="lpUploadConfig">{$_('pages.migration.authme.upload-config')}</label>
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
      <label class="form-label" for="lpUploadDb">{$_('pages.migration.luckperms.h2-database-label')}</label>
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
            <label class="form-label small mb-1" for="dbHost">{$_('pages.migration.authme.host')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbHost"
              bind:value={dbConnectionInfo.host} />
          </div>
          <div class="col-12 col-sm-4">
            <label class="form-label small mb-1" for="dbPort">{$_('pages.migration.authme.port')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbPort"
              bind:value={dbConnectionInfo.port} />
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbName">{$_('pages.migration.authme.database')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbName"
              bind:value={dbConnectionInfo.database} />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbPrefix">{$_('pages.migration.luckperms.table-prefix')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbPrefix"
              bind:value={dbConnectionInfo.tablePrefix} />
          </div>
        </div>
        <div class="row g-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbUser">{$_('pages.migration.authme.username')}</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbUser"
              bind:value={dbConnectionInfo.username} />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbPass">{$_('pages.migration.authme.password')}</label>
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
  <div class="mb-4">
    <div class="row align-items-center mb-3">
      <div class="col-9">
        <label class="fw-bold mb-0" for="strategyMerge">
          {$_('pages.migration.luckperms.strategy-merge')}
        </label>
        <small class="d-block opacity-75">{$_('pages.migration.luckperms.strategy-merge-desc')}</small>
      </div>
      <div class="col-3 text-end">
        <div class="form-check form-check-inline me-0">
          <input
            class="form-check-input"
            type="radio"
            name="mergeStrategy"
            id="strategyMerge"
            value="merge"
            bind:group={mergeStrategy} />
        </div>
      </div>
    </div>

    <div class="row align-items-center">
      <div class="col-9">
        <label class="fw-bold mb-0" for="strategyReplace">
          {$_('pages.migration.luckperms.strategy-replace')}
        </label>
        <small class="d-block opacity-75">{$_('pages.migration.luckperms.strategy-replace-desc')}</small>
      </div>
      <div class="col-3 text-end">
        <div class="form-check form-check-inline me-0">
          <input
            class="form-check-input"
            type="radio"
            name="mergeStrategy"
            id="strategyReplace"
            value="replace"
            bind:group={mergeStrategy} />
        </div>
      </div>
    </div>
  </div>

  {#if previewData.existingPanoNodeCount > 0}
    <div class="alert alert-warning mb-3">
      <i class="fas fa-exclamation-triangle me-1"></i>
      {$_('pages.migration.luckperms.existing-data-warning', {
        values: {
          groupCount: previewData.existingPanoGroupCount,
          nodeCount: previewData.existingPanoNodeCount,
        },
      })}
    </div>
  {/if}

  <hr />

  <!-- Groups Table -->
  <div class="card mb-3">
    <CardHeader>
      <div slot="left">
        <span class="me-3"><strong>{$_('pages.migration.luckperms.groups-title')}</strong></span>
        <span class="badge text-bg-success me-2">{previewData.newGroupCount} {$_('pages.migration.authme.status-new')}</span>
        <span class="badge text-bg-warning">{previewData.existingGroupCount} {$_('pages.migration.authme.status-existing')}</span>
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
                  checked={selectedGroups.size === previewData.groups.length}
                  on:change={toggleAllGroups} />
              </th>
              <th class="align-middle text-nowrap" scope="col">{$_('pages.migration.luckperms.header-group')}</th>
              <th class="align-middle text-nowrap" scope="col">{$_('pages.migration.luckperms.header-status')}</th>
              <th class="align-middle text-nowrap" scope="col">{$_('pages.migration.luckperms.header-permissions')}</th>
              <th class="align-middle text-nowrap" scope="col" style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedGroups as group}
              <tr>
                <td>
                  <input
                    type="checkbox"
                    class="form-check-input"
                    checked={selectedGroups.has(group.name)}
                    on:change={() => toggleGroup(group.name)} />
                </td>
                <td class="fw-semibold">{group.name}</td>
                <td>
                  {#if group.status === 'new'}
                    <span class="badge text-bg-success">{$_('pages.migration.authme.status-new')}</span>
                  {:else}
                    <span class="badge text-bg-warning">{$_('pages.migration.authme.status-existing')}</span>
                  {/if}
                </td>
                <td>
                  <span class="badge text-bg-primary">{$_('pages.migration.luckperms.nodes-count', { values: { count: group.nodeCount } })}</span>
                </td>
                <td class="text-end">
                  {#if group.nodeCount > 0}
                    <button
                      class="btn btn-link text-body p-0 border-0"
                      on:click={() => toggleGroupExpand(group.name)}
                      title={expandedGroups.has(group.name) ? $_('buttons.show-less-details') : $_('buttons.show-more-details')}
                      aria-label={expandedGroups.has(group.name) ? $_('buttons.show-less-details') : $_('buttons.show-more-details')}>
                      <i class="fas fa-chevron-{expandedGroups.has(group.name) ? 'up' : 'down'}"></i>
                    </button>
                  {/if}
                </td>
              </tr>
              {#if expandedGroups.has(group.name)}
                <tr>
                  <td colspan="5" class="p-0">
                    <div class="bg-body-tertiary p-3 border-top">
                      <table class="table table-sm mb-0 small">
                        <thead>
                          <tr class="opacity-75">
                            <th>{$_('pages.migration.luckperms.header-permission')}</th>
                            <th style="width: 60px;">{$_('pages.migration.luckperms.header-value')}</th>
                            <th style="width: 80px;">{$_('pages.migration.luckperms.header-server')}</th>
                            <th style="width: 80px;">{$_('pages.migration.luckperms.header-world')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each getGroupNodes(group.name) as node}
                            <tr>
                              <td><code class="user-select-all">{node.permission}</code></td>
                              <td>
                                {#if node.value}
                                  <i class="fas fa-check text-success"></i>
                                {:else}
                                  <i class="fas fa-times text-danger"></i>
                                {/if}
                              </td>
                              <td class="opacity-75">{node.server === 'global' ? '—' : node.server}</td>
                              <td class="opacity-75">{node.world === 'global' ? '—' : node.world}</td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer">
      <Pagination
        page={groupPage}
        totalPage={totalGroupPages}
        on:firstPageClick={() => (groupPage = 1)}
        on:lastPageClick={() => (groupPage = totalGroupPages)}
        on:pageLinkClick={(e) => (groupPage = e.detail.page)} />
    </div>
  </div>

  <!-- Tracks Table -->
  {#if previewData.tracks && previewData.tracks.length > 0}
    <div class="card mb-3">
      <CardHeader>
        <div slot="left">
          <span class="me-3"><strong>{$_('pages.migration.luckperms.tracks-title')}</strong></span>
          <span class="badge text-bg-primary">{previewData.totalTrackCount}</span>
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
                    checked={selectedTracks.size === previewData.tracks.length}
                    on:change={toggleAllTracks} />
                </th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.migration.luckperms.header-track')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.migration.luckperms.header-status')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.migration.luckperms.header-groups')}</th>
              </tr>
            </thead>
            <tbody>
              {#each previewData.tracks as track}
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      class="form-check-input"
                      checked={selectedTracks.has(track.name)}
                      on:change={() => toggleTrack(track.name)} />
                  </td>
                  <td class="fw-semibold">{track.name}</td>
                  <td>
                    {#if track.status === 'new'}
                      <span class="badge text-bg-success">{$_('pages.migration.authme.status-new')}</span>
                    {:else}
                      <span class="badge text-bg-warning">{$_('pages.migration.authme.status-existing')}</span>
                    {/if}
                  </td>
                  <td>
                    {#each track.groups as g}
                      <span class="badge text-bg-secondary me-1">{g}</span>
                    {/each}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- User Permissions Section -->
  {#if previewData.players && previewData.players.length > 0}
    {@const panoPlayers = previewData.players.filter((p) => p.existsInPano)}
    {@const missingPlayers = previewData.players.filter((p) => !p.existsInPano)}
    
    <div class="card mb-3">
      <CardHeader>
        <div slot="left">
          <span class="me-3"><strong>{$_('pages.migration.luckperms.user-perms-title')}</strong></span>
          <span class="badge text-bg-success me-2">{panoPlayers.length} {$_('pages.migration.luckperms.in-pano')}</span>
          {#if missingPlayers.length > 0}
            <span class="badge text-bg-danger">{missingPlayers.length} {$_('pages.migration.luckperms.not-in-pano')}</span>
          {/if}
        </div>
      </CardHeader>
      <div class="card-body pb-3">
        <div class="row align-items-center">
          <div class="col-9">
            <label class="fw-bold mb-0" for="importUserPerms">
              {$_('pages.migration.luckperms.import-user-perms')}
            </label>
            <small class="d-block opacity-75">{$_('pages.migration.luckperms.import-user-perms-desc')}</small>
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

        {#if previewData.panoPlayerCount === 0}
          <div class="alert alert-warning mb-0 mt-3">
            <i class="fas fa-exclamation-triangle me-1"></i>
            {$_('pages.migration.luckperms.no-pano-players-warning')}
          </div>
        {:else if missingPlayers.length > 0}
          <div class="alert alert-info mb-0 mt-3">
            <i class="fas fa-info-circle me-1"></i>
            {$_('pages.migration.luckperms.missing-players-info', {
              values: {
                count: missingPlayers.length,
                total: previewData.players.length,
              },
            })}
          </div>
        {/if}
      </div>

      {#if importUserPermissions}
        <div class="table-responsive border-top" style="max-height: 400px;">
          <table class="table table-hover mb-0">
            <thead class="sticky-top bg-body" style="z-index: 1;">
              <tr>
                <th style="width: 40px;"></th>
                <th>{$_('pages.migration.luckperms.header-player')}</th>
                <th>{$_('pages.migration.luckperms.header-primary-group')}</th>
                <th class="text-center">{$_('pages.migration.luckperms.header-nodes')}</th>
                <th class="text-center">{$_('pages.migration.luckperms.header-status')}</th>
              </tr>
            </thead>
            <tbody>
              {#each previewData.players as player}
                <tr class={!player.existsInPano ? 'opacity-50' : ''}>
                  <td>
                    {#if player.permissionCount > 0}
                      <button
                        class="btn btn-link text-body p-0 border-0"
                        on:click={() => togglePlayerExpand(player.uuid)}
                        title={expandedPlayers.has(player.uuid) ? $_('buttons.show-less-details') : $_('buttons.show-more-details')}
                        aria-label={expandedPlayers.has(player.uuid) ? $_('buttons.show-less-details') : $_('buttons.show-more-details')}>
                        <i class="fas fa-chevron-{expandedPlayers.has(player.uuid) ? 'up' : 'down'} fs-7"></i>
                      </button>
                    {/if}
                  </td>
                  <td class="fw-semibold">
                    {player.username}
                    <div class="small opacity-75 fw-normal">{player.uuid}</div>
                  </td>
                  <td><span class="badge text-bg-secondary">{player.primaryGroup}</span></td>
                  <td class="text-center"><span class="badge text-bg-primary">{player.permissionCount}</span></td>
                  <td class="text-center">
                    {#if player.existsInPano}
                      <span class="text-success small fw-bold"><i class="fas fa-check me-2"></i>{$_('pages.migration.luckperms.will-import')}</span>
                    {:else}
                      <span class="text-muted small"><i class="fas fa-ban me-2"></i>{$_('pages.migration.luckperms.will-skip')}</span>
                    {/if}
                  </td>
                </tr>
                {#if expandedPlayers.has(player.uuid)}
                  <tr>
                    <td colspan="5" class="p-0">
                      <div class="bg-body-tertiary p-3 border-top">
                        <table class="table table-sm mb-0 small">
                          <thead>
                            <tr class="opacity-75">
                              <th>{$_('pages.migration.luckperms.header-permission')}</th>
                              <th style="width: 60px;">{$_('pages.migration.luckperms.header-value')}</th>
                              <th style="width: 80px;">{$_('pages.migration.luckperms.header-server')}</th>
                              <th style="width: 80px;">{$_('pages.migration.luckperms.header-world')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each getPlayerNodes(player.uuid) as node}
                              <tr>
                                <td><code class="user-select-all">{node.permission}</code></td>
                                <td>
                                  {#if node.value}
                                    <i class="fas fa-check text-success"></i>
                                  {:else}
                                    <i class="fas fa-times text-danger"></i>
                                  {/if}
                                </td>
                                <td class="opacity-75">{node.server === 'global' ? '—' : node.server}</td>
                                <td class="opacity-75">{node.world === 'global' ? '—' : node.world}</td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
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

  <div class="mt-4 d-flex gap-2">
    <button
      class="btn btn-secondary"
      on:click={importData}
      disabled={(selectedGroups.size === 0 && selectedTracks.size === 0) || isImporting}>
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
        <strong>{importResult.importedGroups}</strong> {$_('pages.migration.luckperms.import-summary-groups')}{#if importResult.updatedGroups > 0},
          <strong>{importResult.updatedGroups}</strong> {$_('pages.migration.luckperms.import-summary-updated')}{/if},
        <strong>{importResult.importedGroupNodes}</strong> {$_('pages.migration.luckperms.import-summary-group-nodes')},
        <strong>{importResult.importedUserNodes}</strong> {$_('pages.migration.luckperms.import-summary-user-nodes')}
        {#if importResult.importedTracks > 0},
          <strong>{importResult.importedTracks}</strong> {$_('pages.migration.luckperms.import-summary-tracks')}{/if}
        {#if importResult.skippedNodes > 0},
          <strong>{importResult.skippedNodes}</strong> {$_('pages.migration.luckperms.import-summary-skipped')}{/if}.
      </p>
    </div>
  </div>

  {#if importResult?.errors && importResult.errors.length > 0}
    <div class="alert alert-warning mt-3">
      <h6 class="alert-heading mb-2">
        <i class="fas fa-exclamation-triangle me-1"></i> {$_('pages.migration.authme.some-issues-occurred')}
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

  export { resetForm, importData, uploadAndPreview };

  // ── Mock Data ──
  const MOCK_ENABLED = false;

  const mockConfigFile = new File(['storage-method: H2\n'], 'config.yml', {
    type: 'application/x-yaml',
  });
  Object.defineProperty(mockConfigFile, 'size', { value: 3456 });

  const mockDbFile = new File([''], 'luckperms-h2-v2.mv.db', {
    type: 'application/x-sqlite3',
  });
  Object.defineProperty(mockDbFile, 'size', { value: 1048576 });

  const mockPreviewData = {
    newGroupCount: 3,
    existingGroupCount: 1,
    totalTrackCount: 2,
    panoPlayerCount: 2,
    existingPanoNodeCount: 5,
    existingPanoGroupCount: 2,
    groups: [
      { name: 'admin', status: 'new', nodeCount: 12 },
      { name: 'mod', status: 'new', nodeCount: 8 },
      { name: 'default', status: 'existing', nodeCount: 4 },
      { name: 'vip', status: 'new', nodeCount: 6 },
    ],
    groupPermissions: [
      {
        groupName: 'admin',
        permission: 'pano.admin',
        value: true,
        server: 'global',
        world: 'global',
      },
      {
        groupName: 'admin',
        permission: 'minecraft.command.op',
        value: true,
        server: 'global',
        world: 'global',
      },
      { groupName: 'mod', permission: 'pano.mod', value: true, server: 'lobby', world: 'global' },
      {
        groupName: 'default',
        permission: 'pano.user',
        value: true,
        server: 'global',
        world: 'global',
      },
    ],
    tracks: [
      { name: 'staff', status: 'new', groups: ['helper', 'mod', 'admin'] },
      { name: 'donator', status: 'existing', groups: ['vip', 'vip+', 'mvp'] },
    ],
    players: [
      {
        username: 'selim',
        uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        primaryGroup: 'admin',
        permissionCount: 2,
        existsInPano: true,
      },
      {
        username: 'testuser',
        uuid: '12345678-1234-1234-1234-123456789012',
        primaryGroup: 'default',
        permissionCount: 0,
        existsInPano: true,
      },
      {
        username: 'external_hero',
        uuid: '87654321-4321-4321-4321-210987654321',
        primaryGroup: 'default',
        permissionCount: 1,
        existsInPano: false,
      },
    ],
    userPermissions: [
      {
        uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        permission: 'special.access',
        value: true,
        server: 'global',
        world: 'global',
      },
      {
        uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        permission: 'debug.mode',
        value: false,
        server: 'dev',
        world: 'test',
      },
      {
        uuid: '87654321-4321-4321-4321-210987654321',
        permission: 'temporary.permit',
        value: true,
        server: 'global',
        world: 'global',
      },
    ],
  };

  // File upload states
  export let configFile = MOCK_ENABLED ? mockConfigFile : null;
  export let dbFile = MOCK_ENABLED ? mockDbFile : null;
  export let showDatabaseUpload = MOCK_ENABLED ? true : false;
  export let detectedBackend = MOCK_ENABLED ? 'H2' : '';
  export let dbConnectionInfo = null;
  export let isProcessing = false;
  export let uploadProgress = 0;

  // Migration flow states
  export let currentStep = MOCK_ENABLED ? 'review' : 'upload'; // 'upload' | 'review' | 'result'
  export let previewData = MOCK_ENABLED ? mockPreviewData : null;
  export let selectedGroups = MOCK_ENABLED
    ? new Set(mockPreviewData.groups.map((g) => g.name))
    : new Set();
  export let selectedTracks = MOCK_ENABLED
    ? new Set(mockPreviewData.tracks.map((t) => t.name))
    : new Set();
  export let mergeStrategy = 'merge'; // 'merge' or 'replace'
  export let importUserPermissions = true;
  export let isImporting = false;
  export let importProgress = 0;
  export let importResult = null;
  export let uploadError = null;
  export let expandedGroups = new Set();
  export let expandedPlayers = new Set();

  // Search & Pagination for groups (AuthMe style consistency)
  export let groupSearchQuery = '';
  let groupPage = 1;
  let itemsPerPage = 10;

  $: if (groupSearchQuery) groupPage = 1;

  $: filteredGroups =
    previewData?.groups?.filter((g) => {
      if (!groupSearchQuery.trim()) return true;
      return g.name.toLowerCase().includes(groupSearchQuery.toLowerCase());
    }) ?? [];

  $: paginatedGroups = filteredGroups.slice(
    (groupPage - 1) * itemsPerPage,
    groupPage * itemsPerPage,
  );
  $: totalGroupPages = Math.ceil(filteredGroups.length / itemsPerPage);

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

  // Group selection
  function toggleGroup(name) {
    if (selectedGroups.has(name)) {
      selectedGroups.delete(name);
    } else {
      selectedGroups.add(name);
    }
    selectedGroups = new Set(selectedGroups);
  }

  function toggleAllGroups() {
    if (selectedGroups.size === previewData.groups.length) {
      selectedGroups = new Set();
    } else {
      selectedGroups = new Set(previewData.groups.map((g) => g.name));
    }
  }

  function selectAllGroups() {
    selectedGroups = new Set(previewData.groups.map((g) => g.name));
  }

  function deselectAllGroups() {
    selectedGroups = new Set();
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

  function getGroupNodes(groupName) {
    if (!previewData || !previewData.groupPermissions) return [];
    return previewData.groupPermissions.filter((p) => p.groupName === groupName);
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

  function getPlayerNodes(uuid) {
    if (!previewData || !previewData.userPermissions) return [];
    return previewData.userPermissions.filter((p) => p.uuid === uuid);
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

  function toggleAllTracks() {
    if (selectedTracks.size === previewData.tracks.length) {
      selectedTracks = new Set();
    } else {
      selectedTracks = new Set(previewData.tracks.map((t) => t.name));
    }
  }

  function selectAllTracks() {
    selectedTracks = new Set(previewData.tracks.map((t) => t.name));
  }

  function deselectAllTracks() {
    selectedTracks = new Set();
  }

  // Step 3: Import
  async function importData() {
    isImporting = true;
    importProgress = 0;

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
      const result = await ApiUtil.post({
        path: '/api/panel/migration/luckperms/import',
        body: {
          selectedGroups: Array.from(selectedGroups),
          selectedTracks: Array.from(selectedTracks),
          importUserPermissions: importUserPermissions,
          mergeStrategy: mergeStrategy,
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
    isImporting = false;
    importProgress = 0;
    importResult = null;
    uploadError = null;
    expandedGroups = new Set();
    expandedPlayers = new Set();
  }
</script>

