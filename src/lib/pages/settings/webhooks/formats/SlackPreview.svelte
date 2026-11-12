<!-- How a Slack webhook body reads in a Slack channel (the preview of the template editor). -->
<div class="slack-preview" data-slack-preview>
  {#if body}
    <div class="slack-message">
      {#if isHttpUrl(body.icon_url)}
        <img class="slack-avatar" src={body.icon_url} alt="" />
      {:else}
        <div class="slack-avatar slack-avatar-default">
          <i class="fa-brands fa-slack" aria-hidden="true"></i>
        </div>
      {/if}
      <div class="slack-body">
        <div class="slack-header">
          <span class="slack-username">{body.username || name || 'Pano'}</span>
          <span class="slack-app">APP</span>
        </div>

        {#if blocks.length === 0}
          {#if body.text}
            <div class="slack-section">{@html slackMarkdown(body.text)}</div>
          {/if}
        {:else}
          {#each blocks as block, index (index)}
            {#if block.type === 'header'}
              <div class="slack-block-header">{@render textObject(block.text)}</div>
            {:else if block.type === 'section'}
              <div class="slack-section">
                <div class="slack-section-main">
                  {#if block.text}
                    <div>{@render textObject(block.text)}</div>
                  {/if}
                  {#if Array.isArray(block.fields) && block.fields.length > 0}
                    <div class="slack-fields">
                      {#each block.fields as field, fieldIndex (fieldIndex)}
                        <div class="slack-field">{@render textObject(field)}</div>
                      {/each}
                    </div>
                  {/if}
                </div>
                {#if block.accessory?.type === 'image' && isHttpUrl(block.accessory.image_url)}
                  <img class="slack-accessory" src={block.accessory.image_url} alt="" />
                {/if}
              </div>
            {:else if block.type === 'image' && isHttpUrl(block.image_url)}
              <img class="slack-image" src={block.image_url} alt="" />
            {:else if block.type === 'actions'}
              <div class="slack-actions">
                {#each Array.isArray(block.elements) ? block.elements : [] as element, elementIndex (elementIndex)}
                  {#if element?.type === 'button'}
                    {#if isHttpUrl(element.url)}
                      <a
                        class="slack-button"
                        href={element.url}
                        target="_blank"
                        rel="noopener noreferrer">{slackDecode(element.text?.text)}</a>
                    {:else}
                      <span class="slack-button">{slackDecode(element.text?.text)}</span>
                    {/if}
                  {/if}
                {/each}
              </div>
            {:else if block.type === 'context'}
              <div class="slack-context">
                {#each Array.isArray(block.elements) ? block.elements : [] as element, elementIndex (elementIndex)}
                  {#if element?.type === 'image'}
                    {#if isHttpUrl(element.image_url)}
                      <img src={element.image_url} alt="" />
                    {/if}
                  {:else}
                    <span>{@render textObject(element)}</span>
                  {/if}
                {/each}
              </div>
            {:else if block.type === 'divider'}
              <hr class="slack-divider" />
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <div class="slack-empty">
      {#if loading}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fa-brands fa-slack" aria-hidden="true"></i>
      {/if}
    </div>
  {/if}
</div>

{#snippet textObject(object)}
  {#if object?.type === 'mrkdwn'}
    {@html slackMarkdown(object.text)}
  {:else}
    {slackDecode(object?.text)}
  {/if}
{/snippet}

<script>
  import { isHttpUrl, slackDecode, slackMarkdown } from './slack.js';

  /** @type {{ body: any, name?: string, loading?: boolean }} */
  let { body, name = '', loading = false } = $props();

  const blocks = $derived(
    Array.isArray(body?.blocks)
      ? body.blocks.filter((block) => block && typeof block === 'object')
      : [],
  );
</script>
