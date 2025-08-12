<!-- Add Resource Modal -->
<div
  role="dialog"
  class="modal modal-lg fade"
  bind:this={$modalElement}
  aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header border-0">
        <h5 class="modal-title">{#if $installError}
          {$_('components.modals.installing-resource.error')}
        {:else if !isFinished($installingStep)}
          {$_('components.modals.installing-resource.installing')}
        {:else}
          {$_('components.modals.installing-resource.completed')}
        {/if}</h5>
      </div>
      <div class="modal-body">
        <div class="progress mb-3" role="progressbar" aria-valuenow="{$installingStep}" aria-valuemin="0" aria-valuemax="{$processes.length}" style="height: 16px;">
          <div
            class="progress-bar progress-bar-striped {$installError ? 'bg-danger' : !isFinished($installingStep) ? 'progress-bar-animated bg-primary' : 'bg-success'}"
            style="width: {(Math.min($installingStep -1, $processes.length) / $processes.length) * 100}%">
          </div>
        </div>

        <p class="text-muted small mb-0" in:fade out:fade>
          {#if $installError}
            <span class="text-danger">{$_('components.modals.installing-resource.error-text', {values: {error: $installError}})}</span>
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
            on:click={() => goto(`${base}/${$type === 'PLUGIN' ? 'addons' : 'view'}`, {invalidateAll: true})} >
            <i class="fas fa-arrow-left me-1"></i> {$_('buttons.' + ($type === 'PLUGIN' ? 'addons' : 'themes'))}
          </button>
          <button
            class="btn btn-primary col-6 m-0"
            data-bs-dismiss="modal"
            type="button"
            on:click={() => goto(`${base}/${$type === 'PLUGIN' ? 'addons' : 'view'}/store`, {invalidateAll:true}) && callback()} >
            <i class="fas fa-store me-1"></i> {$_('buttons.go-to-store')}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  import { base } from "$app/paths";

  import ApiUtil from "$lib/api.util";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import { show as showInstallResourceModal } from "$lib/component/modals/InstallResourceModal.svelte"

  const modalElement = writable();
  const type = writable("PLUGIN")

  const processes = writable([])

  const installingStep = writable(1);
  const installError = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;
  let confetti;

  export function hide() {
    hideCallback();

    modal.hide();
  }

  async function validateFile(file) {
    if (get(type) === 'THEME' && file.name.endsWith(".zip") || get(type) === 'PLUGIN' && file.name.endsWith(".jar")) {
      return true;
    }

    hide()
    showInstallResourceModal(get(type))

    await showToast("components.toasts.invalid-resource-file-type");

    return false;
  }

  async function uploadFile(file) {
    const body = new FormData();

    body.append("file", file);

    const uploadResponse = await ApiUtil.put({
      path: `/api/panel/install/upload`,
      body,
    });

    if (uploadResponse.error) {
      installError.set(uploadResponse.error)

      return null
    }

    installingStep.set(get(installingStep) + 1)

    return uploadResponse.data.fileName
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function handleSSEMessage(message) {
    if (message.result === "ok") {
      installingStep.set(get(installingStep)+ 1);

      if (get(installingStep) === get(processes).length + 1) {
        if (!confetti) {
          confetti = await import("canvas-confetti")
        }

        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999999
        });
      }
    } else {
      installError.set(message.error)
      console.error(message.error, message.message)
    }
  }

  function handleEventSource(eventSource) {
    eventSource.onmessage = (event) => {
      handleSSEMessage(JSON.parse(event.data))
    };

    eventSource.onerror = () => {
      eventSource.close()
    };
  }

  async function installResourceFromStore(versionId) {
    const eventSource = new EventSource(`/api/panel/install/store/${versionId}/stream`);

    handleEventSource(eventSource)
  }

  async function installResourceFromLocal(fileName) {
    const eventSource = new EventSource(`/api/panel/install/local/${get(type)}/${fileName}/stream`);

    handleEventSource(eventSource)
  }

  export async function show(newType, newFile, versionId, storeCallback) {
    installingStep.set(1);
    installError.set(null);
    type.set(newType)
    callback = storeCallback

    processes.set([
      "components.modals.installing-resource.processes.version-info",
      "components.modals.installing-resource.processes.downloading",
      "components.modals.installing-resource.processes.preparing",
      "components.modals.installing-resource.processes.installing"
    ])

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();

    if (newFile) {
      processes.set(["components.modals.installing-resource.processes.uploading", ...get(processes).slice(2)])

      await delay(500);
      const valid = await validateFile(newFile)
      if (!valid) {
        return
      }
      const fileName = await uploadFile(newFile)

      if (fileName) {
        await installResourceFromLocal(fileName)
      }
      return
    }

    if (versionId) {
      await installResourceFromStore(versionId)
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
  import { _ } from "svelte-i18n";
  import { fade } from "svelte/transition";

  import { goto } from "$app/navigation";

  function isFinished(installingStep) {
    return installingStep === $processes.length + 1
  }
</script>
