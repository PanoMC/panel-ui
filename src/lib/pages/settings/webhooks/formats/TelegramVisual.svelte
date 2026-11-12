<!-- The visual editor of a Telegram message: HTML text, link preview, silent send, link buttons. -->
<div class="vstack gap-1">
  <div
    class="d-flex gap-1"
    role="toolbar"
    aria-label={$_('pages.webhooks.template.telegram.format')}>
    {#each TOOLS as tool (tool.key)}
      <button
        class="btn btn-sm btn-link"
        type="button"
        title={$_(`pages.webhooks.template.telegram.${tool.key}`)}
        aria-label={$_(`pages.webhooks.template.telegram.${tool.key}`)}
        onmousedown={(event) => event.preventDefault()}
        onclick={() => wrap(tool.open, tool.close)}>
        <i class="fa-solid {tool.icon}" aria-hidden="true"></i>
      </button>
    {/each}
  </div>

  <textarea
    class="form-control font-monospace"
    rows="6"
    maxlength={TEXT_MAX}
    placeholder={$_('pages.webhooks.template.telegram.text')}
    bind:this={textElement}
    bind:value={model.text}></textarea>
</div>

<div class="vstack gap-2" data-template-buttons>
  {#each model.buttons as button, index (index)}
    <div class="input-group">
      <input
        class="form-control"
        type="text"
        maxlength={BUTTON_MAX}
        aria-label={$_('pages.webhooks.template.telegram.button-text')}
        placeholder={$_('pages.webhooks.template.telegram.button-text')}
        bind:value={button.text} />
      <input
        class="form-control"
        type="text"
        aria-label={$_('pages.webhooks.template.telegram.button-url')}
        placeholder={$_('pages.webhooks.template.telegram.button-url')}
        bind:value={button.url} />
      <button
        class="btn btn-primary"
        type="button"
        title={$_('buttons.remove')}
        aria-label={$_('buttons.remove')}
        onclick={() => removeButton(index)}>
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
  {/each}
  <div>
    <button
      class="btn btn-sm btn-link text-capitalize px-0"
      type="button"
      data-add-button
      disabled={model.buttons.length >= MAX_BUTTONS}
      onclick={addButton}>
      <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
      {$_('pages.webhooks.template.telegram.add-button')}
    </button>
  </div>
</div>

<div class="form-check form-switch m-0">
  <input
    id="templateTelegramPreview"
    class="form-check-input"
    type="checkbox"
    role="switch"
    bind:checked={model.disablePreview} />
  <label class="form-check-label" for="templateTelegramPreview">
    {$_('pages.webhooks.template.telegram.disable-preview')}
  </label>
</div>

<div class="form-check form-switch m-0">
  <input
    id="templateTelegramSilent"
    class="form-check-input"
    type="checkbox"
    role="switch"
    bind:checked={model.silent} />
  <label class="form-check-label" for="templateTelegramSilent">
    {$_('pages.webhooks.template.telegram.silent')}
  </label>
</div>

<script>
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { BUTTON_MAX, MAX_BUTTONS, TEXT_MAX } from './telegram.js';

  /** @type {{ model: import('./telegram.js').MessageModel }} */
  let { model = $bindable() } = $props();

  const TOOLS = [
    { key: 'bold', icon: 'fa-bold', open: '<b>', close: '</b>' },
    { key: 'italic', icon: 'fa-italic', open: '<i>', close: '</i>' },
    { key: 'underline', icon: 'fa-underline', open: '<u>', close: '</u>' },
    { key: 'code', icon: 'fa-code', open: '<code>', close: '</code>' },
    { key: 'link', icon: 'fa-link', open: '<a href="">', close: '</a>' },
  ];

  /** @type {HTMLTextAreaElement | undefined} */
  let textElement = $state();

  /** Wraps the selection of the text in a tag pair and keeps the selection inside it. */
  async function wrap(open, close) {
    const value = model.text ?? '';
    const start = textElement?.selectionStart ?? value.length;
    const end = textElement?.selectionEnd ?? start;

    model.text = value.slice(0, start) + open + value.slice(start, end) + close + value.slice(end);

    await tick();

    textElement?.focus();
    textElement?.setSelectionRange(start + open.length, end + open.length);
  }

  function addButton() {
    model.buttons = [...model.buttons, { text: '', url: '' }];
  }

  function removeButton(index) {
    model.buttons = model.buttons.filter((_, i) => i !== index);
  }
</script>
