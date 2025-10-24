<slot />

<ConfirmCloseTicketModal />
<ConfirmDeleteTicketModal />

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

    if (!hasPermission(Permissions.MANAGE_TICKETS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import ConfirmCloseTicketModal from "$lib/component/modals/ConfirmCloseTicketModal.svelte";
  import ConfirmDeleteTicketModal from "$lib/component/modals/ConfirmDeleteTicketModal.svelte";
</script>
