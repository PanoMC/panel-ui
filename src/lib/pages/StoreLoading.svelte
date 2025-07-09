
<div class="w-100 vh-100 d-flex align-items-center blocks">
  <div class="m-auto p-3" style="max-width: 330px;">
    <div class="vstack gap-3">
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
    </div>
  </div>
</div>


<script context="module">
  export const PageTypes = Object.freeze({
    ADDON: "ADDON",
    THEME: "THEME"
  });

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType) {
    const { parent } = event;
    await parent();

    return { pageType };
  }
</script>

<script>
  import { base } from "$app/paths";

  export let data;
</script>