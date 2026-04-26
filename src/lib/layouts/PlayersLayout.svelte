<slot />

<EditPlayerModal />
<ConfirmBanPlayerModal />
<ConfirmBanIpModal />
<SearchPlayerModal />
<ConfirmDeletePlayerModal />
<UnbanPlayerModal />
<UnbanIpModal />
<ConfirmSendVerificationEmailModal />

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';

  /** @type {import('./$types').LayoutLoad} */
  export async function load({ parent, url: { pathname } }) {
    const parentData = await parent();
    const { user } = parentData;

    if (pathname.startsWith('/players/detail/')) {
      return parentData;
    }

    if (!hasPermission(Permissions.MANAGE_PLAYERS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import EditPlayerModal from '$lib/components/modals/EditPlayerModal.svelte';
  import SearchPlayerModal from '$lib/components/modals/SearchPlayerModal.svelte';
  import ConfirmBanPlayerModal from '$lib/components/modals/ConfirmBanPlayerModal.svelte';
  import ConfirmBanIpModal from '$lib/components/modals/ConfirmBanIpModal.svelte';
  import UnbanPlayerModal from '$lib/components/modals/UnbanPlayerModal.svelte';
  import UnbanIpModal from '$lib/components/modals/UnbanIpModal.svelte';
  import ConfirmDeletePlayerModal from '$lib/components/modals/ConfirmDeletePlayerModal.svelte';
  import ConfirmSendVerificationEmailModal from '$lib/components/modals/ConfirmSendVerificationEmailModal.svelte';
</script>
