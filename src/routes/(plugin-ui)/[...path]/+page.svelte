{#if browser}
  <div bind:this={$view} id="{viewId}"></div>
{:else}
  <svelte:component this={data.component.default} />
{/if}

<script context="module">
  /**
	 * @type {import('@sveltejs/kit').PageLoad}
	 */
	export async function load(event) {
    const { parent } = event;
    const { registeredPage } = await parent();

    let componentOutput = {}

    const component = await registeredPage.component();

    if (component.load !== undefined) {
      componentOutput = await component.load(event);
    }

    return { registeredPage, component, ...componentOutput };
	}
</script>

<script>
  import { onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { v4 as uuidv4 } from 'uuid';

  import { browser } from "$app/environment";

  export let data;

  const view = writable();
  const viewId = `plugin-view-${uuidv4()}`;
  let component;

  if (browser) {
    onDestroy(
      view.subscribe((value) => {
        if (typeof value !== "undefined" && value !== null) {
          component = new data.component.default({target: document.querySelector("#"+ viewId), props: {name: "ahmet"}})
        }
      })
    )
    onDestroy(() => component?.$destroy());
  }
</script>