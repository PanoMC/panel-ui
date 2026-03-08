<style>
  .file-drop-zone {
    border: 2px dashed var(--bs-border-color);
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: var(--bs-body-bg);
  }

  .file-drop-zone:hover {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
  }

  .file-drop-zone.drag-over {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    border-style: solid;
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.15);
  }

  .file-drop-zone.has-file {
    border-color: var(--bs-success);
    background-color: rgba(var(--bs-success-rgb), 0.05);
  }

  .file-drop-zone.has-file:hover {
    background-color: rgba(var(--bs-success-rgb), 0.1);
  }

  /* Dark theme support */
  :global([data-bs-theme='dark']) .file-drop-zone {
    background-color: var(--bs-dark);
  }

  :global([data-bs-theme='dark']) .file-drop-zone:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
  }

  :global([data-bs-theme='dark']) .file-drop-zone.drag-over {
    background-color: rgba(var(--bs-primary-rgb), 0.15);
  }

  :global([data-bs-theme='dark']) .file-drop-zone.has-file {
    background-color: rgba(var(--bs-success-rgb), 0.1);
  }

  /* Expandable row styling */
  .expand-btn {
    background: none;
    border: none;
    color: var(--bs-body-color);
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
    cursor: pointer;
    line-height: 1;
    transition: all 0.15s ease;
    opacity: 0.6;
  }

  .expand-btn:hover {
    opacity: 1;
    background-color: rgba(var(--bs-primary-rgb), 0.1);
  }

  .node-detail-panel {
    background-color: var(--bs-tertiary-bg);
    border-top: 1px solid var(--bs-border-color);
  }

  .player-row {
    cursor: pointer;
  }

  .player-row:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.04);
  }

  .player-row.missing {
    opacity: 0.7;
  }
</style>

{#if currentStep === 'upload'}
  <!-- Step 1: File Upload Section -->

  <div class="alert alert-info mb-4 small">
    <i class="fas fa-info-circle me-1"></i>
    <strong>{$_('pages.migration.luckperms.supported-info-title')}</strong>
    <ul class="mb-0 mt-1">
      <li>{$_('pages.migration.luckperms.supported-backends')}</li>
      <li>{$_('pages.migration.luckperms.supported-data')}</li>
      <li>{$_('pages.migration.luckperms.merge-note')}</li>
    </ul>
  </div>

  <div class="mb-4">
    <label class="form-label" for="lpUploadConfig">Upload config.yml</label>
    <div
      class="file-drop-zone {configDragOver ? 'drag-over' : ''} {configFile
        ? 'has-file'
        : ''}"
      role="button"
      tabindex="0"
      on:dragover|preventDefault={() => (configDragOver = true)}
      on:dragleave|preventDefault={() => (configDragOver = false)}
      on:drop|preventDefault={handleConfigDrop}
      on:click={() => configFileInput.click()}
      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') configFileInput.click(); }}>
      {#if configFile}
        <i class="fas fa-file-alt text-success fs-1"></i>
        <p class="mb-1 fw-semibold">{configFile.name}</p>
        <p class="small mb-2">
          {(configFile.size / 1024).toFixed(2)} KB
        </p>
        <button
          class="btn btn-sm btn-outline-danger"
          on:click|stopPropagation={removeConfigFile}>
          <i class="fas fa-trash"></i> Remove
        </button>
      {:else}
        <i class="fas fa-cloud-upload-alt fs-1"></i>
        <p class="mb-1">Drag and drop your file here</p>
        <p class="small">or click to browse</p>
      {/if}
    </div>
    <input
      id="lpUploadConfig"
      type="file"
      bind:this={configFileInput}
      on:change={handleConfigFileSelect}
      accept=".yml,.yaml"
      class="d-none" />
  </div>

  <!-- H2 Database Section (conditional) -->
  {#if showDatabaseUpload}
    <div class="mb-4">
      <label class="form-label fw-semibold" for="lpDbFile">H2 Database (luckperms-h2-v2.mv.db)</label>
      <p class="small mb-2">
        <i class="fas fa-info-circle"></i> Your config.yml indicates H2 is used. Please upload your database file.
      </p>
      <div
        class="file-drop-zone {dbDragOver ? 'drag-over' : ''} {dbFile ? 'has-file' : ''}"
        role="button"
        tabindex="0"
        on:dragover|preventDefault={() => (dbDragOver = true)}
        on:dragleave|preventDefault={() => (dbDragOver = false)}
        on:drop|preventDefault={handleDbDrop}
        on:click={() => dbFileInput.click()}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') dbFileInput.click(); }}>
        {#if dbFile}
          <i class="fas fa-database text-success fs-1"></i>
          <p class="mb-1 fw-semibold">{dbFile.name}</p>
          <p class="small mb-2">
            {(dbFile.size / 1024).toFixed(2)} KB
          </p>
          <button
            class="btn btn-sm btn-outline-danger"
            on:click|stopPropagation={removeDbFile}>
            <i class="fas fa-trash"></i> Remove
          </button>
        {:else}
          <i class="fas fa-cloud-upload-alt fs-1"></i>
          <p class="mb-1">
            Drag and drop your <strong>H2 database</strong> here
          </p>
          <p class="small">or click to browse</p>
        {/if}
      </div>
      <input
        id="lpDbFile"
        type="file"
        bind:this={dbFileInput}
        on:change={handleDbFileSelect}
        accept=".db,.mv.db"
        class="d-none" />
    </div>
  {/if}

  <!-- Connection details for MySQL/MariaDB -->
  {#if configFile && dbConnectionInfo}
    <div class="card mb-3 border-warning">
      <div class="card-header py-2">
        <i class="fas fa-database text-warning me-1"></i>
        <strong>{detectedBackend}</strong> — {$_('pages.migration.luckperms.db-connect-info')}
      </div>
      <div class="card-body py-3">
        <div class="row g-2 mb-2">
          <div class="col-8">
            <label class="form-label small mb-1" for="lpDbHost">Host</label>
            <input type="text" class="form-control form-control-sm" id="lpDbHost" bind:value={dbConnectionInfo.host} />
          </div>
          <div class="col-4">
            <label class="form-label small mb-1" for="lpDbPort">Port</label>
            <input type="text" class="form-control form-control-sm" id="lpDbPort" bind:value={dbConnectionInfo.port} />
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6">
            <label class="form-label small mb-1" for="lpDbName">Database</label>
            <input type="text" class="form-control form-control-sm" id="lpDbName" bind:value={dbConnectionInfo.database} />
          </div>
          <div class="col-6">
            <label class="form-label small mb-1" for="lpDbPrefix">Table Prefix</label>
            <input type="text" class="form-control form-control-sm" id="lpDbPrefix" bind:value={dbConnectionInfo.tablePrefix} />
          </div>
        </div>
        <div class="row g-2">
          <div class="col-6">
            <label class="form-label small mb-1" for="lpDbUser">Username</label>
            <input type="text" class="form-control form-control-sm" id="lpDbUser" bind:value={dbConnectionInfo.username} />
          </div>
          <div class="col-6">
            <label class="form-label small mb-1" for="lpDbPass">Password</label>
            <input type="password" class="form-control form-control-sm" id="lpDbPass" bind:value={dbConnectionInfo.password} />
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Upload/Connect button -->
  {#if configFile && !showDatabaseUpload}
    <button class="btn btn-primary" on:click={uploadAndPreview} disabled={isProcessing}>
      {#if isProcessing}
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      {/if}
      {#if dbConnectionInfo}
        <i class="fas fa-plug me-1"></i> Connect & Preview
      {:else}
        <i class="fas fa-upload me-1"></i> Upload & Preview
      {/if}
    </button>
  {/if}

  {#if isProcessing}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="text-body-secondary">Uploading & processing...</small>
        <small class="text-body-secondary">{Math.round(uploadProgress * 100)}%</small>
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
  <!-- Step 2: Review & Configure -->

  <!-- Merge Strategy -->
  <div class="card mb-3 border-warning">
    <div class="card-header">
      <i class="fas fa-cog text-warning me-2"></i>
      {$_('pages.migration.luckperms.merge-strategy-title')}
    </div>
    <div class="card-body">
      <p class="small text-body-secondary mb-3">
        {$_('pages.migration.luckperms.merge-strategy-desc')}
      </p>
      {#if previewData.existingPanoNodeCount > 0}
        <div class="alert alert-warning small mb-3">
          <i class="fas fa-exclamation-triangle me-1"></i>
          {$_('pages.migration.luckperms.existing-data-warning', { values: {
            groupCount: previewData.existingPanoGroupCount,
            nodeCount: previewData.existingPanoNodeCount
          }})}
        </div>
      {/if}
      <div class="form-check mb-2">
        <input
          class="form-check-input"
          type="radio"
          name="mergeStrategy"
          id="strategyMerge"
          value="merge"
          bind:group={mergeStrategy} />
        <label class="form-check-label" for="strategyMerge">
          <strong>{$_('pages.migration.luckperms.strategy-merge')}</strong>
          <br />
          <small class="text-body-secondary">{$_('pages.migration.luckperms.strategy-merge-desc')}</small>
        </label>
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="radio"
          name="mergeStrategy"
          id="strategyReplace"
          value="replace"
          bind:group={mergeStrategy} />
        <label class="form-check-label" for="strategyReplace">
          <strong class="text-danger">{$_('pages.migration.luckperms.strategy-replace')}</strong>
          <br />
          <small class="text-body-secondary">{$_('pages.migration.luckperms.strategy-replace-desc')}</small>
        </label>
      </div>
    </div>
  </div>

  <!-- Groups -->
  <div class="card mb-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>
        <i class="fas fa-layer-group me-2"></i>
        {$_('pages.migration.luckperms.groups-title')}
        <span class="badge bg-success ms-1">{previewData.newGroupCount} New</span>
        <span class="badge bg-warning text-dark ms-1">{previewData.existingGroupCount} Existing</span>
      </span>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" on:click={selectAllGroups}>
          {$_('buttons.select-all')}
        </button>
        <button class="btn btn-sm btn-outline-secondary" on:click={deselectAllGroups}>
          {$_('buttons.deselect-all')}
        </button>
      </div>
    </div>
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
              <th class="align-middle text-nowrap" scope="col">Group</th>
              <th class="align-middle text-nowrap" scope="col">Status</th>
              <th class="align-middle text-nowrap" scope="col">Permissions</th>
              <th class="align-middle text-nowrap" scope="col" style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody>
            {#each previewData.groups as group}
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
                    <span class="badge bg-success">New</span>
                  {:else}
                    <span class="badge bg-warning text-dark">Existing</span>
                  {/if}
                </td>
                <td>
                  <span class="badge bg-secondary">{group.nodeCount} nodes</span>
                </td>
                <td>
                  {#if group.nodeCount > 0}
                    <button
                      class="expand-btn"
                      on:click={() => toggleGroupExpand(group.name)}
                      title="Show/hide permission nodes">
                      <i class="fas fa-chevron-{expandedGroups.has(group.name) ? 'up' : 'down'} small"></i>
                    </button>
                  {/if}
                </td>
              </tr>
              {#if expandedGroups.has(group.name)}
                <tr>
                  <td colspan="5" class="p-0">
                    <div class="node-detail-panel p-2" style="max-height: 300px; overflow-y: auto;">
                      <table class="table table-sm mb-0 small">
                        <thead>
                          <tr class="text-body-secondary">
                            <th>Permission</th>
                            <th style="width: 60px;">Value</th>
                            <th style="width: 80px;">Server</th>
                            <th style="width: 80px;">World</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each getGroupNodes(group.name) as node}
                            <tr>
                              <td><code class="text-body">{node.permission}</code></td>
                              <td>
                                {#if node.value}
                                  <span class="badge bg-success">✓</span>
                                {:else}
                                  <span class="badge bg-danger">✗</span>
                                {/if}
                              </td>
                              <td class="text-body-secondary">{node.server === 'global' ? '—' : node.server}</td>
                              <td class="text-body-secondary">{node.world === 'global' ? '—' : node.world}</td>
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
  </div>

  <!-- Tracks -->
  {#if previewData.tracks && previewData.tracks.length > 0}
    <div class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>
          <i class="fas fa-route me-2"></i>
          {$_('pages.migration.luckperms.tracks-title')}
          <span class="badge bg-secondary ms-1">{previewData.totalTrackCount}</span>
        </span>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" on:click={selectAllTracks}>
            {$_('buttons.select-all')}
          </button>
          <button class="btn btn-sm btn-outline-secondary" on:click={deselectAllTracks}>
            {$_('buttons.deselect-all')}
          </button>
        </div>
      </div>
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
                <th class="align-middle text-nowrap" scope="col">Track</th>
                <th class="align-middle text-nowrap" scope="col">Status</th>
                <th class="align-middle text-nowrap" scope="col">Groups</th>
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
                      <span class="badge bg-success">New</span>
                    {:else}
                      <span class="badge bg-warning text-dark">Existing</span>
                    {/if}
                  </td>
                  <td>
                    {#each track.groups as g}
                      <span class="badge border text-body-secondary me-1">{g}</span>
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

  <!-- User permissions -->
  {#if previewData.players && previewData.players.length > 0}
    {@const panoPlayers = previewData.players.filter(p => p.existsInPano)}
    {@const missingPlayers = previewData.players.filter(p => !p.existsInPano)}
    <div class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>
          <i class="fas fa-users me-2"></i>
          {$_('pages.migration.luckperms.user-perms-title')}
          <span class="badge bg-success ms-1">{panoPlayers.length} {$_('pages.migration.luckperms.in-pano')}</span>
          {#if missingPlayers.length > 0}
            <span class="badge bg-danger ms-1">{missingPlayers.length} {$_('pages.migration.luckperms.not-in-pano')}</span>
          {/if}
        </span>
      </div>
      <div class="card-body pb-2">
        <div class="form-check mb-3">
          <input
            class="form-check-input"
            type="checkbox"
            id="importUserPerms"
            bind:checked={importUserPermissions} />
          <label class="form-check-label" for="importUserPerms">
            <strong>{$_('pages.migration.luckperms.import-user-perms')}</strong>
            <br />
            <small class="text-body-secondary">{$_('pages.migration.luckperms.import-user-perms-desc')}</small>
          </label>
        </div>

        {#if previewData.panoPlayerCount === 0}
          <div class="alert alert-warning small mb-0">
            <i class="fas fa-exclamation-triangle me-1"></i>
            {$_('pages.migration.luckperms.no-pano-players-warning')}
          </div>
        {:else if missingPlayers.length > 0}
          <div class="alert alert-info small mb-0">
            <i class="fas fa-info-circle me-1"></i>
            {$_('pages.migration.luckperms.missing-players-info', { values: {
              count: missingPlayers.length,
              total: previewData.players.length
            }})}
          </div>
        {/if}
      </div>

      <!-- Player list (accordion-style) -->
      {#if importUserPermissions}
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
            <table class="table table-sm mb-0 small">
              <thead class="sticky-top" style="z-index: 1;">
                <tr>
                  <th class="align-middle" scope="col" style="width: 30px;"></th>
                  <th class="align-middle" scope="col">Player</th>
                  <th class="align-middle" scope="col">Primary Group</th>
                  <th class="align-middle text-center" scope="col">Permissions</th>
                  <th class="align-middle text-center" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each panoPlayers as player}
                  <tr
                    class="player-row"
                    on:click={() => player.permissionCount > 0 && togglePlayerExpand(player.uuid)}
                    on:keydown={(e) => { if (e.key === 'Enter' && player.permissionCount > 0) togglePlayerExpand(player.uuid); }}>
                    <td class="text-center">
                      {#if player.permissionCount > 0}
                        <button
                          class="expand-btn"
                          on:click|stopPropagation={() => togglePlayerExpand(player.uuid)}
                          title="Show/hide permissions">
                          <i class="fas fa-chevron-{expandedPlayers.has(player.uuid) ? 'up' : 'down'} small"></i>
                        </button>
                      {/if}
                    </td>
                    <td class="fw-semibold">
                      {player.username}
                      <span class="text-body-secondary fw-normal ms-1" style="font-size: 0.7rem;">{player.uuid}</span>
                    </td>
                    <td><span class="badge border text-body-secondary">{player.primaryGroup}</span></td>
                    <td class="text-center"><span class="badge bg-secondary">{player.permissionCount}</span></td>
                    <td class="text-center"><span class="badge bg-success"><i class="fas fa-check me-1"></i>{$_('pages.migration.luckperms.will-import')}</span></td>
                  </tr>
                  {#if expandedPlayers.has(player.uuid)}
                    <tr>
                      <td colspan="5" class="p-0">
                        <div class="node-detail-panel p-2" style="max-height: 250px; overflow-y: auto;">
                          <table class="table table-sm mb-0" style="font-size: 0.8rem;">
                            <thead>
                              <tr class="text-body-secondary">
                                <th>Permission</th>
                                <th style="width: 50px;">Value</th>
                                <th style="width: 70px;">Server</th>
                                <th style="width: 70px;">World</th>
                              </tr>
                            </thead>
                            <tbody>
                              {#each getPlayerNodes(player.uuid) as node}
                                <tr>
                                  <td><code class="text-body">{node.permission}</code></td>
                                  <td>
                                    {#if node.value}
                                      <span class="badge bg-success">✓</span>
                                    {:else}
                                      <span class="badge bg-danger">✗</span>
                                    {/if}
                                  </td>
                                  <td class="text-body-secondary">{node.server === 'global' ? '—' : node.server}</td>
                                  <td class="text-body-secondary">{node.world === 'global' ? '—' : node.world}</td>
                                </tr>
                              {/each}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
                {#each missingPlayers as player}
                  <tr
                    class="player-row missing"
                    on:click={() => player.permissionCount > 0 && togglePlayerExpand(player.uuid)}
                    on:keydown={(e) => { if (e.key === 'Enter' && player.permissionCount > 0) togglePlayerExpand(player.uuid); }}>
                    <td class="text-center">
                      {#if player.permissionCount > 0}
                        <button
                          class="expand-btn"
                          on:click|stopPropagation={() => togglePlayerExpand(player.uuid)}
                          title="Show/hide permissions">
                          <i class="fas fa-chevron-{expandedPlayers.has(player.uuid) ? 'up' : 'down'} small"></i>
                        </button>
                      {/if}
                    </td>
                    <td class="fw-semibold">
                      {player.username}
                      <span class="text-body-secondary fw-normal ms-1" style="font-size: 0.7rem;">{player.uuid}</span>
                    </td>
                    <td><span class="badge border text-body-secondary">{player.primaryGroup}</span></td>
                    <td class="text-center"><span class="badge bg-secondary">{player.permissionCount}</span></td>
                    <td class="text-center"><span class="badge bg-warning text-dark"><i class="fas fa-ban me-1"></i>{$_('pages.migration.luckperms.will-skip')}</span></td>
                  </tr>
                  {#if expandedPlayers.has(player.uuid)}
                    <tr>
                      <td colspan="5" class="p-0">
                        <div class="node-detail-panel p-2" style="max-height: 250px; overflow-y: auto;">
                          <table class="table table-sm mb-0" style="font-size: 0.8rem;">
                            <thead>
                              <tr class="text-body-secondary">
                                <th>Permission</th>
                                <th style="width: 50px;">Value</th>
                                <th style="width: 70px;">Server</th>
                                <th style="width: 70px;">World</th>
                              </tr>
                            </thead>
                            <tbody>
                              {#each getPlayerNodes(player.uuid) as node}
                                <tr>
                                  <td><code class="text-body">{node.permission}</code></td>
                                  <td>
                                    {#if node.value}
                                      <span class="badge bg-success">✓</span>
                                    {:else}
                                      <span class="badge bg-danger">✗</span>
                                    {/if}
                                  </td>
                                  <td class="text-body-secondary">{node.server === 'global' ? '—' : node.server}</td>
                                  <td class="text-body-secondary">{node.world === 'global' ? '—' : node.world}</td>
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
      {/if}
    </div>
  {/if}

  <!-- Actions -->
  <div class="mt-3 d-flex gap-2">
    <button class="btn btn-outline-secondary" on:click={resetForm} disabled={isImporting}>
      <i class="fas fa-arrow-left me-1"></i> Back
    </button>
    <button
      class="btn btn-primary"
      on:click={importData}
      disabled={selectedGroups.size === 0 || isImporting}>
      {#if isImporting}
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      {/if}
      <i class="fas fa-file-import me-1"></i> Import {selectedGroups.size} Groups
      {#if selectedTracks.size > 0}
        &amp; {selectedTracks.size} Tracks
      {/if}
    </button>
  </div>

  {#if isImporting}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="text-body-secondary">
          Importing permissions...
        </small>
        <small class="text-body-secondary">{Math.round(importProgress * 100)}%</small>
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

{:else if currentStep === 'result'}
  <!-- Step 3: Import Results -->
  <div class="alert alert-success d-flex align-items-center" role="alert">
    <i class="fas fa-check-circle fs-4 me-3"></i>
    <div>
      <h6 class="alert-heading mb-1">{$_('pages.migration.luckperms.result-title')}</h6>
      <p class="mb-0 small">
        <strong>{importResult.importedGroups}</strong> groups imported{#if importResult.updatedGroups > 0},
        <strong>{importResult.updatedGroups}</strong> updated{/if},
        <strong>{importResult.importedGroupNodes}</strong> group nodes,
        <strong>{importResult.importedUserNodes}</strong> user nodes
        {#if importResult.importedTracks > 0},
        <strong>{importResult.importedTracks}</strong> tracks{/if}
        {#if importResult.skippedNodes > 0},
        <strong>{importResult.skippedNodes}</strong> skipped{/if}.
      </p>
    </div>
  </div>

  {#if importResult.errors && importResult.errors.length > 0}
    <div class="alert alert-warning mt-3">
      <h6 class="alert-heading mb-2">
        <i class="fas fa-exclamation-triangle me-1"></i> Some issues occurred:
      </h6>
      <ul class="mb-0 small">
        {#each importResult.errors as err}
          <li><strong>{err.item}</strong>: {err.error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <button class="btn btn-primary mt-3" on:click={resetForm}>
    <i class="fas fa-redo me-2"></i>
    Start New Migration
  </button>

{/if}

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';

  // File upload states
  let configFileInput;
  let dbFileInput;
  let configFile = null;
  let dbFile = null;
  let configDragOver = false;
  let dbDragOver = false;
  let showDatabaseUpload = false;
  let detectedBackend = '';
  let dbConnectionInfo = null;
  let isProcessing = false;
  let uploadProgress = 0;

  // Migration flow states
  let currentStep = 'upload'; // 'upload' | 'review' | 'result'
  let previewData = null;
  let selectedGroups = new Set();
  let selectedTracks = new Set();
  let mergeStrategy = 'merge'; // 'merge' or 'replace'
  let importUserPermissions = true;
  let isImporting = false;
  let importProgress = 0;
  let importResult = null;
  let uploadError = null;
  let expandedGroups = new Set();
  let expandedPlayers = new Set();

  // Config file handlers
  function handleConfigDrop(e) {
    configDragOver = false;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleConfigFile(files[0]);
    }
  }

  function handleConfigFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleConfigFile(files[0]);
    }
  }

  async function handleConfigFile(file) {
    if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
      alert('Please upload a valid YAML file (.yml or .yaml)');
      return;
    }

    configFile = file;
    uploadError = null;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      let storageMethod = '';
      let connInfo = { host: 'localhost', port: '3306', database: 'minecraft', tablePrefix: 'luckperms_', username: 'root', password: '' };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        const storageMatch = trimmed.match(/^storage-method\s*:\s*['"]?(\w+)['"]?/i);
        if (storageMatch) storageMethod = storageMatch[1].toUpperCase();

        // Data section fields (indented under 'data:')
        const addressMatch = trimmed.match(/^address\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (addressMatch) connInfo.host = addressMatch[1];

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
      dbConnectionInfo = (storageMethod === 'MYSQL' || storageMethod === 'MARIADB') ? connInfo : null;
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
    if (configFileInput) configFileInput.value = '';
  }

  // Database file handlers
  function handleDbDrop(e) {
    dbDragOver = false;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleDbFile(files[0]);
    }
  }

  function handleDbFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleDbFile(files[0]);
    }
  }

  async function handleDbFile(file) {
    const isValid = file.name.endsWith('.db') || file.name.endsWith('.mv.db');

    if (!isValid) {
      alert('Please upload a valid H2 database file (.mv.db or .db)');
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
    if (dbFileInput) dbFileInput.value = '';
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
        handler: (response, reject) => {
          if (response.result === 'error') {
            reject(response.message || response.error || 'Upload failed');
            return;
          }
          return response;
        },
      });

      if (result) {
        previewData = result;

        // Pre-select all groups
        selectedGroups = new Set(result.groups.map(g => g.name));
        selectedGroups = selectedGroups;

        // Pre-select all tracks
        if (result.tracks) {
          selectedTracks = new Set(result.tracks.map(t => t.name));
          selectedTracks = selectedTracks;
        }

        currentStep = 'review';
      }
    } catch (error) {
      uploadError = error.message || 'Failed to upload files. Please try again.';
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
      selectedGroups = new Set(previewData.groups.map(g => g.name));
    }
  }

  function selectAllGroups() {
    selectedGroups = new Set(previewData.groups.map(g => g.name));
  }

  function deselectAllGroups() {
    selectedGroups = new Set();
  }

  // Group expand/collapse for viewing permission nodes
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
    return previewData.groupPermissions.filter(p => p.groupName === groupName);
  }

  // Player expand/collapse for viewing permission nodes
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
    return previewData.userPermissions.filter(p => p.uuid === uuid);
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
      selectedTracks = new Set(previewData.tracks.map(t => t.name));
    }
  }

  function selectAllTracks() {
    selectedTracks = new Set(previewData.tracks.map(t => t.name));
  }

  function deselectAllTracks() {
    selectedTracks = new Set();
  }

  // Step 3: Import
  async function importData() {
    isImporting = true;
    importProgress = 0;

    const totalActions = selectedGroups.size + selectedTracks.size;
    const progressInterval = setInterval(() => {
      if (importProgress < 0.9) {
        importProgress += 0.05;
      }
    }, Math.max(100, totalActions * 10));

    try {
      const result = await ApiUtil.post({
        path: '/api/panel/migration/luckperms/import',
        body: {
          selectedGroups: Array.from(selectedGroups),
          selectedTracks: Array.from(selectedTracks),
          importUserPermissions: importUserPermissions,
          mergeStrategy: mergeStrategy
        },
        handler: (response, reject) => {
          if (response.result === 'error') {
            reject(response.message || response.error || 'Import failed');
            return;
          }
          return response;
        },
      });

      clearInterval(progressInterval);
      importProgress = 1;

      if (result) {
        importResult = result;
        currentStep = 'result';
      }
    } catch (error) {
      clearInterval(progressInterval);
      uploadError = error.message || 'Failed to import. Please try again.';
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
    if (configFileInput) configFileInput.value = '';
    if (dbFileInput) dbFileInput.value = '';
  }
</script>
