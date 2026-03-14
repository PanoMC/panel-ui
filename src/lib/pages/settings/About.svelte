<div class="row g-3">
  <div class="col-lg-6 order-2 order-lg-1">
    <!-- About Sup Page -->
    <div class="card">
      <div class="card-header">{$_('pages.settings.about.info')}</div>
      <div class="card-body">
        <form>
          <div class="row">
            <label class="col-md-6 col-form-label" for="panoVersion">
              {$_('pages.settings.about.version')}
            </label>
            <div class="col-md-6 col-form-label">
              <span
                class="user-select-all font-monospace"
                aria-describedby="panoVersion"
                id="panoVersion">{data.platformVersion}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary ms-2"
                onclick={() => showWhatsNewModal(false)}>
                <i class="fa-solid fa-magic-wand-sparkles me-1"></i>
                {$_('components.whats-new.title')}
              </button>
            </div>
          </div>
          <div class="row">
            <label class="col-md-6 col-form-label" for="siteKeywords">
              {$_('pages.settings.about.release')}
            </label>
            <div class="col-md-6 col-form-label">
              <span aria-describedby="panoRelease" id="panoRelease">{data.platformStage}</span>
            </div>
          </div>
          <div class="row mb-0">
            <label class="col-md-6 col-form-label" for="siteKeywords">
              {$_('pages.settings.about.website')}
            </label>
            <div class="col-md-6 col-form-label">
              <a
                class="btn btn-sm btn-link px-0 text-decoration-none"
                aria-describedby="panoWebsite"
                aria-label={$_('pages.settings.about.website')}
                href={PANO_WEBSITE_URL}
                id="panoWebsite"
                use:tooltip={[$_('pages.settings.about.website'), { placement: 'bottom' }]}
                target="_blank">
                <i class="fa-solid fa-up-right-from-square"></i>
              </a>
            </div>
          </div>
          <div class="row mb-0">
            <label class="col-md-6 col-form-label" for="siteKeywords">
              {$_('pages.settings.about.discord')}
            </label>
            <div class="col-md-6 col-form-label">
              <a
                class="btn btn-sm btn-link px-0 text-decoration-none"
                aria-describedby="panoWebsite"
                aria-label="Discord"
                href="{PANO_WEBSITE_URL}/discord"
                id="panoWebsite"
                use:tooltip={['Discord', { placement: 'bottom' }]}
                target="_blank">
                <i class="fab fa-discord fa-lg"></i>
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
  <div class="col-lg-6 order-1 order-lg-2">
    <a
      href="{PANO_WEBSITE_URL}/source-code"
      target="_blank"
      class="alert alert-primary h-100 mb-0 d-flex flex-column blocks text-decoration-none border-primary hover-shadow">
      <h5 class="alert-heading">{$_('pages.settings.about.support-pano')} ❤️</h5>
      <p class="mb-0">
        {$_('pages.settings.about.support-pano-text')}
      </p>
      <div class="mt-auto d-flex align-items-center justify-content-between border-top border-primary border-opacity-25 pt-2">
        <div class="d-flex align-items-center text-primary">
          <i class="fa-brands fa-github fa-2x me-2"></i>
          <span class="fw-bold">{$_('pages.settings.about.support-pano-button')}</span>
        </div>
        <i class="fa-solid fa-arrow-up-right-from-square text-primary"></i>
      </div>
    </a>
  </div>
</div>

<div class="card">
  <div class="card-header">
    {$_('pages.settings.about.open-source-licenses')}
  </div>
  <div class="card-body">
    {#if licenses && licenses.length > 0}
      <div class="list-group">
        {#each licenses as license}
          <details class="list-group-item">
            <summary class="d-flex justify-content-between align-items-center list-unstyled mb-0">
              <div class="d-flex align-items-center flex-wrap gap-2 text-break">
                <i class="fa-solid fa-chevron-right me-2"></i>
                <strong class="me-2">{license.name}</strong>
                <span class="small">v{license.version}</span>
              </div>
              {#if license.homepage}
                <a
                  href={license.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-decoration-none ms-2"
                  aria-label={$_('pages.settings.about.open-homepage', { values: { name: license.name } })}
                  onclick={(e) => e.stopPropagation()}>
                  <i class="fa-solid fa-external-link"></i>
                </a>
              {/if}
            </summary>
            <div class="pt-3">
              {#if license.author}
                <p class="mb-2">
                  <strong>{$_('pages.settings.about.author')}:</strong>
                  {license.author}
                </p>
              {/if}
              {#if license.repository}
                <p class="mb-2">
                  <strong>{$_('pages.settings.about.repository')}:</strong>
                  <a
                    href={license.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ms-1 text-break">
                    {license.repository}
                    <i class="fa-solid fa-up-right-from-square ms-1"></i>
                  </a>
                </p>
              {/if}
              {#if license.licenseText}
                <pre
                  class="bg-body-secondary p-3 rounded small border"
                  style="max-height: 300px; overflow: auto;"><code class="text-body"
                    >{license.licenseText}</code></pre>
              {:else}
                <p>
                  <strong>{$_('pages.settings.about.license')}:</strong>
                  {license.license}
                </p>
              {/if}
            </div>
          </details>
        {/each}
      </div>
    {:else}
      <p>{$_('pages.settings.about.no-licenses')}</p>
    {/if}
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util';

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const queryParams = buildQueryParams({
      type: 'ABOUT',
    });

    const apiData = await ApiUtil.get({
      path: '/api/panel/settings' + queryParams,
      request: event,
    });

    // Load licenses from the endpoint
    let licenses = [];
    try {
      const licensesResponse = await ApiUtil.get({
        path: '/api/panel/licenses/oss',
        request: event,
      });

      licenses = licensesResponse.data;

      // If an error is returned, fall back to an empty array
      if (!Array.isArray(licenses)) {
        licenses = [];
      }
    } catch (e) {
      console.log(e);
      console.warn(
        "Lisans dosyası bulunamadı. Lütfen 'npm run generate-licenses' komutunu çalıştırın.",
      );
    }

    return {
      ...apiData,
      licenses,
    };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import tooltip from '$lib/tooltip.util';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import { show as showWhatsNewModal } from '$lib/components/modals/WhatsNewModal.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.settings.about.title');

  const licenses = data.licenses || [];

  function getDomain(url) {
    try {
      // Create a URL object to extract the hostname
      const urlObj = new URL(url);
      return urlObj.hostname; // Returns only the domain name (without protocol or path)
    } catch (e) {
      // If URL constructor fails (e.g., invalid URL), remove protocol using regex
      return url.replace(/^https?:\/\//, '');
    }
  }
</script>
