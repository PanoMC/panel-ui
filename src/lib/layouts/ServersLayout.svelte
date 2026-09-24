<slot />

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { requireServerSection } from '$lib/navigation.util.js';

  /**
   * Gate for the whole servers workspace (`/servers` and everything under it). Ported from the
   * old `ServerLayout`, minus the "a server must be selected" rule: every server page now names
   * its server in the URL, so there is nothing to select before getting here.
   *
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
    const { user, usageMode } = parentData;

    // Server management is switched off entirely in a WEBSITE install: 404, like its endpoints.
    requireServerSection(usageMode);

    if (!hasPermission(Permissions.MANAGE_SERVERS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>
