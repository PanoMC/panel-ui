<!-- Settings Contents -->
<div class="container vstack gap-3">
  <div class="row justify-content-around">
    <div class="col-auto">
      <!-- Settings Nav -->
      <div class="nav nav-pills d-flex flex-row justify-content-center">
        <a
          class="nav-item nav-link"
          href="{base}/settings"
          class:active="{matching($page.url.pathname, base + '/settings')}">
          {$_("components.settings-layout.website")}
        </a>
        <a
          class="nav-item nav-link"
          href="{base}/settings/platform"
          class:active="{matching(
            $page.url.pathname,
            base + '/settings/platform',
            true,
          )}">
          {$_("components.settings-layout.platform")}
        </a>
        <a
          class="nav-item nav-link position-relative"
          href="{base}/settings/updates"
          class:active="{matching(
            $page.url.pathname,
            base + '/settings/updates',
            true,
          )}">
          {$_("components.settings-layout.updates")}
          <span
            class="position-absolute top-0 start-100 translate-middle p-2 bg-danger rounded-circle">
          </span>
        </a>
        <a
          class="nav-item nav-link"
          href="{base}/settings/about"
          class:active="{matching(
            $page.url.pathname,
            base + '/settings/about',
            true,
          )}">
          {$_("components.settings-layout.about")}
        </a>
      </div>
    </div>
  </div>

  <slot />
</div>

<script context="module">
  import { redirect } from "@sveltejs/kit";
  import { hasPermission, Permissions } from "$lib/auth.util.js";

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
    const { user } = parentData;

    if (!hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS, user)) {
      throw redirect(302, "/");
    }

    return parentData;
  }
</script>

<script>
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { page } from "$app/stores";

  function matching(path, pathName, startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + "/").toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
