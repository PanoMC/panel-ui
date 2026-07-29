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
  <div class="mb-4">
    <div class="row align-items-center mb-3">
      <div class="col-9">
        <label class="fw-bold mb-0" for="strategyMerge">
          {$_('pages.migration.luckperms.strategy-merge')}
        </label>
        <small class="d-block opacity-75"
          >{$_('pages.migration.luckperms.strategy-merge-desc')}</small>
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
        <small class="d-block opacity-75"
          >{$_('pages.migration.luckperms.strategy-replace-desc')}</small>
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

  <div class="alert alert-secondary d-flex flex-wrap gap-3 mb-3">
    <span
      ><span class="badge text-bg-success me-1">&nbsp;</span>{$_(
        'pages.migration.luckperms.legend-new',
      )}</span>
    <span
      ><span class="badge text-bg-warning me-1">&nbsp;</span>{$_(
        'pages.migration.luckperms.legend-overwrite',
      )}</span>
    <span
      ><span class="badge text-bg-info me-1">&nbsp;</span>{$_(
        'pages.migration.luckperms.legend-edited',
      )}</span>
    <span
      ><span class="badge text-bg-secondary me-1">&nbsp;</span>{$_(
        'pages.migration.luckperms.legend-unchanged',
      )}</span>
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
                    <span class="badge text-bg-success"
                      >{$_('pages.migration.authme.status-new')}</span>
                  {:else}
                    <span class="badge text-bg-warning"
                      >{$_('pages.migration.authme.status-existing')}</span>
                  {/if}
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
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.migration.luckperms.header-track')}</th>
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.migration.luckperms.header-status')}</th>
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.migration.luckperms.header-groups')}</th>
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
                      <span class="badge text-bg-success"
                        >{$_('pages.migration.authme.status-new')}</span>
                    {:else}
                      <span class="badge text-bg-warning"
                        >{$_('pages.migration.authme.status-existing')}</span>
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
                <tr class={skippedPlayers.has(player.uuid) ? 'opacity-50' : playerRowClass(status)}>
                  <td>
                    <input
                      type="checkbox"
                      class="form-check-input"
                      title={$_('pages.migration.luckperms.include-player')}
                      aria-label={$_('pages.migration.luckperms.include-player')}
                      checked={!skippedPlayers.has(player.uuid)}
                      on:change={() => togglePlayer(player.uuid)} />
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
                      on:input={(e) => setPlayerUsername(player, e.currentTarget.value)} />
                    <div class="small opacity-75 fw-normal mt-1">{player.uuid}</div>
                    {#if player.panoUsername && player.panoUsername !== playerUsername(player)}
                      <div class="small opacity-75 fw-normal">
                        <i class="fas fa-link me-1"></i>{player.panoUsername}
                      </div>
                    {/if}
                  </td>
                  <td><span class="badge text-bg-secondary">{player.primaryGroup}</span></td>
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
            </tbody>
          </table>
        </div>
        <div class="card-footer">
          <Pagination
            page={playerPage}
            totalPage={totalPlayerPages}
            on:firstPageClick={() => (playerPage = 1)}
            on:lastPageClick={() => (playerPage = totalPlayerPages)}
            on:pageLinkClick={(e) => (playerPage = e.detail.page)} />
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
  let itemsPerPage = 10;

  // Search & pagination for players. Both are required rather than cosmetic: a busy server can
  // export tens of thousands of players and rendering them all at once locks up the browser.
  export let playerSearchQuery = '';
  let playerPage = 1;

  $: if (groupSearchQuery) groupPage = 1;
  $: if (playerSearchQuery) playerPage = 1;

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

  $: filteredPlayers =
    previewData?.players?.filter((p) => {
      if (!playerSearchQuery.trim()) return true;
      const query = playerSearchQuery.toLowerCase();
      return (
        p.username.toLowerCase().includes(query) || (p.uuid ?? '').toLowerCase().includes(query)
      );
    }) ?? [];

  $: totalPlayerPages = Math.max(1, Math.ceil(filteredPlayers.length / itemsPerPage));
  $: if (playerPage > totalPlayerPages) playerPage = totalPlayerPages;
  $: paginatedPlayers = filteredPlayers.slice(
    (playerPage - 1) * itemsPerPage,
    playerPage * itemsPerPage,
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

    Object.assign(target, normalise(perm), { _incoming: true });
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

          if (node._match) {
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

  function playerStatus(player) {
    if (!player.existsInPano) return 'new';

    const renamed = playerUsername(player) !== player.username;
    const nodes = userNodes[player.uuid] ?? [];
    const changed = nodes.some(
      (node) => node._origin === 'added' || (node._incoming && node._before) || isNodeEdited(node),
    );

    return renamed || changed ? 'changed' : 'existing';
  }

  function playerRowClass(status) {
    switch (status) {
      case 'new':
        return 'table-success';
      case 'changed':
        return 'table-warning';
      default:
        return '';
    }
  }

  function playerBadgeClass(status) {
    switch (status) {
      case 'new':
        return 'text-bg-success';
      case 'changed':
        return 'text-bg-warning';
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
