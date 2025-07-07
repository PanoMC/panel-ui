<div
  class="alert alert-warning animate__animated animate__slideInUp"
  role="alert">
  <details open="{open}">
    <summary class="card-title mb-0">
      These translations are not used anymore, you can delete them:
    </summary>
    <p class="card-text">
      {#each translations as translation, index (translation)}
        <TranslationRow
          translation="{translation}"
          pluginId="{pluginId}"
          on:customInputChange="{handleCustomInputChange}"
          on:deleteClick="{handleOnDeleteClick}" />
      {/each}
    </p>
  </details>
</div>

<script>
  import { createEventDispatcher } from "svelte";

  import TranslationRow from "$lib/component/rows/TranslationRow.svelte";

  export let translations;
  export let pluginId;
  export let open;

  const dispatch = createEventDispatcher();

  function handleCustomInputChange(event) {
    const { key, value } = event.detail;

    dispatch("customInputChange", {
      key,
      value,
    });
  }

  function handleOnDeleteClick(event) {
    const { key } = event.detail;

    dispatch("deleteClick", { key });
  }
</script>
