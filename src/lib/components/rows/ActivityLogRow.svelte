<button
  type="button"
  class="list-group-item list-group-item-action focus-ring"
  class:bg-secondary-subtle={log.selected}
  on:click={onClick}
  title={$_('buttons.view')}>
  <span class="fw-normal d-block text-truncate markdown-renderer" title={translation}>
    <MarkdownRenderer content={translation} />
  </span>
  <Date time={log.createdAt} />
</button>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Date from '$lib/components/Date.svelte';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

  export let log;

  $: translation = (() => {
    const globalKey = 'activity-logs.' + log.type;
    const globalTranslation = $_(globalKey, { values: log.details });

    if (globalTranslation !== globalKey) {
      return globalTranslation;
    }

    if (log.pluginId) {
      const pluginKey = `plugins.${log.pluginId}.activity-logs.${log.type}`;
      const pluginTranslation = $_(pluginKey, { values: log.details });

      if (pluginTranslation !== pluginKey) {
        return pluginTranslation;
      }
    }

    return globalTranslation;
  })();

  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch('click', { log });
  }
</script>
