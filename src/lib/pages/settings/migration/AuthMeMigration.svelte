{#if currentStep === 'upload'}
  <div class="alert alert-info">
    <h5>{$_('pages.migration.authme.supported-info-title')}</h5>
    <ul class="list-unstyled">
      <li>{$_('pages.migration.authme.supported-backends')}</li>
      <li>{$_('pages.migration.authme.supported-hashes')}</li>
      <li>{$_('pages.migration.authme.unsupported-note')}</li>
    </ul>
  </div>

  <label class="form-label" for="uploadConfig">Upload config.yml</label>
  {#if configFile}
    <div class="position-relative">
      <DragAndDropZone
        id="uploadConfig"
        accept={['.yml', '.yaml']}
        on:drop={(e) => handleConfigFile(e.detail)}
        icon="fas fa-file-alt fs-1"
        title={configFile.name}
        subtitle="{(configFile.size / 1024).toFixed(2)} KB" />
      <button
        class="btn-close position-absolute top-0 end-0 m-2"
        aria-label={$_('buttons.remove')}
        use:tooltip={[$_('buttons.remove')]}
        on:click|stopPropagation={removeConfigFile}></button>
    </div>
  {:else}
    <DragAndDropZone
      id="uploadConfig"
      accept={['.yml', '.yaml']}
      on:drop={(e) => handleConfigFile(e.detail)}
      icon="fas fa-cloud-upload-alt fs-1"
      title="Drag and drop your file here"
      subtitle="or click to browse" />
  {/if}

  <!-- SQLite Database Section (conditional) -->
  {#if showDatabaseUpload}
    <div class="mt-3">
      <label class="form-label" for="uploadDb">SQLite Database (authme.db)</label>
      <div class="alert alert-warning">
        <i class="fas fa-info-circle me-1"></i>
        {$_('pages.migration.authme.sqlite-detected-note', {
          default: 'Your config.yml indicates SQLite is used. Please upload your database file.',
        })}
      </div>
      {#if dbFile}
        <div class="position-relative">
          <DragAndDropZone
            id="uploadDb"
            accept={['.db', '.sqlite', '.sqlite3']}
            on:drop={(e) => handleDbFile(e.detail)}
            icon="fas fa-database fa-lg"
            title={dbFile.name}
            subtitle="{(dbFile.size / 1024).toFixed(2)} KB" />
          <button
            class="btn-close position-absolute top-0 end-0 m-2"
            aria-label={$_('buttons.remove')}
            use:tooltip={[$_('buttons.remove')]}
            on:click|stopPropagation={removeDbFile}></button>
        </div>
      {:else}
        <DragAndDropZone
          id="uploadDb"
          accept={['.db', '.sqlite', '.sqlite3']}
          on:drop={(e) => handleDbFile(e.detail)}
          icon="fas fa-cloud-upload-alt fs-1"
          title="Drag and drop your <strong>SQLite database</strong> here" />
      {/if}
    </div>
  {/if}

  <!-- Connection details for MySQL/MariaDB -->
  {#if configFile && dbConnectionInfo}
    <div class="card mb-3 border-warning">
      <div class="card-header bg-warning">
        <strong>{detectedBackend}</strong> — {$_('pages.migration.authme.db-connect-info')}
      </div>
      <div class="card-body py-3">
        <div class="row g-2 mb-2">
          <div class="col-12 col-sm-8">
            <label class="form-label small mb-1" for="dbHost">Host</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbHost"
              bind:value={dbConnectionInfo.host} />
          </div>
          <div class="col-12 col-sm-4">
            <label class="form-label small mb-1" for="dbPort">Port</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbPort"
              bind:value={dbConnectionInfo.port} />
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbName">Database</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbName"
              bind:value={dbConnectionInfo.database} />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbTable">Table</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbTable"
              bind:value={dbConnectionInfo.table} />
          </div>
        </div>
        <div class="row g-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbUser">Username</label>
            <input
              type="text"
              class="form-control form-control-sm"
              id="dbUser"
              bind:value={dbConnectionInfo.username} />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small mb-1" for="dbPass">Password</label>
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

  <!-- Upload/Connect button -->
  {#if configFile && !showDatabaseUpload}
    <button class="btn btn-primary" on:click={uploadAndPreview} disabled={isProcessing}>
      {#if isProcessing}
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      {/if}
      {#if dbConnectionInfo}
        <i class="fas fa-plug me-1"></i> Connect & Preview Users
      {:else}
        <i class="fas fa-upload me-1"></i> Upload & Preview Users
      {/if}
    </button>
  {/if}

  {#if isProcessing}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="">Uploading & processing...</small>
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
  <!-- Step 2: Review Users -->

  {#if previewData.users.some((u) => u.passwordType === 'PLAINTEXT' || u.passwordType === 'UNKNOWN')}
    <div class="card mb-3 border-warning">
      <div class="card-header text-bg-warning">
        {$_('pages.migration.authme.password-strategy-title')}
        <span class="badge text-bg-secondary ms-2">{previewData.authmeHashAlgorithm}</span>
      </div>
      <div class="card-body">
        <p>
          {$_('pages.migration.authme.password-strategy-desc')}
        </p>
        <div class="form-check mb-2">
          <input
            class="form-check-input"
            type="radio"
            name="passwordStrategy"
            id="strategyHash"
            value="hash"
            bind:group={passwordStrategy} />
          <label class="form-check-label" for="strategyHash">
            <strong>{$_('pages.migration.authme.strategy-hash')}</strong>
            <span class="badge text-bg-success ms-1">{previewData.defaultHashAlgorithm}</span>
            <br />
            <small class="opacity-75">{$_('pages.migration.authme.strategy-hash-desc')}</small>
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="passwordStrategy"
            id="strategyReset"
            value="reset"
            bind:group={passwordStrategy} />
          <label class="form-check-label" for="strategyReset">
            <strong>{$_('pages.migration.authme.strategy-reset')}</strong>
            <br />
            <small class="opacity-75">{$_('pages.migration.authme.strategy-reset-desc')}</small>
          </label>
        </div>
      </div>
    </div>
  {/if}

  {#if previewData.existingCount > 0}
    <div class="card mb-3 border-info">
      <div class="card-header text-bg-info">
        {$_('pages.migration.authme.existing-strategy-title')} ({previewData.existingCount})
      </div>
      <div class="card-body">
        <p class="small mb-3">
          {$_('pages.migration.authme.existing-strategy-desc')}
        </p>
        <div class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            id="updatePassword"
            bind:checked={existingUserUpdates.password} />
          <label class="form-check-label" for="updatePassword">
            <strong>{$_('pages.migration.authme.update-password')}</strong>
            <br />
            <small class="opacity-75">{$_('pages.migration.authme.update-password-desc')}</small>
          </label>
        </div>
        <div class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            id="updateUsername"
            bind:checked={existingUserUpdates.username} />
          <label class="form-check-label" for="updateUsername">
            <strong>{$_('pages.migration.authme.update-username')}</strong>
            <br />
            <small class="opacity-75">{$_('pages.migration.authme.update-username-desc')}</small>
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="updateEmail"
            bind:checked={existingUserUpdates.email} />
          <label class="form-check-label" for="updateEmail">
            <strong>{$_('pages.migration.authme.update-email')}</strong>
            <br />
            <small class="opacity-75">{$_('pages.migration.authme.update-email-desc')}</small>
          </label>
        </div>
      </div>
    </div>
  {/if}

  <div
    class="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
    <div>
      <span class="badge text-bg-success me-2">{previewData.newCount} New</span>
      <span class="badge text-bg-warning me-2">{previewData.existingCount} Existing</span>
      <span class="badge text-bg-secondary">{previewData.totalCount} Total</span>
    </div>
    <div class="d-flex flex-wrap gap-2">
      <button class="btn btn-sm btn-link text-decoration-none px-0 px-md-2" on:click={selectAllNew}>
        Select All New
      </button>
      <button class="btn btn-sm btn-link text-decoration-none px-0 px-md-2" on:click={selectAll}>
        Select All
      </button>
      <button class="btn btn-sm btn-link text-decoration-none px-0 px-md-2" on:click={deselectAll}>
        Deselect All
      </button>
    </div>
  </div>

  <div class="mb-2">
    <SearchInput
      placeholderKey="buttons.find"
      showSpinner={false}
      on:change={(e) => (importSearchQuery = e.detail.value)} />
  </div>

  <div class="table-responsive">
    <table class="table table-hover">
      <thead>
        <tr>
          <th class="align-middle text-nowrap" scope="col" style="width: 40px;">
            <input
              type="checkbox"
              class="form-check-input"
              checked={selectedUsers.size === previewData.users.length}
              on:change={toggleAll} />
          </th>
          <th class="align-middle text-nowrap" scope="col">Username</th>
          <th class="align-middle text-nowrap" scope="col">Email</th>
          <th class="align-middle text-nowrap" scope="col">IP</th>
          <th class="align-middle text-nowrap" scope="col">Status</th>
          <th class="align-middle text-nowrap" scope="col">Password</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredUsers as user}
          <tr>
            <td>
              <input
                type="checkbox"
                class="form-check-input"
                checked={selectedUsers.has(user.username)}
                on:change={() => toggleUser(user.username)} />
            </td>
            <td class="fw-semibold">{user.realName || user.username}</td>
            <td><span class="user-select-all">{user.email || '-'}</span></td>
            <td><code class="user-select-all">{user.ip || '-'}</code></td>
            <td>
              {#if user.status === 'new'}
                <span class="badge text-bg-success">New</span>
              {:else}
                <span class="badge text-bg-warning">Existing</span>
              {/if}
            </td>
            <td>
              {#if user.hasPassword && user.passwordType}
                <span
                  class="badge {user.passwordType === 'SHA256'
                    ? 'text-bg-info'
                    : user.passwordType === 'MD5'
                      ? 'text-bg-warning '
                      : user.passwordType === 'BCRYPT'
                        ? 'text-bg-success'
                        : user.passwordType === 'ARGON2ID'
                          ? 'text-bg-success'
                          : user.passwordType === 'PLAINTEXT'
                            ? 'text-bg-danger'
                            : user.passwordType === 'UNKNOWN'
                              ? 'text-bg-secondary'
                              : 'text-bg-secondary'}">
                  {user.passwordType}
                </span>
              {:else if user.hasPassword}
                <i class="fas fa-check text-success"></i>
              {:else}
                <span class="badge text-bg-danger">None</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="alert alert-info mt-3 mb-0">
    <i class="fas fa-info-circle me-2"></i>
    {$_('pages.migration.authme.password-info')}
  </div>

  {#if previewData.users.some((u) => (!u.hasPassword || u.passwordType === 'UNKNOWN' || u.passwordType === 'PLAINTEXT') && selectedUsers.has(u.username))}
    <div class="alert alert-warning mt-2 mb-0">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {$_('pages.migration.authme.no-password-warning')}
    </div>
  {/if}

  {#if previewData.panoOnlyUsers && previewData.panoOnlyUsers.length > 0}
    <div class="card mt-3 border-danger">
      <div
        class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center text-bg-danger gap-2">
        <span>
          {$_('pages.migration.authme.pano-only-title', {
            values: { count: previewData.panoOnlyUsers.length },
          })}
        </span>
        <div class="d-flex flex-wrap gap-2">
          <button
            class="btn btn-sm btn-link text-bg-danger text-decoration-none px-0 px-md-2"
            on:click={selectAllPanoOnly}>
            {$_('buttons.select-all')}
          </button>
          <button
            class="btn btn-sm btn-link text-bg-danger text-decoration-none px-0 px-md-2"
            on:click={deselectAllPanoOnly}>
            {$_('buttons.deselect-all')}
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="px-3 pt-3 pb-2">
          <SearchInput
            placeholderKey="buttons.find"
            showSpinner={false}
            on:change={(e) => (deleteSearchQuery = e.detail.value)} />
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="align-middle text-nowrap" scope="col" style="width: 40px;">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    checked={deleteUsers.size === previewData.panoOnlyUsers.length}
                    on:change={toggleAllPanoOnly} />
                </th>
                <th class="align-middle text-nowrap" scope="col">Username</th>
                <th class="align-middle text-nowrap" scope="col">Email</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredPanoOnlyUsers as user}
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      class="form-check-input"
                      checked={deleteUsers.has(user.username)}
                      on:change={() => toggleDeleteUser(user.username)} />
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email || '-'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer">
        <small class="text-danger">
          <i class="fas fa-exclamation-triangle me-1"></i>
          {$_('pages.migration.authme.pano-only-warning')}
        </small>
      </div>
    </div>
  {/if}

  <div class="mt-3 d-flex flex-column flex-sm-row gap-2">
    <button
      class="btn btn-link text-decoration-none order-2 order-sm-1"
      on:click={resetForm}
      disabled={isImporting}>
      <i class="fas fa-arrow-left me-1"></i> Back
    </button>
    <button
      class="btn btn-secondary order-1 order-sm-2"
      on:click={importUsers}
      disabled={(selectedUsers.size === 0 && deleteUsers.size === 0) || isImporting}>
      {#if isImporting}
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      {/if}
      <i class="fas fa-file-import me-1"></i> Import {selectedUsers.size} Users
      {#if deleteUsers.size > 0}
        &amp; Delete {deleteUsers.size}
      {/if}
    </button>
  </div>

  {#if isImporting}
    <div class="mt-3">
      <div class="d-flex justify-content-between mb-1">
        <small class="">
          Importing {selectedUsers.size} users{#if deleteUsers.size > 0}, deleting {deleteUsers.size}{/if}...
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
{:else if currentStep === 'result'}
  <!-- Step 3: Import Results -->
  <div class="alert alert-success d-flex align-items-center" role="alert">
    <i class="fas fa-check-circle fs-4 me-3"></i>
    <div>
      <h6 class="alert-heading mb-1">Migration Completed!</h6>
      <p class="mb-0 small">
        <strong>{importResult.imported}</strong> users imported{#if importResult.updated > 0},
          <strong>{importResult.updated}</strong> updated{/if},
        <strong>{importResult.skipped}</strong> skipped{#if importResult.deleted > 0},
          <strong>{importResult.deleted}</strong> deleted{/if}.
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
          <li><strong>{err.username}</strong>: {err.error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <button class="btn btn-primary" on:click={resetForm}>
    <i class="fas fa-redo me-2"></i>
    Start New Migration
  </button>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import ApiUtil from '$lib/api.util.js';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';

  // ── Mock Data ──
  const MOCK_ENABLED = true;

  const mockConfigFile = new File(['backend: SQLITE\n'], 'config.yml', {
    type: 'application/x-yaml',
  });
  // Fake a 2.4 KB file — override size via defineProperty since File.size is read-only
  Object.defineProperty(mockConfigFile, 'size', { value: 2457 });

  const mockDbFile = new File([''], 'authme.db', {
    type: 'application/x-sqlite3',
  });
  Object.defineProperty(mockDbFile, 'size', { value: 51200 });

  const mockPreviewData = {
    authmeHashAlgorithm: 'SHA256',
    defaultHashAlgorithm: 'BCRYPT',
    totalCount: 6,
    newCount: 4,
    existingCount: 2,
    users: [
      {
        username: 'steve',
        realName: 'Steve',
        email: 'steve@example.com',
        ip: '192.168.1.10',
        status: 'new',
        hasPassword: true,
        passwordType: 'SHA256',
      },
      {
        username: 'alex',
        realName: 'Alex',
        email: 'alex@example.com',
        ip: '192.168.1.11',
        status: 'new',
        hasPassword: true,
        passwordType: 'BCRYPT',
      },
      {
        username: 'notch',
        realName: 'Notch',
        email: 'notch@mojang.com',
        ip: '10.0.0.1',
        status: 'existing',
        hasPassword: true,
        passwordType: 'SHA256',
      },
      {
        username: 'herobrine',
        realName: 'Herobrine',
        email: '',
        ip: '10.0.0.5',
        status: 'new',
        hasPassword: true,
        passwordType: 'PLAINTEXT',
      },
      {
        username: 'jeb_',
        realName: 'Jeb',
        email: 'jeb@mojang.com',
        ip: '10.0.0.2',
        status: 'existing',
        hasPassword: true,
        passwordType: 'MD5',
      },
      {
        username: 'dinnerbone',
        realName: 'Dinnerbone',
        email: 'dinner@example.com',
        ip: '172.16.0.3',
        status: 'new',
        hasPassword: false,
        passwordType: 'UNKNOWN',
      },
    ],
    panoOnlyUsers: [
      { username: 'oldplayer1', email: 'old1@example.com' },
      { username: 'oldplayer2', email: 'old2@example.com' },
      { username: 'removeduser', email: '' },
    ],
  };

  // File upload states
  let configFile = MOCK_ENABLED ? mockConfigFile : null;
  let dbFile = MOCK_ENABLED ? mockDbFile : null;
  let showDatabaseUpload = MOCK_ENABLED ? true : false;
  let detectedBackend = MOCK_ENABLED ? 'SQLITE' : '';
  let dbConnectionInfo = null;
  let isProcessing = false;
  let uploadProgress = 0;

  // Migration flow states
  let currentStep = MOCK_ENABLED ? 'review' : 'upload'; // 'upload' | 'review' | 'result'
  let previewData = MOCK_ENABLED ? mockPreviewData : null;
  let selectedUsers = MOCK_ENABLED
    ? new Set(mockPreviewData.users.filter((u) => u.status === 'new').map((u) => u.username))
    : new Set();
  let deleteUsers = new Set();
  let passwordStrategy = 'hash'; // 'hash' or 'reset'
  let existingUserUpdates = { password: false, username: false, email: false };
  let isImporting = false;
  let importProgress = 0;
  let importResult = null;
  let uploadError = null;

  // Search states
  let importSearchQuery = '';
  let deleteSearchQuery = '';

  // Filtered lists (reactive)
  $: filteredUsers =
    previewData?.users?.filter((u) => {
      if (!importSearchQuery.trim()) return true;
      const q = importSearchQuery.toLowerCase();
      return (
        (u.username || '').toLowerCase().includes(q) ||
        (u.realName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }) ?? [];

  $: filteredPanoOnlyUsers =
    previewData?.panoOnlyUsers?.filter((u) => {
      if (!deleteSearchQuery.trim()) return true;
      const q = deleteSearchQuery.toLowerCase();
      return (
        (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      );
    }) ?? [];

  // Config file handlers
  async function handleConfigFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
      alert('Please upload a valid YAML file (.yml or .yaml)');
      return;
    }

    configFile = file;
    uploadError = null;

    // Parse config to detect backend and extract DB connection details
    try {
      const text = await file.text();
      const lines = text.split('\n');
      let backend = '';
      let connInfo = {
        host: 'localhost',
        port: '3306',
        database: 'authme',
        table: 'authme',
        username: 'root',
        password: '',
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        const backendMatch = trimmed.match(/^backend\s*:\s*['"]?(\w+)['"]?/i);
        if (backendMatch) backend = backendMatch[1].toUpperCase();

        const hostMatch = trimmed.match(/^mySQLHost\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (hostMatch) connInfo.host = hostMatch[1];

        const portMatch = trimmed.match(/^mySQLPort\s*:\s*['"]?(\d+)['"]?/i);
        if (portMatch) connInfo.port = portMatch[1];

        const dbMatch = trimmed.match(/^mySQLDatabase\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (dbMatch) connInfo.database = dbMatch[1];

        const tableMatch = trimmed.match(/^mySQLTablename\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (tableMatch) connInfo.table = tableMatch[1];

        const userMatch = trimmed.match(/^mySQLUsername\s*:\s*['"]?([^'"#\s]+)['"]?/i);
        if (userMatch) connInfo.username = userMatch[1];

        const pwdMatch = trimmed.match(/^mySQLPassword\s*:\s*['"]?([^'"#]*)['"]?/i);
        if (pwdMatch) connInfo.password = pwdMatch[1].trim();
      }

      detectedBackend = backend;
      showDatabaseUpload = backend === 'SQLITE';
      dbConnectionInfo = backend === 'MYSQL' || backend === 'MARIADB' ? connInfo : null;
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
    const validExtensions = ['.db', '.sqlite', '.sqlite3'];
    const isValid = validExtensions.some((ext) => file.name.endsWith(ext));

    if (!isValid) {
      alert('Please upload a valid SQLite database file (.db, .sqlite, or .sqlite3)');
      return;
    }

    dbFile = file;

    // Auto upload when both files are ready
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
        formData.append('dbTable', dbConnectionInfo.table);
        formData.append('dbUser', dbConnectionInfo.username);
        formData.append('dbPassword', dbConnectionInfo.password);
      }

      const result = await ApiUtil.post({
        path: '/api/panel/migration/authme/upload',
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

        // Pre-select all "new" users by default
        selectedUsers = new Set();
        result.users.forEach((user) => {
          if (user.status === 'new') {
            selectedUsers.add(user.username);
          }
        });
        selectedUsers = selectedUsers; // trigger reactivity

        currentStep = 'review';
      }
    } catch (error) {
      uploadError = error.message || 'Failed to upload files. Please try again.';
    } finally {
      isProcessing = false;
    }
  }

  // Review step helpers
  function toggleUser(username) {
    if (selectedUsers.has(username)) {
      selectedUsers.delete(username);
    } else {
      selectedUsers.add(username);
    }
    selectedUsers = new Set(selectedUsers); // trigger reactivity
  }

  function toggleAll() {
    if (selectedUsers.size === previewData.users.length) {
      selectedUsers = new Set();
    } else {
      selectedUsers = new Set(previewData.users.map((u) => u.username));
    }
  }

  function selectAllNew() {
    selectedUsers = new Set(
      previewData.users.filter((u) => u.status === 'new').map((u) => u.username),
    );
  }

  function selectAll() {
    selectedUsers = new Set(previewData.users.map((u) => u.username));
  }

  function deselectAll() {
    selectedUsers = new Set();
  }

  // Pano-only user delete helpers
  function toggleDeleteUser(username) {
    if (deleteUsers.has(username)) {
      deleteUsers.delete(username);
    } else {
      deleteUsers.add(username);
    }
    deleteUsers = new Set(deleteUsers);
  }

  function toggleAllPanoOnly() {
    if (deleteUsers.size === previewData.panoOnlyUsers.length) {
      deleteUsers = new Set();
    } else {
      deleteUsers = new Set(previewData.panoOnlyUsers.map((u) => u.username));
    }
  }

  function selectAllPanoOnly() {
    deleteUsers = new Set(previewData.panoOnlyUsers.map((u) => u.username));
  }

  function deselectAllPanoOnly() {
    deleteUsers = new Set();
  }

  // Step 3: Import selected users
  async function importUsers() {
    isImporting = true;
    importProgress = 0;

    // Simulate progress since JSON requests don't support real progress
    const totalActions = selectedUsers.size + deleteUsers.size;
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
        path: '/api/panel/migration/authme/import',
        body: {
          usernames: Array.from(selectedUsers),
          deleteUsernames: Array.from(deleteUsers),
          passwordStrategy: passwordStrategy,
          existingUserUpdates: existingUserUpdates,
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
      uploadError = error.message || 'Failed to import users. Please try again.';
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
    selectedUsers = new Set();
    deleteUsers = new Set();
    passwordStrategy = 'hash';
    existingUserUpdates = { password: false, username: false, email: false };
    isImporting = false;
    importProgress = 0;
    importResult = null;
    uploadError = null;
    importSearchQuery = '';
    deleteSearchQuery = '';
  }
</script>
