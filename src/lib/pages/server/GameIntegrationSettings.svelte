<div class="card animate__animated animate__fadeIn">
  <div class="card-header">
    Minecraft
  </div>
  <div class="card-body">
    <div class="row">
      <label class="col-md-4 col-form-label" for="authIntegration">
        Auth Integration
        <small class="d-block">Let Pano hook into auth plugins in "Fabric". <a href="" target="_blank">See Docs <i class="fas fa-external-link"></i></a></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="authIntegration" />
        </div>
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label" for="banIntegration">
        Ban Integration
        <small class="d-block">Let Pano hook into ban plugins in "Fabric". <a href="" target="_blank">See Docs <i class="fas fa-external-link"></i></a></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="banIntegration" />
        </div>
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label" for="permissionIntegration">
        Permission Integration
        <small class="d-block">Let Pano hook into permission plugins in "Fabric". <a href="" target="_blank">See Docs <i class="fas fa-external-link"></i></a></small>
      </label>
      <div class="col col-form-label">
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="permissionIntegration" />
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
