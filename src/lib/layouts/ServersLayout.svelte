<slot />

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { canAccessServers } from '$lib/auth.util.js';
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

    // R3 — any server permission opens the workspace, not only the MANAGE_SERVERS umbrella: a
    // user who holds just one server's console must reach `/servers/<id>/console`. What they may
    // see inside is decided per page and, for the server itself, by the backend.
    if (!canAccessServers(user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>
