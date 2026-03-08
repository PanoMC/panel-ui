<!-- Settings Contents -->
<div class="container vstack gap-3">
  <PageActions>
    <div slot="left">
      <PageNav>
        <PageNavItem href="/settings">{$_('components.settings-layout.website')}</PageNavItem>
        <PageNavItem href="/settings/platform" startsWith
          >{$_('components.settings-layout.platform')}</PageNavItem>
        <PageNavItem href="/settings/migration">{$_('components.settings-layout.migration')}</PageNavItem>
        <PageNavItem href="/settings/updates" classes="position-relative" startsWith
          >{$_('components.settings-layout.updates')}
          {#if data.session.basicData.hasUpdate}
            <span
              class="position-absolute bg-warning rounded-circle p-1"
              style="top: 7px; right: 6px;">
            </span>
          {/if}
        </PageNavItem>
        <PageNavItem href="/settings/about" startsWith
          >{$_('components.settings-layout.about')}</PageNavItem>
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
