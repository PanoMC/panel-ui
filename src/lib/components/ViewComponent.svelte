{#if component && typeof component !== 'function'}
  {@const Component = component.default || component}
  <Component {...rest} />
{/if}

<script>
  let { component, ...rest } = $props();
</script>
