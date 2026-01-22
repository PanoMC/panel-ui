import { tick } from 'svelte';

/**
 * Bir elementin DOM hiyerarşisinde başka bir yere (teleport) taşınmasını sağlar.
 * Svelte Snippet çakışmalarını önlemek için en güvenli yoldur.
 *
 * Kullanım: <div use:teleport={'right'}>...</div>
 */
export function teleport(node, targetName) {
  let initialized = false;

  async function move() {
    // DOM'un hazır olduğundan emin olalım
    await tick();

    const target = document.querySelector(`[data-layout-actions="${targetName}"]`);

    if (target) {
      // Elementi görünür yap ve hedef alana ekle
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
