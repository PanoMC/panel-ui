<!-- Add Resource Modal -->
<div role="dialog" class="modal fade" bind:this={$modalElement} aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {#if $installError}
            {$_('components.modals.installing-resource.error')}
          {:else if !isFinished($installingStep)}
            {$_('components.modals.installing-resource.installing')}
          {:else}
            {$_('components.modals.installing-resource.completed')}
          {/if}
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
        <div
          class="progress mb-3"
          role="progressbar"
          aria-valuenow={$installingStep}
          aria-valuemin="0"
          aria-valuemax={$processes.length}
          style="height: 16px;">
          <div
            class="progress-bar progress-bar-striped {$installError
              ? 'bg-danger'
              : !isFinished($installingStep)
                ? 'progress-bar-animated bg-primary'
                : 'bg-success'}"
            style="width: {(Math.min(
              $versionId
                ? $installingStep >= 2
                  ? $installingStep - 2 + $currentProgress
                  : 0
                : $installingStep - 1 + $currentProgress,
              $processes.length - ($versionId ? 1 : 0),
            ) /
              ($processes.length - ($versionId ? 1 : 0))) *
              100}%">
          </div>
        </div>

        <p class="small mb-0" in:fade out:fade>
          {#if $installError}
            <span class="text-danger"
              >{$_('components.modals.installing-resource.error-text', {
                values: { error: $_('errors.' + $installError) },
              })}</span>
          {:else if !isFinished($installingStep)}
            {$_($processes[$installingStep - 1])}
          {:else}
            🎉 {$_('components.modals.installing-resource.install-complete')}
          {/if}
        </p>
      </div>
      {#if isFinished($installingStep) || $installError}
        <div class="modal-footer flex-nowrap">
          <button
            class="btn btn-link col-6 m-0"
            data-bs-dismiss="modal"
            type="button"
            on:click={() =>
              goto(`${base}/${$type === 'PLUGIN' ? 'addons' : 'view'}/store`, {
                invalidateAll: true,
              }) && callback()}>
            {$_('buttons.go-to-store')}
          </button>
          <button
            class="btn btn-primary col-6 m-0"
            data-bs-dismiss="modal"
            type="button"
            on:click={() =>
              goto(`${base}/${$type === 'PLUGIN' ? 'addons' : 'view'}?refreshRequired=true`, {
                invalidateAll: true,
              })}>
            <i class="fas fa-arrow-left me-2"></i>
            {$_('buttons.' + ($type === 'PLUGIN' ? 'addons' : 'themes'))}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  import { browser } from '$app/environment';
  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import { show as showInstallResourceModal } from '$lib/components/modals/InstallResourceModal.svelte';

  const modalElement = writable();
  const type = writable('PLUGIN');

  const processes = writable([]);

  const installingStep = writable(1);
  const currentProgress = writable(0);
  const installError = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;
  let confetti;
  let installing;

  if (browser) {
    (async () => {
      confetti = await import('canvas-confetti');
    })();
  }

  export function hide() {
    hideCallback();

    modal.hide();
  }

  async function validateFile(file) {
    if (
      (get(type) === 'THEME' && file.name.endsWith('.zip')) ||
      (get(type) === 'PLUGIN' && file.name.endsWith('.jar'))
    ) {
      return true;
    }

    hide();
    showInstallResourceModal(get(type));

    await showToast('components.toasts.invalid-resource-file-type');

    return false;
  }

  async function uploadFile(file) {
    const body = new FormData();

    body.append('file', file);

    const uploadResponse = await ApiUtil.put({
      path: `/api/panel/install/upload`,
      body,
    });

    if (uploadResponse.error) {
      installError.set(uploadResponse.error);

      return null;
    }

    currentProgress.set(0);
    installingStep.set(get(installingStep) + 1);

    return uploadResponse.data.fileName;
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function handleSSEMessage(message) {
    if (message.result === 'ok') {
      if (message.status === 'progress') {
        currentProgress.set(message.progress);
        return;
      }

      currentProgress.set(0);
      installingStep.set(get(installingStep) + 1);

      if (get(installingStep) === get(processes).length + 1) {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999999,
        });

        installing = false;
      }
    } else {
      installing = false;
      installError.set(message.error);
      console.error(message.error, message.message);
    }
  }

  function handleEventSource(eventSource) {
    eventSource.onmessage = (event) => {
      handleSSEMessage(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }

  async function installResourceFromStore(versionId) {
    const eventSource = new EventSource(`/api/panel/install/store/${versionId}/stream`);

    handleEventSource(eventSource);
  }

  async function installResourceFromLocal(fileName) {
    const eventSource = new EventSource(`/api/panel/install/local/${get(type)}/${fileName}/stream`);

    handleEventSource(eventSource);
  }

  export async function show(newType, newFile, newVersionId, storeCallback, action = 'INSTALL') {
    installingStep.set(1);
    currentProgress.set(0);
    versionId.set(newVersionId);
    installError.set(null);
    type.set(newType);
    callback = storeCallback;
    installing = true;

    processes.set([
      'components.modals.installing-resource.processes.version-info',
      'components.modals.installing-resource.processes.downloading',
      'components.modals.installing-resource.processes.preparing',
      'components.modals.installing-resource.processes.installing',
    ]);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: true,
    });
    modal.show();

    if (newFile) {
      processes.set([
        'components.modals.installing-resource.processes.uploading',
        ...get(processes).slice(2),
      ]);

      await delay(500);
      const valid = await validateFile(newFile);
      if (!valid) {
        return;
      }
      const fileName = await uploadFile(newFile);

      if (fileName) {
        await installResourceFromLocal(fileName);
      }
      return;
    }

    if (newVersionId) {
      await installResourceFromStore(newVersionId);
    }
  }

  // To make type checking easier in the template
  const versionId = writable(null);

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  import { beforeNavigate, goto } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';

  function isFinished(installingStep) {
    return installingStep === $processes.length + 1;
  }

  const leaveHandler = (e) => {
    if (installing) {
      e.preventDefault();
      e.returnValue = ''; // Necessary for some browsers
    }
  };

  onMount(() => {
    if (browser) {
      window?.addEventListener('beforeunload', leaveHandler);
    }
  });

  onDestroy(() => {
    if (browser) {
      window?.removeEventListener('beforeunload', leaveHandler);
    }
  });

  beforeNavigate((nav) => {
    if (
      browser &&
      installing &&
      !confirm($_('components.installing-resource.installing-leave-alert'))
    ) {
      nav.cancel();
    }
  });
</script>
