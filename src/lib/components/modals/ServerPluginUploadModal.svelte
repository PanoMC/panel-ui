<!-- Plugin / mod upload (the Plugins page's "Upload"): the same drop zone the addon installer uses,
     one POST per jar to /plugins/upload, which puts it into plugins/ or mods/ on the node. -->
<div
  role="dialog"
  class="modal fade"
  bind:this={$modalElement}
  aria-hidden="true"
  aria-labelledby="serverPluginUploadTitle">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="serverPluginUploadTitle">
          {$_('pages.servers.plugins.upload.title')}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} on:click={hide}
        ></button>
      </div>
      <div>
        <div class="modal-body vstack gap-3">
          <div style="height: 200px;">
            <DragAndDropZone
              class="rounded border h-100 w-100"
              style="cursor: pointer;"
              icon="fas fa-upload fa-2x"
              title={$_('pages.servers.plugins.upload.drop')}
              accept={['.jar', 'application/java-archive']}
              multiple
              on:drop={(event) => stage(event.detail)}
              on:error={onZoneError} />
          </div>

          {#each $errors as error, index (index)}
            <div class="alert alert-danger mb-0 d-flex align-items-start" role="alert">
              <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
              <div>{@html $_(error.key, { values: escapeValues(error.values) })}</div>
            </div>
          {/each}

          {#if $uploads.length}
            <ul class="list-group">
              {#each $uploads as upload (upload.id)}
                <li class="list-group-item">
                  <div class="d-flex align-items-center gap-2 small">
                    {#if upload.status === 'uploading'}
                      <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"
                      ></span>
                    {:else if upload.status === 'pending'}
                      <i class="fa-solid fa-file text-body-secondary" aria-hidden="true"></i>
                    {:else if upload.status === 'done'}
                      <i class="fa-solid fa-circle-check text-success" aria-hidden="true"></i>
                    {:else}
                      <i class="fa-solid fa-circle-xmark text-danger" aria-hidden="true"></i>
                    {/if}
                    <span class="text-truncate flex-grow-1 font-monospace" title={upload.name}
                      >{upload.name}</span>
                    <span class="text-body-secondary flex-shrink-0">
                      {$_('pages.servers.plugins.upload.status-' + upload.status)}
                    </span>
                  </div>
                  {#if upload.status === 'uploading' && upload.stats}
                    <div class="mt-2">
                      <UploadProgress
                        compact
                        stats={upload.stats}
                        label={upload.name}
                        oncancel={() => cancel(upload.id)} />
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { escapeValues } from '@panomc/sdk/core/js/html.util.js';
  import { errorCode } from '$lib/apiError.util.js';
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const serverIdStore = writable(null);
  const directory = writable('plugins');
  /** @type {import('svelte/store').Writable<Array<{ id: number, name: string, file: File, stats: import('$lib/upload.util.js').UploadStats | null, status: 'pending' | 'uploading' | 'done' | 'failed' }>>} */
  const uploads = writable([]);
  /** What went wrong, shown as alerts inside the modal instead of toasts. */
  /** @type {import('svelte/store').Writable<Array<{ key: string, values: Record<string, unknown> }>>} */
  const errors = writable([]);

  /** The running request of each row, so Cancel can stop it. */
  /** @type {Map<number, { abort: () => void }>} */
  const handles = new Map();

  /** @type {() => void} */
  let onUploaded = () => {};
  let modal;
  let nextId = 0;

  /**
   * @param {number | string} serverId
   * @param {{ directory?: string, onUploaded?: () => void }} [options] `directory` is only what the
   *   hint says (`plugins` or `mods`); the backend decides where the jar really goes.
   */
  export function show(serverId, options = {}) {
    serverIdStore.set(serverId);
    directory.set(options.directory || 'plugins');
    uploads.set([]);
    errors.set([]);
    onUploaded = options.onUploaded || (() => {});

    modal = window.bootstrap.Modal.getOrCreateInstance(get(modalElement));
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { newUploadId, sendUpload } from '$lib/upload.util.js';
  import {
    checkTransferSpace,
    describeUploadFailure,
    isUploadFailureCode,
  } from '$lib/transfers.util.js';
  import {
    getRetryAfterSeconds,
    isEndpointUnavailable,
    isRateLimitError,
    isServerStateError,
    serverActionErrorKey,
    serverStateErrorMessage,
  } from '$lib/servers.util.js';

  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
  import UploadProgress from '$lib/components/UploadProgress.svelte';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';

  /**
   * @param {number} id
   * @param {Record<string, unknown>} patch
   */
  function patch(id, patch) {
    uploads.update((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  /**
   * @param {string} key
   * @param {Record<string, unknown>} [values]
   */
  function addError(key, values = {}) {
    errors.update((list) => [...list, { key, values }]);
  }

  /**
   * The same sentence the toast would have said, as an alert.
   *
   * @param {string} error the `error` field of the response body.
   * @param {any} body
   */
  function addServerError(error, body) {
    if (isServerStateError(error)) {
      const message = serverStateErrorMessage(error, body);

      addError(message.key, message.values);

      return;
    }

    const key = serverActionErrorKey(error);

    if (isRateLimitError(error)) {
      addError(key, { seconds: getRetryAfterSeconds(body) });
    } else if (key === 'pages.servers.errors.generic') {
      // Stripped to [A-Z0-9_], so it is safe inside the markup.
      const code = String(error ?? '')
        .replace(/[^A-Za-z0-9_]/g, '')
        .toUpperCase();

      addError(key, { error: `<code>${code || 'UNKNOWN'}</code>` });
    } else {
      addError(key);
    }
  }

  function onZoneError() {
    addError('pages.servers.plugins.upload.invalid-type');
  }

  /** @param {number} id */
  function cancel(id) {
    handles.get(id)?.abort();
  }

  /**
   * Picking or dropping jars starts the upload right away: files are listed as they go and a
   * failure names the file it belongs to.
   *
   * @param {File[] | File} dropped
   */
  function stage(dropped) {
    const files = Array.isArray(dropped) ? dropped : [dropped];
    let added = 0;

    errors.set([]);

    for (const file of files) {
      if (!file) {
        continue;
      }

      if (!/\.jar$/i.test(file.name)) {
        addError('pages.servers.plugins.upload.invalid-type');

        continue;
      }

      uploads.update((list) => [
        ...list,
        { id: ++nextId, name: file.name, file, stats: null, status: 'pending' },
      ]);
      added++;
    }

    if (added) {
      void uploadPending();
    }
  }

  /** Guards re-entry: while a drain is running, `stage()` only queues new files. */
  let uploading = false;

  /**
   * One request per jar, in order: the node writes them one at a time anyway, and a failure then
   * names the file it belongs to. Jars dropped while a batch is running are picked up by the next
   * drain, so nothing waits for another interaction.
   */
  async function uploadPending() {
    if (uploading) {
      return;
    }

    uploading = true;
    let uploaded = 0;
    errors.set([]);

    for (;;) {
      const serverId = get(serverIdStore);
      const queue = get(uploads).filter((item) => item.status === 'pending');

      if (!queue.length) {
        break;
      }

      // The whole batch has to fit on the node, or none of it starts.
      const space = await checkTransferSpace({
        serverId,
        size: queue.reduce((sum, item) => sum + item.file.size, 0),
      });

      if (space) {
        const ids = new Set(queue.map((item) => item.id));

        uploads.update((list) =>
          list.map((item) => (ids.has(item.id) ? { ...item, status: 'failed' } : item)),
        );
        addError(space.key, space.values);

        continue;
      }

      for (const { id, file } of queue) {
        patch(id, { status: 'uploading' });

        const form = new FormData();

        form.append('file', file, file.name);

        const uploadId = newUploadId();
        const handle = sendUpload({
          path: `/panel/servers/${serverId}/plugins/upload?uploadId=${encodeURIComponent(uploadId)}`,
          body: form,
          size: file.size,
          onprogress: (stats) => patch(id, { stats }),
        });

        handles.set(id, handle);

        /** @type {any} */
        const response = await handle.promise;

        handles.delete(id);

        if (!response || isEndpointUnavailable(response) || response.error) {
          patch(id, { status: 'failed', stats: null });

          const code = errorCode(response);

          if (code === 'INVALID_DATA') {
            addError('pages.servers.plugins.upload.invalid-type');
          } else if (isUploadFailureCode(code)) {
            const message = await describeUploadFailure(response, uploadId);

            addError('pages.servers.plugins.upload.failed-reason', {
              name: file.name,
              reason: $_(message.key, { values: message.values }),
            });
          } else if (response?.error) {
            addServerError(code, response);
          } else if (response && isEndpointUnavailable(response)) {
            addError('pages.servers.errors.unavailable');
          } else {
            addError('pages.servers.plugins.upload.failed', { name: file.name });
          }

          continue;
        }

        patch(id, { status: 'done', stats: null });
        uploaded++;

        void showSuccess('pages.servers.plugins.upload.done', {
          name: response.filename || file.name,
        });
      }
    }

    uploading = false;

    if (uploaded > 0) {
      onUploaded();
    }
  }
</script>
