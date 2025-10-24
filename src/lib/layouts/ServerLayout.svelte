<slot />

<script context="module">
  import { redirect } from "@sveltejs/kit";
  import { hasPermission, Permissions } from "$lib/auth.util.js";

  import { base } from "$app/paths";

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
    const { user, selectedServer } = parentData;

    if (!hasPermission(Permissions.MANAGE_SERVERS, user)) {
      throw redirect(302, base);
    }

    if (!selectedServer) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>
