<script>
  import { onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  
  let { 
    placeholderKey = 'buttons.find', 
    ariaLabelKey = 'buttons.find', 
    debounceMs = 250, 
    initialValue = '', 
    searching = false, 
    showSpinner = true, 
    onchange 
  } = $props();

  let value = $state('');
  let t;
  let pending = $state(false);
  const dispatch = createEventDispatcher();

  $effect(() => {
    value = initialValue;
  });

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

<div class="input-group">
  <input
    type="text"
    class="form-control form-control-sm focus-ring {String(value || '').trim() ? 'border-secondary' : ''}"
    placeholder={$_(placeholderKey)}
    aria-label={$_(ariaLabelKey)}
    aria-describedby="find-addon"
    {value}
    oninput={onInput} />

  {#if showSpinner && (searching || pending)}
    <span class="input-group-text" aria-label={$_('components.search-input.searching')}>
      <span class="spinner-border spinner-border-sm" role="status"></span>
    </span>
  {/if}
</div>
