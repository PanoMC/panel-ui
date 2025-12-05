import {
  load as loadPermissionGroupDetail,
  Modes,
} from "$lib/pages/players/PermissionGroupDetail.svelte";

/**
 * @type {import('@sveltejs/kit').PageLoad}
 */
export async function load(params) {
  return loadPermissionGroupDetail(params, Modes.EDIT);
}
