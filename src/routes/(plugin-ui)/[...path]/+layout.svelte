{#if data.systemLayout}
  <svelte:component this={data.systemLayout} {data}>
    {#if !data.layout}
      <slot />
    {:else}
      {#key data}
        <div use:mountLayout class="plugin-layout-container"></div>
      {/key}
      <div bind:this={slotContentContainer} class="plugin-content-wrapper" style="display: none;">
        <slot />
      </div>
    {/if}
  </svelte:component>
{:else}
  {#if !data.layout}
    <slot />
  {:else}
    {#key data}
      <div use:mountLayout class="plugin-layout-container"></div>
    {/key}
    <div bind:this={slotContentContainer} class="plugin-content-wrapper" style="display: none;">
      <slot />
    </div>
  {/if}
{/if}

<script context="module">
  import { error } from '@sveltejs/kit';

  import { registeredPages, findMatch } from '$lib/PluginManager.js';
  import { base } from '$app/paths';
  import { hasPermission } from "$lib/auth.util.js";

  const layouts = import.meta.glob('$lib/layouts/*.svelte', { eager: true });

  const layoutMap = Object.keys(layouts).reduce((acc, path) => {
    const name = path.split('/').pop().replace('.svelte', '');
    acc[name] = layouts[path];
    return acc;
  }, {});

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
    const { resetLayout, user } = await parent();

    const registeredPage = findMatch(registeredPages, removePrefix(pathname, base));

    if (registeredPage === undefined || registeredPage === null) {
      throw error(404);
    }

    if (registeredPage.permission && !hasPermission(registeredPage.permission, user)) {
      throw error(404);
    }

    resetLayout.set(registeredPage.resetLayout || false);

    let systemLayout = null;
    let systemLayoutOutput = {};
    if (registeredPage.systemLayout) {
      const systemLayoutModule = layoutMap[registeredPage.systemLayout];
      if (systemLayoutModule) {
        systemLayout = systemLayoutModule.default;
        if (typeof systemLayoutModule.load === 'function') {
          systemLayoutOutput = await systemLayoutModule.load(event);
        }
      }
    }

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

    return {
      registeredPage,
      layout,
      systemLayout,
      props: layoutOutput,
      params: registeredPage.params,
      ...systemLayoutOutput
    };
  }
</script>

<script>
  import { mount, unmount, getAllContexts } from 'svelte';
  import { browser } from '$app/environment';

  export let data;

  const contexts = getAllContexts();

  let slotContentContainer;

  function mountLayout(layoutContainer) {
    if (!browser || !layoutContainer || !data.layout) return;

    const layoutComp = data.layout.default || data.layout;
    let layoutInstance;

    try {
      // Check for bridge
      if (data.layout.mount) {
        layoutInstance = data.layout.mount({
          target: layoutContainer,
          props: { ...(data.props || {}), panoContexts: contexts },
          context: contexts
        });
      } else {
        layoutInstance = mount(layoutComp, {
          target: layoutContainer,
          props: { ...(data.props || {}), panoContexts: contexts },
          context: contexts
        });
      }

      // SLOT BRIDGE: Smart Injection
      setTimeout(() => {
        const anchor = layoutContainer.querySelector(
          '[data-pano-content], main, .content, .page-content, article',
        );

        if (anchor && slotContentContainer) {
          anchor.appendChild(slotContentContainer);
          slotContentContainer.style.display = '';
        } else if (slotContentContainer) {
          if (layoutContainer.firstElementChild) {
            layoutContainer.firstElementChild.appendChild(slotContentContainer);
          }
          slotContentContainer.style.display = '';
        }
      }, 0);
    } catch (e) {
      console.error('Failed to mount layout', e);
    }

    return {
      destroy() {
        if (layoutInstance) {
          try {
            if (data.layout?.unmount) data.layout.unmount(layoutInstance);
            else unmount(layoutInstance);
          } catch (e) {}
        }
      }
    };
  }
</script>
