<style lang="scss">
  @import '../../../pano-sdk/core/scss/custom-bootstrap.scss';

  .theme-card {
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }
  .theme-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: $box-shadow-sm;
  }
  .overlay-gradient {
    background: linear-gradient(
      to top,
      rgba(var(--bs-body-bg-rgb), 0.9),
      rgba(var(--bs-body-bg-rgb), 0)
    ) !important;
  }
  :global([data-bs-theme='dark']) .overlay-gradient {
    background: linear-gradient(
      to top,
      rgba(var(--bs-dark-rgb), 0.8),
      rgba(var(--bs-dark-rgb), 0)
    ) !important;
  }
  .object-fit-cover {
    object-fit: cover;
  }
</style>

<!-- Theme Settings -->
<InstallResourceModal />

{#if data.failedLogin}
  <FailedLoginPanoStoreAlert />
{/if}

{#snippet right()}
  <button
    type="button"
    title={$_('buttons.reload')}
    aria-label={$_('buttons.reload')}
    class="btn btn-link"
    class:active={reloading}
    onclick={reloadThemes}>
    <i class="fas fa-sync" class:fa-spin={reloading}></i>
  </button>
  <button type="button" class="btn btn-secondary" onclick={() => showInstallResourceModal('THEME')}>
    <i class="fas fa-plus"></i>
    <span class="d-lg-inline d-none ms-2">{$_('buttons.install-theme')}</span>
  </button>
{/snippet}

<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.themes.card-title', {
        values: { amount: data.themes.length },
      })}
    </div>
    <div slot="middle" style="width: 250px;">
      <SearchInput
        initialValue={search}
        searching={isSearching}
        debounceMs={500}
        onchange={onSearchInput} />
    </div>
  </CardHeader>
  <div class="card-body">
    {#if data.themes.length === 0}
      <NoContent />
    {/if}
    <div class="row row-cols-xl-2 row-cols-1 g-3">
      {#each data.themes as theme}
        <div class="col">
          <a href="{base}/view/detail/{theme.id}" class="text-decoration-none">
            <div class="card rounded-4 position-relative overflow-hidden theme-card">
              <div class="ratio ratio-16x9">
                <img
                  src="/api/panel/themes/{theme.id}/screenshots/{getFirstScreenshotUrl(theme) ||
                    'screenshot.png'}"
                  class="card-img-top object-fit-cover"
                  style="background-color: #eee;"
                  alt={theme.title} />
              </div>

              <div
                class="card-img-overlay d-flex flex-column justify-content-end p-3 overlay-gradient">
                <h5
                  class="card-title mb-1 text-truncate d-flex align-items-center gap-2"
                  title={theme.title}>
                  <span class="text-truncate">{theme.title}</span>
                  <VerifiedStatus status={theme.verifyStatus} />
                </h5>

                <small class="mb-2 text-truncate opacity-75">
                  {@html $_('pages.themes.by', {
                    values: { author: theme.author },
                  })}
                </small>

                <div class="d-flex justify-content-between align-items-center mt-2">
                  <div class="d-flex gap-2">
                    <small class="font-monospace user-select-all opacity-75">
                      <i class="fa-solid fa-file fa-fw me-1"></i>{formatBytes(theme.size)}
                    </small>
                    <small class="font-monospace user-select-all opacity-75">
                      <i class="fa-solid fa-code fa-fw me-1"></i>{theme.version}
                    </small>
                  </div>
                  <div class="hstack gap-2">
                    {#if theme.active}
                      <span class="badge text-bg-success">{$_('pages.themes.active')}</span>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Fake Update Indicator -->
              <button
                type="button"
                class="position-absolute top-0 end-0 m-3 btn btn-sm btn-primary rounded-circle shadow-sm"
                title={$_('pages.themes.update-available')}
                aria-label={$_('pages.themes.update-available')}
                onclick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goto(`${base}/settings/updates`);
                }}>
                <i class="fas fa-sync text-white"></i>
              </button>
            </div>
          </a>
        </div>
      {/each}
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { error } from '@sveltejs/kit';

  export const PageTypes = Object.freeze({
    ALL: 'ALL',
    ACTIVE: 'ACTIVE',
    DISABLED: 'DISABLED',
  });

  export const DefaultPageType = PageTypes.ALL;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const status = searchParams.get('status') || DefaultPageType;
    const search = searchParams.get('search');
    const failedLogin = searchParams.has('failedLogin');

    if (!Object.values(PageTypes).includes(status)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    const queryParams = buildQueryParams({ status, search });
    const body = await ApiUtil.get({
      path: `/api/panel/themes` + queryParams,
      request: event,
    });

    if (body.error) {
      throw error(500, body.error);
    }

    return {
      pageType: status,
      themes: body.data,
      meta: body.meta,
      failedLogin,
    };
  }

  export const originalThemeMenuItems = [
    {
      href: '/view',
      text: 'buttons.themes',
    },
    {
      href: '/view/theme-settings',
      text: 'buttons.theme-settings',
    },
  ];
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import SearchInput from '$lib/component/SearchInput.svelte';
  import { goto, invalidate } from '$app/navigation';
  import { formatBytes } from '$lib/string.util.js';

  import tooltip from '$lib/tooltip.util';
  import { show as showToast } from '$lib/component/ToastContainer.svelte';

  import PageActions from '$lib/component/PageActions.svelte';
  import NoContent from '$lib/component/NoContent.svelte';
  import VerifiedStatus from '$lib/component/VerifiedStatus.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import InstallResourceModal, {
    show as showInstallResourceModal,
  } from '$lib/component/modals/InstallResourceModal.svelte';
  import { themeMenuItems } from '$lib/PluginAPI.js';
  import FailedLoginPanoStoreAlert from '$lib/component/FailedLoginPanoStoreAlert.svelte';

  export let data;

  let search = '';
  let isSearching = false;

  function onSearchInput(event) {
    search = event.detail.value;
    refreshData();
  }

  async function refreshData() {
    isSearching = true;
    const queryParams = buildQueryParams({
      status: data.pageType,
      search: search || undefined,
    });

    await goto(`${base}/view${queryParams}`, { invalidateAll: true, keepFocus: true });
    isSearching = false;
  }

  const pageTitle = getContext('pageTitle');

  let reloading;

  pageTitle.set('pages.themes.title');

  async function reloadThemes() {
    reloading = true;

    await ApiUtil.put({
      path: `/api/panel/themes`,
    });

    await invalidate((_) => true);

    await showToast('components.toasts.reload-themes-success');

    reloading = false;
  }

  function getFirstScreenshotUrl(theme) {
    const keys = Object.keys(theme.screenshots);

    if (keys.length === 0) {
      return null;
    }

    const firstKey = keys[0];

    return `${firstKey}?hash=${theme.screenshots[firstKey]}`;
  }

  const slots = getContext('layout-slots');
  Object.assign(slots, { right });
</script>
