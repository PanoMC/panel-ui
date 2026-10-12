import { goto } from '$app/navigation';

/** What keeps its own click: a press on any of these inside the row is not a press on the row. */
const OWN_CLICK =
  'a, button, input, select, textarea, label, summary, [role="button"], [data-bs-toggle], .dropdown-menu';

/**
 * Makes a whole table row open `href`, like a `list-group-item-action`: `<tr use:rowLink={href}>`.
 * Links, buttons, inputs and dropdowns inside the row keep their own click, a text selection is
 * left alone, and Ctrl / Cmd / middle click opens a new tab. The row's own link stays the way in
 * for the keyboard and screen readers. Styled by `.row-action` (src/styles/_row-action.scss).
 *
 * @param {HTMLElement} node the `<tr>`.
 * @param {string | (() => void) | null | undefined} href where the row goes, or what it does when
 *   it opens a dialog instead of a page (`() => modal.show(item)`); none leaves the row inert.
 */
export function rowLink(node, href) {
  let target = href;

  node.classList.toggle('row-action', !!target);

  /** @param {MouseEvent} event */
  function onClick(event) {
    if (!target || event.defaultPrevented || event.button !== 0) {
      return;
    }

    const own = event.target instanceof Element ? event.target.closest(OWN_CLICK) : null;

    if (own && node.contains(own)) {
      return;
    }

    if (window.getSelection()?.toString()) {
      return;
    }

    if (typeof target === 'function') {
      target();

      return;
    }

    if (event.ctrlKey || event.metaKey) {
      window.open(target, '_blank', 'noopener');

      return;
    }

    void goto(target);
  }

  /** @param {MouseEvent} event */
  function onAuxClick(event) {
    if (typeof target === 'string' && target && event.button === 1) {
      const own = event.target instanceof Element ? event.target.closest(OWN_CLICK) : null;

      if (!own || !node.contains(own)) {
        window.open(target, '_blank', 'noopener');
      }
    }
  }

  node.addEventListener('click', onClick);
  node.addEventListener('auxclick', onAuxClick);

  return {
    /** @param {string | (() => void) | null | undefined} next */
    update(next) {
      target = next;
      node.classList.toggle('row-action', !!target);
    },
    destroy() {
      node.removeEventListener('click', onClick);
      node.removeEventListener('auxclick', onAuxClick);
      node.classList.remove('row-action');
    },
  };
}
