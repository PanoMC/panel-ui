<style>
  .skeleton-row {
    opacity: 0.6;
  }

  .skeleton-placeholder {
    background: linear-gradient(
      90deg,
      var(--bs-gray-800) 25%,
      var(--bs-gray-700) 50%,
      var(--bs-gray-800) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite linear;
  }

  :global([data-bs-theme='light']) .skeleton-placeholder {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>

<div class="row mb-3 g-2 skeleton-row">
  <div class="col-md">
    <div class="skeleton-placeholder" style="height: 58px; border-radius: 0.5rem;"></div>
  </div>
  <div class="col-md">
    <div class="skeleton-placeholder" style="height: 58px; border-radius: 0.5rem;"></div>
  </div>
  <div class="col-md">
    <div class="skeleton-placeholder" style="height: 58px; border-radius: 0.5rem;"></div>
  </div>
</div>
