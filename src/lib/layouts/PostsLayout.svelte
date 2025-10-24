<slot />

<ConfirmDeletePostModal />
<ConfirmDraftPostModal />
<ConfirmPublishPostModal />

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

    if (!hasPermission(Permissions.MANAGE_POSTS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import ConfirmDeletePostModal from "$lib/component/modals/ConfirmDeletePostModal.svelte";
  import ConfirmDraftPostModal from "$lib/component/modals/ConfirmDraftPostModal.svelte";
  import ConfirmPublishPostModal from "$lib/component/modals/ConfirmPublishPostModal.svelte";
</script>
