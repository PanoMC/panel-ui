
<div class="w-100 vh-100 d-flex align-items-center blocks">
  <div class="m-auto p-3" style="max-width: 330px;">
    <div class="vstack gap-3">
      {#if data.accountConnected}
      <div
        class="d-inline-flex rounded justify-content-start align-items-start bg-primary ps-2 pt-2"
        style="width: 64px; height: 64px;">
        <img
          style="transform: rotate(-0.05turn);"
          src={base + '/assets/img/logo.svg'}
          width="auto"
          height="60"
          alt="Pano"
          title="Pano" />
      </div>

      <div class="row">
        <div class="col-auto min-h-100 d-flex align-items-center">
          <div class="spinner-border text-primary spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div class="col">
          <p class="text-muted mb-0">
            Store loading for {data.pageType}
          </p>
        </div>
      </div>
        {:else}
          Account not connected!
        {/if}
    </div>
  </div>
</div>


<script context="module">
  import { redirect } from "@sveltejs/kit";

  import { base } from "$app/paths";

  export const PageTypes = Object.freeze({
    ADDON: "ADDON",
    THEME: "THEME"
  });

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType) {
    const { parent, url: { searchParams }, } = event;
    await parent();

    const back = searchParams.has("back")

    const previousPage = base + `/` + (pageType === PageTypes.ADDON ? 'addons' : 'view')

    if (back) {
      throw redirect(302, previousPage);
    }

    const failedLogin = searchParams.has("failedLogin")

    if (failedLogin) {
      throw redirect(302, previousPage + "?failedLogin");
    }

    let accountConnected = true;

    return { pageType, accountConnected };
  }
</script>

<script>
  import { getContext, onMount, tick } from "svelte";

  import { page } from "$app/state";

  import { PANO_WEBSITE_URL } from "$lib/variables.js";
  import ApiUtil from "$lib/api.util.js";

  export let data;

  const showSplash = getContext("showSplash")

  onMount(async () => {
    while ($showSplash) {
      await tick();
    }

    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/platform/store/authorize/token`
    });

    if (getStoreTokenResponse.error) {
      data.accountConnected = false;

      return;
    }

    const { token, state } = getStoreTokenResponse.data;

    // Encode dynamic parts to ensure the URL is safe
    const storeAuthToken = encodeURIComponent(token);
    const encodedRedirectUrl = encodeURIComponent(
      page.url.origin + page.url.pathname,
    );
    const encodedState = encodeURIComponent(state);

    // Redirect to the constructed URL
    window.location = `${PANO_WEBSITE_URL}/auth?storeAuthorizeToken=${storeAuthToken}&panoCallback=${encodedRedirectUrl}&state=${encodedState}&type=${data.pageType}`;
  })
</script>