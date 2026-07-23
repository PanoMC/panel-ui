import { tick } from 'svelte';

/**
 * Moves an element to another place in the DOM hierarchy (teleport).
 * This is the safest way to avoid Svelte Snippet conflicts.
 *
 * Usage: <div use:teleport={'right'}>...</div>
 */
export function teleport(node, targetName) {
  let initialized = false;

  async function move() {
    // Make sure the DOM is ready
    await tick();

    const target = document.querySelector(`[data-layout-actions="${targetName}"]`);

    if (target) {
      // Make the element visible and append it to the target area
      node.style.display = 'flex';
      node.classList.add('hstack', 'gap-2');
      target.appendChild(node);
      initialized = true;
    } else {
      console.warn(`[Teleport] Target '[data-layout-actions="${targetName}"]' not found.`);
    }
  }

  move();

  return {
    destroy() {
      if (initialized && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    },
  };
}
