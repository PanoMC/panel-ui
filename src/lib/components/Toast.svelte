<div
  id="appToast{id}"
  class="toast align-items-center shadow-lg text-bg-tertiary opacity-100 {variantClass}"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  data-bs-dismiss="toast">
  <div class="toast-body"><slot /></div>
</div>

<script>
  export let id;

  // 'success' | 'danger' | null. Mapped instead of interpolated straight into the class
  // list so a caller can't inject an arbitrary utility class, and so a neutral toast
  // keeps text-bg-tertiary's own contrast colour.
  export let variant = null;

  const VARIANT_CLASSES = {
    success: 'text-success',
    danger: 'text-danger',
  };

  $: variantClass = VARIANT_CLASSES[variant] ?? '';
</script>
