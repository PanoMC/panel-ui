{#if showModal}
  <div class="modal-backdrop fade show" on:click={closeModal}></div>
  <div class="modal fade show d-block" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Permission Track</h5>
          <button
            type="button"
            class="btn-close"
            on:click={closeModal}
            aria-label={$_("buttons.close")}
            title={$_("buttons.close")}></button>
        </div>
        <div class="modal-body">
          <!-- Modal content will be added here -->
          <p class="text-muted">Modal content is empty as requested.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" on:click={closeModal}>
            Cancel
          </button>
          <button type="button" class="btn btn-primary" on:click={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Add Permission Tracks Modal -->
<script>
  import { _ } from "svelte-i18n";
  import { createEventDispatcher } from "svelte";

  export let showModal = false;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch("close");
  }

  function handleSave() {
    // Handle save logic here
    dispatch("save");
  }
</script>
