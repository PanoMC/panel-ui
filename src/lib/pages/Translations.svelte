<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a href="" class="btn btn-link" role="button" slot="left">
      <i class="fa-solid fa-earth-americas me-2"></i>
      Manage Languages
    </a>
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/translations" startsWith>Platform</CardMenuItem>
      <CardMenuItem href="/translations/themes" startsWith>Theme</CardMenuItem>
      <CardMenuItem href="/translations/addons" startsWith>Addons</CardMenuItem>
    </CardMenu>

    <div slot="right" class="hstack gap-2">
      <select class="form-select" name="selectLanguage" id="selectLanguage">
        <option selected value="en-us">English</option>
        <option value="tr">Turkish</option>
        <option value="ru">Russian</option>
      </select>
      <button class="btn btn-secondary disabled" disabled>Save</button>
    </div>
  </PageActions>

  <div class="card">
    <div class="card-body vstack gap-3">
      <CardHeader>
        <h5 class="card-title" slot="left">Platform Translations (307)</h5>
        <!-- Filters -->
        <CardFilters slot="right">
          <CardFiltersItem href="/" active>All</CardFiltersItem>
          <CardFiltersItem href="/">Original</CardFiltersItem>
          <CardFiltersItem href="/">Modified</CardFiltersItem>
        </CardFilters>
      </CardHeader>

      <div class="accordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseplatformTranslations">
              Panel
            </button>
          </h2>
          <div
            id="collapseplatformTranslations"
            class="accordion-collapse collapse show">
            <div class="accordion-body">
              <div class="row-cols-3 g-2 d-flex flex-nowrap">
                <label for="keyTranslation">Key</label>
                <label for="originalTranslation">Original</label>
                <label for="customTranslation">Custom</label>
                <label for=""></label>
              </div>
              <div
                class="input-group row-cols-3 d-flex flex-nowrap g-2 overflow-x-auto">
                <input
                  type="text"
                  class="form-control font-monospace"
                  id="keyTranslation" value="components.modals.confirm-disable-addon-will-cause-more-disable.title"/>
                <textarea
                  rows="2"
                  class="form-control"
                  id="originalTranslation"
                  value="{`Are you sure to disable "\{pluginId\}" addon?`}"/>
                <textarea
                  rows="2"
                  class="form-control border-danger"
                  id="customTranslation"
                  value="{`"\{pluginId}" eklentisini devre dışı bırakmak istediğinizden emin misiniz?`}"/>
              </div>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOtherTranslations">
              Other (1)
            </button>
          </h2>
          <div
            id="collapseOtherTranslations"
            class="accordion-collapse collapse">
            <div class="accordion-body">
              <div class="row-cols-3 g-2 d-flex flex-nowrap">
                <label for="keyTranslation">Key</label>
                <label for="originalTranslation">Original</label>
                <label for="customTranslation">Custom</label>
                <label for=""></label>
              </div>
              <div
                class="input-group row-cols-3 d-flex flex-nowrap g-2 overflow-x-auto">
                <input
                  type="text"
                  class="form-control font-monospace"
                  id="keyTranslation" value="DATA"/>
                <input
                  type="text"
                  class="form-control"
                  id="originalTranslation" />
                <input
                  type="text"
                  class="form-control border-danger"
                  id="customTranslation" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import CardFilters from "$lib/component/CardFilters.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";

  export let data
</script>
