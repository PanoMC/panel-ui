<style>
  /* animate.css is loaded globally (src/styles/style.scss) but it ships no `spin` keyframes, so
     this one is still local; its `pulse` twin was only ever a stand-in and is gone. */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .spin {
    animation: spin 2s linear infinite;
  }
</style>

{#if $platformRestarting}
  <div
    class="modal show"
    style="display: block; pointer-events: none; z-index: 1070;"
    tabindex="-1"
    role="dialog"
    aria-hidden="false">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div
        class="modal-content text-center shadow-lg border-0"
        style="pointer-events: auto; border-radius: 1.5rem;">
        <div class="modal-body p-5">
          <div class="mb-4">
            <i class="fas fa-arrows-rotate fa-3x text-primary spin"></i>
          </div>
          <h4 class="mb-3 fw-bold">{$_('components.restarting-pano.title')}</h4>
          <p class="mb-0">{$_('components.restarting-pano.description')}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="modal-backdrop fade show" style="z-index: 1060;"></div>
{/if}

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  const platformRestarting = getContext('platformRestarting');
</script>
