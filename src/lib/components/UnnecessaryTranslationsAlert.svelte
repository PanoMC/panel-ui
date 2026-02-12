<div class="alert alert-warning animate__animated animate__slideInUp" role="alert">
  <details {open}>
    <summary> These translations are not used anymore, you can delete them: </summary>
    {#each translations as translation, index (translation)}
      <TranslationRow
        {translation}
        {pluginId}
        on:customInputChange={handleCustomInputChange}
        on:deleteClick={handleOnDeleteClick} />
    {/each}
  </details>
</div>

<script>
  import { createEventDispatcher } from 'svelte';

  import TranslationRow from '$lib/components/rows/TranslationRow.svelte';

  export let translations;
  export let pluginId;
  export let open;

  const dispatch = createEventDispatcher();

  function handleCustomInputChange(event) {
    const { key, value } = event.detail;

    dispatch('customInputChange', {
      key,
      value,
    });
  }

  function handleOnDeleteClick(event) {
    const { key } = event.detail;

    dispatch('deleteClick', { key });
  }
</script>
