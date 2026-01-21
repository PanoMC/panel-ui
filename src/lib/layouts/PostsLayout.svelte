<div class="container vstack gap-3">
  <PageActions leftClasses="col-lg-8" middleClasses="d-none">
    <div slot="left">
      {#if slots.left}
        {@render slots.left()}
      {:else if !data.categoryUrl}
        <CardMenu>
          {#each $postMenuItems as item}
            {#if !item.permission || hasPermission(item.permission)}
              <CardMenuItem href={item.href} startsWith={item.startsWith}>{$_(item.text)}</CardMenuItem>
            {/if}
          {/each}
        </CardMenu>
      {/if}
    </div>

    <div slot="right" class="hstack gap-2" data-layout-actions="right">
      {#if slots.right}
        {@render slots.right()}
      {/if}
      <Hook name="panel:posts:layout:actions:right" />
    </div>
  </PageActions>

  {@render children()}
</div>

<ConfirmDeletePostModal />
<ConfirmDraftPostModal />
<ConfirmPublishPostModal />

<script module>
  import { redirect } from '@sveltejs/kit';
  import { getContext, setContext } from 'svelte';
  import { base } from '$app/paths';
  import { hasPermission, Permissions } from '$lib/auth.util.js';

  const key = 'layout-slots';

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load({ parent }) {
    const parentData = await parent();
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
  import { beforeNavigate } from "$app/navigation";
  import PageActions from '$lib/component/PageActions.svelte';
  import CardMenu from '$lib/component/CardMenu.svelte';
  import CardMenuItem from '$lib/component/CardMenuItem.svelte';
  import ConfirmDeletePostModal from '$lib/component/modals/ConfirmDeletePostModal.svelte';
  import ConfirmDraftPostModal from '$lib/component/modals/ConfirmDraftPostModal.svelte';
  import ConfirmPublishPostModal from '$lib/component/modals/ConfirmPublishPostModal.svelte';
  import Hook from '$lib/component/Hook.svelte';

  import { postMenuItems } from "$lib/PluginAPI.js"

  const { data, children } = $props();
  const slots = initSlots();

  beforeNavigate(({ from, to }) => {
    if (from?.route.id !== to?.route.id) {
      Object.assign(slots, { right: null, left: null });
    }
  });
</script>
