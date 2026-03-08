<script>
  import { base } from '$app/paths';
  
  let { 
    href = '', 
    active = false, 
    button = false, 
    onclick, 
    children 
  } = $props();
</script>

{#if button}
  <button
    type="button"
    class:active
    class="btn btn-sm btn-outline-primary text-truncate"
    onclick={(e) => { console.log('CardFiltersItem Button Clicked'); if (onclick) onclick(e); }}>
    {@render children?.()}
  </button>
{:else}
  <a
    class:active
    class="btn btn-sm btn-outline-primary text-truncate"
    role="button"
    href={href ? (href.startsWith('http') ? href : base + href) : 'javascript:void(0)'}
    onclick={(e) => { console.log('CardFiltersItem Link Clicked'); if (onclick) onclick(e); }}>
    {@render children?.()}
  </a>
{/if}
