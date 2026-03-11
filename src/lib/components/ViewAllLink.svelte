<a
  href={href || 'javascript:void(0)'}
  target={targetBlank ? '_blank' : undefined}
  rel={targetBlank ? 'noopener noreferrer' : undefined}
  class="btn-link text-decoration-none focus-ring rounded {classes}"
  aria-label={$_('buttons.view-all')}
  use:tooltip={[$_('buttons.view-all')]}
  on:click={handleClick}>
  <slot>
    <i class="fa-solid fa-arrow-right"></i>
  </slot>
</a>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  const dispatch = createEventDispatcher();

  export let href = '';
  export let classes = '';
  export let targetBlank = false;

  function handleClick(event) {
    if (!href || href === 'javascript:void(0)') {
      event.preventDefault();
    }
    dispatch('click', event);
  }
</script>
