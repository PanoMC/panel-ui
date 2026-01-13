<div class="container vstack gap-3">
  <PageActions leftClasses="d-lg-flex d-none">
    <CardMenu slot="middle">
      {#each themeMenuItems as item}
        <CardMenuItem href={item.href}>{$_(item.text)}</CardMenuItem>
      {/each}
    </CardMenu>

    <div slot="right" class="hstack gap-2" data-layout-actions="right">
      {#if slots.right}
        {@render slots.right()}
      {/if}
    </div>
  </PageActions>

  {@render children()}
</div>

<script context="module">
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
  import {_} from "svelte-i18n";

  import { beforeNavigate } from "$app/navigation";

  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";

  import { themeMenuItems } from "$lib/PluginAPI.js"

  const { children } = $props();
  const slots = initSlots();

  beforeNavigate(() =>{
    Object.assign(slots, {right: null})
  })
</script>
