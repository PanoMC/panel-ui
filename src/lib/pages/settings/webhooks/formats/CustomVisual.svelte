<!-- The visual editor of a Custom JSON body: a key / value row per value, nested by dot paths. -->
<div class="vstack gap-2" data-template-rows>
  {#each model.rows as row, index (index)}
    <div class="input-group">
      <input
        class="form-control font-monospace flex-grow-0 w-auto"
        class:is-invalid={problems.has(index)}
        type="text"
        size="14"
        aria-label={$_('pages.webhooks.template.custom.key')}
        placeholder={$_('pages.webhooks.template.custom.key')}
        bind:value={row.key} />
      <input
        class="form-control"
        class:font-monospace={row.raw}
        class:is-invalid={row.raw && row.value.trim() !== '' && !isRawValid(row.value)}
        type="text"
        aria-label={$_('pages.webhooks.template.custom.value')}
        placeholder={$_(
          row.raw
            ? 'pages.webhooks.template.custom.raw-value'
            : 'pages.webhooks.template.custom.value',
        )}
        bind:value={row.value} />
      <div class="input-group-text">
        <input
          class="form-check-input mt-0"
          type="checkbox"
          title={$_('pages.webhooks.template.custom.raw')}
          aria-label={$_('pages.webhooks.template.custom.raw')}
          bind:checked={row.raw} />
      </div>
      <button
        class="btn btn-primary"
        type="button"
        title={$_('buttons.remove')}
        aria-label={$_('buttons.remove')}
        onclick={() => removeRow(index)}>
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
  {/each}
  <div>
    <button
      class="btn btn-sm btn-link text-capitalize px-0"
      type="button"
      data-add-row
      disabled={model.rows.length >= MAX_ROWS}
      onclick={addRow}>
      <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
      {$_('pages.webhooks.template.custom.add-row')}
    </button>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { MAX_ROWS, isRawValid, keyProblems } from './custom.js';

  /** @type {{ model: import('./custom.js').CustomModel }} */
  let { model = $bindable() } = $props();

  const problems = $derived(keyProblems(model.rows));

  function addRow() {
    model.rows = [...model.rows, { key: '', value: '', raw: false }];
  }

  function removeRow(index) {
    model.rows = model.rows.filter((_, i) => i !== index);
  }
</script>
