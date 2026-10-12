/**
 * Replays a CSS animation class on an element whenever its `key` changes, for a swap that happens
 * in place and is not a new element appearing: the sidebar menu changing workspace
 * (`use:fadeChange={{ classes, key: $sidebarTabsState }}`). Pages do not need it: a new page's
 * elements play their animation as they are inserted (`PageSlot`).
 *
 * A CSS animation only runs when its class is (re-)applied, so the class is taken off and the
 * element is forced through a reflow before it goes back on — otherwise the second change would
 * play nothing at all. The first render does not play it: only the changes after it do.
 *
 * @param {HTMLElement} node the element to animate.
 * @param {{ classes?: string, key?: unknown }} [options]
 *   `classes` the animation class to replay (`.panel-slide-in-left` by default,
 *   src/styles/style.scss), `key` a value whose change replays it.
 * @returns {{ update: (options?: { classes?: string, key?: unknown }) => void, destroy: () => void }}
 */
export function fadeChange(node, options = {}) {
  const state = { classes: options.classes ?? DEFAULT_CLASSES, key: options.key ?? null };

  const names = () => state.classes.split(' ').filter(Boolean);

  const clear = () => node.classList.remove(...names());

  const replay = () => {
    clear();
    // The reflow is the point: without it the browser sees no change and skips the animation.
    void node.offsetWidth;
    node.classList.add(...names());
  };

  // The class comes off as soon as the animation ends. Left on, the animation could keep the
  // element a stacking context: the page's modals render inside it and would end up under
  // Bootstrap's body-level backdrop, so nothing would be clickable.
  /** @param {AnimationEvent} event */
  const onAnimationEnd = (event) => {
    // The node itself (the sidebar menu), or a child of it (a page's containers).
    if (event.target === node || event.target.parentElement === node) {
      clear();
    }
  };

  node.addEventListener('animationend', onAnimationEnd);
  node.addEventListener('animationcancel', onAnimationEnd);

  // The first render is not a page change: only the changes after it replay.

  return {
    update(next = {}) {
      if (next.classes && next.classes !== state.classes) {
        clear();
        state.classes = next.classes;
      }

      if ((next.key ?? null) !== state.key) {
        state.key = next.key ?? null;
        replay();
      }
    },
    destroy() {
      node.removeEventListener('animationend', onAnimationEnd);
      node.removeEventListener('animationcancel', onAnimationEnd);
      clear();
    },
  };
}

const DEFAULT_CLASSES = 'panel-slide-in-left';
