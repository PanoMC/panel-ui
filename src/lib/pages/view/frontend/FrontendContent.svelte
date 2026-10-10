<div class="vstack gap-3">
  <ProxyBanner status={data.proxyStatus} {notify} />

  {#if modeController}
    <FrontendMode controller={modeController} />
  {:else}
    {@render loadFailed()}
  {/if}

  <div class="card">
    <div class="list-group list-group-flush">
      <div class="list-group-item d-flex align-items-center gap-3" data-row="keys">
        <div class="flex-grow-1">
          <div class="fw-semibold">{$_('pages.frontend.keys.title')}</div>
          <div class="text-body-secondary">{$_('pages.frontend.keys.block-title')}</div>
        </div>
        <button
          type="button"
          class="btn btn-secondary"
          disabled={!keysUsable || !keysController}
          data-open-keys
          onclick={() => keysModal?.show()}>
          {$_('pages.frontend.manage')}
        </button>
      </div>

      {#if originsController}
        <FrontendOtherSites controller={originsController} />
      {:else}
        <div class="list-group-item">{@render loadFailed()}</div>
      {/if}

      <div class="list-group-item d-flex align-items-center gap-3" data-row="urls">
        <div class="flex-grow-1">
          <div class="fw-semibold">{$_('pages.frontend.urls.title')}</div>
        </div>
        <button
          type="button"
          class="btn btn-secondary"
          disabled={!urlsController}
          data-open-urls
          onclick={() => urlsModal?.show()}>
          {$_('pages.frontend.manage')}
        </button>
      </div>
    </div>
  </div>
</div>

{#if keysController}
  <FrontendKeys bind:this={keysModal} controller={keysController} {notify} />
{/if}
{#if urlsController}
  <FrontendUrls bind:this={urlsModal} controller={urlsController} />
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
  import { derived, readable } from 'svelte/store';

  import ApiUtil from '$lib/api.util';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  import FrontendKeys from './FrontendKeys.svelte';
  import FrontendMode from './FrontendMode.svelte';
  import FrontendOtherSites from './FrontendOtherSites.svelte';
  import FrontendUrls from './FrontendUrls.svelte';
  import { createFrontendApi } from './frontend.api.js';
  import { FrontendModes } from './frontend.util.js';
  import { createKeysController } from './keys.controller.js';
  import { createModeController } from './mode.controller.js';
  import { createOriginsController } from './origins.controller.js';
  import ProxyBanner from './ProxyBanner.svelte';
  import { createUrlsController } from './urls.controller.js';

  /**
   * The body of the Front-end settings modal (Themes page): the proxy banner, the mode choice and a
   * short list of rows, each opening its own modal (site connection keys, link targets) or being a
   * switch (other websites). `api`, `notify` and `confirm` default to the panel's own; they are props
   * so a test can pass stubs. `onmodesaved` gets the saved mode;
   * `onretry` runs when a failed read's retry button is pressed.
   * @type {{ data: { keys: any, frontend: any, proxyStatus: any, origins?: any, urls?: any }, api?: any, notify?: any, confirm?: any, onmodesaved?: (mode: string) => void, onretry?: () => void }}
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

  // svelte-ignore state_referenced_locally
  const originsController = data.origins
    ? createOriginsController({ api, notify, confirm, initial: data.origins })
    : null;

  // A key is "stored" while the list has one: the link targets that create a session are then marked.
  const hasKey = keysController
    ? derived(keysController.items, (items) => items.length > 0)
    : undefined;
  // svelte-ignore state_referenced_locally
  const urlsController = data.urls
    ? createUrlsController({ api, notify, initial: data.urls, hasKey })
    : null;

  // The saved mode, not the form: headless access follows what is stored.
  // svelte-ignore state_referenced_locally
  const savedMode = modeController ? modeController.saved : readable(null);
  // Site connection keys belong to a front-end that is not a theme: in Theme mode the row is disabled.
  // Stored keys stay and work again when the mode changes.
  const keysUsable = $derived($savedMode != null && $savedMode.mode !== FrontendModes.THEME);

  let keysModal = $state();
  let urlsModal = $state();

  // The link targets belong to the active front-end: a saved mode change, or another custom app,
  // makes them read again.
  onMount(() => {
    if (!modeController) return;

    let last = null;
    let lastMode = null;

    return modeController.saved.subscribe((state) => {
      const next = `${state.mode}|${state.customAppId}|${state.activeId}`;

      if (last !== null && next !== last) {
        urlsController?.refresh();
      }

      if (last !== null && state.mode !== lastMode) onmodesaved?.(state.mode);

      last = next;
      lastMode = state.mode;
    });
  });
</script>
