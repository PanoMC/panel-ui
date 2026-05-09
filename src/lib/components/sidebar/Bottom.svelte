<nav class="nav justify-content-around w-100 py-1 align-items-center">
  <a
    class="nav-link text-light p-2"
    href="{PANO_WEBSITE_URL}/docs"
    target="_blank"
    use:tooltip={[$_('components.bottom.documentation'), { placement: 'top' }]}
    aria-label={$_('components.bottom.documentation')}>
    <i class="fas fa-question-circle"></i>
  </a>

  <a
    class="nav-link text-light p-2"
    href={PANO_WEBSITE_URL}
    target="_blank"
    use:tooltip={[$_('components.bottom.website'), { placement: 'top' }]}
    aria-label={$_('components.bottom.website')}>
    <i class="fas fa-globe"></i>
  </a>


  <a
    class="nav-link text-light p-2"
    href="{PANO_WEBSITE_URL}/discord"
    target="_blank"
    use:tooltip={[$_('components.bottom.discord'), { placement: 'top' }]}
    aria-label={$_('components.bottom.discord')}>
    <i class="fab fa-discord"></i>
  </a>

  <a
    class="nav-link text-light p-2"
    href="https://github.com/PanoMC/Pano/issues/new"
    target="_blank"
    rel="noopener noreferrer"
    use:tooltip={[$_('components.navbar.report-a-bug'), { placement: 'top' }]}
    aria-label={$_('components.navbar.report-a-bug')}>
    <i class="fa-solid fa-bug"></i>
  </a>
</nav>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  const session = getContext('session');
  const panelTheme = getContext('panelTheme');
  const siteInfo = getContext('siteInfo');

</script>
