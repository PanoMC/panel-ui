<div class="vstack gap-3" data-schema-form>
  {#if tabs.length > 1 || (tabs.length === 1 && tabs[0].id !== '')}
    <ul class="nav nav-pills" role="tablist">
      {#each tabs as tab (tab.id)}
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link"
            class:active={activeTab?.id === tab.id}
            role="tab"
            aria-selected={activeTab?.id === tab.id}
            data-schema-tab={tab.id}
            onclick={() => (chosen = tab.id)}>
            {text(tab.id)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#each activeTab?.keys ?? [] as key (key)}
    {@const field = schema.fields[key]}
    {@const invalid = errors[key]}
    <div data-field={key} data-type={field.type}>
      {#if field.type === 'boolean'}
        <div class="form-check form-switch">
          <input
            id={idOf(key)}
            class="form-check-input"
            class:is-invalid={invalid}
            type="checkbox"
            role="switch"
            {disabled}
            bind:checked={values[key]} />
          <label class="form-check-label" for={idOf(key)}>{text(field.label)}</label>
        </div>
      {:else}
        <label class="form-label" for={idOf(key)}>
          {text(field.label)}{#if field.required}<span class="text-danger ms-1">*</span>{/if}
        </label>

        {#if field.type === 'text'}
          <input
            id={idOf(key)}
            class="form-control"
            class:is-invalid={invalid}
            type="text"
            autocomplete="off"
            required={field.required}
            minlength={field.min}
            maxlength={field.max}
            {disabled}
            bind:value={values[key]} />
        {:else if field.type === 'textarea'}
          <textarea
            id={idOf(key)}
            class="form-control"
            class:is-invalid={invalid}
            rows="4"
            required={field.required}
            minlength={field.min}
            maxlength={field.max}
            {disabled}
            bind:value={values[key]}></textarea>
        {:else if field.type === 'number'}
          <input
            id={idOf(key)}
            class="form-control"
            class:is-invalid={invalid}
            type="number"
            step="any"
            required={field.required}
            min={field.min}
            max={field.max}
            {disabled}
            bind:value={values[key]} />
        {:else if field.type === 'select'}
          <select
            id={idOf(key)}
            class="form-select"
            class:is-invalid={invalid}
            required={field.required}
            {disabled}
            bind:value={values[key]}>
            {#each field.options ?? [] as option (option.value)}
              <option value={option.value}>{text(option.label)}</option>
            {/each}
          </select>
        {:else if field.type === 'color'}
          <div class="input-group">
            <input
              class="form-control form-control-color"
              type="color"
              title={text(field.label)}
              aria-label={text(field.label)}
              value={colorInputValue(values[key])}
              {disabled}
              oninput={(event) => (values[key] = event.currentTarget.value)} />
            <input
              id={idOf(key)}
              class="form-control font-monospace"
              class:is-invalid={invalid}
              type="text"
              autocomplete="off"
              placeholder="#000000"
              maxlength="9"
              required={field.required}
              {disabled}
              bind:value={values[key]} />
          </div>
        {:else if field.type === 'url'}
          <input
            id={idOf(key)}
            class="form-control"
            class:is-invalid={invalid}
            type="text"
            inputmode="url"
            autocomplete="off"
            placeholder="https://"
            required={field.required}
            {disabled}
            bind:value={values[key]} />
        {:else if field.type === 'image'}
          {#each files[key] ?? [] as name (name)}
            <div class="d-flex align-items-center gap-2 mb-2" data-image-file={name}>
              <i class="fa-solid fa-image text-body-secondary" aria-hidden="true"></i>
              <span class="text-break flex-grow-1">{name}</span>
              <button
                type="button"
                class="btn btn-sm btn-link link-danger"
                {disabled}
                title={$_('components.schema-form.remove-file')}
                aria-label={$_('components.schema-form.remove-file')}
                onclick={() => dropFile(key, name)}>
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          {/each}
          <div class="input-group">
            <input
              id={idOf(key)}
              class="form-control"
              class:is-invalid={invalid}
              type="file"
              accept="image/*"
              {disabled}
              onchange={(event) => pick(key, event)} />
            {#if uploads[key]}
              <button
                type="button"
                class="btn btn-outline-secondary"
                {disabled}
                title={$_('components.schema-form.clear-file')}
                aria-label={$_('components.schema-form.clear-file')}
                onclick={() => clearPick(key)}>
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            {/if}
          </div>
        {/if}
      {/if}

      {#if invalid}
        <div class="invalid-feedback d-block" data-field-error={invalid}>{reasonText(invalid)}</div>
      {/if}
      {#if field.help}
        <div class="form-text">{text(field.help)}</div>
      {/if}
    </div>
  {/each}
</div>

<script module>
  /**
   * The settings form of a front-end, drawn from its `settingsSchema` (open front-end plan, doc 05
   * section 9). The pure parts live here so the Front-end page and the tests share them.
   */

  /** The eight field types the schema knows. */
  export const FIELD_TYPES = Object.freeze([
    'text',
    'textarea',
    'boolean',
    'number',
    'select',
    'color',
    'url',
    'image',
  ]);

  /**
   * @typedef {object} SchemaOption
   * @property {string | number | boolean} value
   * @property {string} label
   */

  /**
   * @typedef {object} SchemaField
   * @property {'text'|'textarea'|'boolean'|'number'|'select'|'color'|'url'|'image'} type
   * @property {string} label
   * @property {string} [help]
   * @property {any} [default]
   * @property {SchemaOption[]} [options]
   * @property {boolean} [required]
   * @property {number} [min]
   * @property {number} [max]
   */

  /**
   * @typedef {object} Schema
   * @property {Record<string, string[]>} [tabs]
   * @property {string} [defaultTab]
   * @property {Record<string, SchemaField>} fields
   */

  /**
   * The text of a dotted key in the front-end's own texts: the flat key first, then the nested path.
   * @param {any} messages
   * @param {string} key
   * @returns {string | null}
   */
  export function lookupText(messages, key) {
    if (!messages || typeof messages !== 'object') return null;

    if (typeof messages[key] === 'string') return messages[key];

    let node = messages;

    for (const part of key.split('.')) {
      if (node === null || typeof node !== 'object' || !(part in node)) return null;

      node = node[part];
    }

    return typeof node === 'string' ? node : null;
  }

  /**
   * A label or help text: plain text, or a key of the front-end's own texts when it contains a dot and
   * resolves there (so the admin's text edits apply), or of the panel's texts; anything else is shown as written.
   *
   * @param {string | undefined | null} text
   * @param {any} [messages] the front-end's texts, nested or flat
   * @param {(key: string) => string | null} [translate] the panel's own lookup
   */
  export function resolveText(text, messages, translate) {
    if (typeof text !== 'string' || text === '') return '';

    if (!text.includes('.')) return text;

    return lookupText(messages, text) ?? translate?.(text) ?? text;
  }

  /**
   * The tabs of a schema in order, each with its field keys. Without `tabs` there is one nameless tab holding every field.
   * @param {Schema} schema
   * @returns {Array<{ id: string, keys: string[] }>}
   */
  export function tabsOf(schema) {
    const fields = schema?.fields ?? {};
    const tabs = schema?.tabs;

    if (!tabs || Object.keys(tabs).length === 0) {
      return [{ id: '', keys: Object.keys(fields) }];
    }

    return Object.entries(tabs).map(([id, keys]) => ({
      id,
      keys: (Array.isArray(keys) ? keys : []).filter((key) => key in fields),
    }));
  }

  /**
   * What a field shows while nothing is stored: its default, else the empty value of its type (a select
   * shows its first option, so what the admin sees is what is saved).
   * @param {SchemaField} field
   */
  function emptyOf(field) {
    if (field.default !== undefined && field.default !== null) return field.default;

    if (field.type === 'select') return field.options?.[0]?.value ?? '';

    return field.type === 'boolean' ? false : field.type === 'number' ? null : '';
  }

  /**
   * The values the form starts from: every field except images (those are files), the stored value or
   * the field's default or the empty value of its type.
   *
   * @param {Schema} schema
   * @param {Record<string, any>} [settings] the `settings` of the backend's answer
   * @returns {Record<string, any>}
   */
  export function initialValues(schema, settings = {}) {
    /** @type {Record<string, any>} */
    const values = {};

    for (const [key, field] of Object.entries(schema?.fields ?? {})) {
      if (field.type === 'image') continue;

      const stored = settings?.[key];

      values[key] = stored !== undefined && stored !== null ? stored : emptyOf(field);
    }

    return values;
  }

  /**
   * The stored image names per image field, as the form keeps them (a copy, so editing the form never
   * edits the answer it came from).
   * @param {Schema} schema
   * @param {Record<string, any>} [files] the `files` of the backend's answer
   * @returns {Record<string, string[]>}
   */
  export function initialFiles(schema, files = {}) {
    /** @type {Record<string, string[]>} */
    const result = {};

    for (const [key, field] of Object.entries(schema?.fields ?? {})) {
      if (field.type !== 'image') continue;

      const names = files?.[key];

      result[key] = Array.isArray(names)
        ? names.map(String)
        : typeof names === 'string'
          ? [names]
          : [];
    }

    return result;
  }

  /**
   * The `settings` object of `PUT /panel/frontend/settings` for the form. Every field is sent (the write
   * replaces what is stored); an empty number is left out so the default applies; images go in `files`
   * (the names kept) and `remove-files` (the names dropped, which includes the old file of an image that
   * was replaced). Chosen files travel beside this object, see `chosenUploads`.
   *
   * @param {Schema} schema
   * @param {Record<string, any>} values
   * @param {{ files?: Record<string, string[]>, removed?: string[], uploads?: Record<string, File> }} [images]
   */
  export function buildSettings(schema, values, { files = {}, removed = [], uploads = {} } = {}) {
    /** @type {Record<string, any>} */
    const body = {};

    for (const [key, field] of Object.entries(schema?.fields ?? {})) {
      if (field.type === 'image') continue;

      const value = values?.[key];

      switch (field.type) {
        case 'boolean':
          body[key] = value === true;
          break;

        case 'number':
          if (
            value !== null &&
            value !== undefined &&
            value !== '' &&
            Number.isFinite(Number(value))
          ) {
            body[key] = Number(value);
          }
          break;

        case 'select':
          if (value !== undefined && value !== null && value !== '') body[key] = value;
          break;

        default:
          body[key] = value === undefined || value === null ? '' : String(value);
      }
    }

    /** @type {Record<string, string[]>} */
    const keep = {};
    const drop = new Set(removed);

    for (const [key, field] of Object.entries(schema?.fields ?? {})) {
      if (field.type !== 'image') continue;

      const names = files[key] ?? [];

      // A new file replaces the old one: the field holds a single image.
      if (uploads[key]) {
        names.forEach((name) => drop.add(name));
      } else if (names.length > 0) {
        keep[key] = names.filter((name) => !drop.has(name));
      }
    }

    if (Object.keys(keep).length > 0) body.files = keep;
    if (drop.size > 0) body['remove-files'] = [...drop];

    return body;
  }

  /**
   * The chosen files that really are for an image field, by field key.
   * @param {Schema} schema
   * @param {Record<string, File | null | undefined>} uploads
   * @returns {Record<string, File>}
   */
  export function chosenUploads(schema, uploads) {
    /** @type {Record<string, File>} */
    const result = {};

    for (const [key, field] of Object.entries(schema?.fields ?? {})) {
      if (field.type === 'image' && uploads?.[key]) result[key] = uploads[key];
    }

    return result;
  }

  /** A `#rrggbb` value for `<input type="color">`, which accepts nothing else. */
  export function colorInputValue(value) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  /**
   * The generic settings form (Themes -> Front-end settings -> Settings). It draws the fields of a
   * `settingsSchema` and edits the bound state; saving is the caller's job (`buildSettings`).
   *
   * @type {{
   *   schema: Schema,
   *   values?: Record<string, any>,
   *   files?: Record<string, string[]>,
   *   removed?: string[],
   *   uploads?: Record<string, File | null>,
   *   messages?: any,
   *   errors?: Record<string, string>,
   *   disabled?: boolean,
   *   idPrefix?: string,
   * }}
   */
  let {
    schema,
    values = $bindable({}),
    files = $bindable({}),
    removed = $bindable([]),
    uploads = $bindable({}),
    messages = {},
    errors = {},
    disabled = false,
    idPrefix = 'schema-form',
  } = $props();

  const tabs = $derived(tabsOf(schema));

  // svelte-ignore state_referenced_locally
  let chosen = $state(schema?.defaultTab ?? '');

  const activeTab = $derived(tabs.find((tab) => tab.id === chosen) ?? tabs[0]);

  /** @param {string | undefined | null} value */
  const text = (value) =>
    resolveText(value, messages, (key) => {
      const own = $_(key, { default: '' });

      return own === '' ? null : own;
    });

  /** @param {string} key */
  const idOf = (key) => `${idPrefix}-${key}`;

  /** @param {string} reason the code the backend gave (`TOO_SHORT`, `NOT_AN_OPTION`, ...) */
  const reasonText = (reason) => {
    const key = `components.schema-form.reasons.${reason}`;
    const message = $_(key, { default: '' });

    return message === '' ? $_('components.schema-form.reasons.UNKNOWN') : message;
  };

  /**
   * @param {string} key
   * @param {Event} event
   */
  function pick(key, event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);

    uploads[key] = input.files?.[0] ?? null;
  }

  /**
   * Drops a stored image: the file is deleted by the backend on save.
   * @param {string} key
   * @param {string} name
   */
  function dropFile(key, name) {
    files[key] = (files[key] ?? []).filter((item) => item !== name);
    removed = [...removed, name];
  }

  /** @param {string} key */
  function clearPick(key) {
    uploads[key] = null;
  }
</script>
