<div class="input-group">
  <input
    type="text"
    class="form-control form-control-sm {String(value || '').trim() ? 'border-secondary' : ''}"
    placeholder={$_(placeholderKey)}
    aria-label={$_(ariaLabelKey)}
    aria-describedby="find-addon"
    {value}
    on:input={onInput} />

  {#if showSpinner && (searching || pending)}
    <span class="input-group-text" aria-label={$_('components.search-input.searching')}>
      <span class="spinner-border spinner-border-sm" role="status"></span>
    </span>
  {/if}
</div>

<script>
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let placeholderKey = 'buttons.find';
  export let ariaLabelKey = 'buttons.find';
  export let debounceMs = 250;
  export let initialValue = '';
  export let searching = false;
  export let showSpinner = true;

  const dispatch = createEventDispatcher();

  let value = initialValue;
  let t;
  let pending = false;

  function emitNow(v) {
    pending = false;
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
