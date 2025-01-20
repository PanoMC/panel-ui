<nav class="nav justify-content-around w-100 py-1 position-absolute bottom-0">
  <a
    class="nav-link text-light"
    href="https://panomc.com/docs"
    target="_blank"
    use:tooltip="{[$_('components.bottom.help'), { placement: 'top' }]}">
    <i class="fas fa-book-open"></i>
  </a>
  <a
    class="nav-link text-light"
    href="javascript:void(0);"
    use:tooltip="{[$_('components.bottom.pano-market'), { placement: 'top' }]}">
    <i class="fas fa-store"></i>
  </a>
  <a
    class="nav-link text-light"
    href="https://panomc.com/discord"
    target="_blank"
    use:tooltip="{[$_('components.bottom.discord'), { placement: 'top' }]}">
    <i class="fab fa-discord"></i>
  </a>
</nav>

<script>
  import { _ } from "svelte-i18n";
  import { base } from "$app/paths";

  import tooltip from "$lib/tooltip.util";
</script>
