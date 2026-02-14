<div class="animate__animated animate__fadeInUp">
  <div
    class="alert alert-warning d-flex align-items-center justify-content-between mb-0"
    role="alert">
    <div class="d-flex align-items-center">
      <i class="fa-solid fa-triangle-exclamation me-2"></i>
      <span>{$_('components.refresh-required-alert')}</span>
    </div>
    <button
      type="button"
      use:tooltip={[$_('buttons.refresh')]}
      aria-label={$_('buttons.refresh')}
      class="btn btn-warning btn-sm ms-3"
      onclick={() => location.reload()}>
      <i class="fa-solid fa-sync"></i>
    </button>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
</script>
