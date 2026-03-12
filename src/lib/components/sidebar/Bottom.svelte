<nav class="nav justify-content-center gap-2 w-100 py-1">
  <a
    class="nav-link text-light"
    href="{PANO_WEBSITE_URL}/docs"
    target="_blank"
    use:tooltip={[$_('components.bottom.documentation'), { placement: 'top' }]}
    aria-label={$_('components.bottom.documentation')}>
    <i class="fas fa-question-circle"></i>
  </a>
  <a
    class="nav-link text-light"
    href="https://panomc.com"
    target="_blank"
    use:tooltip={[$_('components.bottom.website'), { placement: 'top' }]}
    aria-label={$_('components.bottom.website')}>
    <i class="fas fa-globe"></i>
  </a>
  <a
    class="nav-link text-light"
    href="https://github.com/PanoMC"
    target="_blank"
    use:tooltip={[$_('components.bottom.github'), { placement: 'top' }]}
    aria-label={$_('components.bottom.github')}>
    <i class="fab fa-github"></i>
  </a>
  <a
    class="nav-link text-light"
    href="{PANO_WEBSITE_URL}/discord"
    target="_blank"
    use:tooltip={[$_('components.bottom.discord'), { placement: 'top' }]}
    aria-label={$_('components.bottom.discord')}>
    <i class="fab fa-discord"></i>
  </a>
</nav>

<script>
  import { _ } from 'svelte-i18n';

  import tooltip from '$lib/tooltip.util';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';
</script>
