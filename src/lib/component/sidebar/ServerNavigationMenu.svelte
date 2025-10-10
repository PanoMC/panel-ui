<nav class="sidebar-nav navbar-dark animate__animated animate__fadeIn">
  {#if $selectedServer}
    <ul class="navbar-nav px-3">
      <li class="nav-item">
        <a
          class="nav-link"
          href="{base}/server/dashboard"
          class:active="{matching(
            $page.url.pathname,
            base + '/server/dashboard',
          )}">
          <i class="fas fa-chart-pie me-2"></i>
          {$_("components.server-navigation-menu.statistics")}
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          href="{base}/server/settings"
          class:active="{matching(
            $page.url.pathname,
            base + '/server/settings',
            true,
          )}">
          <i class="fas fa-cog me-2"></i>
          {$_("components.server-navigation-menu.settings")}
        </a>
      </li>
    </ul>
  {:else if $connectedServerCount > 0}
    <NoContent
      icon="fas fa-cube fa-3x"
      text="{$_('components.server-navigation-menu.no-selected-server')}"
      dark="{true}" />
  {:else}
    <NoContent
      icon="fas fa-cube fa-3x"
      text="{$_('components.server-navigation-menu.no-server-text')}"
      dark="{true}">
    </NoContent>
  {/if}
</nav>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { page } from "$app/stores";

  import NoContent from "$lib/component/NoContent.svelte";

  import { show as showServersModal } from "$lib/component/modals/ServersModal.svelte";

  const selectedServer = getContext("selectedServer");
  const connectedServerCount = getContext("connectedServerCount");

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + "/").toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
