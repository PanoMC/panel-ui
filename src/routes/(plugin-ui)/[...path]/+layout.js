import { load as loadLayout } from './+layout.svelte';

/**
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load(event) {
  return loadLayout(event);
}
