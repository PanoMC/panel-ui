<a
  class:active
  class="btn btn-sm btn-outline-primary text-truncate"
  role="button"
  href={base + href}>
  <slot />
</a>

<script>
  import { base } from '$app/paths';

  export let href;
  export let active;
</script>
