<style>
  .plugin-layout-container {
    width: 100%;
    height: 100%;
  }
</style>

{#if data.systemLayout}
  <svelte:component this={data.systemLayout} {data}>
    <div
      bind:this={layoutContainer}
      class="plugin-layout-container"
      style={data.layout ? '' : 'display: none;'}>
    </div>

    {#key data}
      <div
        bind:this={slotContentContainer}
        class="plugin-content-wrapper"
        style={data.layout ? 'display: none;' : ''}>
        <slot />
      </div>
    {/key}
  </svelte:component>
{:else}
  <div
    bind:this={layoutContainer}
    class="plugin-layout-container"
    style={data.layout ? '' : 'display: none;'}>
  </div>

  {#key data}
    <div
      bind:this={slotContentContainer}
      class="plugin-content-wrapper"
      style={data.layout ? 'display: none;' : ''}>
      <slot />
    </div>
  {/key}
{/if}

<script context="module">
  import { error } from '@sveltejs/kit';
  import { registeredPages, findMatch } from '$lib/PluginManager.js';
  import { base } from '$app/paths';
  import { hasPermission } from '$lib/auth.util.js';

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
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      url: { pathname },
      parent,
    } = event;
    const { resetLayout, user } = await parent();

    const registeredPage = findMatch(registeredPages, removePrefix(pathname, base));

    if (!registeredPage) throw error(404);
    if (registeredPage.permission && !hasPermission(registeredPage.permission, user))
      throw error(404);

    resetLayout.set(registeredPage.resetLayout || false);

    let systemLayout = null;
    let systemLayoutOutput = {};
    if (registeredPage.systemLayout) {
      const module = layoutMap[registeredPage.systemLayout];
      if (module) {
        systemLayout = module.default;
        if (typeof module.load === 'function') systemLayoutOutput = await module.load(event);
      }
    }

    let layout = null;
    let layoutOutput = {};
    if (registeredPage.layout) {
      layout =
        typeof registeredPage.layout === 'function'
          ? await registeredPage.layout()
          : registeredPage.layout;
      if (layout.load) layoutOutput = await layout.load(event);
    }

    return {
      registeredPage,
      layout,
      systemLayout,
      props: layoutOutput,
      params: registeredPage.params,
      ...systemLayoutOutput,
    };
  }
</script>

<script>
  import { mount, unmount, getAllContexts } from 'svelte';
  import { browser } from '$app/environment';

  let { data } = $props();
  const contexts = getAllContexts();

  let layoutContainer;
  let slotContentContainer;
  let layoutInstance = null;
  let activeLayoutComp = null;

  function cleanupLayout() {
    if (layoutInstance) {
      try {
        // Use the snapshot of what was mounted
        if (typeof activeLayoutComp?.unmount === 'function')
          activeLayoutComp.unmount(layoutInstance);
        else unmount(layoutInstance);
      } catch (e) {}
      layoutInstance = null;
      activeLayoutComp = null;
    }
  }

  // Layout Lifecycle
  $effect(() => {
    if (!browser || !layoutContainer) return;

    if (!data.layout) {
      cleanupLayout();
      return;
    }

    const layoutComp = data.layout.default || data.layout;
    if (activeLayoutComp !== data.layout) {
      cleanupLayout();
      try {
        if (data.layout.mount) {
          layoutInstance = data.layout.mount({
            target: layoutContainer,
            props: { ...(data.props || {}), panoContexts: contexts },
            context: contexts,
          });
        } else {
          layoutInstance = mount(layoutComp, {
            target: layoutContainer,
            props: { ...(data.props || {}), panoContexts: contexts },
            context: contexts,
          });
        }
        activeLayoutComp = data.layout;
      } catch (e) {
        console.error('[Layout] Mount failed', e);
      }
    }
  });

  $effect(() => () => cleanupLayout());

  // Slot Injection
  $effect(() => {
    const _pageData = data; // dependency
    if (!browser) return;

    let rafId;
    const poll = () => {
      if (!slotContentContainer) {
        rafId = requestAnimationFrame(poll);
        return;
      }

      // No dynamic layout: Reset style and stop polling
      if (!data.layout) {
        slotContentContainer.style.display = '';
        return;
      }

      const anchor = layoutContainer?.querySelector(
        '[data-pano-content], main, .content, .page-content, article',
      );

      if (anchor) {
        if (anchor.lastElementChild !== slotContentContainer) {
          anchor.appendChild(slotContentContainer);
        }
        slotContentContainer.style.display = '';
      } else {
        rafId = requestAnimationFrame(poll);
      }
    };

    poll();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
</script>
