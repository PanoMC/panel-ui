<!-- The visual editor of a Slack message: notification text, bot, header, text, fields, image, button, context. -->
<input
  class="form-control"
  type="text"
  maxlength="3000"
  placeholder={$_('pages.webhooks.template.slack.text')}
  bind:value={model.text} />

<div class="input-group">
  <input
    class="form-control"
    type="text"
    maxlength="80"
    placeholder={$_('pages.webhooks.template.slack.username')}
    bind:value={model.username} />
  <input
    class="form-control"
    type="text"
    placeholder={$_('pages.webhooks.template.slack.icon-url')}
    bind:value={model.iconUrl} />
</div>

<div class="vstack gap-2 border-start border-4 ps-3">
  <input
    class="form-control"
    type="text"
    maxlength="150"
    placeholder={$_('pages.webhooks.template.slack.header')}
    bind:value={model.header} />

  <textarea
    class="form-control"
    rows="3"
    maxlength="3000"
    placeholder={$_('pages.webhooks.template.slack.body')}
    bind:value={model.body}></textarea>

  <div class="vstack gap-2" data-template-fields>
    {#each model.fields as field, index (index)}
      <div class="d-flex align-items-center gap-2">
        <div class="input-group flex-grow-1">
        <input
          class="form-control"
          type="text"
          aria-label={$_('pages.webhooks.template.field-name')}
          placeholder={$_('pages.webhooks.template.field-name')}
          bind:value={field.name} />
        <input
          class="form-control"
          type="text"
          maxlength="2000"
          aria-label={$_('pages.webhooks.template.field-value')}
          placeholder={$_('pages.webhooks.template.field-value')}
          bind:value={field.value} />
        </div>
        <button
          class="btn-close"
          type="button"
          title={$_('buttons.remove')}
          aria-label={$_('buttons.remove')}
          onclick={() => removeField(index)}></button>
      </div>
    {/each}
    <div>
      <button
        class="btn btn-sm btn-link text-capitalize text-decoration-none px-0"
        type="button"
        data-add-field
        disabled={model.fields.length >= MAX_FIELDS}
        onclick={addField}>
        <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
        {$_('pages.webhooks.template.add-field')}
      </button>
    </div>
  </div>

  <input
    class="form-control"
    type="text"
    placeholder={$_('pages.webhooks.template.image')}
    bind:value={model.image} />

  <div class="input-group">
    <input
      class="form-control"
      type="text"
      maxlength="75"
      placeholder={$_('pages.webhooks.template.slack.button-text')}
      bind:value={model.buttonText} />
    <input
      class="form-control"
      type="text"
      placeholder={$_('pages.webhooks.template.slack.button-url')}
      bind:value={model.buttonUrl} />
  </div>

  <input
    class="form-control"
    type="text"
    maxlength="3000"
    placeholder={$_('pages.webhooks.template.footer')}
    bind:value={model.footer} />
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { MAX_FIELDS } from './slack.js';

  /** @type {{ model: import('./slack.js').SlackModel }} */
  let { model = $bindable() } = $props();

  function addField() {
    model.fields = [...model.fields, { name: '', value: '' }];
  }

  function removeField(index) {
    model.fields = model.fields.filter((_, i) => i !== index);
  }
</script>
