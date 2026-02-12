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

  .progress-step {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: var(--bs-tertiary-bg);
    border: 1px solid var(--bs-border-color);
  }

  .migration-progress {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Dark theme support */
  [data-bs-theme='dark'] .file-drop-zone {
    background-color: var(--bs-dark);
  }

  [data-bs-theme='dark'] .file-drop-zone:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
  }

  [data-bs-theme='dark'] .file-drop-zone.drag-over {
    background-color: rgba(var(--bs-primary-rgb), 0.15);
  }

  [data-bs-theme='dark'] .file-drop-zone.has-file {
    background-color: rgba(var(--bs-success-rgb), 0.1);
  }

  [data-bs-theme='dark'] .progress-step {
    background-color: var(--bs-dark);
  }
</style>

<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <div class="card-title">From platforms & CMS to Pano</div>
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="migrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="azuriom-tab"
          data-bs-toggle="tab"
          data-bs-target="#azuriom"
          type="button"
          role="tab"
          aria-controls="azuriom"
          aria-selected="true">
          Azuriom
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="namelessmc-tab"
          data-bs-toggle="tab"
          data-bs-target="#namelessmc"
          type="button"
          role="tab"
          aria-controls="namelessmc"
          aria-selected="false">
          NamelessMC
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="leaderos-tab"
          data-bs-toggle="tab"
          data-bs-target="#leaderos"
          type="button"
          role="tab"
          aria-controls="leaderos"
          aria-selected="true">
          LeaderOS
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="minexon-tab"
          data-bs-toggle="tab"
          data-bs-target="#minexon"
          type="button"
          role="tab"
          aria-controls="minexon"
          aria-selected="false">
          Minexon
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <!-- Tab panes -->
    <div class="tab-content">
      <div class="tab-pane active" id="azuriom" role="tabpanel" aria-labelledby="azuriom-tab">
        <NoContent text="Not available." />
      </div>
      <div class="tab-pane" id="script1" role="tabpanel" aria-labelledby="script1-tab">
        <NoContent text="Not available." />
      </div>
      <div class="tab-pane" id="script2" role="tabpanel" aria-labelledby="script2-tab">
        <NoContent text="Not available." />
      </div>
      <div class="tab-pane" id="script3" role="tabpanel" aria-labelledby="script3-tab">
        <NoContent text="Not available." />
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <div class="card-title">From plugins to Pano</div>
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="pluginMigrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="authme-tab"
          data-bs-toggle="tab"
          data-bs-target="#authme"
          type="button"
          role="tab"
          aria-controls="authme"
          aria-selected="true">
          AuthMe Reloaded
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="luckperms-tab"
          data-bs-toggle="tab"
          data-bs-target="#luckperms"
          type="button"
          role="tab"
          aria-controls="luckperms"
          aria-selected="false"
          disabled>
          LuckPerms
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="other-tab"
          data-bs-toggle="tab"
          data-bs-target="#other"
          type="button"
          role="tab"
          aria-controls="other"
          aria-selected="false"
          disabled>
          Other Plugins
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <!-- Tab panes -->
    <div class="tab-content">
      <div class="tab-pane active" id="authme" role="tabpanel" aria-labelledby="authme-tab">
        {#if !migrationStarted}
          <!-- File Upload Section -->
          <div class="mb-4">
            <label class="form-label" for="uploadConfig">Upload config.yml</label>
            <div
              class="file-drop-zone {configDragOver ? 'drag-over' : ''} {configFile
                ? 'has-file'
                : ''}"
              on:dragover|preventDefault={() => (configDragOver = true)}
              on:dragleave|preventDefault={() => (configDragOver = false)}
              on:drop|preventDefault={handleConfigDrop}
              on:click={() => configFileInput.click()}>
              {#if configFile}
                <i class="bi bi-file-earmark-text text-success fs-1"></i>
                <p class="mb-1 fw-semibold">{configFile.name}</p>
                <p class="small mb-2">
                  {(configFile.size / 1024).toFixed(2)} KB
                </p>
                <button
                  class="btn btn-sm btn-outline-danger"
                  on:click|stopPropagation={removeConfigFile}>
                  <i class="bi bi-trash"></i> Remove
                </button>
              {:else}
                <i class="bi bi-cloud-upload fs-1"></i>
                <p class="mb-1">Drag and drop your file here</p>
                <p class="small">or click to browse</p>
              {/if}
            </div>
            <input
              id="uploadConfig"
              type="file"
              bind:this={configFileInput}
              on:change={handleConfigFileSelect}
              accept=".yml,.yaml"
              class="d-none" />
          </div>

          <!-- SQLite Database Section (conditional) -->
          {#if showDatabaseUpload}
            <div class="mb-4">
              <label class="form-label fw-semibold">SQLite Database (authme.db)</label>
              <p class=" small mb-2">
                <i class="bi bi-info-circle"></i> Your config.yml indicates SQLite is used. Please upload
                your database file.
              </p>
              <div
                class="file-drop-zone {dbDragOver ? 'drag-over' : ''} {dbFile ? 'has-file' : ''}"
                on:dragover|preventDefault={() => (dbDragOver = true)}
                on:dragleave|preventDefault={() => (dbDragOver = false)}
                on:drop|preventDefault={handleDbDrop}
                on:click={() => dbFileInput.click()}>
                {#if dbFile}
                  <i class="bi bi-database text-success fs-1"></i>
                  <p class="mb-1 fw-semibold">{dbFile.name}</p>
                  <p class=" small mb-2">
                    {(dbFile.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    on:click|stopPropagation={removeDbFile}>
                    <i class="bi bi-trash"></i> Remove
                  </button>
                {:else}
                  <i class="bi bi-cloud-upload fs-1"></i>
                  <p class="mb-1">
                    Drag and drop your <strong>SQLite database</strong> here
                  </p>
                  <p class=" small">or click to browse</p>
                {/if}
              </div>
              <input
                type="file"
                bind:this={dbFileInput}
                on:change={handleDbFileSelect}
                accept=".db,.sqlite,.sqlite3"
                class="d-none" />
            </div>
          {/if}
        {:else}
          <!-- Migration Progress Section -->
          <div class="migration-progress">
            {#each migrationSteps as step}
              <div class="progress-step mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <div class="d-flex align-items-center gap-2">
                    {#if step.status === 'completed'}
                      <i class="bi bi-check-circle-fill text-success fs-5"></i>
                    {:else if step.status === 'processing'}
                      <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Processing...</span>
                      </div>
                    {:else if step.status === 'error'}
                      <i class="bi bi-x-circle-fill text-danger fs-5"></i>
                    {:else}
                      <i class="bi bi-circle fs-5"></i>
                    {/if}
                    <span class="fw-semibold">{step.title}</span>
                  </div>
                  {#if step.status === 'processing' || step.status === 'completed'}
                    <span class="badge bg-light text-dark">{step.progress}%</span>
                  {/if}
                </div>

                {#if step.status === 'processing' || step.status === 'completed'}
                  <div class="progress mb-2" style="height: 8px;">
                    <div
                      class="progress-bar {step.status === 'error' ? 'bg-danger' : ''}"
                      role="progressbar"
                      style="width: {step.progress}%"
                      aria-valuenow={step.progress}
                      aria-valuemin="0"
                      aria-valuemax="100">
                    </div>
                  </div>
                {/if}

                {#if step.message}
                  <p class=" small mb-0 ms-4">{step.message}</p>
                {/if}
              </div>
            {/each}

            {#if migrationCompleted}
              <div class="alert alert-success d-flex align-items-center mt-4" role="alert">
                <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                <div>
                  <h6 class="alert-heading mb-1">Migration Completed Successfully!</h6>
                  <p class="mb-0 small">
                    All AuthMe data has been migrated to Pano. You can now use Pano's authentication
                    system.
                  </p>
                </div>
              </div>
              <button class="btn btn-primary mt-3" on:click={resetForm}>
                <i class="bi bi-arrow-counterclockwise me-2"></i>
                Migrate Another Plugin
              </button>
            {/if}

            {#if migrationError}
              <div class="alert alert-danger d-flex align-items-center mt-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                <div>
                  <h6 class="alert-heading mb-1">Migration Failed</h6>
                  <p class="mb-0 small">{migrationError}</p>
                </div>
              </div>
              <button class="btn btn-outline-primary mt-3" on:click={resetForm}>
                <i class="bi bi-arrow-counterclockwise me-2"></i>
                Try Again
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="tab-pane" id="luckperms" role="tabpanel" aria-labelledby="luckperms-tab">
        <NoContent text="Not available yet." />
      </div>

      <div class="tab-pane" id="other" role="tabpanel" aria-labelledby="other-tab">
        <NoContent text="Not available yet." />
      </div>
    </div>
  </div>
</div>

<script>
  import NoContent from '$lib/components/NoContent.svelte';

  // File upload states
  let configFileInput;
  let dbFileInput;
  let configFile = null;
  let dbFile = null;
  let configDragOver = false;
  let dbDragOver = false;
  let showDatabaseUpload = false;
  let isProcessing = false;

  // Migration states
  let migrationStarted = false;
  let migrationCompleted = false;
  let migrationError = null;
  let migrationSteps = [];

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
    isProcessing = true;

    // Parse config to check if SQLite is used
    try {
      const text = await file.text();
      // Simple check for SQLite in config (you might want more robust parsing)
      if (text.toLowerCase().includes('sqlite')) {
        showDatabaseUpload = true;
        isProcessing = false;
      } else {
        // MySQL/other database - start migration immediately
        isProcessing = false;
        await startMigration();
      }
    } catch (error) {
      console.error('Error parsing config:', error);
      isProcessing = false;
    }
  }

  function removeConfigFile(e) {
    e?.preventDefault();
    configFile = null;
    showDatabaseUpload = false;
    dbFile = null;
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
    const validExtensions = ['.db', '.sqlite', '.sqlite3'];
    const isValid = validExtensions.some((ext) => file.name.endsWith(ext));

    if (!isValid) {
      alert('Please upload a valid SQLite database file (.db, .sqlite, or .sqlite3)');
      return;
    }

    dbFile = file;

    // Start migration automatically when both files are uploaded
    if (configFile && dbFile) {
      await startMigration();
    }
  }

  function removeDbFile(e) {
    e?.preventDefault();
    dbFile = null;
    if (dbFileInput) dbFileInput.value = '';
  }

  // Migration process
  async function startMigration() {
    migrationStarted = true;
    migrationCompleted = false;
    migrationError = null;

    // Initialize migration steps
    migrationSteps = [
      {
        id: 'upload',
        title: 'Uploading files',
        status: 'pending',
        progress: 0,
        message: '',
      },
      {
        id: 'validate',
        title: 'Validating configuration',
        status: 'pending',
        progress: 0,
        message: '',
      },
      {
        id: 'parse',
        title: 'Parsing AuthMe data',
        status: 'pending',
        progress: 0,
        message: '',
      },
      {
        id: 'users',
        title: 'Migrating users',
        status: 'pending',
        progress: 0,
        message: '',
      },
      {
        id: 'passwords',
        title: 'Converting password hashes',
        status: 'pending',
        progress: 0,
        message: '',
      },
      {
        id: 'finalize',
        title: 'Finalizing migration',
        status: 'pending',
        progress: 0,
        message: '',
      },
    ];

    try {
      // Step 1: Upload files
      await updateStep('upload', 'processing', 0, 'Uploading configuration file...');
      await uploadFiles();
      await updateStep('upload', 'completed', 100, 'Files uploaded successfully');

      // Step 2: Validate
      await updateStep('validate', 'processing', 0, 'Checking configuration validity...');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      await updateStep('validate', 'completed', 100, 'Configuration is valid');

      // Step 3: Parse
      await updateStep('parse', 'processing', 0, 'Reading AuthMe database...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await updateStep('parse', 'completed', 100, 'Found 1,234 user records');

      // Step 4: Migrate users
      await updateStep('users', 'processing', 0, 'Creating user accounts...');
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await updateStep(
          'users',
          'processing',
          i,
          `Migrated ${Math.floor((1234 * i) / 100)} / 1,234 users`,
        );
      }
      await updateStep('users', 'completed', 100, 'All users migrated successfully');

      // Step 5: Convert passwords
      await updateStep('passwords', 'processing', 0, 'Converting password hashes...');
      for (let i = 0; i <= 100; i += 25) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        await updateStep(
          'passwords',
          'processing',
          i,
          `Processed ${Math.floor((1234 * i) / 100)} passwords`,
        );
      }
      await updateStep('passwords', 'completed', 100, 'Password hashes converted');

      // Step 6: Finalize
      await updateStep('finalize', 'processing', 0, 'Cleaning up and applying changes...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await updateStep('finalize', 'completed', 100, 'Migration completed');

      migrationCompleted = true;
    } catch (error) {
      console.error('Migration error:', error);
      migrationError = error.message || 'An unexpected error occurred during migration';

      // Mark current processing step as error
      const currentStep = migrationSteps.find((s) => s.status === 'processing');
      if (currentStep) {
        currentStep.status = 'error';
        currentStep.message = 'Failed: ' + error.message;
      }
    }
  }

  async function updateStep(stepId, status, progress, message) {
    const step = migrationSteps.find((s) => s.id === stepId);
    if (step) {
      step.status = status;
      step.progress = progress;
      step.message = message;
      migrationSteps = [...migrationSteps]; // Trigger reactivity
    }
  }

  async function uploadFiles() {
    const formData = new FormData();
    formData.append('config', configFile);
    if (dbFile) {
      formData.append('database', dbFile);
    }

    // TODO: Replace with actual API endpoint
    // const response = await fetch('/api/migrations/authme', {
    //   method: 'POST',
    //   body: formData
    // });
    // if (!response.ok) throw new Error('Upload failed');
    // return await response.json();

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  function resetForm() {
    configFile = null;
    dbFile = null;
    showDatabaseUpload = false;
    migrationStarted = false;
    migrationCompleted = false;
    migrationError = null;
    migrationSteps = [];
    isProcessing = false;
    if (configFileInput) configFileInput.value = '';
    if (dbFileInput) dbFileInput.value = '';
  }
</script>
