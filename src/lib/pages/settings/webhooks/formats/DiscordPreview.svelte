<!-- How a Discord webhook body reads in a Discord channel (the preview of the template editor). -->
<div class="discord-preview" data-discord-preview>
  {#if body}
    <div class="discord-message">
      {#if isHttpUrl(body.avatar_url)}
        <img class="discord-avatar" src={body.avatar_url} alt="" />
      {:else}
        <div class="discord-avatar discord-avatar-default">
          <i class="fa-brands fa-discord" aria-hidden="true"></i>
        </div>
      {/if}
      <div class="discord-body">
        <div class="discord-header">
          <span class="discord-username">{body.username || name || 'Pano'}</span>
          <span class="discord-app">APP</span>
        </div>

        {#if body.content}
          <div class="discord-content">{@html discordMarkdown(body.content)}</div>
        {/if}

        {#each Array.isArray(body.embeds) ? body.embeds : [] as embed, index (index)}
          <div class="discord-embed" style:border-left-color={colorOf(embed.color)}>
            <div class="discord-embed-grid">
              <div class="discord-embed-main">
                {#if embed.author?.name}
                  <div class="discord-embed-author">
                    {#if isHttpUrl(embed.author.icon_url)}
                      <img src={embed.author.icon_url} alt="" />
                    {/if}
                    <span>{embed.author.name}</span>
                  </div>
                {/if}

                {#if embed.title}
                  <div class="discord-embed-title">
                    {#if isHttpUrl(embed.url)}
                      <a href={embed.url} target="_blank" rel="noopener noreferrer"
                        >{@html discordMarkdown(embed.title)}</a>
                    {:else}
                      {@html discordMarkdown(embed.title)}
                    {/if}
                  </div>
                {/if}

                {#if embed.description}
                  <div class="discord-embed-description">
                    {@html discordMarkdown(embed.description)}
                  </div>
                {/if}

                {#if Array.isArray(embed.fields) && embed.fields.length > 0}
                  <div class="discord-embed-fields">
                    {#each embed.fields as field, fieldIndex (fieldIndex)}
                      <div
                        class="discord-embed-field"
                        class:discord-embed-field-inline={field.inline}>
                        <div class="discord-embed-field-name">
                          {@html discordMarkdown(field.name)}
                        </div>
                        <div class="discord-embed-field-value">
                          {@html discordMarkdown(field.value)}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}

                {#if isHttpUrl(embed.image?.url)}
                  <img class="discord-embed-image" src={embed.image.url} alt="" />
                {/if}

                {#if embed.footer?.text || embed.timestamp}
                  <div class="discord-embed-footer">
                    {#if isHttpUrl(embed.footer?.icon_url)}
                      <img src={embed.footer.icon_url} alt="" />
                    {/if}
                    <span>
                      {embed.footer?.text ?? ''}
                      {#if embed.footer?.text && embed.timestamp}&nbsp;•&nbsp;{/if}
                      {previewTime(embed.timestamp, $locale)}
                    </span>
                  </div>
                {/if}
              </div>

              {#if isHttpUrl(embed.thumbnail?.url)}
                <img class="discord-embed-thumbnail" src={embed.thumbnail.url} alt="" />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="discord-empty">
      {#if loading}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fa-brands fa-discord" aria-hidden="true"></i>
      {/if}
    </div>
  {/if}
</div>

<script>
  import { locale } from 'svelte-i18n';

  import { discordMarkdown, isHttpUrl, previewTime } from '../discord.util.js';
  import { colorToHex } from './discord.js';

  /** @type {{ body: any, name?: string, loading?: boolean }} */
  let { body, name = '', loading = false } = $props();

  // Discord draws an embed without a colour with its own grey bar.
  const colorOf = (color) => (typeof color === 'number' ? colorToHex(color) : '#4E5058');
</script>
