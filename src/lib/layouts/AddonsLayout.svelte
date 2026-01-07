<slot />

<ConfirmDisableAddonWillCauseMoreDisableModal />
<ConfirmEnablingAddonWillCauseMoreEnableModal />

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';

  import ConfirmDisableAddonWillCauseMoreDisableModal from '$lib/component/modals/ConfirmDisableAddonWillCauseMoreDisableModal.svelte';
  import ConfirmEnablingAddonWillCauseMoreEnableModal from '$lib/component/modals/ConfirmEnablingAddonWillCauseMoreEnableModal.svelte';

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
    const { user } = parentData;

    if (!hasPermission(Permissions.MANAGE_ADDONS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>
