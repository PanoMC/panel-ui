<style>
  .file-preview-stage {
    min-height: 200px;
    max-height: min(70vh, 720px);
    background: repeating-conic-gradient(
        rgba(var(--bs-body-color-rgb), 0.06) 0% 25%,
        transparent 0% 50%
      )
      50% / 20px 20px;
  }

  .file-preview-stage img,
  .file-preview-stage video {
    max-width: 100%;
    max-height: min(70vh, 720px);
    object-fit: contain;
  }

  /* A server icon is 64 px; blown up without smoothing it stays readable, and crisp. */
  .file-preview-stage img.upscaled {
    width: 256px;
    image-rendering: pixelated;
  }
</style>

<!-- Shows an image, a video or a sound file of a server in place. The bytes come from the same
     streaming download as the Download button, asked for `inline`; Pano only agrees to that for
     the formats `previewKind` lists. -->
<div
  class="modal fade"
  tabindex="-1"
  aria-hidden="true"
  aria-labelledby="filePreviewTitle"
  bind:this={modalElement}>
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title text-break d-flex align-items-center gap-2" id="filePreviewTitle">
          <i class={KIND_ICONS[kind] ?? 'fa-solid fa-file'} aria-hidden="true"></i>
          <span class="font-monospace">{path}</span>
          {#if sizeText}
            <span class="badge text-bg-secondary fw-normal">{sizeText}</span>
          {/if}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={close}
        ></button>
      </div>

      <div class="modal-body">
        <div
          class="file-preview-stage rounded d-flex align-items-center justify-content-center overflow-hidden">
          {#if failed}
            <div class="text-body-secondary text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-2x d-block mb-2" aria-hidden="true"></i>
              <div class="mb-3">{$_('components.modals.file-preview.failed')}</div>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                onclick={() => ondownload?.(path)}>
                <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
                {$_('pages.servers.files.action-download')}
              </button>
            </div>
          {:else if src && kind === 'image'}
            <img
              {src}
              alt={path}
              class:upscaled
              onload={(event) => (upscaled = event.currentTarget.naturalWidth < 128)}
              onerror={() => (failed = true)} />
          {:else if src && kind === 'video'}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video {src} controls autoplay onerror={() => (failed = true)}></video>
          {:else if src && kind === 'audio'}
            <audio class="w-100 m-4" {src} controls autoplay onerror={() => (failed = true)}
            ></audio>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-link m-0" onclick={close}>
          {$_('buttons.close')}
        </button>
        <button type="button" class="btn btn-primary m-0" onclick={() => ondownload?.(path)}>
          <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
          {$_('pages.servers.files.action-download')}
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { fileDownloadUrl, previewKind } from '$lib/files.util.js';
  import { formatBytes } from '$lib/string.util.js';

  let { serverId = null, ondownload = undefined } = $props();

  const KIND_ICONS = {
    image: 'fa-regular fa-image',
    video: 'fa-solid fa-film',
    audio: 'fa-solid fa-music',
  };

  let modalElement = $state();
  let path = $state('');
  let size = $state(0);
  /** Emptied on close, so a playing video stops instead of carrying on behind the page. */
  let src = $state('');
  let failed = $state(false);
  let upscaled = $state(false);

  const kind = $derived(previewKind(path));
  const sizeText = $derived(size > 0 ? formatBytes(size, 1) : '');

  let modal;

  /**
   * @param {string} filePath the path relative to the server directory.
   * @param {number} [fileSize] bytes, as the listing reported them.
   */
  export function open(filePath, fileSize = 0) {
    path = String(filePath);
    size = Number(fileSize) || 0;
    failed = false;
    upscaled = false;
    src = fileDownloadUrl(serverId, [path], { inline: true });
    modal?.show();
  }

  function close() {
    modal?.hide();
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement)
      : null;

    const onHidden = () => {
      src = '';
    };

    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    return () => {
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
    };
  });

  onDestroy(() => {
    modal?.hide();
    modal = null;
  });
</script>
