<!-- Edit Ticket Fields Modal -->
<!-- Staff change the values a ticket's custom fields hold: one input per snapshot entry, of its type.
     The category's `required` and conditions do not apply here, only each value's own checks. -->
<div class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.edit-ticket-fields.title')}</h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form class="d-flex flex-column overflow-hidden" on:submit|preventDefault={onSubmit}>
        <div class="modal-body vstack gap-3">
          {#each $entries as entry, index (entry.key)}
            {@const id = `ticketField${index}`}
            {@const error = $errors[`fields.${entry.key}`]}
            <div>
              {#if entry.type === 'CHECKBOX'}
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    class:is-invalid={error}
                    type="checkbox"
                    role="switch"
                    {id}
                    bind:checked={$values[entry.key]} />
                  <label class="form-check-label" for={id}
                    >{localized(entry.label, entry.i18n, $locale, 'label')}</label>
                </div>
              {:else}
                <label class="form-label mb-1" for={id}
                  >{localized(entry.label, entry.i18n, $locale, 'label')}</label>
                {#if entry.type === 'TEXTAREA'}
                  <textarea
                    class="form-control"
                    class:is-invalid={error}
                    {id}
                    rows="3"
                    maxlength={textLimit(entry)}
                    bind:value={$values[entry.key]}></textarea>
                {:else if entry.type === 'NUMBER'}
                  <input
                    class="form-control"
                    class:is-invalid={error}
                    {id}
                    type="number"
                    step="any"
                    min={entry.min ?? undefined}
                    max={entry.max ?? undefined}
                    bind:value={$values[entry.key]} />
                {:else if entry.type === 'EMAIL'}
                  <input
                    class="form-control"
                    class:is-invalid={error}
                    {id}
                    type="email"
                    maxlength="254"
                    bind:value={$values[entry.key]} />
                {:else if entry.type === 'URL'}
                  <input
                    class="form-control"
                    class:is-invalid={error}
                    {id}
                    type="url"
                    maxlength="500"
                    placeholder="https://"
                    bind:value={$values[entry.key]} />
                {:else if entry.type === 'DATE'}
                  <input
                    class="form-control"
                    class:is-invalid={error}
                    {id}
                    type="date"
                    bind:value={$values[entry.key]} />
                {:else if entry.type === 'SELECT'}
                  <select
                    class="form-select"
                    class:is-invalid={error}
                    {id}
                    bind:value={$values[entry.key]}>
                    <option value=""
                      >{$_('components.modals.edit-ticket-fields.choose-option')}</option>
                    {#each entry.options ?? [] as option (option.value)}
                      <option value={option.value}
                        >{localizedOption(option, entry.i18n, $locale)}</option>
                    {/each}
                  </select>
                {:else if entry.type === 'MULTISELECT'}
                  <div class="vstack gap-1" {id}>
                    {#each entry.options ?? [] as option, optionIndex (option.value)}
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          class:is-invalid={error}
                          type="checkbox"
                          id="{id}-{optionIndex}"
                          checked={($values[entry.key] ?? []).includes(option.value)}
                          on:change={(event) =>
                            toggleOption(entry.key, option.value, event.currentTarget.checked)} />
                        <label class="form-check-label" for="{id}-{optionIndex}">
                          {localizedOption(option, entry.i18n, $locale)}
                        </label>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <input
                    class="form-control"
                    class:is-invalid={error}
                    {id}
                    type="text"
                    maxlength={textLimit(entry)}
                    bind:value={$values[entry.key]} />
                {/if}
              {/if}
              {#if error}
                <div class="invalid-feedback d-block">
                  {$_('components.modals.add-edit-ticket-category.fields.errors.' + error, {
                    default: error,
                  })}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={loading}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';
  import {
    DEFAULT_MAX_LENGTH,
    HARD_MAX_LENGTH,
    normalizeValue,
    validateValue,
  } from '$lib/ticketFields.util.js';

  const modalElement = writable();
  const ticketId = writable(-1);
  /** The ticket's snapshot entries. */
  const entries = writable([]);
  /** key → the value being edited. */
  const values = writable({});
  /** `fields.<key>` → error code. */
  const errors = writable({});

  let callback = (fields) => {};
  let modal;

  /** The value as an input holds it: '' instead of null, a list for MULTISELECT, a boolean for CHECKBOX. */
  function editable(entry) {
    const value = entry.value;

    if (entry.type === 'CHECKBOX') return value === true;
    if (entry.type === 'MULTISELECT') return Array.isArray(value) ? [...value] : [];
    if (value === null || value === undefined) return entry.type === 'NUMBER' ? null : '';

    return entry.type === 'NUMBER' ? value : String(value);
  }

  export function show(newTicketId, newEntries = []) {
    ticketId.set(newTicketId);
    entries.set(newEntries);
    values.set(Object.fromEntries(newEntries.map((entry) => [entry.key, editable(entry)])));
    errors.set({});

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  /** [newCallback] gets the snapshot the server answered with after a save. */
  export function setCallback(newCallback) {
    callback = newCallback;
  }
</script>

<script>
  import { _, locale } from 'svelte-i18n';

  import { localized, localizedOption } from '$lib/contentI18n.util.js';

  let loading = false;

  function textLimit(entry) {
    const limit = DEFAULT_MAX_LENGTH[entry.type];

    if (!limit) return undefined;

    return Math.min(entry.max ?? limit, HARD_MAX_LENGTH[entry.type]);
  }

  function toggleOption(key, value, checked) {
    values.update((current) => {
      const list = (current[key] ?? []).filter((item) => item !== value);

      if (checked) list.push(value);

      return { ...current, [key]: list };
    });
  }

  function onSubmit() {
    const current = get(values);
    /** @type {Record<string, any>} */
    const changed = {};
    /** @type {Record<string, string>} */
    const found = {};

    for (const entry of get(entries)) {
      const value = normalizeValue(entry.type, current[entry.key]);

      if (JSON.stringify(value) === JSON.stringify(normalizeValue(entry.type, entry.value)))
        continue;

      const code = validateValue(entry, value, { enforceRequired: false });

      if (code) found[`fields.${entry.key}`] = code;

      changed[entry.key] = value;
    }

    errors.set(found);

    if (Object.keys(found).length > 0) return;

    if (Object.keys(changed).length === 0) {
      hide();

      return;
    }

    loading = true;

    ApiUtil.put({
      path: `/panel/tickets/${get(ticketId)}/fields`,
      body: { fields: changed },
      handler: (body, reject) => {
        loading = false;

        if (!body.error && Array.isArray(body.fields)) {
          hide();
          callback(body.fields);

          return;
        }

        if (body.error?.fields) {
          errors.set(body.error.fields);

          return;
        }

        reject();
      },
    }).finally(() => (loading = false));
  }
</script>
