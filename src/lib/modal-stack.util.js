/**
 * Helpers for a Bootstrap modal that opens above another open modal.
 *
 * Bootstrap gives every modal the same z-index, so a second one would paint under the first and its
 * backdrop would not dim it. `showStacked` raises the modal and its backdrop by the number of modals
 * already open; `portal` moves a modal that is written inside another modal's markup to the body,
 * because a modal inside a modal is stacked in the outer one's context and cannot rise above it.
 */

const BASE_MODAL = 1055;
const BASE_BACKDROP = 1050;
const STEP = 20;

/**
 * Svelte action: moves the element to `document.body` and removes it when the component goes. Wrap the
 * element in a host element in the markup (`<div hidden><div class="modal" use:portal>`): Svelte keeps
 * tracking the host, never the moved element.
 *
 * @param {HTMLElement} node
 */
export function portal(node) {
  document.body.appendChild(node);

  return {
    destroy() {
      node.remove();
    },
  };
}

/**
 * Shows a Bootstrap modal above the modals that are open already. With no other modal open this is
 * `modal.show()` and nothing else.
 *
 * @param {{ show: () => void }} modal a `bootstrap.Modal` instance
 * @param {HTMLElement} element the modal's root element
 */
export function showStacked(modal, element) {
  const onShown = () => {
    const depth = document.querySelectorAll('.modal.show').length;

    if (depth < 2) return;

    element.style.zIndex = String(BASE_MODAL + (depth - 1) * STEP);

    const backdrops = document.querySelectorAll('.modal-backdrop');
    const last = /** @type {HTMLElement | undefined} */ (backdrops[backdrops.length - 1]);

    if (last) last.style.zIndex = String(BASE_BACKDROP + (depth - 1) * STEP);
  };

  const onHidden = () => {
    element.style.removeProperty('z-index');

    // Bootstrap lifts the scroll lock when any modal closes; the one below is still open.
    if (document.querySelector('.modal.show')) {
      document.body.classList.add('modal-open');
    }
  };

  element.addEventListener('shown.bs.modal', onShown, { once: true });
  element.addEventListener('hidden.bs.modal', onHidden, { once: true });

  modal.show();
}
