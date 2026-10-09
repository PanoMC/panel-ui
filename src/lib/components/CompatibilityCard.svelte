{#if sections.visible}
  <!-- The one place that says what the API level gate did and what is left for the admin to do by
       hand for plugins and themes (doc 04 section 7, decision 46). Each part is an alert (design/alerts.md) whose text
       says plainly what to do; nothing here shows while everything is compatible. -->
  <div class="card" data-compat-card>
    <CardHeader>
      <div slot="left">
        {$_('components.compatibility-card.title', { values: { count: sections.count } })}
      </div>
    </CardHeader>

    <div class="card-body vstack gap-3">
      {#if refused.length > 0}
        <div
          class="alert alert-danger d-flex align-items-start mb-0"
          role="alert"
          data-compat-refused>
          <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
          <div class="flex-grow-1 min-w-0">
            <h5 class="alert-heading mb-2">
              {$_('components.compatibility-card.refused.title', {
                values: { count: refused.length },
              })}
            </h5>
            <div class="mb-2">
              {$_('components.compatibility-card.refused.description', {
                values: {
                  min: shown.apiLevel.min ?? '?',
                  current: shown.apiLevel.current ?? '?',
                },
              })}
            </div>
            <ul class="mb-2">
              {#each refused as row (row.type + ':' + row.id)}
                {@const note = resourceNote(row)}
                <li data-compat-row={row.id}>
                  <a
                    class="alert-link"
                    href={row.type === 'THEME'
                      ? `${base}/view/detail/${encodeURIComponent(row.id)}`
                      : `${base}/addons/detail/${encodeURIComponent(row.id)}`}>
                    {row.title}
                  </a>
                  <span class="badge text-bg-secondary">
                    {$_(
                      row.type === 'THEME'
                        ? 'components.compatibility-card.type.THEME'
                        : 'components.compatibility-card.type.PLUGIN',
                    )}
                  </span>
                  {#if row.version}
                    <span class="font-monospace">{row.version}</span>
                  {/if}
                  {#if row.heldBy && row.verdict === 'OK'}
                    <span class="badge text-bg-warning" data-held-by={row.heldBy.pluginId}>
                      {$_('components.compatibility-card.held-short', {
                        values: { name: row.heldBy.name },
                      })}
                    </span>
                  {:else}
                    <span class="badge text-bg-danger">{$_(verdictKey(row.verdict))}</span>
                  {/if}
                  <span>
                    {#if row.apiLevel}
                      {$_('components.compatibility-card.level', {
                        values: { level: row.apiLevel },
                      })}
                    {:else}
                      {$_('components.compatibility-card.level-none')}
                    {/if}
                  </span>
                  <div>{$_(note.key, { values: note.values })}</div>
                  {#if row.type === 'THEME'}
                    <div>{$_('components.compatibility-card.theme-fallback')}</div>
                  {/if}
                </li>
              {/each}
            </ul>
            {#if shown.reconcile.storeReachable === false}
              <p class="mb-2" data-compat-store-down>
                {$_('components.compatibility-card.store-down')}
              </p>
            {/if}
            <button
              type="button"
              class="btn alert-btn"
              disabled={retrying}
              data-compat-retry
              onclick={() => void controller.retry()}>
              {#if retrying}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {$_('buttons.retry')}
            </button>
            <a class="alert-link ms-2" href="{base}/settings/updates">
              {$_('components.compatibility-card.open-updates')}
            </a>
          </div>
        </div>
      {/if}

      {#if sections.externalUrls.length > 0}
        <div
          class="alert alert-warning d-flex align-items-start mb-0"
          role="alert"
          data-compat-urls>
          <i class="fa-solid fa-link me-3 mt-1" aria-hidden="true"></i>
          <div class="flex-grow-1 min-w-0">
            <h5 class="alert-heading mb-2">
              {$_('components.compatibility-card.urls.title', {
                values: { count: sections.externalUrls.length },
              })}
            </h5>
            <div class="mb-2">{$_('components.compatibility-card.urls.description')}</div>
            <ul class="mb-0">
              {#each sections.externalUrls as address (address.pluginId + ':' + address.url)}
                <li class="mb-2">
                  <b>{address.label || address.pluginId}</b>
                  {#if address.label}
                    <span class="font-monospace">({address.pluginId})</span>
                  {/if}
                  <div class="d-flex flex-wrap align-items-center gap-2">
                    <code class="user-select-all text-break">{address.url}</code>
                    <button
                      type="button"
                      class="btn btn-sm alert-btn"
                      data-compat-copy
                      onclick={() => copyAddress(address.url)}>
                      <i class="fa-solid fa-copy me-1" aria-hidden="true"></i>
                      {$_('buttons.copy')}
                    </button>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}

      {#if sections.themeViews}
        <div
          class="alert alert-warning d-flex align-items-start mb-0"
          role="alert"
          data-compat-alert>
          <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
          <div class="flex-grow-1 min-w-0">
            <h5 class="alert-heading mb-2">{$_('pages.theme-compat.alert.title')}</h5>
            <div>
              {$_('pages.theme-compat.alert.description', {
                values: {
                  count: sections.themeViews.count,
                  theme: sections.themeViews.theme?.id ?? '',
                },
              })}
            </div>
            <a class="btn alert-btn mt-2" href={themeTarget}>
              {$_('pages.theme-compat.alert.view')}
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import {
    showError as showErrorToast,
    showSuccess as showSuccessToast,
  } from '$lib/components/ToastContainer.svelte';

  import { createCompatibilityApi } from '$lib/pages/addons/compat/compat.api.js';
  import {
    cardSections,
    createCompatibilityController,
    resourceNote,
    verdictKey,
  } from '$lib/pages/addons/compat/compat.util.js';

  /**
   * The Compatibility card: the plugins and themes the API level gate refused (with Retry), the
   * addresses that changed, and the active theme's views that show a plugin's default look. The
   * game servers and nodes whose jar is too old are not here: each shows that on its own server
   * and node (serverProblems), and Settings -> Updates lists them before an update.
   *
   * @type {{ report?: ReturnType<typeof import('$lib/pages/addons/compat/compat.util.js').normalizeCompatibility>,
   *   theme?: any, api?: { reconcile: () => Promise<any> } }}
   */
  let { report = null, theme = null, api = null } = $props();

  const empty = {
    apiLevel: { min: null, current: null },
    resources: [],
    agents: [],
    externalUrls: [],
    reconcile: {},
  };

  /** The report a Retry brought back; until then the one the page loaded. */
  let refreshed = $state(null);
  let retrying = $state(false);

  const shown = $derived(refreshed ?? report ?? empty);
  const sections = $derived(cardSections(shown, theme));
  const refused = $derived([...sections.plugins, ...sections.themes]);
  const themeTarget = $derived(
    sections.themeViews?.theme?.id
      ? `${base}/view/detail/${encodeURIComponent(sections.themeViews.theme.id)}`
      : `${base}/view`,
  );

  const controller = createCompatibilityController({
    api: api ?? createCompatibilityApi(ApiUtil),
    report: null,
    notify: {
      success: (key, values) => showSuccessToast(key, values),
      error: (key, values) => showErrorToast(key, values),
    },
    onChange: (state) => {
      retrying = state.retrying;

      if (state.report) refreshed = state.report;
    },
  });

  function copyAddress(url) {
    if (copy(url)) {
      void showSuccessToast('components.compatibility-card.copied');
    } else {
      void showErrorToast('components.compatibility-card.copy-failed');
    }
  }
</script>
