<!-- Updates Sub Page -->

<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <div slot="left">
      <span
        class="small"
        use:tooltip="{['Last Check', { placement: 'bottom' }]}">
        <i class="fa-regular fa-clock me-2"></i>
        DATE
      </span>
    </div>
    <div class="hstack gap-2" slot="right">
      <button type="button" class="btn btn-outline-primary">Update All</button>

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
    <a class="btn btn-outline-warning" type="button">
      <i class="fa-solid fa-power-off me-2"></i>
      Yeniden Başlat</a>
  </div>

  <div class="card">
    <div class="card-header">Platform Updates</div>
    <div class="card-body">
      <!-- Pending Update List -->
      <!-- No Posts -->
      <NoContent />
      <ul class="list-group">
        <!-- Update -->
        <li class="list-group-item">
          <div class="row">
            <div class="col">
              <h5 class="card-title">ID</h5>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm btn-outline-primary" type="button"
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

          <details>
            <summary>Changelog</summary>
            <p class="pt-3">CHANGELOG</p>
          </details>
        </li>
      </ul>
    </div>
  </div>

  <div class="card">
    <div class="card-header">Resource Updates</div>
    <div class="card-body">
      <NoContent
        icon="fas fa-sync fa-3x"
        text="Kaynak güncellemeleri alabilmek için lütfen Çevrimiçi Hesap bağlayın."
        dark="{false}">
      </NoContent>
    </div>
  </div>
</div>

<script>
  import { getContext } from "svelte";
  import tooltip from "$lib/tooltip.util";
  import PageActions from "$lib/component/PageActions.svelte";
  import NoContent from "$lib/component/NoContent.svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Güncellemeler");
</script>
