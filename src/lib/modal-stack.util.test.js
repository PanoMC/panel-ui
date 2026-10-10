import { afterEach, describe, expect, test } from 'bun:test';

import { portal, showStacked } from './modal-stack.util.js';

/** A minimal element: listeners, a style and a remove(). */
function fakeElement() {
  const listeners = {};

  return {
    removed: false,
    style: {
      zIndex: '',
      removeProperty(name) {
        if (name === 'z-index') this.zIndex = '';
      },
    },
    addEventListener: (name, fn) => (listeners[name] = fn),
    emit: (name) => listeners[name]?.(),
    remove() {
      this.removed = true;
    },
  };
}

const original = globalThis.document;

afterEach(() => {
  globalThis.document = original;
});

describe('showStacked', () => {
  const setup = (open, backdrops = []) => {
    const body = {
      classList: {
        added: [],
        add(c) {
          this.added.push(c);
        },
      },
    };

    globalThis.document = {
      body,
      querySelectorAll: (selector) => (selector === '.modal.show' ? open : backdrops),
      querySelector: () => open[0] ?? null,
    };

    return body;
  };

  test('the only open modal keeps the default stacking', () => {
    setup([{}]);
    const element = fakeElement();
    let shown = 0;

    showStacked({ show: () => shown++ }, element);
    element.emit('shown.bs.modal');

    expect(shown).toBe(1);
    expect(element.style.zIndex).toBe('');
  });

  test('a modal over another one is raised, with its backdrop, and restored on hide', () => {
    const backdrop = { style: { zIndex: '' } };
    const body = setup([{}, {}], [{ style: {} }, backdrop]);
    const element = fakeElement();

    showStacked({ show: () => {} }, element);
    element.emit('shown.bs.modal');

    expect(element.style.zIndex).toBe('1075');
    expect(backdrop.style.zIndex).toBe('1070');

    element.emit('hidden.bs.modal');

    expect(element.style.zIndex).toBe('');
    // The modal below is still open, so the page stays scroll-locked.
    expect(body.classList.added).toEqual(['modal-open']);
  });
});

describe('portal', () => {
  test('moves the element to the body and removes it on destroy', () => {
    const appended = [];

    globalThis.document = { body: { appendChild: (node) => appended.push(node) } };

    const element = fakeElement();
    const action = portal(element);

    expect(appended).toEqual([element]);

    action.destroy();

    expect(element.removed).toBe(true);
  });
});
