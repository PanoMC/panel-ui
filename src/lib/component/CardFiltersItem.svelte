<li class="nav-item">
  <a
    class:active="{active}"
    class="nav-link text-truncate"
    href="{base + href}">
    <slot />
  </a>
</li>

<script>
  import { base } from "$app/paths";

  export let href;
  export let active = false;
</script>
