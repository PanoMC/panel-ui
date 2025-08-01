<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <a slot="left" href="{base}/view" class="btn btn-link">
      <i class="fas fa-arrow-left me-2"></i> {$_('buttons.themes')}
    </a>

    <div class="hstack gap-2" slot="right">
      {#if theme.installedBy !== "SYSTEM"}
        <button
          aria-label="{$_('buttons.remove')}"
          class="btn btn-link text-danger"
          type="button"
          on:click={onRemoveClick}
          title="{$_('buttons.remove')}"
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
          {$_('buttons.show-in-store')}
        </a>
      {/if}
      {#if !theme.active}
        <button class="btn btn-secondary" on:click={activate} disabled="{activating}">
          {$_('buttons.activate')}{#if activating}<i class="fas fa-spinner fa-spin ms-2"></i>{/if}
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
                  alt={$_('pages.theme-detail.screenshot') + ` ${i + 1}`} />
              </div>
            {/each}
          </div>
          {#if theme.screenshots.length > 1}
            <button
              class="carousel-control-prev"
              type="button"
              data-bs-target="#themeCarousel"
              data-bs-slide="prev"
              aria-label="{$_('buttons.previous')}">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button
              class="carousel-control-next"
              type="button"
              data-bs-target="#themeCarousel"
              data-bs-slide="next"
              aria-label="{$_('buttons.next')}">
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
              <h2>{theme.title}<VerifiedStatus status={theme.verifyStatus} /></h2>
              {#if theme.active}
                <span class="badge text-bg-secondary">{$_('pages.theme-detail.in-use')}</span>
              {/if}
            </div>
            <p class="text-muted">{theme.description}</p>
          </div>

          <!-- Metadata -->
          <ul class="list-group">
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>ID:</strong>
              <span class="font-monospace user-select-all">
                {theme.id}</span>
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.version')}:</strong>
              <span class="user-select-all font-monospace">{theme.version}</span>
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.developer')}:</strong>
              <a target="_blank" href="{PANO_WEBSITE_URL}/users/{theme.author}"
                >{theme.author}
                <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
              </a>
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.license')}:</strong>
              {theme.license || $_('pages.theme-detail.unknown')}
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.source')}:</strong>
              <a class="overflow-auto text-nowrap" href="{theme.sourceUrl ? theme.sourceUrl : null}" target="_blank">
                {theme.sourceUrl || $_('pages.theme-detail.unknown')}
                <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
              </a>
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>Hash:</strong>
              <code class="overflow-auto text-nowrap user-select-all">{theme.hash}</code>
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.installed-at')}:</strong>
              <Date time="{theme.createdAt}" relativeFormat="{true}" />
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.updated-at')}:</strong>
              <Date time="{theme.updatedAt}" relativeFormat="{true}" />
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.installed-by')}:</strong>
              {$_('pages.theme-detail.installed-by-types.' + theme.installedBy)}
            </li>
            <li
              class="list-group-item d-flex justify-content-between align-items-center">
              <strong>{$_('pages.theme-detail.size')}:</strong>
              {formatBytes(theme.size)}
            </li>
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
  import { _ } from "svelte-i18n";

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
  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";

  const pageTitle = getContext("pageTitle");

  export let data;
  let theme;

  $: {
    theme = data.theme;
  }

  let activating, removing;

  pageTitle.set("pages.theme-detail.title");

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
