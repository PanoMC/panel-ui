<!-- The visual editor of a Discord message: bot name and avatar, text, one embed. -->
  <div class="row g-2">
    <div class="col-sm-6">
      <input
        class="form-control"
        type="text"
        maxlength="80"
        placeholder={$_('pages.webhooks.template.username')}
        bind:value={model.username} />
    </div>
    <div class="col-sm-6">
      <input
        class="form-control"
        type="text"
        placeholder={$_('pages.webhooks.template.avatar-url')}
        bind:value={model.avatarUrl} />
    </div>
  </div>

  <textarea
    class="form-control"
    rows="2"
    maxlength="2000"
    placeholder={$_('pages.webhooks.template.content')}
    bind:value={model.content}></textarea>

  <div class="form-check form-switch m-0">
    <input
      id="templateHasEmbed"
      class="form-check-input"
      type="checkbox"
      role="switch"
      bind:checked={model.hasEmbed} />
    <label class="form-check-label" for="templateHasEmbed">
      {$_('pages.webhooks.template.embed')}
    </label>
  </div>

  {#if model.hasEmbed}
    <div
      class="vstack gap-2 border-start border-4 ps-3"
      style:border-color|important={model.color}>
      <div class="row g-2">
        <div class="col-sm-6">
          <input
            class="form-control"
            type="text"
            maxlength="256"
            placeholder={$_('pages.webhooks.template.author-name')}
            bind:value={model.authorName} />
        </div>
        <div class="col-sm-6">
          <input
            class="form-control"
            type="text"
            placeholder={$_('pages.webhooks.template.author-icon')}
            bind:value={model.authorIcon} />
        </div>
      </div>

      <div class="input-group">
        <input
          class="form-control"
          type="text"
          maxlength="256"
          placeholder={$_('pages.webhooks.template.embed-title')}
          bind:value={model.title} />
        <input
          class="form-control form-control-color flex-grow-0"
          type="color"
          title={$_('pages.webhooks.template.color')}
          aria-label={$_('pages.webhooks.template.color')}
          bind:value={model.color} />
      </div>

      <input
        class="form-control"
        type="text"
        placeholder={$_('pages.webhooks.template.title-url')}
        bind:value={model.url} />

      <textarea
        class="form-control"
        rows="3"
        maxlength="4096"
        placeholder={$_('pages.webhooks.template.description')}
        bind:value={model.description}></textarea>

      <div class="vstack gap-2" data-template-fields>
        {#each model.fields as field, index (index)}
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              maxlength="256"
              aria-label={$_('pages.webhooks.template.field-name')}
              placeholder={$_('pages.webhooks.template.field-name')}
              bind:value={field.name} />
            <input
              class="form-control"
              type="text"
              maxlength="1024"
              aria-label={$_('pages.webhooks.template.field-value')}
              placeholder={$_('pages.webhooks.template.field-value')}
              bind:value={field.value} />
            <div class="input-group-text">
              <input
                class="form-check-input mt-0"
                type="checkbox"
                title={$_('pages.webhooks.template.field-inline')}
                aria-label={$_('pages.webhooks.template.field-inline')}
                bind:checked={field.inline} />
            </div>
            <button
              class="btn btn-primary"
              type="button"
              title={$_('buttons.remove')}
              aria-label={$_('buttons.remove')}
              onclick={() => removeField(index)}>
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        {/each}
        <div>
          <button
            class="btn btn-sm btn-link text-capitalize px-0"
            type="button"
            data-add-field
            disabled={model.fields.length >= MAX_FIELDS}
            onclick={addField}>
            <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
            {$_('pages.webhooks.template.add-field')}
          </button>
        </div>
      </div>

      <div class="row g-2">
        <div class="col-sm-6">
          <input
            class="form-control"
            type="text"
            placeholder={$_('pages.webhooks.template.thumbnail')}
            bind:value={model.thumbnail} />
        </div>
        <div class="col-sm-6">
          <input
            class="form-control"
            type="text"
            placeholder={$_('pages.webhooks.template.image')}
            bind:value={model.image} />
        </div>
      </div>

      <div class="row g-2">
        <div class="col-sm-6">
          <input
            class="form-control"
            type="text"
            maxlength="2048"
            placeholder={$_('pages.webhooks.template.footer')}
            bind:value={model.footerText} />
        </div>
        <div class="col-sm-6">
          <input
            class="form-control"
            type="text"
            placeholder={$_('pages.webhooks.template.footer-icon')}
            bind:value={model.footerIcon} />
        </div>
      </div>

      <div class="form-check form-switch m-0">
        <input
          id="templateTimestamp"
          class="form-check-input"
          type="checkbox"
          role="switch"
          bind:checked={model.timestamp} />
        <label class="form-check-label" for="templateTimestamp">
          {$_('pages.webhooks.template.timestamp')}
        </label>
      </div>
    </div>
  {/if}

<script>
  import { _ } from 'svelte-i18n';

  import { MAX_FIELDS } from './discord.js';

  /** @type {{ model: import('./discord.js').MessageModel }} */
  let { model = $bindable() } = $props();

  function addField() {
    model.fields = [...model.fields, { name: '', value: '', inline: true }];
  }

  function removeField(index) {
    model.fields = model.fields.filter((_, i) => i !== index);
  }
</script>
