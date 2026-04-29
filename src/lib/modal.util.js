/**
 * When no Bootstrap modal is visible, remove stray .modal-backdrop nodes and
 * the body scroll lock. Helps after stacked modals, hide/reopen races, or
 * invalidation while a modal was closing.
 */
export function cleanupOrphanModalBackdrops() {
  if (typeof document === 'undefined') return;
  if (document.querySelectorAll('.modal.show').length > 0) return;
  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('padding-right');
  document.body.style.removeProperty('overflow');
}

/**
 * Same idea but for offcanvas backdrops. The sidebar is a Bootstrap offcanvas
 * on mobile; when a navigation interrupts its hide transition the
 * .offcanvas-backdrop element can survive at z-index 1050 and silently swallow
 * touch events on <main>, which manifests as "scroll suddenly stops working".
 */
export function cleanupOrphanOffcanvasBackdrops() {
  if (typeof document === 'undefined') return;
  if (document.querySelectorAll('.offcanvas.show').length > 0) return;
  document.querySelectorAll('.offcanvas-backdrop').forEach((el) => el.remove());
}

/** Run all overlay cleanups (modal + offcanvas). */
export function cleanupOrphanOverlays() {
  cleanupOrphanModalBackdrops();
  cleanupOrphanOffcanvasBackdrops();
}

/**
 * Hides a Bootstrap 5 modal and waits for its transition, then runs cleanup
 * if nothing else is open. Call before expensive navigations (e.g. invalidateAll).
 *
 * @param {HTMLElement | null} modalEl
 * @returns {Promise<void>}
 */
export function hideBootstrapModalAndWait(modalEl) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !modalEl) {
      cleanupOrphanModalBackdrops();
      resolve();
      return;
    }
    if (!modalEl.classList.contains('show')) {
      cleanupOrphanModalBackdrops();
      resolve();
      return;
    }
    const done = () => {
      cleanupOrphanModalBackdrops();
      resolve();
    };
    modalEl.addEventListener('hidden.bs.modal', done, { once: true });
    const inst =
      window.bootstrap.Modal.getInstance(modalEl) ||
      window.bootstrap.Modal.getOrCreateInstance(modalEl);
    inst.hide();
  });
}
