<div class="container vstack gap-3" data-page-static>
  <PageActions>
    <div slot="left">
      {#if slots.left}
        {@render slots.left()}
      {:else if !data.categoryUrl}
        <PageNav>
          {#each $postMenuItems as item}
            {#if !item.permission || hasPermission(item.permission)}
              <PageNavItem href={item.href} startsWith={item.startsWith}
                >{$_(item.text)}</PageNavItem>
            {/if}
          {/each}
        </PageNav>
      {/if}
    </div>

    <div slot="right" class="hstack gap-2" data-layout-actions="right">
      {#if slots.right}
        {@render slots.right()}
      {/if}
      <Hook name="panel:posts:layout:actions:right" />
    </div>
  </PageActions>

  <PageSlot>
    {@render children()}
  </PageSlot>
</div>

<ConfirmDeletePostModal />
<ConfirmDraftPostModal />
<ConfirmPublishPostModal />

<script module>
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

    if (!hasPermission(Permissions.MANAGE_POSTS, user)) {
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
  import { onNavigate } from '$app/navigation';
  import PageActions from '$lib/components/PageActions.svelte';
  import PageSlot from '$lib/components/PageSlot.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
  import ConfirmDeletePostModal from '$lib/components/modals/ConfirmDeletePostModal.svelte';
  import ConfirmDraftPostModal from '$lib/components/modals/ConfirmDraftPostModal.svelte';
  import ConfirmPublishPostModal from '$lib/components/modals/ConfirmPublishPostModal.svelte';
  import Hook from '$lib/components/Hook.svelte';

  import { postMenuItems } from '$lib/PluginAPI.js';

  const { data, children } = $props();
  const slots = initSlots();

  // `onNavigate`, not `beforeNavigate`: a page may still cancel the navigation (the post editor
  // asks first when changes are not autosaved yet), and its actions must stay then.
  onNavigate(({ from, to }) => {
    if (from?.route.id !== to?.route.id) {
      Object.assign(slots, { right: null, left: null });
    }
  });
</script>
