
<PageActions>
  <CardMenu slot="middle">
    <CardMenuItem href="/view">Temalar</CardMenuItem>
    <CardMenuItem href="/view/theme-options">Tema Seçenekleri</CardMenuItem>
  </CardMenu>
</PageActions>

<script>
  import { getContext } from "svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Tema Ayarları");
</script>
