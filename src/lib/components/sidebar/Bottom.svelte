<nav class="nav justify-content-around w-100 py-1 align-items-center">
  <div class="dropdown">
    {#if selectingPanelTheme}
      <i class="nav-link text-light fa-solid fa-spinner fa-spin p-2"></i>
    {:else}
      <button
        use:tooltip={[$_('components.navbar.panel-theme'), { placement: 'top' }]}
        aria-label={$_('components.navbar.panel-theme')}
        class="nav-link text-light p-2 border-0 bg-transparent m-auto"
        data-bs-toggle="dropdown"
        type="button"
        class:disabled={selectingPanelTheme}
        disabled={selectingPanelTheme}>
        <i class="fa-solid fa-palette"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <h6 class="dropdown-header">{$_('components.navbar.panel-theme')}</h6>
        {#each panelThemes as theme}
          <li>
            <button
              type="button"
              class="dropdown-item"
              class:active={($session.basicData.panelTheme || 'dark') === theme}
              on:click={() => changePanelTheme(theme)}>
              {$_('panel-themes.' + theme)}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

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
    href="https://panomc.com"
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
  import ApiUtil from '$lib/api.util';

  const session = getContext('session');
  const panelTheme = getContext('panelTheme');
  const siteInfo = getContext('siteInfo');

  const panelThemes = ['light', 'dark'];
  let selectingPanelTheme = false;

  function changePanelTheme(theme) {
    if ($siteInfo?.isDemo) {
      document.documentElement.setAttribute('data-bs-theme', theme);
      $session.basicData.panelTheme = theme;
      $panelTheme = theme;
      return;
    }

    selectingPanelTheme = true;

    ApiUtil.put({
      path: '/api/panel/panelTheme/select',
      body: { theme },
      handler: (body) => {
        if (body.error) {
          location.reload();
          return;
        }

        document.documentElement.setAttribute('data-bs-theme', theme);
        $session.basicData.panelTheme = theme;
        $panelTheme = theme;
        selectingPanelTheme = false;
      },
    });
  }
</script>
