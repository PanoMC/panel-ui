<!-- Add Resource Modal -->
<div role="dialog" class="modal modal-lg fade" bind:this={$modalElement} aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
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
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <div class="list-group list-group-horizontal">
          <DragAndDropZone
            class="list-group-item list-group-item-action w-50 rounded-end-0"
            style="height: 250px; cursor: pointer;"
            icon="fas fa-upload fa-2x"
            title={$_('components.modals.install-resource.drag-here')}
            accept={$type === 'THEME'
              ? ['.zip', 'application/zip']
              : ['.jar', 'application/java-archive']}
            on:drop={(e) => handleFileUpload(e.detail)} />

          <a
            href="{base}/{$type === 'PLUGIN' ? 'addons' : 'view'}/store"
            class="list-group-item list-group-item-action d-flex flex-column align-items-center justify-content-center w-50 text-center"
            style="height: 250px;"
            on:click={hide}>
            <i class="fas fa-store fa-2x mb-2"></i>
            {$_('components.modals.install-resource.install-from-pano-store')}
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
  import tooltip from '$lib/tooltip.util';
  import { show as showInstallingModal } from '$lib/components/modals/InstallingResourceModal.svelte';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';

  function handleFileUpload(file) {
    hide();

    showInstallingModal($type, file);
  }
</script>
