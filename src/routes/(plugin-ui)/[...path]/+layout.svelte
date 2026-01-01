<slot/>

<script context="module">
  import { getContext } from "svelte";
  import { error } from "@sveltejs/kit";

  import { registeredPages } from "$lib/PluginManager.js";
  import { base } from "$app/paths";

  function removePrefix(str, prefix) {
    return str.startsWith(prefix)
      ? str.slice(prefix.length)
      : str;
  }

  /**
   * @type {import("@sveltejs/kit").PageLoad}
   */
  export async function load(event) {
    const { url: { pathname }, parent } = event;
    const { resetLayout } = await parent();

    const registeredPage = registeredPages[removePrefix(pathname, base)];

    if (registeredPage === undefined) {
      throw error(404);
    }

    resetLayout.set(registeredPage.resetLayout || false);

    return { registeredPage };
  }
</script>

<script>
  export let data;
</script>
