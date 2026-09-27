import { onNavigate } from '$app/navigation';

/**
 * The panel's own page transition: replays an animate.css animation on an element whenever the
 * router moves, so a page change is felt as well as seen.
 *
 * animate.css animations only run when their class is (re-)applied, so the class is taken off and
 * the element is forced through a reflow before it goes back on — otherwise the second navigation
 * would play nothing at all.
 *
 * A `key` covers the changes that are not navigations: the sidebar swapping its menu when the
 * workspace tab changes, say.
 *
 * @param {HTMLElement} node the element to fade.
 * @param {{ classes?: string, key?: unknown }} [options]
 *   `classes` the animate.css animation to replay, `key` a value whose change also replays it.
 * @returns {{ update: (options?: { classes?: string, key?: unknown }) => void, destroy: () => void }}
 */
export function fadeChange(node, options = {}) {
  const state = { classes: options.classes ?? DEFAULT_CLASSES, key: options.key ?? null };

  const clear = () => node.classList.remove(...state.classes.split(' ').filter(Boolean));

  const replay = () => {
    clear();
    // The reflow is the point: without it the browser sees no change and skips the animation.
    void node.offsetWidth;
    node.classList.add(...state.classes.split(' ').filter(Boolean));
  };

  // The classes come off as soon as the animation ends. Left on, `animate__animated` keeps the
  // opacity animation filled, which makes the element a stacking context: the page's modals
  // render inside it and end up under Bootstrap's body-level backdrop, so nothing is clickable.
  /** @param {AnimationEvent} event */
  const onAnimationEnd = (event) => {
    if (event.target === node) {
      clear();
    }
  };

  node.addEventListener('animationend', onAnimationEnd);
  node.addEventListener('animationcancel', onAnimationEnd);

  replay();

  const stopWatchingNavigation = onNavigate(() => replay());

  return {
    update(next = {}) {
      if (next.classes && next.classes !== state.classes) {
        clear();
        state.classes = next.classes;
      }

      if ((next.key ?? null) !== state.key) {
        state.key = next.key ?? null;
        replay();

        return;
      }

      if (next.classes && next.classes !== state.classes) {
        replay();
      }
    },
    destroy() {
      stopWatchingNavigation();
      node.removeEventListener('animationend', onAnimationEnd);
      node.removeEventListener('animationcancel', onAnimationEnd);
      clear();
    },
  };
}

const DEFAULT_CLASSES = 'animate__animated animate__fadeIn';
