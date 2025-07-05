<div
  class="alert alert-warning animate__animated animate__slideInUp mb-8"
  role="alert">
  <h5 class="alert-heading mb-4">These translations are not used anymore, you can delete them:</h5>

  <div class="row-cols-3 g-2 d-flex flex-nowrap">
    <label for="KeyTranslation">Key</label>
    <label for="OriginalTranslation">Original</label>
    <label for="CustomTranslation">Custom</label>
  </div>
  <p>
    {#each translations as translation, index (translation)}
      <TranslationRow translation="{translation}" pluginId="{pluginId}" on:customInputChange={handleCustomInputChange} on:deleteClick={handleOnDeleteClick}/>
    {/each}
  </p>
</div>

<script>
  import { createEventDispatcher } from "svelte";

  import TranslationRow from "$lib/component/rows/TranslationRow.svelte";

  export let translations;
  export let pluginId;

  const dispatch = createEventDispatcher();

  function handleCustomInputChange(event) {
    const { key, value } = event.detail;

    dispatch('customInputChange', {
      key,
      value
    });
  }

  function handleOnDeleteClick(event) {
    const { key } = event.detail;

    dispatch('deleteClick', { key });

  }
</script>