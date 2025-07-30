<!-- Theme Settings -->

<PageActions>
  <CardMenu slot="middle">
    <CardMenuItem href="/view">Temalar</CardMenuItem>
    <CardMenuItem href="/view/theme-options">Tema Seçenekleri</CardMenuItem>
  </CardMenu>
  <div slot="right" class="hstack gap-2">
    <button type="button" class="btn btn-secondary ml-auto">
      <i class="fas fa-plus me-2"></i>
      Tema Yükle
    </button>
  </div>
</PageActions>

<div class="row">
  <div class="col-xl-4 col-md-6">
    <a href="#" title={$_("buttons.view")}>
      <div class="card text-white position-relative overflow-hidden">
        <img
          src="{base}/assets/img/vanilla.png"
          class="card-img"
          alt="Vanilla Theme Screenshot" />
        <div
          class="card-img-overlay d-flex flex-column justify-content-end p-3"
          style="background: linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0));">
          <h5 class="card-title">Vanilla Theme</h5>
          <p class="card-subtitle text-light">
            by <strong>Pano</strong>
          </p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="font-monospace user-select-all">v1.2.0</small>
            <span class="badge bg-success">Active</span>
          </div>
        </div>
      </div>
    </a>
  </div>
</div>

<ConfirmDeleteThemeModal />

<script>
  import { getContext } from "svelte";

  import { base } from "$app/paths";
  import { _ } from "svelte-i18n";

  import ConfirmDeleteThemeModal from "$lib/component/modals/ConfirmDeleteThemeModal.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Temalar");
</script>
