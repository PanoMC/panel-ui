import { describe, expect, test } from 'bun:test';
import { get, writable } from 'svelte/store';

import { editSerialized } from './editSerialized.js';

const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('editSerialized', () => {
  test('two plugins editing in the same tick both keep their items (the lost-update race)', async () => {
    const store = writable([{ id: 'core' }]);

    // what two plugins of one load level do: both call at once, before any microtask ran
    await Promise.all([
      editSerialized(store, (items) => [...items, { id: 'a' }]),
      editSerialized(store, (items) => [...items, { id: 'b' }]),
    ]);

    expect(get(store).map((i) => i.id)).toEqual(['core', 'a', 'b']);
  });

  test('the naive read-modify-write loses the first plugin (documents what the helper fixes)', async () => {
    const store = writable([{ id: 'core' }]);
    const naive = async (handler) => store.set(await handler(get(store)));

    await Promise.all([
      naive((items) => [...items, { id: 'a' }]),
      naive((items) => [...items, { id: 'b' }]),
    ]);

    expect(get(store).map((i) => i.id)).toEqual(['core', 'b']);
  });

  test('async handlers run in call order, a slow first handler does not let the second start early', async () => {
    const store = writable([]);
    const order = [];

    await Promise.all([
      editSerialized(store, async (items) => {
        order.push('a:start');
        await tick(20);
        order.push('a:end');

        return [...items, 'a'];
      }),
      editSerialized(store, async (items) => {
        order.push('b:start');

        return [...items, 'b'];
      }),
    ]);

    expect(order).toEqual(['a:start', 'a:end', 'b:start']);
    expect(get(store)).toEqual(['a', 'b']);
  });

  test('a throwing handler rejects its own call, leaves the store and does not block the next edit', async () => {
    const store = writable(['core']);
    const failing = editSerialized(store, () => {
      throw new Error('boom');
    });
    const next = editSerialized(store, (items) => [...items, 'ok']);

    await expect(failing).rejects.toThrow('boom');
    await next;

    expect(get(store)).toEqual(['core', 'ok']);
  });

  test('stores have independent queues', async () => {
    const one = writable([]);
    const two = writable([]);

    await Promise.all([
      editSerialized(one, async (items) => {
        await tick(20);

        return [...items, 1];
      }),
      editSerialized(two, (items) => [...items, 2]),
    ]);

    expect(get(one)).toEqual([1]);
    expect(get(two)).toEqual([2]);
  });
});
