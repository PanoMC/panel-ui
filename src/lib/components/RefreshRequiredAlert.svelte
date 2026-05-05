<div class="alert alert-warning d-flex align-items-center mb-0" role="alert">
  <i class="fa-solid fa-triangle-exclamation me-3"></i>
  <div class="flex-grow-1">
    <strong class="me-2">{$_('components.refresh-required-alert-title')}</strong>
    {$_('components.refresh-required-alert')}
  </div>
  <button
    type="button"
    title={$_('buttons.refresh')}
    aria-label={$_('buttons.refresh')}
    class="btn btn-warning btn-sm ms-3"
    onclick={() => location.reload()}>
    <i class="fa-solid fa-sync"></i>
  </button>
</div>

<script>
  import { _ } from 'svelte-i18n';
</script>
