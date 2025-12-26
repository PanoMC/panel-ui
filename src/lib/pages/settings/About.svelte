<!-- About Sup Page -->
<div class="card">
  <div class="card-header">Pano Platform Info</div>
  <div class="card-body">
    <form class="animate__animated animate__fadeIn">
      <div class="row">
        <label class="col-md-6 col-form-label" for="panoVersion">
          {$_("pages.settings.about.version")}
        </label>
        <div class="col-md-6 col-form-label">
          <span class="user-select-all font-monospace" aria-describedby="panoVersion" id="panoVersion"
            >{data.platformVersion}</span>
        </div>
      </div>
      <div class="row">
        <label class="col-md-6 col-form-label" for="siteKeywords">
          {$_("pages.settings.about.release")}
        </label>
        <div class="col-md-6 col-form-label">
          <span aria-describedby="panoRelease" id="panoRelease"
            >{data.platformStage}</span>
        </div>
      </div>
      <div class="row mb-0">
        <label class="col-md-6 col-form-label" for="siteKeywords">
          {$_("pages.settings.about.website")}
        </label>
        <div class="col-md-6 col-form-label">
          <a
            aria-describedby="panoWebsite"
            href={PANO_WEBSITE_URL}
            id="panoWebsite"
            target="_blank">
            {getDomain(PANO_WEBSITE_URL)}
            <i class="fa-solid fa-up-right-from-square ms-2"></i>
          </a>
        </div>
      </div>
      <div class="row mb-0">
        <label class="col-md-6 col-form-label" for="siteKeywords">
          {$_("pages.settings.about.discord")}
        </label>
        <div class="col-md-6 col-form-label">
          <a
            aria-describedby="panoWebsite"
            href="{PANO_WEBSITE_URL}/discord"
            id="panoWebsite"
            target="_blank">
            {getDomain(PANO_WEBSITE_URL)}/discord
            <i class="fa-solid fa-up-right-from-square ms-2"></i>
          </a>
        </div>
      </div>
    </form>
  </div>
</div>

<div class="card">
  <div class="card-header">
    <span
      class="animate__animated animate__heartBeat animate__slower d-inline-block">
      {$_("pages.settings.about.open-source-licenses")} ❤️
    </span>
  </div>
  <div class="card-body animate__animated animate__fadeIn">
    {#if licenses && licenses.length > 0}
      <div class="list-group">
        {#each licenses as license}
          <details class="list-group-item">
            <summary class="d-flex justify-content-between align-items-center list-unstyled mb-0">
              <div class="d-flex align-items-center flex-wrap gap-2">
                <i class="fa-solid fa-chevron-right me-2"></i>
                <strong class="me-2">{license.name}</strong>
                <span class="small">v{license.version}</span>
                {#if license.license && license.license !== 'Unknown'}
                  <span class="badge text-bg-primary">{license.license}</span>
                {/if}
              </div>
              {#if license.homepage}
                <a
                  href={license.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-decoration-none ms-2"
                  aria-label="Open {license.name} homepage"
                  onclick={(e) => e.stopPropagation()}>
                  <i class="fa-solid fa-external-link"></i>
                </a>
              {/if}
            </summary>
            <div class="pt-3">
            {#if license.author}
              <p class="mb-2">
                <strong>{$_("pages.settings.about.author")}:</strong> {license.author}
              </p>
            {/if}
            {#if license.repository}
              <p class="mb-2">
                <strong>{$_("pages.settings.about.repository")}:</strong>
                <a href={license.repository} target="_blank" rel="noopener noreferrer" class="ms-1">
                  {license.repository}
                  <i class="fa-solid fa-up-right-from-square ms-1"></i>
                </a>
              </p>
            {/if}
            {#if license.licenseText}
              <pre class="bg-body-secondary p-3 rounded small border" style="max-height: 300px; overflow-y: auto;"><code class="text-body">{license.licenseText}</code></pre>
            {:else}
              <p>
                <strong>{$_("pages.settings.about.license")}:</strong> {license.license}
              </p>
            {/if}
            </div>
          </details>
        {/each}
      </div>
    {:else}
      <p>{$_("pages.settings.about.no-licenses")}</p>
    {/if}
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util";

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const queryParams = buildQueryParams({
      type: "ABOUT",
    });

    const apiData = await ApiUtil.get({
      path: "/api/panel/settings" + queryParams,
      request: event,
    });

    // Load licenses from the endpoint
    let licenses = [];
    try {
      const licensesResponse = await ApiUtil.get({
        path: "/api/panel/licenses/oss",
        request: event,
      });

      licenses = licensesResponse.data

      // If an error is returned, fall back to an empty array
      if (!Array.isArray(licenses)) {
        licenses = [];
      }
    } catch (e) {
      console.log(e)
      console.warn("Lisans dosyası bulunamadı. Lütfen 'npm run generate-licenses' komutunu çalıştırın.");
    }

    return {
      ...apiData,
      licenses
    };
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { PANO_WEBSITE_URL } from "$lib/variables.js";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.settings.about.title");

  const licenses = data.licenses || [];

  function getDomain(url) {
    try {
      // Create a URL object to extract the hostname
      const urlObj = new URL(url);
      return urlObj.hostname; // Returns only the domain name (without protocol or path)
    } catch (e) {
      // If URL constructor fails (e.g., invalid URL), remove protocol using regex
      return url.replace(/^https?:\/\//, "");
    }
  }
</script>
