<style>
  .drop-zone {
    border-style: dashed !important;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .drop-zone:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.05) !important;
  }

  .drop-zone.drag-over {
    border-style: solid !important;
    background-color: rgba(var(--bs-primary-rgb), 0.1) !important;
    transform: scale(0.995);
  }

  .drop-zone.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    border-style: solid !important;
  }

  :global(.list-group-horizontal) .drop-zone {
    height: 100%;
  }
</style>

<div
  class="p-3 w-100 h-100 d-flex flex-column align-items-center justify-content-center border rounded overflow-hidden text-center {$$props.class ||
    ''} drop-zone"
  class:drag-over={isDragOver}
  class:disabled
  {style}
  role="button"
  tabindex="0"
  on:click={onClick}
  on:keydown={onKeyDown}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}>
  {#if icon || title || subtitle}
    {#if icon}
      <i class="{icon} mb-2"></i>
    {/if}
    {#if title}
      <p class="mb-0">{@html title}</p>
    {/if}
    {#if subtitle}
      <small class="opacity-75">{subtitle}</small>
    {/if}
  {:else}
    <slot {isDragOver}></slot>
  {/if}

  <input
    {id}
    type="file"
    class="d-none"
    bind:this={fileInput}
    on:change={handleChange}
    accept={accept.join(',')}
    {multiple} />
</div>

<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let accept = [];
  export let disabled = false;
  export let style = '';
  export let multiple = false;
  export let maxFileSize = null;
  export let icon = 'fas fa-star-of-life fs-1';
  export let title = '';
  export let subtitle = '';
  export let id = null;

  let isDragOver = false;
  let fileInput;

  function handleDragOver(event) {
    if (disabled) return;
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(event) {
    if (disabled) return;
    event.preventDefault();
    isDragOver = false;

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
  }

  function handleChange(event) {
    if (disabled) return;
    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
    }
  }

  function handleFiles(files) {
    const validFiles = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (
        accept.length > 0 &&
        !accept.some((type) => {
          if (type.endsWith('/*')) {
            const mainType = type.split('/')[0];
            return file.type.startsWith(mainType + '/');
          }
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type === type;
        })
      ) {
        dispatch('error', { error: 'INVALID_TYPE', file });
        continue;
      }

      if (maxFileSize && file.size > maxFileSize) {
        dispatch('error', { error: 'INVALID_SIZE', file });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      if (multiple) {
        dispatch('drop', validFiles);
      } else {
        dispatch('drop', validFiles[0]);
      }
    }
    if (fileInput) fileInput.value = '';
  }

  function onClick() {
    if (!disabled && fileInput) {
      fileInput.click();
    }
  }

  function onKeyDown(event) {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  export function click() {
    onClick();
  }
</script>
