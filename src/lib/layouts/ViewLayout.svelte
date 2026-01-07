<div class="container vstack gap-3">
  <slot />
</div>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
    const { user } = parentData;

    if (!hasPermission(Permissions.MANAGE_VIEW, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>
