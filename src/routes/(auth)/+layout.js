/**
 * The auth routes render without the panel chrome: a signed-out visitor has no sidebar to
 * navigate and no navbar account menu to open. `resetLayout` is the same switch the plugin
 * routes use — set from a load so it is already true by the time the root layout decides
 * whether to wrap the page in `MainLayout` (SSR renders parents before children).
 *
 * @type {import('@sveltejs/kit').LayoutLoad}
 */
export async function load(event) {
  const { resetLayout } = await event.parent();

  resetLayout.set(true);

  return {};
}
