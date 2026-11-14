<div class="vstack gap-3">
  <ProxyBanner status={data.proxyStatus} {notify} />

  {#if modeController}
    <FrontendMode controller={modeController} {canUpload} />
  {:else}
    {@render loadFailed()}
  {/if}

  {#if keysUsable}
    {#if keysController}
      <div class="d-flex align-items-center gap-3" data-row="keys">
        <div class="flex-grow-1">
          <div class="fw-semibold">{$_('pages.frontend.keys.title')}</div>
          <div class="text-body-secondary">{$_('pages.frontend.keys.block-title')}</div>
        </div>
        <button
          type="button"
          class="btn btn-secondary"
          data-open-keys
          onclick={() => keysModal?.show()}>
          {$_('pages.frontend.manage')}
        </button>
      </div>
    {:else}
      <div data-row="keys">{@render loadFailed()}</div>
    {/if}
  {/if}
</div>

{#if keysController && keysUsable}
  <FrontendKeys bind:this={keysModal} controller={keysController} {notify} />
{/if}
{#snippet loadFailed()}
  <div class="alert alert-danger d-flex align-items-center mb-0" role="alert" data-load-failed>
    <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
    <div class="flex-grow-1">{$_('pages.frontend.load-failed')}</div>
    <button
      type="button"
      title={$_('buttons.try-again')}
      aria-label={$_('buttons.try-again')}
      class="btn alert-btn ms-3"
      onclick={() => onretry?.()}>
      <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
    </button>
  </div>
{/snippet}

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { readable } from 'svelte/store';

  import ApiUtil from '$lib/api.util';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  import FrontendKeys from './FrontendKeys.svelte';
  import FrontendMode from './FrontendMode.svelte';
  import { createFrontendApi } from './frontend.api.js';
  import { FrontendModes } from './frontend.util.js';
  import { createKeysController } from './keys.controller.js';
  import { createModeController } from './mode.controller.js';
  import ProxyBanner from './ProxyBanner.svelte';

  /**
   * The body of the Front-end settings modal (Themes page): the proxy banner, mode choice and site
   * connection keys. `api`, `notify` and `confirm` default to the panel's own; they are props so a
   * test can pass stubs. `onmodesaved` gets the saved mode; `onretry` runs when a failed read's
   * retry button is pressed.
   * @type {{ data: { keys: any, frontend: any, proxyStatus: any }, api?: any, notify?: any, confirm?: any, onmodesaved?: (mode: string) => void, onretry?: () => void, canUpload?: boolean }}
   */
  let {
    data,
    onmodesaved = undefined,
    onretry = undefined,
    api = createFrontendApi(ApiUtil),
    notify = {
      success: (key, values) => showSuccess(key, values),
      error: (key, values) => showError(key, values),
    },
    confirm = showConfirm,
    canUpload = true,
  } = $props();

  // The controllers hold the state from here on; `data` only seeds them.
  // svelte-ignore state_referenced_locally
  const keysController = data.keys
    ? createKeysController({ api, notify, confirm, initial: data.keys })
    : null;
  // svelte-ignore state_referenced_locally
  const modeController = data.frontend
    ? createModeController({ api, notify, confirm, initial: data.frontend })
    : null;

  // The saved mode, not the form: headless access follows what is stored.
  // svelte-ignore state_referenced_locally
  const savedMode = modeController ? modeController.saved : readable(null);
  // Site connection keys belong to a front-end that is not a theme: in Theme mode the row is not shown.
  // Stored keys stay and work again when the mode changes.
  const keysUsable = $derived($savedMode != null && $savedMode.mode !== FrontendModes.THEME);

  let keysModal = $state();

  // The active front-end mode is reflected on the Themes page after it is saved.
  onMount(() => {
    if (!modeController) return;

    let lastMode = null;

    return modeController.saved.subscribe((state) => {
      if (lastMode !== null && state.mode !== lastMode) onmodesaved?.(state.mode);

      lastMode = state.mode;
    });
  });
</script>
