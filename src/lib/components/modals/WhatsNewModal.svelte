<style>
  .feature-icon-small {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Decorative squares in the header: the same 32px tile and light border as the global .blocks art. */
  .header-block {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    pointer-events: none;
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered" role="dialog">
    <div class="modal-content overflow-hidden">
      <div
        class="modal-header text-bg-primary d-block text-center border-bottom-0 py-5 position-relative overflow-hidden">
        {#each blocks as block}
          <span
            class="header-block border bg-{block.color}"
            style="{block.side}: {block.x}px; bottom: {block.y}px;"
            aria-hidden="true"></span>
        {/each}
        <button
          type="button"
          class="btn-close btn-close-white position-absolute top-0 end-0 m-3"
          aria-label="Close"
          on:click={handleClose}></button>
        <img
          src="{base}/assets/img/pano-logo-heorizontal.png"
          alt="Pano"
          class="my-3"
          style="height: 3rem;" />
      </div>
      <div class="modal-body px-lg-5 py-5">
        <p class="lead fw-bold text-center mb-5">{$_('components.whats-new.description')}</p>
        <div class="row g-4 mb-4 text-start">
          <!-- M9 — a SERVERS install has no website, so the CMS is not advertised to it. -->
          {#if $usageMode !== UsageModes.SERVERS}
            <div class="col-md-6">
              <div class="d-flex align-items-start">
                <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                  <i class="fas fa-pen"></i>
                </div>
                <div>
                  <h5 class="fw-normal mb-1">{$_('components.whats-new.features.cms')}</h5>
                  <p class=" mb-0">
                    {$_('components.whats-new.features.cms-description')}
                  </p>
                </div>
              </div>
            </div>
          {/if}
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                <i class="fas fa-cube"></i>
              </div>
              <div>
                <h5 class="fw-normal mb-1">{$_('components.whats-new.features.management')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.management-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                <i class="fas fa-gamepad"></i>
              </div>
              <div>
                <h5 class="fw-normal mb-1">{$_('components.whats-new.features.integration')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.integration-description')}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-start">
              <div class="feature-icon-small text-primary-emphasis fs-4 me-3">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div>
                <h5 class="fw-normal mb-1">{$_('components.whats-new.features.e2ee')}</h5>
                <p class=" mb-0">
                  {$_('components.whats-new.features.e2ee-description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {#if $showDonotShowAgain}
        <div class="modal-footer d-flex justify-content-center align-items-center">
          <div class="form-check form-switch mb-0">
            <input
              class="form-check-input"
              type="checkbox"
              id="dontShowAgain"
              autocomplete="off"
              bind:checked={$dontShowAgain} />
            <label class="form-check-label small" for="dontShowAgain">
              {$_('components.whats-new.dont-show-again')}
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';
  export const dontShowAgain = writable(false);

  export const WHATS_NEW_VERSION = '1';

  const modalElement = writable();
  let modal;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const showDonotShowAgain = writable(true);

  export async function show(requestedShowDonotShowAgain = true) {
    showDonotShowAgain.set(requestedShowDonotShowAgain);
    dontShowAgain.set(false);

    if (!modal) {
      modal = new window.bootstrap.Modal(get(modalElement), {
        backdrop: true,
        keyboard: true,
      });
    }

    modal.show();
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { base } from '@panomc/sdk/core/js/basePath.js';
  import ApiUtil from '$lib/api.util.js';
  import { UsageModes } from '$lib/navigation.util.js';

  const usageMode = getContext('usageMode');

  // The header's squares: random cells of a 32px grid on both sides of the logo, in the colours of
  // the panel's Bootstrap palette (primary is the header's own colour, so it is left out).
  const BLOCK_COLORS = ['success', 'info', 'warning', 'danger', 'secondary'];
  const BLOCK_SIZE = 32;
  const BLOCK_COUNT = 5; // per side
  const BLOCK_COLUMNS = 8; // per side, so the logo in the middle stays clear
  const BLOCK_ROWS = 5;

  /** @type {{ side: string, x: number, y: number, color: string }[]} */
  let blocks = [];

  const BLOCKS_STORAGE_KEY = 'whats-new-blocks';

  /** The squares are picked once and remembered, so the header looks the same every time. */
  function loadBlocks() {
    try {
      const saved = JSON.parse(localStorage.getItem(BLOCKS_STORAGE_KEY) ?? 'null');

      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {
      // Unreadable storage: pick again below.
    }

    const picked = pickBlocks();

    try {
      localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(picked));
    } catch {
      // Not remembered; the squares stay the same until the page is reloaded.
    }

    return picked;
  }

  function pickBlocks() {
    const cells = [];

    for (let column = 0; column < BLOCK_COLUMNS; column++) {
      for (let row = 0; row < BLOCK_ROWS; row++) cells.push([column, row]);
    }

    const picked = [];

    for (const mirrored of [false, true]) {
      const pool = [...cells];

      for (let i = 0; i < BLOCK_COUNT; i++) {
        const [column, row] = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        const x = column * BLOCK_SIZE;

        picked.push({
          side: mirrored ? 'right' : 'left',
          x,
          // Some sit a little below the edge, like cropped tiles.
          y: row * BLOCK_SIZE - (row === 0 ? 10 : 0),
          color: BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)],
        });
      }
    }

    return picked;
  }

  onMount(() => {
    blocks = loadBlocks();

    const element = get(modalElement);
    if (element) {
      element.addEventListener('hidden.bs.modal', handleDismissal);
    }

    return () => {
      if (element) {
        element.removeEventListener('hidden.bs.modal', handleDismissal);
      }
    };
  });

  async function handleDismissal() {
    if (get(showDonotShowAgain) && get(dontShowAgain)) {
      await ApiUtil.post({
        path: '/panel/dismissWhatsNew',
        body: {
          version: WHATS_NEW_VERSION,
        },
      });
    }
  }

  function handleClose() {
    hide();
  }
</script>
