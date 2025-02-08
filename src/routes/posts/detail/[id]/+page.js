import { load as loadPostEditor, Modes } from "$lib/pages/PostEditor.svelte";

/**
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load(params) {
  return loadPostEditor(params, Modes.EDIT);
}
