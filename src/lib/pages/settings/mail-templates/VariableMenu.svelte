<style>
  .variable-menu {
    max-height: 360px;
    overflow-y: auto;
    min-width: 260px;
  }

  .variable-menu .list-field {
    padding-left: 2rem;
  }
</style>

<!-- "Insert variable": the mail's own variables and the system ones. A pick goes to the field the
     admin was last typing in (`onpick`). A list variable inserts a `{{#each name}}…{{/each}}` loop and
     lists its row fields under it; a field inserts `{{field}}`, meant for inside that loop. -->
<div class="dropdown">
  <button
    type="button"
    class="btn btn-sm btn-link text-decoration-none"
    data-bs-toggle="dropdown"
    aria-expanded="false"
    {disabled}>
    <i class="fas fa-code me-2" aria-hidden="true"></i>
    {$_('pages.mail-templates.variables.insert')}
  </button>
  <div class="dropdown-menu dropdown-menu-end variable-menu">
    {#if variables.length > 0}
      <h6 class="dropdown-header">{$_('pages.mail-templates.variables.mail')}</h6>
      {#each variables as variable (variable.name)}
        {#if variable.type === 'list'}
          {@render item(variable, variable.label || variable.name)}
          {#if variable.fields?.length}
            <div class="dropdown-item-text small text-muted list-field">
              {$_('pages.mail-templates.variable-list-fields')}
            </div>
            {#each variable.fields as field (field.name)}
              {@render item(field, field.label || field.name, true)}
            {/each}
          {/if}
        {:else}
          {@render item(variable, variable.label || variable.name)}
        {/if}
      {/each}
    {/if}
    <h6 class="dropdown-header">{$_('pages.mail-templates.variables.system')}</h6>
    {#each SYSTEM_VARIABLES as variable (variable.name)}
      {@render item(variable, $_(`pages.mail-templates.variables.system-names.${variable.name}`))}
    {/each}
  </div>
</div>

{#snippet item(variable, label, field = false)}
  {@const picked = variable.type === 'list' ? listLoop(variable) : variable}
  <button
    type="button"
    class="dropdown-item"
    class:list-field={field}
    onmousedown={(event) => event.preventDefault()}
    onclick={() => onpick?.(picked)}>
    <div class="d-flex align-items-center gap-2">
      <span class="flex-grow-1 text-truncate">{label}</span>
      <span class="badge text-bg-secondary">
        {variable.type === 'list'
          ? $_('pages.mail-templates.variable-list')
          : $_(`pages.mail-templates.variables.types.${variable.type || 'text'}`)}
      </span>
    </div>
    <code class="small">
      {variable.type === 'list' ? `{{#each ${variable.name}}}…{{/each}}` : variableToken(variable)}
    </code>
  </button>
{/snippet}

<script>
  import { _ } from 'svelte-i18n';

  import { SYSTEM_VARIABLES, variableToken } from './mail-templates.api.js';

  let { variables = [], disabled = false, onpick } = $props();

  /**
   * What a pick of a list variable hands to `onpick`: the form inserts `variableToken(variable)`,
   * which wraps a plain variable's name in `{{ }}`, so the name carries the rest of the loop and the
   * insert becomes `{{#each name}}` + an empty line + `{{/each}}`.
   *
   * @param {{ name: string }} variable
   * @returns {{ name: string, type: string }}
   */
  function listLoop(variable) {
    return { name: `#each ${variable.name}}}\n\n{{/each`, type: 'text' };
  }
</script>
