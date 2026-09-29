<!-- Server Settings Contents — no container of its own: `ServerDetailLayout` owns the one this
     sits in, so the settings nav and the page below it are spaced by the same `vstack gap-3`. -->
<PageActions>
  <div slot="left">
    <PageNav>
      <PageNavItem href="/servers/{$server.id}/settings">
        {$_('components.server-settings-layout.server')}
      </PageNavItem>
      {#if isManaged($server) && hasPermission(Permissions.MANAGE_SERVER_STARTUP)}
        <PageNavItem href="/servers/{$server.id}/settings/startup" startsWith>
          {$_('components.server-settings-layout.startup')}
        </PageNavItem>
        <PageNavItem href="/servers/{$server.id}/settings/properties" startsWith>
          {$_('components.server-settings-layout.properties')}
        </PageNavItem>
      {/if}
      <PageNavItem href="/servers/{$server.id}/settings/game-integration" startsWith>
        {$_('components.server-settings-layout.game-integration')}
      </PageNavItem>
    </PageNav>
  </div>
</PageActions>

<slot />

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { isManaged } from '$lib/servers.util.js';

  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  /** Published by `ServerDetailLayout`; the tabs are scoped to the server in the URL. */
  const server = getContext('server');
</script>
