<style>
  .delete-node-servers {
    max-height: 9rem;
    overflow-y: auto;
  }

  .delete-node-progress {
    height: 6px;
  }

  .delete-node-steps {
    max-height: 14rem;
    overflow: auto;
    white-space: pre;
  }
</style>

<!-- Deleting a node (SM-64, §2.4.29): the node uninstalls itself and every server on it — files
     and backups — goes with it. Destructive, so it takes the node's name and the account
     password (§2.7). -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      {#if phase === 'running'}
        <div class="modal-body text-center py-4" aria-live="polite">
          <div
            class="spinner-border text-danger mb-3"
            role="status"
            aria-label={$_('pages.servers.nodes.remove.running-title', {
              values: { name: nodeName },
            })}>
          </div>
          <h5 class="mb-2">
            {$_('pages.servers.nodes.remove.running-title', { values: { name: nodeName } })}
          </h5>
          <div class="text-body-secondary small mb-3">
            {$_(
              force
                ? 'pages.servers.nodes.remove.running-forget'
                : 'pages.servers.nodes.remove.running-description',
            )}
          </div>
          {#if progress}
            <div
              class="progress delete-node-progress mb-2"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin="0"
              aria-valuemax="100">
              <div class="progress-bar bg-danger" style:width="{progress.percent}%"></div>
            </div>
            {#if progress.message}
              <div class="small text-body-secondary text-break">{progress.message}</div>
            {/if}
          {/if}
        </div>
      {:else if phase === 'done'}
        <div class="modal-body vstack gap-3">
          <div class="text-center">
            <i class="fa-solid fa-circle-check fa-3x d-block m-auto text-success mb-3"></i>
            <h5 class="mb-1">
              {$_('pages.servers.nodes.deleted', { values: { name: nodeName } })}
            </h5>
            <div class="text-body-secondary small">
              {$_(
                result?.removedFiles
                  ? 'pages.servers.nodes.remove.done-files-removed'
                  : 'pages.servers.nodes.remove.done-files-kept',
                { values: { count: result?.serversDeleted ?? 0 } },
              )}
            </div>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="fw-semibold">{$_('pages.servers.nodes.remove.manual-title')}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary ms-auto"
                onclick={copySteps}>
                <i class="fa-solid {copied ? 'fa-check' : 'fa-copy'} me-1" aria-hidden="true"></i>
                {copied ? $_('pages.servers.nodes.remove.copied') : $_('buttons.copy')}
              </button>
            </div>
            <div class="small text-body-secondary mb-2">
              {$_('pages.servers.nodes.remove.manual-description')}
            </div>
            <pre class="delete-node-steps bg-body-tertiary border rounded p-2 small mb-0"><code
                >{manualStepsText}</code></pre>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary w-100 m-0" onclick={() => modal?.hide()}>
            {$_('buttons.close')}
          </button>
        </div>
      {:else}
        <form
          onsubmit={(event) => {
            event.preventDefault();
            void confirm();
          }}>
          <div class="modal-body vstack gap-3">
            <div class="text-center">
              <i class="fa-solid fa-triangle-exclamation fa-3x d-block m-auto text-danger mb-3"></i>
              <h5 class="mb-0">{$_('pages.servers.nodes.delete-title')}</h5>
            </div>

            {#if previewLoading}
              <div class="text-center text-body-secondary small">
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {$_('pages.servers.nodes.remove.preview-loading')}
              </div>
            {:else}
              <div class="small">
                {$_(
                  canUninstall
                    ? 'pages.servers.nodes.remove.lead'
                    : 'pages.servers.nodes.remove.lead-forget',
                  { values: { name: nodeName } },
                )}
              </div>

              <ul class="list-group small">
                <li class="list-group-item">
                  <i class="fa-solid fa-server fa-fw me-2 text-danger" aria-hidden="true"></i>
                  {#if serverCount === 0}
                    {$_('pages.servers.nodes.remove.no-servers')}
                  {:else}
                    {$_('pages.servers.nodes.remove.servers', { values: { count: serverCount } })}
                    {#if servers.length > 0}
                      <ul class="delete-node-servers mb-0 mt-1 ps-4">
                        {#each servers as server (server.id)}
                          <li class="text-break">{server.name || `#${server.id}`}</li>
                        {/each}
                      </ul>
                    {/if}
                  {/if}
                </li>
                {#if preview}
                  <li class="list-group-item">
                    <i class="fa-solid fa-box-archive fa-fw me-2 text-danger" aria-hidden="true"
                    ></i>
                    {#if preview.backupCount === 0}
                      {$_('pages.servers.nodes.remove.no-backups')}
                    {:else if preview.backupBytes}
                      {$_('pages.servers.nodes.remove.backups-size', {
                        values: {
                          count: preview.backupCount,
                          size: formatBytes(preview.backupBytes, 1),
                        },
                      })}
                    {:else}
                      {$_('pages.servers.nodes.remove.backups', {
                        values: { count: preview.backupCount },
                      })}
                    {/if}
                  </li>
                  {#if canUninstall}
                    <li class="list-group-item">
                      <i class="fa-brands fa-java fa-fw me-2 text-danger" aria-hidden="true"></i>
                      {$_('pages.servers.nodes.remove.java', {
                        values: { count: preview.javaRuntimes },
                      })}
                    </li>
                  {/if}
                {/if}
                {#if canUninstall}
                  <li class="list-group-item">
                    <i class="fa-solid fa-hard-drive fa-fw me-2 text-danger" aria-hidden="true"></i>
                    {$_('pages.servers.nodes.remove.data')}
                  </li>
                {/if}
              </ul>

              {#if refusal}
                <div class="alert alert-danger small mb-0" role="alert">
                  <div>{$_(refusalKey)}</div>
                  {#if refusal.detail}
                    <div class="font-monospace text-break mt-1">{refusal.detail}</div>
                  {/if}
                </div>
              {:else if needsForce}
                <div class="alert alert-warning small mb-0" role="alert">
                  {$_(warningKey)}
                </div>
              {/if}

              {#if needsForce}
                <div class="form-check">
                  <input
                    id="deleteNodeForce"
                    class="form-check-input"
                    type="checkbox"
                    bind:checked={force} />
                  <label class="form-check-label small" for="deleteNodeForce">
                    {$_('pages.servers.nodes.remove.force')}
                  </label>
                </div>
              {/if}
            {/if}

            <div>
              <label class="form-label small" for="deleteNodeConfirmName">
                {$_('pages.servers.nodes.remove.type-name', { values: { name: nodeName } })}
              </label>
              <input
                id="deleteNodeConfirmName"
                class="form-control"
                type="text"
                autocomplete="off"
                spellcheck="false"
                placeholder={nodeName}
                bind:value={confirmName}
                bind:this={nameInput} />
            </div>
            <div>
              <input
                class="form-control"
                type="password"
                autocomplete="current-password"
                aria-label={$_('pages.servers.nodes.delete-password')}
                placeholder={$_('pages.servers.nodes.delete-password')}
                bind:value={currentPassword}
                class:is-invalid={passwordError} />
              {#if passwordError}
                <div class="invalid-feedback">{$_('pages.servers.errors.wrong-password')}</div>
              {/if}
            </div>
          </div>
          <div class="modal-footer flex-nowrap">
            <button type="button" class="btn btn-link col-6 m-0" data-bs-dismiss="modal">
              {$_('buttons.cancel')}
            </button>
            <button type="submit" class="btn btn-danger col-6 m-0" disabled={!canSubmit}>
              {$_('buttons.delete')}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import {
    fetchNodeDeletePreview,
    getNodeDisplayName,
    isNodeOnline,
    NodeKinds,
    requestNodeDelete,
  } from '$lib/nodes.util.js';
  import { onTaskProgress } from '$lib/panelRealtime.js';
  import { showServerActionError } from '$lib/servers.util.js';
  import { formatBytes } from '$lib/string.util.js';

  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  /**
   * @type {{ onDeleted?: (node: object, result: object) => void }}
   *   `onDeleted` runs once the dialog has fully closed after a successful delete.
   */
  let { onDeleted = () => {} } = $props();

  let modalElement = $state();
  let nameInput = $state();
  /** @type {any} */
  let modal = null;

  /** @type {'confirm' | 'running' | 'done'} */
  let phase = $state('confirm');
  /** @type {object | null} */
  let node = $state(null);
  /** @type {Awaited<ReturnType<typeof fetchNodeDeletePreview>>['preview']} */
  let preview = $state(null);
  let previewLoading = $state(false);
  let confirmName = $state('');
  let currentPassword = $state('');
  let passwordError = $state(false);
  let force = $state(false);
  /** Set when Pano refused to uninstall (`NODE_OFFLINE`, `NODE_UNINSTALL_FAILED`). */
  /** @type {{ error: string, detail: string } | null} */
  let refusal = $state(null);
  /** @type {{ percent: number, message: string } | null} */
  let progress = $state(null);
  /** @type {Awaited<ReturnType<typeof requestNodeDelete>> | null} */
  let result = $state(null);
  let copied = $state(false);
  /** Bumped per `show()`, so a preview answering after the dialog moved on is dropped. */
  let generation = 0;
  let copiedTimeout;
  /** @type {(() => void) | null} */
  let afterHide = null;

  const nodeName = $derived(getNodeDisplayName(node));
  const isLocal = $derived(String(node?.kind || '').toUpperCase() === NodeKinds.LOCAL);
  const online = $derived(preview ? preview.online : isNodeOnline(node));
  const uninstallSupported = $derived(preview ? preview.uninstallSupported : true);
  /** Whether the node can be asked to remove its own files; otherwise Pano can only forget it. */
  const canUninstall = $derived(online && uninstallSupported && !refusal);
  const needsForce = $derived(!canUninstall);
  const servers = $derived(preview?.servers ?? []);
  const serverCount = $derived(
    preview
      ? servers.length
      : Number.isFinite(Number(node?.serverCount))
        ? Number(node.serverCount)
        : 0,
  );
  const warningKey = $derived(
    !online
      ? isLocal
        ? 'pages.servers.nodes.remove.offline-local'
        : 'pages.servers.nodes.remove.offline'
      : 'pages.servers.nodes.remove.unsupported',
  );
  const refusalKey = $derived(
    refusal?.error === 'NODE_UNINSTALL_FAILED'
      ? 'pages.servers.nodes.remove.uninstall-failed'
      : isLocal
        ? 'pages.servers.nodes.remove.offline-local'
        : 'pages.servers.nodes.remove.offline',
  );
  const canSubmit = $derived(
    !!node &&
      !previewLoading &&
      confirmName.trim() === nodeName &&
      currentPassword.length > 0 &&
      (!needsForce || force),
  );
  const manualStepsText = $derived((result?.manualSteps ?? []).join('\n'));

  /**
   * Opens the dialog for `target`, reading what the delete would take with it.
   *
   * @param {object} target the node row.
   */
  export function show(target) {
    if (phase === 'running') {
      return;
    }

    const current = ++generation;

    node = target;
    phase = 'confirm';
    preview = null;
    previewLoading = true;
    confirmName = '';
    currentPassword = '';
    passwordError = false;
    force = false;
    refusal = null;
    progress = null;
    result = null;
    copied = false;
    afterHide = null;

    modal?.show();

    void fetchNodeDeletePreview(target.id).then((answer) => {
      if (current !== generation) {
        return;
      }

      // Without the preview (an older Pano, a failed read) the dialog still works from the row.
      preview = answer.preview;
      previewLoading = false;
    });
  }

  /** Whether a delete is running or its result is still on screen — the node is going away. */
  export function isActive() {
    return phase !== 'confirm';
  }

  async function confirm() {
    if (!canSubmit || phase !== 'confirm') {
      return;
    }

    const target = node;
    const sendForce = needsForce && force;

    phase = 'running';
    progress = null;
    passwordError = false;

    const answer = await requestNodeDelete(target.id, currentPassword, sendForce);

    if (answer.status === 'ok') {
      result = answer;
      currentPassword = '';
      finish(target, answer);

      return;
    }

    phase = 'confirm';

    // `network`: ApiUtil already raised the offline splash.
    if (answer.status === 'network') {
      return;
    }

    if (answer.status === 'unavailable') {
      await showError('pages.servers.errors.unavailable');

      return;
    }

    if (answer.status === 'refused') {
      refusal = { error: answer.error || '', detail: answer.detail || '' };
      force = false;

      return;
    }

    if (answer.error === 'CURRENT_PASSWORD_NOT_CORRECT') {
      passwordError = true;

      return;
    }

    await showServerActionError(answer.error);
  }

  /**
   * @param {object} target
   * @param {Awaited<ReturnType<typeof requestNodeDelete>>} answer
   */
  function finish(target, answer) {
    afterHide = () => onDeleted(target, answer);

    if (answer.manualSteps.length > 0) {
      // Keep the dialog up: the admin still has to run these on the machine.
      phase = 'done';

      return;
    }

    modal?.hide();
    void showSuccess('pages.servers.nodes.deleted', { name: getNodeDisplayName(target) });
  }

  function copySteps() {
    copy(manualStepsText);
    copied = true;

    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copied = false), 2000);
  }

  function onShown() {
    nameInput?.focus();
  }

  function onHidden() {
    const callback = afterHide;

    afterHide = null;
    phase = 'confirm';
    node = null;
    currentPassword = '';
    callback?.();
  }

  /**
   * Blocks closing while the delete runs: the request is still in flight and the result (the
   * manual steps) would be lost.
   *
   * @param {Event} event
   */
  function onHide(event) {
    // `result` is set once the request answered: the success path closes from `running`.
    if (phase === 'running' && !result) {
      event.preventDefault();
    }
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          backdrop: 'static',
          keyboard: false,
        })
      : null;

    const element = modalElement;

    element?.addEventListener('shown.bs.modal', onShown);
    element?.addEventListener('hide.bs.modal', onHide);
    element?.addEventListener('hidden.bs.modal', onHidden);

    const offTask = onTaskProgress((frame) => {
      if (phase !== 'running' || frame.kind !== 'NODE_UNINSTALL') {
        return;
      }

      if (frame.nodeId != null && Number(frame.nodeId) !== Number(node?.id)) {
        return;
      }

      progress = {
        percent: Math.max(0, Math.min(100, Math.round(frame.percent))),
        message: frame.message,
      };
    });

    return () => {
      offTask();
      clearTimeout(copiedTimeout);
      element?.removeEventListener('shown.bs.modal', onShown);
      element?.removeEventListener('hide.bs.modal', onHide);
      element?.removeEventListener('hidden.bs.modal', onHidden);
      modal?.hide();
      modal = null;
    };
  });
</script>
