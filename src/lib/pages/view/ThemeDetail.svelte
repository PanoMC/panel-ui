<div class="container">
  <!-- Action Menu -->
  <section
    class="row justify-content-between align-items-center mb-3 animate__animated animate__slideInUp">
    <div class="col-auto">
      <a href="/panel/view" class="btn btn-link" role="button">
        <i class="fas fa-arrow-left me-2"></i>
        Temalar
      </a>
    </div>
    <div class="col-auto d-flex align-items-center">
      <button class="btn btn-link text-danger" type="button">
        <i class="fas fa-trash"></i>
      </button>
      <button class="btn btn-link" type="button">
        <i class="fa-solid fa-eraser"></i>
      </button>
      <button class="btn btn-link" type="button">
        <i class="fa-solid fa-arrows-rotate"></i>
      </button>

      <div class="form-check form-switch mb-0 mx-2">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="addonStatusSwitch"
          checked />
        <label class="form-check-label" for="addonStatusSwitch">Aktif</label>
      </div>
    </div>
  </section>
</div>

<script>
  import { getContext } from "svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Eklenti Detayı");
</script>
