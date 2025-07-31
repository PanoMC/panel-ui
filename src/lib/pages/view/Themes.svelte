<!-- Theme Settings -->

<PageActions leftClasses="d-lg-flex d-none">
  <CardMenu slot="middle">
    <CardMenuItem href="/view">Temalar</CardMenuItem>
    <CardMenuItem href="/view/theme-options">Tema Seçenekleri</CardMenuItem>
  </CardMenu>
  <div slot="right" class="hstack gap-2">
    <button
      type="button"
      class="btn btn-primary"
      use:tooltip={[$_("buttons.refresh"), { placement: "bottom" }]}>
      <i class="fas fa-sync"></i>
    </button>
    <button type="button" class="btn btn-secondary">
      <i class="fas fa-plus me-2"></i>
      Tema Yükle
    </button>
  </div>
</PageActions>

<div class="card">
  <div class="card-body">
    {#if data.themes.length === 0}
      <NoContent />
    {/if}

    <div class="row">
      {#each data.themes as theme, index (theme)}
        <div class="col-xl-4 col-md-6">
          <a href="/panel/view/detail/vanilla-theme" title={$_("buttons.view")}>
            <div class="card text-white position-relative overflow-hidden">
              <img
                src="/api/panel/themes/{theme.id}/screenshots/screenshot.png"
                class="card-img"
                alt="Vanilla Theme Screenshot" />
              <div
                class="card-img-overlay d-flex flex-column justify-content-end p-3"
                style="background: linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0));">
                <h5 class="card-title">
                  {theme.id}<VerifiedStatus status={theme.verifyStatus} />
                </h5>
                <p class="card-subtitle text-light">
                  by <strong>{theme.author}</strong>
                </p>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="font-monospace user-select-all"
                    >{theme.version}</small>
                  {#if theme.active}
                    <span class="badge bg-success">Active</span>
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

<ConfirmDeleteThemeModal />

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

  import ConfirmDeleteThemeModal from "$lib/component/modals/ConfirmDeleteThemeModal.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import tooltip from "$lib/tooltip.util";
  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Temalar");
</script>
