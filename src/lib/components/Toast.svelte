<div
  id="appToast{id}"
  class="toast align-items-center shadow-lg text-bg-tertiary opacity-100"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  data-bs-dismiss="toast">
  <div class="toast-body"><slot /></div>
</div>

<script>
  export let id;
</script>
