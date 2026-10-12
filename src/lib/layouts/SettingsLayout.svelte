<!-- Settings Contents -->
<div class="container vstack gap-3" data-page-static>
  <PageActions>
    <div slot="left">
      <PageNav>
        {#if canManageSettings}
          <PageNavItem href="/settings">{$_('components.settings-layout.website')}</PageNavItem>
          <PageNavItem href="/settings/platform" startsWith
            >{$_('components.settings-layout.platform')}</PageNavItem>
          <PageNavItem href={WEBHOOKS_SETTINGS_ITEM.href} startsWith
            >{$_(WEBHOOKS_SETTINGS_ITEM.text)}</PageNavItem>
          <PageNavItem href="/settings/updates" startsWith>
            <span class="position-relative d-inline-block">
              {$_('components.settings-layout.updates')}
              <NavBadge count={updateCount} label={$_('components.settings-layout.updates')} />
            </span>
          </PageNavItem>
          <PageNavItem href="/settings/about" startsWith
            >{$_('components.settings-layout.about')}</PageNavItem>
        {/if}
      </PageNav>
    </div>
  </PageActions>
  <PageSlot>
    <slot />
  </PageSlot>
</div>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent, url }) {
    const parentData = await parent();
    const { user } = parentData;

    // The old /settings/backups addresses only redirect to /backups, which checks its own
    // permission (MANAGE_PANO_BACKUPS); an admin without platform settings still gets there.
    const backupsPage =
      url.pathname === `${base}/settings/backups` ||
      url.pathname.startsWith(`${base}/settings/backups/`);

    if (!backupsPage && !hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { WEBHOOKS_SETTINGS_ITEM } from '$lib/navigation.util.js';
  import NavBadge from '$lib/components/NavBadge.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import PageSlot from '$lib/components/PageSlot.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  export let data;

  $: canManageSettings = hasPermission(Permissions.MANAGE_PLATFORM_SETTINGS, data.user);
  // The platform only tells whether an update is waiting, not how many.
  $: updateCount = data.session.basicData.hasUpdate ? 1 : 0;
</script>
