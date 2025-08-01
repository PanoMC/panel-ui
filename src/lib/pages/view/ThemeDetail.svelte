<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <a slot="left" href="{base}/view" class="btn btn-link">
      <i class="fas fa-arrow-left me-2"></i> Temalar
    </a>

    <div class="hstack gap-2" slot="right">
      {#if theme.installedBy !== "SYSTEM"}
        <button
          aria-label="Uninstall Theme"
          class="btn btn-link text-danger"
          type="button"
          on:click={onRemoveClick}
          title="Temayı Kaldır"
          class:disabled={removing}>
          <i class="fas fa-trash"></i>
        </button>
      {/if}
      {#if theme.verifyStatus !== "UNKNOWN"}
        <a
          href={`${PANO_WEBSITE_URL}/themes/${theme.id}`}
          target="_blank"
          class="btn btn-outline-primary">
          <i class="fas fa-store me-2"></i>
          Mağazada Göster
        </a>
      {/if}
      {#if !theme.active}
        <button class="btn btn-secondary" on:click={activate} disabled="{activating}">
          Kullan{#if activating}<i class="fas fa-spinner fa-spin ms-2"></i>{/if}
        </button>
      {/if}
    </div>
  </PageActions>

  <div class="card">
    <div class="card-body">
        <div class="row g-3">
      <div class="col-lg-6">
        <div
          id="themeCarousel"
          class="carousel slide rounded overflow-hidden"
          data-bs-ride="carousel">
          <div class="carousel-inner">
            {#each theme.screenshots.length === 0 ? ['screenshot.png'] : theme.screenshots as src, i}
              <div class={"carousel-item" + (i === 0 ? " active" : "")}>
                <img
                  src={`/api/panel/themes/${theme.id}/screenshots/${src}`}
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

      <div class="col-lg-6">
        <div class="d-flex flex-column h-100 justify-content-between">
          <!-- Title & Status -->
          <div>
            <div class="d-flex justify-content-between align-items-start">
              <h2>{theme.title}</h2>
              {#if theme.active}
                <span class="badge text-bg-secondary">Kullanılan Tema</span>
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
                {theme.id}</span>
            </div>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Sürüm:</strong>
              <span class="user-select-all font-monospace">{theme.version}</span>
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Geliştirici:</strong>
              <a target="_blank" href="{PANO_WEBSITE_URL}/users/{theme.author}"
                >{theme.author}
                <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
              </a>
            </li>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Lisans:</strong>
              {theme.license}
            </div>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Kaynak:</strong>
              <a class="overflow-auto text-nowrap" href="{theme.sourceUrl ? theme.sourceUrl : false}" target="_blank">
                {theme.sourceUrl || "Unknown"}
                <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
              </a>
            </div>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Hash:</strong>
              <code class="overflow-auto text-nowrap user-select-all">{theme.hash}</code>
            </div>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Installed:</strong>
              <Date time="{theme.createdAt}" relativeFormat="{true}" />
            </div>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Updated:</strong>
              <Date time="{theme.updatedAt}" relativeFormat="{true}" />
            </div>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Installed By:</strong>
              {theme.installedBy}
            </div>
            <div
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Size:</strong>
              {formatBytes(theme.size)}
            </div>
          </ul>
        </div>
      </div>
    </div>
    </div>
  </div>
</div>

<ConfirmRemoveThemeModal/>

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

    const themeId = event.params.themeId;

    const body = await ApiUtil.get({
      path: `/api/panel/themes/${themeId}`,
      request: event,
    });

    if (body.error === "NOT_FOUND") {
      throw error(404, body.error);
    }

    return { theme: body.data };
  }
</script>

<script>
  import { getContext } from "svelte";

  import { goto, invalidate } from "$app/navigation";
  import { base } from "$app/paths";

  import { formatBytes } from "$lib/string.util";
  import { PANO_WEBSITE_URL } from "$lib/variables.js";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import PageActions from "$lib/component/PageActions.svelte";
  import Date from "$lib/component/Date.svelte";
  import ConfirmRemoveThemeModal,  {
    show as showRemoveModal,
  } from "$lib/component/modals/ConfirmRemoveThemeModal.svelte";

  const pageTitle = getContext("pageTitle");

  export let data;
  let theme;

  $: {
    theme = data.theme;
  }

  let activating, removing;

  pageTitle.set("Tema Detayı");

  function onRemoveClick() {
    showRemoveModal(theme.active, async () => {
      removing = true;

      const activateResponse = await ApiUtil.delete({path: `/api/panel/themes/${theme.id}`})

      if (activateResponse.result !== "ok") {
        location.reload()
        return;
      }

      await goto(base + "/view")

      await showToast('components.toasts.removed-theme-success');

      removing = false;
    })
  }

  async function activate() {
    activating = true;

    const activateResponse = await ApiUtil.put({path: `/api/panel/themes/${theme.id}`})

    if (activateResponse.result !== "ok") {
      location.reload()
      return;
    }

    await invalidate((_) => true)

    await showToast('components.toasts.activate-theme-success');

    activating = false;
  }
</script>
