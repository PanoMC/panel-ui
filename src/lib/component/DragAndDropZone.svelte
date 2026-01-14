<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let accept = []; // Array of mime types e.g. ['image/png', 'image/jpeg']
  export let disabled = false;
  export let style = "";
  export let multiple = false;
  export let maxFileSize = null; // Bytes

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
       // Type check
       if (accept.length > 0 && !accept.some(type => {
          if (type.endsWith('/*')) {
             const mainType = type.split('/')[0];
             return file.type.startsWith(mainType + '/');
          }
          if (type.startsWith('.')) {
             return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type === type;
       })) {
         dispatch('error', { error: 'INVALID_TYPE', file });
         continue;
       }

       // Size check
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
    
    // Reset input
    if (fileInput) fileInput.value = '';
  }

  function onClick() {
    if (!disabled && fileInput) {
      fileInput.click();
    }
  }

  export function click() {
    onClick();
  }

  export let className = "btn w-100 list-group-item list-group-item-action drop-zone d-flex flex-column align-items-center justify-content-center border rounded shadow-none m-0";
</script>

<button
  type="button"
  class="{className} {$$props.class || ''}"
  class:drag-over={isDragOver}
  class:disabled
  {style}
  on:click={onClick}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
>
  <slot {isDragOver}></slot>
</button>

<input
  type="file"
  class="d-none"
  bind:this={fileInput}
  on:change={handleChange}
  accept={accept.join(',')}
  {multiple}
/>

<style>
  .drop-zone {
    transition: all 0.2s ease-in-out;
    background-color: var(--bs-body-bg);
  }

  .drop-zone:hover, .drop-zone.drag-over {
    background-color: var(--bs-tertiary-bg);
    border-color: var(--bs-primary) !important;
  }
  
  .drop-zone.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
