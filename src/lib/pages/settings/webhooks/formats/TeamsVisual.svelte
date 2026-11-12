<!-- The visual editor of a Teams message: one Adaptive Card. -->
<div class="row g-2">
  <div class="col-sm-8">
    <input
      class="form-control"
      type="text"
      placeholder={$_('pages.webhooks.template.teams.title')}
      bind:value={model.title} />
  </div>
  <div class="col-sm-4">
    <div class="form-floating">
      <select id="teamsTitleColor" class="form-select" bind:value={model.color}>
        {#each COLORS as color (color)}
          <option value={color}>
            {$_(`pages.webhooks.template.teams.color-${color.toLowerCase()}`)}
          </option>
        {/each}
      </select>
      <label for="teamsTitleColor">{$_('pages.webhooks.template.teams.color')}</label>
    </div>
  </div>
</div>

<textarea
  class="form-control"
  rows="3"
  maxlength={TEXT_MAX}
  placeholder={$_('pages.webhooks.template.teams.text')}
  bind:value={model.text}></textarea>

<textarea
  class="form-control font-monospace"
  rows="2"
  maxlength={TEXT_MAX}
  placeholder={$_('pages.webhooks.template.teams.code')}
  bind:value={model.code}></textarea>

<input
  class="form-control"
  type="text"
  placeholder={$_('pages.webhooks.template.image')}
  bind:value={model.image} />

<div class="vstack gap-2" data-template-facts>
  {#each model.facts as fact, index (index)}
    <div class="input-group">
      <input
        class="form-control"
        type="text"
        aria-label={$_('pages.webhooks.template.field-name')}
        placeholder={$_('pages.webhooks.template.field-name')}
        bind:value={fact.title} />
      <input
        class="form-control"
        type="text"
        aria-label={$_('pages.webhooks.template.field-value')}
        placeholder={$_('pages.webhooks.template.field-value')}
        bind:value={fact.value} />
      <button
        class="btn btn-primary"
        type="button"
        title={$_('buttons.remove')}
        aria-label={$_('buttons.remove')}
        onclick={() => removeFact(index)}>
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
  {/each}
  <div>
    <button
      class="btn btn-sm btn-link text-capitalize px-0"
      type="button"
      data-add-fact
      disabled={model.facts.length >= MAX_FACTS}
      onclick={addFact}>
      <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
      {$_('pages.webhooks.template.add-field')}
    </button>
  </div>
</div>

<input
  class="form-control"
  type="text"
  placeholder={$_('pages.webhooks.template.footer')}
  bind:value={model.footer} />

<div class="vstack gap-2" data-template-buttons>
  {#each model.buttons as button, index (index)}
    <div class="input-group">
      <input
        class="form-control"
        type="text"
        aria-label={$_('pages.webhooks.template.teams.button-title')}
        placeholder={$_('pages.webhooks.template.teams.button-title')}
        bind:value={button.title} />
      <input
        class="form-control"
        type="text"
        aria-label={$_('pages.webhooks.template.teams.button-url')}
        placeholder={$_('pages.webhooks.template.teams.button-url')}
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
      {$_('pages.webhooks.template.teams.add-button')}
    </button>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { COLORS, MAX_BUTTONS, MAX_FACTS } from './teams.js';

  /** @type {{ model: import('./teams.js').TeamsModel }} */
  let { model = $bindable() } = $props();

  const TEXT_MAX = 4000;

  function addFact() {
    model.facts = [...model.facts, { title: '', value: '' }];
  }

  function removeFact(index) {
    model.facts = model.facts.filter((_, i) => i !== index);
  }

  function addButton() {
    model.buttons = [...model.buttons, { title: '', url: '' }];
  }

  function removeButton(index) {
    model.buttons = model.buttons.filter((_, i) => i !== index);
  }
</script>
