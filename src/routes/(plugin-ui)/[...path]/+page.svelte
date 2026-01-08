{#if !browser}
  <!-- Server Side: Native Rendering to preserve Context ($page store) -->
  <svelte:component this={data.component.default} {...data.props || {}} />
{:else}
  <!-- Client Side: Manual Mount to prevent Runtime Mismatch (effect_orphan) -->
  <div bind:this={viewContainer} class="plugin-view-container"></div>
{/if}

<script context="module">
  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const { registeredPage } = await parent();

    let componentOutput = {};

    const component = await registeredPage.component();

    // Inject plugin-specific params into the event
    if (registeredPage.params) {
      event.params = { ...event.params, ...registeredPage.params };
    }

    if (component.load !== undefined) {
      componentOutput = await component.load(event);
    }

    return { registeredPage, component, props: componentOutput };
  }
</script>

<script>
  import { onDestroy, onMount, mount, unmount, hydrate } from 'svelte';
  import { browser } from '$app/environment';

  export let data;

  let viewContainer;
  let componentInstance;

  onMount(() => {
    if (browser && viewContainer && data.component?.default) {
      try {
        // STRATEGY: True Hydration Attempt
        // The container already has the SSR HTML injected via {@html ssrHtml} below.
        // We ask the Plugin (via Bridge) to hydrate this content.

        if (data.component.hydrate) {
          try {
            componentInstance = data.component.hydrate({
              target: viewContainer,
              props: data.props || {},
            });
            console.log('Plugin Hydration Success');
          } catch (hErr) {
            console.warn('Plugin Hydration Failed (Mismatch), falling back to Clean Mount:', hErr);
            viewContainer.innerHTML = '';
            componentInstance = data.component.mount({
              target: viewContainer,
              props: data.props || {},
            });
          }
        }
        // Legacy/Fallback for non-bridged (Native)
        else {
          // ... Same as before ...
          try {
            componentInstance = hydrate(data.component.default, {
              target: viewContainer,
              props: data.props || {},
            });
          } catch (hErr) {
            viewContainer.innerHTML = '';
            componentInstance = mount(data.component.default, {
              target: viewContainer,
              props: data.props || {},
            });
          }
        }
      } catch (err) {
        console.warn('Mount failed completely:', err);
      }
    }
  });

  onDestroy(() => {
    if (componentInstance) {
      try {
        if (data.component?.unmount) {
          data.component.unmount(componentInstance);
        } else {
          unmount(componentInstance);
        }
      } catch (e) {
        if (componentInstance?.$destroy) componentInstance.$destroy();
      }
    }
  });
</script>
