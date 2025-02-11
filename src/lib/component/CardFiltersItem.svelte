<li class="nav-item">
  <a
    class:active="{active}"
    class="nav-link text-truncate pt-0"
    href="{base + href}">
    <slot />
  </a>
</li>

<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { _ } from "svelte-i18n";

  export let href;
  export let active = false;
</script>
