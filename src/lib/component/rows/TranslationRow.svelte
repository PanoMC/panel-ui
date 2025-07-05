<div class="d-flex flex-nowrap g-2 overflow-x-auto mb-2">
  <input
    type="text"
    class="form-control font-monospace"
    id="KeyTranslation"
    readonly
    value="{pluginId ? translation.key.replace(`plugins.${pluginId}.`, ''): translation.key}" />

  <textarea
    rows="1"
    class="form-control"
    id="OriginalTranslation"
    readonly
    value="{translation.original}" />

  <div class="position-relative w-100">
    <textarea
      rows="1"
      class="form-control pe-5"
      id="CustomTranslation"
      bind:value={translation.custom}
      on:input={onCustomInputChange} />

    {#if translation.notExists}
      <button
        type="button"
        class="btn position-absolute top-50 end-0 translate-middle-y me-1 btn-sm btn-outline-danger m-0"
        on:click={() => onDeleteClick(translation.key)}>
        <i class="fa-solid fa-trash"></i>
      </button>
    {/if}
  </div>
</div>

<script>
  import { createEventDispatcher } from 'svelte';

  export let translation;
  export let pluginId;

  const dispatch = createEventDispatcher();

  function onCustomInputChange(event) {
    const value = event.target.value;

    dispatch('customInputChange', {
      key: translation.key,
      value
    });
  }

  function onDeleteClick(key) {
    dispatch('deleteClick', { key });
  }
</script>