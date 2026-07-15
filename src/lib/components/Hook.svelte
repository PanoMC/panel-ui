{#each hookList as module, i}
  {@const props = hookProps[i] || {}}
  {@const hasPerm =
    !filteredHooks[i]?.permission || hasPermission(filteredHooks[i]?.permission, $page.data.user)}
  {#if module && hasPerm && typeof module !== 'function'}
    {@const Component = module.default || module}
    {@const isInvisible = props.hookOptions?.invisible || filteredHooks[i]?.invisible}

    {#if !isInvisible}
      <!-- Svelte renders Component natively for both SSR and client, so the SSR
           markup is truly hydrated instead of being discarded and re-mounted (which
           made hook content pop in after page load). Unlike the theme's Hook, the
           Component renders INSIDE the container element: panel hooks are used as
           table cells (tag="th"/"td") whose components render bare content, so the
           container must BE the cell — a sibling render would put invalid children
           into <tr> and crash hydration. -->
      <svelte:element
        this={tag}
        class="hook-view-container {rest.class || ''}"
        style="{tag === 'div' ? 'display: contents;' : ''} {rest.style || ''}"
        hookName={name}>
        <Component hookName={name} {...props} {...rest} />
      </svelte:element>
    {/if}
  {/if}
{/each}

<script>
  import { panoApiClient } from '$lib/PluginAPI.js';
  import { page } from '$app/stores';
  import { hasPermission } from '$lib/auth.util.js';

  let { name, tag = 'div', ...rest } = $props();

  const hookStore = $derived(panoApiClient.ui.hook.get(name));

  // Deliberately UNfiltered: hookProps[i] from the load function is indexed over the
  // full registered list, so filtering here would misalign props with components.
  // Permission is checked per item in the template instead.
  const filteredHooks = $derived($hookStore || []);

  let resolvedHooks = $state([]);
  const hookList = $derived(
    resolvedHooks.length > 0
      ? resolvedHooks.map((h) => h.component || h)
      : filteredHooks.map((h) => h.component || h),
  );

  // Use passed hooks props if available
  const hookProps = $derived($page.data.hookProps?.[name] || []);

  $effect(() => {
    // Sync with store and resolve any functions if needed (client-only fallback for
    // hooks that were not resolved during the page load).
    const current = filteredHooks.map((h) => h.component || h);
    if (current.some((h) => typeof h === 'function' && !h.prototype)) {
      resolveHooks(current);
    } else {
      resolvedHooks = [];
    }
  });

  async function resolveHooks(list) {
    const resolved = await Promise.all(
      list.map(async (h) => {
        if (typeof h === 'function' && !h.prototype) {
          return await h();
        }
        return h;
      }),
    );
    resolvedHooks = resolved;
  }
</script>
