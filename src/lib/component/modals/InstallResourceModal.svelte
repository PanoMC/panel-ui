<!-- Add Resource Modal -->
<div role="dialog" class="modal modal-lg fade" bind:this={$modalElement} aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header border-0">
        <h5 class="modal-title">
          {$_('components.modals.install-resource.title', {
            values: {
              type: $_(
                'components.modals.install-resource.' + ($type === 'PLUGIN' ? 'addon' : 'theme'),
              ),
            },
          })}
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}
          title={$_('buttons.close')}
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <div class="list-group list-group-horizontal">
          <DragAndDropZone
            className="btn list-group-item border list-group-item-action drop-zone d-flex flex-column align-items-center justify-content-center w-50 text-center shadow-none rounded-end-0"
            style="height: 250px; cursor: pointer;"
            accept={$type === 'THEME'
              ? ['.zip', 'application/zip']
              : ['.jar', 'application/java-archive']}
            on:drop={(e) => handleFileUpload(e.detail)}>
            <i class="fas fa-upload fa-2x mb-2"></i>
            <p class="mb-0">{@html $_('components.modals.install-resource.drag-here')}</p>
          </DragAndDropZone>

          <a
            href="{base}/{$type === 'PLUGIN' ? 'addons' : 'view'}/store"
            class="list-group-item list-group-item-action d-flex flex-column align-items-center justify-content-center w-50 text-center"
            style="height: 250px;"
            on:click={hide}>
            <img
              src="{base}/assets/img/logo.svg"
              width="48"
              height="48"
              class="bg-dark rounded-circle mb-2"
              alt="Pano" />
            <span>{$_('components.modals.install-resource.install-from-pano-store')}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';
  import { base } from '$app/paths';

  const modalElement = writable();
  const loading = writable(false);
  const defaultErrors = {};
  const errors = writable(defaultErrors);
  const submitLoading = writable(false);
  const type = writable('PLUGIN');

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  export function show(newType) {
    type.set(newType);
    errors.set(defaultErrors);
    submitLoading.set(false);

    modal = new window.bootstrap.Modal(get(modalElement));
    modal.show();
  }

  export function hide() {
    if (!get(loading)) {
      hideCallback();

      modal.hide();
    }
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import { show as showInstallingModal } from '$lib/component/modals/InstallingResourceModal.svelte';
  import DragAndDropZone from '$lib/component/DragAndDropZone.svelte';

  function handleFileUpload(file) {
    hide();

    showInstallingModal($type, file);
  }
</script>
