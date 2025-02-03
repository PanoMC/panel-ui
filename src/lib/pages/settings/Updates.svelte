<!-- Updates Sub Page -->

<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <div slot="left">
      <span
        class="small"
        use:tooltip="{['Last Check', { placement: 'bottom' }]}">
        <i class="fa-regular fa-clock me-2"></i>
        DATE
      </span>
    </div>
    <button type="button" class="btn btn-secondary">
      <i class="fas fa-rotate me-2"></i>
      Check Updates
    </button>
    <div slot="right">
      <button type="button" class="btn btn-link">Update All</button>

      <button class="btn btn-secondary">
        <i class="fa-regular fa-arrows-rotate me-2"></i> Check Updates
      </button>
    </div>
  </PageActions>

  <div
    class="alert alert-warning animate__animated animate__slideInUp mb-0"
    role="alert">
    <h5 class="alert-heading">Yenide başlat</h5>

    <p>
      Platform güncellemesinin uygulanabilmesi için yeniden başlatma gerekiyor.
    </p>
    <p>
      Tahmini süre: <b>TIME</b>
    </p>
    <button class="btn btn-outline-primary" type="button">
      <i class="fa-solid fa-power-off me-2"></i>
      Yeniden Başlat</button>
  </div>

  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">Platform Updates (1)</h5>
      </CardHeader>

      <!-- Pending Update List -->
      <!-- No Posts -->
      <NoContent />
      <ul class="list-group">
        <!-- Update -->
        <li class="list-group-item">
          <div class="row">
            <div class="col">
              <a href="/">
                <h5 class="card-title d-inline-block">ID</h5>
              </a>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm btn-secondary" type="button"
                >Update</button>
            </div>
            <div class="col-auto ps-0">
              <a
                href="#"
                tabindex="0"
                class="link-danger"
                data-bs-toggle="popover"
                data-bs-trigger="focus"
                data-bs-custom-class="font-monospace"
                data-bs-title="Error Log"
                data-bs-content="ERR LOG">
                <i class="fa-solid fa-circle-exclamation fa-1x"></i>
              </a>
            </div>
          </div>
          <small class="text-muted">
            <span class="font-monospace">TYPE</span>
            <div class="vr mx-2"></div>
            <span class="font-monospace"
              >OLDV <i class="fa-solid fa-caret-right"></i> NEWV</span>
            <div class="vr mx-2"></div>
            <span class="font-monospace">SIZE</span>
            <div class="vr mx-2"></div>
            <span class="font-monospace text-black">INSTALLING...</span>
            <span class="font-monospace text-black">DOWNLOADING...</span>
          </small>
          <span class="font-monospace">
            <div
              class="progress my-3"
              role="progressbar"
              aria-label="Example 1px high"
              aria-valuenow="25"
              aria-valuemin="0"
              aria-valuemax="100"
              style="height: 3px">
              <div class="progress-bar bg-secondary" style="width: 25%"></div>
            </div>
          </span>

          <details>
            <summary>Changelog</summary>
            <p class="pt-3">CHANGELOG</p>
          </details>
        </li>
      </ul>
    </div>
  </div>

  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">Resource Updates</h5>
        <!-- Filters -->
        <CardFilters slot="right">
          <CardFiltersItem href="/" active>Tümü</CardFiltersItem>
          <CardFiltersItem href="/">Eklentiler</CardFiltersItem>
          <CardFiltersItem href="/">Temalar</CardFiltersItem>
        </CardFilters>
      </CardHeader>

      <!-- Pending Update List -->
      <NoContent
        icon="fas fa-sync fa-3x"
        text="Kaynak güncellemeleri alabilmek için lütfen Çevrimiçi Hesap bağlayın."
        dark="{false}">
        <a href="/panel/settings/platform" class="btn btn-primary btn-sm">
          Platform Settings
        </a>
      </NoContent>
    </div>
  </div>
</div>

<script>
  import { getContext } from "svelte";
  import tooltip from "$lib/tooltip.util";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardFilters from "$lib/component/CardFilters.svelte";
  import NoContent from "$lib/component/NoContent.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Güncellemeler");
</script>
