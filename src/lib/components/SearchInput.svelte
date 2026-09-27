<div class="input-group">
  <input
    type="text"
    id={inputId}
    bind:this={inputElement}
    class="form-control focus-ring {small ? 'form-control-sm' : ''} {String(value || '').trim()
      ? 'border-secondary'
      : ''}"
    placeholder={$_(placeholderKey)}
    aria-label={$_(ariaLabelKey)}
    aria-describedby="find-addon"
    {value}
    oninput={onInput} />

  {#if showSpinner && (searching || pending)}
    <span class="input-group-text" aria-label={$_('components.search-input.searching')}>
      <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
    </span>
  {/if}
</div>

<script>
  import { onDestroy, onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  let {
    placeholderKey = 'buttons.find',
    ariaLabelKey = 'buttons.find',
    debounceMs = 250,
    initialValue = '',
    searching = false,
    showSpinner = true,
    onchange,
    inputId = undefined,
    small = true,
    autofocus = false,
  } = $props();

  let value = $state('');
  let inputElement = $state();
  let t;
  let pending = $state(false);
  const dispatch = createEventDispatcher();

  $effect(() => {
    value = initialValue;
  });

  // A hidden field cannot take focus, so this is a no-op for the instances that live inside a
  // dialog which is not open yet — the dialog's own `shown` handler is what focuses those.
  onMount(() => {
    if (autofocus) {
      inputElement?.focus();
    }
  });

  /**
   * Hands the caret back to the field on demand, for a page that is not remounted when its view
   * changes (a tab that is a plain link, say) and so cannot rely on `autofocus` firing again.
   */
  export function focus() {
    inputElement?.focus();
  }

  function emitNow(v) {
    pending = false;
    if (onchange) onchange(v);
    dispatch('change', { value: v });
  }

  function onInput(e) {
    value = e.target.value;
    pending = true;
    if (t) clearTimeout(t);
    t = setTimeout(() => emitNow(value), debounceMs);
  }

  onDestroy(() => {
    if (t) clearTimeout(t);
  });
</script>
