<!-- 404 Page  -->
<div class="container">
  <div class="alert alert-danger animated bounceInDown" role="alert">
    {$_("page-error." + $page.status) || $page.error.message}
  </div>

  <img
    alt="{$_('pages.error.title', { values: { status: $page.status } })}"
    class="img-fluid d-block m-auto"
    src="{base}/assets/img/404.png"
    width="280" />
</div>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { page } from "$app/stores";
  import { base } from "$app/paths";

  const pageTitle = getContext("pageTitle");

  pageTitle.set($_("pages.error.title", { values: { status: $page.status } }));
</script>
