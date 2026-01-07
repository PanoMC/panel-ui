{#if !data.layout}
  <slot />
{:else}
  <div bind:this={layoutContainer} class="plugin-layout-container"></div>
  <div
    bind:this={slotContentContainer}
    class="plugin-content-wrapper"
    style="display: none;">
    <slot />
  </div>
{/if}

<script context="module">
  import { getContext } from "svelte";
  import { error } from "@sveltejs/kit";

  import { registeredPages } from "$lib/PluginManager.js";
  import { base } from "$app/paths";

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

    const registeredPage = registeredPages[removePrefix(pathname, base)];

    if (registeredPage === undefined) {
      throw error(404);
    }

    resetLayout.set(registeredPage.resetLayout || false);

    let layout = null;
    if (registeredPage.layout) {
      // Check if layout is a function (async import) or object
      const layoutModule =
        typeof registeredPage.layout === "function"
          ? await registeredPage.layout()
          : registeredPage.layout;
      layout = layoutModule;
    }

    return { registeredPage, layout };
  }
</script>

<script>
  import { onMount, onDestroy, mount, unmount } from "svelte";
  import { browser } from "$app/environment";

  export let data;

  let layoutContainer;
  let layoutInstance;
  let slotContentContainer;

  // Reactively update layout if data changes?
  // For now, onMount is sufficient as layouts usually don't change without nav.

  // We need to access the snippet defined in template.
  // Svelte 5 logic: snippets are not easily accessible in script unless passed as prop.
  // BUT we can use a trick or just define function if possible.
  // Actually, we can't reference 'pageContent' in the script if it's in the template easily in Svelte 5 unless standard props.

  // WAIT: Svelte 5 snippets are scoped to template.
  // To use it in mount(), we might need a workaround.
  // Or we can just let standard <slot> work?
  // No, we are manually mounting.

  // WORKAROUND:
  // Since we are inside the component script, we can't access template snippets cleanly to pass to mount()
  // if 'mount' is called inside script.

  // However, we can use the 'createRawSnippet' or similar if needed, or simply render the slot into a container
  // and pass that container? No.

  // Let's rely on the fact that if data.layout is false, we render slot.
  // If data.layout is true, we want to mount Layout and pass Slot.

  // If I cannot pass snippet to manual mount easily:
  // Maybe I should assume the Layout component does NOT wrap, or it has a named slot 'content'?

  // Let's try to define the snippet programmatically? No.

  // ALTERNATIVE:
  // We can't solve the "Slot inside Manually Mounted Bundled Component" problem easily with snippets
  // because of the runtime mismatch.
  // If we pass a Host Snippet to Plugin Component, Plugin Component (Svelte Bundle) attempts to render it.
  // It calls `snippet(anchor)`. The snippet executes Host Svelte code (e.g. `append(...)`).
  // Host Svelte code tries to append to Plugin Svelte's DOM.
  // It MIGHT work if they share standard DOM APIs.

  // But how to get reference to 'pageContent' snippet in script?
  // We can't.

  // Revised Plan specific for Svelte 5:
  // We can use a bindable prop? No.

  // Let's keep it simple:
  // We won't pass the slot. We will assume the layout displays 'next' to the content or
  // we use a specific target container logic if the plugin supports it.

  // But if the user wants "Layout that wraps", we are stuck without advanced bridge.

  // Let's implement the mount logic WITHOUT children first.
  // If the user complains "Layout empty", then we know.
  // BUT the user said "Gözükecek" (It will be visible).

  // I will just mount it.

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
            props: {},
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
            "[data-pano-content], main, .content, .page-content, article",
          );

          if (anchor && slotContentContainer) {
            anchor.appendChild(slotContentContainer);
            slotContentContainer.style.display = "";
          } else if (slotContentContainer) {
            // Fallback: If layout has a single root element (wrapper), try appending there?
            // Or just append to container (Default behavior)

            // Experimental: Try to append to the first root element if exists
            if (layoutContainer.firstElementChild) {
              layoutContainer.firstElementChild.appendChild(
                slotContentContainer,
              );
            } else {
              // Empty layout? Just show.
            }
            slotContentContainer.style.display = "";
          }
        }, 0);
      } catch (e) {
        console.error("Failed to mount layout", e);
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
