{#if button}
  <button
    type="button"
    class:active
    class:disabled
    {disabled}
    aria-disabled={disabled}
    class="btn btn-sm btn-outline-primary text-truncate"
    {onclick}>
    {@render children?.()}
  </button>
{:else}
  <a
    class:active
    class="btn btn-sm btn-outline-primary text-truncate"
    role="button"
    href={href ? (href.startsWith('http') ? href : base + href) : 'javascript:void(0)'}
    {onclick}>
    {@render children?.()}
  </a>
{/if}

<script>
  import { base } from '$app/paths';

  let { href = '', active = false, button = false, disabled = false, onclick, children } = $props();
</script>
