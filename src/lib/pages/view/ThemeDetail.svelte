<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <a slot="left" href="/panel/view" class="btn btn-link">
      <i class="fas fa-arrow-left me-2"></i> Temalar
    </a>

    <div class="hstack gap-2" slot="right">
      <button
        aria-label="Uninstall Theme"
        class="btn btn-link text-danger"
        type="button"
        on:click={uninstallTheme}
        title="Temayı Kaldır">
        <i class="fas fa-trash"></i>
      </button>
      <a
        href={`/themes/${theme.name}`}
        target="_blank"
        class="btn btn-outline-primary">
        <i class="fas fa-store me-2"></i>
        Mağazada Göster
      </a>
      <button disabled class="btn btn-secondary" on:click={makeDefault}>
        Kullan
      </button>
    </div>
  </PageActions>

  <div class="row">
    <div class="col-md-6">
      <div
        id="themeCarousel"
        class="carousel slide rounded overflow-hidden"
        data-bs-ride="carousel">
        <div class="carousel-inner">
          {#each theme.screenshots as src, i}
            <div class={"carousel-item" + (i === 0 ? " active" : "")}>
              <img
                src={src}
                class="d-block w-100"
                alt={`Screenshot ${i + 1}`} />
            </div>
          {/each}
        </div>
        {#if theme.screenshots.length > 1}
          <button
            class="carousel-control-prev"
            type="button"
            data-bs-target="#themeCarousel"
            data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button
            class="carousel-control-next"
            type="button"
            data-bs-target="#themeCarousel"
            data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        {/if}
      </div>
    </div>

    <div class="col-md-6">
      <div class="d-flex flex-column h-100 justify-content-between">
        <!-- Title & Status -->
        <div>
          <div class="d-flex justify-content-between align-items-start">
            <h2>{theme.name}</h2>
            {#if theme.isActive}
              <span class="badge text-bg-secondary">Kullanılan Tema</span>
            {:else}
              <button
                class="btn btn-sm btn-outline-primary"
                on:click={makeDefault}>
                Varsayılan Yap
              </button>
            {/if}
          </div>
          <p class="text-muted">{theme.description}</p>
        </div>

        <!-- Metadata -->
        <ul class="list-group">
          <div
            class="list-group-item d-flex justify-content-between align-items-center">
            <strong>ID:</strong>
            <span class="font-monospace user-select-all">
              {theme.id || "Bilinmiyor"}</span>
          </div>
          <li
            class="list-group-item d-flex justify-content-between align-items-center">
            <strong>Sürüm:</strong>
            <span class="user-select-all font-monospace">{theme.version}</span>
          </li>
          <li
            class="list-group-item d-flex justify-content-between align-items-center">
            <strong>Yazar:</strong>
            <a target="_blank" href="#"
              >{theme.author}
              <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
            </a>
          </li>
          <div
            class="list-group-item d-flex justify-content-between align-items-center">
            <strong>Lisans:</strong>
            {theme.license || "Bilinmiyor"}
          </div>
          <div
            class="list-group-item d-flex justify-content-between align-items-center">
            <strong>Kaynak:</strong>
            <a href="#" target="_blank">
              {theme.source || "Bilinmiyor"}
              <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
            </a>
          </div>
        </ul>
      </div>
    </div>
  </div>
</div>

<script>
  import PageActions from "$lib/component/PageActions.svelte";
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
    isActive: true,
  };

  function uninstallTheme() {
    alert(`'${theme.name}' teması kaldırıldı!`);
  }

  function makeDefault() {
    alert(`'${theme.name}' artık varsayılan tema olarak ayarlandı.`);
  }
</script>
