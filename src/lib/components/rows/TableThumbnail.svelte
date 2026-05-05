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
      title={tooltipText}
      class="focus-ring d-block {anchorClass}">
      <div class="ratio ratio-16x9 thumbnail-frame bg-primary-subtle">
        <img
          src={preview ? getPreviewUrl(src) : src}
          {alt}
          title={alt}
          class="w-100 h-100 object-fit-cover" />
      </div>
    </a>
  {:else}
    <div class="ratio ratio-16x9 thumbnail-frame bg-primary-subtle border-0">
      <div class="d-flex align-items-center justify-content-center h-100">
        <i class="fas {icon} opacity-50 fs-5 text-primary"></i>
      </div>
    </div>
  {/if}
</div>

<script>
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
