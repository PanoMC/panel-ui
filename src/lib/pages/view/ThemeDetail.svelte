<script>
  import { getContext } from "svelte";

  const pageTitle = getContext("pageTitle");
  pageTitle.set("Tema Detayı");

  export let theme = {
    name: "Vanilla Theme",
    description: "Pano için sade ve özelleştirilebilir bir tema.",
    version: "1.0.0",
    author: "Ahmet Enes Duruer",
    screenshots: [
      "https://placehold.co/600x400?text=Screenshot+1",
      "https://placehold.co/600x400?text=Screenshot+2",
    ],
    installed: true,
    isActive: true
  };

  function uninstallTheme() {
    alert(`'${theme.name}' teması kaldırıldı!`);
  }

  function makeDefault() {
    alert(`'${theme.name}' artık varsayılan tema olarak ayarlandı.`);
  }
</script>

<div class="container py-4">

  <!-- TOP ACTIONS -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <a href="/panel/view" class="btn btn-link">
        <i class="fas fa-arrow-left me-2"></i> Temalar
      </a>
    </div>

    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-link text-danger" type="button" on:click={uninstallTheme} title="Temayı Kaldır">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>

  <!-- MAIN DETAIL SECTION -->
  <div class="row g-4">
    <!-- LEFT: Screenshots -->
    <div class="col-md-6">
      <div id="themeCarousel" class="carousel slide shadow-sm rounded overflow-hidden" data-bs-ride="carousel">
        <div class="carousel-inner">
          {#each theme.screenshots as src, i}
            <div class={"carousel-item" + (i === 0 ? " active" : "")}>
              <img src={src} class="d-block w-100" alt={`Screenshot ${i + 1}`} />
            </div>
          {/each}
        </div>
        {#if theme.screenshots.length > 1}
          <button class="carousel-control-prev" type="button" data-bs-target="#themeCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#themeCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        {/if}
      </div>
    </div>

    <!-- RIGHT: Details & Actions -->
    <div class="col-md-6">
      <div class="d-flex flex-column h-100 justify-content-between">
        <!-- Title & Status -->
        <div>
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h2>{theme.name}</h2>
            {#if theme.isActive}
              <span class="badge bg-success fs-6">Varsayılan Tema</span>
            {:else}
              <button class="btn btn-sm btn-outline-primary" on:click={makeDefault}>
                Varsayılan Yap
              </button>
            {/if}
          </div>
          <p class="text-muted">{theme.description}</p>
        </div>

        <!-- Metadata -->
        <ul class="list-group list-group-flush mb-3">
          <li class="list-group-item"><strong>Sürüm:</strong> {theme.version}</li>
          <li class="list-group-item"><strong>Yazar:</strong> {theme.author}</li>
        </ul>

        <!-- Actions -->
        <div class="d-flex flex-wrap gap-2">
          <a href={`/themes/${theme.name}`} target="_blank" class="btn btn-outline-dark">
            Mağazada Göster
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
