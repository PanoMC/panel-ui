<button
  type="button"
  class="list-group-item list-group-item-action focus-ring"
  class:bg-secondary-subtle={log.selected}
  on:click={onClick}
  title={$_('buttons.view')}>
  <span class="fw-normal d-block markdown-renderer">
    <MarkdownRenderer content={$_('activity-logs.' + log.type, { values: log.details })} />
  </span>
  <Date time={log.createdAt} />
</button>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Date from '$lib/component/Date.svelte';
  import MarkdownRenderer from '$lib/component/MarkdownRenderer.svelte';

  export let log;

  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch('click', { log });
  }
</script>
