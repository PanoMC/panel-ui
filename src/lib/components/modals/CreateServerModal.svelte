<style>
  .choice-card {
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius-lg);
    text-align: start;
    width: 100%;
    transition: border-color 0.15s ease-in-out;
  }

  .choice-card:hover:not(:disabled),
  .choice-card:focus-visible {
    border-color: var(--bs-primary);
  }

  .choice-card.selected {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 1px var(--bs-primary);
  }

  .choice-card:disabled {
    opacity: 0.5;
  }

  .choice-icon {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bs-border-radius);
    flex-shrink: 0;
  }

  .review-key {
    width: 40%;
  }

  .modpack-results {
    max-height: 18rem;
    overflow-y: auto;
  }
</style>

<!--
  Create-server wizard (SM-24b + SM-28/SM-37): Source → Node → Software-or-import → Settings →
  Review. The third step is what the chosen source needs — the software catalogue for a fresh
  install, a node path, an uploaded archive or a Modrinth pack for an import (§2.4.8). An import
  never asks for software or version: the node detects them and Pano fills the row in from the
  `IMPORT_RESULT` it reports back.
-->
<div
  aria-hidden="true"
  aria-labelledby="createServerTitle"
  class="modal fade"
  id="createServer"
  role="dialog"
  tabindex="-1"
  bind:this={modalElement}>
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <div class="min-w-0">
          <h5 class="modal-title" id="createServerTitle">
            {$_('components.modals.create-server.title')}
          </h5>
          <div class="small text-body-secondary">
            {$_('components.modals.create-server.step-of', {
              values: { current: step + 1, total: STEP_COUNT, name: $_(stepLabel) },
            })}
          </div>
        </div>
        <button
          class="btn-close"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="modal"
          type="button"
          disabled={submitting}>
        </button>
      </div>

      <div class="modal-body">
        <div
          class="progress mb-3"
          style="height: 4px;"
          role="progressbar"
          aria-label={$_('components.modals.create-server.title')}
          aria-valuenow={step + 1}
          aria-valuemin="1"
          aria-valuemax={STEP_COUNT}>
          <div class="progress-bar" style="width: {((step + 1) / STEP_COUNT) * 100}%;"></div>
        </div>

        {#if step === STEP_SOURCE}
          <p class="text-body-secondary small">
            {$_('components.modals.create-server.source-description')}
          </p>

          <div class="row g-2">
            {#each SOURCES as option (option.id)}
              <div class="col-md-6">
                <!-- A disabled button swallows pointer events, so the tooltip sits outside. -->
                <span
                  class="d-inline-block w-100"
                  use:tooltip={[
                    option.enabled ? '' : $_('components.modals.create-server.coming-later'),
                    { placement: 'top' },
                  ]}>
                  <button
                    type="button"
                    class="choice-card card h-100 p-3 bg-body"
                    class:selected={source === option.id}
                    disabled={!option.enabled}
                    aria-pressed={source === option.id}
                    onclick={() => (source = option.id)}>
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span class="choice-icon bg-body-secondary">
                        <i class={option.icon} aria-hidden="true"></i>
                      </span>
                      <span class="fw-semibold">{$_(option.title)}</span>
                    </div>
                    <span class="small text-body-secondary">{$_(option.description)}</span>
                  </button>
                </span>
              </div>
            {/each}
          </div>
        {:else if step === STEP_NODE}
          {#if nodesLoading}
            <div class="text-center py-4">
              <span class="spinner-border" role="status" aria-hidden="true"></span>
            </div>
          {:else if usableNodes.length === 0}
            <NoContent
              icon="fa-solid fa-server fa-3x"
              text={nodesUnavailable
                ? $_('components.modals.create-server.nodes-unavailable')
                : $_('components.modals.create-server.node-empty-description')}>
              <div class="d-flex flex-wrap justify-content-center gap-2 pb-3">
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  disabled={localSetupBusy}
                  onclick={setupLocalNode}>
                  {#if localSetupBusy}
                    <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                  {:else}
                    <i class="fa-solid fa-bolt me-1" aria-hidden="true"></i>
                  {/if}
                  {$_('pages.servers.create.setup-local-node')}
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick={addNode}>
                  <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
                  {$_('components.modals.create-server.add-node')}
                </button>
              </div>
            </NoContent>
          {:else}
            <p class="text-body-secondary small">
              {$_('components.modals.create-server.node-description')}
            </p>

            <div class="vstack gap-2">
              {#each usableNodes as node (node.id)}
                <button
                  type="button"
                  class="choice-card card p-3 bg-body"
                  class:selected={Number(nodeId) === Number(node.id)}
                  aria-pressed={Number(nodeId) === Number(node.id)}
                  onclick={() => selectNode(node)}>
                  <div class="d-flex flex-wrap align-items-center gap-2">
                    <span class="choice-icon bg-body-secondary">
                      <i
                        class="fa-solid {node.kind === NodeKinds.LOCAL
                          ? 'fa-house-laptop'
                          : 'fa-server'}"
                        aria-hidden="true"></i>
                    </span>
                    <span class="fw-semibold text-break">{getNodeDisplayName(node)}</span>
                    <span class="badge text-bg-secondary">{node.kind || NodeKinds.REMOTE}</span>
                    <span class="badge text-bg-success">{$_(nodeStatusLabel(node))}</span>
                  </div>
                  <div class="small text-body-secondary mt-1">
                    {nodeSummary(node)}
                  </div>
                </button>
              {/each}
            </div>

            <button type="button" class="btn btn-link btn-sm px-0 mt-2" onclick={addNode}>
              <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
              {$_('components.modals.create-server.add-node')}
            </button>
          {/if}
        {:else if step === STEP_SOFTWARE}
          {#if isFolderSource(source)}
            <p class="text-body-secondary small">
              {$_(
                source === Sources.IN_PLACE
                  ? 'components.modals.create-server.in-place-description'
                  : 'components.modals.create-server.folder-description',
              )}
            </p>

            <label class="form-label" for="createServerFolder">
              {$_('components.modals.create-server.folder-label')}
            </label>
            <input
              id="createServerFolder"
              type="text"
              class="form-control font-monospace"
              class:is-invalid={folderPath.trim() !== '' && !folderPathValid}
              placeholder="/home/minecraft/survival"
              bind:value={folderPath} />
            <div class="invalid-feedback">
              {$_('components.modals.create-server.import.folder-invalid')}
            </div>
            <div class="form-text">{$_('components.modals.create-server.folder-hint')}</div>
            {#if source === Sources.IN_PLACE}
              <div class="alert alert-warning mt-3 mb-0 small" role="alert">
                <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                {$_('components.modals.create-server.in-place-stop-note')}
              </div>
            {:else}
              <div class="alert alert-info mt-3 mb-0 small" role="alert">
                <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
                {$_('components.modals.create-server.import.folder-copy-note')}
              </div>
            {/if}
          {:else if source === Sources.UPLOAD}
            <p class="text-body-secondary small">
              {$_('components.modals.create-server.import.upload-description')}
            </p>

            {#if uploadTicket}
              <div class="alert alert-success d-flex align-items-center gap-3 mb-0" role="alert">
                <i class="fa-solid fa-file-zipper fa-2x" aria-hidden="true"></i>
                <div class="min-w-0 flex-grow-1">
                  <div class="fw-semibold text-break">{uploadFilename}</div>
                  <div class="small">
                    {formatBytes(uploadSize, uploadSize < 1024 ? 0 : 1)}
                    &middot; {$_('components.modals.create-server.import.upload-expires')}
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  onclick={clearUpload}>
                  {$_('buttons.change')}
                </button>
              </div>
            {:else if uploadBusy}
              <div class="d-flex justify-content-between small mb-1">
                <span class="text-break">{uploadFilename}</span>
                <span class="font-monospace">{uploadPercent}%</span>
              </div>
              <div
                class="progress"
                style="height: 6px;"
                role="progressbar"
                aria-label={$_('components.modals.create-server.import.upload-progress')}
                aria-valuenow={uploadPercent}
                aria-valuemin="0"
                aria-valuemax="100">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  style="width: {uploadPercent}%;">
                </div>
              </div>
            {:else}
              <DragAndDropZone
                id="createServerUpload"
                accept={['.zip']}
                maxFileSize={MAX_UPLOAD_BYTES}
                style="min-height: 9rem;"
                icon="fa-solid fa-file-zipper fa-2x"
                title={$_('components.modals.create-server.import.upload-drop')}
                subtitle={$_('components.modals.create-server.import.upload-limit')}
                on:drop={(event) => void uploadArchive(event.detail)}
                on:error={(event) => onUploadRejected(event.detail)} />
            {/if}
          {:else if source === Sources.MODPACK}
            <p class="text-body-secondary small">
              {$_('components.modals.create-server.import.modpack-description')}
            </p>

            <SearchInput
              placeholderKey="components.modals.create-server.import.modpack-search-placeholder"
              ariaLabelKey="components.modals.create-server.import.modpack-search-placeholder"
              searching={modpackSearching}
              initialValue={modpackQuery}
              onchange={(value) => searchModpacks(value)} />

            {#if modpackSearching}
              <div class="text-center py-4">
                <span class="spinner-border" role="status" aria-hidden="true"></span>
              </div>
            {:else if modpackError}
              <div class="alert alert-warning mt-3 mb-0" role="alert">{$_(modpackError)}</div>
            {:else if modpackResults.length === 0}
              <NoContent
                icon="fa-solid fa-cubes fa-3x"
                text={modpackQuery.trim()
                  ? $_('components.modals.create-server.import.modpack-no-results')
                  : $_('components.modals.create-server.import.modpack-search-hint')} />
            {:else}
              <div class="modpack-results vstack gap-2 mt-3">
                {#each modpackResults as item (item.key)}
                  <button
                    type="button"
                    class="choice-card card p-2 bg-body"
                    class:selected={modpackProject?.key === item.key}
                    aria-pressed={modpackProject?.key === item.key}
                    onclick={() => selectModpack(item)}>
                    <div class="d-flex align-items-center gap-2">
                      {#if item.iconUrl}
                        <img
                          src={sanitizeImageSrc(item.iconUrl, '')}
                          alt=""
                          width="32"
                          height="32"
                          class="rounded flex-shrink-0" />
                      {:else}
                        <span class="choice-icon bg-body-secondary">
                          <i class="fa-solid fa-cubes" aria-hidden="true"></i>
                        </span>
                      {/if}
                      <span class="min-w-0">
                        <span class="fw-semibold d-block text-break">{item.name}</span>
                        <span class="small text-body-secondary d-block text-break">
                          {item.summary || item.author}
                        </span>
                      </span>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}

            {#if modpackProject}
              <div class="mt-3">
                <label class="form-label" for="createServerModpackVersion">
                  {$_('components.modals.create-server.import.modpack-version-label')}
                </label>
                {#if modpackVersionsLoading}
                  <div class="text-center py-2">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
                    ></span>
                  </div>
                {:else if modpackVersions.length === 0}
                  <div class="alert alert-warning mb-0 small" role="alert">
                    {$_('components.modals.create-server.import.modpack-no-versions')}
                  </div>
                {:else}
                  <select
                    id="createServerModpackVersion"
                    class="form-select"
                    bind:value={modpackVersionId}>
                    {#each modpackVersions as option (option.id)}
                      <option value={option.id}>{option.label}</option>
                    {/each}
                  </select>
                {/if}
              </div>
            {/if}
          {:else if softwareLoading}
            <div class="text-center py-4">
              <span class="spinner-border" role="status" aria-hidden="true"></span>
            </div>
          {:else if softwareList.length === 0}
            <NoContent
              icon="fa-solid fa-box-open fa-3x"
              text={softwareUnavailable
                ? $_('components.modals.create-server.software-unavailable')
                : $_('components.modals.create-server.software-empty')} />
          {:else}
            <p class="text-body-secondary small">
              {$_('components.modals.create-server.software-description')}
            </p>

            <div class="row g-2">
              {#each softwareList as item (item.id)}
                {@const noteBadge = softwareNoteBadge(item)}
                <div class="col-md-6">
                  <button
                    type="button"
                    class="choice-card card h-100 p-3 bg-body"
                    class:selected={softwareId === item.id}
                    aria-pressed={softwareId === item.id}
                    onclick={() => selectSoftware(item)}>
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <SoftwareLogo id={item.id} />
                      <span class="fw-semibold">{item.name || item.id}</span>
                      {#if item.recommended}
                        <span class="badge text-bg-primary">
                          {$_('components.modals.create-server.software-recommended')}
                        </span>
                      {/if}
                      {#if noteBadge}
                        <!-- Why this software is special: compiled on the node, straight off a
                             CI, or end of life. A note the badge cannot say in two words is in
                             its tooltip. -->
                        <span
                          class="badge {noteBadge.className}"
                          use:tooltip={[
                            noteBadge.hint ? $_(noteBadge.hint) : '',
                            { placement: 'top' },
                          ]}>
                          {$_(noteBadge.label)}
                        </span>
                      {/if}
                    </div>
                    <span class="small text-body-secondary">
                      {$_('components.modals.create-server.software-versions', {
                        values: { count: versionsOf(item).length },
                      })}
                    </span>
                  </button>
                </div>
              {/each}
            </div>

            {#if selectedSoftware}
              <div class="mt-3">
                <label class="form-label" for="createServerVersion">
                  {$_('components.modals.create-server.version-label')}
                </label>
                <select id="createServerVersion" class="form-select" bind:value={version}>
                  {#each versionsOf(selectedSoftware) as option (option)}
                    {@const versionLabel = softwareVersionLabelKey(selectedSoftware, option)}
                    <option value={option}>{versionLabel ? $_(versionLabel) : option}</option>
                  {/each}
                </select>
              </div>

              {#if BUILD_TOOLS_SOFTWARE.includes(String(selectedSoftware.id).toUpperCase())}
                <div class="alert alert-warning mt-3 mb-0 small" role="alert">
                  <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                  {$_('components.modals.create-server.spigot-hint')}
                </div>
              {/if}
            {/if}
          {/if}
        {:else if step === STEP_SETTINGS}
          {#if isImport}
            <!-- §2.4.8: an import has no software step — the node reads the jar, the loader and
                 the port out of what it just took over and Pano fills the row from IMPORT_RESULT. -->
            <div class="alert alert-info small" role="alert">
              <i class="fa-solid fa-wand-magic-sparkles me-1" aria-hidden="true"></i>
              {$_('components.modals.create-server.import.detected-note')}
              <div class="mt-2 vstack gap-1">
                <div>
                  <span class="text-body-secondary"
                    >{$_('components.modals.create-server.review-software')}:</span>
                  <span class="fst-italic"
                    >{$_('components.modals.create-server.import.will-be-detected')}</span>
                </div>
                <div>
                  <span class="text-body-secondary"
                    >{$_('components.modals.create-server.version-label')}:</span>
                  <span class="fst-italic"
                    >{$_('components.modals.create-server.import.will-be-detected')}</span>
                </div>
              </div>
            </div>
          {/if}

          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="createServerName">
                {$_('components.modals.create-server.name-label')}
              </label>
              <input
                id="createServerName"
                type="text"
                class="form-control"
                maxlength="64"
                placeholder={$_('components.modals.create-server.name-placeholder')}
                bind:value={name} />
            </div>

            <div class="col-md-6">
              <label class="form-label" for="createServerMemory">
                {$_('pages.servers.create.memory-label')}
              </label>
              <div class="input-group">
                <input
                  id="createServerMemory"
                  type="number"
                  class="form-control"
                  min="512"
                  step="512"
                  bind:value={memoryMb} />
                <span class="input-group-text">MB</span>
              </div>
              <div class="btn-group btn-group-sm mt-2" role="group">
                {#each MEMORY_PRESETS as preset (preset)}
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    class:active={Number(memoryMb) === preset}
                    onclick={() => (memoryMb = preset)}>
                    {preset / 1024} GB
                  </button>
                {/each}
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="createServerPort">
                {$_('pages.servers.create.port-label')}
              </label>
              <input
                id="createServerPort"
                type="number"
                class="form-control"
                min="1"
                max="65535"
                bind:value={port} />
              <div class="form-text">{$_('pages.servers.create.port-hint')}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="createServerJava">
                {$_('pages.servers.create.java-label')}
              </label>
              <select id="createServerJava" class="form-select" bind:value={javaMajor}>
                <option value="">{javaAutoLabel(automaticJava)}</option>
                {#each javaChoices.installed as major (major)}
                  <option value={String(major)}>Java {major}</option>
                {/each}
                {#each javaChoices.downloadable as entry (entry.major)}
                  <option value={String(entry.major)}>{javaDownloadLabel(entry)}</option>
                {/each}
              </select>
              <div class="form-text">
                {#if javaDownloadNote}
                  <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
                  {javaDownloadNote}
                {:else}
                  {$_('pages.servers.create.java-hint')}
                {/if}
              </div>
            </div>

            <div class="col-12">
              <label class="form-label" for="createServerJvmArgs">
                {$_('pages.servers.create.jvm-args-label')}
              </label>
              <textarea
                id="createServerJvmArgs"
                class="form-control font-monospace"
                rows="3"
                spellcheck="false"
                bind:value={jvmArgs}></textarea>
              <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick={useAikar}>
                  <i class="fa-solid fa-wand-magic-sparkles me-1" aria-hidden="true"></i>
                  {$_('pages.servers.create.aikar-preset')}
                </button>
                <span class="form-text m-0">{$_('pages.servers.create.jvm-args-hint')}</span>
              </div>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="createServerAutoStart"
                  bind:checked={autoStart} />
                <label class="form-check-label" for="createServerAutoStart">
                  {$_('pages.servers.create.auto-start-label')}
                </label>
                <div class="form-text">{$_('pages.servers.create.auto-start-hint')}</div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="createServerCrashRestart"
                  bind:checked={crashRestart} />
                <label class="form-check-label" for="createServerCrashRestart">
                  {$_('pages.servers.create.crash-restart-label')}
                </label>
                <div class="form-text">
                  {$_('pages.servers.create.crash-restart-hint')}
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="createServerAutoUpdateCheck"
                  bind:checked={autoUpdateCheck} />
                <label class="form-check-label" for="createServerAutoUpdateCheck">
                  {$_('pages.servers.create.auto-update-check-label')}
                </label>
                <div class="form-text">
                  {$_('pages.servers.create.auto-update-check-hint')}
                </div>
              </div>
            </div>

            <div class="col-12">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="createServerEula"
                  bind:checked={acceptEula} />
                <label class="form-check-label" for="createServerEula">
                  {$_('components.modals.create-server.eula-label')}
                  <a href={EULA_URL} target="_blank" rel="noreferrer noopener">
                    {$_('components.modals.create-server.eula-link')}
                    <i class="fa-solid fa-arrow-up-right-from-square ms-1 small" aria-hidden="true"
                    ></i>
                  </a>
                </label>
              </div>
            </div>
          </div>
        {:else}
          <p class="text-body-secondary small">
            {$_('components.modals.create-server.review-description')}
          </p>

          <table class="table table-sm mb-0">
            <tbody>
              {#each reviewRows as row (row.label)}
                <tr>
                  <th scope="row" class="review-key fw-normal text-body-secondary">
                    {$_(row.label)}
                  </th>
                  <td class="text-break">{row.value}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <div class="modal-footer justify-content-between flex-nowrap">
        <button
          type="button"
          class="btn btn-link"
          disabled={step === STEP_SOURCE || submitting}
          onclick={back}>
          {$_('buttons.back')}
        </button>

        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary"
            data-bs-dismiss="modal"
            disabled={submitting}>
            {$_('buttons.cancel')}
          </button>

          {#if step === STEP_REVIEW}
            <button
              type="button"
              class="btn btn-primary"
              disabled={!canContinue || submitting}
              onclick={submit}>
              {#if submitting}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_('components.modals.create-server.create-button')}
            </button>
          {:else}
            <button type="button" class="btn btn-primary" disabled={!canContinue} onclick={next}>
              {$_('buttons.next')}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  /** Sources the wizard can create a server from (§2.4.8). */
  export const Sources = Object.freeze({
    FRESH: 'FRESH',
    EXISTING_FOLDER: 'EXISTING_FOLDER',
    /** The same folder, run where it is by the Pano Agent (the node) — nothing is copied. */
    IN_PLACE: 'IN_PLACE',
    UPLOAD: 'UPLOAD',
    MODPACK: 'MODPACK',
  });

  /**
   * An absolute path the node can resolve. POSIX paths start at the root; Windows nodes take a
   * drive letter or a UNC share. Everything else is a relative path, which the node would
   * resolve against its own working directory — never what the admin meant.
   *
   * @param {string} value
   * @returns {boolean}
   */
  export function isAbsoluteNodePath(value) {
    const path = String(value || '').trim();

    if (path.length < 2) {
      return false;
    }

    return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path) || path.startsWith('\\\\');
  }

  /** Software ids Pano can only build through BuildTools, so Paper is promoted instead (§2.3). */
  const BUILD_TOOLS_SOFTWARE = ['SPIGOT', 'CRAFTBUKKIT', 'BUKKIT'];

  const EULA_URL = 'https://aka.ms/MinecraftEULA';

  /** Sources that start from a folder already on the node's machine. */
  export function isFolderSource(source) {
    return source === Sources.EXISTING_FOLDER || source === Sources.IN_PLACE;
  }

  /** @type {((options?: { nodeId?: number | string | null, source?: string }) => void) | null} */
  let openModal = null;

  /**
   * Open the wizard. Registered with the chooser by the mounted instance.
   *
   * @param {{ nodeId?: number | string | null, source?: string }} [options] `nodeId` preselects
   *   that node (the node page's "Create server"); the admin can still pick another one on the
   *   node step. `source` preselects where the server comes from and skips straight to the node
   *   step — the chooser's "Link with the Pano Agent" opens it on `IN_PLACE`.
   */
  export function show(options = {}) {
    openModal?.(options);
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { goto } from '$app/navigation';

  import ApiUtil from '$lib/api.util.js';
  import tooltip from '$lib/tooltip.util';
  import {
    cacheNode,
    fetchNodes,
    getNodeDisplayName,
    fetchNodeJava,
    fetchSoftwareJavaRequirement,
    isNodeUsable,
    javaChoicesFor,
    javaDownloadSize,
    resolveAutomaticJava,
    NodeKinds,
    nodeStatusLabel,
    openAddNodeModal,
    requestLocalNodeSetup,
  } from '$lib/nodes.util.js';
  import {
    aikarFlags,
    isEndpointUnavailable,
    jvmArgsToList,
    showServerActionError,
    softwareNoteBadge,
    softwareVersionLabelKey,
  } from '$lib/servers.util.js';
  import { onNode, onNodeRemoved, subscribeNodes } from '$lib/panelRealtime.js';
  import { sanitizeImageSrc } from '$lib/security.util.js';
  import { formatBytes } from '$lib/string.util.js';

  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import SoftwareLogo from '$lib/components/servers/SoftwareLogo.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { setCreateServerOpener } from './AddServerModal.svelte';

  const STEP_SOURCE = 0;
  const STEP_NODE = 1;
  const STEP_SOFTWARE = 2;
  const STEP_SETTINGS = 3;
  const STEP_REVIEW = 4;
  const STEP_COUNT = 5;

  const MEMORY_PRESETS = [1024, 2048, 4096, 8192];

  const SOURCES = [
    {
      id: Sources.FRESH,
      icon: 'fa-solid fa-wand-magic-sparkles',
      title: 'components.modals.create-server.source-fresh-title',
      description: 'components.modals.create-server.source-fresh-description',
      enabled: true,
    },
    {
      id: Sources.EXISTING_FOLDER,
      icon: 'fa-solid fa-folder-open',
      title: 'components.modals.create-server.source-folder-title',
      description: 'components.modals.create-server.source-folder-description',
      enabled: true,
    },
    {
      id: Sources.IN_PLACE,
      icon: 'fa-solid fa-link',
      title: 'components.modals.create-server.source-in-place-title',
      description: 'components.modals.create-server.source-in-place-description',
      enabled: true,
    },
    {
      id: Sources.UPLOAD,
      icon: 'fa-solid fa-file-zipper',
      title: 'components.modals.create-server.source-upload-title',
      description: 'components.modals.create-server.source-upload-description',
      enabled: true,
    },
    {
      id: Sources.MODPACK,
      icon: 'fa-solid fa-cubes',
      title: 'components.modals.create-server.source-modpack-title',
      description: 'components.modals.create-server.source-modpack-description',
      enabled: true,
    },
  ];

  /** The transfer endpoint refuses anything larger (§2.4.8), so the browser says so first. */
  const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;

  /** Modpacks only come from Modrinth for now — `.mrpack` is the format the node understands. */
  const MODPACK_SOURCE = 'modrinth';

  /** The label of each source, reused by the review table. */
  const SOURCE_TITLES = Object.freeze({
    [Sources.FRESH]: 'components.modals.create-server.source-fresh-title',
    [Sources.EXISTING_FOLDER]: 'components.modals.create-server.source-folder-title',
    [Sources.IN_PLACE]: 'components.modals.create-server.source-in-place-title',
    [Sources.UPLOAD]: 'components.modals.create-server.source-upload-title',
    [Sources.MODPACK]: 'components.modals.create-server.source-modpack-title',
  });

  /** What the third step is called, which depends on what the server is coming from. */
  const SOURCE_STEP_LABELS = Object.freeze({
    [Sources.EXISTING_FOLDER]: 'components.modals.create-server.step-folder',
    [Sources.IN_PLACE]: 'components.modals.create-server.step-folder',
    [Sources.UPLOAD]: 'components.modals.create-server.import.step-upload',
    [Sources.MODPACK]: 'components.modals.create-server.import.step-modpack',
    [Sources.FRESH]: 'components.modals.create-server.step-software',
  });

  let modalElement = $state();
  let modalInstance;

  let step = $state(STEP_SOURCE);
  let source = $state(Sources.FRESH);
  let submitting = $state(false);

  let nodes = $state([]);
  let nodesLoading = $state(false);
  let nodesUnavailable = $state(false);
  let nodeId = $state(null);
  let localSetupBusy = $state(false);

  let softwareList = $state([]);
  let softwareLoading = $state(false);
  let softwareUnavailable = $state(false);
  let softwareId = $state('');
  let version = $state('');

  let folderPath = $state('');

  /** UPLOAD — the ticket `POST /api/panel/transfers/upload` handed back for the spooled zip. */
  let uploadTicket = $state('');
  let uploadFilename = $state('');
  let uploadSize = $state(0);
  let uploadBusy = $state(false);
  let uploadPercent = $state(0);

  /** MODPACK — the Modrinth project and the pack version the node will resolve. */
  let modpackQuery = $state('');
  let modpackResults = $state([]);
  let modpackSearching = $state(false);
  let modpackError = $state('');
  let modpackProject = $state(null);
  let modpackVersions = $state([]);
  let modpackVersionsLoading = $state(false);
  let modpackVersionId = $state('');
  let modpackSearchSeq = 0;
  let modpackVersionsSeq = 0;

  let name = $state('');
  let memoryMb = $state(2048);
  let port = $state(25565);
  let javaMajor = $state('');
  let jvmArgs = $state('');
  let autoStart = $state(true);
  let crashRestart = $state(true);
  /** SM-69 (§2.4.34): the daily plugin update sweep, on by default like on the settings page. */
  let autoUpdateCheck = $state(true);
  let acceptEula = $state(false);

  /** @type {(() => void) | null} */
  let releaseNodes = null;

  const usableNodes = $derived(nodes.filter((node) => isNodeUsable(node)));
  const selectedNode = $derived(
    usableNodes.find((node) => Number(node.id) === Number(nodeId)) ?? null,
  );
  /**
   * SM-63 — the selected node's Java catalogue (installed + downloadable majors), or null while
   * it loads or when the node / backend cannot answer: the select then offers what the node row
   * reported, exactly as before.
   *
   * @type {import('$lib/nodes.util.js').JavaCatalog | null}
   */
  let javaCatalog = $state(null);
  /** What the chosen software version needs (`java: { minimum, maximum }`), null when unknown. */
  let javaRequirement = $state(null);
  let javaCatalogSeq = 0;
  let javaRequirementSeq = 0;

  const javaChoices = $derived(javaChoicesFor(selectedNode, javaCatalog));
  /** An import's version is only known once the node has looked, so it has no automatic pick. */
  const automaticJava = $derived(
    source === Sources.FRESH ? resolveAutomaticJava(javaRequirement, javaChoices) : null,
  );
  const pinnedDownload = $derived(
    javaChoices.downloadable.find((entry) => String(entry.major) === javaMajor) ?? null,
  );
  /** The sentence under the select (and in the review) when a Java will be downloaded first. */
  const javaDownloadNote = $derived(
    pinnedDownload
      ? $_('pages.servers.create.java-download-note', {
          values: { major: pinnedDownload.major, size: javaSizeText(pinnedDownload.size) },
        })
      : javaMajor === '' && automaticJava?.download
        ? $_('pages.servers.create.java-download-note', {
            values: { major: automaticJava.major, size: javaSizeText(automaticJava.size) },
          })
        : '',
  );

  /** A primitive, so a node frame that only refreshes metrics does not re-read the catalogue. */
  const selectedNodeId = $derived(selectedNode?.id ?? null);

  // The catalogue belongs to one node; switching nodes starts over.
  $effect(() => {
    const id = selectedNodeId;
    const seq = ++javaCatalogSeq;

    javaCatalog = null;

    if (id == null) {
      return;
    }

    void fetchNodeJava(id).then((result) => {
      if (seq === javaCatalogSeq && result.status === 'ok') {
        javaCatalog = result.catalog ?? null;
      }
    });
  });

  $effect(() => {
    const id = source === Sources.FRESH ? softwareId : '';
    const name = source === Sources.FRESH ? version : '';
    const seq = ++javaRequirementSeq;

    javaRequirement = null;

    if (!id || !name) {
      return;
    }

    void fetchSoftwareJavaRequirement(id, name).then((requirement) => {
      if (seq === javaRequirementSeq) {
        javaRequirement = requirement;
      }
    });
  });

  // A pinned major the new node neither has nor can download is not a choice any more.
  $effect(() => {
    const major = Number(javaMajor);

    if (
      javaMajor !== '' &&
      !javaChoices.installed.includes(major) &&
      !javaChoices.downloadable.some((entry) => entry.major === major)
    ) {
      javaMajor = '';
    }
  });
  const selectedSoftware = $derived(softwareList.find((item) => item.id === softwareId) ?? null);

  /** Everything that is not a fresh install takes an existing server over (§2.4.8). */
  const isImport = $derived(source !== Sources.FRESH);
  const folderPathValid = $derived(isAbsoluteNodePath(folderPath));
  const selectedModpackVersion = $derived(
    modpackVersions.find((entry) => entry.id === modpackVersionId) ?? null,
  );

  const stepLabel = $derived(
    [
      'components.modals.create-server.step-source',
      'components.modals.create-server.step-node',
      SOURCE_STEP_LABELS[source] || 'components.modals.create-server.step-software',
      'components.modals.create-server.step-settings',
      'components.modals.create-server.step-review',
    ][step],
  );

  const canContinue = $derived(isStepValid(step));

  const reviewRows = $derived([
    {
      label: 'components.modals.create-server.review-source',
      value: $_(SOURCE_TITLES[source] || 'components.modals.create-server.source-fresh-title'),
    },
    {
      label: 'components.modals.create-server.review-node',
      value: selectedNode ? getNodeDisplayName(selectedNode) : '—',
    },
    ...sourceReviewRows(),
    { label: 'components.modals.create-server.review-name', value: name.trim() },
    { label: 'components.modals.create-server.review-memory', value: `${memoryMb} MB` },
    { label: 'components.modals.create-server.review-port', value: String(port) },
    {
      label: 'components.modals.create-server.review-java',
      value: [javaMajor ? `Java ${javaMajor}` : javaAutoLabel(automaticJava), javaDownloadNote]
        .filter(Boolean)
        .join(' — '),
    },
    {
      label: 'components.modals.create-server.review-jvm-args',
      value: jvmArgs.trim() || $_('components.modals.create-server.review-none'),
    },
    {
      label: 'components.modals.create-server.review-auto-start',
      value: $_(autoStart ? 'buttons.yes' : 'buttons.no'),
    },
    {
      label: 'components.modals.create-server.review-crash-restart',
      value: $_(crashRestart ? 'buttons.yes' : 'buttons.no'),
    },
    {
      label: 'components.modals.create-server.review-auto-update-check',
      value: $_(autoUpdateCheck ? 'buttons.yes' : 'buttons.no'),
    },
  ]);

  /**
   * @param {number|null|undefined} size
   * @returns {string}
   */
  function javaSizeText(size) {
    return javaDownloadSize(size) || $_('pages.servers.create.java-size-unknown');
  }

  /**
   * "Automatic (Java 21)" once the version's requirement is known, plain "Automatic" before.
   *
   * @param {{ major: number } | null} automatic
   * @returns {string}
   */
  function javaAutoLabel(automatic) {
    return automatic
      ? $_('pages.servers.create.java-auto-resolved', { values: { major: automatic.major } })
      : $_('pages.servers.create.java-auto');
  }

  /**
   * @param {{ major: number, size: number|null }} entry
   * @returns {string}
   */
  function javaDownloadLabel(entry) {
    const size = javaDownloadSize(entry.size);

    return size
      ? $_('pages.servers.create.java-will-download', {
          values: { major: entry.major, size },
        })
      : $_('pages.servers.create.java-will-download-unsized', {
          values: { major: entry.major },
        });
  }

  /**
   * The rows the review table shows for the chosen source: an import reviews where it is coming
   * from and says the software will be detected, a fresh install reviews what it will install.
   *
   * @returns {Array<{ label: string, value: string }>}
   */
  function sourceReviewRows() {
    if (isFolderSource(source)) {
      return [{ label: 'components.modals.create-server.review-folder', value: folderPath.trim() }];
    }

    if (source === Sources.UPLOAD) {
      return [
        {
          label: 'components.modals.create-server.import.review-archive',
          value: uploadFilename || '—',
        },
        {
          label: 'components.modals.create-server.review-software',
          value: $_('components.modals.create-server.import.will-be-detected'),
        },
      ];
    }

    if (source === Sources.MODPACK) {
      return [
        {
          label: 'components.modals.create-server.import.review-modpack',
          value: modpackProject?.name || '—',
        },
        {
          label: 'components.modals.create-server.import.modpack-version-label',
          value: selectedModpackVersion?.label || '—',
        },
      ];
    }

    return [
      {
        label: 'components.modals.create-server.review-software',
        value: `${selectedSoftware?.name || softwareId} ${version}`.trim(),
      },
    ];
  }

  /**
   * @param {number} index
   * @returns {boolean}
   */
  function isStepValid(index) {
    if (index === STEP_SOURCE) {
      return !!SOURCE_TITLES[source];
    }

    if (index === STEP_NODE) {
      return !!selectedNode;
    }

    if (index === STEP_SOFTWARE) {
      if (isFolderSource(source)) {
        return folderPathValid;
      }

      if (source === Sources.UPLOAD) {
        return !!uploadTicket;
      }

      if (source === Sources.MODPACK) {
        return !!modpackProject && !!modpackVersionId;
      }

      return !!softwareId && !!version;
    }

    const memory = Number(memoryMb);
    const gamePort = Number(port);

    return (
      name.trim().length >= 2 &&
      Number.isFinite(memory) &&
      memory >= 512 &&
      Number.isFinite(gamePort) &&
      gamePort >= 1 &&
      gamePort <= 65535 &&
      acceptEula
    );
  }

  /**
   * @param {object} node
   * @returns {string}
   */
  function nodeSummary(node) {
    const resources = node?.resources || {};
    const parts = [
      [resources.os, resources.arch].filter(Boolean).join('/'),
      node.runtime,
      node.version,
    ].filter(Boolean);

    return parts.join(' · ');
  }

  /**
   * @param {object} item
   * @returns {string[]}
   */
  function versionsOf(item) {
    return Array.isArray(item?.versions) ? item.versions.map((entry) => String(entry)) : [];
  }

  /**
   * @param {object} node
   */
  function selectNode(node) {
    nodeId = node.id;
  }

  /**
   * @param {object} item
   */
  function selectSoftware(item) {
    softwareId = item.id;
    // Prefer the backend's recommended (newest stable) version over the raw list head, which may be a snapshot.
    version = item.recommendedVersion || versionsOf(item)[0] || '';
  }

  function useAikar() {
    jvmArgs = aikarFlags(memoryMb);
  }

  /** Throws the spooled archive away so another one can be picked. */
  function clearUpload() {
    uploadTicket = '';
    uploadFilename = '';
    uploadSize = 0;
    uploadPercent = 0;
    uploadBusy = false;
  }

  /**
   * The drop zone rejected the file before it ever reached us — wrong extension, or bigger than
   * the transfer endpoint accepts.
   *
   * @param {{ error?: string }} detail
   */
  function onUploadRejected(detail) {
    void showError(
      detail?.error === 'INVALID_SIZE'
        ? 'components.modals.create-server.import.upload-too-large'
        : 'components.modals.create-server.import.upload-wrong-type',
    );
  }

  /**
   * Spools the zip through `POST /api/panel/transfers/upload` (multipart part `file`) and keeps
   * the ticket it answers with. The ticket — not the file — is what the create call carries, so
   * the node can pull the archive itself; it expires after 30 minutes (§2.4.8).
   *
   * @param {File} file
   */
  async function uploadArchive(file) {
    if (!file || uploadBusy) {
      return;
    }

    clearUpload();

    uploadFilename = file.name;
    uploadSize = file.size;
    uploadBusy = true;
    uploadPercent = 0;

    const form = new FormData();

    form.append('file', file, file.name);

    /** @type {any} */
    let body = null;

    try {
      body = await ApiUtil.post({
        path: '/api/panel/transfers/upload',
        body: form,
        onUploadProgress: (progress) => {
          uploadPercent = Math.min(100, Math.round(Number(progress) * 100));
        },
        handler: (/** @type {object} */ response) => response,
      });
    } catch (uploadError) {
      console.error('Upload failed', uploadError);
      body = null;
    }

    uploadBusy = false;

    if (!body) {
      clearUpload();

      return;
    }

    if (isEndpointUnavailable(body)) {
      clearUpload();
      await showError('components.modals.create-server.import.upload-unavailable');

      return;
    }

    if (body.error) {
      clearUpload();
      await showServerActionError(body.error);

      return;
    }

    uploadTicket = String(body.ticket ?? body.uploadTicket ?? '');
    uploadFilename = String(body.filename ?? file.name);
    uploadSize = Number(body.size) || file.size;

    if (!uploadTicket) {
      clearUpload();
      await showError('components.modals.create-server.import.upload-unavailable');
    }
  }

  function clearModpack() {
    modpackProject = null;
    modpackVersions = [];
    modpackVersionsLoading = false;
    modpackVersionId = '';
  }

  /**
   * `GET /api/panel/plugins/search?source=modrinth&type=modpack` — the same catalogue the plugin
   * browser uses, asked for packs instead of plugins. A build without the endpoint answers with
   * the proxy's HTML, which becomes an explanatory line rather than an exception.
   *
   * @param {string} value
   */
  async function searchModpacks(value) {
    modpackQuery = String(value || '');

    const term = modpackQuery.trim();
    const sequence = ++modpackSearchSeq;

    clearModpack();
    modpackError = '';

    if (!term) {
      modpackResults = [];
      modpackSearching = false;

      return;
    }

    modpackSearching = true;

    const params = new URLSearchParams({
      source: MODPACK_SOURCE,
      q: term,
      type: 'modpack',
      limit: '20',
    });

    const body = await ApiUtil.get({
      path: `/api/panel/plugins/search?${params.toString()}`,
      handler: (/** @type {object} */ response) => response,
    });

    if (sequence !== modpackSearchSeq) {
      return;
    }

    modpackSearching = false;

    if (!body) {
      modpackError = 'components.modals.create-server.import.modpack-search-failed';

      return;
    }

    if (isEndpointUnavailable(body)) {
      modpackResults = [];
      modpackError = 'components.modals.create-server.import.modpack-unavailable';

      return;
    }

    if (body.error) {
      modpackResults = [];
      modpackError = 'components.modals.create-server.import.modpack-search-failed';

      return;
    }

    modpackResults = (Array.isArray(body.results) ? body.results : []).map(
      (/** @type {object} */ result) => {
        const projectId = String(result?.projectId ?? result?.slug ?? '');

        return {
          key: `${MODPACK_SOURCE}:${projectId}`,
          projectId,
          name: String(result?.name ?? projectId),
          author: result?.author == null ? '' : String(result.author),
          summary: result?.summary == null ? '' : String(result.summary),
          iconUrl: result?.iconUrl == null ? '' : String(result.iconUrl),
        };
      },
    );
  }

  /**
   * @param {{ key: string, projectId: string, name: string }} item
   */
  async function selectModpack(item) {
    clearModpack();

    modpackProject = item;
    modpackVersionsLoading = true;

    const sequence = ++modpackVersionsSeq;

    const body = await ApiUtil.get({
      path: `/api/panel/plugins/search/${encodeURIComponent(MODPACK_SOURCE)}/${encodeURIComponent(item.projectId)}/versions?type=modpack`,
      handler: (/** @type {object} */ response) => response,
    });

    if (sequence !== modpackVersionsSeq) {
      return;
    }

    modpackVersionsLoading = false;

    if (!body || isEndpointUnavailable(body) || body.error) {
      modpackVersions = [];

      if (body?.error) {
        await showServerActionError(body.error);
      }

      return;
    }

    modpackVersions = (Array.isArray(body.versions) ? body.versions : []).map(
      (/** @type {object} */ entry) => {
        const id = String(entry?.id ?? '');
        const versionNumber = String(entry?.versionNumber ?? entry?.name ?? id);
        const gameVersions = Array.isArray(entry?.gameVersions)
          ? entry.gameVersions.map((/** @type {unknown} */ game) => String(game))
          : [];

        return {
          id,
          label: gameVersions.length
            ? `${versionNumber} · ${gameVersions.join(', ')}`
            : versionNumber,
        };
      },
    );

    modpackVersionId = modpackVersions[0]?.id || '';
  }

  function back() {
    if (step > STEP_SOURCE) {
      step -= 1;
    }
  }

  function next() {
    if (!canContinue || step >= STEP_REVIEW) {
      return;
    }

    step += 1;

    if (step === STEP_NODE && !nodes.length) {
      void loadNodes();
    }

    if (step === STEP_SOFTWARE && source === Sources.FRESH && !softwareList.length) {
      void loadSoftware();
    }

    if (step === STEP_SETTINGS && !name.trim()) {
      name = defaultName();
    }
  }

  /** @returns {string} */
  function defaultName() {
    const suggestion = isFolderSource(source)
      ? folderPath
          .trim()
          .replace(/[\\/]+$/, '')
          .split(/[\\/]/)
          .pop()
      : source === Sources.UPLOAD
        ? uploadFilename.replace(/\.zip$/i, '')
        : source === Sources.MODPACK
          ? modpackProject?.name
          : selectedSoftware?.name || selectedSoftware?.id;

    return String(suggestion || 'server')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  function reset() {
    step = STEP_SOURCE;
    source = Sources.FRESH;
    nodeId = usableNodes.length === 1 ? usableNodes[0].id : null;
    softwareId = '';
    version = '';
    folderPath = '';
    clearUpload();
    clearModpack();
    modpackQuery = '';
    modpackResults = [];
    modpackError = '';
    name = '';
    memoryMb = 2048;
    port = 25565;
    javaMajor = '';
    jvmArgs = '';
    autoStart = true;
    crashRestart = true;
    autoUpdateCheck = true;
    acceptEula = false;
    submitting = false;
  }

  async function loadNodes() {
    nodesLoading = true;

    const result = await fetchNodes();

    nodesLoading = false;

    if (result.status === 'network') {
      // ApiUtil already raised the offline splash; a second toast would be noise.
      return;
    }

    if (result.status === 'unavailable') {
      nodesUnavailable = true;
      nodes = [];

      return;
    }

    if (result.status === 'error') {
      await showServerActionError(result.error);

      return;
    }

    nodesUnavailable = false;
    nodes = result.nodes;

    if (nodeId == null && usableNodes.length === 1) {
      nodeId = usableNodes[0].id;
    }
  }

  async function loadSoftware() {
    softwareLoading = true;

    const body = await ApiUtil.get({
      path: '/api/panel/software',
      handler: (response) => response,
    });

    softwareLoading = false;

    if (body === undefined || body === null) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      softwareUnavailable = true;
      softwareList = [];

      return;
    }

    if (body.error) {
      await showServerActionError(body.error);

      return;
    }

    softwareUnavailable = false;
    softwareList = Array.isArray(body.software) ? body.software : Array.isArray(body) ? body : [];

    const recommended = softwareList.find((item) => item.recommended) || softwareList[0];

    if (recommended && !softwareId) {
      selectSoftware(recommended);
    }
  }

  async function setupLocalNode() {
    localSetupBusy = true;

    const result = await requestLocalNodeSetup();

    localSetupBusy = false;

    if (result.status === 'network') {
      return;
    }

    if (result.status === 'unavailable') {
      await showError('pages.servers.nodes.local-setup-unavailable');

      return;
    }

    if (result.status === 'error') {
      await showServerActionError(result.error);

      return;
    }

    await showSuccess('pages.servers.nodes.local-setup-started');
    await loadNodes();
  }

  function addNode() {
    hide(() => {
      if (!openAddNodeModal()) {
        void showError('pages.servers.nodes.add-unavailable');
      }
    });
  }

  /**
   * @param {(() => void) | undefined} [next]
   */
  function hide(next) {
    if (!modalElement) {
      next?.();

      return;
    }

    if (next) {
      modalElement.addEventListener('hidden.bs.modal', next, { once: true });
    }

    modalInstance?.hide();
  }

  async function submit() {
    if (!canContinue || submitting) {
      return;
    }

    submitting = true;

    /** @type {Record<string, unknown>} */
    const payload = {
      nodeId: Number(nodeId),
      name: name.trim(),
      javaMajor: javaMajor === '' ? null : Number(javaMajor),
      memoryMb: Number(memoryMb),
      port: Number(port),
      jvmArgs: jvmArgsToList(jvmArgs),
      autoStart: !!autoStart,
      crashRestart: !!crashRestart,
      autoUpdateCheck: !!autoUpdateCheck,
      acceptEula: !!acceptEula,
      source,
    };

    // §2.4.8 — one field per source; `software`/`version` are omitted for an import because the
    // node detects them from what it took over and Pano fills the row from IMPORT_RESULT.
    if (isFolderSource(source)) {
      payload.folderPath = folderPath.trim();
    } else if (source === Sources.UPLOAD) {
      payload.uploadTicket = uploadTicket;
    } else if (source === Sources.MODPACK) {
      payload.modpack = {
        source: MODPACK_SOURCE,
        projectId: modpackProject?.projectId ?? '',
        versionId: modpackVersionId,
      };
    } else {
      payload.software = softwareId;
      payload.version = version;
    }

    const body = await ApiUtil.post({
      path: '/api/panel/servers/create',
      body: payload,
      handler: (response) => response,
    });

    submitting = false;

    if (body === undefined || body === null) {
      return;
    }

    if (isEndpointUnavailable(body)) {
      await showError('components.modals.create-server.create-unavailable');

      return;
    }

    if (body.error) {
      await showServerActionError(body.error);

      return;
    }

    const createdId = body.server?.id ?? body.serverId ?? body.id ?? null;

    await showSuccess('components.modals.create-server.created', { name: payload.name });

    hide(() => {
      void goto(createdId == null ? `${base}/servers` : `${base}/servers/${createdId}`, {
        invalidateAll: true,
      });
    });
  }

  onMount(() => {
    modalInstance = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    openModal = (options = {}) => {
      reset();

      if (options?.nodeId != null) {
        nodeId = options.nodeId;
      }

      if (options?.source && SOURCE_TITLES[options.source]) {
        source = options.source;
        step = STEP_NODE;
      }

      modalInstance?.show();
    };

    const unregister = setCreateServerOpener(show);

    const onShow = () => {
      releaseNodes = releaseNodes || subscribeNodes();
      void loadNodes();
      void loadSoftware();
    };

    const onHidden = () => {
      releaseNodes?.();
      releaseNodes = null;
    };

    modalElement?.addEventListener('show.bs.modal', onShow);
    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    const offNode = onNode(({ node }) => {
      const cached = cacheNode(node);

      if (!cached) {
        return;
      }

      const index = nodes.findIndex((entry) => Number(entry.id) === Number(cached.id));

      nodes =
        index === -1
          ? [...nodes, cached]
          : nodes.map((entry, position) => (position === index ? cached : entry));
    });

    const offNodeRemoved = onNodeRemoved(({ nodeId: removedId }) => {
      nodes = nodes.filter((entry) => Number(entry.id) !== Number(removedId));

      if (Number(nodeId) === Number(removedId)) {
        nodeId = null;
      }
    });

    return () => {
      offNode();
      offNodeRemoved();
      unregister();
      modalElement?.removeEventListener('show.bs.modal', onShow);
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
      releaseNodes?.();
      releaseNodes = null;
      openModal = null;
      modalInstance = null;
    };
  });
</script>
