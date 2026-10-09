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
      <FrontendKeys controller={keysController} {notify} />
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
      <FrontendOrigins controller={originsController} />
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
      onclick={() => invalidateAll()}>
      <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
    </button>
  </div>
{/snippet}

<script module>
  import ApiUtil from '$lib/api.util';

  import { createFrontendApi } from './frontend.api.js';

  /**
   * The six reads of the page. Each can fail alone (an older backend has no proxy status, a key
   * list can be refused), so a failed read is `null` and only its part of the page says so.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    await event.parent();

    const api = createFrontendApi(ApiUtil, event);
    const [keys, frontend, proxyStatus, origins, urls, settings] = await Promise.all([
      api.listKeys(),
      api.getFrontend(),
      api.getProxyStatus(),
      api.listOrigins(),
      api.getUrls(),
      api.getSettings(),
    ]);

    return {
      keys: keys.ok ? keys.body : null,
      frontend: frontend.ok ? frontend.body : null,
      proxyStatus: proxyStatus.ok ? proxyStatus.body : null,
      origins: origins.ok ? origins.body : null,
      urls: urls.ok ? urls.body : null,
      settings: settings.ok ? settings.body : null,
    };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _, locale } from 'svelte-i18n';
  import { derived, get } from 'svelte/store';

  import { invalidateAll } from '$app/navigation';

  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { withFrontendMenuItem } from '$lib/navigation.util.js';
  import { themeMenuItems } from '$lib/PluginAPI.js';

  import FrontendKeys from './FrontendKeys.svelte';
  import FrontendMode from './FrontendMode.svelte';
  import FrontendOrigins from './FrontendOrigins.svelte';
  import FrontendSettings from './FrontendSettings.svelte';
  import FrontendUrls from './FrontendUrls.svelte';
  import { createKeysController } from './keys.controller.js';
  import { createModeController } from './mode.controller.js';
  import { createOriginsController } from './origins.controller.js';
  import ProxyBanner from './ProxyBanner.svelte';
  import { createSettingsController } from './settings.controller.js';
  import { createUrlsController } from './urls.controller.js';

  /**
   * The Front-end page (Appearance -> Front-end): the proxy banner and five tabs, Keys, Mode, Allowed
   * origins, Link targets and Settings. `api`, `notify` and `confirm` default to the panel's own; they
   * are props so a test can pass stubs.
   * @type {{ data: { keys: any, frontend: any, proxyStatus: any, origins?: any, urls?: any, settings?: any }, api?: any, notify?: any, confirm?: any }}
   */
  let {
    data,
    api = createFrontendApi(ApiUtil),
    notify = {
      success: (key, values) => showSuccess(key, values),
      error: (key, values) => showError(key, values),
    },
    confirm = showConfirm,
  } = $props();

  const pageTitle = getContext('pageTitle');

  pageTitle?.set('pages.frontend.title');

  // The submenu lists this page while it is open, even before the menu itself carries the entry.
  themeMenuItems.update(withFrontendMenuItem);

  const tabs = [
    { id: 'keys', icon: 'fa-solid fa-key', titleKey: 'pages.frontend.tabs.keys' },
    { id: 'mode', icon: 'fa-solid fa-sliders', titleKey: 'pages.frontend.tabs.mode' },
    { id: 'origins', icon: 'fa-solid fa-globe', titleKey: 'pages.frontend.tabs.origins' },
    { id: 'urls', icon: 'fa-solid fa-link', titleKey: 'pages.frontend.tabs.urls' },
    { id: 'settings', icon: 'fa-solid fa-gear', titleKey: 'pages.frontend.tabs.settings' },
  ];

  let tab = $state('keys');

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

  // The link targets and the settings belong to the active front-end: a saved mode change, or another
  // custom app, makes both read again.
  onMount(() => {
    if (!modeController) return;

    let last = null;

    return modeController.saved.subscribe((state) => {
      const next = `${state.mode}|${state.customAppId}|${state.activeId}`;

      if (last !== null && next !== last) {
        urlsController?.refresh();
        settingsController?.refresh();
      }

      last = next;
    });
  });
</script>
