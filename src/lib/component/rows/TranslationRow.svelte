<div class="input-group d-flex flex-nowrap g-2 overflow-x-auto">
  <input
    type="text"
    class="form-control font-monospace"
    id="KeyTranslation"
    readonly
    value="{pluginId
      ? translation.key.replace(`plugins.${pluginId}.`, '')
      : translation.key}" />

  <textarea
    rows="1"
    class="form-control"
    id="OriginalTranslation"
    readonly
    value="{translation.original}"></textarea>

  <textarea
    rows="1"
    class="form-control"
    id="CustomTranslation"
    bind:value="{translation.custom}"
    on:input="{onCustomInputChange}"></textarea>

  {#if translation.notExists}
    <button
      id="deleteButton"
      type="button"
      class="btn btn-sm btn-outline-danger"
      on:click="{() => onDeleteClick(translation.key)}">
      <i class="fa-solid fa-trash"></i>
    </button>
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
