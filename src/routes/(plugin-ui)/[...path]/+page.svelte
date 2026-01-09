{#if !browser}
  <!-- Server Side: Native Rendering to preserve Context ($page store) -->
  <svelte:component this={data.component.default} {...data.props || {}} />
{:else}
  <!-- Client Side: Manual Mount to prevent Runtime Mismatch (effect_orphan) -->
  {#key data}
    <div use:mountPlugin class="plugin-view-container"></div>
  {/key}
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
  import { mount, unmount, hydrate } from 'svelte';
  import { browser } from '$app/environment';

  export let data;

  function mountPlugin(viewContainer) {
    if (!browser || !viewContainer || !data.component?.default) return;

    let componentInstance;

    try {
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

    return {
      destroy() {
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
      }
    };
  }
</script>
