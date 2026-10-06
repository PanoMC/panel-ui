import { get } from 'svelte/store';

const queues = new WeakMap();

/**
 * Applies a plugin's menu / navigation edit to `store`: `store.set(await handler(get(store)))`, but one edit at a time per store.
 *
 * Plugins of one load level run `onLoad` in parallel, so two plugins that edit the same list (every `editNavLinks` / `editMenu` of
 * the plugin API) used to read the same starting list and the later `set` silently dropped the earlier plugin's items. Edits now queue in
 * call order, each one starting from the list the previous one produced. A throwing handler rejects its own call only.
 *
 * @template T
 * @param {import('svelte/store').Writable<T>} store
 * @param {(items: T) => T | Promise<T>} handler
 * @returns {Promise<void>}
 */
export function editSerialized(store, handler) {
  const previous = queues.get(store) ?? Promise.resolve();
  const run = previous.then(async () => {
    store.set(await handler(get(store)));
  });

  queues.set(
    store,
    run.catch(() => {}),
  );

  return run;
}
