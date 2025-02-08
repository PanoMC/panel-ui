<slot />

<EditPlayerModal />
<AuthorizePlayerModal />
<ConfirmBanPlayerModal />
<ConfirmDeletePlayerModal />
<UnbanPlayerModal />

<script context="module">
  import { redirect } from "@sveltejs/kit";

  import { hasPermission, Permissions } from "$lib/auth.util.js";

  /** @type {import('./$types').LayoutLoad} */
  export async function load({ parent, url: { pathname } }) {
    const parentData = await parent();
    const { user } = parentData;

    if (pathname.startsWith("/players/detail/")) {
      return parentData;
    }

    if (!hasPermission(Permissions.MANAGE_PLAYERS, user)) {
      throw redirect(302, "/");
    }

    return parentData;
  }
</script>

<script>
  import EditPlayerModal from "$lib/component/modals/EditPlayerModal.svelte";
  import AuthorizePlayerModal from "$lib/component/modals/AuthorizePlayerModal.svelte";
  import ConfirmBanPlayerModal from "$lib/component/modals/ConfirmBanPlayerModal.svelte";
  import UnbanPlayerModal from "$lib/component/modals/UnbanPlayerModal.svelte";
  import ConfirmDeletePlayerModal from "$lib/component/modals/ConfirmDeletePlayerModal.svelte";
</script>
