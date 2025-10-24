<!-- Settings Contents -->
<div class="container vstack gap-3">
  <PageActions leftClasses={null} middleClasses="col-lg-12" rightClasses={null}>
    <PageNav slot="middle">
      <PageNavItem href="/settings"
        >{$_("components.settings-layout.website")}</PageNavItem>
      <PageNavItem href="/settings/platform" startsWith
        >{$_("components.settings-layout.platform")}</PageNavItem>
      <PageNavItem
        href="/settings/updates"
        classes="position-relative"
        startsWith
        >{$_("components.settings-layout.updates")}
        {#if data.session.basicData.hasUpdate}
          <span
            class="position-absolute bg-warning rounded-circle"
            style="top: 8px; right: 8px; padding:4px;">
          </span>
        {/if}
      </PageNavItem>
      <PageNavItem href="/settings/about" startsWith
        >{$_("components.settings-layout.about")}</PageNavItem>
    </PageNav>
  </PageActions>
  <slot />
</div>

<script context="module">
  import { redirect } from "@sveltejs/kit";

  import { base } from "$app/paths";

  import { hasPermission, Permissions } from "$lib/auth.util.js";

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
    const { user } = parentData;

    if (!hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import { _ } from "svelte-i18n";

  import PageActions from "$lib/component/PageActions.svelte";
  import PageNav from "$lib/component/PageNav.svelte";
  import PageNavItem from "$lib/component/PageNavItem.svelte";

  export let data;
</script>
