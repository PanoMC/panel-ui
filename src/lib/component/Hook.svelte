{#each hookList as module, i}
  {@const props = hookProps[i] || {}}
  {#if module && (module.default || !isFunction(module))}
    {#key name + i + (rest.post?.id || rest.id || '')}
      {@const Component = module.default || module}

      {#if !browser}
        <!-- Server Side SSR -->
        <svelte:element this={tag} hookName={name} {...props} {...rest}>
          {#if Component}
            <Component hookName={name} {...props} {...rest} />
          {/if}
        </svelte:element>
      {:else if !props.hookOptions?.invisible}
        <!-- Client Side: Manual Mount -->
        <svelte:element
          this={tag}
          use:mountPlugin={{ module, props, rest }}
          class="hook-view-container {rest.class || ''}"
          style="{tag === 'div' ? 'display: contents;' : ''} {rest.style || ''}">
        </svelte:element>
      {/if}
    {/key}
  {/if}
{/each}

<script>
  import { panoApiClient } from '$lib/PluginAPI.js';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { mount, unmount, getAllContexts, untrack } from 'svelte';
  import { hasPermission } from '$lib/auth.util.js';

  let { name, tag = 'div', ...rest } = $props();

  const hookStore = $derived(panoApiClient.ui.hook.get(name));

  const filteredHooks = $derived(
    ($hookStore || []).filter((h) => !h.permission || hasPermission(h.permission, $page.data.user)),
  );

  let resolvedHooks = $state([]);
  const hookList = $derived(
    resolvedHooks.length > 0 ? resolvedHooks : filteredHooks.map((h) => h.component || h),
  );

  const contexts = getAllContexts();

  // Use passed hooks props if available
  const hookProps = $derived($page.data.hookProps?.[name] || []);

  function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  }

  $effect(() => {
    // Sync with store and resolve any functions if needed (Client only)
    const current = filteredHooks.map((h) => h.component || h);
    if (browser && current.some((h) => typeof h === 'function' && !h.prototype)) {
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

  function mountPlugin(viewContainer, params) {
    let { module, props: currentProps, rest: currentRest } = params;
    const Component = module.default || module;
    if (!browser || !viewContainer || !Component) return;

    // Use a reactive $state object for props to maintain Svelte 5 reactivity
    let componentProps = $state({
      hookName: name,
      ...currentProps,
      ...currentRest,
    });
    let componentInstance;

    try {
      if (module.mount) {
        componentInstance = module.mount({
          target: viewContainer,
          props: componentProps,
          context: contexts,
        });
      } else {
        componentInstance = mount(Component, {
          target: viewContainer,
          props: componentProps,
          context: contexts,
        });
      }
    } catch (err) {
      console.warn('[Hook] Mount failed completely:', err);
    }

    return {
      update(newParams) {
        // Surgical update: Only update changed properties to avoid infinite loops
        const nextCombined = {
          ...newParams.props,
          ...newParams.rest,
          hookName: name,
        };

        untrack(() => {
          for (const key in nextCombined) {
            if (componentProps[key] !== nextCombined[key]) {
              componentProps[key] = nextCombined[key];
            }
          }
          // Support for legacy components that might not see $state changes
          if (componentInstance && componentInstance.$set) {
            componentInstance.$set(nextCombined);
          }
        });
      },
      destroy() {
        if (componentInstance) {
          try {
            if (module.unmount) {
              module.unmount(componentInstance);
            } else {
              unmount(componentInstance);
            }
          } catch (e) {}
        }
      },
    };
  }
</script>
