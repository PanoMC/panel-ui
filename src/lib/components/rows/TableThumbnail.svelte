<style>
  .table-thumbnail {
    width: calc(40px * 16 / 9);
    max-width: 100%;
  }

  .table-thumbnail .thumbnail-frame {
    border-radius: var(--bs-border-radius);
    overflow: hidden;
  }

  .table-thumbnail img {
    width: 100%;
    height: 40px;
    object-fit: cover;
  }
</style>

<div class="table-thumbnail">
  {#if src}
    <a
      {href}
      {target}
      use:tooltip={[tooltipText]}
      class="focus-ring d-block {anchorClass}">
      <div class="ratio ratio-16x9 thumbnail-frame">
        <img
          src={preview ? getPreviewUrl(src) : src}
          {alt}
          title={alt} />
      </div>
    </a>
  {:else}
    <div class="ratio ratio-16x9 thumbnail-frame bg-black bg-opacity-10 border">
      <div class="d-flex align-items-center justify-content-center">
        <i class="fas {icon} opacity-75"></i>
      </div>
    </div>
  {/if}
</div>

<script>
  import tooltip from '$lib/tooltip.util.js';
  import { _ } from 'svelte-i18n';

  export let src = null;
  export let alt = '';
  export let href = '#';
  export let target = '_blank';
  export let tooltipText = $_('buttons.view');
  export let icon = 'fa-image';
  export let preview = true;
  export let anchorClass = '';

  function getPreviewUrl(originalUrl) {
    if (!originalUrl) return originalUrl;
    if (originalUrl.startsWith('http')) return originalUrl;

    const lastDotIndex = originalUrl.lastIndexOf('.');
    return lastDotIndex > 0
      ? originalUrl.substring(0, lastDotIndex) +
          '-preview' +
          originalUrl.substring(lastDotIndex)
      : originalUrl + '-preview';
  }
</script>
