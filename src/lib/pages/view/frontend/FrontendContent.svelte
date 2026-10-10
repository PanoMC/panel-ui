<div class="vstack gap-3">
  <ProxyBanner status={data.proxyStatus} {notify} />

  <ul class="nav nav-tabs" role="tablist">
    {#each tabs as item (item.id)}
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          class:active={tab === item.id}
          id="frontend-tab-{item.id}"
          role="tab"
          aria-selected={tab === item.id}
          aria-controls="frontend-pane-{item.id}"
          data-tab={item.id}
          onclick={() => (tab = item.id)}>
          <i class="{item.icon} me-1" aria-hidden="true"></i>
          {$_(item.titleKey)}
        </button>
      </li>
    {/each}
  </ul>

  <div
    id="frontend-pane-keys"
    role="tabpanel"
    aria-labelledby="frontend-tab-keys"
    hidden={tab !== 'keys'}>
    {#if keysController}
      <FrontendKeys controller={keysController} {notify} {locked} />
    {:else}
      {@render loadFailed()}
    {/if}
  </div>

  <div
    id="frontend-pane-mode"
    role="tabpanel"
    aria-labelledby="frontend-tab-mode"
    hidden={tab !== 'mode'}>
    {#if modeController}
      <FrontendMode controller={modeController} />
    {:else}
      {@render loadFailed()}
    {/if}
  </div>

  <div
    id="frontend-pane-origins"
    role="tabpanel"
    aria-labelledby="frontend-tab-origins"
    hidden={tab !== 'origins'}>
    {#if originsController}
      <FrontendOrigins controller={originsController} {locked} />
    {:else}
      {@render loadFailed()}
    {/if}
  </div>

  <div
    id="frontend-pane-urls"
    role="tabpanel"
    aria-labelledby="frontend-tab-urls"
    hidden={tab !== 'urls'}>
    {#if urlsController}
      <FrontendUrls controller={urlsController} />
    {:else}
      {@render loadFailed()}
    {/if}
  </div>

  <div
    id="frontend-pane-settings"
    role="tabpanel"
    aria-labelledby="frontend-tab-settings"
    hidden={tab !== 'settings'}>
    {#if settingsController}
      <FrontendSettings controller={settingsController} />
    {:else}
      {@render loadFailed()}
    {/if}
  </div>
</div>

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
  import { _, locale } from 'svelte-i18n';
  import { derived, get, readable } from 'svelte/store';

  import ApiUtil from '$lib/api.util';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  import FrontendKeys from './FrontendKeys.svelte';
  import FrontendMode from './FrontendMode.svelte';
  import FrontendOrigins from './FrontendOrigins.svelte';
  import FrontendSettings from './FrontendSettings.svelte';
  import FrontendUrls from './FrontendUrls.svelte';
  import { createFrontendApi } from './frontend.api.js';
  import { FrontendModes } from './frontend.util.js';
  import { createKeysController } from './keys.controller.js';
  import { createModeController } from './mode.controller.js';
  import { createOriginsController } from './origins.controller.js';
  import ProxyBanner from './ProxyBanner.svelte';
  import { createSettingsController } from './settings.controller.js';
  import { createUrlsController } from './urls.controller.js';

  /**
   * The body of the Front-end settings modal (Themes page): the proxy banner and five tabs, Mode, Keys,
   * Allowed origins, Link targets and Settings. `api`, `notify` and `confirm` default to the panel's own;
   * they are props so a test can pass stubs. While the saved mode is Theme, headless access is off: the
   * Keys and Allowed origins tabs stay but cannot create or add. `onmodesaved` gets the saved mode;
   * `onretry` runs when a failed read's retry button is pressed.
   * @type {{ data: { keys: any, frontend: any, proxyStatus: any, origins?: any, urls?: any, settings?: any }, tab?: string, api?: any, notify?: any, confirm?: any, onmodesaved?: (mode: string) => void, onretry?: () => void }}
   */
  let {
    data,
    tab: initialTab = 'mode',
    onmodesaved = undefined,
    onretry = undefined,
    api = createFrontendApi(ApiUtil),
    notify = {
      success: (key, values) => showSuccess(key, values),
      error: (key, values) => showError(key, values),
    },
    confirm = showConfirm,
  } = $props();

  const tabs = [
    { id: 'mode', icon: 'fa-solid fa-sliders', titleKey: 'pages.frontend.tabs.mode' },
    { id: 'keys', icon: 'fa-solid fa-key', titleKey: 'pages.frontend.tabs.keys' },
    { id: 'origins', icon: 'fa-solid fa-globe', titleKey: 'pages.frontend.tabs.origins' },
    { id: 'urls', icon: 'fa-solid fa-link', titleKey: 'pages.frontend.tabs.urls' },
    { id: 'settings', icon: 'fa-solid fa-gear', titleKey: 'pages.frontend.tabs.settings' },
  ];

  // svelte-ignore state_referenced_locally
  let tab = $state(tabs.some((item) => item.id === initialTab) ? initialTab : 'mode');

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

  // svelte-ignore state_referenced_locally
  const settingsController = data.settings
    ? createSettingsController({
        api,
        notify,
        initial: data.settings,
        locale: get(locale) ?? 'en-US',
      })
    : null;

  // The saved mode, not the form: headless access follows what is stored. Unknown (the read failed)
  // locks nothing.
  // svelte-ignore state_referenced_locally
  const savedMode = modeController ? modeController.saved : readable(null);
  const locked = $derived($savedMode?.mode === FrontendModes.THEME);

  // The link targets and the settings belong to the active front-end: a saved mode change, or another
  // custom app, makes both read again.
  onMount(() => {
    if (!modeController) return;

    let last = null;
    let lastMode = null;

    return modeController.saved.subscribe((state) => {
      const next = `${state.mode}|${state.customAppId}|${state.activeId}`;

      if (last !== null && next !== last) {
        urlsController?.refresh();
        settingsController?.refresh();
      }

      if (last !== null && state.mode !== lastMode) onmodesaved?.(state.mode);

      last = next;
      lastMode = state.mode;
    });
  });
</script>
