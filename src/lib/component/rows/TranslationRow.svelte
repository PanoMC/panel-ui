<div class="row mb-3 g-2">
  <div class="col-md">
    <div class="form-floating">
      <input
        type="text"
        class="form-control font-monospace"
        id="KeyTranslation"
        readonly
        value={pluginId
          ? translation.key.replace(`plugins.${pluginId}.`, "")
          : translation.key} />
      <label for="KeyTranslation">Key</label>
    </div>
  </div>
  <div class="col-md">
    <div class="form-floating">
      <textarea
        rows="1"
        class="form-control"
        id="OriginalTranslation"
        readonly
        value={translation.original}></textarea>
      <label for="OriginalTranslation">Original</label>
    </div>
  </div>
  <div class="col-md">
    <div class="form-floating">
      <textarea
        rows="1"
        class="form-control"
        id="CustomTranslation"
        bind:value={translation.custom}
        on:input={onCustomInputChange}></textarea>
      <label for="CustomTranslation">Custom</label>
    </div>
  </div>
  {#if translation.notExists}
    <div class="col-auto">
      <button
        title={$_("buttons.delete")}
        aria-label={$_("buttons.delete")}
        id="deleteButton"
        type="button"
        class="btn btn-sm btn-outline-danger h-100 shadow-none"
        on:click={() => onDeleteClick(translation.key)}>
        <i class="fa-solid fa-minus"></i>
      </button>
    </div>
  {/if}
</div>

<script>
  import { createEventDispatcher } from "svelte";

  export let translation;
  export let pluginId;

  const dispatch = createEventDispatcher();

  function onCustomInputChange(event) {
    const value = event.target.value;

    dispatch("customInputChange", {
      key: translation.key,
      value,
    });
  }

  function onDeleteClick(key) {
    dispatch("deleteClick", { key });
  }
</script>
