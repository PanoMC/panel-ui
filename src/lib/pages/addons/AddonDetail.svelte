<div class="container py-4">
  <!-- Action Menu -->
  <section
    class="row justify-content-between align-items-center mb-3 animate__animated animate__slideInUp"
  >
    <div class="col-auto">
      <a href="/panel/addons" class="btn btn-link" role="button">
        <i class="fas fa-arrow-left me-2"></i>
        Eklentiler
      </a>
    </div>
    <div class="col-auto d-flex align-items-center gap-2">
      <button class="btn btn-link text-danger" type="button" on:click={uninstallAddon}>
        <i class="fas fa-trash"></i>
      </button>
      <button class="btn btn-link" type="button">
        <i class="fa-solid fa-eraser"></i>
      </button>
      <button class="btn btn-link" type="button">
        <i class="fa-solid fa-arrows-rotate"></i>
      </button>
    </div>
  </section>

  <!-- Addon Details -->
  <div class="card shadow-lg border-0">
    <div class="row g-0">
      <div class="col-md-3 d-flex justify-content-center align-items-center bg-light p-4">
        <img
          src={addon.icon}
          class="img-fluid"
          alt="Eklenti ikonu"
          style="max-width: 100px; max-height: 100px"
        />
      </div>

      <div class="col-md-9">
        <div class="card-body">
          <h3 class="card-title d-flex align-items-center gap-2">
            {addon.name}
            {#if addon.verified}
              <i
                class="fa-solid fa-circle-check text-success"
                title="Pano tarafından doğrulandı"
              ></i>
            {/if}
          </h3>
          <p class="text-muted">{addon.description}</p>

          <ul class="list-group list-group-flush my-3">
            <li class="list-group-item">
              <strong>Sürüm:</strong> {addon.version}
            </li>
            <li class="list-group-item">
              <strong>Yazar:</strong> {addon.author}
            </li>
            <li class="list-group-item">
              <strong>Lisans:</strong> {addon.license}
            </li>
            <li class="list-group-item">
              <strong>Kaynak Kodu:</strong>
              <a href={addon.sourceCodeUrl} target="_blank">{addon.sourceCodeUrl}</a>
            </li>
            <li class="list-group-item">
              <strong>Dosya Hash:</strong>
              <code class="text-break d-block">{addon.hash}</code>
            </li>
          </ul>

          <div class="d-flex gap-2">
            <a
              class="btn btn-outline-dark"
              href={`/addons/${addon.name}`}
              target="_blank"
            >
              Mağazada Göster
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
    } = event;
    await parent();

    const addonId = event.params.addonId;

    const body = await ApiUtil.get({
      path: `/api/panel/plugins/${addonId}`,
      request: event,
    });

    if (body.error === "NOT_FOUND") {
      throw error(404, body.error);
    }

    return { addon: body.data };
  }
</script>

<script>
  import { getContext } from "svelte";

  export let data;

  const pageTitle = getContext("pageTitle");
  pageTitle.set("Eklenti Detayı");

  export let addon = {
    name: "Example Addon",
    description: "Sunucunuza yeni özellikler eklemenizi sağlar.",
    version: "1.2.3",
    author: "Ahmet Enes Duruer",
    icon: "https://placehold.co/100x100?text=Icon",
    license: "MIT",
    sourceCodeUrl: "https://github.com/example/pano-addon",
    verified: true,
    hash: "8a7b1c309e4d8cd238b1f16fcd2b9f3a04ae5bbf"
  };

  function uninstallAddon() {
    alert(`'${addon.name}' eklentisi kaldırıldı!`);
  }
</script>
