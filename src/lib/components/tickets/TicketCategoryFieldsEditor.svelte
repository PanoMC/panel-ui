<!-- The custom fields of a ticket category: an ordered list a player fills in under the ticket's title.
     Each row folds open to its settings (key, type, options, bounds, conditions). [errors] are in the
     server's shape (`fields.<i>.<prop>` → code) and are cleared once the list is re-ordered. The globe
     next to a text holds its translations (`field.i18n`; an option's own `option.i18n`). -->
<div class="vstack gap-2">
  <div class="d-flex align-items-center">
    <span class="form-label mb-0">{$_(T + 'title')}</span>
    <button
      type="button"
      class="btn btn-sm btn-link ms-auto"
      disabled={fields.length >= MAX_FIELDS}
      on:click={addField}>
      <i class="fas fa-plus me-1"></i>
      {$_(T + 'add')}
    </button>
  </div>

  {#if errors?.fields}
    <div class="text-danger small">{errorText(errors.fields)}</div>
  {/if}

  {#if fields.length === 0}
    <div class="text-body-secondary small">{$_(T + 'empty')}</div>
  {/if}

  {#each fields as field, index (field)}
    {@const at = `fields.${index}.`}
    {@const open = expanded.has(field)}
    {@const earlier = fields.slice(0, index).filter((item) => item.key)}
    <div class="card" class:border-danger={hasErrors(errors, at)}>
      <div class="card-body py-2 px-3">
        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-link text-start text-decoration-none p-0 flex-grow-1 text-truncate"
            aria-expanded={open}
            title={$_(T + 'edit')}
            on:click={() => toggle(field)}>
            <i class="fas fa-fw me-1" class:fa-chevron-down={open} class:fa-chevron-right={!open}
            ></i>
            <span class:text-body-secondary={!field.label}>
              {field.label || $_(T + 'untitled')}
            </span>
            <small class="text-body-secondary ms-1">{$_(T + 'types.' + field.type)}</small>
            {#if field.required}
              <span class="badge text-bg-secondary ms-1">{$_(T + 'required')}</span>
            {/if}
            {#if field.conditions}
              <span class="badge text-bg-info ms-1">{$_(T + 'conditional')}</span>
            {/if}
          </button>
          <div class="btn-group btn-group-sm">
            <button
              type="button"
              class="btn btn-link"
              title={$_('buttons.move-up')}
              aria-label={$_('buttons.move-up')}
              disabled={index === 0}
              on:click={() => move(index, -1)}>
              <i class="fas fa-arrow-up"></i>
            </button>
            <button
              type="button"
              class="btn btn-link"
              title={$_('buttons.move-down')}
              aria-label={$_('buttons.move-down')}
              disabled={index === fields.length - 1}
              on:click={() => move(index, 1)}>
              <i class="fas fa-arrow-down"></i>
            </button>
            <button
              type="button"
              class="btn btn-link link-danger"
              title={$_(T + 'remove')}
              aria-label={$_(T + 'remove')}
              on:click={() => removeField(index)}>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        {#if open}
          <div class="row g-2 mt-1">
            <div class="col-md-6">
              <!-- has-validation only with a message after the button, else the button's right
                   corners would be squared -->
              <div class="input-group" class:has-validation={errors?.[at + 'label']}>
                <input
                  class="form-control"
                  class:is-invalid={errors?.[at + 'label']}
                  type="text"
                  maxlength="100"
                  placeholder={$_(T + 'inputs.label')}
                  bind:value={field.label}
                  on:input={() => suggestKey(field)} />
                <TranslationsButton
                  bind:i18n={field.i18n}
                  prop="label"
                  defaultText={field.label}
                  maxlength={MAX_LABEL}
                  {errors}
                  errorKey={(code) => `${at}i18n.${code}.label`} />
                {#if errors?.[at + 'label']}
                  <div class="invalid-feedback">{errorText(errors[at + 'label'])}</div>
                {/if}
              </div>
            </div>
            <div class="col-md-6">
              <input
                class="form-control font-monospace"
                class:is-invalid={errors?.[at + 'key']}
                type="text"
                maxlength="40"
                autocomplete="off"
                spellcheck="false"
                placeholder={$_(T + 'inputs.key')}
                title={$_(T + 'inputs.key')}
                bind:value={field.key}
                on:input={() => autoKeys.delete(field)} />
              {#if errors?.[at + 'key']}
                <div class="invalid-feedback">{errorText(errors[at + 'key'])}</div>
              {/if}
            </div>
            <div class="col-md-6">
              <select
                class="form-select"
                class:is-invalid={errors?.[at + 'type']}
                aria-label={$_(T + 'inputs.type')}
                title={$_(T + 'inputs.type')}
                value={field.type}
                on:change={(event) => changeType(field, event.currentTarget.value)}>
                {#each FIELD_TYPES as type (type)}
                  <option value={type}>{$_(T + 'types.' + type)}</option>
                {/each}
              </select>
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <div class="form-check form-switch mb-0">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="ticketFieldRequired{index}"
                  bind:checked={field.required} />
                <label class="form-check-label" for="ticketFieldRequired{index}">
                  {$_(T + 'inputs.required')}
                </label>
              </div>
            </div>
            {#if PLACEHOLDER_TYPES.has(field.type)}
              <div class="col-12">
                <div class="input-group">
                  <input
                    class="form-control"
                    class:is-invalid={errors?.[at + 'placeholder']}
                    type="text"
                    maxlength="150"
                    placeholder={$_(T + 'inputs.placeholder')}
                    bind:value={field.placeholder} />
                  <TranslationsButton
                    bind:i18n={field.i18n}
                    prop="placeholder"
                    defaultText={field.placeholder}
                    maxlength={MAX_PLACEHOLDER}
                    {errors}
                    errorKey={(code) => `${at}i18n.${code}.placeholder`} />
                </div>
              </div>
            {/if}
            <div class="col-12">
              <div class="input-group">
                <input
                  class="form-control"
                  class:is-invalid={errors?.[at + 'help']}
                  type="text"
                  maxlength="300"
                  placeholder={$_(T + 'inputs.help')}
                  bind:value={field.help} />
                <TranslationsButton
                  bind:i18n={field.i18n}
                  prop="help"
                  defaultText={field.help}
                  maxlength={MAX_HELP}
                  {errors}
                  errorKey={(code) => `${at}i18n.${code}.help`} />
              </div>
            </div>

            {#if BOUND_TYPES.has(field.type)}
              {@const isNumber = field.type === 'NUMBER'}
              {@const boundsOff =
                errors?.[at + 'min'] === 'OUT_OF_RANGE' || errors?.[at + 'max'] === 'OUT_OF_RANGE'}
              <div class="col-6">
                <input
                  class="form-control"
                  class:is-invalid={errors?.[at + 'min'] || boundsOff}
                  type="number"
                  step={isNumber ? 'any' : '1'}
                  min={isNumber ? undefined : 0}
                  placeholder={$_(T + (isNumber ? 'inputs.min-value' : 'inputs.min-length'))}
                  title={$_(T + (isNumber ? 'inputs.min-value' : 'inputs.min-length'))}
                  bind:value={field.min} />
                {#if errors?.[at + 'min']}
                  <div class="invalid-feedback">{errorText(errors[at + 'min'])}</div>
                {/if}
              </div>
              <div class="col-6">
                <input
                  class="form-control"
                  class:is-invalid={errors?.[at + 'max'] || boundsOff}
                  type="number"
                  step={isNumber ? 'any' : '1'}
                  min={isNumber ? undefined : 0}
                  max={isNumber ? undefined : HARD_MAX_LENGTH[field.type]}
                  placeholder={isNumber
                    ? $_(T + 'inputs.max-value')
                    : `${$_(T + 'inputs.max-length')} (${DEFAULT_MAX_LENGTH[field.type]})`}
                  title={$_(T + (isNumber ? 'inputs.max-value' : 'inputs.max-length'))}
                  bind:value={field.max} />
                {#if errors?.[at + 'max']}
                  <div class="invalid-feedback">{errorText(errors[at + 'max'])}</div>
                {/if}
              </div>
            {/if}

            {#if OPTION_TYPES.has(field.type)}
              <div class="col-12">
                <div class="d-flex align-items-center">
                  <span class="form-label small mb-0">{$_(T + 'inputs.options')}</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-link ms-auto"
                    disabled={field.options.length >= MAX_OPTIONS}
                    on:click={() => addOption(field)}>
                    <i class="fas fa-plus me-1"></i>
                    {$_(T + 'inputs.add-option')}
                  </button>
                </div>
                {#if errors?.[at + 'options']}
                  <div class="text-danger small">{errorText(errors[at + 'options'])}</div>
                {/if}
                <div class="vstack gap-1">
                  {#each field.options as option, optionIndex (option)}
                    {@const optionAt = `${at}options.${optionIndex}.`}
                    <div class="input-group input-group-sm">
                      <input
                        class="form-control"
                        class:is-invalid={errors?.[optionAt + 'label']}
                        type="text"
                        maxlength="100"
                        placeholder={$_(T + 'inputs.option-label')}
                        bind:value={option.label}
                        on:input={() => suggestOptionValue(field, option)} />
                      <!-- The option's translations ride on the option itself, so they follow a
                           renamed value. -->
                      <TranslationsButton
                        bind:i18n={option.i18n}
                        prop="label"
                        defaultText={option.label}
                        maxlength={MAX_LABEL}
                        {errors}
                        errorKey={(code) => `${at}i18n.${code}.options.${option.value}`} />
                      <input
                        class="form-control font-monospace"
                        class:is-invalid={errors?.[optionAt + 'value']}
                        type="text"
                        maxlength="40"
                        autocomplete="off"
                        spellcheck="false"
                        placeholder={$_(T + 'inputs.option-value')}
                        title={errors?.[optionAt + 'value']
                          ? errorText(errors[optionAt + 'value'])
                          : $_(T + 'inputs.option-value')}
                        bind:value={option.value}
                        on:input={() => autoKeys.delete(option)} />
                      <button
                        type="button"
                        class="btn btn-outline-danger"
                        title={$_('buttons.remove')}
                        aria-label={$_('buttons.remove')}
                        on:click={() => removeOption(field, optionIndex)}>
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <div class="col-12">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="ticketFieldConditions{index}"
                  checked={!!field.conditions}
                  disabled={!field.conditions && earlier.length === 0}
                  on:change={(event) => toggleConditions(field, event.currentTarget.checked)} />
                <label class="form-check-label" for="ticketFieldConditions{index}">
                  {$_(T + 'inputs.conditions')}
                </label>
              </div>
            </div>

            {#if field.conditions}
              <div class="col-12 vstack gap-1">
                <select
                  class="form-select form-select-sm"
                  class:is-invalid={errors?.[at + 'conditions.match']}
                  bind:value={field.conditions.match}>
                  <option value="ALL">{$_(T + 'inputs.match-all')}</option>
                  <option value="ANY">{$_(T + 'inputs.match-any')}</option>
                </select>
                {#if errors?.[at + 'conditions.rules']}
                  <div class="text-danger small">{errorText(errors[at + 'conditions.rules'])}</div>
                {/if}
                {#each field.conditions.rules as rule, ruleIndex (rule)}
                  {@const ruleAt = `${at}conditions.rules.${ruleIndex}.`}
                  {@const reference = earlier.find((item) => item.key === rule.field)}
                  <div class="input-group input-group-sm">
                    <select
                      class="form-select"
                      class:is-invalid={errors?.[ruleAt + 'field']}
                      title={errors?.[ruleAt + 'field'] ? errorText(errors[ruleAt + 'field']) : ''}
                      value={reference ? rule.field : ''}
                      on:change={(event) =>
                        changeRuleField(field, rule, event.currentTarget.value)}>
                      <option value="" disabled>{$_(T + 'inputs.choose-field')}</option>
                      {#each earlier as item (item)}
                        <option value={item.key}>{item.label || item.key}</option>
                      {/each}
                    </select>
                    <select
                      class="form-select"
                      class:is-invalid={errors?.[ruleAt + 'op']}
                      bind:value={rule.op}>
                      {#each OPERATORS as op (op)}
                        <option value={op}>{$_(T + 'operators.' + op)}</option>
                      {/each}
                    </select>
                    {#if VALUE_OPERATORS.has(rule.op)}
                      {#if reference && OPTION_TYPES.has(reference.type)}
                        <select
                          class="form-select"
                          class:is-invalid={errors?.[ruleAt + 'value']}
                          bind:value={rule.value}>
                          <option value="" disabled>{$_(T + 'inputs.choose-option')}</option>
                          {#each reference.options as option (option)}
                            <option value={option.value}>{option.label || option.value}</option>
                          {/each}
                        </select>
                      {:else if reference?.type === 'CHECKBOX'}
                        <select
                          class="form-select"
                          class:is-invalid={errors?.[ruleAt + 'value']}
                          bind:value={rule.value}>
                          <option value="true">{$_(T + 'inputs.checked')}</option>
                          <option value="false">{$_(T + 'inputs.unchecked')}</option>
                        </select>
                      {:else}
                        <input
                          class="form-control"
                          class:is-invalid={errors?.[ruleAt + 'value']}
                          type={reference?.type === 'NUMBER'
                            ? 'number'
                            : reference?.type === 'DATE'
                              ? 'date'
                              : 'text'}
                          step="any"
                          placeholder={$_(T + 'inputs.value')}
                          value={rule.value}
                          on:input={(event) => {
                            rule.value = event.currentTarget.value;
                            fields = fields;
                          }} />
                      {/if}
                    {/if}
                    <button
                      type="button"
                      class="btn btn-outline-danger"
                      title={$_('buttons.remove')}
                      aria-label={$_('buttons.remove')}
                      on:click={() => removeRule(field, ruleIndex)}>
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                {/each}
                {#if field.conditions.rules.length < MAX_RULES}
                  <div>
                    <button
                      type="button"
                      class="btn btn-sm btn-link px-0"
                      on:click={() => addRule(field, earlier)}>
                      <i class="fas fa-plus me-1"></i>
                      {$_(T + 'inputs.add-rule')}
                    </button>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import {
    BOUND_TYPES,
    DEFAULT_MAX_LENGTH,
    FIELD_TYPES,
    HARD_MAX_LENGTH,
    MAX_FIELDS,
    MAX_HELP,
    MAX_LABEL,
    MAX_OPTIONS,
    MAX_PLACEHOLDER,
    MAX_RULES,
    OPERATORS,
    OPTION_TYPES,
    PLACEHOLDER_TYPES,
    VALUE_OPERATORS,
    newField,
    slugKey,
    uniqueKey,
  } from '$lib/ticketFields.util.js';
  import TranslationsButton from '$lib/components/TranslationsButton.svelte';

  const T = 'components.modals.add-edit-ticket-category.fields.';

  /** The field definitions, edited in place. */
  export let fields = [];
  /** Errors in the server's shape: `{ "fields.2.key": "DUPLICATE" }`. */
  export let errors = {};

  /** Rows whose settings are open. */
  let expanded = new Set();
  /** Fields and options added here whose key still follows their label. */
  const autoKeys = new WeakSet();

  // A field with an error opens by itself, so the marked input can be seen.
  $: openErrored(errors);

  function openErrored(current) {
    const indexes = Object.keys(current ?? {})
      .map((key) => /^fields\.(\d+)\./.exec(key)?.[1])
      .filter((index) => index !== undefined)
      .map(Number);

    if (indexes.length === 0) return;

    indexes.forEach((index) => fields[index] && expanded.add(fields[index]));
    expanded = expanded;
  }

  function errorText(code) {
    return $_(T + 'errors.' + code, { default: code });
  }

  function hasErrors(current, prefix) {
    return Object.keys(current ?? {}).some((key) => key.startsWith(prefix));
  }

  function toggle(field) {
    if (expanded.has(field)) expanded.delete(field);
    else expanded.add(field);

    expanded = expanded;
  }

  /** Server errors name fields by position; once positions change they point at the wrong row. */
  function clearErrors() {
    errors = {};
  }

  function addField() {
    const field = newField(uniqueKey('field-' + (fields.length + 1), takenKeys()));

    autoKeys.add(field);
    expanded.add(field);
    expanded = expanded;
    fields = [...fields, field];
  }

  function removeField(index) {
    expanded.delete(fields[index]);
    fields = fields.filter((_, i) => i !== index);
    clearErrors();
  }

  function move(index, step) {
    const target = index + step;

    if (target < 0 || target >= fields.length) return;

    const next = [...fields];

    [next[index], next[target]] = [next[target], next[index]];
    fields = next;
    clearErrors();
  }

  function takenKeys(except) {
    return fields.filter((item) => item !== except).map((item) => item.key);
  }

  /** A field added here takes its key from its label until the key is typed by hand. */
  function suggestKey(field) {
    if (!autoKeys.has(field)) return;

    const slug = slugKey(field.label);

    field.key = uniqueKey(slug || 'field-' + (fields.indexOf(field) + 1), takenKeys(field));
    fields = fields;
  }

  function suggestOptionValue(field, option) {
    if (!autoKeys.has(option)) return;

    const others = field.options.filter((item) => item !== option).map((item) => item.value);

    option.value = uniqueKey(
      slugKey(option.label) || 'option-' + (field.options.indexOf(option) + 1),
      others,
    );
    fields = fields;
  }

  function changeType(field, type) {
    field.type = type;

    if (OPTION_TYPES.has(type) && field.options.length === 0) {
      const option = { value: 'option-1', label: '' };

      autoKeys.add(option);
      field.options = [option];
    }

    if (!BOUND_TYPES.has(type)) {
      field.min = null;
      field.max = null;
    }

    fields = fields;
  }

  function addOption(field) {
    const option = {
      value: uniqueKey(
        'option-' + (field.options.length + 1),
        field.options.map((item) => item.value),
      ),
      label: '',
    };

    autoKeys.add(option);
    field.options = [...field.options, option];
    fields = fields;
  }

  function removeOption(field, index) {
    field.options = field.options.filter((_, i) => i !== index);
    fields = fields;
    clearErrors();
  }

  function newRule(earlier) {
    const reference = earlier[earlier.length - 1];

    return {
      field: reference?.key ?? '',
      op: 'FILLED',
      value: reference?.type === 'CHECKBOX' ? 'true' : '',
    };
  }

  function toggleConditions(field, on) {
    const earlier = fields.slice(0, fields.indexOf(field)).filter((item) => item.key);

    field.conditions = on ? { match: 'ALL', rules: [newRule(earlier)] } : null;
    fields = fields;
  }

  function addRule(field, earlier) {
    field.conditions.rules = [...field.conditions.rules, newRule(earlier)];
    fields = fields;
  }

  function removeRule(field, index) {
    field.conditions.rules = field.conditions.rules.filter((_, i) => i !== index);

    if (field.conditions.rules.length === 0) field.conditions = null;

    fields = fields;
    clearErrors();
  }

  function changeRuleField(field, rule, key) {
    const reference = fields.find((item) => item.key === key);

    rule.field = key;
    rule.value = reference?.type === 'CHECKBOX' ? 'true' : '';
    fields = fields;
  }
</script>
