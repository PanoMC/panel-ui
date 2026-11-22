<!-- What the "new ticket" form shows besides the custom fields: the title and the description, each
     on or off with its own placeholder (empty: the theme's own). Used by a category (with
     translations of the placeholders) and by the ticket settings for tickets without a category. -->
<div class="vstack gap-2">
  {#each ROWS as row (row.prop)}
    <div class="form-check form-switch">
      <input
        class="form-check-input"
        type="checkbox"
        role="switch"
        id="{idPrefix}-{row.prop}"
        autocomplete="off"
        checked={current[row.enabled] !== false}
        onchange={(event) => (form = { ...current, [row.enabled]: event.currentTarget.checked })} />
      <label class="form-check-label" for="{idPrefix}-{row.prop}">
        {$_(`components.tickets.form-editor.${row.key}`)}
      </label>
    </div>
    <div class="input-group">
      <input
        class="form-control"
        class:border-danger={errors[`form.${row.prop}`]}
        type="text"
        maxlength="200"
        disabled={current[row.enabled] === false}
        placeholder={$_(`components.tickets.form-editor.${row.key}-placeholder`)}
        value={current[row.prop] ?? ''}
        oninput={(event) => (form = { ...current, [row.prop]: event.currentTarget.value })} />
      {#if i18n !== undefined}
        <TranslationsButton
          bind:i18n
          prop={row.prop}
          defaultText={current[row.prop] ?? ''}
          maxlength={200}
          disabled={current[row.enabled] === false}
          {errors}
          errorKey={(code) => `i18n.${code}.${row.prop}`} />
      {/if}
    </div>
  {/each}
</div>

<script module>
  /** The texts of the form this editor sets; a category also translates both placeholders. */
  export const FORM_TEXT_PROPS = ['titlePlaceholder', 'messagePlaceholder'];

  /** The form of a category / of tickets without one as the server stores it when nothing is set. */
  export function defaultTicketForm() {
    return {
      titleEnabled: true,
      titlePlaceholder: '',
      messageEnabled: true,
      messagePlaceholder: '',
    };
  }

  const ROWS = [
    { key: 'title', enabled: 'titleEnabled', prop: 'titlePlaceholder' },
    { key: 'description', enabled: 'messageEnabled', prop: 'messagePlaceholder' },
  ];
</script>

<script>
  import { _ } from 'svelte-i18n';

  import TranslationsButton from '$lib/components/TranslationsButton.svelte';

  let {
    /** `{ titleEnabled, titlePlaceholder, messageEnabled, messagePlaceholder }` */
    form = $bindable(),
    /** The category's `i18n`; left out (undefined), the placeholders get no translations. */
    i18n = $bindable(),
    errors = {},
    idPrefix = 'ticketForm',
  } = $props();

  // The category modal renders before a category is picked (form still undefined).
  const current = $derived(form ?? defaultTicketForm());
</script>
