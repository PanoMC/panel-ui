<!-- Theme Settings -->

<PageActions>
  <CardMenu slot="middle">
    <CardMenuItem href="/view">Temalar</CardMenuItem>
    <CardMenuItem href="/view/theme-options">Tema Seçenekleri</CardMenuItem>
  </CardMenu>
  <div slot="right" class="hstack gap-2">
    <a href="{base}/view/store" class="btn btn-outline-primary">
      <img
        src="{base}/assets/img/logo.svg"
        width="20"
        height="20"
        class="me-2 bg-dark p-1 rounded"
        alt="Pano" />
      <small>Pano Mağaza'dan Yükle</small>
    </a>
    <button type="button" class="btn btn-secondary ml-auto">
      <i class="fas fa-plus me-2"></i>
      Tema Yükle
    </button>
  </div>
</PageActions>

<ConfirmDeleteThemeModal />

<script>
  import { getContext } from "svelte";

  import { base } from "$app/paths";

  import ConfirmDeleteThemeModal from "$lib/component/modals/ConfirmDeleteThemeModal.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Temalar");
</script>
