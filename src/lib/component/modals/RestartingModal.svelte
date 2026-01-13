{#if $platformRestarting}
  <div
    class="modal show"
    style="display: block; pointer-events: none; z-index: 1070;"
    tabindex="-1"
    role="dialog"
    aria-hidden="false">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content text-center shadow-lg border-0" style="pointer-events: auto; border-radius: 1.5rem;">
        <div class="modal-body p-5">
          <div class="mb-4">
            <i class="fas fa-arrows-rotate fa-3x text-primary spin"></i>
          </div>
          <h4 class="mb-3 fw-bold">{$_('components.restarting-pano.title')}</h4>
          <p class="text-muted mb-0">{$_('components.restarting-pano.description')}</p>
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

<style>
  /* Ensure the pulsate animation is available if animate.css is not globally loaded */
  @keyframes pulse {
    from { transform: scale3d(1, 1, 1); }
    50% { transform: scale3d(1.05, 1.05, 1.05); }
    to { transform: scale3d(1, 1, 1); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spin {
    animation: spin 2s linear infinite;
  }
  
  .animate__infinite {
    animation-iteration-count: infinite;
  }
  
  .animate__pulse {
    animation-name: pulse;
    animation-duration: 1s;
    animation-timing-function: ease-in-out;
  }
</style>
