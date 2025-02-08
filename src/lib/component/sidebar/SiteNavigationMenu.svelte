<nav class="navbar-dark animate__animated animate__slideInLeft">
  <ul class="navbar-nav flex-column">
    <li class="nav-item p-2">
      <a
        class="nav-link"
        href="{base}/"
        class:active="{matching($page.url.pathname, base)}">
        <i class="fas fa-table-columns me-2"></i>
        {$_("components.site-navigation-menu.panel")}
      </a>
    </li>
    <li class="nav-item p-2">
      <a
        class="nav-link"
        href="{base}/statistics"
        class:active="{matching(
          $page.url.pathname,
          base + '/statistics',
          true,
        )}">
        <i class="fas fa-chart-simple me-2"></i>
        {$_("components.site-navigation-menu.statistics")}
      </a>
    </li>
    {#if hasPermission(Permissions.MANAGE_POSTS)}
      <li class="nav-item p-2">
        <a
          href="{base}/posts"
          class="nav-link"
          class:active="{matching($page.url.pathname, base + '/posts', true)}">
          <i class="fas fa-pen me-2"></i>
          {$_("components.site-navigation-menu.posts")}
        </a>
      </li>
    {/if}
    {#if hasPermission(Permissions.MANAGE_TICKETS)}
      <li class="nav-item p-2">
        <a
          class="nav-link"
          href="{base}/tickets"
          class:active="{matching(
            $page.url.pathname,
            base + '/tickets',
            true,
          )}">
          <i class="fas fa-ticket me-2"></i>
          {$_("components.site-navigation-menu.tickets")}
        </a>
      </li>
    {/if}

    {#if hasPermission(Permissions.MANAGE_PLAYERS)}
      <li class="nav-item p-2">
        <a
          class="nav-link"
          href="{base}/players"
          class:active="{matching(
            $page.url.pathname,
            base + '/players',
            true,
          )}">
          <i class="fas fa-users me-2"></i>
          {$_("components.site-navigation-menu.players")}
        </a>
      </li>
    {/if}

    {#if hasPermission(Permissions.MANAGE_VIEW)}
      <li class="nav-item p-2">
        <a
          class="nav-link"
          href="{base}/view"
          class:active="{matching($page.url.pathname, base + '/view', true)}">
          <i class="fas fa-palette me-2"></i>
          {$_("components.site-navigation-menu.view")}
        </a>
      </li>
    {/if}

    <li class="nav-item p-2">
      <a
        class="nav-link"
        href="{base}/translations"
        class:active="{matching(
          $page.url.pathname,
          base + '/translations',
          true,
        )}">
        <i class="fa-solid fa-language me-2"></i>
        {$_("components.site-navigation-menu.translations")}
      </a>
    </li>

    {#if hasPermission(Permissions.MANAGE_ADDONS)}
      <li class="nav-item p-2">
        <a
          class="nav-link"
          href="{base}/addons"
          class:active="{matching($page.url.pathname, base + '/addons', true)}">
          <i class="fas fa-puzzle-piece me-2"></i>
          {$_("components.site-navigation-menu.addons")}
        </a>
      </li>
    {/if}

    <li class="nav-item p-2">
      <a
        class="nav-link"
        href="{base}/logs"
        class:active="{matching($page.url.pathname, base + '/logs', true)}">
        <i class="fas fa-align-left me-2"></i>
        {$_("components.site-navigation-menu.logs")}
      </a>
    </li>

    {#if hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS)}
      <li class="nav-item p-2">
        <a
          class="nav-link"
          href="{base}/settings"
          class:active="{matching(
            $page.url.pathname,
            base + '/settings',
            true,
          )}">
          <i class="fas fa-cog me-2"></i>
          {$_("components.site-navigation-menu.settings")}
        </a>
      </li>
    {/if}
  </ul>
</nav>

<script>
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { page } from "$app/stores";

  import { hasPermission, Permissions } from "$lib/auth.util.js";

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + "/").toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
