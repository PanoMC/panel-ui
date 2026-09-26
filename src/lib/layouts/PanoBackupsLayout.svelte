<!-- Pano backups sub-pages: backups, Pano Backup settings, transfer to Pano Host. -->
<div class="vstack gap-3">
  <PageNav>
    <PageNavItem href="/settings/backups">{$_('pages.settings.backups.nav-backups')}</PageNavItem>
    <PageNavItem href="/settings/backups/pano-backup" startsWith>
      {$_('pages.settings.backups.nav-pano-backup')}
    </PageNavItem>
    <PageNavItem href="/settings/backups/transfer" startsWith>
      {$_('pages.settings.backups.nav-transfer')}
    </PageNavItem>
  </PageNav>
  {@render children?.()}
</div>

<script module>
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();

    if (!hasPermission(Permissions.MANAGE_PANO_BACKUPS, parentData.user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  let { children } = $props();
</script>
