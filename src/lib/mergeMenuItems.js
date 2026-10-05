/**
 * Prepares a menu item list for rendering: items sharing an `id` collapse into one (the last
 * one wins, it keeps the position of the first), and items whose `permission` the viewer lacks
 * are dropped.
 *
 * @template {{ id: string, permission?: any }} T
 * @param {T[]} items
 * @param {(permission: any) => boolean} [canSee] - permission check; omitted = no filtering
 * @returns {T[]}
 */
export function mergeMenuItems(items, canSee = () => true) {
  const byId = new Map();

  for (const item of items ?? []) {
    if (!item) continue;
    byId.set(item.id, item);
  }

  return [...byId.values()].filter((item) => !item.permission || canSee(item.permission));
}
