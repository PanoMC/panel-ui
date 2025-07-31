<div class="card animate__animated animate__fadeIn">
  <div class="card-header">
    Minecraft
  </div>
  <div class="card-body">
    <div class="row">
      <label class="col-md-4 col-form-label" for="loginIntergration">
        <p>Giriş Entegrasyonu</p>
        <small class="text-muted">Description of login integration here.</small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="loginIntergration" />
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import { getContext } from "svelte";

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Oyun Entegrasyon Ayarları");
</script>
