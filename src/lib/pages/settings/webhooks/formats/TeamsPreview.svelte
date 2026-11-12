<!-- How a Teams webhook body reads in a Teams channel (the preview of the template editor). -->
<div class="teams-preview" data-teams-preview>
  {#if card}
    <div class="teams-message">
      <div class="teams-avatar">
        <i class="fa-solid fa-diagram-project" aria-hidden="true"></i>
      </div>
      <div class="teams-body">
        <div class="teams-header">
          <span class="teams-sender">{name || 'Pano'}</span>
          <span class="teams-via">Workflows</span>
        </div>
        <div class="teams-card">
          {#each elementsOf(card.body) as element, index (index)}
            {@render block(element)}
          {/each}

          {#if actions.length > 0}
            <div class="teams-actions">
              {#each actions as action, index (index)}
                {#if isHttpUrl(action.url)}
                  <a
                    class="teams-action"
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer">{action.title}</a>
                {:else}
                  <span class="teams-action">{action.title}</span>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="teams-empty">
      {#if loading}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fa-regular fa-comments" aria-hidden="true"></i>
      {/if}
    </div>
  {/if}
</div>

{#snippet block(element)}
  {#if element?.type === 'TextBlock' && element.text}
    <div
      class="teams-text"
      class:teams-text-large={element.size === 'Large' || element.size === 'ExtraLarge'}
      class:teams-text-medium={element.size === 'Medium'}
      class:teams-text-small={element.size === 'Small'}
      class:teams-text-bold={element.weight === 'Bolder'}
      class:teams-text-subtle={element.isSubtle === true}
      class:teams-text-mono={element.fontType === 'Monospace'}
      style:color={element.color && element.color !== 'Default' ? teamsColor(element.color) : null}>
      {@html teamsMarkdown(String(element.text))}
    </div>
  {:else if element?.type === 'FactSet' && Array.isArray(element.facts)}
    <div class="teams-facts">
      {#each element.facts as fact, index (index)}
        <div class="teams-fact-title">{@html teamsMarkdown(String(fact?.title ?? ''))}</div>
        <div class="teams-fact-value">{@html teamsMarkdown(String(fact?.value ?? ''))}</div>
      {/each}
    </div>
  {:else if element?.type === 'Image' && isHttpUrl(element.url)}
    <img class="teams-image" src={element.url} alt="" />
  {:else if element?.type === 'Container'}
    <div class="teams-container">
      {#each elementsOf(element.items) as item, index (index)}
        {@render block(item)}
      {/each}
    </div>
  {/if}
{/snippet}

<script>
  import { isHttpUrl } from '../discord.util.js';
  import { cardOf, teamsColor, teamsMarkdown } from './teams.js';

  /** @type {{ body: any, name?: string, loading?: boolean }} */
  let { body, name = '', loading = false } = $props();

  const elementsOf = (list) => (Array.isArray(list) ? list : []);

  const card = $derived(cardOf(body));
  const actions = $derived(
    elementsOf(card?.actions).filter((action) => action && typeof action.title === 'string'),
  );
</script>
