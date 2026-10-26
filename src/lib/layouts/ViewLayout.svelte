{#if $page.url.pathname === `${base}/view/store`}
  {@render children()}
{:else}
  <div class="container vstack gap-3" data-page-static>
    <PageActions>
      <div slot="left">
        {#if slots.left}
          {@render slots.left()}
        {:else}
          <PageNav>
            {#each $themeMenuItems as item}
              {#if !item.permission || hasPermission(item.permission)}
                <PageNavItem
                  href={item.href}
                  active={$page.url.pathname.startsWith(`${base}/view/detail`) &&
                  item.href === '/view'
                    ? true
                    : undefined}>{$_(item.text)}</PageNavItem>
              {/if}
            {/each}
          </PageNav>
        {/if}
      </div>

      <div slot="right" class="hstack gap-2" data-layout-actions="right">
        {#if slots.right}
          {@render slots.right()}
        {/if}
      </div>
    </PageActions>

    <PageSlot>
      {@render children()}
    </PageSlot>
  </div>
{/if}

<script context="module">
  import { redirect } from '@sveltejs/kit';
  import { getContext, setContext } from 'svelte';

  import { base } from '@panomc/sdk/core/js/basePath.js';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { requireWebsiteSection } from '$lib/navigation.util.js';

  const key = 'layout-slots';

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();

    requireWebsiteSection(parentData.usageMode);
    const { user } = parentData;

    if (!hasPermission(Permissions.MANAGE_VIEW, user)) {
      throw redirect(302, base);
    }

    return parentData;
  }

  // layout calls
  export function initSlots() {
    const slots = $state({});
    setContext(key, slots);
    return slots;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { page } from '@panomc/sdk/core/js/appStores.js';
  import { beforeNavigate } from '$app/navigation';

  import PageActions from '$lib/components/PageActions.svelte';
  import PageSlot from '$lib/components/PageSlot.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  import { themeMenuItems } from '$lib/PluginAPI.js';

  const { children } = $props();
  const slots = initSlots();

  beforeNavigate(({ from, to }) => {
    if (from?.route.id !== to?.route.id) {
      Object.assign(slots, { right: null, left: null });
    }
  });
</script>
