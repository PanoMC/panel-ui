<nav class="nav justify-content-around w-100 py-1 align-items-center">
  <a
    class="nav-link text-light p-2"
    href="{PANO_WEBSITE_URL}/docs"
    target="_blank"
    title={$_('components.bottom.documentation')}
    aria-label={$_('components.bottom.documentation')}>
    <i class="fas fa-question-circle"></i>
  </a>

  <a
    class="nav-link text-light p-2"
    href={PANO_WEBSITE_URL}
    target="_blank"
    title={$_('components.bottom.website')}
    aria-label={$_('components.bottom.website')}>
    <i class="fas fa-globe"></i>
  </a>


  <a
    class="nav-link text-light p-2"
    href="{PANO_WEBSITE_URL}/discord"
    target="_blank"
    title={$_('components.bottom.discord')}
    aria-label={$_('components.bottom.discord')}>
    <i class="fab fa-discord"></i>
  </a>

  <a
    class="nav-link text-light p-2"
    href="https://github.com/PanoMC/Pano/issues/new"
    target="_blank"
    rel="noopener noreferrer"
    title={$_('components.navbar.report-a-bug')}
    aria-label={$_('components.navbar.report-a-bug')}>
    <i class="fa-solid fa-bug"></i>
  </a>
</nav>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  const session = getContext('session');
  const panelTheme = getContext('panelTheme');
  const siteInfo = getContext('siteInfo');

</script>
