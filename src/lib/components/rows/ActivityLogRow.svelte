<button
  type="button"
  class="list-group-item list-group-item-action focus-ring"
  class:bg-secondary-subtle={log.selected}
  on:click={onClick}
  use:tooltip={[$_('buttons.view'), { placement: 'bottom' }]}>
  <span
    class="fw-normal d-block text-truncate markdown-renderer"
    title={stripHtmlTags(translation)}>
    <MarkdownRenderer content={translation} />
  </span>
  <Date time={log.createdAt} />
</button>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
  import { getActivityLogTranslation, stripHtmlTags } from '$lib/activity-log.util.js';

  import Date from '$lib/components/Date.svelte';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

  export let log;

  $: translation = getActivityLogTranslation(log, $_);

  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch('click', { log });
  }
</script>
