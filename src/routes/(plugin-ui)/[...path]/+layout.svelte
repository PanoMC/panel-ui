{#if !data.layout}
  <slot />
{:else}
  <div bind:this={layoutContainer} class="plugin-layout-container"></div>
  <div bind:this={slotContentContainer} class="plugin-content-wrapper" style="display: none;">
    <slot />
  </div>
{/if}

<script context="module">
  import { getContext } from 'svelte';
  import { error } from '@sveltejs/kit';

  import { registeredPages, findMatch } from '$lib/PluginManager.js';
  import { base } from '$app/paths';

  function removePrefix(str, prefix) {
    return str.startsWith(prefix) ? str.slice(prefix.length) : str;
  }

  /**
   * @type {import("@sveltejs/kit").PageLoad}
   */
  export async function load(event) {
    const {
      url: { pathname },
      parent,
    } = event;
    const { resetLayout } = await parent();

    const registeredPage = findMatch(registeredPages, removePrefix(pathname, base));

    if (registeredPage === undefined || registeredPage === null) {
      throw error(404);
    }

    resetLayout.set(registeredPage.resetLayout || false);

    let layoutOutput = {};
    let layout = null;
    if (registeredPage.layout) {
      // Check if layout is a function (async import) or object
      const layoutModule =
        typeof registeredPage.layout === 'function'
          ? await registeredPage.layout()
          : registeredPage.layout;
      layout = layoutModule;

      if (layout.load !== undefined) {
        layoutOutput = await layout.load(event);
      }
    }

    return { registeredPage, layout, props: layoutOutput, params: registeredPage.params };
  }
</script>

<script>
  import { onMount, onDestroy, mount, unmount } from 'svelte';
  import { browser } from '$app/environment';

  export let data;

  let layoutContainer;
  let layoutInstance;
  let slotContentContainer;

  onMount(() => {
    if (browser && layoutContainer && data.layout) {
      const layoutComp = data.layout.default || data.layout;

      try {
        // Check for bridge
        if (data.layout.mount) {
          layoutInstance = data.layout.mount({
            target: layoutContainer,
            props: data.props || {},
          });
        } else {
          layoutInstance = mount(layoutComp, {
            target: layoutContainer,
            props: data.props || {},
          });
        }

        // SLOT BRIDGE: Smart Injection
        setTimeout(() => {
          // Heuristics:
          // 1. Explicit anchor: [data-pano-content]
          // 2. Semantic Main: main
          // 3. Common class: .content / .page-content
          // 4. Semantic Article: article
          const anchor = layoutContainer.querySelector(
            '[data-pano-content], main, .content, .page-content, article',
          );

          if (anchor && slotContentContainer) {
            anchor.appendChild(slotContentContainer);
            slotContentContainer.style.display = '';
          } else if (slotContentContainer) {
            // Fallback: If layout has a single root element (wrapper), try appending there?
            // Or just append to container (Default behavior)

            // Experimental: Try to append to the first root element if exists
            if (layoutContainer.firstElementChild) {
              layoutContainer.firstElementChild.appendChild(slotContentContainer);
            } else {
              // Empty layout? Just show.
            }
            slotContentContainer.style.display = '';
          }
        }, 0);
      } catch (e) {
        console.error('Failed to mount layout', e);
      }
    }
  });

  onDestroy(() => {
    if (layoutInstance) {
      try {
        if (data.layout?.unmount) data.layout.unmount(layoutInstance);
        else unmount(layoutInstance);
      } catch (e) {}
    }
    // Note: Svelte might error specifically if we reparented the slot container and then destroyed it.
    // However, usually it just removes the nodes.
  });
</script>
