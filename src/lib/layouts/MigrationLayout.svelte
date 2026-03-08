<!-- Migration Contents -->
<div class="container vstack gap-3">
  <PageActions>
    <div slot="left">
      <PageNav>
        <PageNavItem href="/migration">{$_('pages.migration.platforms-title')}</PageNavItem>
        <PageNavItem href="/migration/plugins" startsWith
          >{$_('pages.migration.plugins-title')}</PageNavItem>
      </PageNav>
    </div>
  </PageActions>
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

    if (!hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  export let data;
</script>
