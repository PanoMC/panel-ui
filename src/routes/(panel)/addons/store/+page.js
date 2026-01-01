import { load as loadStore, PageTypes } from "$lib/pages/StoreLoading.svelte";

/**
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load(params) {
  return loadStore(params, PageTypes.ADDON);
}
