<style>
  .theme-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .theme-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 .75rem 1.5rem rgba(0,0,0,0.2);
  }
</style>

<!-- Theme Settings -->
<InstallResourceModal />

<PageActions leftClasses="d-lg-flex d-none">
  <CardMenu slot="middle">
    <CardMenuItem href="/view">{$_('buttons.themes')}</CardMenuItem>
    <CardMenuItem href="/view/theme-options">{$_('buttons.theme-settings')}</CardMenuItem>
  </CardMenu>
  <div slot="right" class="hstack gap-2">
    <button
      type="button"
      class="btn btn-outline-primary"
      class:active={reloading}
      use:tooltip={[$_("buttons.reload"), { placement: "bottom" }]}
      on:click={reloadThemes}>
      <i class="fas fa-sync" class:fa-spin={reloading}></i>
    </button>
    <button type="button" class="btn btn-secondary" on:click={() => showInstallResourceModal("THEME")}>
      <i class="fas fa-plus me-2"></i>
      {$_('buttons.install-theme')}
    </button>
  </div>
</PageActions>

<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.themes.card-title', {values: {amount: data.themes.length}})}
    </div>
  </CardHeader>
  <div class="card-body">
    {#if data.themes.length === 0}
      <NoContent />
    {/if}<div class="row g-4">
    {#each data.themes as theme}
      <div class="col-xl-4 col-md-6">
        <a href="{base}/view/detail/{theme.id}" class="text-decoration-none">
          <div
            class="card text-white position-relative overflow-hidden rounded-4 shadow-sm theme-card h-100">
            <img
              src="/api/panel/themes/{theme.id}/screenshots/{theme.screenshots[0] || 'screenshot.png'}"
              class="card-img"
              alt="{theme.title}" />
            <div
              class="card-img-overlay d-flex flex-column justify-content-end"
              style="background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0)); padding:1.25rem;">
              <h5 class="card-title mb-1">
                {theme.title} <VerifiedStatus status={theme.verifyStatus} />
              </h5>
              <p class="card-subtitle text-light mb-2">
                {@html $_('pages.themes.by', {values: {author: theme.author}})}
              </p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="font-monospace user-select-all">{theme.version}</small>
                {#if theme.active}
                  <span class="badge bg-success">{$_('pages.themes.active')}</span>
                {/if}
              </div>
            </div>
          </div>
        </a>
      </div>
    {/each}
  </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  export const PageTypes = Object.freeze({
    ALL: "ALL",
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
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

    const status = searchParams.get("status") || DefaultPageType;

    if (!Object.values(PageTypes).includes(status)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    const queryParams = buildQueryParams({ status });
    const body = await ApiUtil.get({
      path: `/api/panel/themes` + queryParams,
      request: event,
    });

    if (body.error) {
      throw error(500, body);
    }

    return { pageType: status, themes: body.data, meta: body.meta };
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { invalidate } from "$app/navigation";

  import tooltip from "$lib/tooltip.util";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import InstallResourceModal, {show as showInstallResourceModal} from "$lib/component/modals/InstallResourceModal.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  let reloading;

  pageTitle.set("pages.themes.title");

  async function reloadThemes() {
    reloading = true;

    await ApiUtil.put({
      path: `/api/panel/themes`,
    });

    await invalidate((_) => true)

    await showToast('components.toasts.reload-themes-success');

    reloading = false;
  }
</script>
