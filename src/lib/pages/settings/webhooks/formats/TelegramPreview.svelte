<!-- How a Telegram sendMessage body reads in a Telegram chat (the preview of the template editor). -->
<div class="telegram-preview" data-telegram-preview>
  {#if body}
    <div class="telegram-message">
      <div class="telegram-bubble">
        <div class="telegram-name">{name || 'Pano'}</div>
        <div class="telegram-text">{@html telegramHtml(body.text)}</div>
        <div class="telegram-meta">
          {#if body.disable_notification === true}
            <i class="fa-solid fa-bell-slash" aria-hidden="true"></i>
          {/if}
          <span>{time}</span>
        </div>
      </div>

      {#each keyboardOf(body) as row, rowIndex (rowIndex)}
        <div class="telegram-keyboard-row">
          {#each row as button, index (index)}
            {#if button.url}
              <a
                class="telegram-button"
                href={button.url}
                target="_blank"
                rel="noopener noreferrer">
                <span>{@html escapeText(button.text)}</span>
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>
            {:else}
              <span class="telegram-button">{@html escapeText(button.text)}</span>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
  {:else}
    <div class="telegram-empty">
      {#if loading}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fa-brands fa-telegram" aria-hidden="true"></i>
      {/if}
    </div>
  {/if}
</div>

<script>
  import { locale } from 'svelte-i18n';

  import { escapeText, keyboardOf, telegramHtml } from './telegram.js';

  /** @type {{ body: any, name?: string, loading?: boolean }} */
  let { body, name = '', loading = false } = $props();

  const time = $derived(
    new Date().toLocaleTimeString($locale || undefined, { hour: '2-digit', minute: '2-digit' }),
  );
</script>
