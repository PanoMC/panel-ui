<div class="w-100 flex-grow-1 h-100 d-flex align-items-center">
  <div class="container">
    <div class="col-lg-6 mx-auto">
      <img
        alt={$_('pages.error.title', { values: { status: $page.status } })}
        class="img-fluid d-block m-auto"
        src="{base}/assets/img/404.png"
        width="280" />

      <div class="alert alert-danger d-flex align-items-start" role="alert">
        <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
        <div>{$_('page-error.' + $page.status) || $page.error.message}</div>
      </div>
    </div>
  </div>
</div>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { page } from '$app/stores';
  import { base } from '$app/paths';

  const pageTitle = getContext('pageTitle');

  pageTitle.set($_('pages.error.title', { values: { status: $page.status } }));
</script>
